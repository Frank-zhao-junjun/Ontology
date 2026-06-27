import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdkState = vi.hoisted(() => ({
  streamChunks: [] as Array<{ content?: string }>,
  lastMessages: null as Array<{ role: string; content: string }> | null,
}));

vi.mock('coze-coding-dev-sdk', () => {
  class MockConfig {}

  class MockLLMClient {
    constructor(_config?: unknown, _headers?: Record<string, string>) {}

    async *stream(messages: Array<{ role: string; content: string }>) {
      sdkState.lastMessages = messages;
      for (const chunk of sdkState.streamChunks) {
        yield chunk;
      }
    }
  }

  return {
    LLMClient: MockLLMClient,
    Config: MockConfig,
  };
});

import {
  COZE_COPILOT_MODEL,
  CozeServiceAdapter,
  appendToolCatalog,
  copilotMessagesToCoze,
} from '@/lib/copilot/coze-service-adapter';

describe('CozeServiceAdapter', () => {
  beforeEach(() => {
    sdkState.streamChunks = [];
    sdkState.lastMessages = null;
  });

  it('exposes coze provider and doubao model for runtime discovery', () => {
    const adapter = new CozeServiceAdapter();
    expect(adapter.provider).toBe('coze');
    expect(adapter.model).toBe(COZE_COPILOT_MODEL);
    expect(adapter.name).toBe('CozeServiceAdapter');
  });

  it('copilotMessagesToCoze maps roles and tool messages', () => {
    const coze = copilotMessagesToCoze([
      {
        isTextMessage: () => true,
        isActionExecutionMessage: () => false,
        isResultMessage: () => false,
        role: 'developer',
        content: '系统',
      },
      {
        isTextMessage: () => false,
        isActionExecutionMessage: () => true,
        isResultMessage: () => false,
        name: 'getProjectSummary',
        arguments: {},
      },
      {
        isTextMessage: () => false,
        isActionExecutionMessage: () => false,
        isResultMessage: () => true,
        actionExecutionId: 'a1',
        result: '{"ok":true}',
      },
    ] as never);

    expect(coze).toEqual([
      { role: 'system', content: '系统' },
      { role: 'assistant', content: '[ToolCall getProjectSummary({})]' },
      { role: 'user', content: '[Tool result a1]: {"ok":true}' },
    ]);
  });

  it('appendToolCatalog adds action list to system message', () => {
    const result = appendToolCatalog([{ role: 'system', content: 'base' }], [
      { name: 'createValueDomain', description: '创建价值域' },
    ]);
    expect(result[0].content).toContain('createValueDomain');
  });

  it('process streams coze chunks through CopilotKit event source', async () => {
    sdkState.streamChunks = [{ content: '你好' }, { content: '，世界' }];
    const adapter = new CozeServiceAdapter();

    const mockEventStream = {
      sendTextMessageStart: vi.fn(),
      sendTextMessageContent: vi.fn(),
      sendTextMessageEnd: vi.fn(),
      complete: vi.fn(),
    };

    let streamPromise: Promise<void> | undefined;
    await adapter.process({
      eventSource: {
        stream: (fn: (stream: typeof mockEventStream) => Promise<void>) => {
          streamPromise = fn(mockEventStream);
          return streamPromise;
        },
      } as never,
      messages: [
        {
          isTextMessage: () => true,
          isActionExecutionMessage: () => false,
          isResultMessage: () => false,
          role: 'user',
          content: '项目概况',
        } as never,
      ],
      actions: [],
      threadId: 'thread-1',
    });

    await streamPromise;

    expect(sdkState.lastMessages).toEqual([{ role: 'user', content: '项目概况' }]);
    expect(mockEventStream.sendTextMessageContent).toHaveBeenCalledWith({
      messageId: expect.any(String),
      content: '你好',
    });
    expect(mockEventStream.sendTextMessageContent).toHaveBeenCalledWith({
      messageId: expect.any(String),
      content: '，世界',
    });
    expect(mockEventStream.complete).toHaveBeenCalled();
  });
});
