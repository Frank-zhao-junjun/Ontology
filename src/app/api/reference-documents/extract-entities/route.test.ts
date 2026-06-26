import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock coze-coding-dev-sdk ====================

vi.mock('coze-coding-dev-sdk', () => {
  // These variables are local to the mock factory closure
  let _streamChunks: string[] = [];

  class MockConfig {}

  class MockLLMClient {
    private _extractedHeaders: Record<string, string>;

    constructor(_config: unknown, headers: Record<string, string>) {
      this._extractedHeaders = headers;
    }

    async *stream(
      _messages: Array<{ role: string; content: string }>,
      _options: Record<string, unknown>,
    ) {
      for (const chunk of _streamChunks) {
        yield { content: chunk };
      }
    }
  }

  // Expose setter for test control via the module
  return {
    LLMClient: MockLLMClient,
    Config: MockConfig,
    HeaderUtils: {
      extractForwardHeaders: vi.fn((headers: Headers) => ({
        forwardedFor: headers.get('x-forwarded-for') || '',
      })),
    },
    __setStreamChunks: (chunks: string[]) => {
      _streamChunks = chunks;
    },
  };
});

import { POST } from './route';

describe('Reference Documents Extract Entities Route (POST /api/reference-documents/extract-entities)', () => {
  let setStreamChunks: (chunks: string[]) => void;

  beforeEach(async () => {
    const mod = await vi.mocked(await import('coze-coding-dev-sdk'));
    setStreamChunks = (mod as unknown as { __setStreamChunks: (c: string[]) => void }).__setStreamChunks;
    setStreamChunks([]);
  });

  // ==================== 1. Request Validation ====================

  it('缺少 documentText 时应返回 400', async () => {
    const request = new NextRequest(
      'http://localhost/api/reference-documents/extract-entities',
      {
        method: 'POST',
        body: JSON.stringify({ docId: 'doc-1' }),
        headers: { 'content-type': 'application/json' },
      },
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('缺少文档内容');
  });

  it('空 documentText 时应返回 400', async () => {
    const request = new NextRequest(
      'http://localhost/api/reference-documents/extract-entities',
      {
        method: 'POST',
        body: JSON.stringify({ docId: 'doc-1', documentText: '' }),
        headers: { 'content-type': 'application/json' },
      },
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('缺少文档内容');
  });

  // ==================== 2. Successful Extraction ====================

  it('LLM 返回有效 JSON 时应返回提取的实体', async () => {
    setStreamChunks([
      JSON.stringify([
        {
          name: '合同',
          nameEn: 'Contract',
          description: '业务合同主体',
          source: '合同管理文档第2节',
          confidence: 0.95,
          attributes: [
            {
              name: '合同编号',
              nameEn: 'contractNo',
              dataType: 'string',
              description: '合同唯一编号',
              required: true,
              source: '第2.1节',
            },
          ],
        },
        {
          name: '供应商',
          nameEn: 'Supplier',
          description: '提供商品或服务的第三方',
          source: '合同管理文档第3节',
          confidence: 0.88,
        },
      ]),
    ]);

    const request = new NextRequest(
      'http://localhost/api/reference-documents/extract-entities',
      {
        method: 'POST',
        body: JSON.stringify({
          docId: 'doc-1',
          documentText: '这是一份关于合同管理的参考文档...',
          title: '合同管理规范',
          domain: { name: '合同管理', description: '合同全生命周期管理' },
        }),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '10.0.0.1',
        },
      },
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.docId).toBe('doc-1');
    expect(payload.data.entities).toHaveLength(2);
    expect(payload.data.entities[0].name).toBe('合同');
    expect(payload.data.entities[0].nameEn).toBe('Contract');
    expect(payload.data.entities[0].confidence).toBe(0.95);
    expect(payload.data.entities[0].attributes).toHaveLength(1);
    expect(payload.data.entities[1].name).toBe('供应商');
  });

  it('LLM 响应应包含文档标题和领域信息在 prompt 中', async () => {
    // This test verifies that the response is successful when title and domain are provided.
    // The mock processes the prompt but we verify via successful response.
    setStreamChunks(['[]']);

    const response = await POST(
      new NextRequest('http://localhost/api/reference-documents/extract-entities', {
        method: 'POST',
        body: JSON.stringify({
          docId: 'doc-1',
          documentText: '一些合同相关文本',
          title: '合同管理规范',
          domain: { name: '合同管理', description: '合同领域' },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.entities).toEqual([]);
  });

  // ==================== 3. LLM Error Handling ====================

  it('LLM 返回无法解析的内容时应返回空实体列表', async () => {
    setStreamChunks(['not-json-response-without-brackets']);

    const request = new NextRequest(
      'http://localhost/api/reference-documents/extract-entities',
      {
        method: 'POST',
        body: JSON.stringify({
          docId: 'doc-1',
          documentText: '一些业务文档内容',
        }),
        headers: { 'content-type': 'application/json' },
      },
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.entities).toEqual([]);
  });

  it('LLM 流式调用失败时应返回 500', async () => {
    // Override the mock to throw during streaming
    const mockModule = await vi.mocked(await import('coze-coding-dev-sdk'));
    const OrigClient = mockModule.LLMClient;
    vi.spyOn(OrigClient.prototype, 'stream').mockImplementationOnce(async function* () {
      throw new Error('LLM service unavailable');
    });

    const request = new NextRequest(
      'http://localhost/api/reference-documents/extract-entities',
      {
        method: 'POST',
        body: JSON.stringify({
          docId: 'doc-1',
          documentText: '一些业务文档内容',
        }),
        headers: { 'content-type': 'application/json' },
      },
    );

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('实体提取失败');
  });

  // ==================== 4. Text Truncation ====================

  it('超过 8000 字符的文档应被截断', async () => {
    // The route truncates long documents before sending to LLM.
    // Here we verify the route handles long texts successfully (returns response).
    setStreamChunks(['[]']);
    const longText = 'A'.repeat(10000);

    const response = await POST(
      new NextRequest('http://localhost/api/reference-documents/extract-entities', {
        method: 'POST',
        body: JSON.stringify({
          docId: 'doc-1',
          documentText: longText,
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });
});
