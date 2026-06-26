import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock @/lib/ai-draft (index) ====================

const mockBuildModuleDraftContext = vi.hoisted(() =>
  vi.fn(() => ({
    moduleKind: 'EPC',
    moduleId: 'epc-1',
    chainPath: '业务域 > 能力 > 场景 > EPC流程',
    confirmedElements: [
      { id: 'elem-1', name: '订单', dimension: 'E1', version: 'v1' },
    ],
    currentSnapshot: { id: 'epc-1', name: '订单处理流程' },
  })),
);

const mockBuildModuleDraftPrompt = vi.hoisted(() =>
  vi.fn(() => ({
    system: 'You are a business modeling assistant.',
    user: 'Generate module draft.',
  })),
);

const mockParseModuleDraftResponse = vi.hoisted(() =>
  vi.fn(() => ({
    name: '订单处理流程',
    description: '处理客户订单的完整流程',
    steps: [
      { id: 'step-1', name: '接收订单', elementRef: { dimension: 'E1', elementId: 'elem-1', versionPin: 'latest_confirmed' } },
    ],
  })),
);

const mockGetConfirmedElementIds = vi.hoisted(() =>
  vi.fn(() => ['elem-1']),
);

vi.mock('@/lib/ai-draft', () => ({
  buildModuleDraftContext: mockBuildModuleDraftContext,
  buildModuleDraftPrompt: mockBuildModuleDraftPrompt,
  parseModuleDraftResponse: mockParseModuleDraftResponse,
  getConfirmedElementIds: mockGetConfirmedElementIds,
}));

// ==================== Mock @/lib/ai-draft/epc-doc-prompt ====================

const mockBuildEpcDocPrompt = vi.hoisted(() =>
  vi.fn(() => ({
    system: 'You are an EPC modeling assistant.',
    user: 'Extract steps from document.',
  })),
);

const mockParseEpcSteps = vi.hoisted(() =>
  vi.fn(() => ({
    steps: [
      { name: '客户下单', description: '客户在系统提交订单' },
      { name: '审核订单', description: '业务人员审核订单信息' },
    ],
  })),
);

vi.mock('@/lib/ai-draft/epc-doc-prompt', () => ({
  buildEpcDocPrompt: mockBuildEpcDocPrompt,
  parseEpcSteps: mockParseEpcSteps,
}));

// ==================== Mock coze-coding-dev-sdk ====================

const sdkState = vi.hoisted(() => ({
  shouldThrow: false,
  badJson: false,
}));

vi.mock('coze-coding-dev-sdk', () => {
  let streamsCreated = 0;
  return {
    LLMClient: function LLMClientMock() {
      const streamId = ++streamsCreated;
      let exhausted = false;
      return {
        stream: function streamMock() {
          if (sdkState.shouldThrow) {
            throw new Error('LLM service unavailable');
          }
          return {
            [Symbol.asyncIterator]() {
              return this;
            },
            next() {
              if (exhausted) {
                return Promise.resolve({ done: true, value: undefined });
              }
              exhausted = true;
              // EPC path (streamId 1) returns EPC steps; general path (streamId 2+) returns module draft
              if (streamId === 1) {
                return Promise.resolve({
                  done: false,
                  value: {
                    content: '```json\n{"steps":[{"name":"客户下单","description":"客户在系统提交订单"},{"name":"审核订单","description":"业务人员审核订单信息"}]}\n```',
                  },
                });
              }
              if (sdkState.badJson) {
                return Promise.resolve({
                  done: false,
                  value: { content: '这不是 JSON 内容' },
                });
              }
              return Promise.resolve({
                done: false,
                value: {
                  content: '```json\n{"name":"订单处理流程","description":"处理客户订单","steps":[{"id":"step-1","name":"接收订单","elementRef":{"elementId":"elem-1"}}]}\n```',
                },
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
  };
});

import { POST } from './route';

// ==================== Helper ====================

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/generate-module-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockProject = {
  valueDomains: [],
  capabilities: [],
  scenarios: [],
  epcProcesses: [{ id: 'epc-1', name: '订单处理流程', steps: [] }],
  metaElements: [{ id: 'elem-1', name: '订单', dimension: 'E1' }],
  moduleVersionRecords: [],
};

// ==================== Tests ====================

describe('POST /api/generate-module-draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdkState.shouldThrow = false;
    sdkState.badJson = false;
  });

  // ==================== 1. Request Validation ====================

  it('缺少 moduleKind 时应返回 400', async () => {
    const request = makePostRequest({
      moduleId: 'epc-1',
      project: mockProject,
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('缺少参数');
  });

  it('缺少 moduleId 时应返回 400', async () => {
    const request = makePostRequest({
      moduleKind: 'EPC',
      project: mockProject,
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('缺少参数');
  });

  it('缺少 project 时应返回 400', async () => {
    const request = makePostRequest({
      moduleKind: 'EPC',
      moduleId: 'epc-1',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('缺少参数');
  });

  // ==================== 2. EPC Doc → Steps branch ====================

  it('EPC 模块含 documentText 时应走 EPC 文档分支并返回 steps', async () => {
    const request = makePostRequest({
      moduleKind: 'EPC',
      moduleId: 'epc-1',
      project: mockProject,
      documentText: '客户在系统提交订单后，业务人员需要审核订单信息。',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.suggestion).toBeDefined();
    expect(payload.data.suggestion.steps).toHaveLength(2);
    expect(payload.data.suggestion.steps[0].name).toBe('客户下单');

    expect(mockBuildEpcDocPrompt).toHaveBeenCalled();
    expect(mockParseEpcSteps).toHaveBeenCalled();
  });

  // ==================== 3. General fill branch (non-EPC or EPC without documentText) ====================

  it('普通填充分支应调用 LLM 并返回建议', async () => {
    const request = makePostRequest({
      moduleKind: 'B',
      moduleId: 'cap-1',
      project: mockProject,
      userHint: '请补充能力描述',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.suggestion).toBeDefined();
    expect(payload.data.suggestion.name).toBe('订单处理流程');
    expect(payload.data.suggestion.description).toBe('处理客户订单的完整流程');

    expect(mockBuildModuleDraftContext).toHaveBeenCalled();
    expect(mockBuildModuleDraftPrompt).toHaveBeenCalled();
    expect(mockParseModuleDraftResponse).toHaveBeenCalled();
    expect(mockGetConfirmedElementIds).toHaveBeenCalled();
  });

  // ==================== 4. EPC module without documentText ====================

  it('EPC 模块无 documentText 时应走普通填充分支', async () => {
    const request = makePostRequest({
      moduleKind: 'EPC',
      moduleId: 'epc-1',
      project: mockProject,
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.suggestion.steps).toHaveLength(1);

    // Should NOT have called EPC doc prompt
    expect(mockBuildEpcDocPrompt).not.toHaveBeenCalled();
    // Should have called the general branch
    expect(mockBuildModuleDraftPrompt).toHaveBeenCalled();
  });

  // ==================== 5. Error Handling ====================

  it('LLM 调用失败时应返回 500', async () => {
    sdkState.shouldThrow = true;

    const request = makePostRequest({
      moduleKind: 'B',
      moduleId: 'cap-1',
      project: mockProject,
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toBeDefined();
  });

  it('LLM 返回非 JSON 内容时应在通用分支返回 500', async () => {
    sdkState.badJson = true;

    const request = makePostRequest({
      moduleKind: 'B',
      moduleId: 'cap-1',
      project: mockProject,
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('AI 响应格式解析失败');
    expect(payload.rawContent).toBe('这不是 JSON 内容');
  });
});
