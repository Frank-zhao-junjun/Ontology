import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock CopilotKit Runtime ====================
const mockHandleRequest = vi.fn(async () =>
  new Response(JSON.stringify({ data: 'copilot response' }), { status: 200 }),
);

vi.mock('@copilotkit/runtime', () => {
  class MockCopilotRuntime {}
  return {
    CopilotRuntime: MockCopilotRuntime,
    copilotRuntimeNextJSAppRouterEndpoint: vi.fn(() => ({
      handleRequest: mockHandleRequest,
    })),
  };
});

// ==================== Mock coze adapter ====================
vi.mock('coze-coding-dev-sdk', () => ({
  HeaderUtils: {
    extractForwardHeaders: vi.fn(() => ({})),
  },
}));

vi.mock('@/lib/copilot/coze-service-adapter', () => ({
  createCozeServiceAdapter: vi.fn(() => ({})),
}));

import { GET, POST } from '@/app/api/copilotkit/route';

describe('CopilotKit Route (/api/copilotkit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST delegates to CopilotRuntime handleRequest', async () => {
    const req = new NextRequest('http://localhost/api/copilotkit', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.data).toBe('copilot response');
    expect(mockHandleRequest).toHaveBeenCalledWith(req);
  });

  it('GET delegates to CopilotRuntime handleRequest', async () => {
    const req = new NextRequest('http://localhost/api/copilotkit', {
      method: 'GET',
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.data).toBe('copilot response');
    expect(mockHandleRequest).toHaveBeenCalledWith(req);
  });

  it('propagates errors from CopilotRuntime', async () => {
    mockHandleRequest.mockRejectedValueOnce(new Error('Runtime error'));

    const req = new NextRequest('http://localhost/api/copilotkit', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }),
      headers: { 'content-type': 'application/json' },
    });
    await expect(POST(req)).rejects.toThrow('Runtime error');
  });

  it('passes custom headers to Coze adapter', async () => {
    const req = new NextRequest('http://localhost/api/copilotkit', {
      method: 'GET',
      headers: { 'x-custom-header': 'test-value' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const { HeaderUtils } = await import('coze-coding-dev-sdk');
    expect(HeaderUtils.extractForwardHeaders).toHaveBeenCalled();
  });
});
