/**
 * Lightweight in-memory project store for the MCP server.
 *
 * Maintains a Map<string, OntologyProject> and supports
 * JSON-file load/save for persistence across restarts.
 */

import { readFile, writeFile, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// We cannot import OntologyProject directly without the `@/` path alias,
// so we define a minimal store interface using unknown and let the
// callers cast via the core module's type.
export interface StoredProject {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  updatedAt: string;
}

export class ProjectStore {
  private projects = new Map<string, StoredProject>();
  private storeDir: string;

  constructor(storeDir?: string) {
    this.storeDir = storeDir ?? resolve(process.cwd(), '.ontology-store');
    if (!existsSync(this.storeDir)) {
      mkdirSync(this.storeDir, { recursive: true });
    }
  }

  /** Get a project by id. Returns undefined if not found. */
  get(id: string): StoredProject | undefined {
    return this.projects.get(id);
  }

  /** Set/overwrite a project. */
  set(project: StoredProject): void {
    this.projects.set(project.id, project);
  }

  /** Delete a project by id. Returns true if existed. */
  delete(id: string): boolean {
    return this.projects.delete(id);
  }

  /** List all project summaries (no full data). */
  list(): { id: string; name: string; updatedAt: string }[] {
    return Array.from(this.projects.values()).map((p) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updatedAt,
    }));
  }

  /** Load a project from a JSON file and cache in memory. */
  loadFromFile(filePath: string): Promise<StoredProject> {
    return new Promise((resolvePromise, reject) => {
      readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          reject(new Error(`无法读取文件: ${filePath} — ${err.message}`));
          return;
        }
        try {
          const raw = JSON.parse(data);
          const project: StoredProject = {
            id: raw.id || 'unknown',
            name: raw.name || 'Untitled',
            data: raw,
            updatedAt: raw.updatedAt || new Date().toISOString(),
          };
          this.projects.set(project.id, project);
          resolvePromise(project);
        } catch (parseErr) {
          reject(new Error(`JSON 解析失败: ${filePath}`));
        }
      });
    });
  }

  /** Save a project to a JSON file. */
  saveToFile(id: string, filePath?: string): Promise<string> {
    const project = this.projects.get(id);
    if (!project) {
      return Promise.reject(new Error(`项目不存在: ${id}`));
    }
    const outPath = filePath ?? resolve(this.storeDir, `${id}.json`);
    const dir = dirname(outPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return new Promise((resolvePromise, reject) => {
      writeFile(outPath, JSON.stringify(project.data, null, 2), 'utf-8', (err) => {
        if (err) {
          reject(new Error(`保存失败: ${err.message}`));
          return;
        }
        resolvePromise(outPath);
      });
    });
  }
}

/** Singleton store instance shared across the MCP server. */
export const projectStore = new ProjectStore();
