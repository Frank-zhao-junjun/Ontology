import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Domain, OntologyProject } from '@/types/ontology';

vi.mock('@/storage/database/supabase-client', () => ({
  hasSupabaseConfig: vi.fn(() => false),
  getSupabaseClient: vi.fn(() => null),
}));

import { GET, PUT, DELETE } from '@/app/api/projects/[id]/route';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

const minimalProject: OntologyProject = {
  id: 'proj-detail-1',
  name: '详情测试项目',
  domain,
  dataModel: null,
  behaviorModel: null,
  ruleModel: null,
  processModel: null,
  eventModel: null,
  createdAt: '2026-06-27T00:00:00.000Z',
  updatedAt: '2026-06-27T00:00:00.000Z',
};

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Projects [id] API Route (GS-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/projects/[id]', () => {
    it('returns null data when Supabase is not configured', async () => {
      const response = await GET(
        new NextRequest('http://localhost/api/projects/proj-detail-1'),
        routeParams('proj-detail-1'),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data).toBeNull();
    });

    it('returns 400 when id is empty', async () => {
      const response = await GET(
        new NextRequest('http://localhost/api/projects/'),
        routeParams(''),
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.error).toContain('不能为空');
    });
  });

  describe('PUT /api/projects/[id]', () => {
    it('accepts update without remote persistence', async () => {
      const response = await PUT(
        jsonRequest('http://localhost/api/projects/proj-detail-1', 'PUT', {
          project: minimalProject,
        }),
        routeParams('proj-detail-1'),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data.id).toBe('proj-detail-1');
    });

    it('returns 400 when project body is missing', async () => {
      const response = await PUT(
        jsonRequest('http://localhost/api/projects/proj-detail-1', 'PUT', {}),
        routeParams('proj-detail-1'),
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain('不能为空');
    });
  });

  describe('DELETE /api/projects/[id]', () => {
    it('returns success when Supabase is not configured', async () => {
      const response = await DELETE(
        new NextRequest('http://localhost/api/projects/proj-detail-1', { method: 'DELETE' }),
        routeParams('proj-detail-1'),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data.id).toBe('proj-detail-1');
    });
  });
});
