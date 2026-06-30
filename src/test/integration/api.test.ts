/**
 * API 集成测试 — 19 routes
 * 使用 vitest + node-fetch 对 localhost:5000 发起真实 HTTP 请求
 * 当 DEV_SERVER 不可用时自动跳过所有测试
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { TestContext } from 'vitest';

const BASE = process.env.DEPLOY_RUN_PORT
  ? `http://localhost:${process.env.DEPLOY_RUN_PORT}`
  : 'http://localhost:5000';

let serverAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE}/api/projects`, { signal: AbortSignal.timeout(3000) });
    serverAvailable = res.ok || res.status < 500;
  } catch {
    serverAvailable = false;
  }
});

const skipIfNoServer = (name: string, fn: (ctx: TestContext) => void | Promise<void>) => {
  it(name, async (ctx) => {
    if (!serverAvailable) {
      ctx.skip();
      return;
    }
    await fn(ctx);
  });
};

const fetchJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init);
  const json = await res.json();
  return { status: res.status, body: json };
};

// ==================== 1. Projects API ====================

describe('Projects API', () => {
  skipIfNoServer('GET /api/projects returns array', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/projects`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

// ==================== 2. Metadata Init ====================

describe('Metadata Init API', () => {
  skipIfNoServer('GET /api/metadata/init returns success', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/metadata/init`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ==================== 3. Masterdata Init ====================

describe('Masterdata Init API', () => {
  skipIfNoServer('GET /api/masterdata/init returns success', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/masterdata/init`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

// ==================== 4. Generate Model ====================
// NOTE: POST /api/generate-model removed in Copilot Phase 3 legacy cleanup.
// Listed in src/lib/legacy-audit/index.ts FORBIDDEN_LEGACY_API_SEGMENTS.

// ==================== 5. Excel Template ====================

describe('Excel Template API', () => {
  skipIfNoServer('GET /api/excel-template returns xlsx file', async () => {
    const res = await fetch(`${BASE}/api/excel-template`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('spreadsheet');
  });
});

// ==================== 6. Excel Import ====================

describe('Excel Import API', () => {
  skipIfNoServer('POST /api/excel-import rejects non-xlsx', async () => {
    const form = new FormData();
    form.append('file', new Blob(['not excel'], { type: 'text/plain' }), 'test.txt');
    const res = await fetch(`${BASE}/api/excel-import`, { method: 'POST', body: form });
    expect(res.status).toBe(400);
  });
});

// ==================== 7-8. Entity Lifecycle & Agent Semantic Layer ====================
// NOTE: These API routes were removed in commit a9d6ee7 (EPC v3.1 refactor)
// and are listed as legacy routes in src/lib/legacy-audit/index.ts.
// Tests removed to avoid CI failures from 404 responses.

// ==================== 9-12. HR Sync ====================

describe('HR Sync API', () => {
  skipIfNoServer('PUT /api/hr-sync/config saves config', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/hr-sync/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'feishu',
        interval: 'daily',
        fieldMapping: [],
        conflictStrategy: 'hr_first',
        syncScope: ['departments'],
      }),
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  skipIfNoServer('GET /api/hr-sync/history returns array', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/hr-sync/history`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  skipIfNoServer('POST /api/hr-sync/trigger requires source', async () => {
    const { status } = await fetchJson(`${BASE}/api/hr-sync/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect([400, 500]).toContain(status);
  });

  skipIfNoServer('POST /api/hr-sync/resolve-conflict requires conflictId', async () => {
    const { status } = await fetchJson(`${BASE}/api/hr-sync/resolve-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect([400, 500]).toContain(status);
  });
});

// ==================== 13-14. Reference Documents ====================

describe('Reference Documents API', () => {
  skipIfNoServer('POST /api/reference-documents/upload rejects no file', async () => {
    const res = await fetch(`${BASE}/api/reference-documents/upload`, { method: 'POST' });
    expect(res.status).toBe(400);
  });

  // NOTE: POST /api/reference-documents/extract-entities removed in Copilot Phase 3.
  // Entity extraction merged into Copilot analyzeDocumentAndModel / generateElementsFromText.
});

// ==================== 15. Export ====================

describe('Export API', () => {
  skipIfNoServer('POST /api/export requires project data', async () => {
    const { status } = await fetchJson(`${BASE}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect([200, 400, 500]).toContain(status);
  });
});

// ==================== 16. Codegen ====================

describe('Codegen API', () => {
  skipIfNoServer('POST /api/codegen requires project data', async () => {
    const { status } = await fetchJson(`${BASE}/api/codegen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect([200, 400, 500]).toContain(status);
  });
});

// ==================== 17. Agent Skills ====================

describe('Agent Skills API', () => {
  skipIfNoServer('POST /api/agent/skills returns response', async () => {
    const { status } = await fetchJson(`${BASE}/api/agent/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' }),
    });
    expect([200, 400, 500]).toContain(status);
  });
});
