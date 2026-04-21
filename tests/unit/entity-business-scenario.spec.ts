import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Entity, OntologyProject } from '@/types/ontology';

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

function createScenarioProject(): OntologyProject {
  return {
    id: 'project-1',
    name: '合同管理系统',
    description: '业务场景绑定测试项目',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同管理领域',
    },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [{ id: 'module-1', name: '合同中心', nameEn: 'ContractCenter' }],
      businessScenarios: [
        { id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'module-1' },
        { id: 'scenario-2', name: '合同履约', nameEn: 'ContractFulfillment', projectId: 'module-1' },
      ],
      entities: [
        {
          id: 'entity-1',
          name: '合同',
          nameEn: 'Contract',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'aggregate_root',
          description: '合同实体',
          attributes: [],
          relations: [],
        },
      ],
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    epcModel: null,
    createdAt: '2026-04-21T00:00:00.000Z',
    updatedAt: '2026-04-21T00:00:00.000Z',
  };
}

describe('US-2.2 / UT-BS: entity business scenario binding', () => {
  beforeEach(() => {
    resetStore();
  });

  it('UT-BS-001 创建实体时缺少 businessScenarioId 应拒绝保存', () => {
    useOntologyStore.setState({
      project: createScenarioProject(),
      versions: [],
      activeModelType: 'data',
    });

    const store = useOntologyStore.getState();

    expect(() => store.addEntity({
      id: 'entity-2',
      name: '付款计划',
      nameEn: 'PaymentSchedule',
      projectId: 'module-1',
      businessScenarioId: '',
      entityRole: 'child_entity',
      parentAggregateId: 'entity-1',
      attributes: [],
      relations: [],
    } as Entity)).toThrow('实体必须归属一个业务场景');
  });

  it('UT-BS-002 更新实体时应保留原 businessScenarioId，不允许跨场景移动', () => {
    useOntologyStore.setState({
      project: createScenarioProject(),
      versions: [],
      activeModelType: 'data',
    });

    const store = useOntologyStore.getState();
    const original = store.project?.dataModel?.entities.find((entity) => entity.id === 'entity-1') as Entity;

    store.updateEntity('entity-1', {
      ...original,
      businessScenarioId: 'scenario-2',
      name: '合同主单',
    });

    const updated = useOntologyStore.getState().project?.dataModel?.entities.find((entity) => entity.id === 'entity-1');
    expect(updated?.name).toBe('合同主单');
    expect(updated?.businessScenarioId).toBe('scenario-1');
  });
});