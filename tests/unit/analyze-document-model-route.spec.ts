import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const sdkState = vi.hoisted(() => ({
  streamChunks: [] as string[],
  callIndex: 0,
  responses: [] as string[],
}));

vi.mock('coze-coding-dev-sdk', () => {
  class MockConfig {}

  class MockLLMClient {
    constructor() {}

    async *stream() {
      const chunk = sdkState.responses[sdkState.callIndex] ?? '{}';
      sdkState.callIndex += 1;
      yield { content: chunk };
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

import { POST } from '@/app/api/analyze-document-model/route';

const project = {
  id: 'p1',
  domain: { id: 'd1', name: '离散制造', nameEn: 'Mfg', description: '', icon: 'f', color: '#000' },
  valueDomains: [{ id: 'a1', name: '生产域' }],
  capabilities: [],
  scenarios: [],
  epcProcesses: [],
  metaElements: [],
  moduleVersionRecords: [],
};

describe('POST /api/analyze-document-model — TC-03', () => {
  beforeEach(() => {
    sdkState.callIndex = 0;
    sdkState.responses = [
      JSON.stringify({
        valueDomains: [{ name: '供应链', capabilities: [{ name: '采购', scenarios: [] }] }],
      }),
      JSON.stringify({
        steps: [{ name: '下单', description: '创建采购订单' }],
      }),
      JSON.stringify({
        elements: [
          { name: '采购订单', dimension: 'E1', description: '采购单实体', fields: {} },
        ],
      }),
    ];
  });

  it('returns 400 when body incomplete', async () => {
    const request = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: JSON.stringify({ documentText: 'doc' }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('orchestrates 3 sub-prompts and aggregates results', async () => {
    const request = new NextRequest('http://localhost/api/analyze-document-model', {
      method: 'POST',
      body: JSON.stringify({ documentText: '业务 SOP 文档', project }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.chain.valueDomains[0].name).toBe('供应链');
    expect(payload.data.epc.steps).toHaveLength(1);
    expect(payload.data.elements).toHaveLength(1);
    expect(payload.data.errors).toEqual([]);
    expect(sdkState.callIndex).toBe(3);
  });
});
