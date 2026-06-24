import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { EventDefinition } from '@/types/ontology';
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

function createEvent(overrides: Partial<EventDefinition> = {}): EventDefinition {
  return {
    id: 'event-new',
    name: '合同已创建',
    nameEn: 'ContractCreated',
    entity: 'contract-1',
    trigger: 'create',
    payload: [{ field: 'id' }],
    ...overrides,
  };
}

describe('US-6.1 / domain event definition rules', () => {
  beforeEach(() => {
    resetStore();
    const project = createFrozenProject('1.0.0');
    project.eventModel = null;

    useOntologyStore.setState({
      project,
      versions: [],
      activeModelType: 'event',
    });
  });

  it('仅聚合根实体可以定义领域事件', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addEventDefinition(createEvent({
      id: 'event-child',
      entity: 'clause-1',
      name: '条款已创建',
      nameEn: 'ClauseCreated',
    }))).toThrow('只有聚合根可以定义领域事件');
  });

  it('领域事件名称应使用过去式命名', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addEventDefinition(createEvent({
      id: 'event-invalid-name',
      name: '合同创建',
      nameEn: 'ContractCreate',
    }))).toThrow('领域事件名称应使用过去式');
  });

  it('状态变更事件必须定义触发条件', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addEventDefinition(createEvent({
      id: 'event-state-change',
      name: '合同已审批',
      nameEn: 'ContractApproved',
      trigger: 'state_change',
      condition: '',
    }))).toThrow('状态变更事件必须定义触发条件');
  });

  it('创建事件时应默认补齐事务阶段和最小载荷', () => {
    const store = useOntologyStore.getState();

    store.addEventDefinition(createEvent({
      id: 'event-defaults',
      payload: [],
      transactionPhase: undefined,
    }));

    const savedEvent = useOntologyStore.getState().project?.eventModel?.events.find((event) => event.id === 'event-defaults');
    expect(savedEvent).toEqual(expect.objectContaining({
      transactionPhase: 'AFTER_COMMIT',
      payload: [{ field: 'id' }],
      entityRole: 'aggregate_root',
      entityIsAggregateRoot: true,
    }));
  });
});