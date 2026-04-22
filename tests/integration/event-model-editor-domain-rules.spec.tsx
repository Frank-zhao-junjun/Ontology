import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EventModelEditor } from '@/components/ontology/event-model-editor';
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

function renderEditor() {
  const project = createFrozenProject('1.0.0');
  project.eventModel = null;

  useOntologyStore.setState({
    project,
    versions: [],
    activeModelType: 'event',
  });

  render(React.createElement(EventModelEditor, { mode: 'entity-detail', entityId: 'contract-1' }));
}

describe('US-6.1 / IT-EVENT-001: event editor enforces domain event rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('使用默认值创建领域事件时应落库过去式名称与默认事务阶段', () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加事件' }));
    fireEvent.click(screen.getByRole('button', { name: '添加事件' }));

    expect(screen.getByText('合同已创建')).toBeInTheDocument();
    expect(useOntologyStore.getState().project?.eventModel?.events[0]).toEqual(expect.objectContaining({
      name: '合同已创建',
      transactionPhase: 'AFTER_COMMIT',
      payload: [{ field: 'id' }],
    }));
  });

  it('非过去式名称应提示错误并拒绝保存', () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加事件' }));
    fireEvent.change(screen.getByPlaceholderText('如：创建完成'), { target: { value: '合同创建' } });
    fireEvent.click(screen.getByRole('button', { name: '添加事件' }));

    expect(alertSpy).toHaveBeenCalledWith('领域事件名称应使用过去式');
    expect(useOntologyStore.getState().project?.eventModel?.events || []).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it('状态变更事件缺少触发条件时应提示错误并拒绝保存', () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加事件' }));
    fireEvent.change(screen.getByPlaceholderText('如：创建完成'), { target: { value: '合同已审批' } });

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('状态变更时'));
    fireEvent.click(screen.getByRole('button', { name: '添加事件' }));

    expect(alertSpy).toHaveBeenCalledWith('状态变更事件必须定义触发条件');
    expect(useOntologyStore.getState().project?.eventModel?.events || []).toHaveLength(0);

    vi.unstubAllGlobals();
  });
});