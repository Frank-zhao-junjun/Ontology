import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/agent/skills/route';
import { ralphLoopManager } from '@/lib/ralph-loop/agent-loop';

describe('Agent Skills Route', () => {
  beforeEach(() => {
    ralphLoopManager.reset();
  });

  it('rejects unauthenticated mutating POST requests before changing shared agent state', async () => {
    const response = await POST(new NextRequest('http://localhost/api/agent/skills', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add-story',
        type: 'ralph',
        data: {
          title: 'Exploit shared state',
          description: 'This should not be accepted from an anonymous request',
          acceptanceCriteria: ['No singleton mutation'],
          priority: 'high',
          maxAttempts: 1,
        },
      }),
      headers: { 'content-type': 'application/json' },
    }));

    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(ralphLoopManager.getStories()).toHaveLength(0);
  });

  it('does not expose shared Ralph stories through unauthenticated GET responses', async () => {
    ralphLoopManager.addStory({
      title: 'Sensitive backlog item',
      description: 'Only the owning session should read this content',
      acceptanceCriteria: ['Keep story content private'],
      priority: 'high',
      maxAttempts: 1,
    });

    const response = await GET(new NextRequest('http://localhost/api/agent/skills?type=ralph'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({
      state: expect.objectContaining({
        totalStories: 1,
      }),
    });
    expect(payload.data.stories).toBeUndefined();
  });
});
