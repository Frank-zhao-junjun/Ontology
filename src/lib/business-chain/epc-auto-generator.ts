import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { OntologyProject, MetaElement } from '@/types/ontology';
import {
  buildEpcMetamodelPrompt,
  parseEpcMetamodelResponse,
  EpcMetamodelParseError,
  type EpcStepInfo,
} from '@/lib/ai-draft/epc-metamodel-prompt';
import { applyEpcMetamodelDrafts } from '@/lib/business-chain/epc-metamodel-applier';

export interface EpcAutoGenerateOptions {
  model?: string;
  temperature?: number;
  headers?: Headers;
}

/** 触发模式：creation = 创建时（仅名称/描述），confirm = 确认后（含步骤内容） */
export type EpcGenerateTrigger = 'creation' | 'confirm';

function findEpcById(project: OntologyProject, epcId: string) {
  return (project.epcProcesses ?? []).find((epc) => epc.id === epcId);
}

function buildExistingElementSummary(project: OntologyProject) {
  const elements: { id: string; modelType: string; name: string; description?: string }[] = [];

  (project.dataModel?.entities ?? []).forEach((e) =>
    elements.push({ id: e.id, modelType: 'data', name: e.name, description: e.description }),
  );
  (project.behaviorModel?.stateMachines ?? []).forEach((s) =>
    elements.push({ id: s.id, modelType: 'behavior', name: s.name }),
  );
  (project.ruleModel?.rules ?? []).forEach((r) =>
    elements.push({ id: r.id, modelType: 'rule', name: r.name, description: r.description }),
  );
  (project.eventModel?.events ?? []).forEach((e) =>
    elements.push({ id: e.id, modelType: 'event', name: e.name, description: e.description }),
  );
  (project.organizationModel?.departments ?? []).forEach((d) =>
    elements.push({ id: d.id, modelType: 'organization', name: d.name, description: d.description }),
  );
  (project.organizationModel?.positions ?? []).forEach((p) =>
    elements.push({ id: p.id, modelType: 'organization', name: p.name }),
  );
  (project.metricsModel?.metrics ?? []).forEach((m) =>
    elements.push({ id: m.id, modelType: 'metric', name: m.name, description: m.description }),
  );
  (project.constraints ?? []).forEach((c) =>
    elements.push({ id: c.id, modelType: 'boundary', name: c.name, description: c.description }),
  );
  (project.interfaces ?? []).forEach((i) =>
    elements.push({ id: i.id, modelType: 'dataSource', name: i.name, description: i.description }),
  );

  return elements;
}

/** 从 EPC 步骤和 MetaElement 列表中提取步骤信息供 AI 分析 */
function extractStepInfos(
  epc: { steps: { id: string; name: string; elementRef?: { dimension?: string; elementId?: string; elementName?: string } }[] },
  metaElements: MetaElement[],
): EpcStepInfo[] {
  return epc.steps.map((step) => {
    const info: EpcStepInfo = { name: step.name };
    if (step.elementRef) {
      info.dimension = step.elementRef.dimension;
      info.elementName = step.elementRef.elementName;
      // 若 elementName 未缓存，从 metaElements 查找
      if (!info.elementName && step.elementRef.elementId) {
        const meta = metaElements.find((m) => m.id === step.elementRef!.elementId);
        if (meta) info.elementName = meta.name;
      }
    }
    return info;
  });
}

/**
 * 核心：生成并应用 EPC 元模型草案
 * - trigger='creation'：仅基于 EPC 名称/描述生成（创建时）
 * - trigger='confirm'：基于 EPC 已确认的步骤内容提取元数据生成（确认后）
 */
export async function generateAndApplyEpcMetamodels(
  project: OntologyProject,
  epcId: string,
  options: EpcAutoGenerateOptions & { trigger?: EpcGenerateTrigger } = {},
): Promise<OntologyProject> {
  const { trigger = 'creation', ...llmOptions } = options;
  const epc = findEpcById(project, epcId);
  if (!epc) {
    throw new Error(`EPC 流程 ${epcId} 不存在`);
  }

  const existingElements = buildExistingElementSummary(project);

  // confirm 模式：从 EPC 步骤中提取元数据
  const epcSteps = trigger === 'confirm'
    ? extractStepInfos(epc, project.metaElements ?? [])
    : undefined;

  const prompt = buildEpcMetamodelPrompt({
    epcName: epc.name,
    epcDescription: epc.description ?? '',
    epcNameEn: epc.nameEn ?? '',
    domainName: project.domain?.name ?? '',
    projectName: project.name ?? '',
    existingElements,
    epcSteps,
  });

  const config = new Config();
  const customHeaders = llmOptions.headers ? HeaderUtils.extractForwardHeaders(llmOptions.headers) : undefined;
  const client = new LLMClient(config, customHeaders);
  const model = llmOptions.model ?? process.env.GENERATE_MODEL ?? process.env.CHAT_MODEL ?? 'doubao-seed-2-0-pro-260215';

  const messages = [
    { role: 'system' as const, content: prompt.system },
    { role: 'user' as const, content: prompt.user },
  ];

  const stream = client.stream(messages, {
    model,
    temperature: llmOptions.temperature ?? 0.3,
  });

  let rawText = '';
  for await (const chunk of stream) {
    if (chunk && typeof chunk === 'object' && 'content' in chunk && chunk.content) {
      rawText += String(chunk.content);
    }
  }

  let drafts;
  try {
    drafts = parseEpcMetamodelResponse(rawText);
  } catch (error) {
    const message = error instanceof EpcMetamodelParseError ? error.message : '解析 AI 元模型草案失败';
    throw new Error(message);
  }

  const result = applyEpcMetamodelDrafts(project, epcId, drafts);
  return {
    ...result.project,
    updatedAt: new Date().toISOString(),
  };
}
