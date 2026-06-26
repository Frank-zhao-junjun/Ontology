import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/agent/skills/route';
import { ralphLoopManager } from '@/lib/ralph-loop/agent-loop';

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Agent Skills API Route (Q-T3b)', () => {
  beforeEach(() => {
    ralphLoopManager.reset();
  });

  describe('GET /api/agent/skills', () => {
    it('returns all skill providers by default', async () => {
      const request = new NextRequest('http://localhost/api/agent/skills');
      const response = await GET(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data.superpowers).toBeDefined();
      expect(payload.data.gstack).toBeDefined();
      expect(payload.data.ralph).toBeDefined();
    });

    it('filters superpowers by category', async () => {
      const request = new NextRequest('http://localhost/api/agent/skills?type=superpowers&category=planning');
      const response = await GET(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(payload.data)).toBe(true);
      expect(payload.data.every((skill: { category: string }) => skill.category === 'planning')).toBe(true);
    });

    it('returns 400 for invalid superpowers category', async () => {
      const request = new NextRequest('http://localhost/api/agent/skills?type=superpowers&category=invalid');
      const response = await GET(request);
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain('无效的技能分类');
    });

    it('returns ralph loop state and stories', async () => {
      const request = new NextRequest('http://localhost/api/agent/skills?type=ralph');
      const response = await GET(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.data.state).toBeDefined();
      expect(Array.isArray(payload.data.stories)).toBe(true);
    });
  });

  describe('POST /api/agent/skills', () => {
    it('adds a ralph user story', async () => {
      const response = await POST(
        jsonRequest('http://localhost/api/agent/skills', 'POST', {
          action: 'add-story',
          type: 'ralph',
          data: {
            title: '测试故事',
            description: '描述',
            acceptanceCriteria: ['AC1'],
            priority: 'high',
          },
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.storyId).toBeTruthy();
    });

    it('returns 400 for unknown action', async () => {
      const response = await POST(
        jsonRequest('http://localhost/api/agent/skills', 'POST', {
          action: 'unknown-action',
          type: 'ralph',
          data: {},
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error).toContain('未知的操作类型');
    });

    it('resets ralph loop state', async () => {
      await POST(
        jsonRequest('http://localhost/api/agent/skills', 'POST', {
          action: 'add-story',
          type: 'ralph',
          data: {
            title: '临时故事',
            description: '描述',
            acceptanceCriteria: ['AC1'],
            priority: 'medium',
          },
        }),
      );

      const response = await POST(
        jsonRequest('http://localhost/api/agent/skills', 'POST', {
          action: 'reset-loop',
          type: 'ralph',
        }),
      );
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(ralphLoopManager.getStories()).toHaveLength(0);
    });
  });
});
