import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import type { HRSyncResult } from '@/types/ontology';

function makeValidResult(overrides: Partial<HRSyncResult> = {}): HRSyncResult {
  return {
    syncId: 'test-sync-001',
    triggeredAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'success',
    source: 'feishu',
    summary: {
      departments: { total: 5, created: 3, updated: 1, deactivated: 0, unchanged: 1 },
      positions: { total: 10, created: 7, updated: 2, deactivated: 0, unchanged: 1 },
    },
    conflicts: [],
    errors: [],
    ...overrides,
  };
}

function makeGetRequest(): NextRequest {
  return new NextRequest('http://localhost/api/hr-sync/history');
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/hr-sync/history', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HR Sync History Route (GET /api/hr-sync/history)', () => {
  it('同步历史为空时应返回空数组', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(0);
  });

  it('添加记录后 GET 应返回包含该记录的数组', async () => {
    const result = makeValidResult({ syncId: 'sync-abc' });
    await POST(makePostRequest(result));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBeGreaterThanOrEqual(1);
    // The most recent record should be first
    expect(payload[0].syncId).toBe('sync-abc');
  });

  it('多次添加后按时间倒序排列', async () => {
    await POST(makePostRequest(makeValidResult({ syncId: 'sync-001' })));
    await POST(makePostRequest(makeValidResult({ syncId: 'sync-002' })));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload[0].syncId).toBe('sync-002');
    expect(payload[1].syncId).toBe('sync-001');
  });

  it('超过 100 条时只保留最近 100 条', async () => {
    // Add 101 records
    for (let i = 0; i < 101; i++) {
      await POST(makePostRequest(makeValidResult({ syncId: `sync-${i}` })));
    }

    const response = await GET();
    const payload = await response.json();

    expect(payload).toHaveLength(100);
    expect(payload[0].syncId).toBe('sync-100');
  });
});

describe('HR Sync History Route (POST /api/hr-sync/history)', () => {
  it('缺少 syncId 时应返回 400', async () => {
    const invalid = makeValidResult({ syncId: undefined as unknown as string });
    const response = await POST(makePostRequest(invalid));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少同步结果数据');
  });

  it('缺少整个 body 时应返回 400', async () => {
    const response = await POST(makePostRequest(null));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少同步结果数据');
  });

  it('有效结果应返回成功', async () => {
    const result = makeValidResult();
    const response = await POST(makePostRequest(result));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });
});
