import { describe, expect, it } from 'vitest';
import { buildExamples } from '@/lib/skill-export/build-examples';
import type { OntologyJson } from '@/lib/skill-export/types';
import type { Entity, Relation, Rule, StateMachine } from '@/types/ontology';

function makeOntologyJson(overrides: Partial<OntologyJson> = {}): OntologyJson {
  return {
    metadata: {
      projectId: 'p1', projectName: 'Test', domain: 'Test',
      description: '', exportedAt: '', scope: 'all',
      projectStatus: 'draft', version: '1.0.0', statusAnnotation: '',
    },
    dataModel: {
      entities: [
        { id: 'ent-1', name: '物料', nameEn: 'Material', projectId: 'p1', businessScenarioId: 'bs-1' } as Entity,
        { id: 'ent-2', name: 'BOM', nameEn: 'BOM', projectId: 'p1', businessScenarioId: 'bs-1' } as Entity,
      ],
      relations: [
        { id: 'rel-1', name: '包含', type: 'one_to_many', targetEntity: 'BOM', foreignKey: 'materialId' } as Relation,
      ],
    },
    ruleModel: {
      rules: [
        { id: 'rule-1', name: '金额校验', type: 'field_validation', entity: 'ent-1', field: 'amount', condition: {}, errorMessage: '', severity: 'error' } as Rule,
      ],
    },
    behaviorModel: {
      stateMachines: [
        { id: 'sm-1', name: '物料状态机', entity: 'Material', statusField: 'status', states: [], transitions: [] } as StateMachine,
      ],
    },
    ...overrides,
  };
}

describe('skill-export/build-examples', () => {
  it('queryExamples 应包含实体查询', () => {
    const onto = makeOntologyJson({ ruleModel: undefined, behaviorModel: undefined });
    const result = buildExamples(onto);
    expect(result.queryExamples).toContain('查询类示例');
    expect(result.queryExamples).toContain('物料有哪些属性？');
    expect(result.queryExamples).toContain('BOM有哪些属性？');
  });

  it('queryExamples 应包含关系查询', () => {
    const onto = makeOntologyJson({ ruleModel: undefined, behaviorModel: undefined });
    const result = buildExamples(onto);
    expect(result.queryExamples).toContain('关系查询');
    expect(result.queryExamples).toContain('包含是什么关系？');
  });

  it('queryExamples 应包含规则查询', () => {
    const onto = makeOntologyJson({ behaviorModel: undefined });
    const result = buildExamples(onto);
    expect(result.queryExamples).toContain('规则查询');
    expect(result.queryExamples).toContain('金额校验的触发条件是什么？');
  });

  it('queryExamples 应包含状态机查询', () => {
    const onto = makeOntologyJson({ ruleModel: undefined });
    const result = buildExamples(onto);
    expect(result.queryExamples).toContain('状态机查询');
    expect(result.queryExamples).toContain('物料状态机有哪些状态？');
  });

  it('reasoningExamples 应包含跨实体推理', () => {
    const onto = makeOntologyJson({ ruleModel: undefined, behaviorModel: undefined });
    const result = buildExamples(onto);
    expect(result.reasoningExamples).toContain('推理类示例');
    expect(result.reasoningExamples).toContain('跨实体推理');
    expect(result.reasoningExamples).toContain('包含');
  });

  it('reasoningExamples 应包含状态转换推理', () => {
    const onto = makeOntologyJson({ ruleModel: undefined });
    const result = buildExamples(onto);
    expect(result.reasoningExamples).toContain('状态转换推理');
    expect(result.reasoningExamples).toContain('物料状态机');
  });

  it('reasoningExamples 应包含规则触发推理', () => {
    const onto = makeOntologyJson({ behaviorModel: undefined });
    const result = buildExamples(onto);
    expect(result.reasoningExamples).toContain('规则触发推理');
    expect(result.reasoningExamples).toContain('金额校验');
  });

  it('空数据模型应返回空查询/推理内容', () => {
    const onto = makeOntologyJson({
      dataModel: { entities: [], relations: [] },
      ruleModel: undefined,
      behaviorModel: undefined,
    });
    const result = buildExamples(onto);
    expect(result.queryExamples).toBe('# 查询类示例\n');
    expect(result.reasoningExamples).toContain('综合推理');
  });

  it('queryExamples 截断实体到 10 个', () => {
    const entities: Entity[] = Array.from({ length: 15 }, (_, i) => ({
      id: `ent-${i}`, name: `E${i}`, nameEn: `E${i}`, projectId: 'p1', businessScenarioId: 'bs-1',
    } as Entity));
    const onto = makeOntologyJson({
      dataModel: { entities, relations: [] },
      ruleModel: undefined,
      behaviorModel: undefined,
    });
    const result = buildExamples(onto);
    const count = (result.queryExamples.match(/\?/g) || []).length;
    expect(count).toBeLessThanOrEqual(20); // 10 entities × 2 questions
  });
});
