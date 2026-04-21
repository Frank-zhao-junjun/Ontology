import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { BehaviorModelEditor } from '@/components/ontology/behavior-model-editor';
import { useOntologyStore } from '@/store/ontology-store';
import { createFrozenProject } from '../unit/test-helpers';

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

function createProject() {
  return createFrozenProject('1.0.0');
}

function createProjectWithTenStates() {
  const project = createProject();
  if (project.behaviorModel?.stateMachines[0]) {
    project.behaviorModel.stateMachines[0] = {
      ...project.behaviorModel.stateMachines[0],
      states: Array.from({ length: 10 }, (_, index) => ({
        id: `state-${index + 1}`,
        name: `状态${index + 1}`,
        color: '#3B82F6',
        isInitial: index === 0,
        isFinal: index === 9,
      })),
      transitions: [],
    };
  }
  return project;
}

async function renderEditor(project = createProject()) {
  useOntologyStore.setState({
    project,
    versions: [],
    activeModelType: 'behavior',
  });

  render(React.createElement(BehaviorModelEditor, { mode: 'entity-detail', entityId: 'contract-1' }));
  await act(async () => {
    const lifecycleTab = screen.getByRole('tab', { name: 'Lifecycle 状态机' });
    lifecycleTab.focus();
    fireEvent.pointerDown(lifecycleTab, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(lifecycleTab, { button: 0, ctrlKey: false });
    fireEvent.click(lifecycleTab, { button: 0, ctrlKey: false });
    fireEvent.keyDown(lifecycleTab, { key: 'Enter' });
  });
  fireEvent.click(await screen.findByText('合同状态机'));
}

describe('US-4.1 / IT-STATE-UI-001: behavior editor enforces visible state rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('应允许在编辑器中新增一个普通中间态', async () => {
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加状态' }));
    fireEvent.change(screen.getByPlaceholderText('如：草稿'), { target: { value: '已归档' } });
    fireEvent.click(screen.getByRole('button', { name: '添加' }));

    expect(screen.getByText('已归档')).toBeInTheDocument();
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].states.map((state) => state.name)).toContain('已归档');
  });

  it('生成出的状态码与已有状态重复时应提示错误并拒绝保存', async () => {
    const randomValue = 0.314159265;
    const duplicateStateId = randomValue.toString(36).substring(2, 10);
    const project = createProject();
    const alertSpy = vi.fn();

    project.behaviorModel?.stateMachines[0].states.push({
      id: duplicateStateId,
      name: '已存在编码',
      color: '#6B7280',
    });

    vi.stubGlobal('alert', alertSpy);
    await renderEditor(project);

    fireEvent.click(screen.getByRole('button', { name: '+ 添加状态' }));
    fireEvent.change(screen.getByPlaceholderText('如：草稿'), { target: { value: '重复编码状态' } });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(randomValue);
    fireEvent.click(screen.getByRole('button', { name: '添加' }));
    randomSpy.mockRestore();

    expect(alertSpy).toHaveBeenCalledWith('状态编码不能重复');
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].states.map((state) => state.name)).not.toContain('重复编码状态');
  });

  it('尝试新增第二个初始态时应提示错误并拒绝保存', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加状态' }));
    fireEvent.change(screen.getByPlaceholderText('如：草稿'), { target: { value: '待签署' } });
    fireEvent.click(screen.getByLabelText('初始状态'));
    fireEvent.click(screen.getByRole('button', { name: '添加' }));

    expect(alertSpy).toHaveBeenCalledWith('状态机只能有一个初始状态');
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].states.map((state) => state.name)).not.toContain('待签署');
  });

  it('删除仍被转换引用的状态时应提示先处理转换规则', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    await renderEditor();

    const stateBadge = screen
      .getAllByText('审批中')
      .find((element) => element.className === 'text-sm')
      ?.closest('div');
    expect(stateBadge).toBeTruthy();

    fireEvent.click(within(stateBadge as HTMLElement).getByRole('button', { name: '×' }));

    expect(alertSpy).toHaveBeenCalledWith('状态已被转换规则引用，不能删除');
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].states.map((state) => state.id)).toContain('s2');
  });

  it('达到 10 个状态后继续新增时应提示上限并拒绝保存', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    await renderEditor(createProjectWithTenStates());

    fireEvent.click(screen.getByRole('button', { name: '+ 添加状态' }));
    fireEvent.change(screen.getByPlaceholderText('如：草稿'), { target: { value: '状态11' } });
    fireEvent.click(screen.getByRole('button', { name: '添加' }));

    expect(alertSpy).toHaveBeenCalledWith('每个状态机最多只能定义 10 个状态');
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].states).toHaveLength(10);
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].states.map((state) => state.name)).not.toContain('状态11');
  });
});