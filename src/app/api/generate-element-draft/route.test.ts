import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock @/lib/ai-draft/element-doc-prompt ====================

const mockBuildElementDocPrompt = vi.hoisted(() =>
  vi.fn(() => ({
    system: 'You are an AI modeling assistant.',
    user: 'Extract elements from the document.',
  })),
);

const mockParseElementDrafts = vi.hoisted(() =>
  vi.fn((_json: string) => ({
    elements: [
      { name: '订单', nameEn: 'Order', description: '客户订单', dimension: 'E1', fields: {} },
    ],
  })),
);

vi.mock('@/lib/ai-draft/element-doc-prompt', () => ({
  buildElementDocPrompt: mockBuildElementDocPrompt,
  parseElementDrafts: mockParseElementDrafts,
}));

// ==================== Mock coze-coding-dev-sdk ====================

// State shared between mock factory and tests
const sdkState = vi.hoisted(() => ({
  shouldThrow: false,
  streamContent:
    '```json\n{"elements":[{"name":"订单","nameEn":"Order","description":"客户订单","dimension":"E1","fields":{}}]}\n```',
}));

vi.mock('coze-coding-dev-sdk', () => ({
  LLMClient: function LLMClientMock() {
    return {
      stream: function streamMock() {
        if (sdkState.shouldThrow) {
          throw new Error('LLM service unavailable');
        }
        let exhausted = false;
        return {
          [Symbol.asyncIterator]() {
            return this;
          },
          next() {
            if (exhausted) {
              return Promise.resolve({ done: true, value: undefined });
            }
            exhausted = true;
            return Promise.resolve({
              done: false,
              value: { content: sdkState.streamContent },
            });
          },
        };
      },
    };
  },
  Config: function ConfigMock() {
    return {};
  },
  HeaderUtils: {
    extractForwardHeaders: function () {
      return {};
    },
  },
}));

import { POST } from './route';

// ==================== Helper ====================

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/generate-element-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ==================== Tests ====================

describe('POST /api/generate-element-draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdkState.shouldThrow = false;
    sdkState.streamContent =
      '```json\n{"elements":[{"name":"订单","nameEn":"Order","description":"客户订单","dimension":"E1","fields":{}}]}\n```';
  });

  // ==================== 1. Request Validation ====================

  it('缺少 projectId 时应返回 400', async () => {
    const request = makePostRequest({
      documentText: 'Some business document text.',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少参数');
  });

  it('缺少 documentText 时应返回 400', async () => {
    const request = makePostRequest({
      projectId: 'proj-123',
      documentText: '',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少参数');
  });

  // ==================== 2. Success Response ====================

  it('有效请求应调用 LLM 并返回要素列表', async () => {
    const request = makePostRequest({
      projectId: 'proj-123',
      documentText: '我们需要管理客户订单，每个订单包含多个商品。',
      existingElementNames: ['商品'],
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.elements).toBeDefined();
    expect(Array.isArray(payload.elements)).toBe(true);
    expect(payload.elements).toHaveLength(1);
    expect(payload.elements[0].name).toBe('订单');
    expect(payload.elements[0].dimension).toBe('E1');

    // Verify LLM client was invoked
    expect(mockBuildElementDocPrompt).toHaveBeenCalledWith(
      '我们需要管理客户订单，每个订单包含多个商品。',
      expect.objectContaining({
        domain: '(未指定)',
        existingElementNames: ['商品'],
      }),
    );
    expect(mockParseElementDrafts).toHaveBeenCalled();
  });

  // ==================== 3. existingElementNames defaults to empty array ====================

  it('未传 existingElementNames 时应默认使用空数组', async () => {
    const request = makePostRequest({
      projectId: 'proj-456',
      documentText: '简单文档',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.elements).toBeDefined();

    expect(mockBuildElementDocPrompt).toHaveBeenCalledWith(
      '简单文档',
      expect.objectContaining({
        existingElementNames: [],
      }),
    );
  });

  // ==================== 4. Error Handling ====================

  it('LLM 调用失败时应返回 500', async () => {
    sdkState.shouldThrow = true;

    const request = makePostRequest({
      projectId: 'proj-123',
      documentText: 'Some text.',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBeDefined();
  });
});
