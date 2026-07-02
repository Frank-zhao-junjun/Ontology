import { describe, expect, it } from 'vitest';
import { buildIntentsJson } from '@/lib/skill-export/build-intents-json';
import type { OntologyJson } from '@/lib/skill-export/types';

function makeOntologyJson(overrides: Partial<OntologyJson> = {}): OntologyJson {
  return {
    metadata: {
      projectId: 'p1', projectName: 'Test', domain: 'Test',
      description: '', exportedAt: '', scope: 'all',
      projectStatus: 'draft', version: '1.0.0', statusAnnotation: '',
    },
    dataModel: {
      entities: [
        { id: 'ent-1', name: '物料', nameEn: 'Material', projectId: 'p1', businessScenarioId: 'bs-1' },
      ],
      relations: [
        { id: 'rel-1', name: '包含', type: 'one_to_many', targetEntity: 'BOM', foreignKey: 'materialId' },
      ],
    },
    ruleModel: {
      rules: [{ id: 'rule-1', name: '金额校验', type: 'field_validation', entity: 'ent-1', field: 'amount', condition: {}, errorMessage: '', severity: 'error' }],
    },
    behaviorModel: {
      stateMachines: [{ id: 'sm-1', name: '物料状态机', entity: 'Material', statusField: 'status', states: [], transitions: [] }],
    },
    ...overrides,
  };
}

describe('skill-export/build-intents-json', () => {
  it('为每个 entity 生成查询+解释 intent', () => {
    const onto = makeOntologyJson({
      dataModel: {
        entities: [
          { id: 'ent-1', name: '物料', nameEn: 'Material', projectId: 'p1', businessScenarioId: 'bs-1' },
        ],
        relations: [],
      },
      ruleModel: undefined,
      behaviorModel: undefined,
    });
    const result = buildIntentsJson(onto);
    // 1 entity × 2 intents = 2
    expect(result.intents).toHaveLength(2);
    expect(result.intents[0].action).toBe('query_entity');
    expect(result.intents[1].action).toBe('explain_entity');
  });

  it('为每个 relation 生成 intent', () => {
    const onto = makeOntologyJson({ ruleModel: undefined, behaviorModel: undefined });
    const result = buildIntentsJson(onto);
    const relIntents = result.intents.filter(i => i.action === 'query_relation');
    expect(relIntents).toHaveLength(1);
  });

  it('为每个 rule 生成 intent', () => {
    const onto = makeOntologyJson({ behaviorModel: undefined });
    const result = buildIntentsJson(onto);
    const ruleIntents = result.intents.filter(i => i.action === 'explain_rule');
    expect(ruleIntents).toHaveLength(1);
  });

  it('为每个 stateMachine 生成 intent', () => {
    const onto = makeOntologyJson({ ruleModel: undefined });
    const result = buildIntentsJson(onto);
    const smIntents = result.intents.filter(i => i.action === 'analyze_state_machine');
    expect(smIntents).toHaveLength(1);
  });

  it('空数据模型返回空 intents', () => {
    const onto = makeOntologyJson({
      dataModel: { entities: [], relations: [] },
      ruleModel: undefined,
      behaviorModel: undefined,
    });
    const result = buildIntentsJson(onto);
    expect(result.intents).toHaveLength(0);
  });
});
