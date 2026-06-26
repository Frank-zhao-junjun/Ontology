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

// GET /api/projects - 获取所有项目列表
export async function GET() {
  try {
    // 无 Supabase 环境时返回空列表
    if (!hasSupabaseConfig()) {
      console.log('Supabase not configured, returning empty project list');
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }
    
    // Supabase schema types not code-generated; use untyped client for ontology_projects table.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('ontology_projects')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw new Error(`获取项目列表失败: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: (data as OntologyProjectRow[] | null) || [] 
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
    if (!hasSupabaseConfig()) {
      console.log('Supabase not configured, skipping database save');
      return NextResponse.json({ 
        success: true, 
        data: { id: project.id } 
      });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ 
        success: true, 
        data: { id: project.id } 
      });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any)
      .from('ontology_projects')
      .insert({
        id: project.id,
        name: project.name,
        description: project.description || null,
        project_data: project,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`创建项目失败: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data as OntologyProjectRow 
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建项目失败' },
      { status: 500 }
    );
  }
}
