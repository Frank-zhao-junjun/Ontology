'use client';

import { useCopilotAction, useCopilotAdditionalInstructions } from '@copilotkit/react-core';
import type { ModuleDraftSuggestion } from '@/lib/ai-draft';
import { runAnalyzeDocumentAndModel } from '@/lib/copilot/actions/analyze-document-and-model';
import {
  runCreateCapability,
  runCreateEpcProcess,
  runCreateScenario,
} from '@/lib/copilot/actions/create-chain-nodes';
import { runCreateValueDomain } from '@/lib/copilot/actions/create-value-domain';
import { runGenerateElementsFromText } from '@/lib/copilot/actions/generate-elements-from-text';
import { runGenerateEpcStepsFromText } from '@/lib/copilot/actions/generate-epc-steps-from-text';
import { runGetElementLibrarySummary } from '@/lib/copilot/actions/get-element-library-summary';
import { runGetModuleDetail } from '@/lib/copilot/actions/get-module-detail';
import { runGetProjectSummary } from '@/lib/copilot/actions/get-project-summary';
import { runGetReferenceDocuments } from '@/lib/copilot/actions/get-reference-documents';
import { runGetSelectedNode } from '@/lib/copilot/actions/get-selected-node';
import { runUpdateModuleDraft } from '@/lib/copilot/actions/update-module-draft';
import { runUploadReferenceDocument } from '@/lib/copilot/actions/upload-reference-document';
import type { ModuleTargetKind } from '@/lib/copilot/resolve-module-target';
import { COPILOT_SYSTEM_PROMPT } from '@/components/ontology/copilot/copilot-system-prompt';
import { useOntologyStore } from '@/store/ontology-store';

function requireProject() {
  const project = useOntologyStore.getState().project;
  if (!project) {
    throw new Error('No project loaded');
  }
  return project;
}

function jsonResult(value: unknown): string {
  return JSON.stringify(value);
}

export function ModelingCopilotActions() {
  useCopilotAdditionalInstructions({ instructions: COPILOT_SYSTEM_PROMPT });

  useCopilotAction({
    name: 'getProjectSummary',
    description: '获取当前项目 A/B/C/EPC/要素库摘要',
    handler: async () => {
      const project = useOntologyStore.getState().project;
      if (!project) return jsonResult({ error: 'No project loaded' });
      return runGetProjectSummary(project);
    },
  });

  useCopilotAction({
    name: 'getModuleDetail',
    description: '按 kind(A/B/C/EPC)+id 返回模块 draft/confirmed 快照与状态',
    parameters: [
      { name: 'kind', type: 'string', description: '模块类型：A、B、C 或 EPC', required: true },
      { name: 'id', type: 'string', description: '模块 ID', required: true },
    ],
    handler: async ({ kind, id }: { kind: string; id: string }) => {
      const project = requireProject();
      return runGetModuleDetail(project, { kind: kind as ModuleTargetKind, id });
    },
  });

  useCopilotAction({
    name: 'getElementLibrarySummary',
    description: '获取 E1~E8 要素库计数与最近要素名',
    handler: async () => runGetElementLibrarySummary(requireProject()),
  });

  useCopilotAction({
    name: 'getReferenceDocuments',
    description: '获取已上传参考文档列表与摘要',
    handler: async () => runGetReferenceDocuments(requireProject()),
  });

  useCopilotAction({
    name: 'getSelectedNode',
    description: '获取当前选中的业务链节点 selectedBusinessChainNode',
    handler: async () => {
      const state = useOntologyStore.getState();
      return runGetSelectedNode(state.project, state.selectedBusinessChainNode);
    },
  });

  useCopilotAction({
    name: 'createValueDomain',
    description: '新建价值域 A（draft）',
    parameters: [
      { name: 'name', type: 'string', description: '价值域中文名', required: true },
      { name: 'nameEn', type: 'string', description: '英文名', required: false },
      { name: 'description', type: 'string', description: '描述', required: false },
    ],
    handler: async ({
      name,
      nameEn,
      description,
    }: {
      name: string;
      nameEn?: string;
      description?: string;
    }) => jsonResult(runCreateValueDomain(useOntologyStore.getState(), { name, nameEn, description })),
  });

  useCopilotAction({
    name: 'createCapability',
    description: '在指定价值域下新建能力 B（draft）',
    parameters: [
      { name: 'parentAId', type: 'string', description: '父价值域 ID', required: true },
      { name: 'name', type: 'string', description: '能力中文名', required: true },
      { name: 'nameEn', type: 'string', description: '英文名', required: false },
      { name: 'description', type: 'string', description: '描述', required: false },
    ],
    handler: async ({
      parentAId,
      name,
      nameEn,
      description,
    }: {
      parentAId: string;
      name: string;
      nameEn?: string;
      description?: string;
    }) =>
      jsonResult(
        runCreateCapability(useOntologyStore.getState(), parentAId, { name, nameEn, description }),
      ),
  });

  useCopilotAction({
    name: 'createScenario',
    description: '在指定能力下新建场景 C（draft）',
    parameters: [
      { name: 'parentBId', type: 'string', description: '父能力 ID', required: true },
      { name: 'name', type: 'string', description: '场景中文名', required: true },
      { name: 'nameEn', type: 'string', description: '英文名', required: false },
      { name: 'description', type: 'string', description: '描述', required: false },
    ],
    handler: async ({
      parentBId,
      name,
      nameEn,
      description,
    }: {
      parentBId: string;
      name: string;
      nameEn?: string;
      description?: string;
    }) =>
      jsonResult(
        runCreateScenario(useOntologyStore.getState(), parentBId, { name, nameEn, description }),
      ),
  });

  useCopilotAction({
    name: 'createEpcProcess',
    description: '在指定场景下新建空 EPC 流程壳（draft）',
    parameters: [
      { name: 'parentCId', type: 'string', description: '父场景 ID', required: true },
      { name: 'name', type: 'string', description: 'EPC 中文名', required: true },
      { name: 'nameEn', type: 'string', description: '英文名', required: false },
      { name: 'description', type: 'string', description: '描述', required: false },
    ],
    handler: async ({
      parentCId,
      name,
      nameEn,
      description,
    }: {
      parentCId: string;
      name: string;
      nameEn?: string;
      description?: string;
    }) =>
      jsonResult(
        runCreateEpcProcess(useOntologyStore.getState(), parentCId, { name, nameEn, description }),
      ),
  });

  useCopilotAction({
    name: 'updateModuleDraft',
    description: '更新 A/B/C/EPC 模块 draft（confirmed 模块会先 fork）',
    parameters: [
      { name: 'name', type: 'string', description: '模块名称（用于匹配）', required: true },
      { name: 'kind', type: 'string', description: '模块类型：A、B、C 或 EPC', required: true },
      { name: 'userText', type: 'string', description: '用户原始意图文本', required: true },
      {
        name: 'updates',
        type: 'object',
        description: '更新字段：name/nameEn/description/semantics/steps',
        required: true,
      },
    ],
    handler: async ({
      name,
      kind,
      userText,
      updates,
    }: {
      name: string;
      kind: string;
      userText: string;
      updates: ModuleDraftSuggestion;
    }) =>
      jsonResult(
        runUpdateModuleDraft(useOntologyStore.getState(), {
          name,
          kind: kind as ModuleTargetKind,
          userText,
          updates,
        }),
      ),
  });

  useCopilotAction({
    name: 'generateEpcStepsFromText',
    description: '从文本生成 EPC 步骤并写入 draft',
    parameters: [
      { name: 'epcId', type: 'string', description: 'EPC 模块 ID', required: true },
      { name: 'text', type: 'string', description: '流程描述文本', required: true },
      { name: 'userHint', type: 'string', description: '额外提示', required: false },
    ],
    handler: async ({
      epcId,
      text,
      userHint,
    }: {
      epcId: string;
      text: string;
      userHint?: string;
    }) =>
      jsonResult(
        await runGenerateEpcStepsFromText(useOntologyStore.getState(), { epcId, text, userHint }),
      ),
  });

  useCopilotAction({
    name: 'generateElementsFromText',
    description: '从文本生成 E1~E8 要素并写入 draft',
    parameters: [
      { name: 'documentText', type: 'string', description: '文档或描述文本', required: true },
    ],
    handler: async ({ documentText }: { documentText: string }) =>
      jsonResult(
        await runGenerateElementsFromText(useOntologyStore.getState(), { documentText }),
      ),
  });

  useCopilotAction({
    name: 'uploadReferenceDocument',
    description: '上传参考文档并持久化到项目（需提供 fileName + documentText，由客户端构造文本文件）',
    parameters: [
      { name: 'fileName', type: 'string', description: '文件名（含扩展名）', required: true },
      { name: 'documentText', type: 'string', description: '文档纯文本内容', required: true },
    ],
    handler: async ({ fileName, documentText }: { fileName: string; documentText: string }) =>
      jsonResult(
        await runUploadReferenceDocument(useOntologyStore.getState(), {
          file: new File([documentText], fileName, { type: 'text/plain' }),
        }),
      ),
  });

  useCopilotAction({
    name: 'analyzeDocumentAndModel',
    description: '整文档推断：上传（可选）→ 分析 → 批量写入 draft',
    parameters: [
      { name: 'documentText', type: 'string', description: '文档纯文本', required: true },
    ],
    handler: async ({ documentText }: { documentText: string }) =>
      jsonResult(
        await runAnalyzeDocumentAndModel(useOntologyStore.getState(), { documentText }),
      ),
  });

  return null;
}
