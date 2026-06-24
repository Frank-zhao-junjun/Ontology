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

describe('US-4.3 / state trigger rules', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      versions: [],
      activeModelType: 'behavior',
    });
  });

  it('应允许保存带手动动作与发布事件配置的触发器', () => {
    const store = useOntologyStore.getState();
    const stateMachine = store.project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    store.updateStateMachine('sm-1', {
      ...stateMachine!,
      transitions: [
        ...stateMachine!.transitions,
        {
          id: 't-trigger-manual',
          name: '手动归档',
          from: 's3',
          to: 's3',
          trigger: 'manual',
          uiAction: 'archive-contract',
          triggerConfig: {
            publishEventId: 'event-1',
          },
        },
      ],
    });

    const saved = useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions.find((transition) => transition.id === 't-trigger-manual');
    expect(saved).toEqual(expect.objectContaining({
      uiAction: 'archive-contract',
      triggerConfig: expect.objectContaining({
        publishEventId: 'event-1',
      }),
    }));
  });

  it('事件触发转换缺少触发事件时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    const stateMachine = store.project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    expect(() => store.updateStateMachine('sm-1', {
      ...stateMachine!,
      transitions: [
        ...stateMachine!.transitions,
        {
          id: 't-trigger-auto',
          name: '事件驱动审批',
          from: 's2',
          to: 's3',
          trigger: 'automatic',
          preConditions: ['approvalReady == true'],
          triggerConfig: {},
        },
      ],
    })).toThrow('事件触发转换必须配置触发事件');
  });

  it('定时触发转换缺少 Cron 表达式时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    const stateMachine = store.project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    expect(() => store.updateStateMachine('sm-1', {
      ...stateMachine!,
      transitions: [
        ...stateMachine!.transitions,
        {
          id: 't-trigger-scheduled',
          name: '定时归档',
          from: 's3',
          to: 's3',
          trigger: 'scheduled',
          preConditions: ['archiveReady == true'],
          triggerConfig: {},
        },
      ],
    })).toThrow('定时触发转换必须配置 Cron 表达式');
  });
});