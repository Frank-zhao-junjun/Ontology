import { NextRequest, NextResponse } from 'next/server';
import type { OntologyProject } from '@/types/ontology';
import { hasSupabaseConfig, getSupabaseClient } from '@/storage/database/supabase-client';

interface OntologyProjectRow {
  id: string;
  name: string;
  description: string | null;
  project_data: OntologyProject;
  created_at: string;
  updated_at: string;
}

// GET /api/projects/[id] - 获取单个项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '项目 ID 不能为空' },
        { status: 400 }
      );
    }
    
    // 无 Supabase 环境时返回成功（项目应在本地存储）
    if (!hasSupabaseConfig()) {
      console.log('Supabase not configured, project should be in local storage');
      return NextResponse.json({ 
        success: true, 
        data: null 
      });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ 
        success: true, 
        data: null 
      });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('ontology_projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`获取项目详情失败: ${error.message}`);
    }
    
    const row = data as OntologyProjectRow | null;
    return NextResponse.json({ 
      success: true, 
      data: row ? row.project_data : null 
    });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取项目详情失败' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { project } = body as { project: OntologyProject };
    
    if (!id || !project) {
      return NextResponse.json(
        { success: false, error: '项目 ID 和数据不能为空' },
        { status: 400 }
      );
    }
    
    // 无 Supabase 环境时成功返回（项目已在本地存储）
    if (!hasSupabaseConfig()) {
      console.log('Supabase not configured, skipping database update');
      return NextResponse.json({ 
        success: true, 
        data: { id } 
      });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ 
        success: true, 
        data: { id } 
      });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('ontology_projects')
      .update({
        name: project.name,
        description: project.description || null,
        project_data: project,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`更新项目失败: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data as OntologyProjectRow 
    });
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新项目失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '项目 ID 不能为空' },
        { status: 400 }
      );
    }
    
    // 无 Supabase 环境时成功返回（项目已在本地存储）
    if (!hasSupabaseConfig()) {
      console.log('Supabase not configured, skipping database delete');
      return NextResponse.json({ 
        success: true, 
        data: { id } 
      });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ 
        success: true, 
        data: { id } 
      });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('ontology_projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`删除项目失败: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { id } 
    });
  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除项目失败' },
      { status: 500 }
    );
  }
}
