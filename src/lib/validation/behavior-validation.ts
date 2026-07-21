import type { StateMachine, OntologyProject } from '@/types/ontology';

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

    const hasInvalidStateRef =
      normalizedFromStateIds.length === 0 ||
      !normalizedToStateId ||
      normalizedFromStateIds.some((stateId) => !validStateIds.has(stateId)) ||
      !validStateIds.has(normalizedToStateId);

    if (hasInvalidStateRef) {
      throw new Error('转换必须引用有效的起始状态和目标状态');
    }

    const normalizedPreConditions = (transition.preConditions || [])
      .map((condition) => condition.trim())
      .filter(Boolean);
    const normalizedPostActions = (transition.postActions || [])
      .map((action) => action.trim())
      .filter(Boolean);
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

    const normalizedExecutionLogs = (transition.executionLogs || []).map((log) => {
      const publishedEventId = log.publishedEventId?.trim() || normalizedTriggerConfig.publishEventId;
      if (publishedEventId && !availableEvents.some((event) => event.id === publishedEventId)) {
        throw new Error('触发器执行日志引用了未定义的领域事件');
      }

      return {
        ...log,
        message: log.message?.trim() || undefined,
        publishedEventId,
      };
    });

    const hasTriggerConfig = Boolean(
      normalizedTriggerConfig.eventId ||
        normalizedTriggerConfig.cron ||
        normalizedTriggerConfig.timezone ||
        normalizedTriggerConfig.publishEventId,
    );

    return {
      ...transition,
      name: transition.name.trim() || '新转换',
      from: Array.isArray(transition.from) ? normalizedFromStateIds : normalizedFromStateIds[0],
      to: normalizedToStateId,
      uiAction:
        transition.trigger === 'manual'
          ? transition.uiAction?.trim() || transition.name.trim() || 'manual-action'
          : transition.uiAction?.trim() || undefined,
      triggerConfig: hasTriggerConfig ? normalizedTriggerConfig : undefined,
      executionLogs: normalizedExecutionLogs.length > 0 ? normalizedExecutionLogs : undefined,
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
