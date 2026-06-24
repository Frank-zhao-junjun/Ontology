import type {
  OntologyProject, Entity, StateMachine, Rule, EventDefinition, Subscription,
} from '@/types/ontology';
import { resolveEntityRole } from '@/lib/entity-role';
import { normalizeEntity } from '@/lib/ontology-normalizer';

export const generateId = () => Math.random().toString(36).substring(2, 15);

export function ensureEntityScenario(entity: Entity, stateProject: OntologyProject | null): Entity {
  const scenarios = stateProject?.dataModel?.businessScenarios || [];
  const normalizedEntity = normalizeEntity(entity, scenarios);

  if (!normalizedEntity.businessScenarioId) {
    throw new Error('实体必须归属一个业务场景');
  }

  return normalizedEntity;
}

export function ensureEntityAggregateBoundary(entity: Entity, stateProject: OntologyProject | null): Entity {
  if (entity.entityRole === 'aggregate_root' && entity.parentAggregateId) {
    throw new Error('聚合根不能指定所属聚合根');
  }

  const normalizedEntity = ensureEntityScenario(entity, stateProject);
  const entities = stateProject?.dataModel?.entities || [];

  if (normalizedEntity.entityRole === 'aggregate_root') {
    return normalizedEntity;
  }

  if (!normalizedEntity.parentAggregateId) {
    throw new Error('子实体必须指定所属聚合根');
  }

  if (normalizedEntity.parentAggregateId === normalizedEntity.id) {
    throw new Error('子实体不能将自己作为所属聚合根');
  }

  const parentAggregate = entities.find((item) => item.id === normalizedEntity.parentAggregateId);
  if (!parentAggregate) {
    throw new Error('父聚合根不存在');
  }

  if (parentAggregate.entityRole !== 'aggregate_root') {
    throw new Error('父聚合根不存在');
  }

  return normalizedEntity;
}

export function collectCascadeEntityIds(entities: Entity[], rootId: string): Set<string> {
  const idsToDelete = new Set<string>([rootId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const entity of entities) {
      if (!idsToDelete.has(entity.id) && entity.parentAggregateId && idsToDelete.has(entity.parentAggregateId)) {
        idsToDelete.add(entity.id);
        changed = true;
      }
    }
  }

  return idsToDelete;
}

export function ensureAggregateRootRoleChangeSafety(existingEntity: Entity, nextEntity: Entity, stateProject: OntologyProject | null): void {
  if (resolveEntityRole(existingEntity) !== 'aggregate_root' || resolveEntityRole(nextEntity) === 'aggregate_root') {
    return;
  }

  const entities = stateProject?.dataModel?.entities || [];
  const hasChildEntities = entities.some((entity) => entity.id !== existingEntity.id && entity.parentAggregateId === existingEntity.id);

  if (hasChildEntities) {
    throw new Error('存在归属到当前聚合根的子实体，不能直接降级');
  }
}

export function ensureStateMachineRules(
  stateMachine: StateMachine,
  stateProject: OntologyProject | null,
  previousStateMachine?: StateMachine,
): StateMachine {
  if (stateMachine.states.length > 10) {
    throw new Error('每个状态机最多只能定义 10 个状态');
  }

  const stateIds = stateMachine.states.map((state) => state.id);
  if (new Set(stateIds).size !== stateIds.length) {
    throw new Error('状态编码不能重复');
  }

  const initialStateCount = stateMachine.states.filter((state) => state.isInitial).length;
  if (initialStateCount > 1) {
    throw new Error('状态机只能有一个初始状态');
  }

  if (previousStateMachine) {
    const nextStateIds = new Set(stateMachine.states.map((state) => state.id));
    const removedStateIds = previousStateMachine.states
      .map((state) => state.id)
      .filter((stateId) => !nextStateIds.has(stateId));

    const removedStateStillReferenced = removedStateIds.some((stateId) => {
      return previousStateMachine.transitions.some((transition) => {
        const fromStateIds = Array.isArray(transition.from) ? transition.from : [transition.from];
        return fromStateIds.includes(stateId) || transition.to === stateId;
      });
    });

    if (removedStateStillReferenced) {
      throw new Error('状态已被转换规则引用，不能删除');
    }
  }

  const validStateIds = new Set(stateMachine.states.map((state) => state.id));
  const availableEvents = stateProject?.eventModel?.events || [];
  const normalizedTransitions = stateMachine.transitions.map((transition) => {
    const fromStateIds = Array.isArray(transition.from) ? transition.from : [transition.from];
    const normalizedFromStateIds = fromStateIds.map((stateId) => stateId.trim()).filter(Boolean);
    const normalizedToStateId = transition.to.trim();

    const hasInvalidStateRef = normalizedFromStateIds.length === 0
      || !normalizedToStateId
      || normalizedFromStateIds.some((stateId) => !validStateIds.has(stateId))
      || !validStateIds.has(normalizedToStateId);

    if (hasInvalidStateRef) {
      throw new Error('转换必须引用有效的起始状态和目标状态');
    }

    const normalizedPreConditions = (transition.preConditions || []).map((condition) => condition.trim()).filter(Boolean);
    const normalizedPostActions = (transition.postActions || []).map((action) => action.trim()).filter(Boolean);
    const normalizedTriggerConfig = {
      eventId: transition.triggerConfig?.eventId?.trim() || undefined,
      cron: transition.triggerConfig?.cron?.trim() || undefined,
      timezone: transition.triggerConfig?.timezone?.trim() || undefined,
      publishEventId: transition.triggerConfig?.publishEventId?.trim() || undefined,
    };

    if ((transition.trigger === 'automatic' || transition.trigger === 'scheduled') && normalizedPreConditions.length === 0) {
      throw new Error('自动或定时转换必须定义触发条件');
    }

    if (transition.trigger === 'automatic') {
      if (!normalizedTriggerConfig.eventId) {
        throw new Error('事件触发转换必须配置触发事件');
      }
      if (!availableEvents.some((event) => event.id === normalizedTriggerConfig.eventId)) {
        throw new Error('事件触发转换必须引用已定义的领域事件');
      }
    }

    if (transition.trigger === 'scheduled' && !normalizedTriggerConfig.cron) {
      throw new Error('定时触发转换必须配置 Cron 表达式');
    }

    if (normalizedTriggerConfig.publishEventId && !availableEvents.some((event) => event.id === normalizedTriggerConfig.publishEventId)) {
      throw new Error('触发器发布事件必须引用已定义的领域事件');
    }

    const hasTriggerConfig = Boolean(
      normalizedTriggerConfig.eventId
      || normalizedTriggerConfig.cron
      || normalizedTriggerConfig.timezone
      || normalizedTriggerConfig.publishEventId,
    );

    return {
      ...transition,
      name: transition.name.trim() || '新转换',
      from: Array.isArray(transition.from) ? normalizedFromStateIds : normalizedFromStateIds[0],
      to: normalizedToStateId,
      uiAction: transition.trigger === 'manual'
        ? (transition.uiAction?.trim() || transition.name.trim() || 'manual-action')
        : transition.uiAction?.trim() || undefined,
      triggerConfig: hasTriggerConfig ? normalizedTriggerConfig : undefined,
      preConditions: normalizedPreConditions,
      postActions: normalizedPostActions,
      description: transition.description?.trim() || undefined,
    };
  });

  return {
    ...stateMachine,
    transitions: normalizedTransitions,
  };
}

export function ensureEventDefinitionRules(event: EventDefinition, stateProject: OntologyProject | null): EventDefinition {
  const entity = stateProject?.dataModel?.entities.find((item) => item.id === event.entity);
  const entityRole = entity ? resolveEntityRole(entity) : event.entityRole;

  if (entityRole !== 'aggregate_root') {
    throw new Error('只有聚合根可以定义领域事件');
  }

  if (!event.name.includes('已')) {
    throw new Error('领域事件名称应使用过去式');
  }

  if (event.trigger === 'state_change' && !event.condition?.trim()) {
    throw new Error('状态变更事件必须定义触发条件');
  }

  // E3: domain event payloadFields max 5 constraint
  if (event.isDomainEvent && event.payloadFields && event.payloadFields.length > 5) {
    throw new Error('领域事件的 payloadFields 最多 5 个字段');
  }

  const payload = (event.payload || [])
    .map((item) => ({
      ...item,
      field: item.field.trim(),
      path: item.path?.trim() || undefined,
    }))
    .filter((item) => item.field);

  return {
    ...event,
    condition: event.condition?.trim() || undefined,
    payload: payload.length > 0 ? payload : [{ field: 'id' }],
    transactionPhase: event.transactionPhase || 'AFTER_COMMIT',
    entityRole,
    entityIsAggregateRoot: true,
  };
}

export function ensureSubscriptionRules(subscription: Subscription, stateProject: OntologyProject | null): Subscription {
  const normalizedName = subscription.name.trim();
  if (!normalizedName) {
    throw new Error('订阅名称不能为空');
  }

  const normalizedEventId = subscription.eventId.trim();
  const events = stateProject?.eventModel?.events || [];
  if (!normalizedEventId || !events.some((event) => event.id === normalizedEventId)) {
    throw new Error('订阅必须引用已定义的事件');
  }

  const normalizedActionRef = subscription.actionRef.trim();
  if (!normalizedActionRef) {
    throw new Error('订阅动作引用不能为空');
  }

  let normalizedRetryPolicy: Subscription['retryPolicy'];
  if (subscription.handler === 'async') {
    if (!subscription.retryPolicy) {
      throw new Error('异步订阅必须配置重试策略');
    }

    if (subscription.retryPolicy.maxRetries < 1) {
      throw new Error('重试次数必须大于 0');
    }

    if (subscription.retryPolicy.interval < 1) {
      throw new Error('重试间隔必须大于 0');
    }

    normalizedRetryPolicy = {
      maxRetries: subscription.retryPolicy.maxRetries,
      backoff: subscription.retryPolicy.backoff,
      interval: subscription.retryPolicy.interval,
    };
  }

  const normalizedHandlerId = subscription.handlerId?.trim() || subscription.id;
  const normalizedIdempotencyKeyPattern = subscription.idempotencyKeyPattern?.trim() || '{event_id}:{handler_id}';

  return {
    ...subscription,
    name: normalizedName,
    eventId: normalizedEventId,
    actionRef: normalizedActionRef,
    retryPolicy: normalizedRetryPolicy,
    description: subscription.description?.trim() || undefined,
    handlerId: normalizedHandlerId,
    idempotencyKeyPattern: normalizedIdempotencyKeyPattern,
  };
}

export function ensureRuleDefinitionRules(rule: Rule, stateProject: OntologyProject | null): Rule {
  const normalizedName = rule.name.trim();
  if (!normalizedName) {
    throw new Error('规则名称不能为空');
  }

  const entities = stateProject?.dataModel?.entities || [];
  const targetEntity = entities.find((entity) => entity.id === rule.entity);
  if (!targetEntity) {
    throw new Error('规则必须绑定到有效实体');
  }

  if (rule.type === 'field_validation') {
    const normalizedField = rule.field?.trim();
    if (!normalizedField) {
      throw new Error('字段级校验必须绑定字段');
    }
  }

  let normalizedConditionFields = rule.condition.fields;
  if (rule.type === 'cross_field_validation') {
    const fields = (rule.condition.fields || [])
      .map((field) => field.trim())
      .filter(Boolean);
    const uniqueFields = Array.from(new Set(fields));
    if (uniqueFields.length < 2) {
      throw new Error('跨字段校验至少需要两个字段');
    }
    if (!rule.condition.expression?.trim()) {
      throw new Error('跨字段校验必须提供表达式');
    }
    normalizedConditionFields = uniqueFields;
  }

  if (rule.type === 'cross_entity_validation') {
    const checkEntity = rule.condition.checkEntity?.trim();
    if (!checkEntity) {
      throw new Error('业务约束规则必须配置检查实体');
    }
    if (!entities.some((entity) => entity.id === checkEntity)) {
      throw new Error('业务约束规则必须引用已定义实体');
    }
    if (!rule.condition.checkCondition?.trim()) {
      throw new Error('业务约束规则必须配置检查条件');
    }
  }

  const conditionType = rule.condition.type;
  if (conditionType === 'regex' && !rule.condition.pattern?.trim()) {
    throw new Error('正则校验必须提供 pattern');
  }

  if (conditionType === 'range') {
    if (typeof rule.condition.min !== 'number' || typeof rule.condition.max !== 'number') {
      throw new Error('范围校验必须提供 min 和 max');
    }
    if (rule.condition.min > rule.condition.max) {
      throw new Error('范围校验的 min 不能大于 max');
    }
  }

  if (conditionType === 'expression' && rule.type !== 'cross_entity_validation' && !rule.condition.expression?.trim()) {
    throw new Error('表达式校验必须提供 expression');
  }

  const normalizedPriority = Number.isFinite(rule.priority) ? Math.max(1, Math.floor(rule.priority as number)) : 100;

  return {
    ...rule,
    name: normalizedName,
    field: rule.field?.trim() || undefined,
    priority: normalizedPriority,
    errorMessage: rule.errorMessage.trim() || '校验失败',
    enabled: rule.enabled !== false,
    description: rule.description?.trim() || undefined,
    condition: {
      ...rule.condition,
      pattern: rule.condition.pattern?.trim() || undefined,
      expression: rule.condition.expression?.trim() || undefined,
      fields: normalizedConditionFields,
      checkEntity: rule.condition.checkEntity?.trim() || undefined,
      checkCondition: rule.condition.checkCondition?.trim() || undefined,
    },
  };
}