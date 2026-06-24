import { NextRequest, NextResponse } from 'next/server';
import type { OntologyProject } from '@/types/ontology';

function hasSupabaseEnv(): boolean {
  return !!(process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY);
}

// GET /api/projects - 获取所有项目列表
export async function GET() {
  try {
    // 无 Supabase 环境时返回空列表
    if (!hasSupabaseEnv()) {
      console.log('Supabase not configured, returning empty project list');
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }

    // 延迟导入，避免在无 Supabase 环境时报错
    const { getSupabaseClient } = await import('@/storage/database/supabase-client');
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('ontology_projects')
      .select('id, name, description, domain_id, domain_name, created_at, updated_at')
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw new Error(`查询项目列表失败: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data || [] 
    });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取项目列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/projects - 创建新项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project } = body as { project: OntologyProject };
    
    if (!project || !project.name || !project.domain) {
      return NextResponse.json(
        { success: false, error: '项目名称和领域不能为空' },
        { status: 400 }
      );
    }
    
    // 无 Supabase 环境时成功返回（项目已在本地存储）
    if (!hasSupabaseEnv()) {
      console.log('Supabase not configured, skipping database save');
      return NextResponse.json({ 
        success: true, 
        data: { id: project.id } 
      });
    }

    // 延迟导入，避免在无 Supabase 环境时报错
    const { getSupabaseClient } = await import('@/storage/database/supabase-client');
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('ontology_projects')
      .insert({
        id: project.id,
        name: project.name,
        description: project.description || null,
        domain_id: project.domain.id,
        domain_name: project.domain.name,
        project_data: project,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`创建项目失败: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data 
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建项目失败' },
      { status: 500 }
    );
  }
}
