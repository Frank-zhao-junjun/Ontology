import { beforeEach, describe, expect, it } from 'vitest';
import type { Subscription } from '@/types/ontology';
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

function createSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    name: '合同索引同步',
    eventId: 'event-1',
    handler: 'async',
    action: 'webhook',
    actionRef: 'https://example.com/hooks/contracts',
    retryPolicy: {
      maxRetries: 5,
      backoff: 'exponential',
      interval: 30,
    },
    handlerId: 'contract-indexer',
    idempotencyKeyPattern: '{event_id}:{handler_id}:{entity_id}',
    ...overrides,
  };
}

describe('US-6.2 / UT-SUB-001: event subscriptions enforce handler, retry, and idempotency rules', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      versions: [],
      activeModelType: 'event',
    });
  });

  it('应允许保存带重试策略与幂等配置的异步订阅', () => {
    const store = useOntologyStore.getState();
    store.addSubscription(createSubscription());

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

  it('异步订阅缺少重试策略时应拒绝保存', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addSubscription(createSubscription({ retryPolicy: undefined }))).toThrow('异步订阅必须配置重试策略');
    expect(useOntologyStore.getState().project?.eventModel?.subscriptions).toEqual([]);
  });

  it('订阅不存在的事件时应拒绝保存', () => {
    const store = useOntologyStore.getState();

    expect(() => store.addSubscription(createSubscription({ eventId: 'event-missing' }))).toThrow('订阅必须引用已定义的事件');
    expect(useOntologyStore.getState().project?.eventModel?.subscriptions).toEqual([]);
  });

  it('同步订阅应默认补齐幂等处理器标识与幂等键模式', () => {
    const store = useOntologyStore.getState();

    store.addSubscription(createSubscription({
      id: 'sub-2',
      handler: 'sync',
      retryPolicy: {
        maxRetries: 3,
        backoff: 'fixed',
        interval: 10,
      },
      handlerId: undefined,
      idempotencyKeyPattern: undefined,
    }));

    expect(useOntologyStore.getState().project?.eventModel?.subscriptions[0]).toEqual(expect.objectContaining({
      handler: 'sync',
      retryPolicy: undefined,
      handlerId: 'sub-2',
      idempotencyKeyPattern: '{event_id}:{handler_id}',
    }));
  });
});