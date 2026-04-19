import { NextRequest, NextResponse } from 'next/server';
import { superpowersManager } from '@/lib/superpowers/skills';
import { gstackManager } from '@/lib/gstack/workflows';
import { ralphLoopManager, UserStory } from '@/lib/ralph-loop/agent-loop';

/**
 * GET /api/agent/skills
 * 获取所有可用的代理技能
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'superpowers' | 'gstack' | 'ralph'
    const category = searchParams.get('category');
    const role = searchParams.get('role');

    let result: unknown;

    switch (type) {
      case 'superpowers':
        if (category) {
          result = superpowersManager.getSkillsByCategory(category as any);
        } else {
          result = superpowersManager.getAvailableSkills();
        }
        break;

      case 'gstack':
        if (role) {
          result = gstackManager.getWorkflowsByRole(role as any);
        } else {
          result = gstackManager.getAvailableWorkflows();
        }
        break;

      case 'ralph':
        result = {
          state: ralphLoopManager.getState(),
          stories: ralphLoopManager.getStories(),
        };
        break;

      default:
        result = {
          superpowers: superpowersManager.getAvailableSkills(),
          gstack: gstackManager.getAvailableWorkflows(),
          ralph: ralphLoopManager.getState(),
        };
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get agent skills error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取代理技能失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/skills
 * 执行代理技能或添加用户故事
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, data } = body;

    switch (action) {
      case 'toggle-skill':
        if (type === 'superpowers') {
          const { skillId, enabled } = data;
          const success = superpowersManager.toggleSkill(skillId, enabled);
          return NextResponse.json({ success });
        }
        break;

      case 'add-story':
        if (type === 'ralph') {
          const storyId = ralphLoopManager.addStory(data);
          return NextResponse.json({
            success: true,
            storyId,
          });
        }
        break;

      case 'add-stories':
        if (type === 'ralph') {
          const storyIds = ralphLoopManager.addStories(data);
          return NextResponse.json({
            success: true,
            storyIds,
          });
        }
        break;

      case 'start-loop':
        if (type === 'ralph') {
          // Ralph Loop需要异步执行，这里只返回启动确认
          return NextResponse.json({
            success: true,
            message: 'Ralph Loop已启动',
            state: ralphLoopManager.getState(),
          });
        }
        break;

      case 'pause-loop':
        if (type === 'ralph') {
          ralphLoopManager.pause();
          return NextResponse.json({
            success: true,
            state: ralphLoopManager.getState(),
          });
        }
        break;

      case 'stop-loop':
        if (type === 'ralph') {
          ralphLoopManager.stop();
          return NextResponse.json({
            success: true,
            state: ralphLoopManager.getState(),
          });
        }
        break;

      case 'reset-loop':
        if (type === 'ralph') {
          ralphLoopManager.reset();
          return NextResponse.json({
            success: true,
            state: ralphLoopManager.getState(),
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: '未知的操作类型' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: '无效的请求参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Agent skills action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '操作失败' },
      { status: 500 }
    );
  }
}
