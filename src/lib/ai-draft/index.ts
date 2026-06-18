import { getBusinessChainDisplayPath, type BusinessChainNodeKind } from '@/lib/business-chain/tree';
import { getLatestConfirmed } from '@/lib/module-version';
import type {
  BusinessNodeBase,
  EpcProcess,
  EpcStep,
  MetaElement,
  ModuleKind,
  ModuleVersionRecord,
  OntologyProject,
  SemanticsBlock,
} from '@/types/ontology';

export type ConfirmedElementCatalogItem = {
  id: string;
  name: string;
  dimension: ModuleKind;
  version: string;
};

export type ModuleDraftContext = {
  moduleKind: BusinessChainNodeKind;
  moduleId: string;
  chainPath: string;
  confirmedElements: ConfirmedElementCatalogItem[];
  currentSnapshot: unknown;
};

export type ModuleDraftPrompt = {
  system: string;
  user: string;
};

export type ModuleDraftSuggestion = {
  name?: string;
  nameEn?: string;
  description?: string;
  semantics?: SemanticsBlock;
  steps?: EpcStep[];
};

type ProjectSlice = Pick<
  OntologyProject,
  'valueDomains' | 'capabilities' | 'scenarios' | 'epcProcesses' | 'metaElements' | 'moduleVersionRecords'
>;

function businessChainSlices(project: ProjectSlice) {
  return {
    valueDomains: project.valueDomains,
    capabilities: project.capabilities,
    scenarios: project.scenarios,
    epcProcesses: project.epcProcesses,
  };
}

function findCurrentSnapshot(
  project: ProjectSlice,
  kind: BusinessChainNodeKind,
  moduleId: string,
): unknown {
  if (kind === 'A') return project.valueDomains?.find((item) => item.id === moduleId);
  if (kind === 'B') return project.capabilities?.find((item) => item.id === moduleId);
  if (kind === 'C') return project.scenarios?.find((item) => item.id === moduleId);
  return project.epcProcesses?.find((item) => item.id === moduleId);
}

export function listConfirmedMetaElements(
  records: ModuleVersionRecord[],
  metaElements: MetaElement[] | undefined,
): ConfirmedElementCatalogItem[] {
  const items: ConfirmedElementCatalogItem[] = [];
  for (const element of metaElements ?? []) {
    const confirmed = getLatestConfirmed(records, element.dimension, element.id);
    if (!confirmed?.version) continue;
    const snapshot = confirmed.snapshot as MetaElement;
    items.push({
      id: element.id,
      name: snapshot.name ?? element.name,
      dimension: element.dimension,
      version: confirmed.version,
    });
  }
  return items.sort((a, b) => a.dimension.localeCompare(b.dimension) || a.name.localeCompare(b.name, 'zh-CN'));
}

export function buildModuleDraftContext(
  project: ProjectSlice,
  moduleKind: BusinessChainNodeKind,
  moduleId: string,
): ModuleDraftContext {
  const records = project.moduleVersionRecords ?? [];
  const chainPath = getBusinessChainDisplayPath(businessChainSlices(project), moduleKind, moduleId);
  return {
    moduleKind,
    moduleId,
    chainPath,
    confirmedElements: listConfirmedMetaElements(records, project.metaElements),
    currentSnapshot: findCurrentSnapshot(project, moduleKind, moduleId) ?? { id: moduleId },
  };
}

export function buildModuleDraftPrompt(
  context: ModuleDraftContext,
  moduleKind: BusinessChainNodeKind,
  userHint?: string,
): ModuleDraftPrompt {
  const catalogLines = context.confirmedElements
    .map((item) => `- [${item.dimension}] ${item.name} (${item.id}, ${item.version})`)
    .join('\n');

  const system = `你是本体简化架构的业务建模助手。你只能输出严格 JSON，不要 markdown。
规则：
1. 仅填充当前模块 draft 字段，禁止修改 id、parentId
2. EPC steps 的 elementRef.elementId 必须来自已确认要素目录；versionPin 固定为 "latest_confirmed"
3. 不要输出 confirm/archived 相关字段

输出 JSON 字段（按需）：
- name, nameEn, description
- semantics: { terms?, triggerPhrases?, synonyms? }
- steps（仅 EPC）: [{ id, name, elementRef?: { dimension, elementId, versionPin: "latest_confirmed" } }]`;

  const user = `## 业务链路径
${context.chainPath || '(根节点)'}

## 模块类型
${moduleKind}

## 当前 draft 快照
${JSON.stringify(context.currentSnapshot, null, 2)}

## 已确认要素目录（EPC 步骤仅可引用下列 id）
${catalogLines || '(暂无已确认要素)'}

${userHint?.trim() ? `## 用户补充说明\n${userHint.trim()}` : ''}

请生成改进后的 JSON 建议。`;

  return { system, user };
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readSemantics(value: unknown): SemanticsBlock | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as SemanticsBlock;
  return {
    terms: Array.isArray(raw.terms) ? raw.terms.filter((item) => typeof item === 'string') : undefined,
    triggerPhrases: Array.isArray(raw.triggerPhrases)
      ? raw.triggerPhrases.filter((item) => typeof item === 'string')
      : undefined,
    synonyms: Array.isArray(raw.synonyms) ? raw.synonyms.filter((item) => typeof item === 'string') : undefined,
  };
}

function parseEpcSteps(raw: unknown, confirmedIds: string[]): EpcStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`steps[${index}] 格式无效`);
    }
    const step = item as EpcStep;
    const id = readString(step.id) ?? `step-${index + 1}`;
    const name = readString(step.name) ?? `步骤${index + 1}`;
    const ref = step.elementRef;
    if (!ref) {
      return { id, name };
    }
    const elementId = readString(ref.elementId);
    if (!elementId || !confirmedIds.includes(elementId)) {
      throw new Error(`steps[${index}].elementRef.elementId 不在已确认要素目录中`);
    }
    return {
      id,
      name,
      elementRef: {
        dimension: ref.dimension,
        elementId,
        versionPin: 'latest_confirmed',
      },
    };
  });
}

export function parseModuleDraftResponse(
  raw: unknown,
  moduleKind: BusinessChainNodeKind,
  confirmedElementIds: string[],
): ModuleDraftSuggestion {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI 响应必须是 JSON 对象');
  }
  const payload = raw as Record<string, unknown>;
  const suggestion: ModuleDraftSuggestion = {
    name: readString(payload.name),
    nameEn: readString(payload.nameEn),
    description: readString(payload.description),
    semantics: readSemantics(payload.semantics),
  };
  if (moduleKind === 'EPC' && payload.steps !== undefined) {
    suggestion.steps = parseEpcSteps(payload.steps, confirmedElementIds);
  }
  return suggestion;
}

export function mergeAiDraftSuggestion<T extends BusinessNodeBase | EpcProcess>(
  current: T,
  suggestion: ModuleDraftSuggestion,
  moduleKind: BusinessChainNodeKind,
): T {
  const merged: BusinessNodeBase = {
    ...current,
    ...(suggestion.name ? { name: suggestion.name } : {}),
    ...(suggestion.nameEn ? { nameEn: suggestion.nameEn } : {}),
    ...(suggestion.description !== undefined ? { description: suggestion.description } : {}),
    ...(suggestion.semantics ? { semantics: suggestion.semantics } : {}),
  };
  if (moduleKind === 'EPC') {
    const epc = current as EpcProcess;
    return {
      ...epc,
      ...merged,
      ...(suggestion.steps ? { steps: suggestion.steps } : {}),
    } as T;
  }
  return merged as T;
}

export function getConfirmedElementIds(context: ModuleDraftContext): string[] {
  return context.confirmedElements.map((item) => item.id);
}
