import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import type { HRSyncConfig, HRSyncResult } from '@/types/ontology';
import { GET as getConfig, PUT as putConfig } from '@/app/api/hr-sync/config/route';
import { POST as triggerSync } from '@/app/api/hr-sync/trigger/route';
import { GET as getHistory, POST as postHistory } from '@/app/api/hr-sync/history/route';

const validConfig: HRSyncConfig = {
  enabled: true,
  source: 'feishu',
  syncInterval: 'manual',
  fieldMapping: { department: {}, position: {} },
  conflictStrategy: 'hr_wins',
  syncScope: {
    syncDepartments: true,
    syncPositions: true,
    syncResponsibilities: false,
    includeInactive: false,
  },
};

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  });
}

describe('HR Sync API Routes (Q-T3b)', () => {
  beforeEach(async () => {
    await putConfig(jsonRequest('http://localhost/api/hr-sync/config', 'PUT', validConfig));
  });

  describe('GET/PUT /api/hr-sync/config', () => {
    it('returns stored config after PUT', async () => {
      const response = await getConfig();
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.source).toBe('feishu');
      expect(payload.enabled).toBe(true);
    });

    it('returns 400 when source is missing', async () => {
      const response = await putConfig(
        jsonRequest('http://localhost/api/hr-sync/config', 'PUT', { enabled: true }),
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain('缺少');
    });
  });

  describe('POST /api/hr-sync/trigger', () => {
    it('returns sync result summary for valid payload', async () => {
      const response = await triggerSync(
        jsonRequest('http://localhost/api/hr-sync/trigger', 'POST', {
          config: validConfig,
          departments: [{ id: 'd1', name: '生产部', nameEn: 'Prod', type: 'department', status: 'active' }],
          positions: [{ id: 'p1', name: '主管', nameEn: 'Mgr', departmentId: 'd1', status: 'active' }],
        }),
      );
      const payload = await response.json() as HRSyncResult;

      expect(response.status).toBe(200);
      expect(payload.status).toBe('success');
      expect(payload.summary.departments.total).toBe(1);
      expect(payload.summary.positions.total).toBe(1);
      expect(payload.syncId).toBeTruthy();
    });

    it('returns 400 when config is missing', async () => {
      const response = await triggerSync(
        jsonRequest('http://localhost/api/hr-sync/trigger', 'POST', { departments: [] }),
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain('缺少同步配置');
    });
  });

  describe('GET/POST /api/hr-sync/history', () => {
    it('records and returns sync history', async () => {
      const result: HRSyncResult = {
        syncId: 'sync-test-1',
        triggeredAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'success',
        source: 'feishu',
        summary: {
          departments: { total: 0, created: 0, updated: 0, deactivated: 0, unchanged: 0 },
          positions: { total: 0, created: 0, updated: 0, deactivated: 0, unchanged: 0 },
        },
        conflicts: [],
        errors: [],
      };

      const postResponse = await postHistory(
        jsonRequest('http://localhost/api/hr-sync/history', 'POST', result),
      );
      expect(postResponse.status).toBe(200);

      const getResponse = await getHistory();
      const history = await getResponse.json() as HRSyncResult[];

      expect(getResponse.status).toBe(200);
      expect(history.some((item) => item.syncId === 'sync-test-1')).toBe(true);
    });

    it('returns 400 when sync result is incomplete', async () => {
      const response = await postHistory(
        jsonRequest('http://localhost/api/hr-sync/history', 'POST', { status: 'success' }),
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain('缺少同步结果');
    });
  });
});
