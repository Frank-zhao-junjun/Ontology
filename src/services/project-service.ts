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

type QueuedProjectUpdate = {
  project: OntologyProject;
  waiters: Array<{
    resolve: () => void;
    reject: (error: unknown) => void;
  }>;
};

type ProjectUpdateQueue = {
  inFlight: Promise<void> | null;
  queued: QueuedProjectUpdate | null;
};

const projectUpdateQueues = new Map<string, ProjectUpdateQueue>();

async function persistProjectUpdate(project: OntologyProject): Promise<void> {
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

function getProjectUpdateQueue(projectId: string): ProjectUpdateQueue {
  const existingQueue = projectUpdateQueues.get(projectId);
  if (existingQueue) {
    return existingQueue;
  }

  const queue: ProjectUpdateQueue = {
    inFlight: null,
    queued: null,
  };
  projectUpdateQueues.set(projectId, queue);
  return queue;
}

function startProjectUpdate(
  project: OntologyProject,
  queue: ProjectUpdateQueue,
  waiters?: QueuedProjectUpdate['waiters'],
): Promise<void> {
  queue.inFlight = persistProjectUpdate(project)
    .then(() => {
      waiters?.forEach(({ resolve }) => resolve());
    })
    .catch((error) => {
      waiters?.forEach(({ reject }) => reject(error));
      if (!waiters) {
        throw error;
      }
    })
    .finally(() => {
      const nextUpdate = queue.queued;
      queue.queued = null;

      if (nextUpdate) {
        void startProjectUpdate(nextUpdate.project, queue, nextUpdate.waiters);
      } else {
        queue.inFlight = null;
        projectUpdateQueues.delete(project.id);
      }
    });

  return queue.inFlight;
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
  const queue = getProjectUpdateQueue(project.id);

  if (queue.inFlight) {
    return new Promise<void>((resolve, reject) => {
      if (queue.queued) {
        queue.queued.project = project;
        queue.queued.waiters.push({ resolve, reject });
        return;
      }

      queue.queued = {
        project,
        waiters: [{ resolve, reject }],
      };
    });
  }

  return startProjectUpdate(project, queue);
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
