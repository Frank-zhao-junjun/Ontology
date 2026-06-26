import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock dependencies ====================

const mockSkills = vi.hoisted(() => [
  { id: 'entity-design', name: '实体设计专家', category: 'planning', enabled: true },
  { id: 'code-gen', name: '代码生成器', category: 'coding', enabled: true },
]);

const mockWorkflows = vi.hoisted(() => [
  { id: 'plan-review', name: '计划评审工作流', role: 'ceo', enabled: true },
  { id: 'code-review', name: '代码评审工作流', role: 'eng_manager', enabled: true },
]);

const mockRalphState = vi.hoisted(() => ({
  iteration: 0,
  totalStories: 0,
  completedStories: 0,
  failedStories: 0,
  inProgressStories: 0,
  status: 'idle',
}));

const mockRalphStories = vi.hoisted(() => []);

vi.mock('@/lib/superpowers/skills', () => ({
  superpowersManager: {
    getAvailableSkills: vi.fn(() => mockSkills),
    getSkillsByCategory: vi.fn((category: string) =>
      mockSkills.filter((s: { category: string }) => s.category === category),
    ),
    toggleSkill: vi.fn((_skillId: string, enabled: boolean) => {
      const skill = mockSkills.find((s: { id: string }) => s.id === _skillId);
      if (skill) {
        skill.enabled = enabled;
        return true;
      }
      return false;
    }),
  },
}));

vi.mock('@/lib/gstack/workflows', () => ({
  gstackManager: {
    getAvailableWorkflows: vi.fn(() => mockWorkflows),
    getWorkflowsByRole: vi.fn((role: string) =>
      mockWorkflows.filter((w: { role: string }) => w.role === role),
    ),
  },
}));

vi.mock('@/lib/ralph-loop/agent-loop', () => ({
  ralphLoopManager: {
    getState: vi.fn(() => mockRalphState),
    getStories: vi.fn(() => mockRalphStories),
    addStory: vi.fn((data: unknown) => {
      const id = 'story-mock-1';
      return id;
    }),
    addStories: vi.fn((data: unknown[]) => data.map((_, i) => `story-mock-${i + 1}`)),
    pause: vi.fn(() => {
      mockRalphState.status = 'paused';
    }),
    stop: vi.fn(() => {
      mockRalphState.status = 'idle';
    }),
    reset: vi.fn(() => {
      mockRalphState.status = 'idle';
      mockRalphState.iteration = 0;
    }),
  },
}));

import { GET, POST } from './route';

// ==================== Helper ====================

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: 'GET' });
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/agent/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ==================== Tests ====================

describe('GET /api/agent/skills', () => {
  beforeEach(() => {
    mockRalphState.status = 'idle';
    mockRalphState.iteration = 0;
  });

  // ==================== 1. Default (no type) ====================

  it('无 type 参数时返回所有技能聚合', async () => {
    const request = makeGetRequest('http://localhost/api/agent/skills');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toBeDefined();
    expect(payload.data.superpowers).toEqual(mockSkills);
    expect(payload.data.gstack).toEqual(mockWorkflows);
    expect(payload.data.ralph).toEqual(mockRalphState);
  });

  // ==================== 2. type=superpowers ====================

  it('type=superpowers 时返回所有 superpowers 技能', async () => {
    const request = makeGetRequest('http://localhost/api/agent/skills?type=superpowers');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockSkills);
  });

  // ==================== 3. type=superpowers with category ====================

  it('type=superpowers&category=planning 时过滤技能分类', async () => {
    const request = makeGetRequest('http://localhost/api/agent/skills?type=superpowers&category=planning');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].id).toBe('entity-design');
  });

  // ==================== 4. Invalid category ====================

  it('无效的分类值返回 400', async () => {
    const request = makeGetRequest('http://localhost/api/agent/skills?type=superpowers&category=invalid_cat');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('无效的技能分类');
  });

  // ==================== 5. type=gstack with role filtering ====================

  it('type=gstack&role=ceo 时过滤工作流', async () => {
    const request = makeGetRequest('http://localhost/api/agent/skills?type=gstack&role=ceo');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].id).toBe('plan-review');
  });

  it('无效的角色值返回 400', async () => {
    const request = makeGetRequest('http://localhost/api/agent/skills?type=gstack&role=invalid_role');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('无效的角色');
  });

  it('type=ralph 时返回 ralph 循环状态和故事', async () => {
    const request = makeGetRequest('http://localhost/api/agent/skills?type=ralph');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.state).toEqual(mockRalphState);
    expect(payload.data.stories).toEqual(mockRalphStories);
  });
});

describe('POST /api/agent/skills', () => {
  beforeEach(() => {
    mockRalphState.status = 'idle';
    mockSkills.forEach((s: { enabled: boolean }) => (s.enabled = true));
  });

  // ==================== 1. toggle-skill ====================

  it('toggle-skill 操作切换技能启用状态', async () => {
    const request = makePostRequest({
      action: 'toggle-skill',
      type: 'superpowers',
      data: { skillId: 'entity-design', enabled: false },
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });

  // ==================== 2. add-story ====================

  it('add-story 操作添加用户故事', async () => {
    const request = makePostRequest({
      action: 'add-story',
      type: 'ralph',
      data: { title: '测试故事', description: '描述', priority: 'high' },
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.storyId).toBeDefined();
  });

  // ==================== 3. add-stories ====================

  it('add-stories 操作批量添加用户故事', async () => {
    const request = makePostRequest({
      action: 'add-stories',
      type: 'ralph',
      data: [
        { title: '故事1', description: '描述1', priority: 'high' },
        { title: '故事2', description: '描述2', priority: 'medium' },
      ],
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.storyIds).toHaveLength(2);
  });

  // ==================== 4. start-loop ====================

  it('start-loop 操作返回启动确认', async () => {
    const request = makePostRequest({
      action: 'start-loop',
      type: 'ralph',
      data: {},
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.message).toContain('Ralph Loop');
    expect(payload.state).toBeDefined();
  });

  // ==================== 5. pause / stop / reset 循环 ====================

  it('pause-loop 操作暂停循环', async () => {
    const request = makePostRequest({
      action: 'pause-loop',
      type: 'ralph',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.state.status).toBe('paused');
  });

  // ==================== 6. Unknown action ====================

  it('未知操作类型返回 400', async () => {
    const request = makePostRequest({
      action: 'unknown-action',
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('未知的操作类型');
  });

  // ==================== 7. Wrong type for action ====================

  it('toggle-skill 非 superpowers 类型时不报错但返回 400', async () => {
    const request = makePostRequest({
      action: 'toggle-skill',
      type: 'gstack',
      data: { skillId: 'test', enabled: false },
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('无效的请求参数');
  });
});
