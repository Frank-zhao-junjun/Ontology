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

function createProject(): OntologyProject {
  return {
    id: 'project-1',
    name: '合同管理系统',
    description: '聚合角色边界测试',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同领域',
    },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [{ id: 'module-1', name: '合同中心', nameEn: 'ContractCenter' }],
      businessScenarios: [
        { id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'module-1', color: '#3b82f6' },
      ],
      entities: [
        {
          id: 'entity-root-1',
          name: '合同',
          nameEn: 'Contract',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'aggregate_root',
          attributes: [],
          relations: [],
        },
        {
          id: 'entity-child-1',
          name: '合同条款',
          nameEn: 'ContractClause',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'child_entity',
          parentAggregateId: 'entity-root-1',
          attributes: [],
          relations: [],
        },
        {
          id: 'entity-root-2',
          name: '发票',
          nameEn: 'Invoice',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'aggregate_root',
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

function createEntity(overrides: Partial<Entity>): Entity {
  return {
    id: 'entity-new',
    name: '新实体',
    nameEn: 'NewEntity',
    projectId: 'module-1',
    businessScenarioId: 'scenario-1',
    entityRole: 'aggregate_root',
    attributes: [],
    relations: [],
    ...overrides,
  };
}

describe('US-2.1 / entity aggregate boundary', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createProject(),
      versions: [],
      activeModelType: 'data',
    });
  });

  it('创建 child_entity 且缺少 parentAggregateId 时应拒绝保存', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addEntity(createEntity({
      id: 'entity-child-2',
      name: '付款计划',
      nameEn: 'PaymentPlan',
      entityRole: 'child_entity',
      parentAggregateId: undefined,
    }))).toThrow('子实体必须指定所属聚合根');
  });

  it('创建 aggregate_root 且携带 parentAggregateId 时应拒绝保存', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addEntity(createEntity({
      id: 'entity-root-2',
      name: '发票',
      nameEn: 'Invoice',
      entityRole: 'aggregate_root',
      parentAggregateId: 'entity-root-1',
    }))).toThrow('聚合根不能指定所属聚合根');
  });

  it('创建 child_entity 且父聚合不存在时应拒绝保存', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addEntity(createEntity({
      id: 'entity-child-3',
      name: '发票行',
      nameEn: 'InvoiceLine',
      entityRole: 'child_entity',
      parentAggregateId: 'missing-root',
    }))).toThrow('父聚合根不存在');
  });

  it('创建 child_entity 且父节点本身也是 child_entity 时应拒绝保存', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addEntity(createEntity({
      id: 'entity-child-4',
      name: '条款附件',
      nameEn: 'ClauseAttachment',
      entityRole: 'child_entity',
      parentAggregateId: 'entity-child-1',
    }))).toThrow('父聚合根不存在');
  });

  it('删除聚合根时应级联删除其子实体', () => {
    const store = useOntologyStore.getState();

    store.deleteEntity('entity-root-1');

    const remainingIds = useOntologyStore.getState().project?.dataModel?.entities.map((entity) => entity.id) || [];
    expect(remainingIds).toEqual(['entity-root-2']);
  });

  it('aggregate_root 在仍有子实体归属时不应允许降级为 child_entity', () => {
    const store = useOntologyStore.getState();
    const rootEntity = useOntologyStore.getState().project?.dataModel?.entities.find((entity) => entity.id === 'entity-root-1');

    expect(rootEntity).toBeDefined();
    expect(() => store.updateEntity('entity-root-1', {
      ...rootEntity!,
      entityRole: 'child_entity',
      parentAggregateId: 'entity-root-2',
    })).toThrow('存在归属到当前聚合根的子实体，不能直接降级');
  });

  it('child_entity 升级为 aggregate_root 时应自动清空 parentAggregateId', () => {
    const store = useOntologyStore.getState();
    const childEntity = useOntologyStore.getState().project?.dataModel?.entities.find((entity) => entity.id === 'entity-child-1');

    expect(childEntity).toBeDefined();

    store.updateEntity('entity-child-1', {
      ...childEntity!,
      entityRole: 'aggregate_root',
      parentAggregateId: undefined,
    });

    const updatedEntity = useOntologyStore.getState().project?.dataModel?.entities.find((entity) => entity.id === 'entity-child-1');
    expect(updatedEntity).toEqual(expect.objectContaining({
      entityRole: 'aggregate_root',
      isAggregateRoot: true,
      parentAggregateId: undefined,
    }));
  });
});