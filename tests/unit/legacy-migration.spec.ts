import { describe, it, expect } from 'vitest';
import { migrateBusinessScenariosToChain } from '@/lib/migration/business-scenario-to-chain';
import type { OntologyProject, BusinessScenario } from '@/types/ontology';

function makeScenario(id: string, name: string): BusinessScenario {
  return { id, name, nameEn: name, projectId: 'proj-1' };
}

function makeProject(scenarios: BusinessScenario[], overrides?: Partial<OntologyProject>): OntologyProject {
  return {
    id: 'proj-1',
    name: '测试项目',
    domain: { id: 'domain-1', name: '域', nameEn: 'Domain', description: '', icon: 'factory', color: '#000' },
    dataModel: {
      id: 'dm-1', name: '数据模型', version: '1.0', domain: 'test',
      entities: [], projects: [], businessScenarios: scenarios,
      createdAt: '', updatedAt: '',
    },
    behaviorModel: null, ruleModel: null, processModel: null, eventModel: null,
    governanceModel: null, dataSourcesModel: null, metricsModel: null,
    createdAt: '2026-06-18T00:00:00.000Z',
    updatedAt: '2026-06-18T00:00:00.000Z',
    ...overrides,
  };
}

describe('migrateBusinessScenariosToChain', () => {
  it('should migrate single business scenario to A→B→C chain', () => {
    const project = makeProject([makeScenario('bs-1', 'MTS 场景')]);
    const result = migrateBusinessScenariosToChain(project);

    expect(result.migratedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(result.project.valueDomains).toHaveLength(1);
    expect(result.project.capabilities).toHaveLength(1);
    expect(result.project.scenarios).toHaveLength(1);
  });

  it('should migrate multiple scenarios under same A+B', () => {
    const project = makeProject([
      makeScenario('bs-1', 'MTS 场景'),
      makeScenario('bs-2', 'MTO 场景'),
    ]);
    const result = migrateBusinessScenariosToChain(project);

    expect(result.migratedCount).toBe(2);
    expect(result.project.valueDomains).toHaveLength(1);
    expect(result.project.capabilities).toHaveLength(1);
    expect(result.project.scenarios).toHaveLength(2);
  });

  it('should return unchanged project for empty scenarios', () => {
    const project = makeProject([]);
    const result = migrateBusinessScenariosToChain(project);

    expect(result.migratedCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(result.project).toBe(project);
  });

  it('should skip when simplified chain already exists', () => {
    const project = makeProject(
      [makeScenario('bs-1', 'MTS')],
      { valueDomains: [{ id: 'VD-001', name: '已有' }] },
    );
    const result = migrateBusinessScenariosToChain(project);

    expect(result.migratedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
  });

  it('should preserve scenario id and name from legacy', () => {
    const project = makeProject([makeScenario('bs-custom', '自定义场景')]);
    const result = migrateBusinessScenariosToChain(project);

    const cs = result.project.scenarios!.find((s) => s.id === 'bs-custom');
    expect(cs).toBeDefined();
    expect(cs!.name).toBe('自定义场景');
  });
});
