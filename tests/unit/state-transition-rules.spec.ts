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

describe('US-4.2 / state transition rules', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      versions: [],
      activeModelType: 'behavior',
    });
  });

  it('应允许保存带前置条件与后置动作的有效转换', () => {
    const store = useOntologyStore.getState();
    const stateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    store.updateStateMachine('sm-1', {
      ...stateMachine!,
      transitions: [
        ...stateMachine!.transitions,
        {
          id: 't3',
          name: '自动归档',
          from: 's3',
          to: 's3',
          trigger: 'automatic',
          triggerConfig: {
            eventId: 'event-1',
          },
          preConditions: ['archiveReady == true'],
          postActions: ['emit:ContractArchived'],
        },
      ],
    });

    const saved = useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions.find((transition) => transition.id === 't3');
    expect(saved).toEqual(expect.objectContaining({
      from: 's3',
      to: 's3',
      trigger: 'automatic',
      triggerConfig: {
        eventId: 'event-1',
      },
      preConditions: ['archiveReady == true'],
      postActions: ['emit:ContractArchived'],
    }));
  });

  it('转换引用不存在的起止状态时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    const stateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    expect(() => store.updateStateMachine('sm-1', {
      ...stateMachine!,
      transitions: [
        ...stateMachine!.transitions,
        {
          id: 't-invalid',
          name: '非法转换',
          from: 'missing-state',
          to: 's2',
          trigger: 'manual',
        },
      ],
    })).toThrow('转换必须引用有效的起始状态和目标状态');
  });

  it('自动或定时转换缺少触发条件时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    const stateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    expect(() => store.updateStateMachine('sm-1', {
      ...stateMachine!,
      transitions: [
        ...stateMachine!.transitions,
        {
          id: 't-auto',
          name: '自动生效',
          from: 's2',
          to: 's3',
          trigger: 'automatic',
          preConditions: [],
        },
      ],
    })).toThrow('自动或定时转换必须定义触发条件');
  });
});