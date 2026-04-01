import type { OntologyProject } from '@/types/ontology';

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  domain_id: string;
  domain_name: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 获取项目列表
export async function fetchProjects(): Promise<ProjectListItem[]> {
  const response = await fetch('/api/projects');
  const result: ApiResponse<ProjectListItem[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '获取项目列表失败');
  }
  
  return result.data || [];
}

// 获取单个项目
export async function fetchProject(id: string): Promise<OntologyProject> {
  const response = await fetch(`/api/projects/${id}`);
  const result: ApiResponse<OntologyProject> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '获取项目失败');
  }
  
  return result.data!;
}

// 创建项目
export async function createProject(project: OntologyProject): Promise<void> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  });
  
  const result: ApiResponse<unknown> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '创建项目失败');
  }
}

// 更新项目
export async function updateProject(project: OntologyProject): Promise<void> {
  const response = await fetch(`/api/projects/${project.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  });
  
  const result: ApiResponse<unknown> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '更新项目失败');
  }
}

// 删除项目
export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  });
  
  const result: ApiResponse<unknown> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '删除项目失败');
  }
}
