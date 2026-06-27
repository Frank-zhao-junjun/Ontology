import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/export/route';
import { createFrozenProject } from './test-helpers';

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/export', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/export (GS-04)', () => {
  it('returns 400 when project is missing', async () => {
    const response = await POST(jsonRequest({ config: { includeData: false } }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('不能为空');
  });

  it('exports config package for valid project', async () => {
    const project = createFrozenProject('1.0.0');
    const response = await POST(
      jsonRequest({ project, config: { includeData: false } }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.data.files)).toBe(true);
    expect(payload.data.manifest).toBeTruthy();
    expect(payload.data.downloadUrl).toContain('data:application/json;base64,');
  });

  it('defaults config when omitted', async () => {
    const project = createFrozenProject('1.0.0');
    const response = await POST(jsonRequest({ project }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.files.length).toBeGreaterThan(0);
  });
});
