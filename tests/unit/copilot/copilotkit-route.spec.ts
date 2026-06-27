import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const sdkState = vi.hoisted(() => ({
  streamChunks: [] as Array<{ content?: string }>,
}));

vi.mock('coze-coding-dev-sdk', () => {
  class MockConfig {}

  class MockLLMClient {
    constructor(_config?: unknown, _headers?: Record<string, string>) {}

    async *stream() {
      for (const chunk of sdkState.streamChunks) {
        yield chunk;
      }
    }
  }

  return {
    LLMClient: MockLLMClient,
    Config: MockConfig,
    HeaderUtils: {
      extractForwardHeaders: vi.fn(() => ({ 'x-test': '1' })),
    },
  };
});

import { GET, POST } from '@/app/api/copilotkit/route';
import { HeaderUtils } from 'coze-coding-dev-sdk';

describe('/api/copilotkit route', () => {
  beforeEach(() => {
    sdkState.streamChunks = [];
    vi.mocked(HeaderUtils.extractForwardHeaders).mockClear();
  });

  it('TC-P0-03 GET delegates to CopilotKit runtime handler', async () => {
    const req = new NextRequest('http://localhost/api/copilotkit', { method: 'GET' });
    const res = await GET(req);
    expect(res).toBeInstanceOf(Response);
    expect(HeaderUtils.extractForwardHeaders).toHaveBeenCalled();
  });

  it('POST forwards coze auth headers per request', async () => {
    const req = new NextRequest('http://localhost/api/copilotkit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res).toBeInstanceOf(Response);
    expect(HeaderUtils.extractForwardHeaders).toHaveBeenCalledWith(req.headers);
  });
});
