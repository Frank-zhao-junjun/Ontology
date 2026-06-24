import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ElementFields = Record<string, any>;
// Types
// ===================================================================

export type ElementDimension = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';

export interface ElementDraftSuggestion {
  name: string;
  nameEn?: string;
  description: string;
  dimension: ElementDimension;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>;
}

export interface ElementDocPromptContext {
  domain: string;
  existingElementNames: string[];
}

export interface ElementDocPrompt {
  system: string;
  user: string;
}

export interface ElementDocParseResult {
  elements: ElementDraftSuggestion[];
}

// ===================================================================
// ElementDocParseError
// ===================================================================

export class ElementDocParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ElementDocParseError';
  }
}

// ===================================================================
// Zod schemas
// ===================================================================

const ElementDimensionSchema = z.union([
  z.literal('E1'), z.literal('E2'), z.literal('E3'), z.literal('E4'),
  z.literal('E5'), z.literal('E6'), z.literal('E7'), z.literal('E8'),
]);

const ElementDraftSchema = z.object({
  name: z.string().min(1, '要素名称不能为空'),
  nameEn: z.string().optional(),
  description: z.string().min(1, '要素描述不能为空'),
  dimension: ElementDimensionSchema,
  fields: z.record(z.string(), z.any()).default({}),
});

const ElementDocOutputSchema = z.object({
  elements: z.array(ElementDraftSchema).min(1, '至少需要 1 个要素'),
});

// ===================================================================
// Dimension definitions
// ===================================================================

const DIMENSION_DEFINITIONS: Record<ElementDimension, { title: string; structure: string[] }> = {
  E1: {
    title: '数据模型（Entity / Attribute / Relation / 主数据）',
    structure: [
      'Entity：实体名称、属性列表、主键标识、关联关系',
      'Attribute：字段名、数据类型、长度/精度、是否必填、默认值',
      'Relation：关联实体、关联类型（1:1 / 1:N / N:M）、外键字段',
      '主数据：数据源、更新频率、分发范围',
    ],
  },
  E2: {
    title: '行为模型（StateMachine / Action / Transition）',
    structure: [
      'StateMachine：所属实体、状态集合、初始状态',
      'Action：动作名称、触发条件、前置校验、执行逻辑',
      'Transition：源状态、目标状态、触发动作、守卫条件',
    ],
  },
  E3: {
    title: '事件模型（EventDefinition / Subscription）',
    structure: [
      'EventDefinition：事件名称、事件类型、负载结构、生产者',
      'Subscription：订阅者、过滤条件、回调方式（同步/异步）',
    ],
  },
  E4: {
    title: '规则模型（字段 / 跨字段 / 跨实体 / 聚合 / 时序校验）',
    structure: [
      '字段规则：单字段值域、格式、唯一性校验',
      '跨字段规则：字段间逻辑约束（如结束日期 >= 开始日期）',
      '跨实体规则：跨实体数据一致性校验',
      '聚合规则：汇总值、计数、平均值的上下界约束',
      '时序规则：按时间序列的连续性、顺序性校验',
    ],
  },
  E5: {
    title: '岗位角色（Department / Position / Role）',
    structure: [
      'Department：部门名称、层级关系、负责人',
      'Position：岗位名称、所属部门、职级、编制数',
      'Role：角色名称、权限范围、关联岗位列表',
    ],
  },
  E6: {
    title: '指标模型（BusinessMetric）',
    structure: [
      'BusinessMetric：指标名称、计算公式、聚合粒度、统计周期、目标值/阈值',
    ],
  },
  E7: {
    title: '约束模型（guard condition / transaction boundary / compensation）',
    structure: [
      'Guard Condition：前置条件表达式、生效时机',
      'Transaction Boundary：事务范围、隔离级别、超时设置',
      'Compensation：补偿动作、回滚条件、幂等策略',
    ],
  },
  E8: {
    title: '接口模型（DataSource / Integration / Webhook）',
    structure: [
      'DataSource：数据源类型（DB / API / File）、连接配置、认证方式',
      'Integration：集成方式、协议（REST / gRPC / MQ）、请求/响应映射',
      'Webhook：URL、触发事件、重试策略、签名校验',
    ],
  },
};

// ===================================================================
// Prompt template
// ===================================================================

const SYSTEM_PROMPT_TEMPLATE = `你是一个业务建模要素提取助手。你的任务是根据用户提供的业务文档，提取并生成业务要素（Meta Element），并将每个要素归入 E1~E8 八维建模维度。

## 建模规则
1. 每个要素必须包含：name（要素名称）、description（要素描述）、dimension（所属维度）、fields（维度相关字段）
2. 可选字段：nameEn（英文名称）
3. fields 的内容必须符合该维度的产出结构要求
4. 不要提取与已存在要素名称重复的要素{failHint}
5. 要素名称应简洁、语义明确，优先使用中文
6. 输出必须是严格的 JSON，不要包含 markdown 代码块标记或任何额外文字

## 业务领域
{domain}

## 已存在要素名称（请避免重复）
{existingNames}

## 八维定义与产出结构

### E1 — 数据模型
定义：{e1Def}
产出结构：
{e1Structure}

### E2 — 行为模型
定义：{e2Def}
产出结构：
{e2Structure}

### E3 — 事件模型
定义：{e3Def}
产出结构：
{e3Structure}

### E4 — 规则模型
定义：{e4Def}
产出结构：
{e4Structure}

### E5 — 岗位角色
定义：{e5Def}
产出结构：
{e5Structure}

### E6 — 指标模型
定义：{e6Def}
产出结构：
{e6Structure}

### E7 — 约束模型
定义：{e7Def}
产出结构：
{e7Structure}

### E8 — 接口模型
定义：{e8Def}
产出结构：
{e8Structure}

## 输出 JSON Schema
{jsonSchema}`;

function buildDimensionSection(dim: ElementDimension): { def: string; structure: string } {
  const info = DIMENSION_DEFINITIONS[dim];
  return {
    def: info.title,
    structure: info.structure.map((line) => `  - ${line}`).join('\n'),
  };
}

function buildExistingNamesHint(names: string[]): string {
  if (!names || names.length === 0) {
    return '';
  }
  return '。已存在要素名称: ' + names.join('、');
}

function buildExistingNamesBlock(names: string[]): string {
  if (!names || names.length === 0) {
    return '（暂无已存在要素）';
  }
  return names.map((n) => `- ${n}`).join('\n');
}

function buildJsonSchema(): string {
  return `{
  "elements": [
    {
      "name": "要素名称",
      "nameEn": "ElementName",
      "description": "要素描述",
      "dimension": "E1|E2|E3|E4|E5|E6|E7|E8",
      "fields": {
        // 根据 dimension 对应的产出结构填充
      }
    }
  ]
}`;
}

// ===================================================================
// Public API
// ===================================================================

/**
 * 构建要素文档→要素 Prompt
 *
 * @param docText - 用户提供的原始业务文档文本
 * @param context - 上下文信息（业务领域、已有要素名称列表）
 * @returns { system, user } 二元组
 */
export function buildElementDocPrompt(
  docText: string,
  context: ElementDocPromptContext,
): ElementDocPrompt {
  const s1 = buildDimensionSection('E1');
  const s2 = buildDimensionSection('E2');
  const s3 = buildDimensionSection('E3');
  const s4 = buildDimensionSection('E4');
  const s5 = buildDimensionSection('E5');
  const s6 = buildDimensionSection('E6');
  const s7 = buildDimensionSection('E7');
  const s8 = buildDimensionSection('E8');

  const jsonSchema = buildJsonSchema();
  const existingNamesHint = buildExistingNamesHint(context.existingElementNames);
  const existingNamesBlock = buildExistingNamesBlock(context.existingElementNames);

  const system = SYSTEM_PROMPT_TEMPLATE
    .replace('{domain}', context.domain || '(未指定)')
    .replace('{existingNames}', existingNamesBlock)
    .replace('{failHint}', existingNamesHint)
    .replace('{e1Def}', s1.def)
    .replace('{e1Structure}', s1.structure)
    .replace('{e2Def}', s2.def)
    .replace('{e2Structure}', s2.structure)
    .replace('{e3Def}', s3.def)
    .replace('{e3Structure}', s3.structure)
    .replace('{e4Def}', s4.def)
    .replace('{e4Structure}', s4.structure)
    .replace('{e5Def}', s5.def)
    .replace('{e5Structure}', s5.structure)
    .replace('{e6Def}', s6.def)
    .replace('{e6Structure}', s6.structure)
    .replace('{e7Def}', s7.def)
    .replace('{e7Structure}', s7.structure)
    .replace('{e8Def}', s8.def)
    .replace('{e8Structure}', s8.structure)
    .replace('{jsonSchema}', jsonSchema);

  return {
    system,
    user: docText,
  };
}

/**
 * 解析 LLM 输出，返回建议要素列表
 *
 * @param llmOutput - LLM 原始输出文本（应为 JSON）
 * @returns { elements: ElementDraftSuggestion[] }
 * @throws {ElementDocParseError} 当 JSON 解析失败或 schema 校验不通过时
 */
export function parseElementDrafts(llmOutput: string): ElementDocParseResult {
  if (!llmOutput || typeof llmOutput !== 'string' || !llmOutput.trim()) {
    throw new ElementDocParseError('LLM 输出为空');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(llmOutput);
  } catch (err) {
    throw new ElementDocParseError('LLM 输出不是合法 JSON', err);
  }

  const result = ElementDocOutputSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `[${issue.path.join('.')}] ${issue.message}`)
      .join('; ');
    throw new ElementDocParseError(`Schema 校验失败: ${issues}`, result.error);
  }

  return { elements: result.data.elements as ElementDraftSuggestion[] };
}
