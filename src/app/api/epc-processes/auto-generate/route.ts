import { NextRequest, NextResponse } from 'next/server';
import type { OntologyProject } from '@/types/ontology';
import { generateAndApplyEpcMetamodels } from '@/lib/business-chain/epc-auto-generator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/epc-processes/auto-generate
 * 为指定 EPC 流程自动生成 8 个元模型草案并应用到项目中。
 *
 * 请求体: { project: OntologyProject, epcId: string, trigger?: 'creation' | 'confirm' }
 * - trigger='creation'（默认）：基于 EPC 名称/描述生成
 * - trigger='confirm'：EPC 确认后，从步骤内容提取元数据生成
 *
 * 响应: { success: true, data: OntologyProject }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { project, epcId, trigger } = body as { project?: OntologyProject; epcId?: string; trigger?: string };

    if (!project || !project.id) {
      return NextResponse.json({ success: false, error: '缺少 project 参数' }, { status: 400 });
    }
    if (!epcId || typeof epcId !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 epcId 参数' }, { status: 400 });
    }

    const updatedProject = await generateAndApplyEpcMetamodels(project, epcId, {
      headers: request.headers,
      trigger: trigger === 'confirm' ? 'confirm' : 'creation',
    });

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error) {
    const message = error instanceof Error ? error.message : '自动生成元模型失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
