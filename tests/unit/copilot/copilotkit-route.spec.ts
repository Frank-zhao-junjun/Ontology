import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/copilotkit/route';

describe('GET /api/copilotkit', () => {
  it('TC-P0-03 returns ok status', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('copilotkit');
  });
});
