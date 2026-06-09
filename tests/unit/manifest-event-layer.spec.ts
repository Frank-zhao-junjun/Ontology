import { describe, it, expect } from 'vitest';
import { compileEvents } from '@/lib/manifest-compiler/events';
import type { OntologyProject } from '@/types/ontology';

const baseProject: OntologyProject = {
  id: 'p-event',
  name: 'event-golden-test',
  domain: {
    id: 'd1',
    name: '电商域',
    nameEn: 'ecommerce',
    description: '电商领域',
  },
  dataModel: {
    id: 'dm1',
    name: 'data',
    version: '1.0.0',
    domain: 'ecommerce',
    entities: [],
    enums: [],
    relations: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  } as any,
  behaviorModel: null as any,
  ruleModel: null as any,
  processModel: null as any,
  eventModel: null as any,
  epcModel: null as any,
  governanceModel: null as any,
  dataSourcesModel: null as any,
  metricsModel: null as any,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('compileEvents golden test — E03/E04/E05 layers', () => {
  describe('E03 — EventSourcingConfig', () => {
    it('should include eventSourcingConfig when configured', () => {
      const project: OntologyProject = {
        ...baseProject,
        eventModel: {
          id: 'em1',
          name: '事件模型',
          version: '1.0.0',
          domain: 'ecommerce',
          events: [],
          subscriptions: [],
          deadLetterPolicies: [],
          eventSourcingConfig: {
            id: 'es-1',
            snapshotInterval: 100,
            retentionDays: 30,
            storeType: 'inline',
            description: '默认事件溯源配置',
          },
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileEvents(project);
      expect(result.eventSourcingConfig).toMatchObject({
        id: 'es-1',
        snapshotInterval: 100,
        retentionDays: 30,
        storeType: 'inline',
        description: '默认事件溯源配置',
      });
    });

    it('should omit eventSourcingConfig when not configured', () => {
      const project: OntologyProject = {
        ...baseProject,
        eventModel: {
          id: 'em1',
          name: '事件模型',
          version: '1.0.0',
          domain: 'ecommerce',
          events: [],
          subscriptions: [],
          deadLetterPolicies: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileEvents(project);
      expect(result.eventSourcingConfig).toBeUndefined();
    });
  });

  describe('E05 — DeadLetterPolicies', () => {
    it('should map dead letter policies to manifest format', () => {
      const project: OntologyProject = {
        ...baseProject,
        eventModel: {
          id: 'em1',
          name: '事件模型',
          version: '1.0.0',
          domain: 'ecommerce',
          events: [],
          subscriptions: [],
          deadLetterPolicies: [
            {
              id: 'dlp-1',
              name: '默认死信策略',
              nameEn: 'default-dlq',
              maxRetries: 3,
              queue: 'dlq-default',
              onExhausted: 'notify',
              description: '默认处理策略',
            },
            {
              id: 'dlp-2',
              name: '支付死信',
              maxRetries: 5,
              queue: 'dlq-payment',
              onExhausted: 'replay',
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileEvents(project);
      expect(result.deadLetterPolicies).toHaveLength(2);
      expect(result.deadLetterPolicies![0]).toMatchObject({
        id: 'dlp-1',
        name: '默认死信策略',
        nameEn: 'default-dlq',
        maxRetries: 3,
        queue: 'dlq-default',
        onExhausted: 'notify',
      });
      expect(result.deadLetterPolicies![1]).toMatchObject({
        id: 'dlp-2',
        name: '支付死信',
        maxRetries: 5,
        queue: 'dlq-payment',
        onExhausted: 'replay',
      });
    });

    it('should return empty array when no dead letter policies', () => {
      const project: OntologyProject = {
        ...baseProject,
        eventModel: {
          id: 'em1',
          name: '事件模型',
          version: '1.0.0',
          domain: 'ecommerce',
          events: [],
          subscriptions: [],
          deadLetterPolicies: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileEvents(project);
      expect(result.deadLetterPolicies).toEqual([]);
    });
  });

  describe('E04 — Subscription deadLetterPolicyId', () => {
    it('should include deadLetterPolicyId in handler output', () => {
      const project: OntologyProject = {
        ...baseProject,
        eventModel: {
          id: 'em1',
          name: '事件模型',
          version: '1.0.0',
          domain: 'ecommerce',
          events: [],
          subscriptions: [
            {
              id: 'sub-1',
              name: '邮件通知订阅',
              eventId: 'ev-order-created',
              actionRef: 'action-send-email',
              handler: 'async',
              action: 'notification',
              retryPolicy: { maxRetries: 3, backoff: 'fixed', interval: 1000 },
              deadLetterPolicyId: 'dlp-1',
            },
          ],
          deadLetterPolicies: [
            {
              id: 'dlp-1',
              name: '默认死信',
              maxRetries: 3,
              queue: 'dlq-default',
              onExhausted: 'notify',
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileEvents(project);
      expect(result.handlers).toHaveLength(1);
      expect(result.handlers![0]).toMatchObject({
        id: 'sub-1',
        eventId: 'ev-order-created',
        actionRef: 'action-send-email',
        deadLetterPolicyId: 'dlp-1',
      });
    });

    it('should handle subscription without deadLetterPolicyId', () => {
      const project: OntologyProject = {
        ...baseProject,
        eventModel: {
          id: 'em1',
          name: '事件模型',
          version: '1.0.0',
          domain: 'ecommerce',
          events: [],
          subscriptions: [
            {
              id: 'sub-2',
              name: '订单履约订阅',
              eventId: 'ev-order-paid',
              actionRef: 'action-fulfill',
              handler: 'sync',
              action: 'skill',
            },
          ],
          deadLetterPolicies: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileEvents(project);
      expect(result.handlers![0].deadLetterPolicyId).toBeUndefined();
    });
  });

  describe('Full golden — all E03/E04/E05 combined', () => {
    it('should produce complete event manifest with all layers', () => {
      const project: OntologyProject = {
        ...baseProject,
        eventModel: {
          id: 'em1',
          name: '事件模型',
          version: '1.0.0',
          domain: 'ecommerce',
          events: [],
          subscriptions: [
            {
              id: 'sub-1',
              name: '通知订阅',
              eventId: 'ev-order-created',
              actionRef: 'action-notify',
              handler: 'async',
              action: 'notification',
              retryPolicy: { maxRetries: 3, backoff: 'fixed', interval: 2000 },
              deadLetterPolicyId: 'dlp-1',
            },
          ],
          deadLetterPolicies: [
            {
              id: 'dlp-1',
              name: '标准死信策略',
              nameEn: 'standard-dlq',
              maxRetries: 3,
              queue: 'dlq-standard',
              onExhausted: 'notify',
            },
          ],
          eventSourcingConfig: {
            id: 'es-1',
            snapshotInterval: 50,
            retentionDays: 90,
            storeType: 'external',
          },
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };

      const result = compileEvents(project);

      // E03: event sourcing
      expect(result.eventSourcingConfig?.snapshotInterval).toBe(50);
      expect(result.eventSourcingConfig?.storeType).toBe('external');

      // E04: subscription with dead letter ref
      expect(result.handlers![0].deadLetterPolicyId).toBe('dlp-1');

      // E05: dead letter policy
      expect(result.deadLetterPolicies![0].name).toBe('标准死信策略');
      expect(result.deadLetterPolicies![0].onExhausted).toBe('notify');
    });
  });
});
