import { describe, expect, it } from 'vitest';
import {
  ensureEntityScenario,
  ensureEntityAggregateBoundary,
  collectCascadeEntityIds,
  ensureAggregateRootRoleChangeSafety,
} from '@/lib/validation/entity-validation';
import type { Entity, OntologyProject } from '@/types/ontology';

function createMockProject(entities: Entity[] = []): OntologyProject {
  return {
    id: 'project-1',
    name: '测试项目',
    description: '测试',
    domain: { id: 'domain-1', name: '测试领域', nameEn: 'TestDomain', description: '测试' },
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [{ id: 'module-1', name: '模块1', nameEn: 'Module1' }],
      businessScenarios: [
        { id: 'scenario-1', name: '场景1', nameEn: 'Scenario1', projectId: 'module-1', color: '#3b82f6' },
      ],
      entities,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    epcModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'entity-1',
    name: '测试实体',
    nameEn: 'TestEntity',
    projectId: 'module-1',
    businessScenarioId: 'scenario-1',
    entityRole: 'aggregate_root',
    attributes: [],
    relations: [],
    ...overrides,
  };
}

describe('entity-validation', () => {
  describe('ensureEntityScenario', () => {
    it('实体有业务场景时应正常返回', () => {
      const project = createMockProject();
      const entity = createEntity();
      const result = ensureEntityScenario(entity, project);
      expect(result.businessScenarioId).toBe('scenario-1');
    });

    it('实体没有业务场景且有多个场景时应抛出错误', () => {
      const project = createMockProject();
      project.dataModel!.businessScenarios = [
        { id: 'scenario-1', name: '场景1', nameEn: 'Scenario1', projectId: 'module-1', color: '#3b82f6' },
        { id: 'scenario-2', name: '场景2', nameEn: 'Scenario2', projectId: 'module-1', color: '#ef4444' },
      ];
      const entity = createEntity({ businessScenarioId: undefined });
      expect(() => ensureEntityScenario(entity, project)).toThrow('实体必须归属一个业务场景');
    });
  });

  describe('ensureEntityAggregateBoundary', () => {
    it('聚合根不能指定 parentAggregateId', () => {
      const project = createMockProject();
      const entity = createEntity({ parentAggregateId: 'some-id' });
      expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('聚合根不能指定所属聚合根');
    });

    it('有效的聚合根应正常通过', () => {
      const project = createMockProject();
      const entity = createEntity();
      const result = ensureEntityAggregateBoundary(entity, project);
      expect(result.entityRole).toBe('aggregate_root');
    });

    it('子实体必须指定所属聚合根', () => {
      const project = createMockProject();
      const entity = createEntity({ entityRole: 'child_entity', parentAggregateId: undefined });
      expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('子实体必须指定所属聚合根');
    });

    it('子实体不能将自己作为所属聚合根', () => {
      const project = createMockProject();
      const entity = createEntity({ id: 'self-entity', entityRole: 'child_entity', parentAggregateId: 'self-entity' });
      expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('子实体不能将自己作为所属聚合根');
    });

    it('父聚合根不存在时应抛出错误', () => {
      const project = createMockProject();
      const entity = createEntity({ entityRole: 'child_entity', parentAggregateId: 'non-existent' });
      expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('父聚合根不存在');
    });

    it('父节点不是聚合根时应抛出错误', () => {
      const childEntity = createEntity({ id: 'child-1', entityRole: 'child_entity', parentAggregateId: 'root-1' });
      const anotherChild = createEntity({ id: 'child-2', entityRole: 'child_entity' });
      const project = createMockProject([childEntity, anotherChild]);
      const entity = createEntity({
        id: 'new-entity',
        entityRole: 'child_entity',
        parentAggregateId: 'child-1',
      });
      expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('父聚合根不存在');
    });
  });

  describe('collectCascadeEntityIds', () => {
    it('应收集聚合根及其所有子实体', () => {
      const entities: Entity[] = [
        createEntity({ id: 'root-1', entityRole: 'aggregate_root' }),
        createEntity({ id: 'child-1', entityRole: 'child_entity', parentAggregateId: 'root-1' }),
        createEntity({ id: 'child-2', entityRole: 'child_entity', parentAggregateId: 'root-1' }),
        createEntity({ id: 'root-2', entityRole: 'aggregate_root' }),
      ];
      const result = collectCascadeEntityIds(entities, 'root-1');
      expect(result.has('root-1')).toBe(true);
      expect(result.has('child-1')).toBe(true);
      expect(result.has('child-2')).toBe(true);
      expect(result.has('root-2')).toBe(false);
      expect(result.size).toBe(3);
    });

    it('只有一个实体时应只返回该实体', () => {
      const entities = [createEntity({ id: 'root-1' })];
      const result = collectCascadeEntityIds(entities, 'root-1');
      expect(result.size).toBe(1);
      expect(result.has('root-1')).toBe(true);
    });
  });

  describe('ensureAggregateRootRoleChangeSafety', () => {
    it('聚合根仍有子实体时不允许降级', () => {
      const rootEntity = createEntity({ id: 'root-1', entityRole: 'aggregate_root' });
      const childEntity = createEntity({
        id: 'child-1',
        entityRole: 'child_entity',
        parentAggregateId: 'root-1',
      });
      const project = createMockProject([rootEntity, childEntity]);
      const nextEntity = createEntity({ ...rootEntity, entityRole: 'child_entity' });

      expect(() => ensureAggregateRootRoleChangeSafety(rootEntity, nextEntity, project)).toThrow(
        '存在归属到当前聚合根的子实体，不能直接降级',
      );
    });

    it('聚合根没有子实体时允许降级', () => {
      const rootEntity = createEntity({ id: 'root-1', entityRole: 'aggregate_root' });
      const project = createMockProject([rootEntity]);
      const nextEntity = createEntity({ ...rootEntity, entityRole: 'child_entity', parentAggregateId: 'other-root' });

      expect(() => ensureAggregateRootRoleChangeSafety(rootEntity, nextEntity, project)).not.toThrow();
    });

    it('非聚合根角色变更不做检查', () => {
      const childEntity = createEntity({
        id: 'child-1',
        entityRole: 'child_entity',
        parentAggregateId: 'root-1',
      });
      const project = createMockProject([childEntity]);
      const nextEntity = createEntity({ ...childEntity, name: '新名称' });

      expect(() => ensureAggregateRootRoleChangeSafety(childEntity, nextEntity, project)).not.toThrow();
    });
  });
});
