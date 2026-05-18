import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { superpowersManager, type AgentSkill } from '@/lib/superpowers/skills';

const originalWriteToken = process.env.AGENT_SKILLS_WRITE_TOKEN;

function createJsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/agent/skills', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('Agent Skills Route', () => {
  afterEach(() => {
    if (originalWriteToken === undefined) {
      delete process.env.AGENT_SKILLS_WRITE_TOKEN;
    } else {
      process.env.AGENT_SKILLS_WRITE_TOKEN = originalWriteToken;
    }
    superpowersManager.toggleSkill('entity-design', true);
  });

  it('POST 未配置写入令牌时不应修改全局技能状态', async () => {
    delete process.env.AGENT_SKILLS_WRITE_TOKEN;

    const response = await POST(createJsonRequest({
      action: 'toggle-skill',
      type: 'superpowers',
      data: { skillId: 'entity-design', enabled: false },
    }));

    expect(response.status).toBe(403);

    const skillsResponse = await GET(new NextRequest('http://localhost/api/agent/skills?type=superpowers'));
    const payload = await skillsResponse.json() as { data: AgentSkill[] };
    expect(payload.data.some((skill) => skill.id === 'entity-design')).toBe(true);
  });
});
