import { describe, it, expectTypeOf } from 'vitest';
import type { EventSourcingConfig, DeadLetterPolicy, EventModel } from '@/types/ontology';

describe('E03 EventSourcingConfig types', () => {
  it('EventSourcingConfig has required fields', () => {
    const config: EventSourcingConfig = {
      id: 'es-1',
      snapshotInterval: 100,
      retentionDays: 30,
      storeType: 'inline',
    };
    expectTypeOf(config.id).toBeString();
    expectTypeOf(config.snapshotInterval).toBeNumber();
    expectTypeOf(config.retentionDays).toBeNumber();
    expectTypeOf(config.storeType).toMatchTypeOf<'inline' | 'external'>();
  });

  it('EventSourcingConfig storeType is restricted union', () => {
    expectTypeOf<EventSourcingConfig['storeType']>().toMatchTypeOf<'inline' | 'external'>();
    // @ts-expect-error — 'cloud' is not a valid storeType
    const _: EventSourcingConfig['storeType'] = 'cloud';
  });

  it('EventSourcingConfig description is optional', () => {
    const configWithDesc: EventSourcingConfig = {
      id: 'es-1',
      snapshotInterval: 100,
      retentionDays: 30,
      storeType: 'external',
      description: '外部事件存储配置',
    };
    expectTypeOf(configWithDesc.description).toMatchTypeOf<string | undefined>();
  });
});

describe('E05 DeadLetterPolicy types', () => {
  it('DeadLetterPolicy has required fields', () => {
    const policy: DeadLetterPolicy = {
      id: 'dlp-1',
      name: '默认死信策略',
      maxRetries: 3,
      queue: 'dlq-default',
      onExhausted: 'notify',
    };
    expectTypeOf(policy.id).toBeString();
    expectTypeOf(policy.name).toBeString();
    expectTypeOf(policy.maxRetries).toBeNumber();
    expectTypeOf(policy.queue).toBeString();
    expectTypeOf(policy.onExhausted).toMatchTypeOf<'discard' | 'replay' | 'notify'>();
  });

  it('DeadLetterPolicy onExhausted is restricted union', () => {
    expectTypeOf<DeadLetterPolicy['onExhausted']>().toMatchTypeOf<'discard' | 'replay' | 'notify'>();
    // @ts-expect-error — 'abort' is not a valid onExhausted
    const _: DeadLetterPolicy['onExhausted'] = 'abort';
  });

  it('DeadLetterPolicy nameEn and description are optional', () => {
    const policy: DeadLetterPolicy = {
      id: 'dlp-2',
      name: '支付死信',
      nameEn: 'payment-dlq',
      maxRetries: 5,
      queue: 'dlq-payment',
      onExhausted: 'replay',
      description: '支付事件处理失败的死信策略',
    };
    expectTypeOf(policy.nameEn).toMatchTypeOf<string | undefined>();
    expectTypeOf(policy.description).toMatchTypeOf<string | undefined>();
  });
});

describe('E03+E05 EventModel extended fields', () => {
  it('EventModel includes deadLetterPolicies', () => {
    expectTypeOf<EventModel['deadLetterPolicies']>().toMatchTypeOf<DeadLetterPolicy[]>();
  });

  it('EventModel eventSourcingConfig is optional', () => {
    expectTypeOf<EventModel['eventSourcingConfig']>().toMatchTypeOf<EventSourcingConfig | undefined>();
  });
});
