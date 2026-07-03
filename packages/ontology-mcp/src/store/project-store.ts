/**
 * HTTP-backed project store for the MCP server.
 *
 * All project data is persisted server-side via the deployed API:
 *   GET    /api/mcp/projects        — list all projects
 *   POST   /api/mcp/projects        — create/upsert project
 *   GET    /api/mcp/projects/[id]   — get project
 *   PUT    /api/mcp/projects/[id]   — update project
 *   DELETE /api/mcp/projects/[id]   — delete project
 *
 * The API base URL is configured via ONTOLOGY_API_BASE env var.
 * Falls back to http://localhost:${DEPLOY_RUN_PORT} for local dev.
 */

export interface StoredProject {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  updatedAt: string;
}

function getApiBase(): string {
  const envBase = process.env.ONTOLOGY_API_BASE;
  if (envBase) return envBase.replace(/\/$/, '');
  const port = process.env.DEPLOY_RUN_PORT || '5000';
  return `http://localhost:${port}`;
}

async function httpGet(path: string): Promise<unknown> {
  const res = await fetch(`${getApiBase()}${path}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

async function httpPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function httpPut(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function httpDelete(path: string): Promise<unknown> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export class ProjectStore {
  /** Get a project by id from the remote API. Returns undefined if not found. */
  async get(id: string): Promise<StoredProject | undefined> {
    try {
      const res = (await httpGet(`/api/mcp/projects/${id}`)) as {
        success: boolean;
        data?: StoredProject['data'];
        error?: string;
      };
      if (!res.success || !res.data) return undefined;
      const data = res.data;
      return {
        id: data.id || id,
        name: data.name || 'Untitled',
        data,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    } catch {
      return undefined;
    }
  }

  /** Create or overwrite a project via the remote API. */
  async set(project: StoredProject): Promise<void> {
    await httpPost('/api/mcp/projects', {
      id: project.id,
      name: project.name,
      data: project.data,
    });
  }

  /** Delete a project by id. Returns true if existed. */
  async delete(id: string): Promise<boolean> {
    try {
      await httpDelete(`/api/mcp/projects/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /** Auto-generate 8 metamodel drafts for an EPC process and return the updated project. */
  async autoGenerateEpcMetamodels(project: StoredProject['data'], epcId: string): Promise<StoredProject['data']> {
    const res = (await httpPost('/api/epc-processes/auto-generate', { project, epcId })) as {
      success: boolean;
      data?: StoredProject['data'];
      error?: string;
    };
    if (!res.success || !res.data) {
      throw new Error(res.error || '自动生成元模型失败');
    }
    return res.data;
  }

  /** List all project summaries (no full data). */
  async list(): Promise<{ id: string; name: string; updatedAt: string }[]> {
    try {
      const res = (await httpGet('/api/mcp/projects')) as {
        success: boolean;
        data?: Array<{ id: string; name: string; updatedAt: string }>;
        error?: string;
      };
      if (!res.success || !Array.isArray(res.data)) return [];
      return res.data;
    } catch {
      return [];
    }
  }

  /** Update a project via PUT (partial update not supported — full replace). */
  async update(id: string, data: StoredProject['data']): Promise<void> {
    await httpPut(`/api/mcp/projects/${id}`, data);
  }
}

/** Singleton store instance shared across the MCP server. */
export const projectStore = new ProjectStore();
