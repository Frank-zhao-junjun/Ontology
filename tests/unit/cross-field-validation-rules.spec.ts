import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Rule } from '@/types/ontology';
import { createFrozenProject } from './test-helpers';

function resetStore() {
  useOntologyStore.setState({
    project: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: null,
  });
}

function createCrossFieldRule(id: string, priority: number): Rule {
  return {
    id,
    name: `跨字段规则-${id}`,
    type: 'cross_field_validation',
    entity: 'contract-1',
    priority,
    condition: {
      type: 'expression',
      expression: 'amount > 0 && contractNo.length > 0',
      fields: ['amount', 'contractNo'],
    },
    errorMessage: '合同编号和金额必须同时有效',
    severity: 'error',
    enabled: true,
  };
}

describe('US-5.2 / cross-field validation rules', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      versions: [],
      activeModelType: 'rule',
    });
  });

  it('跨字段校验少于两个字段时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    expect(() => store.addRule({
      ...createCrossFieldRule('rule-invalid-fields', 20),
      condition: {
        type: 'expression',
        expression: 'amount > 0',
        fields: ['amount'],
      },
    })).toThrow('跨字段校验至少需要两个字段');
  });

  it('跨字段校验缺少表达式时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    expect(() => store.addRule({
      ...createCrossFieldRule('rule-invalid-expression', 20),
      condition: {
        type: 'expression',
        fields: ['amount', 'contractNo'],
      },
    })).toThrow('跨字段校验必须提供表达式');
  });

  it('规则列表应按 priority 升序保存（执行顺序）', () => {
    const store = useOntologyStore.getState();
    store.addRule(createCrossFieldRule('rule-p30', 30));
    store.addRule(createCrossFieldRule('rule-p10', 10));
    store.addRule(createCrossFieldRule('rule-p20', 20));

    const orderedIds = useOntologyStore.getState().project?.ruleModel?.rules.map((rule) => rule.id) || [];
    const crossFieldIds = orderedIds.filter((id) => id.startsWith('rule-p'));
    expect(crossFieldIds).toEqual(['rule-p10', 'rule-p20', 'rule-p30']);
  });
});
