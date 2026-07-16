/**
 * MCP Tools: ontology_project_export
 *
 * Exports an Ontology project as JSON, YAML, Excel, Markdown, or Skill ZIP.
 * Project data is fetched from the remote API if only projectId is provided.
 * Binary formats (Excel, Skill ZIP) return metadata; text formats return content.
 */

import { z } from 'zod';
import type { OntologyProject } from '@/types/ontology';
import { projectStore } from '../store/project-store.js';
import { errorResponse, successResponse } from '../utils/helpers.js';
import type { ToolDefinition, ToolHandler } from '../index.js';

// ----- Schemas -----

const ExportFormatSchema = z.enum(['json', 'yaml', 'excel', 'md', 'skill']);
const ExportScopeSchema = z.enum(['all', 'data', 'behavior', 'rule', 'process', 'event']);

const ExportProjectSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  format: ExportFormatSchema.optional().default('json'),
  scope: ExportScopeSchema.optional().default('all'),
  includeExamples: z.boolean().optional().default(true),
  includeSemanticLayer: z.boolean().optional().default(true),
});

// ----- Helpers -----

function getApiBase(): string {
  const envBase = process.env.ONTOLOGY_API_BASE;
  if (envBase) return envBase.replace(/\/$/, '');
  const port = process.env.DEPLOY_RUN_PORT || '5000';
  return `http://localhost:${port}`;
}

async function fetchProject(projectId: string): Promise<unknown> {
  const stored = await projectStore.get(projectId);
  if (!stored) throw new Error(`Project not found: ${projectId}`);
  return stored.data;
}

async function compileManifestFromProject(project: unknown): Promise<unknown> {
  const { compileManifest } = await import('@/lib/manifest-compiler/index');
  return compileManifest(project as OntologyProject);
}

// ----- Tool definitions -----

export const exportToolDefinitions: ToolDefinition[] = [
  {
    name: 'ontology_project_export',
    description:
      '导出 Ontology 项目为 JSON / YAML / Excel / Markdown / Skill ZIP。' +
      '其中 Excel 与 Skill ZIP 返回下载元数据，文本格式直接返回内容。',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        format: {
          type: 'string',
          enum: ['json', 'yaml', 'excel', 'md', 'skill'],
          description: '导出格式，默认 json',
        },
        scope: {
          type: 'string',
          enum: ['all', 'data', 'behavior', 'rule', 'process', 'event'],
          description: '导出范围，默认 all',
        },
        includeExamples: { type: 'boolean', description: '是否包含示例数据，默认 true' },
        includeSemanticLayer: { type: 'boolean', description: '是否包含语义层，默认 true' },
      },
      required: ['projectId'],
    },
  },
];

// ----- Tool handlers -----

export const exportToolHandlers: Record<string, ToolHandler> = {
  ontology_project_export: async (args: Record<string, unknown>) => {
    try {
      const { projectId, format, scope, includeExamples, includeSemanticLayer } =
        ExportProjectSchema.parse(args);

      const base = getApiBase();
      const project = await fetchProject(projectId);

      // Markdown: render locally
      if (format === 'md') {
        const { buildOntologyJson } = await import('@/lib/skill-export/build-ontology-json');
        const { renderOntologyMarkdown } = await import('@/lib/skill-export/markdown-renderer');
        const onto = buildOntologyJson(project as OntologyProject, {
          scope,
          includeSemanticLayer,
          exportedAt: new Date().toISOString(),
          version: (project as { version?: string }).version || '1.0.0',
        });
        return {
          content: [
            {
              type: 'text',
              text: successResponse({ format: 'md', content: renderOntologyMarkdown(onto) }),
            },
          ],
        };
      }

      // Skill ZIP: call POST /api/export/skill
      if (format === 'skill') {
        const res = await fetch(`${base}/api/export/skill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project, scope, includeExamples, includeSemanticLayer }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Skill export failed: HTTP ${res.status} ${errText}`);
        }
        const buf = await res.arrayBuffer();
        const filename =
          res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
          'ontology-model-skill.zip';
        const projectStatus = res.headers.get('X-Project-Status') || 'unknown';
        return {
          content: [
            {
              type: 'text',
              text: successResponse({
                format: 'skill',
                filename,
                size: buf.byteLength,
                projectStatus,
                downloadUrl: `${base}/api/export/skill`,
                note: 'Use downloadUrl with POST and the same params to download the ZIP.',
              }),
            },
          ],
        };
      }

      // JSON / YAML / Excel need a compiled manifest
      const manifest = await compileManifestFromProject(project);

      if (format === 'json') {
        return {
          content: [
            {
              type: 'text',
              text: successResponse({
                format: 'json',
                content: JSON.stringify(manifest, null, 2),
              }),
            },
          ],
        };
      }

      if (format === 'yaml') {
        const { stringify } = await import('yaml');
        return {
          content: [
            {
              type: 'text',
              text: successResponse({
                format: 'yaml',
                content: stringify(manifest, { lineWidth: 0 }),
              }),
            },
          ],
        };
      }

      // Excel
      const res = await fetch(`${base}/api/export/xlsx-from-manifest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Excel export failed: HTTP ${res.status} ${errText}`);
      }
      const buf = await res.arrayBuffer();
      return {
        content: [
          {
            type: 'text',
            text: successResponse({
              format: 'excel',
              size: buf.byteLength,
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              downloadUrl: `${base}/api/export/xlsx-from-manifest`,
              note: 'Use downloadUrl with POST and the same compiled manifest to download the XLSX.',
            }),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },
};
