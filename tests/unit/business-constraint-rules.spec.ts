import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
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

describe('US-5.3 / business constraint rules', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      versions: [],
      activeModelType: 'rule',
    });
  });

  it('业务约束规则缺少检查实体时应拦截', () => {
    const store = useOntologyStore.getState();
    expect(() => store.addRule({
      id: 'rule-biz-1',
      name: '供应商状态校验',
      type: 'cross_entity_validation',
      entity: 'contract-1',
      priority: 30,
      condition: {
        type: 'expression',
        checkCondition: "vendor.status == 'active'",
      },
      errorMessage: '供应商状态非法',
      severity: 'error',
    })).toThrow('业务约束规则必须配置检查实体');
  });

  it('业务约束规则缺少检查条件时应拦截', () => {
    const store = useOntologyStore.getState();
    expect(() => store.addRule({
      id: 'rule-biz-2',
      name: '供应商状态校验',
      type: 'cross_entity_validation',
      entity: 'contract-1',
      priority: 30,
      condition: {
        type: 'expression',
        checkEntity: 'clause-1',
      },
      errorMessage: '供应商状态非法',
      severity: 'error',
    })).toThrow('业务约束规则必须配置检查条件');
  });
});
