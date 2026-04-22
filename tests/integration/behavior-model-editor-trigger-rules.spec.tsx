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

describe('US-4.3 / IT-TRIGGER-001: behavior editor configures transition triggers and visualizes execution logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('应允许在编辑器中配置定时触发器与发布事件', async () => {
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加转换' }));
    fireEvent.change(screen.getByPlaceholderText('如：提交审批'), { target: { value: '夜间自动归档' } });
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getAllByText('已生效').at(-1) as HTMLElement);
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getAllByText('已生效').at(-1) as HTMLElement);
    fireEvent.click(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByText('定时触发'));
    fireEvent.change(screen.getByPlaceholderText('如：archiveReady == true'), { target: { value: 'archiveReady == true' } });
    fireEvent.change(screen.getByLabelText('Cron 表达式'), { target: { value: '0 0 * * *' } });
    fireEvent.click(screen.getByLabelText('发布事件'));
    fireEvent.click(screen.getByText('合同创建事件'));
    fireEvent.click(screen.getByRole('button', { name: '添加' }));

    expect(screen.getByText('夜间自动归档')).toBeInTheDocument();
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '夜间自动归档',
          trigger: 'scheduled',
          triggerConfig: expect.objectContaining({
            cron: '0 0 * * *',
            publishEventId: 'event-1',
          }),
        }),
      ]),
    );
  });

  it('事件触发转换缺少触发事件时应提示错误并拒绝保存', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    await renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加转换' }));
    fireEvent.change(screen.getByPlaceholderText('如：提交审批'), { target: { value: '事件驱动审批' } });
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getAllByText('审批中').at(-1) as HTMLElement);
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getAllByText('已生效').at(-1) as HTMLElement);
    fireEvent.click(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByText('自动触发'));
    fireEvent.change(screen.getByPlaceholderText('如：archiveReady == true'), { target: { value: 'approvalReady == true' } });
    fireEvent.click(screen.getByRole('button', { name: '添加' }));

    expect(alertSpy).toHaveBeenCalledWith('事件触发转换必须配置触发事件');
    expect(useOntologyStore.getState().project?.behaviorModel?.stateMachines[0].transitions.map((transition) => transition.name)).not.toContain('事件驱动审批');
  });

  it('应显示转换触发器的执行日志摘要', async () => {
    const project = createFrozenProject('1.0.0');
    if (project.behaviorModel?.stateMachines[0]?.transitions[0]) {
      project.behaviorModel.stateMachines[0].transitions[0] = {
        ...project.behaviorModel.stateMachines[0].transitions[0],
        uiAction: 'submit-approval',
        triggerConfig: {
          publishEventId: 'event-1',
        },
        executionLogs: [
          {
            id: 'log-1',
            triggerType: 'manual',
            status: 'success',
            triggeredAt: '2026-04-21T09:00:00.000Z',
            message: '审批提交成功',
            publishedEventId: 'event-1',
          },
        ],
      };
    }

    await renderEditor(project);

    expect(screen.getByText('日志 1')).toBeInTheDocument();
    expect(screen.getByText('最近执行：成功')).toBeInTheDocument();
  });
});