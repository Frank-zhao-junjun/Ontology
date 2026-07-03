/**
 * MCP Tools: ontology_business_chain_add / update / delete
 *
 * Wraps @ontology/core business-chain.ts CRUD pure functions.
 * Uses lazy dynamic imports to resolve tsconfig path aliases at runtime.
 * Project data is persisted via the remote API (HTTP-backed ProjectStore).
 */

import { z } from 'zod';
import { projectStore } from '../store/project-store.js';
import { errorResponse, successResponse, NodeKindSchema } from '../utils/helpers.js';
import type { ToolDefinition, ToolHandler } from '../index.js';
import type { OntologyProject, ValueDomain, Capability, Scenario, EpcProcess } from '@/types/ontology';

// ----- Schemas -----

const AddNodeSchema = z.object({
  projectId: z.string().min(1),
  kind: NodeKindSchema.describe('节点类型: A=价值域, B=能力, C=场景, EPC=流程'),
  parentId: z.string().optional().describe('父节点ID (B依赖A, C依赖B, EPC依赖C)'),
  name: z.string().min(1, '名称不能为空'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  autoGenerateMetamodels: z.boolean().optional().describe('EPC节点专用: 创建时自动生成8个元模型草案'),
});

const UpdateNodeSchema = z.object({
  projectId: z.string().min(1),
  kind: NodeKindSchema,
  nodeId: z.string().min(1),
  name: z.string().optional(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
});

const DeleteNodeSchema = z.object({
  projectId: z.string().min(1),
  kind: NodeKindSchema,
  nodeId: z.string().min(1),
});

// ----- Tool definitions -----

export const chainToolDefinitions: ToolDefinition[] = [
  {
    name: 'ontology_business_chain_add',
    description: '向业务链添加节点（A=业务价值域, B=业务能力, C=业务场景, EPC=业务流程）',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        kind: { type: 'string', enum: ['A', 'B', 'C', 'EPC'], description: '节点类型' },
        parentId: { type: 'string', description: '父节点ID（B需要parentA，C需要parentB，EPC需要parentC）' },
        name: { type: 'string', description: '节点名称' },
        nameEn: { type: 'string', description: '英文名称（可选）' },
        description: { type: 'string', description: '描述（可选）' },
      },
      required: ['projectId', 'kind', 'name'],
    },
  },
  {
    name: 'ontology_business_chain_update',
    description: '更新业务链节点的名称/描述等属性',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        kind: { type: 'string', enum: ['A', 'B', 'C', 'EPC'], description: '节点类型' },
        nodeId: { type: 'string', description: '节点ID' },
        name: { type: 'string', description: '新名称（可选）' },
        nameEn: { type: 'string', description: '新英文名称（可选）' },
        description: { type: 'string', description: '新描述（可选）' },
      },
      required: ['projectId', 'kind', 'nodeId'],
    },
  },
  {
    name: 'ontology_business_chain_delete',
    description: '删除业务链节点（有子节点时禁止删除）',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '项目ID' },
        kind: { type: 'string', enum: ['A', 'B', 'C', 'EPC'], description: '节点类型' },
        nodeId: { type: 'string', description: '节点ID' },
      },
      required: ['projectId', 'kind', 'nodeId'],
    },
  },
];

// ----- Helpers -----

async function getProjectOrThrow(projectId: string) {
  const stored = await projectStore.get(projectId);
  if (!stored) throw new Error(`项目不存在: ${projectId}`);
  return stored;
}

async function saveProject(projectId: string, updatedProject: OntologyProject) {
  const stored = await projectStore.get(projectId);
  if (!stored) throw new Error(`项目不存在: ${projectId}`);
  stored.data = updatedProject;
  stored.updatedAt = updatedProject.updatedAt ?? new Date().toISOString();
  await projectStore.set(stored);
}

// ----- Handlers -----

export const chainToolHandlers: Record<string, ToolHandler> = {
  ontology_business_chain_add: async (args: Record<string, unknown>) => {
    try {
      const { projectId, kind, parentId, name, nameEn, description, autoGenerateMetamodels } = AddNodeSchema.parse(args);
      const core = await import('@ontology/core');
      const stored = await getProjectOrThrow(projectId);
      const project = stored.data;
      const input = { name, nameEn, description, autoGenerateMetamodels };

      let result:
        | { project: OntologyProject; node: ValueDomain }
        | { project: OntologyProject; node: Capability }
        | { project: OntologyProject; node: Scenario }
        | { project: OntologyProject; node: EpcProcess };

      switch (kind) {
        case 'A':
          result = core.addValueDomain(project, input);
          break;
        case 'B': {
          if (!parentId) throw new Error('B类型需要 parentId（父级价值域ID）');
          result = core.addCapability(project, parentId, input);
          break;
        }
        case 'C': {
          if (!parentId) throw new Error('C类型需要 parentId（父级能力ID）');
          result = core.addScenario(project, parentId, input);
          break;
        }
        case 'EPC': {
          if (!parentId) throw new Error('EPC类型需要 parentId（父级场景ID）');
          result = core.addEpcProcess(project, parentId, input);
          const epcResult = result as { project: OntologyProject; node: EpcProcess };
          if (autoGenerateMetamodels) {
            const autoProject = await projectStore.autoGenerateEpcMetamodels(epcResult.project, epcResult.node.id);
            await saveProject(projectId, autoProject);
            const autoEpc = autoProject.businessChain?.epcProcesses?.find((n: EpcProcess) => n.id === epcResult.node.id);
            return { content: [{ type: 'text', text: successResponse({ node: autoEpc || epcResult.node, generatedRefs: autoEpc?.generatedRefs }) }] };
          }
          break;
        }
        default:
          throw new Error(`不支持的节点类型: ${kind}`);
      }

      await saveProject(projectId, result.project);
      return { content: [{ type: 'text', text: successResponse({ node: result.node }) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },

  ontology_business_chain_update: async (args: Record<string, unknown>) => {
    try {
      const { projectId, kind, nodeId, name, nameEn, description } = UpdateNodeSchema.parse(args);
      const core = await import('@ontology/core');
      const stored = await getProjectOrThrow(projectId);
      const project = stored.data;
      const updates: Record<string, string> = {};
      if (name !== undefined) updates.name = name;
      if (nameEn !== undefined) updates.nameEn = nameEn;
      if (description !== undefined) updates.description = description;

      let updatedProject: OntologyProject;
      switch (kind) {
        case 'A':
          updatedProject = core.updateValueDomain(project, nodeId, updates);
          break;
        case 'B':
          updatedProject = core.updateCapability(project, nodeId, updates);
          break;
        case 'C':
          updatedProject = core.updateScenario(project, nodeId, updates);
          break;
        case 'EPC':
          updatedProject = core.updateEpcProcess(project, nodeId, updates);
          break;
        default:
          throw new Error(`不支持的节点类型: ${kind}`);
      }

      await saveProject(projectId, updatedProject);
      return { content: [{ type: 'text', text: successResponse({ updated: true }) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },

  ontology_business_chain_delete: async (args: Record<string, unknown>) => {
    try {
      const { projectId, kind, nodeId } = DeleteNodeSchema.parse(args);
      const core = await import('@ontology/core');
      const stored = await getProjectOrThrow(projectId);
      const project = stored.data;

      let updatedProject: OntologyProject;
      switch (kind) {
        case 'A':
          updatedProject = core.deleteValueDomain(project, nodeId);
          break;
        case 'B':
          updatedProject = core.deleteCapability(project, nodeId);
          break;
        case 'C':
          updatedProject = core.deleteScenario(project, nodeId);
          break;
        case 'EPC':
          updatedProject = core.deleteEpcProcess(project, nodeId);
          break;
        default:
          throw new Error(`不支持的节点类型: ${kind}`);
      }

      await saveProject(projectId, updatedProject);
      return { content: [{ type: 'text', text: successResponse({ deleted: true }) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: errorResponse(err) }] };
    }
  },
};
