import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportToolHandlers } from '../../packages/ontology-mcp/src/tools/export-tools';
import { projectStore } from '../../packages/ontology-mcp/src/store/project-store';
import type { OntologyProject } from '@/types/ontology';

function makeProject(): OntologyProject {
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
        { id: 'ent-1', name: '物料', nameEn: 'Material', projectId: 'proj-1', businessScenarioId: 'bs-1', attributes: [], relations: [] },
      ],
      attributes: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as OntologyProject;
}

describe('ontology_project_export MCP tool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns JSON content by default', async () => {
    vi.spyOn(projectStore, 'get').mockResolvedValue({ id: 'proj-1', name: '生产管理', data: makeProject(), updatedAt: '' });

    const result = await exportToolHandlers.ontology_project_export({ projectId: 'proj-1', format: 'json' });
    const text = result.content[0].text;
    const parsed = JSON.parse(text);

    expect(parsed.success).toBe(true);
    expect(parsed.data.format).toBe('json');
    expect(parsed.data.content).toContain('生产管理');
  });

  it('returns YAML content', async () => {
    vi.spyOn(projectStore, 'get').mockResolvedValue({ id: 'proj-1', name: '生产管理', data: makeProject(), updatedAt: '' });

    const result = await exportToolHandlers.ontology_project_export({ projectId: 'proj-1', format: 'yaml' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.data.format).toBe('yaml');
    expect(parsed.data.content).toContain('name: 生产管理');
  });

  it('returns Markdown content', async () => {
    vi.spyOn(projectStore, 'get').mockResolvedValue({ id: 'proj-1', name: '生产管理', data: makeProject(), updatedAt: '' });

    const result = await exportToolHandlers.ontology_project_export({ projectId: 'proj-1', format: 'md' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.data.format).toBe('md');
    expect(parsed.data.content).toContain('# 生产管理');
  });

  it('returns Skill ZIP metadata', async () => {
    vi.spyOn(projectStore, 'get').mockResolvedValue({ id: 'proj-1', name: '生产管理', data: makeProject(), updatedAt: '' });
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(Buffer.from('PK'), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="test.zip"',
          'X-Project-Status': 'draft',
        },
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    const result = await exportToolHandlers.ontology_project_export({ projectId: 'proj-1', format: 'skill' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.data.format).toBe('skill');
    expect(parsed.data.filename).toBe('test.zip');
    expect(parsed.data.projectStatus).toBe('draft');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/export/skill'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"scope":"all"'),
      })
    );
  });

  it('returns Excel metadata', async () => {
    vi.spyOn(projectStore, 'get').mockResolvedValue({ id: 'proj-1', name: '生产管理', data: makeProject(), updatedAt: '' });
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(Buffer.from('XLSX'), {
        status: 200,
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    const result = await exportToolHandlers.ontology_project_export({ projectId: 'proj-1', format: 'excel' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.data.format).toBe('excel');
    expect(parsed.data.size).toBeGreaterThan(0);
  });

  it('returns error when project not found', async () => {
    vi.spyOn(projectStore, 'get').mockResolvedValue(undefined);

    const result = await exportToolHandlers.ontology_project_export({ projectId: 'missing' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Project not found');
  });
});
