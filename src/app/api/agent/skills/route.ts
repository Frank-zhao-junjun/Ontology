import { NextRequest, NextResponse } from 'next/server';
import { superpowersManager, type SkillCategory } from '@/lib/superpowers/skills';
import { gstackManager, type GstackRole } from '@/lib/gstack/workflows';
import { ralphLoopManager } from '@/lib/ralph-loop/agent-loop';

const SKILL_CATEGORIES: readonly SkillCategory[] = [
  'planning',
  'coding',
  'testing',
  'review',
  'deployment',
  'documentation',
] as const;

function parseSkillCategory(value: string | null): SkillCategory | null {
  if (!value) return null;
  return (SKILL_CATEGORIES as readonly string[]).includes(value) ? (value as SkillCategory) : null;
}

const GSTACK_ROLES: readonly GstackRole[] = [
  'ceo',
  'designer',
  'eng_manager',
  'release_manager',
  'doc_engineer',
  'qa',
] as const;

function parseGstackRole(value: string | null): GstackRole | null {
  if (!value) return null;
  return (GSTACK_ROLES as readonly string[]).includes(value) ? (value as GstackRole) : null;
}

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
          const skillCategory = parseSkillCategory(category);
          if (!skillCategory) {
            return NextResponse.json(
              { success: false, error: '无效的技能分类' },
              { status: 400 }
            );
          }
          result = superpowersManager.getSkillsByCategory(skillCategory);
        } else {
          result = superpowersManager.getAvailableSkills();
        }
        break;

      case 'gstack':
        if (role) {
          const gstackRole = parseGstackRole(role);
          if (!gstackRole) {
            return NextResponse.json(
              { success: false, error: '无效的角色' },
              { status: 400 }
            );
          }
          result = gstackManager.getWorkflowsByRole(gstackRole);
        } else {
          result = gstackManager.getAvailableWorkflows();
        }
        break;

      case 'ralph':
        result = {
          state: ralphLoopManager.getState(),
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
export async function POST(_request: NextRequest) {
  void _request;

  return NextResponse.json(
    {
      success: false,
      error: '代理技能变更操作需要认证与用户级隔离，当前已禁用',
    },
    { status: 403 }
  );
}
