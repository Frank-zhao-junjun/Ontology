import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject, Rule } from '@/types/ontology';

const now = '2026-04-21T00:00:00.000Z';

function buildProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '合同管理本体',
    description: 'US-5.1 测试项目',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同管理',
    },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [{ id: 'module-1', name: '合同中心' }],
      businessScenarios: [{ id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'module-1' }],
      entities: [{
        id: 'entity-contract',
        name: '合同',
        nameEn: 'Contract',
        projectId: 'module-1',
        businessScenarioId: 'scenario-1',
        entityRole: 'aggregate_root',
        attributes: [
          { id: 'attr-contract-no', name: '合同编号', nameEn: 'contractNo', dataType: 'string' },
          { id: 'attr-amount', name: '金额', nameEn: 'amount', dataType: 'decimal' },
        ],
        relations: [],
      }],
      createdAt: now,
      updatedAt: now,
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createBaseRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: overrides.id || 'rule-1',
    name: overrides.name || '合同编号表达式校验',
    type: overrides.type || 'field_validation',
    entity: overrides.entity || 'entity-contract',
    field: overrides.field || 'attr-contract-no',
    priority: overrides.priority,
    condition: overrides.condition || { type: 'expression', expression: 'contractNo.length > 0' },
    errorMessage: overrides.errorMessage || '合同编号不能为空',
    severity: overrides.severity || 'error',
    enabled: overrides.enabled,
    description: overrides.description,
  };
}

describe('US-5.1 / field validation rules', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: buildProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'rule',
    });
  });

  it('表达式规则缺少 expression 时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    const invalidRule = createBaseRule({
      condition: { type: 'expression' },
    });

    expect(() => store.addRule(invalidRule)).toThrow('表达式校验必须提供 expression');
    expect(useOntologyStore.getState().project?.ruleModel?.rules || []).toHaveLength(0);
  });

  it('应保存 priority 与 enabled，并支持启停切换', () => {
    const store = useOntologyStore.getState();
    const rule = createBaseRule({
      id: 'rule-enabled',
      priority: 10,
      enabled: true,
      condition: { type: 'regex', pattern: '^HT-' },
    });

    store.addRule(rule);
    let saved = useOntologyStore.getState().project?.ruleModel?.rules[0];
    expect(saved?.priority).toBe(10);
    expect(saved?.enabled).toBe(true);

    store.updateRule('rule-enabled', { ...saved!, enabled: false });
    saved = useOntologyStore.getState().project?.ruleModel?.rules[0];
    expect(saved?.enabled).toBe(false);
  });
});
