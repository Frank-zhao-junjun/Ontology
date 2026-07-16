import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/export/skill/route';
import type { OntologyProject } from '@/types/ontology';
import JSZip from 'jszip';

function createRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/export/skill', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makeProject(overrides: Partial<OntologyProject> = {}): OntologyProject {
  return {
    id: 'proj-1',
    name: '生产管理',
    description: '测试项目',
    domain: { id: 'dm-1', name: '离散制造', nameEn: 'DiscreteManufacturing', description: '' },
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1.0.0',
      domain: '离散制造',
      projects: [],
      businessScenarios: [],
      entities: [
        { id: 'ent-1', name: '物料', nameEn: 'Material', projectId: 'proj-1', businessScenarioId: 'bs-1', status: 'confirmed' },
      ],
      attributes: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    behaviorModel: {
      id: 'bm-1',
      name: '行为模型',
      version: '1.0.0',
      domain: '离散制造',
      stateMachines: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as OntologyProject;
}

async function parseZip(response: Response): Promise<JSZip> {
  const buffer = Buffer.from(await response.arrayBuffer());
  return JSZip.loadAsync(buffer);
}

describe('POST /api/export/skill', () => {
  it('returns 200 with valid ZIP for all scope', async () => {
    const project = makeProject();
    const request = createRequest({ project, scope: 'all' });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toContain('.zip');
    expect(response.headers.get('X-Project-Status')).toBe('draft');

    const zip = await parseZip(response);
    expect(zip.file('skill.json')).toBeTruthy();
    expect(zip.file('ontology.json')).toBeTruthy();
    expect(zip.file('intents.json')).toBeTruthy();
    expect(zip.file('README.md')).toBeTruthy();
    expect(zip.file('SKILL.md')).toBeTruthy();
    expect(zip.file('examples/query-examples.md')).toBeTruthy();
    expect(zip.file('examples/reasoning-examples.md')).toBeTruthy();
  });

  it('filters by data scope', async () => {
    const project = makeProject();
    const request = createRequest({ project, scope: 'data' });

    const response = await POST(request);
    const zip = await parseZip(response);
    const ontologyRaw = await zip.file('ontology.json')?.async('string');
    const ontology = JSON.parse(ontologyRaw || '{}');

    expect(ontology.dataModel).toBeDefined();
    expect(ontology.behaviorModel).toBeUndefined();
  });

  it('returns 400 MISSING_PROJECT when project is missing', async () => {
    const request = createRequest({ scope: 'all' });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('MISSING_PROJECT');
  });

  it('returns 400 INVALID_SCOPE when scope is invalid', async () => {
    const project = makeProject();
    const request = createRequest({ project, scope: 'invalid' });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('INVALID_SCOPE');
  });

  it('returns 400 EMPTY_SCOPE when project has no models', async () => {
    const project = makeProject({ dataModel: null, behaviorModel: null });
    const request = createRequest({ project, scope: 'all' });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('EMPTY_SCOPE');
  });

  it('excludes examples when includeExamples=false', async () => {
    const project = makeProject();
    const request = createRequest({ project, scope: 'all', includeExamples: false });

    const response = await POST(request);
    const zip = await parseZip(response);

    expect(zip.file('examples/query-examples.md')).toBeNull();
    expect(zip.file('examples/reasoning-examples.md')).toBeNull();
  });
});
