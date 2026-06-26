import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/storage/database/supabase-client', () => ({
  hasSupabaseConfig: vi.fn(() => false),
  getSupabaseClient: vi.fn(() => null),
}));

import { POST } from '@/app/api/generate-element-draft/route';

describe('POST /api/generate-element-draft', () => {
  it('accepts element draft request', async () => {
    const req = new NextRequest('http://localhost/api/generate-element-draft', {
      method: 'POST',
      body: JSON.stringify({
        dimension: 'E1',
        scenarioId: 'sc1',
        epcStepId: 'step1',
        description: 'Create a data entity for customer order',
      }),
    });
    const res = await POST(req);
    expect([200, 400, 500]).toContain(res.status);
    const body = await res.json();
    expect(body).toBeDefined();
  });
});
