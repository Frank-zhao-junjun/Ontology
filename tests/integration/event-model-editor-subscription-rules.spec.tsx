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

  useOntologyStore.setState({
    project,
    versions: [],
    activeModelType: 'event',
  });

  render(React.createElement(EventModelEditor, { mode: 'entity-detail', entityId: 'contract-1' }));
}

function openSubscriptionDialog() {
  const subscriptionTab = screen.getByRole('tab', { name: /订阅/i });
  fireEvent.mouseDown(subscriptionTab);
  fireEvent.click(subscriptionTab);
  fireEvent.click(screen.getByRole('button', { name: '+ 添加订阅' }));
}

describe('US-6.2 / IT-SUB-001: event editor configures subscription handler, retry, and idempotency settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('应允许创建带重试策略与幂等配置的异步订阅', () => {
    renderEditor();
    openSubscriptionDialog();

    fireEvent.change(screen.getByLabelText('订阅名称'), { target: { value: '合同索引异步同步' } });
    fireEvent.click(screen.getByLabelText('订阅事件'));
    fireEvent.click(screen.getByText('合同创建事件'));
    fireEvent.click(screen.getByLabelText('处理方式'));
    fireEvent.click(screen.getByText('异步'));
    fireEvent.click(screen.getByLabelText('动作类型'));
    fireEvent.click(screen.getByText('Webhook'));
    fireEvent.change(screen.getByLabelText('动作引用'), { target: { value: 'https://example.com/hooks/contracts' } });
    fireEvent.change(screen.getByLabelText('处理器标识'), { target: { value: 'contract-indexer' } });
    fireEvent.change(screen.getByLabelText('最大重试次数'), { target: { value: '5' } });
    fireEvent.click(screen.getByLabelText('退避策略'));
    fireEvent.click(screen.getByText('指数退避'));
    fireEvent.change(screen.getByLabelText('重试间隔（秒）'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('幂等键模式'), { target: { value: '{event_id}:{handler_id}:{entity_id}' } });
    fireEvent.click(screen.getByRole('button', { name: '添加订阅' }));

    expect(screen.getByText('合同索引异步同步')).toBeInTheDocument();
    expect(useOntologyStore.getState().project?.eventModel?.subscriptions[0]).toEqual(expect.objectContaining({
      handler: 'async',
      retryPolicy: {
        maxRetries: 5,
        backoff: 'exponential',
        interval: 30,
      },
      handlerId: 'contract-indexer',
      idempotencyKeyPattern: '{event_id}:{handler_id}:{entity_id}',
    }));
  });

  it('异步订阅缺少重试策略时应提示错误并拒绝保存', () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    renderEditor();
    openSubscriptionDialog();

    fireEvent.change(screen.getByLabelText('订阅名称'), { target: { value: '合同索引异步同步' } });
    fireEvent.click(screen.getByLabelText('订阅事件'));
    fireEvent.click(screen.getByText('合同创建事件'));
    fireEvent.click(screen.getByLabelText('处理方式'));
    fireEvent.click(screen.getByText('异步'));
    fireEvent.change(screen.getByLabelText('动作引用'), { target: { value: 'https://example.com/hooks/contracts' } });
    fireEvent.click(screen.getByRole('button', { name: '添加订阅' }));

    expect(alertSpy).toHaveBeenCalledWith('异步订阅必须配置重试策略');
    expect(useOntologyStore.getState().project?.eventModel?.subscriptions || []).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it('同步订阅应使用默认幂等配置并支持删除', () => {
    renderEditor();
    openSubscriptionDialog();

    fireEvent.change(screen.getByLabelText('订阅名称'), { target: { value: '合同通知同步' } });
    fireEvent.click(screen.getByLabelText('订阅事件'));
    fireEvent.click(screen.getByText('合同创建事件'));
    fireEvent.change(screen.getByLabelText('动作引用'), { target: { value: 'contract-template' } });
    fireEvent.click(screen.getByRole('button', { name: '添加订阅' }));

    expect(useOntologyStore.getState().project?.eventModel?.subscriptions[0]).toEqual(expect.objectContaining({
      handler: 'sync',
      handlerId: expect.any(String),
      idempotencyKeyPattern: '{event_id}:{handler_id}',
    }));

    fireEvent.click(screen.getByRole('button', { name: '删除订阅 合同通知同步' }));
    expect(useOntologyStore.getState().project?.eventModel?.subscriptions || []).toHaveLength(0);
  });
});