import { generateId } from '@/lib/id';

// AI 生成的元模型草案不强制与 TypeScript 类型 1:1 对应，
// 由调用方（Store / API）在应用时做最终校验与适配。
export interface EpcMetamodelDrafts {
  reasoning: string;
  reusedRefs: {
    modelType: string;
    elementId: string;
    name: string;
    reason?: string;
  }[];
  drafts: {
    entities: Record<string, unknown>[];
    attributes: Record<string, unknown>[];
    relations: Record<string, unknown>[];
    stateMachines: Record<string, unknown>[];
    rules: Record<string, unknown>[];
    eventDefinitions: Record<string, unknown>[];
    departments: Record<string, unknown>[];
    positions: Record<string, unknown>[];
    metrics: Record<string, unknown>[];
    constraints: Record<string, unknown>[];
    dataSources: Record<string, unknown>[];
  };
}

export class EpcMetamodelParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'EpcMetamodelParseError';
  }
}

export interface EpcStepInfo {
  name: string;
  dimension?: string;
  elementName?: string;
}

export interface EpcGenerationContext {
  epcName: string;
  epcDescription: string;
  epcNameEn?: string;
  domainName?: string;
  projectName?: string;
  existingElements?: {
    id: string;
    modelType: string;
    name: string;
    description?: string;
  }[];
  /** EPC 确认后传入的步骤信息，AI 从中提取元数据生成更精准的 8 维元模型 */
  epcSteps?: EpcStepInfo[];
}

export function buildEpcMetamodelPrompt(ctx: EpcGenerationContext): { system: string; user: string } {
  const existingSummary = (ctx.existingElements ?? []).length
    ? ctx.existingElements!.map(e => `- [${e.modelType}] ${e.name} (${e.id})`).join('\n')
    : '（无）';

  const hasSteps = (ctx.epcSteps ?? []).length > 0;

  const stepsSection = hasSteps
    ? `\n## EPC 流程步骤（已确认）\n\n以下是从 EPC 流程中提取的步骤信息，请从中分析业务语义，提取实体、行为、规则、事件、组织、指标、约束、数据源等元数据：\n\n${ctx.epcSteps!.map((s, i) => `${i + 1}. ${s.name}${s.dimension ? ` [维度: ${s.dimension}]` : ''}${s.elementName ? ` → 关联元素: ${s.elementName}` : ''}`).join('\n')}\n`
    : '';

  const system = `你是一位企业架构与本体建模专家。请根据用户提供的 EPC（事件驱动流程链）业务流程信息${hasSteps ? '及已确认的流程步骤' : ''}，自动生成与之配套的 8 个元模型草案。

约束与要求：
1. 必须覆盖全部 8 个元模型：E1 数据、E2 行为、E3 规则、E4 事件、E5 组织、E6 指标、E7 约束、E8 数据源。
2. 如果某个元模型与已存在的元素语义相同，请在 reusedRefs 中引用已有元素，不要重复生成。
3. 每个元模型至少生成 1 个元素。${hasSteps ? '\n4. 请从 EPC 步骤中提取业务语义，确保生成的元模型与流程步骤一一对应：步骤中出现的名词→实体(E1)、动词→行为/事件(E2/E4)、条件→规则(E3)、角色→组织(E5)、度量→指标(E6)、限制→约束(E7)、外部交互→数据源(E8)。' : ''}
${hasSteps ? '5.' : '4.'} 只返回合法的 JSON，不要 Markdown 解释、不要代码块标记。
${hasSteps ? '6.' : '5.'} 字段名使用英文，值为中文业务语义。`;

  const user = `## EPC 流程信息

- 名称：${ctx.epcName}
- 英文名：${ctx.epcNameEn || ''}
- 描述：${ctx.epcDescription || ''}
- 领域：${ctx.domainName || '未指定'}
- 项目：${ctx.projectName || '未指定'}
${stepsSection}
## 已存在的可复用元素

${existingSummary}

## 需要生成的 8 个元模型

1. E1 数据模型（data）：核心实体、属性、实体间关系
2. E2 行为模型（behavior）：状态机、状态、状态转换
3. E3 规则模型（rule）：校验规则、业务规则
4. E4 事件模型（event）：事件定义
5. E5 组织模型（organization）：部门、岗位
6. E6 指标模型（metric）：业务指标
7. E7 约束模型（boundary）：业务约束、边界约束
8. E8 数据源/接口模型（dataSource）：数据源、接口

## 输出 JSON 结构

{
  "reasoning": "生成思路的简短说明",
  "reusedRefs": [
    { "modelType": "data|behavior|rule|event|organization|metric|boundary|dataSource", "elementId": "现有元素id", "name": "现有元素名", "reason": "复用原因" }
  ],
  "drafts": {
    "entities": [{ "name": "", "nameEn": "", "description": "", "entityRole": "aggregate_root|entity|value_object" }],
    "attributes": [{ "name": "", "nameEn": "", "description": "", "dataType": "string|text|integer|decimal|boolean|date|datetime|enum|reference", "required": false }],
    "relations": [{ "name": "", "description": "", "sourceEntityId": "", "targetEntityId": "", "type": "one_to_one|one_to_many|many_to_many" }],
    "stateMachines": [{ "name": "", "description": "", "entityId": "", "stateField": "status", "states": [{ "name": "", "isInitial": true, "isFinal": false }], "transitions": [{ "from": "", "to": "", "event": "", "trigger": "manual|automatic|scheduled" }] }],
    "rules": [{ "name": "", "description": "", "type": "field_validation|cross_field|cross_entity|aggregation|temporal", "severity": "error|warning|info", "entityId": "", "condition": "", "message": "" }],
    "eventDefinitions": [{ "name": "", "description": "", "entityId": "", "trigger": "before_create|after_create|before_update|after_update|before_delete|after_delete|on_status_change" }],
    "departments": [{ "name": "", "nameEn": "", "description": "", "type": "headquarters|division|department|team|group" }],
    "positions": [{ "name": "", "nameEn": "", "description": "", "departmentId": "", "responsibilities": [] }],
    "metrics": [{ "name": "", "nameEn": "", "description": "", "formula": "", "unit": "" }],
    "constraints": [{ "name": "", "description": "", "type": "business", "severity": "error|warning|info", "condition": "", "message": "" }],
    "dataSources": [{ "name": "", "nameEn": "", "description": "", "type": "api|database|file|message_queue|custom", "endpoint": "", "protocol": "" }]
  }
}`;

  return { system, user };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function normalizeRawObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function normalizeArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeRawObject);
  }
  return [];
}

export function parseEpcMetamodelResponse(raw: string): EpcMetamodelDrafts {
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new EpcMetamodelParseError('无法从 AI 响应中解析出 JSON');
  }

  const data = parsed as Record<string, unknown>;
  const drafts = normalizeRawObject(data.drafts);

  const reusedRefs = normalizeArray(data.reusedRefs).map(r => ({
    modelType: String(r.modelType ?? ''),
    elementId: String(r.elementId ?? ''),
    name: String(r.name ?? ''),
    reason: r.reason ? String(r.reason) : undefined,
  }));

  return {
    reasoning: typeof data.reasoning === 'string' ? data.reasoning : '',
    reusedRefs,
    drafts: {
      entities: normalizeArray(drafts.entities),
      attributes: normalizeArray(drafts.attributes),
      relations: normalizeArray(drafts.relations),
      stateMachines: normalizeArray(drafts.stateMachines),
      rules: normalizeArray(drafts.rules),
      eventDefinitions: normalizeArray(drafts.eventDefinitions),
      departments: normalizeArray(drafts.departments),
      positions: normalizeArray(drafts.positions),
      metrics: normalizeArray(drafts.metrics),
      constraints: normalizeArray(drafts.constraints),
      dataSources: normalizeArray(drafts.dataSources),
    },
  };
}

// 工具函数：把 LLM 原始对象补充为可用的模型元素，
// 调用方可以按需继续转换。
export function withDefaults(raw: Record<string, unknown>, overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: raw.id ?? generateId(),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    status: raw.status ?? 'draft',
    ...raw,
    ...overrides,
  };
}
