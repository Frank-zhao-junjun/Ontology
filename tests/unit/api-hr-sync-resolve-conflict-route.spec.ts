import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import type { HRSyncConflict } from '@/types/ontology';
import { POST } from '@/app/api/hr-sync/resolve-conflict/route';

const baseConflict: HRSyncConflict = {
  field: 'departmentName',
  entityType: 'department',
  entityId: 'dept-1',
  localValue: '生产部',
  hrValue: 'Production Dept',
};

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/hr-sync/resolve-conflict', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/hr-sync/resolve-conflict (GS-04)', () => {
  it('returns 400 when conflict or resolution is missing', async () => {
    const response = await POST(jsonRequest({ conflict: baseConflict }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('缺少');
  });

  it('applies hr_wins resolution message', async () => {
    const response = await POST(
      jsonRequest({ conflict: baseConflict, resolution: 'hr_wins' }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.conflict.resolution).toBe('hr_wins');
    expect(payload.message).toContain('Production Dept');
  });

  it('applies local_wins resolution message', async () => {
    const response = await POST(
      jsonRequest({ conflict: baseConflict, resolution: 'local_wins' }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toContain('生产部');
  });

  it('applies merged resolution message', async () => {
    const response = await POST(
      jsonRequest({ conflict: baseConflict, resolution: 'merged' }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toContain('已合并');
    expect(payload.message).toContain('待确认');
  });
});
