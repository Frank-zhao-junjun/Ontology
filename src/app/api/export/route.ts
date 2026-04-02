import { NextRequest, NextResponse } from 'next/server';
import { configExporter, ExportConfig } from '@/lib/configexporter';
import { useOntologyStore } from '@/store/ontology-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, config } = body as { 
      project: Parameters<typeof configExporter.export>[0];
      config: ExportConfig;
    };

    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目数据不能为空' },
        { status: 400 }
      );
    }

    // 导出配置包
    const result = await configExporter.export(project, config || { includeData: false });

    return NextResponse.json({
      success: true,
      data: {
        files: result.files,
        manifest: result.manifest,
        // 生成下载链接（实际项目中应该上传到存储服务）
        downloadUrl: `data:application/json;base64,${Buffer.from(JSON.stringify(result, null, 2)).toString('base64')}`,
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '导出失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取导出配置模板
    return NextResponse.json({
      success: true,
      data: {
        configTemplate: {
          includeData: false,
        },
        exportStructure: [
          'config.json',
          'README.md',
          'manifest.json',
          'data/entities.json',
          'data/state_machines.json',
          'data/rules.json',
          'data/events.json',
          'data/epc.json',
          'epc/{aggregate}.json',
          'epc/{aggregate}.md',
          'data/seed_data.json (可选)',
        ]
      }
    });

  } catch (error) {
    console.error('Export template error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取导出模板失败' },
      { status: 500 }
    );
  }
}
