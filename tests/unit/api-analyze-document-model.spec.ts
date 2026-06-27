import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock LLM SDK ====================
const mockStream = vi.fn().mockImplementation(async function* () {
  yield { content: '```json\n{"result":"ok"}\n```' };
});

vi.mock('coze-coding-dev-sdk', () => {
  class MockLLMClient {
    stream = mockStream;
  }
  class MockConfig {}
  return {
    LLMClient: MockLLMClient,
    Config: MockConfig,
    HeaderUtils: {
      extractForwardHeaders: vi.fn(() => ({})),
    },
  };
});

// ==================== Mock AI draft helpers ====================
vi.mock('@/lib/ai-draft', () => ({
  buildModuleDraftContext: vi.fn(() => ({
    chainPath: 'Mfg > Production',
    confirmedElements: [],
  })),
}));

vi.mock('@/lib/ai-draft/epc-doc-prompt', () => ({
  buildEpcDocPrompt: vi.fn(() => ({
    system: 'system prompt',
    user: 'user prompt',
  })),
  parseEpcSteps: vi.fn(() => ({ steps: [{ id: 'step1', name: '步骤1' }] })),
}));

vi.mock('@/lib/ai-draft/element-doc-prompt', () => ({
  buildElementDocPrompt: vi.fn(() => ({
    system: 'system prompt',
    user: 'user prompt',
  })),
  parseElementDrafts: vi.fn(() => ({ elements: [{ id: 'el1', name: '要素1' }] })),
}));

vi.mock('@/lib/copilot/chain-doc-prompt', () => ({
  buildChainDocPrompt: vi.fn(() => ({
    system: 'system prompt',
    user: 'user prompt',
  })),
  parseChainDoc: vi.fn(() => ({ businessChain: { name: '测试链', nodes: [] } })),
}));

// ==================== Mock orchestrator ====================
vi.mock('@/lib/copilot/analyze-document-orchestrator', () => ({
  runAnalyzeDocument: vi.fn(async ({ documentText, project }) => ({
    chain: { name: '推断业务链', nodes: [] },
    epcSteps: { steps: [{ id: 'epc1', name: 'EPC步骤1' }] },
    elements: { elements: [{ id: 'el1', name: '推断要素1' }] },
  })),
}));

import { POST } from '@/app/api/analyze-document-model/route';

describe('POST /api/analyze-document-model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when documentText is missing', async () => {
    const req = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: JSON.stringify({ project: { id: 'p1', domain: { name: 'Mfg' } } }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('缺少参数');
  });

  it('returns 400 when project is missing', async () => {
    const req = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: JSON.stringify({ documentText: 'some document text' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('缺少参数');
  });

  it('returns 400 when body is empty', async () => {
    const req = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('缺少参数');
  });

  it('returns 400 when documentText is whitespace-only', async () => {
    const req = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: JSON.stringify({
        documentText: '   ',
        project: { id: 'p1', domain: { name: 'Mfg' } },
      }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns success with data for valid request', async () => {
    const req = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: JSON.stringify({
        documentText: 'This is a long document text about manufacturing processes.',
        project: {
          id: 'p1',
          domain: { name: '离散制造', id: 'd1' },
          valueDomains: [],
          metaElements: [],
          capabilities: [],
          scenarios: [],
          epcProcesses: [],
          behaviorModel: null,
          dataModel: null,
        },
      }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);
    expect(payload.data).toBeDefined();
    expect(payload.data.chain).toBeDefined();
    expect(payload.data.epcSteps).toBeDefined();
    expect(payload.data.elements).toBeDefined();
  });

  it('returns 500 when orchestrator throws', async () => {
    const { runAnalyzeDocument } = await import('@/lib/copilot/analyze-document-orchestrator');
    vi.mocked(runAnalyzeDocument).mockRejectedValueOnce(new Error('LLM inference failed'));

    const req = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: JSON.stringify({
        documentText: 'Some document text.',
        project: { id: 'p1', domain: { name: 'Mfg' } },
      }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('LLM inference failed');
  });

  it('returns 500 on JSON parse failure', async () => {
    const req = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
