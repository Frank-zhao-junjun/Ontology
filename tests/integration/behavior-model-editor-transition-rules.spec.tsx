import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

async function renderEditor(project = createFrozenProject('1.0.0')) {
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

describe('US-4.2 / IT-TRANSITION-001: behavior editor enforces visible transition rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('应允许创建带条件表达式与后置动作的有效转换', async () => {
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加转换' }));
    fireEvent.change(screen.getByPlaceholderText('如：提交审批'), { target: { value: '系统自动归档' } });
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getAllByText('已生效').at(-1) as HTMLElement);
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getAllByText('已生效').at(-1) as HTMLElement);
    fireEvent.click(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByText('自动触发'));
    fireEvent.click(screen.getByLabelText('触发事件'));
    fireEvent.click(screen.getByText('合同创建事件'));
    fireEvent.change(screen.getByPlaceholderText('如：archiveReady == true'), { target: { value: 'archiveReady == true' } });
    fireEvent.change(screen.getByPlaceholderText('一行一个动作，如：emit:ContractApproved'), { target: { value: 'emit:ContractArchived' } });
    fireEvent.click(screen.getByRole('button', { name: '添加' }));

    expect(screen.getByText('系统自动归档')).toBeInTheDocument();
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '系统自动归档',
          trigger: 'automatic',
          triggerConfig: {
            eventId: 'event-1',
          },
          preConditions: ['archiveReady == true'],
          postActions: ['emit:ContractArchived'],
        }),
      ]),
    );
  });

  it('未选择起始状态和目标状态时应提示错误并拒绝保存', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加转换' }));
    fireEvent.change(screen.getByPlaceholderText('如：提交审批'), { target: { value: '缺失状态转换' } });
    fireEvent.click(screen.getByRole('button', { name: '添加' }));

    expect(alertSpy).toHaveBeenCalledWith('转换必须选择起始状态和目标状态');
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions.map((transition) => transition.name)).not.toContain('缺失状态转换');
  });

  it('自动触发转换缺少条件表达式时应提示错误并拒绝保存', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加转换' }));
    fireEvent.change(screen.getByPlaceholderText('如：提交审批'), { target: { value: '自动审批通过' } });
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getAllByText('审批中').at(-1) as HTMLElement);
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getAllByText('已生效').at(-1) as HTMLElement);
    fireEvent.click(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByText('自动触发'));
    fireEvent.click(screen.getByRole('button', { name: '添加' }));

    expect(alertSpy).toHaveBeenCalledWith('自动或定时转换必须定义触发条件');
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions.map((transition) => transition.name)).not.toContain('自动审批通过');
  });

  it('应支持编辑已有转换并保存新的条件与动作配置', async () => {
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '编辑转换 提交审批' }));
    fireEvent.change(screen.getByDisplayValue('提交审批'), { target: { value: '提交风控审批' } });
    fireEvent.change(screen.getByPlaceholderText('如：archiveReady == true'), { target: { value: 'riskApproved == true' } });
    fireEvent.change(screen.getByPlaceholderText('一行一个动作，如：emit:ContractApproved'), { target: { value: 'emit:RiskSubmitted' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('提交风控审批')).toBeInTheDocument();
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 't1',
          name: '提交风控审批',
          preConditions: ['riskApproved == true'],
          postActions: ['emit:RiskSubmitted'],
        }),
      ]),
    );
  });

  it('应支持删除已有转换', async () => {
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '删除转换 提交审批' }));

    expect(screen.queryByText('提交审批')).not.toBeInTheDocument();
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions.map((transition) => transition.id)).not.toContain('t1');
  });
});