import { NextRequest, NextResponse } from 'next/server';
import { generateCodePackage } from '@/lib/code-generator';
import { useOntologyStore } from '@/store/ontology-store';
import type { ProjectVersion, PublishConfig } from '@/types/ontology';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { versionId, config, projectName } = body as {
      versionId: string;
      config: PublishConfig;
      projectName: string;
    };

    // 从请求体中获取版本数据（前端传入）
    const version = body.version as ProjectVersion;
    
    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // 生成代码包
    const codePackage = generateCodePackage(version, config, projectName);

    // 返回代码包（前端下载）
    return NextResponse.json({
      success: true,
      package: codePackage,
      downloadUrl: `data:application/json;base64,${Buffer.from(
        JSON.stringify(codePackage, null, 2)
      ).toString('base64')}`,
    });
  } catch (error) {
    console.error('Code generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Code generation failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 返回生成器信息
  return NextResponse.json({
    name: 'Ontology Code Generator',
    version: '2.0.0',
    capabilities: [
      'flask-backend',
      'react-frontend',
      'sqlite-database',
      'docker-compose',
      'ai-orchestrator',
    ],
  });
}
