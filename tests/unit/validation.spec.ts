import { describe, it, expect } from 'vitest';
import {
  ensureEntityScenario,
  ensureEntityAggregateBoundary,
  collectCascadeEntityIds,
  ensureAggregateRootRoleChangeSafety,
  ensureStateMachineRules,
  ensureEventDefinitionRules,
  ensureSubscriptionRules,
  ensureRuleDefinitionRules,
} from '../../src/store/validation';
import type {
  Entity,
  StateMachine,
  Transition,
  EventDefinition,
  Subscription,
  Rule,
  RuleCondition,
  OntologyProject,
} from '../../src/types/ontology';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMinimalEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'ent-1',
    name: '物料',
    nameEn: 'Material',
    projectId: 'proj-1',
    businessScenarioId: 'bs-1',
    entityRole: 'aggregate_root',
    attributes: [],
    relations: [],
    ...overrides,
  };
}

function makeMinimalProject(overrides: Partial<OntologyProject> = {}): OntologyProject {
  return {
    id: 'proj-1',
    name: 'Test',
    description: '',
    domain: { id: 'd1', name: 'Test', nameEn: 'Test', description: '', icon: '', color: '' },
    dataModel: {
      id: 'dm-1',
      name: 'DataModel',
      version: '1.0',
      domain: 'Test',
      projects: [],
      businessScenarios: [{ id: 'bs-1', name: '生产管理', nameEn: 'ProductionMgmt', description: '', projectId: 'proj-1' }],
      entities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeMinimalStateMachine(overrides: Partial<StateMachine> = {}): StateMachine {
  return {
    id: 'sm-1',
    name: '物料状态机',
    entity: 'ent-1',
    statusField: 'status',
    states: [
      { id: 's-1', name: '草稿', isInitial: true },
      { id: 's-2', name: '已发布', isFinal: true },
    ],
    transitions: [
      { id: 't-1', name: '发布', from: 's-1', to: 's-2', trigger: 'manual' },
    ],
    ...overrides,
  };
}

function makeMinimalEvent(overrides: Partial<EventDefinition> = {}): EventDefinition {
  return {
    id: 'evt-1',
    name: '物料已创建',
    nameEn: 'MaterialCreated',
    entity: 'ent-1',
    trigger: 'create',
    payload: [{ field: 'id' }],
    ...overrides,
  };
}

function makeMinimalSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    name: '物料创建通知',
    eventId: 'evt-1',
    handler: 'sync',
    action: 'notification',
    actionRef: 'notify-admin',
    ...overrides,
  };
}

function makeMinimalRuleCondition(overrides: Partial<RuleCondition> = {}): RuleCondition {
  return {
    type: 'regex',
    pattern: '^[A-Z]+$',
    ...overrides,
  };
}

function makeMinimalRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    name: '物料编码校验',
    type: 'field_validation',
    entity: 'ent-1',
    field: 'code',
    condition: makeMinimalRuleCondition(),
    errorMessage: '校验失败',
    enabled: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ensureEntityScenario
// ---------------------------------------------------------------------------
describe('ensureEntityScenario', () => {
  it('should return normalized entity when businessScenarioId is set', () => {
    const project = makeMinimalProject();
    const entity = makeMinimalEntity({ businessScenarioId: 'bs-1' });
    const result = ensureEntityScenario(entity, project);
    expect(result).toBeDefined();
    expect(result.businessScenarioId).toBe('bs-1');
  });

  it('should auto-resolve scenario when only one exists', () => {
    const project = makeMinimalProject();
    const entity = makeMinimalEntity({ businessScenarioId: '' });
    // normalizeEntity auto-resolves to the single scenario
    const result = ensureEntityScenario(entity, project);
    expect(result.businessScenarioId).toBe('bs-1');
  });

  it('should throw when no scenario can be resolved', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        businessScenarios: [],
      },
    });
    const entity = makeMinimalEntity({ businessScenarioId: '' });
    expect(() => ensureEntityScenario(entity, project)).toThrow('实体必须归属一个业务场景');
  });

  it('should handle null project', () => {
    const entity = makeMinimalEntity({ businessScenarioId: '' });
    expect(() => ensureEntityScenario(entity, null)).toThrow('实体必须归属一个业务场景');
  });
});

// ---------------------------------------------------------------------------
// ensureEntityAggregateBoundary
// ---------------------------------------------------------------------------
describe('ensureEntityAggregateBoundary', () => {
  it('should allow aggregate_root without parentAggregateId', () => {
    const project = makeMinimalProject();
    const entity = makeMinimalEntity({
      entityRole: 'aggregate_root',
      parentAggregateId: undefined,
    });
    const result = ensureEntityAggregateBoundary(entity, project);
    expect(result.entityRole).toBe('aggregate_root');
  });

  it('should throw when aggregate_root has parentAggregateId', () => {
    const project = makeMinimalProject();
    const entity = makeMinimalEntity({
      entityRole: 'aggregate_root',
      parentAggregateId: 'ent-other',
    });
    expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('聚合根不能指定所属聚合根');
  });

  it('should throw when child_entity lacks parentAggregateId', () => {
    const project = makeMinimalProject();
    const entity = makeMinimalEntity({
      entityRole: 'child_entity',
      parentAggregateId: undefined,
    });
    expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('子实体必须指定所属聚合根');
  });

  it('should throw when child_entity self-references as parent', () => {
    const project = makeMinimalProject();
    const entity = makeMinimalEntity({
      id: 'ent-1',
      entityRole: 'child_entity',
      parentAggregateId: 'ent-1',
    });
    expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('子实体不能将自己作为所属聚合根');
  });

  it('should throw when parent aggregate does not exist', () => {
    const project = makeMinimalProject();
    const entity = makeMinimalEntity({
      id: 'ent-1',
      entityRole: 'child_entity',
      parentAggregateId: 'non-existent',
    });
    expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('父聚合根不存在');
  });

  it('should throw when parent entity is not an aggregate_root', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [
          makeMinimalEntity({
            id: 'parent-1',
            entityRole: 'child_entity',
            parentAggregateId: undefined,
          }),
        ],
      },
    });
    const entity = makeMinimalEntity({
      id: 'child-1',
      entityRole: 'child_entity',
      parentAggregateId: 'parent-1',
    });
    expect(() => ensureEntityAggregateBoundary(entity, project)).toThrow('父聚合根不存在');
  });

  it('should accept child_entity with valid aggregate_root parent', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [
          makeMinimalEntity({
            id: 'root-1',
            entityRole: 'aggregate_root',
            parentAggregateId: undefined,
          }),
        ],
      },
    });
    const entity = makeMinimalEntity({
      id: 'child-1',
      entityRole: 'child_entity',
      parentAggregateId: 'root-1',
    });
    const result = ensureEntityAggregateBoundary(entity, project);
    expect(result.entityRole).toBe('child_entity');
    expect(result.parentAggregateId).toBe('root-1');
  });
});

// ---------------------------------------------------------------------------
// collectCascadeEntityIds
// ---------------------------------------------------------------------------
describe('collectCascadeEntityIds', () => {
  it('should return only the root when no children exist', () => {
    const entities: Entity[] = [
      makeMinimalEntity({ id: 'root', entityRole: 'aggregate_root' }),
    ];
    const result = collectCascadeEntityIds(entities, 'root');
    expect(result.size).toBe(1);
    expect(result.has('root')).toBe(true);
  });

  it('should collect direct children', () => {
    const entities: Entity[] = [
      makeMinimalEntity({ id: 'root', entityRole: 'aggregate_root' }),
      makeMinimalEntity({ id: 'child-1', entityRole: 'child_entity', parentAggregateId: 'root' }),
    ];
    const result = collectCascadeEntityIds(entities, 'root');
    expect(result.size).toBe(2);
    expect(result.has('root')).toBe(true);
    expect(result.has('child-1')).toBe(true);
  });

  it('should collect nested children (grandchildren)', () => {
    const entities: Entity[] = [
      makeMinimalEntity({ id: 'root', entityRole: 'aggregate_root' }),
      makeMinimalEntity({ id: 'child-1', entityRole: 'child_entity', parentAggregateId: 'root' }),
      makeMinimalEntity({ id: 'child-2', entityRole: 'child_entity', parentAggregateId: 'child-1' }),
    ];
    const result = collectCascadeEntityIds(entities, 'root');
    expect(result.size).toBe(3);
    expect(result.has('root')).toBe(true);
    expect(result.has('child-1')).toBe(true);
    expect(result.has('child-2')).toBe(true);
  });

  it('should skip entities not in the hierarchy', () => {
    const entities: Entity[] = [
      makeMinimalEntity({ id: 'root', entityRole: 'aggregate_root' }),
      makeMinimalEntity({ id: 'other', entityRole: 'aggregate_root' }),
      makeMinimalEntity({ id: 'child', entityRole: 'child_entity', parentAggregateId: 'other' }),
    ];
    const result = collectCascadeEntityIds(entities, 'root');
    expect(result.size).toBe(1);
    expect(result.has('root')).toBe(true);
    expect(result.has('other')).toBe(false);
    expect(result.has('child')).toBe(false);
  });

  it('should return empty-ish set when root is not in entities', () => {
    const entities: Entity[] = [
      makeMinimalEntity({ id: 'other', entityRole: 'aggregate_root' }),
    ];
    const result = collectCascadeEntityIds(entities, 'non-existent');
    // The id is still added even if not present in the array
    expect(result.size).toBe(1);
    expect(result.has('non-existent')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ensureAggregateRootRoleChangeSafety
// ---------------------------------------------------------------------------
describe('ensureAggregateRootRoleChangeSafety', () => {
  it('should allow no-op when entity is not an aggregate_root initially', () => {
    const existing = makeMinimalEntity({ entityRole: 'child_entity' });
    const next = makeMinimalEntity({ entityRole: 'child_entity' });
    // Should not throw
    expect(() => ensureAggregateRootRoleChangeSafety(existing, next, null)).not.toThrow();
  });

  it('should allow change from non-root to root', () => {
    const existing = makeMinimalEntity({ entityRole: 'child_entity' });
    const next = makeMinimalEntity({ entityRole: 'aggregate_root' });
    expect(() => ensureAggregateRootRoleChangeSafety(existing, next, null)).not.toThrow();
  });

  it('should allow demotion when no child entities exist', () => {
    const project = makeMinimalProject();
    const existing = makeMinimalEntity({ entityRole: 'aggregate_root', id: 'root-1' });
    const next = makeMinimalEntity({ entityRole: 'child_entity', id: 'root-1' });
    expect(() => ensureAggregateRootRoleChangeSafety(existing, next, project)).not.toThrow();
  });

  it('should throw demotion when child entities exist', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [
          makeMinimalEntity({ id: 'root-1', entityRole: 'aggregate_root' }),
          makeMinimalEntity({ id: 'child-1', entityRole: 'child_entity', parentAggregateId: 'root-1' }),
        ],
      },
    });
    const existing = makeMinimalEntity({ entityRole: 'aggregate_root', id: 'root-1' });
    const next = makeMinimalEntity({ entityRole: 'child_entity', id: 'root-1' });
    expect(() => ensureAggregateRootRoleChangeSafety(existing, next, project)).toThrow(
      '存在归属到当前聚合根的子实体，不能直接降级',
    );
  });

  it('should allow keeping aggregate_root role even with children', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [
          makeMinimalEntity({ id: 'root-1', entityRole: 'aggregate_root' }),
          makeMinimalEntity({ id: 'child-1', entityRole: 'child_entity', parentAggregateId: 'root-1' }),
        ],
      },
    });
    const existing = makeMinimalEntity({ entityRole: 'aggregate_root', id: 'root-1' });
    const next = makeMinimalEntity({ entityRole: 'aggregate_root', id: 'root-1' });
    // root -> root with children: no error (role didn't change away from aggregate_root)
    expect(() => ensureAggregateRootRoleChangeSafety(existing, next, project)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ensureStateMachineRules
// ---------------------------------------------------------------------------
describe('ensureStateMachineRules', () => {
  it('should return normalized state machine', () => {
    const project = makeMinimalProject();
    const sm = makeMinimalStateMachine();
    const result = ensureStateMachineRules(sm, project);
    expect(result).toBeDefined();
    expect(result.transitions).toHaveLength(1);
    expect(result.transitions[0].name).toBe('发布');
    expect(result.transitions[0].description).toBeUndefined();
  });

  it('should throw when more than 10 states', () => {
    const sm = makeMinimalStateMachine({
      states: Array.from({ length: 11 }, (_, i) => ({
        id: `s-${i}`,
        name: `State ${i}`,
        isInitial: i === 0,
      })),
    });
    expect(() => ensureStateMachineRules(sm, null)).toThrow('每个状态机最多只能定义 10 个状态');
  });

  it('should throw on duplicate state IDs', () => {
    const sm = makeMinimalStateMachine({
      states: [
        { id: 's-1', name: '草稿', isInitial: true },
        { id: 's-1', name: '重复', isFinal: true },
      ],
    });
    expect(() => ensureStateMachineRules(sm, null)).toThrow('状态编码不能重复');
  });

  it('should throw on more than one initial state', () => {
    const sm = makeMinimalStateMachine({
      states: [
        { id: 's-1', name: '草稿', isInitial: true },
        { id: 's-2', name: '待审', isInitial: true },
      ],
    });
    expect(() => ensureStateMachineRules(sm, null)).toThrow('状态机只能有一个初始状态');
  });

  it('should throw when removed state is still referenced in transitions', () => {
    const previousSm = makeMinimalStateMachine({
      id: 'sm-1',
      states: [
        { id: 's-1', name: '草稿', isInitial: true },
        { id: 's-2', name: '已发布', isFinal: true },
        { id: 's-3', name: '待审' },
      ],
      transitions: [
        { id: 't-1', name: '提交', from: 's-1', to: 's-3', trigger: 'manual' },
        { id: 't-2', name: '发布', from: 's-3', to: 's-2', trigger: 'manual' },
      ],
    });
    // New SM removes s-3, but a transition still references it
    const sm = makeMinimalStateMachine({
      id: 'sm-1',
      states: [
        { id: 's-1', name: '草稿', isInitial: true },
        { id: 's-2', name: '已发布', isFinal: true },
      ],
      transitions: [
        { id: 't-1', name: '发布', from: 's-1', to: 's-2', trigger: 'manual' },
      ],
    });
    expect(() => ensureStateMachineRules(sm, null, previousSm)).toThrow('状态已被转换规则引用，不能删除');
  });

  it('should throw when transition references invalid state', () => {
    const sm = makeMinimalStateMachine({
      transitions: [
        { id: 't-1', name: '无效转换', from: 'non-existent', to: 's-2', trigger: 'manual' },
      ],
    });
    expect(() => ensureStateMachineRules(sm, null)).toThrow('转换必须引用有效的起始状态和目标状态');
  });

  it('should throw when automatic transition has no eventId', () => {
    const project = makeMinimalProject();
    const sm = makeMinimalStateMachine({
      transitions: [
        {
          id: 't-1', name: '自动转换', from: 's-1', to: 's-2',
          trigger: 'automatic',
          preConditions: ['condition1'],
        },
      ],
    });
    expect(() => ensureStateMachineRules(sm, project)).toThrow('事件触发转换必须配置触发事件');
  });

  it('should throw when automatic transition references non-existent event', () => {
    const project = makeMinimalProject({
      eventModel: { id: 'em-1', name: 'Events', version: '1', domain: 'Test', events: [], subscriptions: [], createdAt: '', updatedAt: '' },
    });
    const sm = makeMinimalStateMachine({
      transitions: [
        {
          id: 't-1', name: '自动转换', from: 's-1', to: 's-2',
          trigger: 'automatic',
          preConditions: ['condition1'],
          triggerConfig: { eventId: 'non-existent-event' },
        },
      ],
    });
    expect(() => ensureStateMachineRules(sm, project)).toThrow('事件触发转换必须引用已定义的领域事件');
  });

  it('should accept automatic transition with valid event', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [makeMinimalEvent({ id: 'evt-valid', name: '物料已创建' })],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sm = makeMinimalStateMachine({
      transitions: [
        {
          id: 't-1', name: '自动转换', from: 's-1', to: 's-2',
          trigger: 'automatic',
          preConditions: ['condition1'],
          triggerConfig: { eventId: 'evt-valid' },
        },
      ],
    });
    const result = ensureStateMachineRules(sm, project);
    expect(result.transitions[0].triggerConfig?.eventId).toBe('evt-valid');
  });

  it('should throw when scheduled transition has no cron', () => {
    const sm = makeMinimalStateMachine({
      transitions: [
        {
          id: 't-1', name: '定时转换', from: 's-1', to: 's-2',
          trigger: 'scheduled',
          preConditions: ['condition1'],
        },
      ],
    });
    expect(() => ensureStateMachineRules(sm, null)).toThrow('定时触发转换必须配置 Cron 表达式');
  });

  it('should throw when automatic/scheduled transition has no preConditions', () => {
    const sm = makeMinimalStateMachine({
      transitions: [
        {
          id: 't-1', name: '自动转换', from: 's-1', to: 's-2',
          trigger: 'automatic',
          preConditions: [],
        },
      ],
    });
    expect(() => ensureStateMachineRules(sm, null)).toThrow('自动或定时转换必须定义触发条件');
  });

  it('should throw when publishEventId references non-existent event', () => {
    const project = makeMinimalProject({
      eventModel: { id: 'em-1', name: 'Events', version: '1', domain: 'Test', events: [], subscriptions: [], createdAt: '', updatedAt: '' },
    });
    const sm = makeMinimalStateMachine({
      transitions: [
        {
          id: 't-1', name: '手动', from: 's-1', to: 's-2',
          trigger: 'manual',
          triggerConfig: { publishEventId: 'non-existent' },
        },
      ],
    });
    expect(() => ensureStateMachineRules(sm, project)).toThrow('触发器发布事件必须引用已定义的领域事件');
  });

  it('should normalize from (string => string) for manual triggers', () => {
    const sm = makeMinimalStateMachine({
      transitions: [
        { id: 't-1', name: '发布', from: ' s-1 ', to: ' s-2 ', trigger: 'manual' },
      ],
    });
    const result = ensureStateMachineRules(sm, null);
    expect(result.transitions[0].from).toBe('s-1');
    expect(result.transitions[0].to).toBe('s-2');
  });

  it('should normalize from (array) for array-based transitions', () => {
    const sm = makeMinimalStateMachine({
      states: [
        { id: 's-1', name: '草稿', isInitial: true },
        { id: 's-2', name: '待审' },
        { id: 's-3', name: '已发布', isFinal: true },
      ],
      transitions: [
        { id: 't-1', name: '前进', from: [' s-1 ', ' s-2 '], to: ' s-3 ', trigger: 'manual' },
      ],
    });
    const result = ensureStateMachineRules(sm, null);
    expect(Array.isArray(result.transitions[0].from)).toBe(true);
    expect((result.transitions[0].from as string[])).toEqual(['s-1', 's-2']);
  });
});

// ---------------------------------------------------------------------------
// ensureEventDefinitionRules
// ---------------------------------------------------------------------------
describe('ensureEventDefinitionRules', () => {
  it('should return normalized event for valid aggregate root', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1', entityRole: 'aggregate_root' })],
      },
    });
    const event = makeMinimalEvent({ entity: 'ent-1' });
    const result = ensureEventDefinitionRules(event, project);
    expect(result.name).toBe('物料已创建');
    expect(result.entityIsAggregateRoot).toBe(true);
    expect(result.transactionPhase).toBe('AFTER_COMMIT');
  });

  it('should throw when entity is not aggregate_root', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1', entityRole: 'child_entity' })],
      },
    });
    const event = makeMinimalEvent({ entity: 'ent-1' });
    expect(() => ensureEventDefinitionRules(event, project)).toThrow('只有聚合根可以定义领域事件');
  });

  it('should throw when event name does not contain "已"', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1', entityRole: 'aggregate_root' })],
      },
    });
    const event = makeMinimalEvent({ entity: 'ent-1', name: '物料创建' });
    expect(() => ensureEventDefinitionRules(event, project)).toThrow('领域事件名称应使用过去式');
  });

  it('should throw when state_change event has no condition', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1', entityRole: 'aggregate_root' })],
      },
    });
    const event = makeMinimalEvent({ entity: 'ent-1', trigger: 'state_change', condition: '' });
    expect(() => ensureEventDefinitionRules(event, project)).toThrow('状态变更事件必须定义触发条件');
  });

  it('should accept state_change event with condition', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1', entityRole: 'aggregate_root' })],
      },
    });
    const event = makeMinimalEvent({
      entity: 'ent-1',
      trigger: 'state_change',
      condition: ' status == "published" ',
    });
    const result = ensureEventDefinitionRules(event, project);
    expect(result.condition).toBe('status == "published"');
  });

  it('should throw when domain event has more than 5 payloadFields', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1', entityRole: 'aggregate_root' })],
      },
    });
    const event = makeMinimalEvent({
      entity: 'ent-1',
      isDomainEvent: true,
      payloadFields: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(() => ensureEventDefinitionRules(event, project)).toThrow('领域事件的 payloadFields 最多 5 个字段');
  });

  it('should allow domain event with <= 5 payloadFields', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1', entityRole: 'aggregate_root' })],
      },
    });
    const event = makeMinimalEvent({
      entity: 'ent-1',
      isDomainEvent: true,
      payloadFields: ['a', 'b', 'c'],
    });
    const result = ensureEventDefinitionRules(event, project);
    expect(result.isDomainEvent).toBe(true);
    expect(result.payloadFields).toEqual(['a', 'b', 'c']);
  });

  it('should normalize payload (trim fields, remove empties, default [{field:"id"}])', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1', entityRole: 'aggregate_root' })],
      },
    });
    const event = makeMinimalEvent({
      entity: 'ent-1',
      payload: [
        { field: '  name  ', path: ' /data/name ' },
        { field: '', path: undefined },
      ],
    });
    const result = ensureEventDefinitionRules(event, project);
    expect(result.payload).toHaveLength(1);
    expect(result.payload[0].field).toBe('name');
  });

  it('should handle project with null dataModel', () => {
    const project = makeMinimalProject({ dataModel: null });
    // Without dataModel, entity lookup fails → expect throw about aggregate root
    const event = makeMinimalEvent();
    expect(() => ensureEventDefinitionRules(event, project)).toThrow('只有聚合根可以定义领域事件');
  });
});

// ---------------------------------------------------------------------------
// ensureSubscriptionRules
// ---------------------------------------------------------------------------
describe('ensureSubscriptionRules', () => {
  it('should return normalized subscription', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [makeMinimalEvent({ id: 'evt-1' })],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sub = makeMinimalSubscription({ eventId: 'evt-1' });
    const result = ensureSubscriptionRules(sub, project);
    expect(result.name).toBe('物料创建通知');
    expect(result.eventId).toBe('evt-1');
    expect(result.handlerId).toBe('sub-1');
    expect(result.idempotencyKeyPattern).toBe('{event_id}:{handler_id}');
  });

  it('should throw when name is empty', () => {
    const sub = makeMinimalSubscription({ name: '  ' });
    expect(() => ensureSubscriptionRules(sub, null)).toThrow('订阅名称不能为空');
  });

  it('should throw when event does not exist', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sub = makeMinimalSubscription({ eventId: 'non-existent' });
    expect(() => ensureSubscriptionRules(sub, project)).toThrow('订阅必须引用已定义的事件');
  });

  it('should throw when actionRef is empty', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [makeMinimalEvent({ id: 'evt-1' })],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sub = makeMinimalSubscription({ eventId: 'evt-1', actionRef: '  ' });
    expect(() => ensureSubscriptionRules(sub, project)).toThrow('订阅动作引用不能为空');
  });

  it('should throw when async handler has no retryPolicy', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [makeMinimalEvent({ id: 'evt-1' })],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sub = makeMinimalSubscription({ eventId: 'evt-1', handler: 'async', retryPolicy: undefined });
    expect(() => ensureSubscriptionRules(sub, project)).toThrow('异步订阅必须配置重试策略');
  });

  it('should throw when async retryPolicy.maxRetries < 1', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [makeMinimalEvent({ id: 'evt-1' })],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sub = makeMinimalSubscription({
      eventId: 'evt-1', handler: 'async',
      retryPolicy: { maxRetries: 0, backoff: 'fixed', interval: 1000 },
    });
    expect(() => ensureSubscriptionRules(sub, project)).toThrow('重试次数必须大于 0');
  });

  it('should throw when async retryPolicy.interval < 1', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [makeMinimalEvent({ id: 'evt-1' })],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sub = makeMinimalSubscription({
      eventId: 'evt-1', handler: 'async',
      retryPolicy: { maxRetries: 3, backoff: 'fixed', interval: 0 },
    });
    expect(() => ensureSubscriptionRules(sub, project)).toThrow('重试间隔必须大于 0');
  });

  it('should accept async handler with valid retryPolicy', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [makeMinimalEvent({ id: 'evt-1' })],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sub = makeMinimalSubscription({
      eventId: 'evt-1', handler: 'async',
      retryPolicy: { maxRetries: 3, backoff: 'fixed', interval: 1000 },
    });
    const result = ensureSubscriptionRules(sub, project);
    expect(result.retryPolicy).toBeDefined();
    expect(result.retryPolicy!.maxRetries).toBe(3);
  });

  it('should normalize description, handlerId and idempotencyKeyPattern', () => {
    const project = makeMinimalProject({
      eventModel: {
        id: 'em-1', name: 'Events', version: '1', domain: 'Test',
        events: [makeMinimalEvent({ id: 'evt-1' })],
        subscriptions: [],
        createdAt: '', updatedAt: '',
      },
    });
    const sub = makeMinimalSubscription({
      eventId: 'evt-1',
      description: '  some desc  ',
      handlerId: '  custom-handler  ',
      idempotencyKeyPattern: '  custom-pattern  ',
    });
    const result = ensureSubscriptionRules(sub, project);
    expect(result.description).toBe('some desc');
    expect(result.handlerId).toBe('custom-handler');
    expect(result.idempotencyKeyPattern).toBe('custom-pattern');
  });
});

// ---------------------------------------------------------------------------
// ensureRuleDefinitionRules
// ---------------------------------------------------------------------------
describe('ensureRuleDefinitionRules', () => {
  it('should return normalized rule for field_validation', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      condition: makeMinimalRuleCondition({ type: 'regex', pattern: '  ^[A-Z]+$  ' }),
    });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.name).toBe('物料编码校验');
    expect(result.condition.pattern).toBe('^[A-Z]+$');
    expect(result.enabled).toBe(true);
    expect(result.priority).toBe(100); // default priority
  });

  it('should throw when name is empty', () => {
    const rule = makeMinimalRule({ name: '  ' });
    expect(() => ensureRuleDefinitionRules(rule, null)).toThrow('规则名称不能为空');
  });

  it('should throw when entity does not exist', () => {
    const project = makeMinimalProject();
    const rule = makeMinimalRule({ entity: 'non-existent' });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('规则必须绑定到有效实体');
  });

  it('should throw when field_validation has no field', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({ entity: 'ent-1', type: 'field_validation', field: '  ' });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('字段级校验必须绑定字段');
  });

  it('should throw when cross_field_validation has fewer than 2 fields', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      type: 'cross_field_validation',
      field: undefined,
      condition: makeMinimalRuleCondition({ type: 'expression', fields: ['field1'], expression: 'a == b' }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('跨字段校验至少需要两个字段');
  });

  it('should throw when cross_field_validation has no expression', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      type: 'cross_field_validation',
      field: undefined,
      condition: makeMinimalRuleCondition({ type: 'expression', fields: ['field1', 'field2'], expression: '' }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('跨字段校验必须提供表达式');
  });

  it('should accept valid cross_field_validation', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      type: 'cross_field_validation',
      field: undefined,
      condition: makeMinimalRuleCondition({ type: 'expression', fields: ['  a  ', '  b  '], expression: ' a != b ' }),
    });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.condition.fields).toEqual(['a', 'b']);
    expect(result.condition.expression).toBe('a != b');
  });

  it('should throw when cross_entity_validation has no checkEntity', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      type: 'cross_entity_validation',
      field: undefined,
      condition: makeMinimalRuleCondition({ type: 'expression', checkEntity: '', checkCondition: 'verified' }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('业务约束规则必须配置检查实体');
  });

  it('should throw when cross_entity_validation references non-existent entity', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      type: 'cross_entity_validation',
      field: undefined,
      condition: makeMinimalRuleCondition({ type: 'expression', checkEntity: 'non-existent', checkCondition: 'verified' }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('业务约束规则必须引用已定义实体');
  });

  it('should throw when cross_entity_validation has no checkCondition', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [
          makeMinimalEntity({ id: 'ent-1' }),
          makeMinimalEntity({ id: 'ent-2' }),
        ],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      type: 'cross_entity_validation',
      field: undefined,
      condition: makeMinimalRuleCondition({ type: 'expression', checkEntity: 'ent-2', checkCondition: '' }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('业务约束规则必须配置检查条件');
  });

  it('should accept valid cross_entity_validation', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [
          makeMinimalEntity({ id: 'ent-1' }),
          makeMinimalEntity({ id: 'ent-2' }),
        ],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      type: 'cross_entity_validation',
      field: undefined,
      condition: makeMinimalRuleCondition({
        type: 'expression',
        checkEntity: '  ent-2  ',
        checkCondition: '  verified  ',
        expression: 'some expression',
      }),
    });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.condition.checkEntity).toBe('ent-2');
    expect(result.condition.checkCondition).toBe('verified');
  });

  it('should throw regex validation without pattern', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      condition: makeMinimalRuleCondition({ type: 'regex', pattern: '  ' }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('正则校验必须提供 pattern');
  });

  it('should throw range validation without min/max', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      condition: makeMinimalRuleCondition({ type: 'range', min: undefined as unknown as number, max: undefined as unknown as number }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('范围校验必须提供 min 和 max');
  });

  it('should throw range validation when min > max', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      condition: makeMinimalRuleCondition({ type: 'range', min: 100, max: 1 }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('范围校验的 min 不能大于 max');
  });

  it('should accept valid range validation', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      condition: makeMinimalRuleCondition({ type: 'range', min: 1, max: 100 }),
    });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.condition.min).toBe(1);
    expect(result.condition.max).toBe(100);
  });

  it('should throw expression validation without expression (non-cross-entity)', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({
      entity: 'ent-1',
      condition: makeMinimalRuleCondition({ type: 'expression', expression: '  ' }),
    });
    expect(() => ensureRuleDefinitionRules(rule, project)).toThrow('表达式校验必须提供 expression');
  });

  it('should normalize priority (non-finite => 100)', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({ entity: 'ent-1', priority: NaN });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.priority).toBe(100);
  });

  it('should clamp priority to min 1', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({ entity: 'ent-1', priority: -5 });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.priority).toBe(1);
  });

  it('should floor priority (not round)', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({ entity: 'ent-1', priority: 10.9 });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.priority).toBe(10);
  });

  it('should set enabled default to true when explicitly false', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({ entity: 'ent-1', enabled: false });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.enabled).toBe(false);
  });

  it('should default errorMessage to "校验失败" when trimmed empty', () => {
    const project = makeMinimalProject({
      dataModel: {
        ...makeMinimalProject().dataModel!,
        entities: [makeMinimalEntity({ id: 'ent-1' })],
      },
    });
    const rule = makeMinimalRule({ entity: 'ent-1', errorMessage: '  ' });
    const result = ensureRuleDefinitionRules(rule, project);
    expect(result.errorMessage).toBe('校验失败');
  });
});

// ---------------------------------------------------------------------------
// Edge: null project / null dataModel / empty arrays
// ---------------------------------------------------------------------------
describe('edge cases — null / empty state', () => {
  it('ensureStateMachineRules handles null project with no event model', () => {
    const sm = makeMinimalStateMachine({
      transitions: [{ id: 't-1', name: '发布', from: 's-1', to: 's-2', trigger: 'manual' }],
    });
    const result = ensureStateMachineRules(sm, null);
    expect(result.transitions).toHaveLength(1);
  });

  it('ensureSubscriptionRules handles null project event model gracefully', () => {
    // When project is null, the event list is empty, so any eventId will fail
    const sub = makeMinimalSubscription({ eventId: 'evt-1' });
    expect(() => ensureSubscriptionRules(sub, null)).toThrow('订阅必须引用已定义的事件');
  });

  it('ensureRuleDefinitionRules handles null project (no entities)', () => {
    const rule = makeMinimalRule();
    expect(() => ensureRuleDefinitionRules(rule, null)).toThrow('规则必须绑定到有效实体');
  });
});
