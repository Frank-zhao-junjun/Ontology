import { resolveEntityRole } from '@/lib/entity-role';
import type { EventDefinition, Subscription, OntologyProject } from '@/types/ontology';

export function ensureEventDefinitionRules(
  event: EventDefinition,
  stateProject: OntologyProject | null,
): EventDefinition {
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

export function ensureSubscriptionRules(
  subscription: Subscription,
  stateProject: OntologyProject | null,
): Subscription {
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
