import { describe, expect, it } from 'vitest';
import { ensureEventDefinitionRules, ensureSubscriptionRules } from '@/lib/validation/event-validation';
import type { EventDefinition, Subscription, OntologyProject, Entity } from '@/types/ontology';

function createMockProject(entities: Entity[] = []): OntologyProject {
  return {
    id: 'project-1',
    name: '测试项目',
    description: '测试',
    domain: { id: 'domain-1', name: '测试领域', nameEn: 'TestDomain', description: '测试' },
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [],
      businessScenarios: [],
      entities,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: {
      id: 'em-1',
      name: '事件模型',
      version: '1.0.0',
      domain: 'domain-1',
      events: [],
      subscriptions: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    epcModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'entity-1',
    name: '测试实体',
    nameEn: 'TestEntity',
    projectId: 'module-1',
    businessScenarioId: 'scenario-1',
    entityRole: 'aggregate_root',
    attributes: [],
    relations: [],
    ...overrides,
  };
}

function createEvent(overrides: Partial<EventDefinition> = {}): EventDefinition {
  return {
    id: 'event-1',
    name: '已创建',
    entity: 'entity-1',
    entityRole: 'aggregate_root',
    trigger: 'create',
    payload: [{ field: 'id' }],
    transactionPhase: 'AFTER_COMMIT',
    ...overrides,
  };
}

function createSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    name: '订阅1',
    eventId: 'event-1',
    action: 'skill',
    handler: 'sync',
    actionRef: 'action-1',
    ...overrides,
  };
}

describe('event-validation', () => {
  describe('ensureEventDefinitionRules', () => {
    it('非聚合根不能定义领域事件', () => {
      const childEntity = createEntity({ id: 'child-1', entityRole: 'child_entity' });
      const project = createMockProject([childEntity]);
      const event = createEvent({ entity: 'child-1', entityRole: 'child_entity' });
      expect(() => ensureEventDefinitionRules(event, project)).toThrow('只有聚合根可以定义领域事件');
    });

    it('事件名称应使用过去式（包含"已"）', () => {
      const project = createMockProject([createEntity()]);
      const event = createEvent({ name: '创建' });
      expect(() => ensureEventDefinitionRules(event, project)).toThrow('领域事件名称应使用过去式');
    });

    it('状态变更事件必须定义触发条件', () => {
      const project = createMockProject([createEntity()]);
      const event = createEvent({
        trigger: 'state_change',
        condition: '',
      });
      expect(() => ensureEventDefinitionRules(event, project)).toThrow('状态变更事件必须定义触发条件');
    });

    it('有效的事件应正常通过校验', () => {
      const project = createMockProject([createEntity()]);
      const event = createEvent();
      const result = ensureEventDefinitionRules(event, project);
      expect(result).toBeDefined();
      expect(result.name).toBe('已创建');
      expect(result.transactionPhase).toBe('AFTER_COMMIT');
    });

    it('没有payload时应默认添加id字段', () => {
      const project = createMockProject([createEntity()]);
      const event = createEvent({ payload: [] });
      const result = ensureEventDefinitionRules(event, project);
      expect(result.payload).toHaveLength(1);
      expect(result.payload![0].field).toBe('id');
    });

    it('应自动设置默认事务阶段为AFTER_COMMIT', () => {
      const project = createMockProject([createEntity()]);
      const event = createEvent({ transactionPhase: undefined });
      const result = ensureEventDefinitionRules(event, project);
      expect(result.transactionPhase).toBe('AFTER_COMMIT');
    });
  });

  describe('ensureSubscriptionRules', () => {
    it('订阅名称不能为空', () => {
      const project = createMockProject();
      project.eventModel!.events = [createEvent()];
      const subscription = createSubscription({ name: '' });
      expect(() => ensureSubscriptionRules(subscription, project)).toThrow('订阅名称不能为空');
    });

    it('订阅必须引用已定义的事件', () => {
      const project = createMockProject();
      const subscription = createSubscription({ eventId: 'non-existent-event' });
      expect(() => ensureSubscriptionRules(subscription, project)).toThrow('订阅必须引用已定义的事件');
    });

    it('订阅动作引用不能为空', () => {
      const project = createMockProject();
      project.eventModel!.events = [createEvent()];
      const subscription = createSubscription({ actionRef: '' });
      expect(() => ensureSubscriptionRules(subscription, project)).toThrow('订阅动作引用不能为空');
    });

    it('异步订阅必须配置重试策略', () => {
      const project = createMockProject();
      project.eventModel!.events = [createEvent()];
      const subscription = createSubscription({ handler: 'async', retryPolicy: undefined });
      expect(() => ensureSubscriptionRules(subscription, project)).toThrow('异步订阅必须配置重试策略');
    });

    it('异步订阅重试次数必须大于0', () => {
      const project = createMockProject();
      project.eventModel!.events = [createEvent()];
      const subscription = createSubscription({
        handler: 'async',
        retryPolicy: { maxRetries: 0, interval: 1000, backoff: 'fixed' },
      });
      expect(() => ensureSubscriptionRules(subscription, project)).toThrow('重试次数必须大于 0');
    });

    it('异步订阅重试间隔必须大于0', () => {
      const project = createMockProject();
      project.eventModel!.events = [createEvent()];
      const subscription = createSubscription({
        handler: 'async',
        retryPolicy: { maxRetries: 3, interval: 0, backoff: 'fixed' },
      });
      expect(() => ensureSubscriptionRules(subscription, project)).toThrow('重试间隔必须大于 0');
    });

    it('有效的同步订阅应正常通过校验', () => {
      const project = createMockProject();
      project.eventModel!.events = [createEvent()];
      const subscription = createSubscription();
      const result = ensureSubscriptionRules(subscription, project);
      expect(result).toBeDefined();
      expect(result.name).toBe('订阅1');
    });

    it('有效的异步订阅应正常通过校验', () => {
      const project = createMockProject();
      project.eventModel!.events = [createEvent()];
      const subscription = createSubscription({
        handler: 'async',
        retryPolicy: { maxRetries: 3, interval: 1000, backoff: 'exponential' },
      });
      const result = ensureSubscriptionRules(subscription, project);
      expect(result).toBeDefined();
      expect(result.handler).toBe('async');
      expect(result.retryPolicy).toBeDefined();
      expect(result.retryPolicy!.maxRetries).toBe(3);
    });

    it('应自动设置默认的handlerId和幂等键模式', () => {
      const project = createMockProject();
      project.eventModel!.events = [createEvent()];
      const subscription = createSubscription({
        handlerId: undefined,
        idempotencyKeyPattern: undefined,
      });
      const result = ensureSubscriptionRules(subscription, project);
      expect(result.handlerId).toBe('sub-1');
      expect(result.idempotencyKeyPattern).toBe('{event_id}:{handler_id}');
    });
  });
});
