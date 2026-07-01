/**
 * MCP Tools: ontology_project_create, ontology_project_load
 *
 * Wraps @ontology/core project.ts pure functions.
 * Uses lazy dynamic imports to resolve tsconfig path aliases at runtime.
 * Project data is persisted via the remote API (HTTP-backed ProjectStore).
 */

import { z } from 'zod';
import { projectStore } from '../store/project-store.js';
import { errorResponse, successResponse } from '../utils/helpers.js';
import type { ToolDefinition, ToolHandler } from '../index.js';

// ----- Schemas -----

const CreateProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  domainId: z.string().min(1, '领域ID不能为空'),
  domainName: z.string().min(1, '领域名称不能为空'),
  description: z.string().optional(),
});

const LoadProjectSchema = z.object({
  filePath: z.string().min(1, '文件路径不能为空'),
});

// ----- Tool definitions -----

export const projectToolDefinitions: ToolDefinition[] = [
  {
    name: 'ontology_project_create',
    description: '创建一个新的空 Ontology 项目',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '项目名称' },
        domainId: { type: 'string', description: '领域ID（如 "finance"）' },
        domainName: { type: 'string', description: '领域名称（如 "财务"）' },
        description: { type: 'string', description: '项目描述（可选）' },
      },
      required: ['name', 'domainId', 'domainName'],
    },
  },
  {
    name: 'ontology_project_load',
    description: '从 JSON 文件加载 Ontology 项目到服务端',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'JSON 文件路径' },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'ontology_project_list',
    description: '列出所有已持久化的 Ontology 项目',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ----- Tool handlers (lazy import core) -----

export const projectToolHandlers: Record<string, ToolHandler> = {
  ontology_project_create: async (args: Record<string, unknown>) => {
    try {
      const { name, domainId, domainName, description } = CreateProjectSchema.parse(args);
      const { createProject } = await import('@ontology/core');
      const domain = { id: domainId, name: domainName, nameEn: '', description: '' };
      const { project } = createProject(name, domain, description);
      await projectStore.set({
        id: project.id,
        name: project.name,
        data: project,
        updatedAt: project.updatedAt,
      });
      return {
        content: [{ type: 'text', text: successResponse({ id: project.id, name: project.name }) }],
      };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },

  ontology_project_load: async (args: Record<string, unknown>) => {
    try {
      const { filePath } = LoadProjectSchema.parse(args);
      const { readFile } = await import('node:fs/promises');
      const raw = await readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);
      const core = await import('@ontology/core');
      const normalized = core.loadProject(data);
      await projectStore.set({
        id: normalized.id,
        name: normalized.name,
        data: normalized,
        updatedAt: normalized.updatedAt,
      });
      return {
        content: [
          {
            type: 'text',
            text: successResponse({
              id: normalized.id,
              name: normalized.name,
              updatedAt: normalized.updatedAt,
            }),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },

  ontology_project_list: async () => {
    try {
      const projects = await projectStore.list();
      return {
        content: [{ type: 'text', text: successResponse(projects) }],
      };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },
};
