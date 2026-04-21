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

  it('记录触发器执行后应追加执行日志与发布事件结果', () => {
    const store = useOntologyStore.getState();
    const stateMachine = store.project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    store.updateStateMachine('sm-1', {
      ...stateMachine!,
      transitions: [
        ...stateMachine!.transitions,
        {
          id: 't-trigger-log',
          name: '自动归档',
          from: 's3',
          to: 's3',
          trigger: 'scheduled',
          preConditions: ['archiveReady == true'],
          triggerConfig: {
            cron: '0 0 * * *',
            publishEventId: 'event-1',
          },
        },
      ],
    });

    store.recordTransitionTriggerExecution('sm-1', 't-trigger-log', {
      triggerType: 'scheduled',
      status: 'success',
      triggeredAt: '2026-04-21T09:00:00.000Z',
      message: '定时触发成功',
    });

    const saved = useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions.find((transition) => transition.id === 't-trigger-log');
    expect(saved?.executionLogs).toEqual([
      expect.objectContaining({
        triggerType: 'scheduled',
        status: 'success',
        publishedEventId: 'event-1',
        message: '定时触发成功',
      }),
    ]);
  });
});