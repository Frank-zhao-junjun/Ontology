import { NextRequest, NextResponse } from 'next/server';
import type { OntologyProject } from '@/types/ontology';
import { generateAndApplyEpcMetamodels } from '@/lib/business-chain/epc-auto-generator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/epc-processes/auto-generate
 * 为指定 EPC 流程自动生成 8 个元模型草案并应用到项目中。
 *
 * 请求体: { project: OntologyProject, epcId: string }
 * 响应: { success: true, data: OntologyProject }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { project, epcId } = body as { project?: OntologyProject; epcId?: string };

    if (!project || !project.id) {
      return NextResponse.json({ success: false, error: '缺少 project 参数' }, { status: 400 });
    }
    if (!epcId || typeof epcId !== 'string') {
      return NextResponse.json({ success: false, error: '缺少 epcId 参数' }, { status: 400 });
    }

    const updatedProject = await generateAndApplyEpcMetamodels(project, epcId, {
      headers: request.headers,
    });

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error) {
    const message = error instanceof Error ? error.message : '自动生成元模型失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
