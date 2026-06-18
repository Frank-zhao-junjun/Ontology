import { describe, expect, it } from 'vitest';
import type { Domain, OntologyProject } from '@/types/ontology';
import { buildE1Entity } from '@/lib/e1-entity/create-entity';

const domain: Domain = {
  id: 'd1',
  name: '制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

function baseProject(): OntologyProject {
  return {
    id: 'p1',
    name: '测试',
    domain,
    dataModel: {
      id: 'dm1',
      name: 'dm',
      version: '1.0.0',
      domain: 'd1',
      projects: [{ id: 'mod1', name: '模块', nameEn: 'Mod', color: '#000' }],
      businessScenarios: [],
      entities: [],
      createdAt: '2026-06-18T12:00:00.000Z',
      updatedAt: '2026-06-18T12:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-06-18T12:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z',
  };
}

describe('buildE1Entity', () => {
  it('should build aggregate root with global scenario fallback', () => {
    const entity = buildE1Entity(baseProject(), { name: '订单' }, 'e-new');
    expect(entity.name).toBe('订单');
    expect(entity.businessScenarioId).toBe('e1-global');
    expect(entity.projectId).toBe('mod1');
    expect(entity.entityRole).toBe('aggregate_root');
  });

  it('should require parent aggregate for child entity', () => {
    expect(() =>
      buildE1Entity(baseProject(), { name: '行', entityRole: 'child_entity' }, 'e-child'),
    ).toThrow('子实体必须指定所属聚合根');
  });
});
