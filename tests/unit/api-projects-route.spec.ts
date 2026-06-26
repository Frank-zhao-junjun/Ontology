import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Domain, OntologyProject } from '@/types/ontology';

vi.mock('@/storage/database/supabase-client', () => ({
  hasSupabaseConfig: vi.fn(() => false),
  getSupabaseClient: vi.fn(() => null),
}));

import { GET, POST } from '@/app/api/projects/route';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

const minimalProject: OntologyProject = {
  id: 'proj-api-test',
  name: 'API 测试项目',
  domain,
  dataModel: null,
  behaviorModel: null,
  ruleModel: null,
  processModel: null,
  eventModel: null,
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
};

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Projects API Route (Q-T3b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('returns empty list when Supabase is not configured', async () => {
      const response = await GET();
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data).toEqual([]);
    });
  });

  describe('POST /api/projects', () => {
    it('accepts valid project without remote persistence', async () => {
      const response = await POST(
        jsonRequest('http://localhost/api/projects', 'POST', { project: minimalProject }),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data.id).toBe(minimalProject.id);
    });

    it('returns 400 when name or domain is missing', async () => {
      const response = await POST(
        jsonRequest('http://localhost/api/projects', 'POST', {
          project: { ...minimalProject, name: '', domain: undefined },
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.error).toContain('不能为空');
    });
  });
});
