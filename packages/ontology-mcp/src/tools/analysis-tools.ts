/**
 * MCP Tools: ontology_manifest_compile, ontology_lint_epc, ontology_coverage_report
 *
 * Wraps @ontology/core queries and manifest compiler.
 * Uses lazy dynamic imports to resolve tsconfig path aliases at runtime.
 */

import { z } from 'zod';
import { projectStore } from '../store/project-store.js';
import { errorResponse, successResponse } from '../utils/helpers.js';
import type { ToolDefinition, ToolHandler } from '../index.js';
import type { Scenario } from '@/types/ontology';
import type { EpcCoverageReport } from '@/lib/epc-coverage';

// ----- Schemas -----

const ProjectIdOnlySchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
});

const CompileManifestSchema = z.object({
  projectId: z.string().min(1),
  version: z.string().optional().describe('覆盖版本号（可选）'),
  compiledBy: z.string().optional().describe('编译者（可选）'),
});

// ----- Tool definitions -----

export const analysisToolDefinitions: ToolDefinition[] = [
  {
    name: 'ontology_manifest_compile',
    description: '将 Ontology 项目编译为平台交接契约 OntologyManifest',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        version: { type: 'string', description: '覆盖版本号（可选）' },
        compiledBy: { type: 'string', description: '编译者（可选）' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'ontology_lint_epc',
    description: '对项目中所有 EPC 流程执行 Lint 检查，返回警告列表',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '项目ID' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'ontology_coverage_report',
    description: '计算项目中所有场景的 EPC 覆盖率报告',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '项目ID' },
      },
      required: ['projectId'],
    },
  },
];

// ----- Handlers -----

export const analysisToolHandlers: Record<string, ToolHandler> = {
  ontology_manifest_compile: async (args: Record<string, unknown>) => {
    try {
      const { projectId, version, compiledBy } = CompileManifestSchema.parse(args);
      const stored = projectStore.get(projectId);
      if (!stored) throw new Error(`项目不存在: ${projectId}`);

      const compiler = await import('@/lib/manifest-compiler/index');
      const options: Record<string, unknown> = {};
      if (version) options.version = version;
      if (compiledBy) options.compiledBy = compiledBy;

      const manifest = compiler.compileManifest(
        stored.data,
        Object.keys(options).length > 0 ? options : undefined,
      );

      return { content: [{ type: 'text', text: successResponse(manifest) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },

  ontology_lint_epc: async (args: Record<string, unknown>) => {
    try {
      const { projectId } = ProjectIdOnlySchema.parse(args);
      const core = await import('@ontology/core');
      const stored = projectStore.get(projectId);
      if (!stored) throw new Error(`项目不存在: ${projectId}`);

      const warnings = core.getBusinessEpcWarnings(stored.data);
      return {
        content: [{ type: 'text', text: successResponse({ total: warnings.length, warnings }) }],
      };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },

  ontology_coverage_report: async (args: Record<string, unknown>) => {
    try {
      const { projectId } = ProjectIdOnlySchema.parse(args);
      const core = await import('@ontology/core');
      const stored = projectStore.get(projectId);
      if (!stored) throw new Error(`项目不存在: ${projectId}`);

      const project = stored.data;
      const scenarios = project.scenarios ?? [];
      const coverages = scenarios.map((s: Scenario) => ({
        scenarioId: s.id,
        scenarioName: s.name,
        coverage: core.getEpcCoverage(project, s.id),
      }));

      const totalScenarios = scenarios.length;
      const coveredScenarios = coverages.filter(
        (c: { coverage: EpcCoverageReport }) => c.coverage && c.coverage.totalElements > 0 && c.coverage.coveragePercent > 0,
      ).length;

      return {
        content: [
          {
            type: 'text',
            text: successResponse({
              summary: {
                totalScenarios,
                coveredScenarios,
                coverageRate:
                  totalScenarios > 0
                    ? Math.round((coveredScenarios / totalScenarios) * 10000) / 100
                    : 0,
              },
              details: coverages,
            }),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },
};
