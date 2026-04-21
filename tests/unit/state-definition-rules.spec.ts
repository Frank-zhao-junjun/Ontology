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

describe('US-4.1 / state definition rules', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      versions: [],
      activeModelType: 'behavior',
    });
  });

  it('应允许向状态机新增一个带颜色的中间态', () => {
    const store = useOntologyStore.getState();
    const stateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    store.updateStateMachine('sm-1', {
      ...stateMachine!,
      states: [
        ...stateMachine!.states,
        { id: 's4', name: '已归档', color: '#10B981' },
      ],
    });

    const updatedStateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');
    const archivedState = updatedStateMachine?.states.find((state) => state.id === 's4');

    expect(archivedState).toEqual(expect.objectContaining({
      id: 's4',
      name: '已归档',
      color: '#10B981',
    }));
    expect(archivedState?.isInitial).toBeUndefined();
    expect(archivedState?.isFinal).toBeUndefined();
  });

  it('状态码重复时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    const stateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    expect(() => store.updateStateMachine('sm-1', {
      ...stateMachine!,
      states: [
        ...stateMachine!.states,
        { id: 's1', name: '重复草稿', color: '#F59E0B' },
      ],
    })).toThrow('状态编码不能重复');
  });

  it('同一状态机存在多个初始态时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    const stateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    expect(() => store.updateStateMachine('sm-1', {
      ...stateMachine!,
      states: stateMachine!.states.map((state) =>
        state.id === 's2' ? { ...state, isInitial: true } : state,
      ),
    })).toThrow('状态机只能有一个初始状态');
  });

  it('删除仍被转换规则引用的状态时应拒绝保存', () => {
    const store = useOntologyStore.getState();
    const stateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    expect(() => store.updateStateMachine('sm-1', {
      ...stateMachine!,
      states: stateMachine!.states.filter((state) => state.id !== 's2'),
      transitions: stateMachine!.transitions.filter((transition) => transition.id !== 't2'),
    })).toThrow('状态已被转换规则引用，不能删除');
  });

  it('单个状态机超过 10 个状态时应拒绝保存', () => {
    const tenStates = Array.from({ length: 10 }, (_, index) => ({
      id: `state-${index + 1}`,
      name: `状态${index + 1}`,
      color: '#3B82F6',
      isInitial: index === 0,
      isFinal: index === 9,
    }));

    const project = createFrozenProject('1.0.0');
    if (project.behaviorModel?.stateMachines[0]) {
      project.behaviorModel.stateMachines[0] = {
        ...project.behaviorModel.stateMachines[0],
        states: tenStates,
        transitions: [],
      };
    }

    useOntologyStore.setState({
      project,
      versions: [],
      activeModelType: 'behavior',
    });

    const store = useOntologyStore.getState();
    const stateMachine = useOntologyStore.getState().project?.behaviorModel?.stateMachines.find((sm) => sm.id === 'sm-1');

    expect(stateMachine).toBeDefined();

    expect(() => store.updateStateMachine('sm-1', {
      ...stateMachine!,
      states: [...stateMachine!.states, { id: 'state-11', name: '状态11', color: '#10B981' }],
      transitions: [],
    })).toThrow('每个状态机最多只能定义 10 个状态');
  });
});