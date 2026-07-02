import { NextRequest, NextResponse } from 'next/server';
import type { OntologyProject } from '@/types/ontology';
import { buildSkillZip, type SkillExportScope } from '@/lib/skill-export';

const VALID_SCOPES: SkillExportScope[] = ['all', 'data', 'behavior', 'rule', 'process', 'event'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, scope = 'all', includeExamples = true, includeSemanticLayer = true } = body;

    if (!project || typeof project !== 'object') {
      return NextResponse.json(
        { success: false, error: 'MISSING_PROJECT', message: '请求体中缺少 project 对象' },
        { status: 400 }
      );
    }

    if (!VALID_SCOPES.includes(scope)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_SCOPE', message: '导出范围无效' },
        { status: 400 }
      );
    }

    const { buffer, filename, projectStatus } = await buildSkillZip(project as OntologyProject, {
      scope,
      includeExamples,
      includeSemanticLayer,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Project-Status': projectStatus,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败';
    if (message === 'EMPTY_SCOPE') {
      return NextResponse.json(
        { success: false, error: 'EMPTY_SCOPE', message: '导出范围为空' },
        { status: 400 }
      );
    }
    console.error('Skill export error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message },
      { status: 500 }
    );
  }
}
