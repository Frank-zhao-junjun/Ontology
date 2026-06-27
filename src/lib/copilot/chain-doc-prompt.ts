import { z } from 'zod';

export interface ChainNodeInput {
  name: string;
  nameEn?: string;
  description?: string;
}

export interface ChainScenarioNode extends ChainNodeInput {
  epcProcesses?: ChainNodeInput[];
}

export interface ChainCapabilityNode extends ChainNodeInput {
  scenarios?: ChainScenarioNode[];
}

export interface ChainValueDomainNode extends ChainNodeInput {
  capabilities?: ChainCapabilityNode[];
}

export interface ChainDocParseResult {
  valueDomains: ChainValueDomainNode[];
}

export interface ChainDocPromptContext {
  domain: string;
  existingValueDomainNames: string[];
}

export interface ChainDocPrompt {
  system: string;
  user: string;
}

export class ChainDocParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ChainDocParseError';
  }
}

const ChainNodeSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
});

const ChainScenarioSchema = ChainNodeSchema.extend({
  epcProcesses: z.array(ChainNodeSchema).optional(),
});

const ChainCapabilitySchema = ChainNodeSchema.extend({
  scenarios: z.array(ChainScenarioSchema).optional(),
});

const ChainValueDomainSchema = ChainNodeSchema.extend({
  capabilities: z.array(ChainCapabilitySchema).optional(),
});

const ChainDocOutputSchema = z.object({
  valueDomains: z.array(ChainValueDomainSchema).min(1, '至少需要 1 个价值域'),
});

function buildJsonSchema(): string {
  return `{
  "valueDomains": [
    {
      "name": "价值域名称",
      "nameEn": "ValueDomainEn",
      "description": "价值域描述",
      "capabilities": [
        {
          "name": "能力名称",
          "description": "能力描述",
          "scenarios": [
            {
              "name": "场景名称",
              "description": "场景描述",
              "epcProcesses": [
                { "name": "EPC流程名称", "description": "流程描述" }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;
}

const SYSTEM_PROMPT_TEMPLATE = `你是一个业务链（A/B/C/EPC）建模助手。根据用户文档推断价值域(A)、能力(B)、场景(C)、EPC流程骨架。

## 业务领域
{domain}

## 已有价值域（避免重复命名）
{existingNames}

## 输出规则
1. 仅输出严格 JSON，不要 markdown 代码块
2. 层级：valueDomains → capabilities → scenarios → epcProcesses
3. 名称简洁、符合制造业/企业业务语境
4. 若文档未明确 EPC，可为场景省略 epcProcesses 或留空数组

## 输出 JSON Schema
{jsonSchema}`;

export function buildChainDocPrompt(
  docText: string,
  context: ChainDocPromptContext,
): ChainDocPrompt {
  const existingNames =
    context.existingValueDomainNames.length > 0
      ? context.existingValueDomainNames.map((n) => `- ${n}`).join('\n')
      : '(暂无)';

  const system = SYSTEM_PROMPT_TEMPLATE.replace('{domain}', context.domain || '(未指定)')
    .replace('{existingNames}', existingNames)
    .replace('{jsonSchema}', buildJsonSchema());

  return { system, user: docText };
}

export function parseChainDoc(llmOutput: string): ChainDocParseResult {
  if (!llmOutput?.trim()) {
    throw new ChainDocParseError('LLM 输出为空');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(llmOutput);
  } catch (err) {
    throw new ChainDocParseError('LLM 输出不是合法 JSON', err);
  }

  const result = ChainDocOutputSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `[${issue.path.join('.')}] ${issue.message}`)
      .join('; ');
    throw new ChainDocParseError(`Schema 校验失败: ${issues}`, result.error);
  }

  return { valueDomains: result.data.valueDomains as ChainValueDomainNode[] };
}
