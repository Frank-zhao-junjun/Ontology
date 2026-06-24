import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const sdkState = vi.hoisted(() => ({
  streamChunks: [] as string[],
  lastMessages: null as Array<{ role: string; content: string }> | null,
  lastOptions: null as Record<string, unknown> | null,
  extractedHeaders: null as Record<string, string> | null,
}));

vi.mock('coze-coding-dev-sdk', () => {
  class MockConfig {}

  class MockLLMClient {
    constructor(_config: unknown, headers: Record<string, string>) {
      sdkState.extractedHeaders = headers;
    }

    async *stream(messages: Array<{ role: string; content: string }>, options: Record<string, unknown>) {
      sdkState.lastMessages = messages;
      sdkState.lastOptions = options;

      for (const chunk of sdkState.streamChunks) {
        yield { content: chunk };
      }
    }
  }

  return {
    LLMClient: MockLLMClient,
    Config: MockConfig,
    HeaderUtils: {
      extractForwardHeaders: vi.fn((headers: Headers) => ({
        forwardedFor: headers.get('x-forwarded-for') || '',
      })),
    },
  };
});

import { POST } from './route';

describe('Generate Model Route', () => {
  beforeEach(() => {
    sdkState.streamChunks = [];
    sdkState.lastMessages = null;
    sdkState.lastOptions = null;
    sdkState.extractedHeaders = null;
  });

  it('缺少 entity 或 domain 时应返回 400', async () => {
    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({ domain: { name: '合同管理' } }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('缺少实体或领域信息');
  });

  it('应调用 LLM 并解析 markdown json 响应', async () => {
    sdkState.streamChunks = [
      '```json\n',
      JSON.stringify({
        dataModel: { suggestedAttributes: [{ name: '合同编号', nameEn: 'contractNo', type: 'string', required: true }] },
        behaviorModel: { suggestedStates: [] },
        ruleModel: { suggestedRules: [] },
        eventModel: { suggestedEvents: [], suggestedSubscriptions: [] },
      }),
      '\n```',
    ];

    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({
        entity: {
          id: 'entity-contract',
          name: '合同',
          nameEn: 'Contract',
          description: '合同主实体',
          projectId: 'module-1',
          projectName: '合同中心',
          attributes: [],
          relations: [],
        },
        domain: {
          name: '合同管理',
          description: '合同领域',
        },
        project: {
          name: '合同中心',
          nameEn: 'ContractCenter',
          description: '合同中心项目',
        },
        existingModels: {
          stateMachines: [],
          rules: [],
          events: [],
        },
        metadataList: [
          {
            id: 'meta-1',
            domain: '合同管理',
            name: '合同编号',
            nameEn: 'ContractNo',
            description: '合同唯一编号',
            type: '字符串',
            createdAt: '2026-04-02T00:00:00.000Z',
            updatedAt: '2026-04-02T00:00:00.000Z',
          },
        ],
        masterDataList: [
          {
            id: 'md-supplier',
            domain: '采购管理',
            name: '供应商主数据',
            nameEn: 'SupplierMaster',
            code: 'SUPPLIER',
            description: '供应商信息',
            coreData: '是',
            fieldNames: '供应商编码,供应商名称',
            sourceSystem: 'ERP',
            status: '00',
            createdAt: '2026-04-02T00:00:00.000Z',
            updatedAt: '2026-04-02T00:00:00.000Z',
          },
        ],
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.dataModel.suggestedAttributes[0].name).toBe('合同编号');
    expect(payload.rawContent).toContain('```json');
    expect(sdkState.extractedHeaders).toEqual({ forwardedFor: '10.0.0.1' });
    expect(sdkState.lastOptions).toEqual(expect.objectContaining({
      model: 'doubao-seed-2-0-pro-260215',
      temperature: 0.7,
      thinking: 'enabled',
    }));

    const userPrompt = sdkState.lastMessages?.[1]?.content || '';
    expect(userPrompt).toContain('可用元数据字典');
    expect(userPrompt).toContain('供应商主数据');
    expect(userPrompt).toContain("referenceKind = 'masterData'");
  });

  it('AI 返回无法解析的内容时应返回 500', async () => {
    sdkState.streamChunks = ['not-json-response'];

    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({
        entity: { id: 'entity-contract', name: '合同', nameEn: 'Contract' },
        domain: { name: '合同管理', description: '合同领域' },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('AI响应格式解析失败');
    expect(payload.rawContent).toBe('not-json-response');
  });
});