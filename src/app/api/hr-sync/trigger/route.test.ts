import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock generateId to return predictable IDs
vi.mock('@/lib/id', () => ({
  generateId: () => 'mock-sync-id-001',
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/hr-sync/trigger', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HR Sync Trigger Route (POST /api/hr-sync/trigger)', () => {
  it('缺少 config 时应返回 400', async () => {
    const response = await POST(makeRequest({ departments: [], positions: [] }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少同步配置');
  });

  it('缺少整个 body 时应返回 400', async () => {
    const response = await POST(makeRequest({}));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少同步配置');
  });

  it('有效请求应返回同步结果', async () => {
    const body = {
      config: {
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
      },
      departments: [
        { id: 'dept-1', name: '技术部', nameEn: 'Tech', type: 'department', status: 'active' },
      ],
      positions: [
        { id: 'pos-1', name: '高级工程师', nameEn: 'Senior Engineer', departmentId: 'dept-1', status: 'active' },
      ],
    };

    const response = await POST(makeRequest(body));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.syncId).toBe('mock-sync-id-001');
    expect(payload.status).toBe('success');
    expect(payload.source).toBe('feishu');
    expect(payload.summary.departments.total).toBe(1);
    expect(payload.summary.departments.created).toBe(1);
    expect(payload.summary.positions.total).toBe(1);
    expect(payload.summary.positions.created).toBe(1);
    expect(payload.triggeredAt).toBeDefined();
    expect(payload.completedAt).toBeDefined();
  });

  it('空数据列表应返回零结果', async () => {
    const body = {
      config: {
        enabled: true,
        source: 'dingtalk',
        syncInterval: 'daily',
        fieldMapping: {
          department: {},
          position: {},
        },
        conflictStrategy: 'local_wins',
        syncScope: {
          syncDepartments: true,
          syncPositions: true,
          syncResponsibilities: false,
          includeInactive: false,
        },
      },
      departments: [],
      positions: [],
    };

    const response = await POST(makeRequest(body));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.summary.departments.total).toBe(0);
    expect(payload.summary.positions.total).toBe(0);
    expect(payload.conflicts).toEqual([]);
    expect(payload.errors).toEqual([]);
  });

  it('缺失 departments 或 positions 时应默认空数组', async () => {
    const body = {
      config: {
        enabled: true,
        source: 'sap',
        syncInterval: 'weekly',
        fieldMapping: {
          department: {},
          position: {},
        },
        conflictStrategy: 'hr_wins',
        syncScope: {
          syncDepartments: true,
          syncPositions: true,
          syncResponsibilities: false,
          includeInactive: false,
        },
      },
    };

    const response = await POST(makeRequest(body));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.summary.departments.total).toBe(0);
    expect(payload.summary.positions.total).toBe(0);
  });
});
