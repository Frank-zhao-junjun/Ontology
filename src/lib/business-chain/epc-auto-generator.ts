import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { OntologyProject } from '@/types/ontology';
import {
  buildEpcMetamodelPrompt,
  parseEpcMetamodelResponse,
  EpcMetamodelParseError,
} from '@/lib/ai-draft/epc-metamodel-prompt';
import { applyEpcMetamodelDrafts } from '@/lib/business-chain/epc-metamodel-applier';

export interface EpcAutoGenerateOptions {
  model?: string;
  temperature?: number;
  headers?: Headers;
}

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

export async function generateAndApplyEpcMetamodels(
  project: OntologyProject,
  epcId: string,
  options: EpcAutoGenerateOptions = {},
): Promise<OntologyProject> {
  const epc = findEpcById(project, epcId);
  if (!epc) {
    throw new Error(`EPC 流程 ${epcId} 不存在`);
  }

  const existingElements = buildExistingElementSummary(project);
  const prompt = buildEpcMetamodelPrompt({
    epcName: epc.name,
    epcDescription: epc.description ?? '',
    epcNameEn: epc.nameEn ?? '',
    domainName: project.domain?.name ?? '',
    projectName: project.name ?? '',
    existingElements,
  });

  const config = new Config();
  const customHeaders = options.headers ? HeaderUtils.extractForwardHeaders(options.headers) : undefined;
  const client = new LLMClient(config, customHeaders);
  const model = options.model ?? process.env.GENERATE_MODEL ?? process.env.CHAT_MODEL ?? 'doubao-seed-2-0-pro-260215';

  const messages = [
    { role: 'system' as const, content: prompt.system },
    { role: 'user' as const, content: prompt.user },
  ];

  const stream = client.stream(messages, {
    model,
    temperature: options.temperature ?? 0.3,
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
