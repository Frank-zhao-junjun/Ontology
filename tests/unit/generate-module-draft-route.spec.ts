import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const sdkState = vi.hoisted(() => ({
  streamChunks: [] as string[],
  lastMessages: null as Array<{ role: string; content: string }> | null,
}));

vi.mock('coze-coding-dev-sdk', () => {
  class MockConfig {}

  class MockLLMClient {
    constructor() {}

    async *stream(messages: Array<{ role: string; content: string }>) {
      sdkState.lastMessages = messages;
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

import { POST } from '@/app/api/generate-module-draft/route';

const project = {
  valueDomains: [{ id: 'a1', name: '生产域' }],
  capabilities: [],
  scenarios: [],
  epcProcesses: [],
  metaElements: [],
  moduleVersionRecords: [],
};

describe('Generate Module Draft Route (US-S11-U02)', () => {
  beforeEach(() => {
    sdkState.streamChunks = [];
    sdkState.lastMessages = null;
  });

  it('should return 400 when body incomplete', async () => {
    const request = new NextRequest('http://localhost/api/generate-module-draft', {
      method: 'POST',
      body: JSON.stringify({ moduleKind: 'A' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should parse LLM json and return suggestion', async () => {
    sdkState.streamChunks = [
      JSON.stringify({ description: 'AI 生成的描述', semantics: { terms: ['制造'] } }),
    ];

    const request = new NextRequest('http://localhost/api/generate-module-draft', {
      method: 'POST',
      body: JSON.stringify({
        moduleKind: 'A',
        moduleId: 'a1',
        project,
        userHint: '补充制造业语义',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.suggestion.description).toBe('AI 生成的描述');
    expect(sdkState.lastMessages?.[1].content).toContain('补充制造业语义');
  });
});
