import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const sdkState = vi.hoisted(() => ({
  fetchResponse: {
    status_code: 0,
    status_message: '',
    content: [] as Array<{ type: string; text: string }>,
  },
  fetchError: null as Error | null,
  lastUrl: '',
  extractedHeaders: null as Record<string, string> | null,
}));

vi.mock('coze-coding-dev-sdk', () => {
  class MockConfig {}

  class MockFetchClient {
    constructor(_config: unknown, headers: Record<string, string>) {
      sdkState.extractedHeaders = headers;
    }

    async fetch(url: string) {
      sdkState.lastUrl = url;
      if (sdkState.fetchError) {
        throw sdkState.fetchError;
      }
      return sdkState.fetchResponse;
    }
  }

  return {
    FetchClient: MockFetchClient,
    Config: MockConfig,
    HeaderUtils: {
      extractForwardHeaders: vi.fn((headers: Headers) => ({
        forwardedFor: headers.get('x-forwarded-for') || '',
      })),
    },
  };
});

describe('Masterdata Init Route', () => {
  beforeEach(() => {
    delete process.env.MASTERDATA_EXCEL_URL;
    sdkState.fetchResponse = {
      status_code: 0,
      status_message: '',
      content: [],
    };
    sdkState.fetchError = null;
    sdkState.lastUrl = '';
    sdkState.extractedHeaders = null;
    vi.resetModules();
  });

  it('未配置远端地址时应返回示例主数据与记录', async () => {
    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost/api/masterdata/init');

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBeGreaterThan(0);
    expect(payload.data.definitions.some((item: { code: string }) => item.code === 'MATERIAL')).toBe(true);
    expect(Object.keys(payload.data.records).length).toBeGreaterThan(0);
    expect(sdkState.lastUrl).toBe('');
  });

  it('配置远端地址时应解析 markdown 主数据清单', async () => {
    process.env.MASTERDATA_EXCEL_URL = 'https://example.com/masterdata.md';
    sdkState.fetchResponse = {
      status_code: 0,
      status_message: '',
      content: [{
        type: 'text',
        text: [
          '| 领域 | 主数据中文名 | 主数据英文名 | 编码 | 备注 | 核心主数据 | 字段名 | 来源系统 | API URL |',
          '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
          '| 合同管理 | 合同模板主数据 | ContractTemplate | CONTRACT_TEMPLATE | 合同模板定义 | 是 | 模板编码,模板名称 | MDM | https://api.example.com/template |',
        ].join('\n'),
      }],
    };

    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost/api/masterdata/init', {
      headers: { 'x-forwarded-for': '10.0.0.2' },
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBe(1);
    expect(payload.data.definitions[0]).toEqual(expect.objectContaining({
      domain: '合同管理',
      name: '合同模板主数据',
      nameEn: 'ContractTemplate',
      code: 'CONTRACT_TEMPLATE',
      coreData: '是',
      sourceSystem: 'MDM',
      apiUrl: 'https://api.example.com/template',
    }));
    expect(payload.data.records).toEqual({ [payload.data.definitions[0].id]: [] });
    expect(sdkState.lastUrl).toBe('https://example.com/masterdata.md');
    expect(sdkState.extractedHeaders).toEqual({ forwardedFor: '10.0.0.2' });
  });

  it('远端抓取抛错时应返回 500', async () => {
    process.env.MASTERDATA_EXCEL_URL = 'https://example.com/masterdata.md';
    sdkState.fetchError = new Error('network down');

    const { GET } = await import('./route');
    const request = new NextRequest('http://localhost/api/masterdata/init');

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('network down');
  });
});