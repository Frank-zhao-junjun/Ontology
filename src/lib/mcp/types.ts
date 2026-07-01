import type { OntologyProject } from '@/types/ontology';

// ── MCP Server Types ──────────────────────────────────────────────
export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export type ResourceDefinition = {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
};

export type ResourceReader = (uri: string) => Promise<string>;

export type PromptDefinition = {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
};

export type PromptHandler = (args: Record<string, string>) => Promise<{
  description: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: { type: 'text'; text: string };
  }>;
}>;

// ── Helpers ───────────────────────────────────────────────────────
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function readProjectInput(args: Record<string, unknown>): OntologyProject {
  const project = args['project'] as OntologyProject | string | undefined;
  if (!project) {
    throw new Error("'project' is required");
  }
  if (typeof project === 'string') {
    try {
      return JSON.parse(project) as OntologyProject;
    } catch {
      throw new Error("'project' is not valid JSON");
    }
  }
  return project;
}

// ── HTTP Project Store ────────────────────────────────────────────
const API_BASE = process.env['ONTOLOGY_API_BASE'] || `http://localhost:${process.env['DEPLOY_RUN_PORT'] || '5000'}`;

export const projectStore = {
  async list(): Promise<Array<{ id: string; name: string; updatedAt: string }>> {
    const res = await fetch(`${API_BASE}/api/mcp/projects`);
    if (!res.ok) throw new Error(`Failed to list projects: ${res.status}`);
    const json = await res.json() as { success: boolean; data: unknown };
    return json.data as Array<{ id: string; name: string; updatedAt: string }>;
  },

  async get(id: string): Promise<OntologyProject | null> {
    const res = await fetch(`${API_BASE}/api/mcp/projects/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to get project: ${res.status}`);
    const json = await res.json() as { success: boolean; data: OntologyProject };
    return json.data;
  },

  async save(id: string, name: string, data: OntologyProject): Promise<void> {
    const res = await fetch(`${API_BASE}/api/mcp/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, data }),
    });
    if (!res.ok) throw new Error(`Failed to save project: ${res.status}`);
  },

  async update(id: string, data: OntologyProject): Promise<void> {
    const res = await fetch(`${API_BASE}/api/mcp/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error(`Failed to update project: ${res.status}`);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/mcp/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete project: ${res.status}`);
  },
};
