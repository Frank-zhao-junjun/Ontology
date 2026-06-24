import { z } from 'zod';

// ===================================================================
// Types
// ===================================================================

export interface EpcStepSuggestion {
  name: string;
  description: string;
  elementRef?: { elementId: string; versionPin?: string };
}

export interface EpcDocPromptContext {
  chainPath: string;
  confirmedElements: { id: string; name: string; dimension: string; version: string }[];
}

export interface EpcDocPrompt {
  system: string;
  user: string;
}

export interface EpcDocParseResult {
  steps: EpcStepSuggestion[];
}

// ===================================================================
// EpcDocParseError
// ===================================================================

export class EpcDocParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'EpcDocParseError';
  }
}

// ===================================================================
// Zod schemas
// ===================================================================

const ElementRefSchema = z
  .object({
    elementId: z.string().min(1, 'elementId 不能为空'),
    versionPin: z.string().optional(),
  })
  .optional();

const StepSuggestionSchema = z.object({
  name: z.string().min(1, '步骤名称不能为空'),
  description: z.string().min(1, '步骤描述不能为空'),
  elementRef: ElementRefSchema,
});

const EpcDocOutputSchema = z.object({
  steps: z.array(StepSuggestionSchema).min(1, '至少需要 1 个步骤'),
});

// ===================================================================
// Prompt template
// ===================================================================

const SYSTEM_PROMPT_TEMPLATE = `你是一个 EPC 业务流程建模助手。你的任务是根据用户提供的业务文档，提取并生成业务步骤（EPC Step），每个步骤引用已确认的要素（Meta Element）。

## 建模规则
1. 每个步骤必须包含：name（步骤名称）、description（步骤描述）
2. 可选引用要素：elementRef.elementId 必须来自下方已确认要素目录
3. 不要虚构不存在的要素引用
4. 步骤顺序按照文档中描述的业务流程先后排列
5. 输出必须是严格的 JSON，不要包含 markdown 代码块标记或任何额外文字

## 业务链路径
{chainPath}

## 已确认要素目录
{catalog}

## 输出 JSON Schema
{jsonSchema}`;

function buildCatalogLines(
  confirmedElements: { id: string; name: string; dimension: string; version: string }[],
): string {
  if (!confirmedElements || confirmedElements.length === 0) {
    return '(暂无已确认要素)';
  }
  return confirmedElements
    .map((item) => `- [${item.dimension}] ${item.name} (${item.id}, ${item.version})`)
    .join('\n');
}

function buildJsonSchema(): string {
  return `{
  "steps": [
    {
      "name": "步骤名称",
      "description": "步骤描述",
      "elementRef": {
        "elementId": "已确认要素的 ID",
        "versionPin": "latest_confirmed"
      }
    }
  ]
}`;
}

// ===================================================================
// Public API
// ===================================================================

/**
 * 构建 EPC 文档→步骤 Prompt
 *
 * @param docText - 用户提供的原始业务文档文本
 * @param context - 上下文信息（链路径、已确认要素目录）
 * @returns { system, user } 二元组
 */
export function buildEpcDocPrompt(docText: string, context: EpcDocPromptContext): EpcDocPrompt {
  const catalog = buildCatalogLines(context.confirmedElements);
  const jsonSchema = buildJsonSchema();

  const system = SYSTEM_PROMPT_TEMPLATE.replace('{chainPath}', context.chainPath || '(根节点)')
    .replace('{catalog}', catalog)
    .replace('{jsonSchema}', jsonSchema);

  return {
    system,
    user: docText,
  };
}

/**
 * 解析 LLM 输出，返回建议步骤
 *
 * @param llmOutput - LLM 原始输出文本（应为 JSON）
 * @returns { steps: EpcStepSuggestion[] }
 * @throws {EpcDocParseError} 当 JSON 解析失败或 schema 校验不通过时
 */
export function parseEpcSteps(llmOutput: string): EpcDocParseResult {
  if (!llmOutput || typeof llmOutput !== 'string' || !llmOutput.trim()) {
    throw new EpcDocParseError('LLM 输出为空');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(llmOutput);
  } catch (err) {
    throw new EpcDocParseError('LLM 输出不是合法 JSON', err);
  }

  const result = EpcDocOutputSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `[${issue.path.join('.')}] ${issue.message}`)
      .join('; ');
    throw new EpcDocParseError(`Schema 校验失败: ${issues}`, result.error);
  }

  return { steps: result.data.steps as EpcStepSuggestion[] };
}
