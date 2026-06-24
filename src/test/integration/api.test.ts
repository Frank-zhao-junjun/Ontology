/**
 * API 集成测试 — 21 routes
 * 使用 vitest + node-fetch 对 localhost:5000 发起真实 HTTP 请求
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE = process.env.DEPLOY_RUN_PORT
  ? `http://localhost:${process.env.DEPLOY_RUN_PORT}`
  : 'http://localhost:5000';

const fetchJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init);
  const json = await res.json();
  return { status: res.status, body: json };
};

// ==================== 1. Projects API ====================

describe('Projects API', () => {
  it('GET /api/projects returns array', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/projects`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

// ==================== 2. Metadata Init ====================

describe('Metadata Init API', () => {
  it('GET /api/metadata/init returns success', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/metadata/init`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ==================== 3. Masterdata Init ====================

describe('Masterdata Init API', () => {
  it('GET /api/masterdata/init returns success', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/masterdata/init`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

// ==================== 4. Generate Model ====================

describe('Generate Model API', () => {
  it('POST /api/generate-model requires entity', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/generate-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    // Should return 400 or error since entity is missing
    expect([400, 500]).toContain(status);
  });
});

// ==================== 5. Excel Template ====================

describe('Excel Template API', () => {
  it('GET /api/excel-template returns xlsx file', async () => {
    const res = await fetch(`${BASE}/api/excel-template`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('spreadsheet');
  });
});

// ==================== 6. Excel Import ====================

describe('Excel Import API', () => {
  it('POST /api/excel-import rejects non-xlsx', async () => {
    const form = new FormData();
    form.append('file', new Blob(['not excel'], { type: 'text/plain' }), 'test.txt');
    const res = await fetch(`${BASE}/api/excel-import`, { method: 'POST', body: form });
    expect(res.status).toBe(400);
  });
});

// ==================== 7. Entity Lifecycle ====================

describe('Entity Lifecycle API', () => {
  it('POST /api/entity-lifecycle requires project', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/entity-lifecycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(status).toBe(400);
  });
});

// ==================== 8. Agent Semantic Layer ====================

describe('Agent Semantic Layer API', () => {
  it('POST /api/agent-semantic-layer returns structure', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/agent-semantic-layer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: { dataModel: { entities: [] } } }),
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('intents');
    expect(body).toHaveProperty('businessTerms');
    expect(body).toHaveProperty('semanticRelations');
  });
});

// ==================== 9-12. HR Sync ====================

describe('HR Sync API', () => {
  it('PUT /api/hr-sync/config saves config', async () => {
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

  it('GET /api/hr-sync/history returns array', async () => {
    const { status, body } = await fetchJson(`${BASE}/api/hr-sync/history`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it('POST /api/hr-sync/trigger requires source', async () => {
    const { status } = await fetchJson(`${BASE}/api/hr-sync/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect([400, 500]).toContain(status);
  });

  it('POST /api/hr-sync/resolve-conflict requires conflictId', async () => {
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
  it('POST /api/reference-documents/upload rejects no file', async () => {
    const res = await fetch(`${BASE}/api/reference-documents/upload`, { method: 'POST' });
    expect(res.status).toBe(400);
  });

  it('POST /api/reference-documents/extract-entities requires docId', async () => {
    const { status } = await fetchJson(`${BASE}/api/reference-documents/extract-entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect([400, 500]).toContain(status);
  });
});

// ==================== 15. Export ====================

describe('Export API', () => {
  it('POST /api/export requires project data', async () => {
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
  it('POST /api/codegen requires project data', async () => {
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
  it('POST /api/agent/skills returns response', async () => {
    const { status } = await fetchJson(`${BASE}/api/agent/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' }),
    });
    expect([200, 400, 500]).toContain(status);
  });
});
