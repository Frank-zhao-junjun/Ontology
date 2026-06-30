import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const sdkState = vi.hoisted(() => ({
  streamChunks: [] as string[],
  throwError: null as string | null,
  lastMessages: null as Array<{ role: string; content: string }> | null,
}));

vi.mock('coze-coding-dev-sdk', () => {
  class MockConfig {}

  class MockLLMClient {
    constructor() {}

    async *stream(messages: Array<{ role: string; content: string }>) {
      sdkState.lastMessages = messages;
      if (sdkState.throwError) {
        throw new Error(sdkState.throwError);
      }
      for (const chunk of sdkState.streamChunks) {
        yield { content: chunk };
      }
    }
  }

  return {
    LLMClient: MockLLMClient,
    Config: MockConfig,
    HeaderUtils: {
      extractForwardHeaders: vi.fn(() => ({})),
    },
  };
});

import { POST } from '@/app/api/chat/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('Chat Route (S20-U04)', () => {
  beforeEach(() => {
    sdkState.streamChunks = [];
    sdkState.throwError = null;
    sdkState.lastMessages = null;
  });

  it('returns 400 when messages are missing', async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain('messages');
  });

  it('returns 400 when messages array is empty', async () => {
    const response = await POST(makeRequest({ messages: [] }));
    expect(response.status).toBe(400);
  });

  it('streams content as SSE frames and ends with done', async () => {
    sdkState.streamChunks = ['你好', '，世界'];
    const response = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }] }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const text = await response.text();
    expect(text).toContain('data: ' + JSON.stringify({ content: '你好' }));
    expect(text).toContain('data: ' + JSON.stringify({ content: '，世界' }));
    expect(text).toContain('data: ' + JSON.stringify({ done: true }));
  });

  it('injects system prompt with project context and document text', async () => {
    sdkState.streamChunks = ['ok'];
    await POST(
      makeRequest({
        messages: [{ role: 'user', content: '建模' }],
        projectContext: '项目名称: 测试项目',
        documentText: '这是参考文档内容',
      }),
    );

    expect(sdkState.lastMessages).not.toBeNull();
    const system = sdkState.lastMessages![0];
    expect(system.role).toBe('system');
    expect(system.content).toContain('项目名称: 测试项目');
    expect(system.content).toContain('这是参考文档内容');
    // user message is forwarded after the system prompt
    expect(sdkState.lastMessages![1]).toMatchObject({ role: 'user', content: '建模' });
  });

  it('truncates very long document text', async () => {
    sdkState.streamChunks = ['ok'];
    const longDoc = 'x'.repeat(20000);
    await POST(
      makeRequest({
        messages: [{ role: 'user', content: 'hi' }],
        documentText: longDoc,
      }),
    );
    const system = sdkState.lastMessages![0];
    expect(system.content).toContain('文档已截断');
    expect(system.content).not.toContain('x'.repeat(20000));
  });

  it('emits an error SSE frame when the LLM stream throws', async () => {
    sdkState.throwError = 'upstream boom';
    const response = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('upstream boom');
  });
});
