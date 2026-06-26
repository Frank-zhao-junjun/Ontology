import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import type { HRSyncConflict } from '@/types/ontology';

function makeConflict(overrides: Partial<HRSyncConflict> = {}): HRSyncConflict {
  return {
    type: 'department',
    externalId: 'hr-dept-001',
    localId: 'local-dept-001',
    field: 'name',
    hrValue: '技术研发部',
    localValue: '技术部',
    ...overrides,
  };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/hr-sync/resolve-conflict', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HR Sync Resolve Conflict Route (POST /api/hr-sync/resolve-conflict)', () => {
  it('缺少 conflict 时应返回 400', async () => {
    const response = await POST(makeRequest({ resolution: 'hr_wins' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少冲突信息或解决方式');
  });

  it('缺少 resolution 时应返回 400', async () => {
    const response = await POST(makeRequest({ conflict: makeConflict() }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少冲突信息或解决方式');
  });

  it('缺少整个 body 时应返回 400', async () => {
    const response = await POST(makeRequest({}));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少冲突信息或解决方式');
  });

  it('resolution 为 hr_wins 时应返回对应消息', async () => {
    const conflict = makeConflict({ field: 'name', hrValue: '技术研发部', localValue: '技术部' });
    const response = await POST(makeRequest({ conflict, resolution: 'hr_wins' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.conflict.resolution).toBe('hr_wins');
    expect(payload.message).toContain('已采用 HR 系统的值');
    expect(payload.message).toContain('技术研发部');
  });

  it('resolution 为 local_wins 时应返回对应消息', async () => {
    const conflict = makeConflict({ field: 'name', hrValue: '技术研发部', localValue: '技术部' });
    const response = await POST(makeRequest({ conflict, resolution: 'local_wins' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.conflict.resolution).toBe('local_wins');
    expect(payload.message).toContain('已保留本地值');
  });

  it('resolution 为 merged 时应返回合并消息', async () => {
    const conflict = makeConflict({ field: 'description', hrValue: '负责技术研发', localValue: '技术部门' });
    const response = await POST(makeRequest({ conflict, resolution: 'merged' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.conflict.resolution).toBe('merged');
    expect(payload.message).toContain('已合并');
    expect(payload.message).toContain('保留本地值');
    expect(payload.message).toContain('技术部门');
  });

  it('position 类型冲突也应正确处理', async () => {
    const conflict = makeConflict({
      type: 'position',
      field: 'headcount',
      hrValue: '5',
      localValue: '3',
    });
    const response = await POST(makeRequest({ conflict, resolution: 'hr_wins' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.conflict.type).toBe('position');
    expect(payload.conflict.resolution).toBe('hr_wins');
    expect(payload.message).toContain('已采用 HR 系统的值');
    expect(payload.message).toContain('5');
  });
});
