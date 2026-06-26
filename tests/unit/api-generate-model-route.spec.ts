import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock coze-coding-dev-sdk ====================

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

import { POST } from '@/app/api/generate-model/route';

describe('Generate Model API Route (POST /api/generate-model)', () => {
  beforeEach(() => {
    sdkState.streamChunks = [];
    sdkState.lastMessages = null;
    sdkState.lastOptions = null;
    sdkState.extractedHeaders = null;
  });

  // ==================== 1. Request Validation ====================

  it('缺少 entity 时应返回 400', async () => {
    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({ domain: { name: '合同管理' } }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('缺少实体信息');
  });

  it('null body 时应返回 500', async () => {
    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: null,
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
  });

  // ==================== 2. Successful Generation ====================

  it('应调用 LLM 并返回解析后的 e1-e8 模型数据', async () => {
    sdkState.streamChunks = [
      JSON.stringify({
        e1: {
          suggestedAttributes: [
            { name: '合同编号', nameEn: 'contractNo', dataType: 'string', required: true, description: '合同唯一编号' },
          ],
          suggestedRelations: [
            { name: '所属供应商', type: 'one_to_many', targetEntity: '供应商', description: '合同与供应商的关联' },
          ],
        },
        e2: {
          suggestedStates: [{ name: '待签署', isInitial: true, isFinal: false, description: '合同待签署状态' }],
          suggestedActions: [{ name: '提交审批', trigger: 'manual', description: '提交合同审批' }],
          suggestedTransitions: [
            { name: '签署完成', from: '待签署', to: '已生效', trigger: 'manual', description: '合同签署完成' },
          ],
        },
        e3: {
          suggestedRules: [
            {
              name: '金额校验',
              type: 'field_validation',
              field: '总金额',
              condition: { type: 'greater_than', value: 0 },
              errorMessage: '合同金额必须大于0',
              severity: 'error',
            },
          ],
        },
        e4: {
          suggestedEvents: [{ name: '合同到期', trigger: 'schedule', description: '合同到期事件' }],
          suggestedSubscriptions: [
            { name: '到期提醒', event: '合同到期', handler: 'async', action: 'notification' },
          ],
        },
        e5: {
          suggestedRoles: [
            { name: '合同管理员', description: '负责合同管理', responsibilities: ['合同录入', '合同归档'] },
          ],
          suggestedDepartments: [{ name: '法务部', type: 'department', description: '法务管理部门' }],
        },
        e6: {
          suggestedMetrics: [
            { name: '合同履约率', unit: '%', targetValue: '95', description: '合同按时履约比例' },
          ],
        },
        e7: {
          suggestedBoundaries: [
            { name: '合同金额上限', type: 'business', description: '单笔合同金额不超过1000万' },
          ],
        },
        e8: {
          suggestedDataSources: [
            { name: '合同系统', type: 'database', connection: 'JDBC', description: '合同管理数据库' },
          ],
          suggestedInterfaces: [
            { name: '合同同步接口', protocol: 'REST', method: 'POST', description: '合同数据同步接口' },
          ],
        },
      }),
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
          attributes: [{ name: '合同编号' }],
          relations: [{ name: '供应商' }],
        },
        domain: { name: '合同管理', description: '合同领域' },
        project: { name: '合同中心', nameEn: 'ContractCenter', description: '合同中心项目' },
        existingModels: {
          stateMachines: [],
          rules: [],
          events: [],
          roles: [],
          metrics: [],
          boundaries: [],
          dataSources: [],
        },
        metadataList: [
          {
            name: '合同编号',
            nameEn: 'ContractNo',
            description: '合同唯一编号',
            type: '字符串',
          },
        ],
        masterDataList: [
          {
            name: '供应商主数据',
            nameEn: 'SupplierMaster',
            description: '供应商信息',
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
    expect(payload.data).toBeDefined();
    expect(payload.data.e1).toBeDefined();
    expect(payload.data.e1.suggestedAttributes).toHaveLength(1);
    expect(payload.data.e1.suggestedAttributes[0].name).toBe('合同编号');
    expect(payload.data.e1.suggestedRelations).toHaveLength(1);
    expect(payload.data.e2).toBeDefined();
    expect(payload.data.e2.suggestedStates).toHaveLength(1);
    expect(payload.data.e3.suggestedRules).toHaveLength(1);
    expect(payload.data.e4.suggestedEvents).toHaveLength(1);
    expect(payload.data.e5.suggestedRoles).toHaveLength(1);
    expect(payload.data.e6.suggestedMetrics).toHaveLength(1);
    expect(payload.data.e7.suggestedBoundaries).toHaveLength(1);
    expect(payload.data.e8.suggestedDataSources).toHaveLength(1);
    expect(payload.data.e8.suggestedInterfaces).toHaveLength(1);

    // Verify LLM was called with correct model/temperature
    expect(sdkState.lastOptions).toEqual({
      model: 'doubao-pro-128k',
      temperature: 0.3,
    });
    expect(sdkState.extractedHeaders).toEqual({ forwardedFor: '10.0.0.1' });

    // Verify system prompt and user prompt
    expect(sdkState.lastMessages?.[0].content).toContain('资深企业架构师');
    const userPrompt = sdkState.lastMessages?.[1]?.content || '';
    expect(userPrompt).toContain('合同');
    expect(userPrompt).toContain('Contract');
    expect(userPrompt).toContain('合同编号');
    expect(userPrompt).toContain('供应商主数据');
    expect(userPrompt).toContain('E1 数据模型');
  });

  it('应提取 markdown 代码块中的 JSON', async () => {
    sdkState.streamChunks = [
      '```json\n',
      JSON.stringify({
        e1: { suggestedAttributes: [{ name: 'test', nameEn: 'test', dataType: 'string' }], suggestedRelations: [] },
        e2: { suggestedStates: [], suggestedActions: [], suggestedTransitions: [] },
        e3: { suggestedRules: [] },
        e4: { suggestedEvents: [], suggestedSubscriptions: [] },
      }),
      '\n```',
    ];

    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({
        entity: { id: 'e1', name: 'Test', nameEn: 'Test' },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.e1.suggestedAttributes[0].name).toBe('test');
  });

  // ==================== 3. Legacy Format Mapping ====================

  it('应自动映射旧版 dataModel/behaviorModel/ruleModel/eventModel 到 e1-e4', async () => {
    sdkState.streamChunks = [
      JSON.stringify({
        dataModel: {
          suggestedAttributes: [{ name: '旧属性', nameEn: 'oldAttr', dataType: 'string' }],
          suggestedRelations: [],
        },
        behaviorModel: {
          suggestedStates: [{ name: '旧状态', isInitial: false, isFinal: false, description: '' }],
          suggestedActions: [],
          suggestedTransitions: [],
        },
        ruleModel: {
          suggestedRules: [{ name: '旧规则', type: 'field_validation', field: 'x', condition: { type: 'required' }, errorMessage: '', severity: 'error' }],
        },
        eventModel: {
          suggestedEvents: [{ name: '旧事件', trigger: 'manual', description: '' }],
          suggestedSubscriptions: [],
        },
      }),
    ];

    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({
        entity: { id: 'e1', name: 'Test', nameEn: 'Test' },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.e1.suggestedAttributes[0].name).toBe('旧属性');
    expect(payload.data.e2.suggestedStates[0].name).toBe('旧状态');
    expect(payload.data.e3.suggestedRules[0].name).toBe('旧规则');
    expect(payload.data.e4.suggestedEvents[0].name).toBe('旧事件');
    // Legacy format does NOT fill e5-e8
    expect(payload.data.e5).toBeUndefined();
    expect(payload.data.e6).toBeUndefined();
    expect(payload.data.e7).toBeUndefined();
    expect(payload.data.e8).toBeUndefined();
  });

  // ==================== 4. Error Handling ====================

  it('AI 返回无法解析的内容时应返回 500 并包含 rawContent', async () => {
    sdkState.streamChunks = ['这不是一个有效的 JSON 字符串，完全无法解析'];

    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({
        entity: { id: 'e1', name: 'Test', nameEn: 'Test' },
        domain: { name: '测试域' },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('AI 返回内容无法解析为 JSON');
    expect(payload.rawContent).toBe('这不是一个有效的 JSON 字符串，完全无法解析');
  });

  it('LLM 流式调用抛出异常时应返回 500', async () => {
    // Spy on prototype to force an error during streaming
    const { LLMClient } = await vi.mocked(await import('coze-coding-dev-sdk'));
    vi.spyOn(LLMClient.prototype, 'stream').mockImplementationOnce(async function* () {
      throw new Error('LLM service unavailable');
    });

    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({
        entity: { id: 'e1', name: 'Test', nameEn: 'Test' },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('LLM service unavailable');
  });

  // ==================== 5. Prompt Construction ====================

  it('prompt 应包含已有模型上下文信息', async () => {
    sdkState.streamChunks = [
      JSON.stringify({
        e1: { suggestedAttributes: [], suggestedRelations: [] },
        e2: { suggestedStates: [], suggestedActions: [], suggestedTransitions: [] },
        e3: { suggestedRules: [] },
        e4: { suggestedEvents: [], suggestedSubscriptions: [] },
      }),
    ];

    const request = new NextRequest('http://localhost/api/generate-model', {
      method: 'POST',
      body: JSON.stringify({
        entity: { id: 'e1', name: '订单', nameEn: 'Order' },
        existingModels: {
          stateMachines: [{}],
          rules: [{}, {}],
          events: [],
          roles: [{}],
          metrics: [],
          boundaries: [],
          dataSources: [{}],
        },
      }),
      headers: { 'content-type': 'application/json' },
    });

    await POST(request);

    const userPrompt = sdkState.lastMessages?.[1]?.content || '';
    expect(userPrompt).toContain('状态机：1 个');
    expect(userPrompt).toContain('规则：2 条');
    expect(userPrompt).toContain('角色：1 个');
  });
});
