import { isEntityAggregateRoot } from '@/lib/entity-role';
import type {
  EpcAggregateProfile,
  EpcActivityDefinition,
  EpcComplianceDefinition,
  EpcConnectorDefinition,
  EpcExceptionDefinition,
  EpcInformationObject,
  EpcIntegrationDefinition,
  EpcKpiDefinition,
  EpcModel,
  EpcOrganizationalUnit,
  EpcSystemActor,
  EpcValidationIssue,
  EpcValidationSummary,
  OntologyProject,
} from '@/types/ontology';

interface FlowEventNode {
  id: string;
  name: string;
  eventType: string;
  description: string;
  stateId?: string;
  isStart: boolean;
  isEnd: boolean;
}

interface FlowStep {
  sequence: number;
  sourceEventId: string;
  sourceEventName: string;
  activityId: string;
  activityCode: string;
  activityName: string;
  activityType: string;
  targetEventId: string;
  targetEventName: string;
  actorName: string;
  input: string;
  output: string;
  description: string;
  condition: string;
}

interface FlowConnectionRule {
  source: string;
  target: string;
  connectionType: string;
  condition: string;
}

interface FlowSplitDefinition {
  type: 'xor' | 'and';
  source: string;
  conditions: string[];
  targets: string[];
}

interface FlowArtifacts {
  eventNodes: FlowEventNode[];
  flowSteps: FlowStep[];
  connectionRules: FlowConnectionRule[];
  splitDefinitions: FlowSplitDefinition[];
}

interface SelfCheckRow {
  item: string;
  status: string;
  note: string;
}

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
}

function getNow(): string {
  return new Date().toISOString();
}

function buildInformationObjectKey(info: EpcInformationObject): string {
  if (info.sourceType === 'manual') {
    return `manual:${info.id}`;
  }

  return `${info.sourceType}:${info.sourceRefId || info.name}`;
}

function isDerivedInformationObject(info: EpcInformationObject): boolean {
  return info.sourceType !== 'manual';
}

function getSystemTypeLabel(type?: EpcSystemActor['type']): string {
  switch (type) {
    case 'external':
      return '外部系统';
    case 'platform':
      return '平台';
    case 'internal':
    default:
      return '内部系统';
  }
}

function getAggregateStateMachine(project: OntologyProject, aggregateId: string) {
  return project.behaviorModel?.stateMachines.find((machine) => machine.entity === aggregateId);
}

function resolveStateName(project: OntologyProject, aggregateId: string, stateId?: string): string | undefined {
  if (!stateId) {
    return undefined;
  }

  const stateMachine = getAggregateStateMachine(project, aggregateId);
  return stateMachine?.states.find((state) => state.id === stateId)?.name;
}

function resolveActivityAssignmentLabel(profile: EpcAggregateProfile, activity: EpcActivityDefinition): string {
  const ownerOrgUnit = profile.organizationalUnits.find((unit) => unit.id === activity.ownerOrgUnitId);
  if (ownerOrgUnit) {
    return ownerOrgUnit.name;
  }

  const assignedSystem = profile.systems.find((system) => system.id === activity.systemId);
  if (assignedSystem) {
    return assignedSystem.name;
  }

  if (activity.activityType === 'auto_task' && profile.systems.length === 1) {
    return profile.systems[0].name;
  }

  if (activity.activityType !== 'auto_task' && profile.organizationalUnits.length === 1) {
    return profile.organizationalUnits[0].name;
  }

  return '待补充';
}

function resolveInfoObjectSummary(profile: EpcAggregateProfile, ids: string[] | undefined, fallbackIndex: number): string {
  if (ids && ids.length > 0) {
    const names = ids
      .map((id) => profile.informationObjects.find((info) => info.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    if (names.length > 0) {
      return names.join('、');
    }
  }

  if (profile.informationObjects.length === 0) {
    return '待补充';
  }

  const safeIndex = Math.max(0, Math.min(fallbackIndex, profile.informationObjects.length - 1));
  return profile.informationObjects[safeIndex]?.name || '待补充';
}

function buildFlowArtifacts(project: OntologyProject, profile: EpcAggregateProfile): FlowArtifacts {
  const stateMachine = getAggregateStateMachine(project, profile.aggregateId);
  const explicitEvents = project.eventModel?.events.filter((event) => event.entity === profile.aggregateId) || [];
  const eventNodes: FlowEventNode[] = [];
  const eventNodeByStateId = new Map<string, FlowEventNode>();
  const eventNodeByName = new Map<string, FlowEventNode>();

  const registerEventNode = (node: FlowEventNode): FlowEventNode => {
    eventNodes.push(node);
    if (node.stateId) {
      eventNodeByStateId.set(node.stateId, node);
    }
    eventNodeByName.set(node.name, node);
    return node;
  };

  if (stateMachine?.states.length) {
    stateMachine.states.forEach((state, index) => {
      registerEventNode({
        id: `EVT-${String(index + 1).padStart(3, '0')}`,
        name: state.name,
        eventType: state.isInitial ? '开始事件' : state.isFinal ? '结束事件' : '中间事件',
        description: state.description || `${state.name}状态事件`,
        stateId: state.id,
        isStart: Boolean(state.isInitial),
        isEnd: Boolean(state.isFinal),
      });
    });
  } else if (explicitEvents.length > 0) {
    explicitEvents.forEach((event, index) => {
      const isStart = index === 0 || event.trigger === 'create';
      const isEnd = index === explicitEvents.length - 1 || event.trigger === 'delete';
      registerEventNode({
        id: `EVT-${String(index + 1).padStart(3, '0')}`,
        name: event.name,
        eventType: isStart ? '开始事件' : isEnd ? '结束事件' : '中间事件',
        description: event.description || '领域事件',
        isStart,
        isEnd,
      });
    });
  } else {
    registerEventNode({
      id: 'EVT-001',
      name: profile.scopeStart || '开始事件',
      eventType: '开始事件',
      description: '流程开始',
      isStart: true,
      isEnd: false,
    });
    registerEventNode({
      id: 'EVT-002',
      name: profile.scopeEnd || '结束事件',
      eventType: '结束事件',
      description: '流程结束',
      isStart: false,
      isEnd: true,
    });
  }

  const ensureEventNode = (name: string, eventType: string, description: string, stateId?: string): FlowEventNode => {
    if (stateId) {
      const existingByState = eventNodeByStateId.get(stateId);
      if (existingByState) {
        return existingByState;
      }
    }

    const existingByName = eventNodeByName.get(name);
    if (existingByName) {
      return existingByName;
    }

    return registerEventNode({
      id: `EVT-${String(eventNodes.length + 1).padStart(3, '0')}`,
      name,
      eventType,
      description,
      stateId,
      isStart: eventType === '开始事件',
      isEnd: eventType === '结束事件',
    });
  };

  const activityCodeMap = new Map(profile.activities.map((activity, index) => [activity.id, `FUNC-${String(index + 1).padStart(3, '0')}`]));
  const flowSteps: FlowStep[] = [];

  if (stateMachine?.transitions.length) {
    stateMachine.transitions.forEach((transition, index) => {
      const activity = profile.activities.find((item) => item.transitionId === transition.id) || profile.activities[index];
      if (!activity) {
        return;
      }

      const sourceStateId = Array.isArray(transition.from) ? transition.from[0] : transition.from;
      const sourceStateName = resolveStateName(project, profile.aggregateId, sourceStateId) || explicitEvents[index]?.name || profile.scopeStart || '开始事件';
      const targetStateName = resolveStateName(project, profile.aggregateId, transition.to) || explicitEvents[index + 1]?.name || activity.postcondition || `${activity.name}完成`;
      const targetState = stateMachine.states.find((state) => state.id === transition.to);

      const sourceEvent = ensureEventNode(
        sourceStateName,
        stateMachine.states.find((state) => state.id === sourceStateId)?.isInitial ? '开始事件' : '中间事件',
        `${sourceStateName}相关事件`,
        sourceStateId,
      );
      const targetEvent = ensureEventNode(
        targetStateName,
        targetState?.isFinal ? '结束事件' : '中间事件',
        `${targetStateName}相关事件`,
        transition.to,
      );

      flowSteps.push({
        sequence: index + 1,
        sourceEventId: sourceEvent.id,
        sourceEventName: sourceEvent.name,
        activityId: activity.id,
        activityCode: activityCodeMap.get(activity.id) || `FUNC-${String(index + 1).padStart(3, '0')}`,
        activityName: activity.name,
        activityType: activity.activityType === 'auto_task' ? '自动任务' : '任务',
        targetEventId: targetEvent.id,
        targetEventName: targetEvent.name,
        actorName: resolveActivityAssignmentLabel(profile, activity),
        input: resolveInfoObjectSummary(profile, activity.inputObjectIds, index),
        output: resolveInfoObjectSummary(profile, activity.outputObjectIds, index + 1),
        description: activity.postcondition || transition.postActions?.join('；') || transition.description || `执行${activity.name}`,
        condition: transition.preConditions?.join('；') || transition.description || (transition.trigger === 'automatic' ? '自动' : '待补充'),
      });
    });
  } else {
    let currentEvent = eventNodes[0];

    profile.activities.forEach((activity, index) => {
      const nextEvent = eventNodes[index + 1] || ensureEventNode(
        activity.postcondition || `${activity.name}完成`,
        index === profile.activities.length - 1 ? '结束事件' : '中间事件',
        `${activity.name}结果事件`,
      );

      flowSteps.push({
        sequence: index + 1,
        sourceEventId: currentEvent.id,
        sourceEventName: currentEvent.name,
        activityId: activity.id,
        activityCode: activityCodeMap.get(activity.id) || `FUNC-${String(index + 1).padStart(3, '0')}`,
        activityName: activity.name,
        activityType: activity.activityType === 'auto_task' ? '自动任务' : '任务',
        targetEventId: nextEvent.id,
        targetEventName: nextEvent.name,
        actorName: resolveActivityAssignmentLabel(profile, activity),
        input: resolveInfoObjectSummary(profile, activity.inputObjectIds, index),
        output: resolveInfoObjectSummary(profile, activity.outputObjectIds, index + 1),
        description: activity.postcondition || `执行${activity.name}`,
        condition: activity.precondition || '自动',
      });

      currentEvent = nextEvent;
    });
  }

  if (!eventNodes.some((node) => node.isEnd) && flowSteps.length > 0) {
    const lastEvent = eventNodes.find((node) => node.id === flowSteps[flowSteps.length - 1].targetEventId);
    if (lastEvent) {
      lastEvent.isEnd = true;
      lastEvent.eventType = '结束事件';
    }
  }

  const connectionRules = flowSteps.flatMap((step) => ([
    {
      source: step.sourceEventId,
      target: step.activityCode,
      connectionType: '事件→功能',
      condition: '自动',
    },
    {
      source: step.activityCode,
      target: step.targetEventId,
      connectionType: '功能→事件',
      condition: step.condition || '自动',
    },
  ]));

  const splitDefinitions: FlowSplitDefinition[] = [];
  const stepsBySourceEvent = new Map<string, FlowStep[]>();
  flowSteps.forEach((step) => {
    const group = stepsBySourceEvent.get(step.sourceEventId) || [];
    group.push(step);
    stepsBySourceEvent.set(step.sourceEventId, group);
  });

  stepsBySourceEvent.forEach((steps, sourceEventId) => {
    if (steps.length <= 1) {
      return;
    }

    splitDefinitions.push({
      type: 'xor',
      source: `${sourceEventId} (${steps[0].sourceEventName})`,
      conditions: steps.map((step, index) => step.condition || `路径${index + 1}`),
      targets: steps.map((step) => `${step.activityCode} / ${step.targetEventId}`),
    });
  });

  const manualActivityCodeMap = new Map(flowSteps.map((step) => [step.activityId, step.activityCode]));
  profile.connectors.forEach((connector) => {
    splitDefinitions.push({
      type: connector.type,
      source: connector.sourceActivityId
        ? manualActivityCodeMap.get(connector.sourceActivityId) || connector.sourceActivityId
        : connector.sourceEventId || '待补充',
      conditions: connector.branches.map((branch) => branch.label || connector.condition || '待补充'),
      targets: connector.branches.map((branch) => branch.targetEventName),
    });
  });

  return {
    eventNodes,
    flowSteps,
    connectionRules,
    splitDefinitions,
  };
}

function getChecklistStatus(isComplete: boolean, isPartial = false): string {
  if (isComplete) {
    return '[V] 完成';
  }

  if (isPartial) {
    return '[!] 待补充';
  }

  return '[X] 缺失';
}

function buildSelfCheckRows(project: OntologyProject, profile: EpcAggregateProfile, artifacts: FlowArtifacts): SelfCheckRow[] {
  const rules = project.ruleModel?.rules.filter((rule) => rule.entity === profile.aggregateId) || [];
  const hasStartEvent = artifacts.eventNodes.some((node) => node.isStart);
  const hasEndEvent = artifacts.eventNodes.some((node) => node.isEnd);

  return [
    {
      item: '事件完整性',
      status: getChecklistStatus(artifacts.eventNodes.length > 0 && hasStartEvent && hasEndEvent, artifacts.eventNodes.length > 0),
      note: `${artifacts.eventNodes.length}个事件定义${hasStartEvent && hasEndEvent ? '' : '，开始/结束事件仍需补齐'}`,
    },
    {
      item: '功能完整性',
      status: getChecklistStatus(artifacts.flowSteps.length > 0),
      note: `${artifacts.flowSteps.length}个功能定义`,
    },
    {
      item: '规则完整性',
      status: getChecklistStatus(rules.length > 0, rules.length > 0),
      note: `${rules.length}条业务规则`,
    },
    {
      item: '组织单元完整性',
      status: getChecklistStatus(profile.organizationalUnits.length > 0, profile.organizationalUnits.length > 0),
      note: `${profile.organizationalUnits.length}个组织单元`,
    },
    {
      item: '信息对象完整性',
      status: getChecklistStatus(profile.informationObjects.length > 0, profile.informationObjects.length > 0),
      note: `${profile.informationObjects.length}个信息对象`,
    },
    {
      item: '流程链完整性',
      status: getChecklistStatus(artifacts.flowSteps.length > 0),
      note: `${artifacts.flowSteps.length}个流程步骤`,
    },
    {
      item: '流程矩阵完整性',
      status: getChecklistStatus(artifacts.eventNodes.length > 0 && artifacts.flowSteps.length > 0),
      note: `${artifacts.eventNodes.length}x${artifacts.flowSteps.length} 事件-功能映射`,
    },
    {
      item: '连接关系完整性',
      status: getChecklistStatus(artifacts.connectionRules.length > 0, artifacts.connectionRules.length > 0),
      note: `${artifacts.connectionRules.length}条连接规则，${artifacts.splitDefinitions.length}个分支定义`,
    },
  ];
}

function renderFlowChain(flowSteps: FlowStep[]): string {
  if (flowSteps.length === 0) {
    return '待补充流程链';
  }

  const lines: string[] = [];
  let index = 0;

  while (index < flowSteps.length) {
    const currentStep = flowSteps[index];
    const group = [currentStep];
    let cursor = index + 1;

    while (cursor < flowSteps.length && flowSteps[cursor].sourceEventId === currentStep.sourceEventId) {
      group.push(flowSteps[cursor]);
      cursor += 1;
    }

    if (lines.length > 0) {
      lines.push('    ↓');
    }

    lines.push(`${currentStep.sourceEventId} (${currentStep.sourceEventName})`);

    if (group.length === 1) {
      lines.push('    ↓');
      lines.push(`${currentStep.activityCode} (${currentStep.activityName})`);
      lines.push('    ↓');
      lines.push(`${currentStep.targetEventId} (${currentStep.targetEventName})`);
    } else {
      lines.push('    ↓');
      lines.push('[判断/分支]');
      group.forEach((step, branchIndex) => {
        const prefix = branchIndex === group.length - 1 ? '    └─ ' : '    ├─ ';
        const indent = branchIndex === group.length - 1 ? '        ' : '    │   ';
        lines.push(`${prefix}${step.condition || `路径${branchIndex + 1}`} → ${step.activityCode} (${step.activityName})`);
        lines.push(`${indent}↓`);
        lines.push(`${indent}${step.targetEventId} (${step.targetEventName})`);
      });
    }

    index = cursor;
  }

  return lines.join('\n');
}

function renderFlowDescriptionTable(flowSteps: FlowStep[]): string {
  if (flowSteps.length === 0) {
    return '| 1 | 待补充 | 待补充 | 待补充 | 待补充 | 待补充 |';
  }

  return flowSteps.map((step) => `| ${step.sequence} | ${step.sourceEventId} → ${step.activityCode} → ${step.targetEventId} | ${step.actorName} | ${step.input} | ${step.output} | ${step.description} |`).join('\n');
}

function renderEventFunctionMatrix(artifacts: FlowArtifacts): string {
  if (artifacts.eventNodes.length === 0 || artifacts.flowSteps.length === 0) {
    return '| 事件/功能 | 待补充 |\n|-----------|--------|\n| 待补充 | 待补充 |';
  }

  const activityCodes = artifacts.flowSteps.map((step) => step.activityCode);
  const header = `| 事件/功能 | ${activityCodes.join(' | ')} |`;
  const divider = `|-----------|${activityCodes.map(() => '----------').join('|')}|`;
  const rows = artifacts.eventNodes.map((eventNode) => `| ${eventNode.id} | ${activityCodes.map((activityCode) => (
    artifacts.flowSteps.some((step) => step.sourceEventId === eventNode.id && step.activityCode === activityCode) ? '→' : ''
  )).join(' | ')} |`).join('\n');

  return `${header}\n${divider}\n${rows}`;
}

function renderConnectionRulesTable(connectionRules: FlowConnectionRule[]): string {
  if (connectionRules.length === 0) {
    return '| 1 | 待补充 | 待补充 | 待补充 | 待补充 |';
  }

  return connectionRules.map((rule, index) => `| ${index + 1} | ${rule.source} | ${rule.target} | ${rule.connectionType} | ${rule.condition} |`).join('\n');
}

function renderSplitTable(splitDefinitions: FlowSplitDefinition[], type: 'and' | 'xor'): string {
  const rows = splitDefinitions.filter((item) => item.type === type);
  if (rows.length === 0) {
    return '| 1 | 待补充 | 待补充 | 待补充 | 待补充 |';
  }

  return rows.map((row, index) => {
    const firstTarget = row.targets[0] || '待补充';
    const secondTarget = row.targets[1] || '待补充';
    const condition = row.conditions.join('；') || '待补充';
    return `| ${index + 1} | ${row.source} | ${condition} | ${firstTarget} | ${secondTarget} |`;
  }).join('\n');
}

function renderRolePermissionMatrix(profile: EpcAggregateProfile, flowSteps: FlowStep[]): string {
  if (flowSteps.length === 0) {
    return '| 角色 | 待补充 |\n|------|--------|\n| 待补充 | 待补充 |';
  }

  const activityCodes = flowSteps.map((step) => step.activityCode);
  const actors = [
    ...profile.organizationalUnits.map((unit) => unit.name),
    ...profile.systems.map((system) => system.name),
  ];

  if (flowSteps.some((step) => step.actorName === '待补充')) {
    actors.push('待补充');
  }

  const uniqueActors = Array.from(new Set(actors));
  const header = `| 角色 | ${activityCodes.join(' | ')} |`;
  const divider = `|------|${activityCodes.map(() => '----------').join('|')}|`;
  const rows = uniqueActors.length > 0
    ? uniqueActors.map((actor) => `| ${actor} | ${flowSteps.map((step) => step.actorName === actor ? (actor === '待补充' ? '待补充' : '执行') : '').join(' | ')} |`).join('\n')
    : '| 待补充 | 待补充 |';

  return `${header}\n${divider}\n${rows}`;
}

function deriveInformationObjects(project: OntologyProject, aggregateId: string): EpcInformationObject[] {
  const aggregate = project.dataModel?.entities.find((entity) => entity.id === aggregateId);
  const childEntities = project.dataModel?.entities.filter((entity) => entity.parentAggregateId === aggregateId) || [];
  const masterDataMap = new Map((project.dataModel?.entities || [])
    .flatMap((entity) => entity.attributes)
    .flatMap((attribute) => (attribute.masterDataIds || []).map((id, index) => ({ id, name: attribute.masterDataNames?.[index] })))
    .filter((item) => item.id)
    .map((item) => [item.id!, item.name]));

  const aggregateInfo = aggregate ? [{
    id: `info-${aggregate.id}`,
    name: aggregate.name,
    sourceType: 'aggregate' as const,
    sourceRefId: aggregate.id,
    attributes: aggregate.attributes.map((attribute) => attribute.name),
    description: `${aggregate.name}聚合根信息对象`,
  }] : [];

  const childInfos = childEntities.map((entity) => ({
    id: `info-${entity.id}`,
    name: entity.name,
    sourceType: 'child_entity' as const,
    sourceRefId: entity.id,
    attributes: entity.attributes.map((attribute) => attribute.name),
    description: `${entity.name}子实体信息对象`,
  }));

  const masterDataInfos = Array.from(masterDataMap.entries()).map(([id, name]) => ({
    id: `info-${id}`,
    name: name || id,
    sourceType: 'masterdata' as const,
    sourceRefId: id,
    attributes: [],
    description: '引用的主数据信息对象',
  }));

  return [...aggregateInfo, ...childInfos, ...masterDataInfos];
}

function syncInformationObjects(derivedObjects: EpcInformationObject[], existingObjects: EpcInformationObject[] = []): EpcInformationObject[] {
  const manualObjects = existingObjects.filter((info) => info.sourceType === 'manual');
  const existingDerivedMap = new Map(existingObjects.filter(isDerivedInformationObject).map((info) => [buildInformationObjectKey(info), info]));

  const syncedDerived = derivedObjects.map((info) => {
    const existing = existingDerivedMap.get(buildInformationObjectKey(info));
    return existing
      ? {
          ...info,
          description: existing.description || info.description,
        }
      : info;
  });

  return [...syncedDerived, ...manualObjects];
}

function validateInformationObjects(profile: EpcAggregateProfile, issues: EpcValidationIssue[]): void {
  const normalizedNames = new Map<string, EpcInformationObject[]>();

  for (const info of profile.informationObjects) {
    const normalizedName = info.name.trim().toLowerCase();
    const list = normalizedNames.get(normalizedName) || [];
    list.push(info);
    normalizedNames.set(normalizedName, list);

    if (info.sourceType === 'manual' && !info.name.trim()) {
      issues.push({
        code: 'EPC_INFO_MANUAL_NAME_EMPTY',
        severity: 'error',
        message: '手工补充的信息对象名称不能为空。',
        field: info.id,
      });
    }

    if (info.sourceType !== 'manual' && !info.sourceRefId) {
      issues.push({
        code: 'EPC_INFO_DERIVED_REF_MISSING',
        severity: 'error',
        message: `自动派生的信息对象 ${info.name} 缺少来源引用。`,
        field: info.id,
      });
    }
  }

  normalizedNames.forEach((items, normalizedName) => {
    if (!normalizedName || items.length <= 1) {
      return;
    }

    const manualItems = items.filter((info) => info.sourceType === 'manual');
    if (manualItems.length > 0) {
      issues.push({
        code: 'EPC_INFO_DUPLICATED_NAME',
        severity: 'warning',
        message: `存在重名信息对象：${items[0].name}。建议避免手工对象与派生对象重名。`,
      });
    }
  });
}

function validateOrganizationalUnits(profile: EpcAggregateProfile, issues: EpcValidationIssue[]): void {
  const normalizedNames = new Map<string, EpcOrganizationalUnit[]>();

  for (const unit of profile.organizationalUnits) {
    const normalizedName = unit.name.trim().toLowerCase();
    const list = normalizedNames.get(normalizedName) || [];
    list.push(unit);
    normalizedNames.set(normalizedName, list);

    if (!unit.name.trim()) {
      issues.push({
        code: 'EPC_ORG_NAME_EMPTY',
        severity: 'error',
        message: '组织单元名称不能为空。',
        field: unit.id,
      });
    }
  }

  normalizedNames.forEach((items, normalizedName) => {
    if (!normalizedName || items.length <= 1) {
      return;
    }

    issues.push({
      code: 'EPC_ORG_DUPLICATED_NAME',
      severity: 'warning',
      message: `存在重名组织单元：${items[0].name}。建议合并或明确角色边界。`,
    });
  });
}

function validateSystems(profile: EpcAggregateProfile, issues: EpcValidationIssue[]): void {
  const normalizedNames = new Map<string, EpcSystemActor[]>();

  for (const system of profile.systems) {
    const normalizedName = system.name.trim().toLowerCase();
    const list = normalizedNames.get(normalizedName) || [];
    list.push(system);
    normalizedNames.set(normalizedName, list);

    if (!system.name.trim()) {
      issues.push({
        code: 'EPC_SYSTEM_NAME_EMPTY',
        severity: 'error',
        message: '执行系统名称不能为空。',
        field: system.id,
      });
    }
  }

  normalizedNames.forEach((items, normalizedName) => {
    if (!normalizedName || items.length <= 1) {
      return;
    }

    issues.push({
      code: 'EPC_SYSTEM_DUPLICATED_NAME',
      severity: 'warning',
      message: `存在重名执行系统：${items[0].name}。建议统一系统命名。`,
    });
  });
}

function deriveActivities(project: OntologyProject, aggregateId: string): EpcActivityDefinition[] {
  const stateMachines = project.behaviorModel?.stateMachines.filter((machine) => machine.entity === aggregateId) || [];
  const transitions = stateMachines.flatMap((machine) => machine.transitions);
  const events = project.eventModel?.events.filter((event) => event.entity === aggregateId) || [];

  if (transitions.length > 0) {
    return transitions.map((transition) => ({
      id: `activity-${transition.id}`,
      name: transition.name,
      activityType: transition.trigger === 'automatic' ? 'auto_task' : 'task',
      derivedFrom: 'state_transition',
      transitionId: transition.id,
      precondition: transition.preConditions?.join('；'),
      postcondition: transition.postActions?.join('；'),
      enabled: true,
    }));
  }

  return events.map((event) => ({
    id: `activity-${event.id}`,
    name: `响应${event.name}`,
    activityType: 'auto_task',
    derivedFrom: 'event',
    eventId: event.id,
    postcondition: event.description,
    enabled: true,
  }));
}

function deriveExceptions(project: OntologyProject, aggregateId: string): EpcExceptionDefinition[] {
  return (project.ruleModel?.rules.filter((rule) => rule.entity === aggregateId && rule.severity !== 'info') || []).map((rule) => ({
    id: `exception-${rule.id}`,
    name: rule.name,
    triggerCondition: rule.errorMessage,
    handlingFlow: rule.description || '待补充异常处理流程',
  }));
}

function deriveValidationSummary(project: OntologyProject, profile: EpcAggregateProfile): EpcValidationSummary {
  const issues: EpcValidationIssue[] = [];
  const artifacts = buildFlowArtifacts(project, profile);

  if (!profile.activities.length) {
    issues.push({ code: 'EPC_ACTIVITY_EMPTY', severity: 'warning', message: '当前聚合根尚未推导出活动定义。' });
  }

  if (!profile.organizationalUnits.length) {
    issues.push({ code: 'EPC_ORG_MISSING', severity: 'warning', message: '尚未补充组织单元，角色与权限矩阵会显示待补充。' });
  }

  if (!profile.systems.length) {
    issues.push({ code: 'EPC_SYSTEM_MISSING', severity: 'info', message: '尚未补充执行系统，系统集成章节会显示待补充。' });
  }

  if (!artifacts.eventNodes.some((node) => node.isStart)) {
    issues.push({ code: 'EPC_START_EVENT_MISSING', severity: 'warning', message: '尚未识别到开始事件。' });
  }

  if (!artifacts.eventNodes.some((node) => node.isEnd)) {
    issues.push({ code: 'EPC_END_EVENT_MISSING', severity: 'warning', message: '尚未识别到结束事件。' });
  }

  if (artifacts.flowSteps.some((step) => step.actorName === '待补充')) {
    issues.push({ code: 'EPC_ACTIVITY_ASSIGNMENT_MISSING', severity: 'warning', message: '存在未绑定组织单元或系统的功能活动。' });
  }

  if (!artifacts.connectionRules.length) {
    issues.push({ code: 'EPC_CONNECTION_EMPTY', severity: 'warning', message: '尚未推导出流程连接关系。' });
  }

  validateOrganizationalUnits(profile, issues);
  validateSystems(profile, issues);
  validateInformationObjects(profile, issues);

  return {
    isValid: issues.every((issue) => issue.severity !== 'error'),
    score: Math.max(0, 100 - issues.length * 10),
    issues,
    validatedAt: getNow(),
  };
}

export function createEmptyEpcModel(): EpcModel {
  return {
    id: generateId('epc'),
    name: 'EPC业务活动规格说明书',
    version: '1.0.0',
    profiles: [],
    updatedAt: getNow(),
  };
}

export function ensureEpcProfile(project: OntologyProject, aggregateId: string): EpcAggregateProfile {
  const aggregate = project.dataModel?.entities.find((entity) => entity.id === aggregateId);

  if (!aggregate || !isEntityAggregateRoot(aggregate)) {
    throw new Error('只有聚合根实体才能初始化EPC Profile');
  }

  const existingProfile = project.epcModel?.profiles.find((profile) => profile.aggregateId === aggregateId);
  if (existingProfile) {
    return existingProfile;
  }

  const profile: EpcAggregateProfile = {
    aggregateId,
    businessName: aggregate.name,
    businessCode: aggregate.nameEn?.toUpperCase(),
    documentVersion: '1.0',
    status: 'draft',
    purpose: `${aggregate.name}业务活动规格说明书`,
    scopeStart: '待补充',
    scopeEnd: '待补充',
    businessBackground: aggregate.description,
    organizationalUnits: [],
    systems: [],
    informationObjects: syncInformationObjects(deriveInformationObjects(project, aggregateId)),
    activities: deriveActivities(project, aggregateId),
    connectors: [],
    exceptions: deriveExceptions(project, aggregateId),
    kpis: [],
    integrations: [],
    complianceItems: [],
  };

  return {
    ...profile,
    generatedDocument: generateEpcMarkdown(project, profile),
    validationSummary: deriveValidationSummary(project, profile),
  };
}

export function mergeEpcProfile(profile: EpcAggregateProfile, updates: Partial<EpcAggregateProfile>): EpcAggregateProfile {
  return {
    ...profile,
    ...updates,
    organizationalUnits: updates.organizationalUnits ?? profile.organizationalUnits,
    systems: updates.systems ?? profile.systems,
    informationObjects: updates.informationObjects ?? profile.informationObjects,
    activities: updates.activities ?? profile.activities,
    connectors: updates.connectors ?? profile.connectors,
    exceptions: updates.exceptions ?? profile.exceptions,
    kpis: updates.kpis ?? profile.kpis,
    integrations: updates.integrations ?? profile.integrations,
    complianceItems: updates.complianceItems ?? profile.complianceItems,
  };
}

export function regenerateEpcProfile(project: OntologyProject, profile: EpcAggregateProfile): EpcAggregateProfile {
  const aggregate = project.dataModel?.entities.find((entity) => entity.id === profile.aggregateId);
  if (!aggregate || !isEntityAggregateRoot(aggregate)) {
    throw new Error('只有聚合根实体才能生成EPC文档');
  }

  const regenerated = mergeEpcProfile(profile, {
    businessName: profile.businessName || aggregate.name,
    informationObjects: syncInformationObjects(deriveInformationObjects(project, profile.aggregateId), profile.informationObjects),
    activities: profile.activities.length > 0 ? profile.activities : deriveActivities(project, profile.aggregateId),
    exceptions: profile.exceptions.length > 0 ? profile.exceptions : deriveExceptions(project, profile.aggregateId),
    status: 'generated',
  });

  return {
    ...regenerated,
    generatedDocument: generateEpcMarkdown(project, regenerated),
    validationSummary: deriveValidationSummary(project, regenerated),
  };
}

export function generateEpcMarkdown(project: OntologyProject, profile: EpcAggregateProfile): string {
  const aggregate = project.dataModel?.entities.find((entity) => entity.id === profile.aggregateId);
  const stateMachine = getAggregateStateMachine(project, profile.aggregateId);
  const rules = project.ruleModel?.rules.filter((rule) => rule.entity === profile.aggregateId) || [];
  const artifacts = buildFlowArtifacts(project, profile);
  const selfCheckRows = buildSelfCheckRows(project, profile, artifacts);
  const startEvent = artifacts.eventNodes.find((eventNode) => eventNode.isStart)?.name || profile.scopeStart || '待补充';
  const endEvent = artifacts.eventNodes.find((eventNode) => eventNode.isEnd)?.name || profile.scopeEnd || '待补充';
  const systems = profile.systems.map((system) => system.name).join('、') || '待补充';

  const activitiesTable = artifacts.flowSteps.length > 0
    ? artifacts.flowSteps.map((step) => `| ${step.activityCode} | ${step.activityName} | ${step.activityType} | ${step.actorName} | ${step.description || '待补充'} |`).join('\n')
    : '| FUNC-001 | 待补充活动 | 任务 | 待补充 | 待补充 |';

  const eventsTable = artifacts.eventNodes.length > 0
    ? artifacts.eventNodes.map((eventNode) => `| ${eventNode.id} | ${eventNode.name} | ${eventNode.eventType} | ${eventNode.description || '待补充'} |`).join('\n')
    : '| EVT-001 | 待补充事件 | 开始事件 | 待补充 |';

  const rulesTable = rules.length > 0
    ? rules.map((rule, index) => `| RULE-${String(index + 1).padStart(3, '0')} | ${rule.name} | ${rule.errorMessage} | ${rule.severity === 'warning' ? '中' : '高'} | ${rule.description || '待补充'} |`).join('\n')
    : '| RULE-001 | 待补充规则 | 待补充 | 中 | 待补充 |';

  const infoObjectsTable = profile.informationObjects.length > 0
    ? profile.informationObjects.map((info, index) => `| INFO-${String(index + 1).padStart(3, '0')} | ${info.name} | ${info.attributes.join('、') || '待补充'} | ${info.description || '待补充'} |`).join('\n')
    : '| INFO-001 | 待补充信息对象 | 待补充 | 待补充 |';

  const systemsTable = profile.systems.length > 0
    ? profile.systems.map((system, index) => `| SYS-${String(index + 1).padStart(3, '0')} | ${system.name} | ${getSystemTypeLabel(system.type)} | ${system.description || '待补充'} |`).join('\n')
    : '| SYS-001 | 待补充 | 待补充 | 待补充 |';

  const flowDescriptionTable = renderFlowDescriptionTable(artifacts.flowSteps);
  const eventFunctionMatrix = renderEventFunctionMatrix(artifacts);
  const connectionRulesTable = renderConnectionRulesTable(artifacts.connectionRules);
  const andSplitTable = renderSplitTable(artifacts.splitDefinitions, 'and');
  const xorSplitTable = renderSplitTable(artifacts.splitDefinitions, 'xor');
  const rolePermissionMatrix = renderRolePermissionMatrix(profile, artifacts.flowSteps);
  const selfCheckTable = selfCheckRows.map((row) => `| ${row.item} | ${row.status} | ${row.note} |`).join('\n');

  return `# EPC业务活动规格说明书

**文档名称**: ${profile.businessName}
**生成时间**: ${getNow().slice(0, 10)}
**版本**: ${profile.documentVersion}
**框架**: EPC (事件驱动流程链)
**文档ID**: EPC-${profile.businessCode || aggregate?.nameEn || 'GEN'}-001

---

## 1. 基本信息

| 项目 | 内容 |
|------|------|
| 文档名称 | ${profile.businessName} |
| 文档版本 | ${profile.documentVersion} |
| 文档状态 | ${profile.status} |
| 文档目的 | ${profile.purpose || '待补充'} |
| 业务流程 | ${aggregate?.description || '待补充'} |

---

## 2. EPC流程概述

### 2.1 流程目的
${profile.purpose || '待补充'}

### 2.2 流程范围
- **起始点**: ${startEvent}
- **结束点**: ${endEvent}
- **涉及系统**: ${systems}

### 2.3 业务背景
${profile.businessBackground || '待补充'}

---

## 3. EPC元素定义

### 3.1 事件 (Events)

| 事件ID | 事件名称 | 事件类型 | 说明 |
|--------|----------|----------|------|
${eventsTable}

### 3.2 功能 (Functions)

| 功能ID | 功能名称 | 功能类型 | 执行角色 | 说明 |
|--------|----------|----------|----------|------|
${activitiesTable}

### 3.3 业务规则 (Rules)

| 规则ID | 规则名称 | 规则描述 | 优先级 | 适用场景 |
|--------|----------|----------|--------|----------|
${rulesTable}

### 3.4 组织单元 (Organizational Units)

| 组织单元ID | 单元名称 | 职责描述 | 权限说明 |
|------------|----------|----------|----------|
${profile.organizationalUnits.length > 0 ? profile.organizationalUnits.map((unit, index) => `| ORG-${String(index + 1).padStart(3, '0')} | ${unit.name} | ${unit.responsibilities || '待补充'} | ${unit.permissions || '待补充'} |`).join('\n') : '| ORG-001 | 待补充 | 待补充 | 待补充 |'}

### 3.5 信息对象 (Information Objects)

| 信息对象ID | 对象名称 | 属性 | 说明 |
|------------|----------|------|------|
${infoObjectsTable}

### 3.6 执行系统与外部平台

| 系统ID | 系统名称 | 系统类型 | 说明 |
|--------|----------|----------|------|
${systemsTable}

---

## 4. EPC流程链

### 4.1 主流程链


${renderFlowChain(artifacts.flowSteps)}

### 4.2 流程说明

| 步骤序号 | 事件/功能 | 执行角色 | 输入 | 输出 | 说明 |
|----------|-----------|----------|------|------|------|
${flowDescriptionTable}

---

## 5. EPC流程矩阵

### 5.1 事件-功能矩阵

${eventFunctionMatrix}

### 5.2 流程连接规则

| 序号 | 源元素 | 目标元素 | 连接类型 | 条件说明 |
|------|--------|----------|----------|----------|
${connectionRulesTable}

---

## 6. EPC元素连接关系

### 6.1 AND-split (分支)

| 序号 | 分支元素 | 条件 | 目标元素1 | 目标元素2 |
|------|----------|------|-----------|-----------|
${andSplitTable}

### 6.2 XOR-split (排他分支)

| 序号 | 分支元素 | 条件 | 目标1 | 目标2 |
|------|----------|------|-------|-------|
${xorSplitTable}

---

## 7. 角色和权限矩阵

${rolePermissionMatrix}

---

## 8. 异常处理

| 异常ID | 异常名称 | 触发条件 | 处理流程 | 责任角色 |
|--------|----------|----------|----------|----------|
${profile.exceptions.length > 0 ? profile.exceptions.map((exception, index) => `| EXC-${String(index + 1).padStart(3, '0')} | ${exception.name} | ${exception.triggerCondition} | ${exception.handlingFlow} | ${profile.organizationalUnits.find((unit) => unit.id === exception.ownerOrgUnitId)?.name || '待补充'} |`).join('\n') : '| EXC-001 | 待补充异常 | 待补充 | 待补充 | 待补充 |'}

---

## 12. EPC完整性自检

| 检查项 | 状态 | 说明 |
|--------|------|------|
${selfCheckTable}
`;
}