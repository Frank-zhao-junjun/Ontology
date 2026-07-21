import { describe, expect, it } from 'vitest';
import { ensureRuleDefinitionRules } from '@/lib/validation/rule-validation';
import type { Rule, OntologyProject, Entity } from '@/types/ontology';

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
      projects: [],
      businessScenarios: [],
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

function createRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    name: '规则1',
    entity: 'entity-1',
    type: 'field_validation',
    field: 'name',
    severity: 'error',
    priority: 100,
    errorMessage: '校验失败',
    enabled: true,
    condition: {
      type: 'expression',
      expression: 'value.length > 0',
    },
    ...overrides,
  };
}

describe('rule-validation', () => {
  describe('ensureRuleDefinitionRules', () => {
    it('规则名称不能为空', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({ name: '' });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('规则名称不能为空');
    });

    it('规则必须绑定到有效实体', () => {
      const project = createMockProject([]);
      const rule = createRule({ entity: 'non-existent' });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('规则必须绑定到有效实体');
    });

    it('字段级校验必须绑定字段', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({ type: 'field_validation', field: '' });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('字段级校验必须绑定字段');
    });

    it('跨字段校验至少需要两个字段', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({
        type: 'cross_field_validation',
        condition: {
          type: 'expression',
          expression: 'field1 > field2',
          fields: ['field1'],
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('跨字段校验至少需要两个字段');
    });

    it('跨字段校验必须提供表达式', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({
        type: 'cross_field_validation',
        condition: {
          type: 'expression',
          expression: '',
          fields: ['field1', 'field2'],
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('跨字段校验必须提供表达式');
    });

    it('业务约束规则必须配置检查实体', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({
        type: 'cross_entity_validation',
        condition: {
          type: 'expression',
          expression: 'count > 0',
          checkEntity: '',
          checkCondition: 'status = active',
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('业务约束规则必须配置检查实体');
    });

    it('业务约束规则必须引用已定义实体', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({
        type: 'cross_entity_validation',
        condition: {
          type: 'expression',
          expression: 'count > 0',
          checkEntity: 'non-existent',
          checkCondition: 'status = active',
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('业务约束规则必须引用已定义实体');
    });

    it('业务约束规则必须配置检查条件', () => {
      const project = createMockProject([createEntity(), createEntity({ id: 'entity-2' })]);
      const rule = createRule({
        type: 'cross_entity_validation',
        condition: {
          type: 'expression',
          expression: 'count > 0',
          checkEntity: 'entity-2',
          checkCondition: '',
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('业务约束规则必须配置检查条件');
    });

    it('正则校验必须提供pattern', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({
        condition: {
          type: 'regex',
          pattern: '',
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('正则校验必须提供 pattern');
    });

    it('范围校验必须提供min和max', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({
        condition: {
          type: 'range',
          min: undefined,
          max: 100,
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('范围校验必须提供 min 和 max');
    });

    it('范围校验的min不能大于max', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({
        condition: {
          type: 'range',
          min: 100,
          max: 50,
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('范围校验的 min 不能大于 max');
    });

    it('表达式校验必须提供expression', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({
        condition: {
          type: 'expression',
          expression: '',
        },
      });
      expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('表达式校验必须提供 expression');
    });

    it('有效的字段校验规则应正常通过', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule();
      const result = ensureRuleDefinitionRules(rule, project);
      expect(result).toBeDefined();
      expect(result.name).toBe('规则1');
      expect(result.enabled).toBe(true);
    });

    it('优先级应被规范化为正整数', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({ priority: -5 });
      const result = ensureRuleDefinitionRules(rule, project);
      expect(result.priority).toBe(1);
    });

    it('默认错误消息应为"校验失败"', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({ errorMessage: '' });
      const result = ensureRuleDefinitionRules(rule, project);
      expect(result.errorMessage).toBe('校验失败');
    });

    it('enabled默认为true', () => {
      const project = createMockProject([createEntity()]);
      const rule = createRule({ enabled: undefined });
      const result = ensureRuleDefinitionRules(rule, project);
      expect(result.enabled).toBe(true);
    });
  });
});
