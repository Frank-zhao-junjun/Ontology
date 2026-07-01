/**
 * MCP Resources: ontology://project/{id}/{type}
 *
 * Exposes 4 resources:
 *   - ontology://project/{id}/state       — project status summary
 *   - ontology://project/{id}/manifest    — compiled OntologyManifest
 *   - ontology://project/{id}/coverage    — EPC coverage report
 *   - ontology://project/{id}/consistency — cross-consistency issues
 */

import type { ResourceDefinition, ResourceReader } from '../index.js';
import { projectStore } from '../store/project-store.js';
import type { Scenario } from '@/types/ontology';
import type { EpcCoverageReport } from '@/lib/epc-coverage';

// ----- Resource definitions -----

export const resourceDefinitions: ResourceDefinition[] = [
  {
    uri: 'ontology://project/{projectId}/state',
    name: 'Project State',
    description: '项目状态概要（基本信息 + 节点计数）',
    mimeType: 'application/json',
  },
  {
    uri: 'ontology://project/{projectId}/manifest',
    name: 'Project Manifest',
    description: '编译后的 OntologyManifest 平台交接契约',
    mimeType: 'application/json',
  },
  {
    uri: 'ontology://project/{projectId}/coverage',
    name: 'EPC Coverage',
    description: 'EPC 覆盖率报告',
    mimeType: 'application/json',
  },
  {
    uri: 'ontology://project/{projectId}/consistency',
    name: 'Cross Consistency',
    description: '跨场景交叉一致性检查结果',
    mimeType: 'application/json',
  },
];

// ----- Helpers -----

function parseProjectUri(uri: string): { projectId: string; resourceType: string } | null {
  const match = uri.match(/^ontology:\/\/project\/([^/]+)\/(state|manifest|coverage|consistency)$/);
  if (!match) return null;
  return { projectId: match[1], resourceType: match[2] };
}

// ----- Resource readers (lazy dynamic imports) -----

export const resourceReaders: Record<string, ResourceReader> = {
  'ontology://project/{projectId}/state': async (uri: string) => {
    const parsed = parseProjectUri(uri);
    if (!parsed) throw new Error(`无效的 resource URI: ${uri}`);
    const stored = await projectStore.get(parsed.projectId);
    if (!stored) throw new Error(`项目不存在: ${parsed.projectId}`);

    const project = stored.data;
    const core = await import('@ontology/core');
    const validation = core.validateProject(project);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              id: project.id,
              name: project.name,
              description: project.description,
              domain: project.domain,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              counts: {
                valueDomains: (project.valueDomains ?? []).length,
                capabilities: (project.capabilities ?? []).length,
                scenarios: (project.scenarios ?? []).length,
                epcProcesses: (project.epcProcesses ?? []).length,
                metaElements: (project.metaElements ?? []).length,
              },
              validation,
            },
            null,
            2,
          ),
        },
      ],
    };
  },

  'ontology://project/{projectId}/manifest': async (uri: string) => {
    const parsed = parseProjectUri(uri);
    if (!parsed) throw new Error(`无效的 resource URI: ${uri}`);
    const stored = await projectStore.get(parsed.projectId);
    if (!stored) throw new Error(`项目不存在: ${parsed.projectId}`);

    const compiler = await import('@/lib/manifest-compiler/index');
    const manifest = compiler.compileManifest(stored.data);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(manifest, null, 2),
        },
      ],
    };
  },

  'ontology://project/{projectId}/coverage': async (uri: string) => {
    const parsed = parseProjectUri(uri);
    if (!parsed) throw new Error(`无效的 resource URI: ${uri}`);
    const stored = await projectStore.get(parsed.projectId);
    if (!stored) throw new Error(`项目不存在: ${parsed.projectId}`);

    const core = await import('@ontology/core');
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
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              summary: {
                totalScenarios,
                coveredScenarios,
                coverageRate:
                  totalScenarios > 0
                    ? Math.round((coveredScenarios / totalScenarios) * 10000) / 100
                    : 0,
              },
              details: coverages,
            },
            null,
            2,
          ),
        },
      ],
    };
  },

  'ontology://project/{projectId}/consistency': async (uri: string) => {
    const parsed = parseProjectUri(uri);
    if (!parsed) throw new Error(`无效的 resource URI: ${uri}`);
    const stored = await projectStore.get(parsed.projectId);
    if (!stored) throw new Error(`项目不存在: ${parsed.projectId}`);

    const core = await import('@ontology/core');
    const project = stored.data;
    const scenarios = project.scenarios ?? [];

    const allIssues: Record<string, unknown[]> = {};
    for (const s of scenarios) {
      const issues = core.getCrossConsistency(project, s.id);
      if (issues.length > 0) {
        allIssues[s.id] = issues;
      }
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              totalIssues: Object.values(allIssues).flat().length,
              affectedScenarios: Object.keys(allIssues).length,
              issues: allIssues,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
