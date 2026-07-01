import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promises as fs } from 'node:fs';

/**
 * GET /api/mcp/projects          — 列出所有 MCP 持久化的项目
 * POST /api/mcp/projects         — 创建/更新项目（全量覆盖）
 *
 * GET /api/mcp/projects/[id]     — 获取单个项目
 * PUT /api/mcp/projects/[id]     — 更新项目
 * DELETE /api/mcp/projects/[id]  — 删除项目
 *
 * 数据存储在服务端文件系统 /tmp/ontology-mcp-store/
 * 供 MCP Server（Stdio transport）远程调用
 */

const STORE_DIR = resolve('/tmp/ontology-mcp-store');

function ensureStoreDir() {
  if (!existsSync(STORE_DIR)) {
    mkdirSync(STORE_DIR, { recursive: true });
  }
}

function projectPath(id: string): string {
  return resolve(STORE_DIR, `${id}.json`);
}

export async function GET() {
  try {
    ensureStoreDir();
    const dir = await fs.readdir(STORE_DIR);
    const projects: Array<{ id: string; name: string; updatedAt: string }> = [];
    for (const file of dir) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(resolve(STORE_DIR, file), 'utf-8');
        const data = JSON.parse(raw);
        projects.push({
          id: data.id || file.replace('.json', ''),
          name: data.name || 'Unknown',
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } catch {
        // skip invalid files
      }
    }
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '读取失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureStoreDir();
    const body = await request.json();
    const { id, name, data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: '缺少 data' }, { status: 400 });
    }

    const projectData = {
      ...data,
      id,
      name: name || data.name || 'Untitled',
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(projectPath(id), JSON.stringify(projectData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      data: {
        id: projectData.id,
        name: projectData.name,
        updatedAt: projectData.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '保存失败' },
      { status: 500 }
    );
  }
}
