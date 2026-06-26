import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from './route';
import type { HRSyncConfig } from '@/types/ontology';

// Helper: build a minimal valid HRSyncConfig
function makeConfig(overrides: Partial<HRSyncConfig> = {}): HRSyncConfig {
  return {
    enabled: true,
    source: 'feishu',
    endpoint: 'https://open.feishu.cn/open-apis',
    syncInterval: 'hourly',
    fieldMapping: {
      department: { name: 'department_name' },
      position: { name: 'position_name' },
    },
    conflictStrategy: 'hr_wins',
    syncScope: {
      syncDepartments: true,
      syncPositions: true,
      syncResponsibilities: false,
      includeInactive: false,
    },
    ...overrides,
  };
}

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/hr-sync/config', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

describe('HR Sync Config Route (GET /api/hr-sync/config)', () => {
  it('尚未配置时应返回 404', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBe('未配置 HR 同步');
  });

  it('已配置时应返回配置', async () => {
    // First PUT to store config
    const config = makeConfig();
    await PUT(makeRequest('PUT', config));

    // Then GET to retrieve it
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('feishu');
    expect(payload.enabled).toBe(true);
    expect(payload.syncInterval).toBe('hourly');
  });

  it('更新后 GET 应返回最新配置', async () => {
    await PUT(makeRequest('PUT', makeConfig()));
    await PUT(makeRequest('PUT', makeConfig({ source: 'dingtalk', syncInterval: 'daily' })));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.source).toBe('dingtalk');
    expect(payload.syncInterval).toBe('daily');
  });
});

describe('HR Sync Config Route (PUT /api/hr-sync/config)', () => {
  it('缺少 source 时应返回 400', async () => {
    const config = makeConfig({ source: undefined as unknown as HRSyncConfig['source'] });
    const response = await PUT(makeRequest('PUT', config));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少必需的同步配置字段');
  });

  it('缺少整个 body 时应返回 400', async () => {
    const response = await PUT(makeRequest('PUT', {}));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少必需的同步配置字段');
  });

  it('有效配置应返回成功', async () => {
    const config = makeConfig();
    const response = await PUT(makeRequest('PUT', config));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.config.source).toBe('feishu');
  });

  it('支持不同同步来源的配置', async () => {
    const config = makeConfig({ source: 'sap', endpoint: 'https://sap.example.com/api' });
    const response = await PUT(makeRequest('PUT', config));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.config.source).toBe('sap');
    expect(payload.config.endpoint).toBe('https://sap.example.com/api');
  });
});
