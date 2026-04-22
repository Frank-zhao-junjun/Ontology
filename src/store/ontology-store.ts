'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEmptyEpcModel, ensureEpcProfile as buildEpcProfile, regenerateEpcProfile as rebuildEpcProfile } from '@/lib/epc-generator';
import { MAX_BUSINESS_SCENARIOS_PER_PROJECT } from '@/lib/business-scenario';
import { resolveEntityRole } from '@/lib/entity-role';
import { parseFieldNames } from '@/lib/masterdata/field-parser';
import { normalizeMasterDataRecord } from '@/lib/masterdata/record-factory';
import { normalizeEntity, normalizeOntologyProject } from '@/lib/ontology-normalizer';
import type { 
  OntologyProject, 
  Domain, 
  DataModel, 
  BehaviorModel, 
  RuleModel, 
  RuleExecutionLog,
  ProcessModel, 
  EventModel,
  Entity,
  EntityProject,
  BusinessScenario,
  StateMachine,
  TriggerExecutionLog,
  Action,
  FunctionDefinition,
  Rule,
  Orchestration,
  EventDefinition,
  Subscription,
  EpcModel,
  EpcAggregateProfile,
  Metadata,
  MasterData,
  MasterDataRecord,
  ProjectVersion,
  PublishConfig
} from '@/types/ontology';

interface OntologyState {
  // 项目信息
  project: OntologyProject | null;
  
  // 元数据列表（全局）
  metadataList: Metadata[];
  
  // 主数据列表（全局）
  masterDataList: MasterData[];
  masterDataRecords: Record<string, MasterDataRecord[]>;
  
  // 版本管理 (M1)
  versions: ProjectVersion[];
  
  // 当前编辑的模型
  activeModelType: 'data' | 'behavior' | 'rule' | 'process' | 'event' | null;
  
  // Actions
  createProject: (name: string, domain: Domain, description?: string) => void;
  updateProjectName: (name: string) => void;
  updateProjectDescription: (description: string) => void;
  
  // 数据模型操作
  setDataModel: (model: DataModel) => void;
  addEntity: (entity: Entity) => void;
  updateEntity: (entityId: string, entity: Entity) => void;
  deleteEntity: (entityId: string) => void;
  
  // 项目分类操作
  addEntityProject: (project: EntityProject) => void;
  updateEntityProject: (projectId: string, project: EntityProject) => void;
  deleteEntityProject: (projectId: string) => void;
  
  // 业务场景操作
  addBusinessScenario: (scenario: BusinessScenario) => void;
  updateBusinessScenario: (scenarioId: string, scenario: BusinessScenario) => void;
  deleteBusinessScenario: (scenarioId: string) => void;
  
  // 行为模型操作
  setBehaviorModel: (model: BehaviorModel) => void;
  addStateMachine: (stateMachine: StateMachine) => void;
  updateStateMachine: (smId: string, stateMachine: StateMachine) => void;
  deleteStateMachine: (smId: string) => void;
  recordTransitionTriggerExecution: (smId: string, transitionId: string, log: Omit<TriggerExecutionLog, 'id'>) => void;
  addAction: (action: Action) => void;
  updateAction: (actionId: string, action: Action) => void;
  deleteAction: (actionId: string) => void;
  addFunction: (func: FunctionDefinition) => void;
  updateFunction: (funcId: string, func: FunctionDefinition) => void;
  deleteFunction: (funcId: string) => void;
  
  // 规则模型操作
  setRuleModel: (model: RuleModel) => void;
  addRule: (rule: Rule) => void;
  updateRule: (ruleId: string, rule: Rule) => void;
  deleteRule: (ruleId: string) => void;
  recordRuleExecution: (ruleId: string, log: Omit<RuleExecutionLog, 'id' | 'recordedAt'>) => void;
  
  // 流程模型操作（兼容保留，不在当前 UI 暴露）
  setProcessModel: (model: ProcessModel) => void;
  addOrchestration: (orchestration: Orchestration) => void;
  updateOrchestration: (oId: string, orchestration: Orchestration) => void;
  deleteOrchestration: (oId: string) => void;
  
  // 事件模型操作
  setEventModel: (model: EventModel) => void;
  addEventDefinition: (event: EventDefinition) => void;
  updateEventDefinition: (eventId: string, event: EventDefinition) => void;
  deleteEventDefinition: (eventId: string) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (subId: string, subscription: Subscription) => void;
  deleteSubscription: (subId: string) => void;

  // EPC模型操作
  setEpcModel: (model: EpcModel) => void;
  ensureEpcProfile: (aggregateId: string) => EpcAggregateProfile;
  regenerateEpcDocument: (aggregateId: string) => void;
  
  // 元数据操作
  setMetadataList: (list: Metadata[]) => void;
  addMetadata: (metadata: Metadata) => void;
  updateMetadata: (id: string, metadata: Metadata) => void;
  deleteMetadata: (id: string) => void;
  findMetadataByName: (name: string) => Metadata | undefined;
  findMetadataByNameEn: (nameEn: string) => Metadata | undefined;
  
  // 主数据操作
  setMasterDataList: (list: MasterData[]) => void;
  setMasterDataRecords: (records: Record<string, MasterDataRecord[]>) => void;
  addMasterData: (masterData: MasterData) => void;
  updateMasterData: (id: string, masterData: MasterData) => void;
  deleteMasterData: (id: string) => void;
  addMasterDataRecord: (definitionId: string, record: MasterDataRecord) => void;
  updateMasterDataRecord: (definitionId: string, recordId: string, updates: Partial<MasterDataRecord>) => void;
  deleteMasterDataRecord: (definitionId: string, recordId: string) => void;
  toggleMasterDataRecordStatus: (definitionId: string, recordId: string) => void;
  
  // 版本管理操作 (M1)
  createVersion: (config: { version: string; name: string; description?: string }) => ProjectVersion;
  updateVersion: (versionId: string, updates: Partial<ProjectVersion>) => void;
  deleteVersion: (versionId: string) => void;
  publishVersion: (versionId: string) => void;
  archiveVersion: (versionId: string) => void;
  rollbackVersion: (versionId: string) => void;
  getVersionsByProject: (projectId: string) => ProjectVersion[];
  getLatestVersion: () => ProjectVersion | null;
  
  // UI状态
  setActiveModelType: (type: 'data' | 'behavior' | 'rule' | 'process' | 'event' | null) => void;
  
  // 重置
  resetProject: () => void;
  clearAllModels: () => void;
  
  // 导入导出
  exportProject: () => string;
  importProject: (json: string) => void;
  
  // 代码生成 (M2准备)
  generateCodePackage: (versionId: string, config: PublishConfig) => Promise<string>;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

function ensureEntityScenario(entity: Entity, stateProject: OntologyProject | null): Entity {
  const scenarios = stateProject?.dataModel?.businessScenarios || [];
  const normalizedEntity = normalizeEntity(entity, scenarios);

  if (!normalizedEntity.businessScenarioId) {
    throw new Error('实体必须归属一个业务场景');
  }

  return normalizedEntity;
}

function ensureEntityAggregateBoundary(entity: Entity, stateProject: OntologyProject | null): Entity {
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

function collectCascadeEntityIds(entities: Entity[], rootId: string): Set<string> {
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

function ensureAggregateRootRoleChangeSafety(existingEntity: Entity, nextEntity: Entity, stateProject: OntologyProject | null): void {
  if (resolveEntityRole(existingEntity) !== 'aggregate_root' || resolveEntityRole(nextEntity) === 'aggregate_root') {
    return;
  }

  const entities = stateProject?.dataModel?.entities || [];
  const hasChildEntities = entities.some((entity) => entity.id !== existingEntity.id && entity.parentAggregateId === existingEntity.id);

  if (hasChildEntities) {
    throw new Error('存在归属到当前聚合根的子实体，不能直接降级');
  }
}

function ensureStateMachineRules(
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

function ensureEventDefinitionRules(event: EventDefinition, stateProject: OntologyProject | null): EventDefinition {
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

function ensureSubscriptionRules(subscription: Subscription, stateProject: OntologyProject | null): Subscription {
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

function ensureRuleDefinitionRules(rule: Rule, stateProject: OntologyProject | null): Rule {
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

export const useOntologyStore = create<OntologyState>()(
  persist(
    (set, get) => ({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      
      createProject: (name, domain, description) => {
        const now = new Date().toISOString();
        set({
          project: {
            id: generateId(),
            name,
            description,
            domain,
            dataModel: null,
            behaviorModel: null,
            ruleModel: null,
            processModel: null,
            eventModel: null,
            epcModel: null,
            createdAt: now,
            updatedAt: now,
          },
          activeModelType: 'data',
        });
      },
      
      updateProjectName: (name) => {
        set((state) => ({
          project: state.project ? { ...state.project, name, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      updateProjectDescription: (description) => {
        set((state) => ({
          project: state.project ? { ...state.project, description, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      // 数据模型操作
      setDataModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, dataModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addEntity: (entity) => {
        set((state) => {
          if (!state.project) return state;
          const normalizedEntity = ensureEntityAggregateBoundary(entity, state.project);
          const currentModel = state.project.dataModel || {
            id: generateId(),
            name: `${state.project.domain.name}数据模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            projects: [],
            businessScenarios: [],
            entities: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              dataModel: {
                ...currentModel,
                entities: [...currentModel.entities, normalizedEntity],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEntity: (entityId, entity) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          const existingEntity = state.project.dataModel.entities.find((item) => item.id === entityId);
          if (!existingEntity) {
            return state;
          }

          const normalizedEntity = ensureEntityAggregateBoundary({
            ...entity,
            businessScenarioId: existingEntity.businessScenarioId,
          }, state.project);
          ensureAggregateRootRoleChangeSafety(existingEntity, normalizedEntity, state.project);

          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                entities: state.project.dataModel.entities.map((e) =>
                  e.id === entityId ? normalizedEntity : e
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEntity: (entityId) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          const idsToDelete = collectCascadeEntityIds(state.project.dataModel.entities, entityId);
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                entities: state.project.dataModel.entities.filter((e) => !idsToDelete.has(e.id)),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 项目分类管理
      addEntityProject: (project) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.dataModel || {
            id: generateId(),
            name: `${state.project.domain.name}数据模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            projects: [],
            businessScenarios: [],
            entities: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              dataModel: {
                ...currentModel,
                projects: [...(currentModel.projects || []), project],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEntityProject: (projectId, project) => {
        set((state) => {
          if (!state.project?.dataModel?.projects) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                projects: state.project.dataModel.projects.map((p) =>
                  p.id === projectId ? project : p
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEntityProject: (projectId) => {
        set((state) => {
          if (!state.project?.dataModel?.projects) return state;
          const hasLinkedEntities = state.project.dataModel.entities.some(
            (entity) => entity.projectId === projectId,
          );

          if (hasLinkedEntities) {
            return state;
          }

          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                projects: state.project.dataModel.projects.filter((p) => p.id !== projectId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 业务场景操作
      addBusinessScenario: (scenario) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          const scenarios = state.project.dataModel.businessScenarios || [];
          const projectScenarioCount = scenarios.filter((item) => item.projectId === scenario.projectId).length;

          if (projectScenarioCount >= MAX_BUSINESS_SCENARIOS_PER_PROJECT) {
            return state;
          }

          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: [...scenarios, scenario],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateBusinessScenario: (scenarioId, scenario) => {
        set((state) => {
          if (!state.project?.dataModel?.businessScenarios) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: state.project.dataModel.businessScenarios.map((s) =>
                  s.id === scenarioId ? scenario : s
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteBusinessScenario: (scenarioId) => {
        set((state) => {
          if (!state.project?.dataModel?.businessScenarios) return state;
          const hasLinkedEntities = state.project.dataModel.entities.some(
            (entity) => entity.businessScenarioId === scenarioId,
          );

          if (hasLinkedEntities) {
            return state;
          }

          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: state.project.dataModel.businessScenarios.filter((s) => s.id !== scenarioId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 行为模型操作
      setBehaviorModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, behaviorModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addStateMachine: (stateMachine) => {
        set((state) => {
          if (!state.project) return state;
          const normalizedStateMachine = ensureStateMachineRules(stateMachine, state.project);
          const currentModel = state.project.behaviorModel || {
            id: generateId(),
            name: `${state.project.domain.name}行为模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            stateMachines: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...currentModel,
                stateMachines: [...currentModel.stateMachines, normalizedStateMachine],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateStateMachine: (smId, stateMachine) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const existingStateMachine = state.project.behaviorModel.stateMachines.find((sm) => sm.id === smId);
          if (!existingStateMachine) {
            return state;
          }

          const normalizedStateMachine = ensureStateMachineRules(stateMachine, state.project, existingStateMachine);

          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                stateMachines: state.project.behaviorModel.stateMachines.map((sm) =>
                  sm.id === smId ? normalizedStateMachine : sm
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteStateMachine: (smId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                stateMachines: state.project.behaviorModel.stateMachines.filter((sm) => sm.id !== smId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      recordTransitionTriggerExecution: (smId, transitionId, log) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;

          const stateMachine = state.project.behaviorModel.stateMachines.find((item) => item.id === smId);
          const transition = stateMachine?.transitions.find((item) => item.id === transitionId);
          if (!stateMachine || !transition) {
            return state;
          }

          const executionLog: TriggerExecutionLog = {
            id: generateId(),
            ...log,
            message: log.message?.trim() || undefined,
            publishedEventId: log.publishedEventId?.trim() || transition.triggerConfig?.publishEventId,
          };

          const nextStateMachine = ensureStateMachineRules({
            ...stateMachine,
            transitions: stateMachine.transitions.map((item) => {
              if (item.id !== transitionId) {
                return item;
              }

              return {
                ...item,
                executionLogs: [...(item.executionLogs || []), executionLog],
              };
            }),
          }, state.project, stateMachine);

          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                stateMachines: state.project.behaviorModel.stateMachines.map((item) =>
                  item.id === smId ? nextStateMachine : item,
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      addAction: (action) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.behaviorModel || {
            id: generateId(),
            name: `${state.project.domain.name}行为模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            stateMachines: [],
            actions: [],
            functions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...currentModel,
                actions: [...(currentModel.actions || []), action],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateAction: (actionId, action) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                actions: (state.project.behaviorModel.actions || []).map((a) => (a.id === actionId ? action : a)),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteAction: (actionId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                actions: (state.project.behaviorModel.actions || []).filter((a) => a.id !== actionId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      addFunction: (func) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.behaviorModel || {
            id: generateId(),
            name: `${state.project.domain.name}行为模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            stateMachines: [],
            actions: [],
            functions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...currentModel,
                functions: [...(currentModel.functions || []), func],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateFunction: (funcId, func) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                functions: (state.project.behaviorModel.functions || []).map((f) => (f.id === funcId ? func : f)),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteFunction: (funcId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                functions: (state.project.behaviorModel.functions || []).filter((f) => f.id !== funcId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 规则模型操作
      setRuleModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, ruleModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addRule: (rule) => {
        set((state) => {
          if (!state.project) return state;
          const normalizedRule = ensureRuleDefinitionRules(rule, state.project);
          const currentModel = state.project.ruleModel || {
            id: generateId(),
            name: `${state.project.domain.name}规则模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            rules: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              ruleModel: {
                ...currentModel,
                rules: [...currentModel.rules, normalizedRule]
                  .sort((a, b) => (a.priority || 100) - (b.priority || 100)),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateRule: (ruleId, rule) => {
        set((state) => {
          if (!state.project?.ruleModel) return state;
          const normalizedRule = ensureRuleDefinitionRules(rule, state.project);
          return {
            project: {
              ...state.project,
              ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules
                  .map((r) => (r.id === ruleId ? normalizedRule : r))
                  .sort((a, b) => (a.priority || 100) - (b.priority || 100)),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteRule: (ruleId) => {
        set((state) => {
          if (!state.project?.ruleModel) return state;
          return {
            project: {
              ...state.project,
              ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules.filter((r) => r.id !== ruleId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      recordRuleExecution: (ruleId, log) => {
        set((state) => {
          if (!state.project?.ruleModel) return state;

          return {
            project: {
              ...state.project,
              ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules.map((rule) => {
                  if (rule.id !== ruleId) return rule;
                  const entry: RuleExecutionLog = {
                    id: generateId(),
                    operation: log.operation.trim(),
                    status: log.status,
                    message: log.message.trim(),
                    recordedAt: new Date().toISOString(),
                  };
                  return {
                    ...rule,
                    executionLogs: [...(rule.executionLogs || []), entry],
                  };
                }),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 流程模型操作（兼容保留，不在当前 UI 暴露）
      setProcessModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, processModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addOrchestration: (orchestration) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.processModel || {
            id: generateId(),
            name: `${state.project.domain.name}流程模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            orchestrations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              processModel: {
                ...currentModel,
                orchestrations: [...currentModel.orchestrations, orchestration],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateOrchestration: (oId, orchestration) => {
        set((state) => {
          if (!state.project?.processModel) return state;
          return {
            project: {
              ...state.project,
              processModel: {
                ...state.project.processModel,
                orchestrations: state.project.processModel.orchestrations.map((o) =>
                  o.id === oId ? orchestration : o
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteOrchestration: (oId) => {
        set((state) => {
          if (!state.project?.processModel) return state;
          return {
            project: {
              ...state.project,
              processModel: {
                ...state.project.processModel,
                orchestrations: state.project.processModel.orchestrations.filter((o) => o.id !== oId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 事件模型操作
      setEventModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, eventModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addEventDefinition: (event) => {
        set((state) => {
          if (!state.project) return state;
          const normalizedEvent = ensureEventDefinitionRules(event, state.project);
          const currentModel = state.project.eventModel || {
            id: generateId(),
            name: `${state.project.domain.name}事件模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            events: [],
            subscriptions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              eventModel: {
                ...currentModel,
                events: [...currentModel.events, normalizedEvent],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEventDefinition: (eventId, event) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          const normalizedEvent = ensureEventDefinitionRules(event, state.project);
          return {
            project: {
              ...state.project,
              eventModel: {
                ...state.project.eventModel,
                events: state.project.eventModel.events.map((e) =>
                  e.id === eventId ? normalizedEvent : e
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEventDefinition: (eventId) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          return {
            project: {
              ...state.project,
              eventModel: {
                ...state.project.eventModel,
                events: state.project.eventModel.events.filter((e) => e.id !== eventId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      addSubscription: (subscription) => {
        set((state) => {
          if (!state.project) return state;
          const normalizedSubscription = ensureSubscriptionRules(subscription, state.project);
          const currentModel = state.project.eventModel || {
            id: generateId(),
            name: `${state.project.domain.name}事件模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            events: [],
            subscriptions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              eventModel: {
                ...currentModel,
                subscriptions: [...currentModel.subscriptions, normalizedSubscription],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateSubscription: (subId, subscription) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          const normalizedSubscription = ensureSubscriptionRules(subscription, state.project);
          return {
            project: {
              ...state.project,
              eventModel: {
                ...state.project.eventModel,
                subscriptions: state.project.eventModel.subscriptions.map((s) =>
                  s.id === subId ? normalizedSubscription : s
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteSubscription: (subId) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          return {
            project: {
              ...state.project,
              eventModel: {
                ...state.project.eventModel,
                subscriptions: state.project.eventModel.subscriptions.filter((s) => s.id !== subId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      setEpcModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, epcModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },

      ensureEpcProfile: (aggregateId) => {
        const state = get();
        if (!state.project) {
          throw new Error('没有活动项目');
        }

        const profile = buildEpcProfile(state.project, aggregateId);

        set((currentState) => {
          if (!currentState.project) return currentState;

          const currentModel = currentState.project.epcModel || createEmptyEpcModel();
          const exists = currentModel.profiles.some((item) => item.aggregateId === aggregateId);
          const nextProfiles = exists
            ? currentModel.profiles.map((item) => (item.aggregateId === aggregateId ? profile : item))
            : [...currentModel.profiles, profile];

          return {
            project: {
              ...currentState.project,
              epcModel: {
                ...currentModel,
                profiles: nextProfiles,
                updatedAt: new Date().toISOString(),
                generatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });

        return profile;
      },

      regenerateEpcDocument: (aggregateId) => {
        set((state) => {
          if (!state.project) return state;

          const currentModel = state.project.epcModel || createEmptyEpcModel();
          const currentProfile = currentModel.profiles.find((profile) => profile.aggregateId === aggregateId) || buildEpcProfile(state.project, aggregateId);
          const nextProfile = rebuildEpcProfile(state.project, currentProfile);
          const exists = currentModel.profiles.some((profile) => profile.aggregateId === aggregateId);

          return {
            project: {
              ...state.project,
              epcModel: {
                ...currentModel,
                profiles: exists
                  ? currentModel.profiles.map((profile) => (profile.aggregateId === aggregateId ? nextProfile : profile))
                  : [...currentModel.profiles, nextProfile],
                updatedAt: new Date().toISOString(),
                generatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      // 元数据操作
      setMetadataList: (list) => {
        set({ metadataList: list });
      },
      
      addMetadata: (metadata) => {
        set((state) => ({
          metadataList: [...state.metadataList, metadata],
        }));
      },
      
      updateMetadata: (id, metadata) => {
        set((state) => ({
          metadataList: state.metadataList.map((m) =>
            m.id === id ? { ...metadata, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },
      
      deleteMetadata: (id) => {
        set((state) => ({
          metadataList: state.metadataList.filter((m) => m.id !== id),
        }));
      },
      
      findMetadataByName: (name) => {
        const state = get();
        return state.metadataList.find((m) => m.name === name);
      },
      
      findMetadataByNameEn: (nameEn) => {
        const state = get();
        return state.metadataList.find((m) => m.nameEn === nameEn);
      },
      
      // 主数据操作
      setMasterDataList: (list) => {
        set({ masterDataList: list });
      },

      setMasterDataRecords: (records) => {
        set({ masterDataRecords: records });
      },
      
      addMasterData: (masterData) => {
        set((state) => ({
          masterDataList: [...state.masterDataList, masterData],
        }));
      },
      
      updateMasterData: (id, masterData) => {
        set((state) => {
          const previous = state.masterDataList.find((item) => item.id === id);
          const nextList = state.masterDataList.map((item) => (item.id === id ? masterData : item));

          if (!previous || previous.fieldNames === masterData.fieldNames) {
            return { masterDataList: nextList };
          }

          try {
            const nextFields = parseFieldNames(masterData.fieldNames || '');
            const nextDefinitionRecords = (state.masterDataRecords[id] || []).map((record) =>
              normalizeMasterDataRecord(record, nextFields),
            );

            return {
              masterDataList: nextList,
              masterDataRecords: {
                ...state.masterDataRecords,
                [id]: nextDefinitionRecords,
              },
            };
          } catch {
            // 保留现有记录，避免因临时非法字段清单导致数据丢失
            return { masterDataList: nextList };
          }
        });
      },
      
      deleteMasterData: (id) => {
        set((state) => {
          const nextRecords = { ...state.masterDataRecords };
          delete nextRecords[id];
          return {
            masterDataList: state.masterDataList.filter((m) => m.id !== id),
            masterDataRecords: nextRecords,
          };
        });
      },

      addMasterDataRecord: (definitionId, record) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: [...(state.masterDataRecords[definitionId] || []), record],
          },
        }));
      },

      updateMasterDataRecord: (definitionId, recordId, updates) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).map((record) =>
              record.id === recordId
                ? {
                    ...record,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                  }
                : record
            ),
          },
        }));
      },

      deleteMasterDataRecord: (definitionId, recordId) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).filter((record) => record.id !== recordId),
          },
        }));
      },

      toggleMasterDataRecordStatus: (definitionId, recordId) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).map((record) =>
              record.id === recordId
                ? {
                    ...record,
                    status: record.status === '00' ? '99' : '00',
                    updatedAt: new Date().toISOString(),
                  }
                : record
            ),
          },
        }));
      },
      
      // UI状态
      setActiveModelType: (type) => {
        set({ activeModelType: type });
      },
      
      // 重置
      resetProject: () => {
        set({ project: null, activeModelType: null });
      },

      clearAllModels: () => {
        set((state) => {
          if (!state.project) return state;

          const now = new Date().toISOString();

          return {
            project: {
              ...state.project,
              dataModel: state.project.dataModel ? {
                ...state.project.dataModel,
                entities: [],
                updatedAt: now,
              } : null,
              behaviorModel: null,
              ruleModel: null,
              processModel: null,
              eventModel: null,
              epcModel: null,
              updatedAt: now,
            },
            activeModelType: null,
          };
        });
      },
      
      // 导入导出
      exportProject: () => {
        const state = get();
        return JSON.stringify(state.project, null, 2);
      },
      
      importProject: (json) => {
        try {
          const project = normalizeOntologyProject(JSON.parse(json) as OntologyProject);
          set({ project, activeModelType: 'data' });
        } catch (error) {
          console.error('导入项目失败:', error);
        }
      },
      
      // 版本管理操作 (M1)
      createVersion: (config) => {
        const state = get();
        if (!state.project) {
          throw new Error('没有活动项目');
        }
        
        const newVersion: ProjectVersion = {
          id: generateId(),
          projectId: state.project.id,
          version: config.version,
          name: config.name,
          description: config.description,
          metamodels: {
            data: state.project.dataModel ? JSON.parse(JSON.stringify(state.project.dataModel)) : null,
            behavior: state.project.behaviorModel ? JSON.parse(JSON.stringify(state.project.behaviorModel)) : null,
            rules: state.project.ruleModel ? JSON.parse(JSON.stringify(state.project.ruleModel)) : null,
            process: state.project.processModel ? JSON.parse(JSON.stringify(state.project.processModel)) : null,
            events: state.project.eventModel ? JSON.parse(JSON.stringify(state.project.eventModel)) : null,
            epc: state.project.epcModel ? JSON.parse(JSON.stringify(state.project.epcModel)) : null,
            masterData: {
              definitions: JSON.parse(JSON.stringify(state.masterDataList)),
              records: JSON.parse(JSON.stringify(state.masterDataRecords)),
            },
          },
          createdAt: new Date().toISOString(),
          status: 'draft',
        };
        
        set((s) => ({
          versions: [...s.versions, newVersion],
        }));
        
        return newVersion;
      },
      
      updateVersion: (versionId, updates) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId ? { ...v, ...updates } : v
          ),
        }));
      },
      
      deleteVersion: (versionId) => {
        set((state) => ({
          versions: state.versions.filter((v) => v.id !== versionId),
        }));
      },
      
      publishVersion: (versionId) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId
              ? { ...v, status: 'published' as const, publishedAt: new Date().toISOString() }
              : v
          ),
        }));
      },
      
      archiveVersion: (versionId) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId ? { ...v, status: 'archived' as const } : v
          ),
        }));
      },

      rollbackVersion: (versionId) => {
        const state = get();
        const targetVersion = state.versions.find((v) => v.id === versionId);
        
        if (!state.project) {
          throw new Error('没有活动项目');
        }
        if (!targetVersion) {
          throw new Error('版本不存在');
        }

        // Deep copy from metamodels to project
        set((state) => {
          if (!state.project) return state;

          return {
            project: {
              ...state.project,
              dataModel: targetVersion.metamodels.data ? JSON.parse(JSON.stringify(targetVersion.metamodels.data)) : null,
              behaviorModel: targetVersion.metamodels.behavior ? JSON.parse(JSON.stringify(targetVersion.metamodels.behavior)) : null,
              ruleModel: targetVersion.metamodels.rules ? JSON.parse(JSON.stringify(targetVersion.metamodels.rules)) : null,
              processModel: targetVersion.metamodels.process ? JSON.parse(JSON.stringify(targetVersion.metamodels.process)) : null,
              eventModel: targetVersion.metamodels.events ? JSON.parse(JSON.stringify(targetVersion.metamodels.events)) : null,
              epcModel: targetVersion.metamodels.epc ? JSON.parse(JSON.stringify(targetVersion.metamodels.epc)) : null,
              updatedAt: new Date().toISOString(),
            },
            masterDataList: targetVersion.metamodels.masterData ? JSON.parse(JSON.stringify(targetVersion.metamodels.masterData.definitions)) : [],
            masterDataRecords: targetVersion.metamodels.masterData ? JSON.parse(JSON.stringify(targetVersion.metamodels.masterData.records)) : {},
          };
        });
      },

      getVersionsByProject: (projectId) => {
        const state = get();
        return state.versions.filter((v) => v.projectId === projectId);
      },
      
      getLatestVersion: () => {
        const state = get();
        const projectVersions = state.versions.filter((v) => v.projectId === state.project?.id);
        if (projectVersions.length === 0) return null;
        return projectVersions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      },
      
      // 代码生成 (M2准备 - 占位)
      generateCodePackage: async (versionId, config) => {
        const state = get();
        const version = state.versions.find((v) => v.id === versionId);
        if (!version) {
          throw new Error('版本不存在');
        }
        
        // M2阶段实现完整代码生成
        // 目前返回版本JSON
        const packageData = {
          version: version.version,
          config,
          metamodels: version.metamodels,
          generatedAt: new Date().toISOString(),
        };
        
        return JSON.stringify(packageData, null, 2);
      },
    }),
    {
      name: 'ontology-storage',
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<OntologyState> | undefined;

        return {
          ...currentState,
          ...typedState,
          project: typedState?.project ? normalizeOntologyProject(typedState.project) : currentState.project,
        };
      },
    }
  )
);
