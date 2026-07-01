import { NextRequest, NextResponse } from 'next/server';
import { promises as fs, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * GET /api/mcp/projects/[id]     — 获取单个项目
 * PUT /api/mcp/projects/[id]     — 更新项目
 * DELETE /api/mcp/projects/[id]  — 删除项目
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const path = projectPath(id);
    if (!existsSync(path)) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 });
    }
    const raw = await fs.readFile(path, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '读取失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureStoreDir();
    const { id } = await params;
    const body = await request.json();
    const path = projectPath(id);

    const projectData = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(path, JSON.stringify(projectData, null, 2), 'utf-8');

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
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const path = projectPath(id);
    if (!existsSync(path)) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 });
    }
    await fs.unlink(path);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
