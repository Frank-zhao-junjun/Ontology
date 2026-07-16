import { describe, expect, it } from 'vitest';
import { buildOntologyJson, isEmptyScope } from '@/lib/skill-export/build-ontology-json';
import type { OntologyProject } from '@/types/ontology';

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
        { id: 'ent-2', name: 'BOM', nameEn: 'BOM', projectId: 'proj-1', businessScenarioId: 'bs-1' },
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
      stateMachines: [{ id: 'sm-1', name: '物料状态机', entity: 'Material', statusField: 'status', states: [], transitions: [] }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    ruleModel: {
      id: 'rm-1',
      name: '规则模型',
      version: '1.0.0',
      domain: '离散制造',
      rules: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as OntologyProject;
}

describe('skill-export/build-ontology-json', () => {
  it('builds full ontology.json with all scope', () => {
    const project = makeProject();
    const result = buildOntologyJson(project, {
      scope: 'all',
      includeSemanticLayer: true,
      exportedAt: '2026-07-01T00:00:00.000Z',
      version: '1.0.0',
    });

    expect(result.metadata.projectId).toBe('proj-1');
    expect(result.metadata.scope).toBe('all');
    expect(result.dataModel).toBeDefined();
    expect(result.behaviorModel).toBeDefined();
    expect(result.ruleModel).toBeDefined();
  });

  it('filters by data scope', () => {
    const project = makeProject();
    const result = buildOntologyJson(project, {
      scope: 'data',
      includeSemanticLayer: false,
      exportedAt: '2026-07-01T00:00:00.000Z',
      version: '1.0.0',
    });

    expect(result.dataModel).toBeDefined();
    expect(result.behaviorModel).toBeUndefined();
    expect(result.ruleModel).toBeUndefined();
    expect(result.agentSemanticLayer).toBeUndefined();
  });

  it('annotates missing status as unknown', () => {
    const project = makeProject();
    const result = buildOntologyJson(project, {
      scope: 'data',
      includeSemanticLayer: false,
      exportedAt: '2026-07-01T00:00:00.000Z',
      version: '1.0.0',
    });

    const entities = (result.dataModel as { entities: { status: string }[] }).entities;
    expect(entities[0].status).toBe('confirmed');
    expect(entities[1].status).toBe('unknown');
  });

  it('sets projectStatus annotation for draft', () => {
    const project = makeProject({ status: 'draft' });
    const result = buildOntologyJson(project, {
      scope: 'all',
      includeSemanticLayer: true,
      exportedAt: '2026-07-01T00:00:00.000Z',
      version: '1.0.0',
    });

    expect(result.metadata.projectStatus).toBe('draft');
    expect(result.metadata.statusAnnotation).toContain('draft');
  });

  it('detects empty scope', () => {
    const project = makeProject({ dataModel: null, behaviorModel: null, ruleModel: null });
    const result = buildOntologyJson(project, {
      scope: 'all',
      includeSemanticLayer: false,
      exportedAt: '2026-07-01T00:00:00.000Z',
      version: '1.0.0',
    });

    expect(isEmptyScope(result)).toBe(true);
  });

  it('detects non-empty scope', () => {
    const project = makeProject();
    const result = buildOntologyJson(project, {
      scope: 'data',
      includeSemanticLayer: false,
      exportedAt: '2026-07-01T00:00:00.000Z',
      version: '1.0.0',
    });

    expect(isEmptyScope(result)).toBe(false);
  });
});
