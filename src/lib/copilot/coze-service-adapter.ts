import type {
  CopilotRuntimeChatCompletionRequest,
  CopilotRuntimeChatCompletionResponse,
  CopilotServiceAdapter,
} from '@copilotkit/runtime';
import { Config, LLMClient } from 'coze-coding-dev-sdk';
import type { Message as CozeMessage } from 'coze-coding-dev-sdk';

function randomId(): string {
  return globalThis.crypto.randomUUID();
}

/** 与 generate-module-draft 等 API 保持一致 */
export const COZE_COPILOT_MODEL = 'doubao-seed-2-0-pro-260215';

export interface CozeServiceAdapterOptions {
  model?: string;
  temperature?: number;
  customHeaders?: Record<string, string>;
}

type CopilotTextMessage = {
  isTextMessage(): boolean;
  isActionExecutionMessage(): boolean;
  isResultMessage(): boolean;
  role: string;
  content: string;
  name?: string;
  arguments?: Record<string, unknown>;
  actionExecutionId?: string;
  result?: string;
};

function mapRole(role: string): CozeMessage['role'] {
  if (role === 'system' || role === 'developer') return 'system';
  if (role === 'assistant') return 'assistant';
  return 'user';
}

export function copilotMessagesToCoze(
  messages: CopilotTextMessage[],
): CozeMessage[] {
  const result: CozeMessage[] = [];
  for (const message of messages) {
    if (message.isTextMessage()) {
      result.push({
        role: mapRole(message.role),
        content: message.content,
      });
      continue;
    }
    if (message.isActionExecutionMessage()) {
      result.push({
        role: 'assistant',
        content: `[ToolCall ${message.name}(${JSON.stringify(message.arguments ?? {})})]`,
      });
      continue;
    }
    if (message.isResultMessage()) {
      result.push({
        role: 'user',
        content: `[Tool result ${message.actionExecutionId}]: ${message.result ?? ''}`,
      });
    }
  }
  return result;
}

export function appendToolCatalog(
  messages: CozeMessage[],
  actions: Array<{ name: string; description: string }>,
): CozeMessage[] {
  if (actions.length === 0) return messages;

  const catalog = actions
    .map((action) => `- ${action.name}: ${action.description}`)
    .join('\n');
  const appendix =
    `\n\n可用 Copilot Actions（需要执行写入/查询时，请调用对应 Action）：\n${catalog}`;

  const next = [...messages];
  const systemIndex = next.findIndex((m) => m.role === 'system');
  if (systemIndex >= 0) {
    const existing = next[systemIndex];
    next[systemIndex] = {
      role: 'system',
      content: `${existing.content}${appendix}`,
    };
    return next;
  }

  return [{ role: 'system', content: appendix.trim() }, ...next];
}

/**
 * CopilotKit ServiceAdapter：豆包 LLM 经 coze-coding-dev-sdk 路由，不依赖外网 CopilotKit API。
 */
export class CozeServiceAdapter implements CopilotServiceAdapter {
  readonly provider = 'coze';
  readonly model: string;
  private readonly temperature: number;
  private readonly customHeaders?: Record<string, string>;

  constructor(options?: CozeServiceAdapterOptions) {
    this.model = options?.model ?? COZE_COPILOT_MODEL;
    this.temperature = options?.temperature ?? 0.5;
    this.customHeaders = options?.customHeaders;
  }

  get name() {
    return 'CozeServiceAdapter';
  }

  async process(
    request: CopilotRuntimeChatCompletionRequest,
  ): Promise<CopilotRuntimeChatCompletionResponse> {
    const {
      messages,
      actions,
      eventSource,
      threadId: threadIdFromRequest,
      forwardedParameters,
    } = request;
    const threadId = threadIdFromRequest ?? randomId();
    const client = new LLMClient(new Config(), this.customHeaders);

    const cozeMessages = appendToolCatalog(
      copilotMessagesToCoze(messages as unknown as CopilotTextMessage[]),
      actions.map((action) => ({
        name: action.name,
        description: action.description,
      })),
    );

    const stream = client.stream(cozeMessages, {
      model: forwardedParameters?.model ?? this.model,
      temperature: forwardedParameters?.temperature ?? this.temperature,
    });

    eventSource.stream(async (eventStream$) => {
      const currentMessageId = randomId();
      eventStream$.sendTextMessageStart({ messageId: currentMessageId });
      try {
        for await (const chunk of stream) {
          const content = chunk.content?.toString() ?? '';
          if (content) {
            eventStream$.sendTextMessageContent({
              messageId: currentMessageId,
              content,
            });
          }
        }
        eventStream$.sendTextMessageEnd({ messageId: currentMessageId });
      } catch (error) {
        console.error('[CozeServiceAdapter] stream error:', error);
        throw error;
      }
      eventStream$.complete();
    });

    return { threadId };
  }
}

export function createCozeServiceAdapter(
  options?: CozeServiceAdapterOptions,
): CozeServiceAdapter {
  return new CozeServiceAdapter(options);
}
