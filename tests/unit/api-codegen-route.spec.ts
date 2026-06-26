import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/code-generator', () => ({
  generateCodePackage: vi.fn(() => ({
    files: [{ path: 'src/main.ts', content: 'console.log("test")' }],
    summary: { totalFiles: 1, totalLines: 1 },
  })),
}));

vi.mock('@/storage/database/supabase-client', () => ({
  hasSupabaseConfig: vi.fn(() => false),
  getSupabaseClient: vi.fn(() => null),
}));

import { POST } from '@/app/api/codegen/route';

describe('POST /api/codegen', () => {
  it('returns 404 when version is missing', async () => {
    const req = new NextRequest('http://localhost/api/codegen', {
      method: 'POST',
      body: JSON.stringify({ config: { targetLang: 'typescript' }, projectName: 'test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Version not found');
  });

  it('returns code package when version is provided', async () => {
    const req = new NextRequest('http://localhost/api/codegen', {
      method: 'POST',
      body: JSON.stringify({
        config: { targetLang: 'typescript' },
        projectName: 'test',
        version: { id: 'v1', projectId: 'p1', name: 'v1.0', confirmedAt: '2026-06-26T00:00:00.000Z' },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.package).toBeDefined();
    expect(body.package.files).toHaveLength(1);
  });
});
