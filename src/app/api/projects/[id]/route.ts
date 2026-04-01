import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { OntologyProject } from '@/types/ontology';

// GET /api/projects/[id] - 获取单个项目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('ontology_projects')
      .select('project_data')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      throw new Error(`查询项目失败: ${error.message}`);
    }
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data.project_data as OntologyProject 
    });
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取项目失败' },
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
    const { id } = await params;
    const body = await request.json();
    const { project } = body as { project: OntologyProject };
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目数据不能为空' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('ontology_projects')
      .update({
        name: project.name,
        description: project.description || null,
        domain_id: project.domain.id,
        domain_name: project.domain.name,
        project_data: project,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      throw new Error(`更新项目失败: ${error.message}`);
    }
    
    if (!data) {
      // 如果更新失败（可能是项目不存在），尝试插入
      const { data: insertData, error: insertError } = await client
        .from('ontology_projects')
        .insert({
          id: project.id,
          name: project.name,
          description: project.description || null,
          domain_id: project.domain.id,
          domain_name: project.domain.name,
          project_data: project,
          created_at: project.createdAt,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();
      
      if (insertError) {
        throw new Error(`创建项目失败: ${insertError.message}`);
      }
      
      return NextResponse.json({ 
        success: true, 
        data: insertData 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data 
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
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('ontology_projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`删除项目失败: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除项目失败' },
      { status: 500 }
    );
  }
}
