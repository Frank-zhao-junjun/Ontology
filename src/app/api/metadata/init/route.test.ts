import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const sdkState = vi.hoisted(() => ({
  fetchResponse: {
    status_code: 0,
    status_message: '',
    content: [] as Array<{ type: string; text: string }>,
  },
  fetchError: null as Error | null,
  extractedHeaders: null as Record<string, string> | null,
}));

vi.mock('coze-coding-dev-sdk', () => {
  class MockConfig {}

  class MockFetchClient {
    constructor(_config: unknown, headers: Record<string, string>) {
      sdkState.extractedHeaders = headers;
    }

    async fetch(url: string) {
      void url;
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

import { GET } from './route';

describe('Metadata Init Route', () => {
  beforeEach(() => {
    sdkState.fetchResponse = {
      status_code: 0,
      status_message: '',
      content: [],
    };
    sdkState.fetchError = null;
    sdkState.extractedHeaders = null;
  });

  it('应解析 markdown 表格并映射字段类型', async () => {
    sdkState.fetchResponse = {
      status_code: 0,
      status_message: '',
      content: [{
        type: 'text',
        text: [
          '| 领域 | 字段中文名 | 字段英文名 | 业务含义 | 字段属性 | 值范围 | 参考标准 | 信息源头 |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| 合同管理 | 合同金额 | contractAmount | 合同总金额 | decimal | >=0 | ISO4217 | ERP |',
          '| 合同管理 | 生效日期 | effectiveDate | 合同生效日期 | 日期 | 2024-01-01~2099-12-31 | 企业标准 | DMS |',
        ].join('\n'),
      }],
    };

    const request = new NextRequest('http://localhost/api/metadata/init', {
      headers: { 'x-forwarded-for': '10.0.0.3' },
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBe(2);
    expect(payload.data[0]).toEqual(expect.objectContaining({
      domain: '合同管理',
      name: '合同金额',
      nameEn: 'contractAmount',
      type: 'decimal',
      source: 'ERP',
    }));
    expect(payload.data[1]).toEqual(expect.objectContaining({
      name: '生效日期',
      type: 'date',
    }));
    expect(sdkState.extractedHeaders).toEqual({ forwardedFor: '10.0.0.3' });
  });

  it('远端返回失败状态时应返回 500', async () => {
    sdkState.fetchResponse = {
      status_code: 1001,
      status_message: 'fetch failed',
      content: [],
    };

    const response = await GET(new NextRequest('http://localhost/api/metadata/init'));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('fetch failed');
  });

  it('抓取过程抛错时应返回 500', async () => {
    sdkState.fetchError = new Error('sdk exploded');

    const response = await GET(new NextRequest('http://localhost/api/metadata/init'));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('sdk exploded');
  });
});