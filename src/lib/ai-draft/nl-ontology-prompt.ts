import { z } from 'zod';
import type { MetaDimension } from '@/types/ontology';

export interface NlOntologyPromptInput {
  query: string;
  projectSummary: string; // 项目要素摘要（实体列表 + 关系列表，见 build-project-summary.ts）
}

// LLM 可能返回 0-100 的百分数置信度，统一归一到 0-1
const confidenceSchema = z.preprocess(
  (value) => (typeof value === 'number' && value > 1 ? value / 100 : value),
  z.number().min(0).max(1),
);

const dimensionSchema = z.enum(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8']);

const matchedEntitySchema = z.object({
  elementId: z.string(),
  elementName: z.string(),
  dimension: dimensionSchema,
  confidence: confidenceSchema,
  explanation: z.string(),
});

const matchedPropertySchema = z.object({
  entityId: z.string(),
  attributeId: z.string(),
  attributeName: z.string(),
  confidence: confidenceSchema,
});

const matchedRelationSchema = z.object({
  sourceEntityId: z.string(),
  targetEntityId: z.string(),
  relationName: z.string(),
  type: z.string(),
  confidence: confidenceSchema,
});

export const nlOntologyResultSchema = z.object({
  matchedEntities: z.array(matchedEntitySchema).default([]),
  matchedProperties: z.array(matchedPropertySchema).default([]),
  matchedRelations: z.array(matchedRelationSchema).default([]),
});

export interface NlOntologyResult {
  matchedEntities: Array<{
    elementId: string;
    elementName: string;
    dimension: MetaDimension;
    confidence: number; // 0-1
    explanation: string;
  }>;
  matchedProperties: Array<{
    entityId: string;
    attributeId: string;
    attributeName: string;
    confidence: number;
  }>;
  matchedRelations: Array<{
    sourceEntityId: string;
    targetEntityId: string;
    relationName: string;
    type: string;
    confidence: number;
  }>;
}

export class NlOntologyParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NlOntologyParseError';
  }
}

/**
 * 构建 NL → Ontology 语义匹配 prompt。
 * 设计原则：LLM 只做语义匹配（NL → 本体元素 ID），不做创造性内容。
 */
export function buildNlOntologyPrompt(input: NlOntologyPromptInput): { system: string; user: string } {
  const system = `你是一位企业本体语义匹配专家。用户提供一段自然语言查询和项目本体的要素摘要，你的任务是把查询中提到的业务概念精确匹配到本体中的已有要素。

约束与要求：
1. 只做语义匹配，禁止创造摘要中不存在的要素；所有 ID 必须原样引用摘要中的 ID。
2. dimension 取值：E1 数据 / E2 行为 / E3 规则 / E4 事件 / E5 组织 / E6 指标 / E7 约束 / E8 接口。
3. confidence 为 0-1 之间的小数，表示匹配置信度；不确定的匹配给低分而不是猜测。
4. explanation 用一句话说明匹配理由。
5. 只返回合法的 JSON，不要 Markdown 解释、不要代码块标记。

返回 JSON 结构：
{
  "matchedEntities": [{ "elementId": "...", "elementName": "...", "dimension": "E1", "confidence": 0.95, "explanation": "..." }],
  "matchedProperties": [{ "entityId": "...", "attributeId": "...", "attributeName": "...", "confidence": 0.9 }],
  "matchedRelations": [{ "sourceEntityId": "...", "targetEntityId": "...", "relationName": "...", "type": "one_to_many", "confidence": 0.85 }]
}`;

  const user = `## 项目本体要素摘要

${input.projectSummary}

## 用户查询

${input.query}

请返回匹配结果 JSON。`;

  return { system, user };
}

/** 解析 LLM 返回的 JSON 文本为 NlOntologyResult，schema 校验失败时抛 NlOntologyParseError */
export function parseNlOntologyResult(jsonContent: string): NlOntologyResult {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonContent);
  } catch (err) {
    throw new NlOntologyParseError('NL 语义匹配结果不是合法 JSON', err);
  }

  const parsed = nlOntologyResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new NlOntologyParseError(
      `NL 语义匹配结果格式不符合要求: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
      parsed.error,
    );
  }
  return parsed.data;
}
