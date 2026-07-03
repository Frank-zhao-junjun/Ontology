import type {
  Action,
  Attribute,
  BusinessMetric,
  BusinessScenario,
  ConstraintDefinition,
  ConstraintDefinitionSeverity,
  ConstraintType,
  DataModel,
  Department,
  Entity,
  EntityProject,
  EpcModelRef,
  EpcModelRefRole,
  EpcProcess,
  EventDefinition,
  InterfaceDefinition,
  InterfaceType,
  OntologyProject,
  Position,
  PositionResponsibility,
  Relation,
  Rule,
  RuleCondition,
  State,
  StateMachine,
  Transition,
} from '@/types/ontology';
import type { EpcMetamodelDrafts, EpcGenerationContext } from '@/lib/ai-draft/epc-metamodel-prompt';
import { generateId } from '@/lib/id';

export type { EpcMetamodelDrafts, EpcGenerationContext };

function now(): string {
  return new Date().toISOString();
}

function ensureId<T extends { id?: string }>(item: T): T & { id: string } {
  return { ...item, id: item.id ?? generateId() } as T & { id: string };
}

function safeString(raw: unknown): string {
  return typeof raw === 'string' ? raw : '';
}

function safeArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

function normalizeNameEn(name: string): string {
  return name
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('') || `obj_${generateId().slice(0, 6)}`;
}

export interface ApplyEpcMetamodelDraftsResult {
  project: OntologyProject;
  epc: EpcProcess;
  created: {
    entities: string[];
    attributes: string[];
    relations: string[];
    stateMachines: string[];
    rules: string[];
    eventDefinitions: string[];
    departments: string[];
    positions: string[];
    metrics: string[];
    constraints: string[];
    interfaces: string[];
  };
  reused: string[];
}

function ensureDataModel(project: OntologyProject): DataModel {
  return (
    project.dataModel ?? {
      id: generateId(),
      name: `${project.name ?? '项目'}_数据模型`,
      version: '1.0.0',
      domain: project.domain?.name ?? '未指定',
      projects: [],
      businessScenarios: [],
      entities: [],
      createdAt: now(),
      updatedAt: now(),
    }
  );
}

function findEntityIdByName(
  entities: Entity[],
  nameOrId?: string,
): string | undefined {
  if (!nameOrId) return undefined;
  const byId = entities.find((e) => e.id === nameOrId);
  if (byId) return byId.id;
  const byNameEn = entities.find(
    (e) => e.nameEn === nameOrId || normalizeNameEn(e.name) === normalizeNameEn(nameOrId),
  );
  if (byNameEn) return byNameEn.id;
  const byName = entities.find((e) => e.name === nameOrId);
  return byName?.id;
}

function coerceAttributeDataType(raw: unknown): Attribute['dataType'] {
  const allowed: Attribute['dataType'][] = [
    'string',
    'integer',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'enum',
    'reference',
    'text',
  ];
  const v = typeof raw === 'string' ? raw : 'string';
  return allowed.includes(v as Attribute['dataType']) ? (v as Attribute['dataType']) : 'string';
}

function coerceRuleType(raw: unknown): Rule['type'] {
  const map: Record<string, Rule['type']> = {
    field_validation: 'field_validation',
    cross_field: 'cross_field_validation',
    cross_field_validation: 'cross_field_validation',
    cross_entity: 'cross_entity_validation',
    cross_entity_validation: 'cross_entity_validation',
    aggregation: 'aggregation_validation',
    aggregation_validation: 'aggregation_validation',
    temporal: 'temporal_rule',
    temporal_rule: 'temporal_rule',
  };
  return map[typeof raw === 'string' ? raw : ''] ?? 'field_validation';
}

function buildRuleCondition(raw: unknown): RuleCondition {
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return {
      type: 'custom',
      expression: typeof obj.expression === 'string' ? obj.expression : safeString(raw),
    };
  }
  return {
    type: 'custom',
    expression: safeString(raw),
  };
}

function coerceEventTrigger(raw: unknown): EventDefinition['trigger'] {
  const map: Record<string, EventDefinition['trigger']> = {
    before_create: 'create',
    after_create: 'create',
    before_update: 'update',
    after_update: 'update',
    before_delete: 'delete',
    after_delete: 'delete',
    on_status_change: 'state_change',
    create: 'create',
    update: 'update',
    delete: 'delete',
    state_change: 'state_change',
    custom: 'custom',
  };
  return map[typeof raw === 'string' ? raw : ''] ?? 'custom';
}

function coerceInterfaceType(raw: unknown): InterfaceType {
  const allowed: InterfaceType[] = ['api', 'event', 'message_queue', 'file', 'database'];
  const v = typeof raw === 'string' ? raw : 'api';
  return allowed.includes(v as InterfaceType) ? (v as InterfaceType) : 'api';
}

function coerceDepartmentType(raw: unknown): Department['type'] {
  const allowed: Department['type'][] = ['headquarters', 'division', 'department', 'team', 'group'];
  const v = typeof raw === 'string' ? raw : 'department';
  return allowed.includes(v as Department['type']) ? (v as Department['type']) : 'department';
}

function coerceConstraintType(raw: unknown): ConstraintType {
  const allowed: ConstraintType[] = ['business', 'technical', 'data_quality', 'security', 'performance'];
  const v = typeof raw === 'string' ? raw : 'business';
  return allowed.includes(v as ConstraintType) ? (v as ConstraintType) : 'business';
}

function coerceConstraintSeverity(raw: unknown): ConstraintDefinitionSeverity {
  const allowed: ConstraintDefinitionSeverity[] = ['error', 'warning', 'info'];
  const v = typeof raw === 'string' ? raw : 'info';
  return allowed.includes(v as ConstraintDefinitionSeverity) ? (v as ConstraintDefinitionSeverity) : 'info';
}

function buildResponsibilities(raw: unknown): PositionResponsibility[] {
  const arr = safeArray<Record<string, unknown>>(raw);
  if (arr.length === 0) {
    return [
      {
        id: generateId(),
        name: '职责项',
        scope: 'process',
        scopeRefs: [],
        actions: [],
        decisionAuthority: 'recommend',
        isActive: true,
      },
    ];
  }
  return arr.map((item) => ({
    id: ensureId(item).id,
    name: safeString(item.name) || '职责项',
    description: safeString(item.description),
    scope: 'process',
    scopeRefs: [],
    actions: safeArray<string>(item.actions),
    decisionAuthority: 'recommend',
    delegateToPositionIds: safeArray<string>(item.delegateToPositionIds),
    isActive: true,
  }));
}

export function applyEpcMetamodelDrafts(
  project: OntologyProject,
  epcId: string,
  parseResult: EpcMetamodelDrafts,
): ApplyEpcMetamodelDraftsResult {
  const { drafts, reusedRefs } = parseResult;

  const nextProject: OntologyProject = { ...project };

  // Ensure model containers exist
  const dataModel = ensureDataModel(nextProject);
  const behaviorModel = nextProject.behaviorModel ?? {
    id: generateId(),
    name: `${project.name ?? '项目'}_行为模型`,
    version: '1.0.0',
    domain: project.domain?.name ?? '未指定',
    stateMachines: [],
    actions: [],
    createdAt: now(),
    updatedAt: now(),
  };
  const ruleModel = nextProject.ruleModel ?? {
    id: generateId(),
    name: `${project.name ?? '项目'}_规则模型`,
    version: '1.0.0',
    domain: project.domain?.name ?? '未指定',
    rules: [],
    createdAt: now(),
    updatedAt: now(),
  };
  const eventModel = nextProject.eventModel ?? {
    id: generateId(),
    name: `${project.name ?? '项目'}_事件模型`,
    version: '1.0.0',
    domain: project.domain?.name ?? '未指定',
    events: [],
    subscriptions: [],
    createdAt: now(),
    updatedAt: now(),
  };
  const organizationModel = nextProject.organizationModel ?? {
    id: generateId(),
    departments: [],
    positions: [],
    createdAt: now(),
    updatedAt: now(),
  };
  const metricsModel = nextProject.metricsModel ?? {
    id: generateId(),
    name: `${project.name ?? '项目'}_指标模型`,
    version: '1.0.0',
    domain: project.domain?.name ?? '未指定',
    metrics: [],
    createdAt: now(),
    updatedAt: now(),
  };

  // Create a synthetic project + scenario for EPC data model
  const epcProjectId = generateId();
  const epcScenarioId = generateId();
  const epcProject: EntityProject = {
    id: epcProjectId,
    name: 'EPC默认分组',
    nameEn: 'EpcDefaultGroup',
    createdAt: now(),
    updatedAt: now(),
  };
  const epcScenario: BusinessScenario = {
    id: epcScenarioId,
    name: 'EPC默认场景',
    nameEn: 'EpcDefaultScenario',
    projectId: epcProjectId,
    createdAt: now(),
    updatedAt: now(),
  };

  // Data model (E1) - entities
  const rawEntities = safeArray<Record<string, unknown>>(drafts.entities);
  if (rawEntities.length === 0) {
    rawEntities.push({
      name: '业务对象',
      nameEn: 'BusinessObject',
      description: 'EPC流程自动生成的默认业务对象',
      entityRole: 'aggregate_root',
    });
  }

  const entities: Entity[] = rawEntities.map((d) => {
    const name = safeString(d.name) || '未命名实体';
    const nameEn = safeString(d.nameEn) || normalizeNameEn(name);
    return {
      id: ensureId(d).id,
      name,
      nameEn,
      projectId: epcProjectId,
      businessScenarioId: epcScenarioId,
      description: safeString(d.description),
      businessMeaning: safeString(d.businessMeaning),
      aliases: safeArray<string>(d.aliases),
      entityRole: (safeString(d.entityRole) as Entity['entityRole']) || 'aggregate_root',
      parentAggregateId: safeString(d.parentAggregateId),
      isAggregateRoot: safeString(d.entityRole) === 'aggregate_root',
      attributes: [],
      relations: [],
      computedProperties: [],
      sourceMappings: [],
      domainEvents: [],
      indexes: [],
    };
  });

  const aggregateRootIndex = entities.findIndex((e) => e.entityRole === 'aggregate_root');
  const defaultEntity = entities[aggregateRootIndex >= 0 ? aggregateRootIndex : 0];

  // Distribute attributes into entities
  const createdAttributeIds: string[] = [];
  safeArray<Record<string, unknown>>(drafts.attributes).forEach((d) => {
    const entityId = findEntityIdByName(entities, safeString(d.entityId)) ?? defaultEntity.id;
    const entity = entities.find((e) => e.id === entityId) ?? defaultEntity;
    const name = safeString(d.name) || '未命名属性';
    const attr: Attribute = {
      id: ensureId(d).id,
      name,
      nameEn: safeString(d.nameEn) || normalizeNameEn(name),
      description: safeString(d.description),
      dataType: coerceAttributeDataType(d.dataType),
      length: typeof d.length === 'number' ? d.length : undefined,
      precision: typeof d.precision === 'number' ? d.precision : undefined,
      scale: typeof d.scale === 'number' ? d.scale : undefined,
      required: d.required === true,
      unique: d.unique === true,
      default: safeString(d.default),
      enumRef: safeString(d.enumRef),
      referenceKind: (safeString(d.referenceKind) as Attribute['referenceKind']) || undefined,
      referencedEntityId: safeString(d.referencedEntityId),
      referenceDisplayField: safeString(d.referenceDisplayField),
    };
    entity.attributes.push(attr);
    createdAttributeIds.push(attr.id);
  });

  // Distribute relations into entities
  const createdRelationIds: string[] = [];
  safeArray<Record<string, unknown>>(drafts.relations).forEach((d) => {
    const sourceId = findEntityIdByName(entities, safeString(d.sourceEntityId));
    const targetId = findEntityIdByName(entities, safeString(d.targetEntityId));
    const sourceEntity = sourceId ? entities.find((e) => e.id === sourceId) : defaultEntity;
    const targetEntity = targetId ? entities.find((e) => e.id === targetId) : defaultEntity;
    if (!sourceEntity || !targetEntity) return;

    const relation: Relation = {
      id: ensureId(d).id,
      name: safeString(d.name) || `${sourceEntity.name}_${targetEntity.name}`,
      description: safeString(d.description),
      type: (safeString(d.type) as Relation['type']) || 'one_to_many',
      targetEntity: targetEntity.id,
      foreignKey: safeString(d.foreignKey),
      viaEntity: safeString(d.viaEntity),
      cascade: (safeString(d.cascade) as Relation['cascade']) || 'none',
      attributes: [],
      isRecursive: sourceEntity.id === targetEntity.id,
      directionality: 'directed',
    };
    sourceEntity.relations.push(relation);
    createdRelationIds.push(relation.id);
  });

  dataModel.projects = [...dataModel.projects, epcProject];
  dataModel.businessScenarios = [...dataModel.businessScenarios, epcScenario];
  dataModel.entities = [...dataModel.entities, ...entities];
  dataModel.updatedAt = now();

  // Behavior model (E2)
  const stateMachines: StateMachine[] = safeArray<Record<string, unknown>>(drafts.stateMachines).map((d) => {
    const entityId = findEntityIdByName(entities, safeString(d.entityId)) ?? defaultEntity.id;
    const states: State[] = safeArray<Record<string, unknown>>(d.states).map((s) => ({
      id: ensureId(s).id,
      name: safeString(s.name) || '未命名状态',
      description: safeString(s.description),
      isInitial: s.isInitial === true,
      isFinal: s.isFinal === true,
    }));
    if (states.length === 0) {
      states.push(
        { id: generateId(), name: '草稿', isInitial: true, isFinal: false },
        { id: generateId(), name: '完成', isInitial: false, isFinal: true },
      );
    }
    const transitions = safeArray<Record<string, unknown>>(d.transitions).map((t) => ({
      id: ensureId(t).id,
      name: safeString(t.name) || `${safeString(t.from)}_${safeString(t.to)}`,
      from: safeString(t.from),
      to: safeString(t.to),
      trigger: (safeString(t.trigger) as Transition['trigger']) || 'manual',
      description: safeString(t.description),
    }));

    return {
      id: ensureId(d).id,
      name: safeString(d.name) || '未命名状态机',
      entity: entityId,
      statusField: safeString(d.stateField) || 'status',
      states,
      transitions,
      actions: [],
    };
  });

  behaviorModel.stateMachines = [...behaviorModel.stateMachines, ...stateMachines];
  behaviorModel.updatedAt = now();

  // Rule model (E3)
  const rules: Rule[] = safeArray<Record<string, unknown>>(drafts.rules).map((d) => {
    const entityNameOrId = safeString(d.entityId) || defaultEntity.nameEn;
    return {
      id: ensureId(d).id,
      name: safeString(d.name) || '未命名规则',
      description: safeString(d.description),
      type: coerceRuleType(d.type),
      entity: entityNameOrId,
      field: safeString(d.field),
      condition: buildRuleCondition(d.condition),
      errorMessage: safeString(d.message) || '规则校验失败',
      severity: (safeString(d.severity) as Rule['severity']) || 'info',
      enabled: true,
      status: 'draft',
      grayscale: { enabled: false, percentage: 0 },
    };
  });

  ruleModel.rules = [...ruleModel.rules, ...rules];
  ruleModel.updatedAt = now();

  // Event model (E4)
  const eventDefinitions: EventDefinition[] = safeArray<Record<string, unknown>>(drafts.eventDefinitions).map((d) => ({
    id: ensureId(d).id,
    name: safeString(d.name) || '未命名事件',
    nameEn: safeString(d.nameEn) || normalizeNameEn(safeString(d.name) || 'Event'),
    entity: safeString(d.entityId) || defaultEntity.nameEn,
    trigger: coerceEventTrigger(d.trigger),
    condition: safeString(d.condition),
    payload: safeArray<{ field: string; path?: string }>(d.payload).length
      ? safeArray<{ field: string; path?: string }>(d.payload)
      : [{ field: 'id' }],
    description: safeString(d.description),
  }));

  eventModel.events = [...eventModel.events, ...eventDefinitions];
  eventModel.updatedAt = now();

  // Organization model (E5)
  const departments: Department[] = safeArray<Record<string, unknown>>(drafts.departments).map((d) => ({
    id: ensureId(d).id,
    name: safeString(d.name) || '未命名部门',
    nameEn: safeString(d.nameEn) || normalizeNameEn(safeString(d.name) || 'Department'),
    description: safeString(d.description),
    type: coerceDepartmentType(d.type),
    parentId: safeString(d.parentId),
    status: (safeString(d.status) as Department['status']) || 'active',
  }));

  const departmentIdMap = new Map(departments.map((d) => [d.id, d.id]));
  const positions: Position[] = safeArray<Record<string, unknown>>(drafts.positions).map((d) => {
    const deptId = safeString(d.departmentId);
    const resolvedDeptId = departmentIdMap.has(deptId)
      ? deptId
      : departments[0]?.id ?? generateId();
    return {
      id: ensureId(d).id,
      name: safeString(d.name) || '未命名岗位',
      nameEn: safeString(d.nameEn) || normalizeNameEn(safeString(d.name) || 'Position'),
      description: safeString(d.description),
      departmentId: resolvedDeptId,
      roleIds: safeArray<string>(d.roleIds),
      headcount: typeof d.headcount === 'number' ? d.headcount : undefined,
      responsibilities: buildResponsibilities(d.responsibilities),
      status: (safeString(d.status) as Position['status']) || 'active',
    };
  });

  organizationModel.departments = [...organizationModel.departments, ...departments];
  organizationModel.positions = [...organizationModel.positions, ...positions];
  organizationModel.updatedAt = now();

  // Metrics model (E6) - create placeholder actions
  const placeholderActions: Action[] = [];
  const metrics: BusinessMetric[] = safeArray<Record<string, unknown>>(drafts.metrics).map((d) => {
    const actionId = generateId();
    placeholderActions.push({
      id: actionId,
      name: safeString(d.name) || '指标关联动作',
      actionType: 'custom',
      parameters: [],
      preConditions: [],
      postEffects: [],
      sideEffects: [],
    });
    return {
      id: ensureId(d).id,
      name: safeString(d.name) || '未命名指标',
      nameEn: safeString(d.nameEn) || normalizeNameEn(safeString(d.name) || 'Metric'),
      description: safeString(d.description),
      formula: safeString(d.formula) || '1',
      unit: safeString(d.unit) || '个',
      targetValue: typeof d.targetValue === 'number' ? d.targetValue : undefined,
      boundActionId: actionId,
      measurementType: (safeString(d.measurementType) as BusinessMetric['measurementType']) || 'automatic',
      dataSourceRef: safeString(d.dataSourceRef),
    };
  });

  metricsModel.metrics = [...metricsModel.metrics, ...metrics];
  metricsModel.updatedAt = now();
  behaviorModel.actions = [...(behaviorModel.actions ?? []), ...placeholderActions];

  // Constraints (E7)
  const constraints: ConstraintDefinition[] = safeArray<Record<string, unknown>>(drafts.constraints).map((d) => ({
    id: ensureId(d).id,
    name: safeString(d.name) || '未命名约束',
    nameEn: safeString(d.nameEn) || normalizeNameEn(safeString(d.name) || 'Constraint'),
    description: safeString(d.description),
    type: coerceConstraintType(d.type),
    expression: safeString(d.condition) || safeString(d.expression),
    severity: coerceConstraintSeverity(d.severity),
    boundEntityId: safeString(d.boundEntityId) || defaultEntity.id,
    boundActionId: safeString(d.boundActionId),
    createdAt: now(),
    updatedAt: now(),
  }));

  nextProject.constraints = [...(nextProject.constraints ?? []), ...constraints];

  // Interfaces (E8) - prompt calls them dataSources, project stores them as interfaces
  const interfaces: InterfaceDefinition[] = safeArray<Record<string, unknown>>(drafts.dataSources).map((d) => ({
    id: ensureId(d).id,
    name: safeString(d.name) || '未命名接口',
    nameEn: safeString(d.nameEn) || normalizeNameEn(safeString(d.name) || 'Interface'),
    description: safeString(d.description),
    type: coerceInterfaceType(d.type),
    protocol: safeString(d.protocol),
    endpoint: safeString(d.endpoint),
    boundEntityId: safeString(d.boundEntityId) || defaultEntity.id,
    createdAt: now(),
    updatedAt: now(),
  }));

  nextProject.interfaces = [...(nextProject.interfaces ?? []), ...interfaces];

  // Build refs on EPC process
  const refs: EpcModelRef[] = [];

  const addRef = (
    modelType: EpcModelRef['modelType'],
    elementId: string,
    elementName: string,
    role: EpcModelRefRole = 'core',
  ) => {
    refs.push({
      modelType,
      modelId: elementId,
      modelName: elementName,
      role,
    });
  };

  entities.forEach((e) => addRef('data', e.id, e.name, 'core'));
  stateMachines.forEach((s) => addRef('behavior', s.id, s.name, 'condition'));
  rules.forEach((r) => addRef('rule', r.id, r.name, 'guard'));
  eventDefinitions.forEach((e) => addRef('event', e.id, e.name, 'trigger'));
  departments.forEach((d) => addRef('organization', d.id, d.name, 'owner'));
  positions.forEach((p) => addRef('organization', p.id, p.name, 'permission'));
  metrics.forEach((m) => addRef('metric', m.id, m.name, 'measure'));
  constraints.forEach((c) => addRef('boundary', c.id, c.name, 'guard'));
  interfaces.forEach((i) => addRef('dataSource', i.id, i.name, 'source'));

  reusedRefs.forEach((ref) => {
    refs.push({
      modelType: ref.modelType as EpcModelRef['modelType'],
      modelId: ref.elementId,
      modelName: ref.name,
      role: 'core',
    });
  });

  // Assign back to project
  nextProject.dataModel = dataModel;
  nextProject.behaviorModel = behaviorModel;
  nextProject.ruleModel = ruleModel;
  nextProject.eventModel = eventModel;
  nextProject.organizationModel = organizationModel;
  nextProject.metricsModel = metricsModel;

  // Update EPC process
  const epcIndex = (nextProject.epcProcesses ?? []).findIndex((epc) => epc.id === epcId);
  if (epcIndex < 0) {
    throw new Error(`EPC 流程 ${epcId} 不存在`);
  }

  const epcProcesses = [...(nextProject.epcProcesses ?? [])];
  const epc: EpcProcess = {
    ...epcProcesses[epcIndex],
    generatedRefs: [...(epcProcesses[epcIndex].generatedRefs ?? []), ...refs],
  };
  epcProcesses[epcIndex] = epc;
  nextProject.epcProcesses = epcProcesses;
  nextProject.updatedAt = now();

  return {
    project: nextProject,
    epc,
    created: {
      entities: entities.map((e) => e.id),
      attributes: createdAttributeIds,
      relations: createdRelationIds,
      stateMachines: stateMachines.map((s) => s.id),
      rules: rules.map((r) => r.id),
      eventDefinitions: eventDefinitions.map((e) => e.id),
      departments: departments.map((d) => d.id),
      positions: positions.map((p) => p.id),
      metrics: metrics.map((m) => m.id),
      constraints: constraints.map((c) => c.id),
      interfaces: interfaces.map((i) => i.id),
    },
    reused: reusedRefs.map((r) => r.elementId),
  };
}
