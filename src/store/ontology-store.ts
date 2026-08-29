'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEmptyEpcModel, ensureEpcProfile as buildEpcProfile, regenerateEpcProfile as rebuildEpcProfile } from '@/lib/epc-generator';
import { MAX_BUSINESS_SCENARIOS_PER_PROJECT } from '@/lib/business-scenario';
import { resolveEntityRole } from '@/lib/entity-role';
import { parseFieldNames } from '@/lib/masterdata/field-parser';
import { normalizeMasterDataRecord } from '@/lib/masterdata/record-factory';
import { normalizeEntity, normalizeOntologyProject } from '@/lib/ontology-normalizer';
import {
  createEmptyDataSourcesModel,
  createEmptyGovernanceModel,
  ensureDataSourcesModel,
  ensureGovernanceModel,
} from '@/lib/ontology-layer-defaults';
import {
  cancelModuleDraft as cancelModuleDraftRecord,
  confirmModule as confirmModuleRecord,
  forkConfirmedToDraft,
  getLatestConfirmed,
  getModuleDraft as getModuleDraftRecord,
  getModuleVersions as getModuleVersionList,
  resolveModuleRef as resolveModuleRefRecord,
  saveModuleDraft as saveModuleDraftRecord,
} from '@/lib/module-version';
import {
  applyModuleSnapshotToProject,
  runConfirmFlow,
  type ConfirmFlowFailure,
  type ConfirmFlowSuccess,
} from '@/lib/module-version/confirm-flow';
import {
  canDeleteBusinessChainNode,
  type BusinessChainNodeKind,
} from '@/lib/business-chain/tree';
import { resolveBusinessChainModuleStatus } from '@/lib/business-chain/module-status';
import { rebuildUsageIndex as rebuildUsageIndexFromProject } from '@/lib/epc-pipeline/rebuild-usage-index';
import { runSaveEpcPipeline } from '@/lib/epc-pipeline/save-epc';
import { migrateBusinessScenariosToChain } from '@/lib/migration/business-scenario-to-chain';
import { deriveEpcSteps, derivedStepsToEpcSteps, filterConfirmedMetaElements } from '@/lib/epc-derivation';
import type {
  OntologyProject,
  Domain,
  DataModel,
  BehaviorModel,
  RuleModel,
  ProcessModel,
  EventModel,
  Entity,
  EntityProject,
  BusinessScenario,
  StateMachine,
  Action,
  FunctionDefinition,
  Rule,
  EventDefinition,
  Subscription,
  EpcModel,
  EpcAggregateProfile,
  Metadata,
  MasterData,
  MasterDataRecord,
  ProjectVersion,
  PublishConfig,
  GovernanceModel,
  GovernanceRole,
  GovernanceFieldPermission,
  GovernanceAgentPolicy,
  DataSourcesModel,
  DataSourceDefinition,
  InterfaceDefinition,
  MetricsModel,
  BusinessMetric,
  TransactionBoundary,
  BehaviorIndicator,
  BehaviorConstraint,
  ConstraintDefinition,
  ExcelParsedData,
  AttributeDataType,
  Relation,
  Transition,
  EntityLifecycle,
  LifecycleAuditEntry,
  AgentSemanticLayer,
  Intent,
  BusinessTerm,
  SemanticRelation,
  ErrorRecovery,
  SemanticFieldMapping,
  AgentPolicy,
  Department,
  Position,
  PositionResponsibility,
  OrganizationModel,
  HRSyncConfig,
  HRSyncResult,
  DepartmentTreeNode,
  ReferenceDocument,
  ExtractedEntity,
  ExtractedAttribute,
  ModuleKind,
  ModuleVersionRecord,
  CrossModuleRef,
  ValueDomain,
  Capability,
  Scenario,
  SemanticsBlock,
  EpcProcess,
  ModuleStatus,
  ElementUsageRef,
  EpcStep,
  MetaElement,
} from '@/types/ontology';
import { filterUnreferencedElements } from '@/lib/element-library';
import {
  buildScenarioReferenceUnion,
  getChildEpcProcesses,
  type ScenarioReferenceUnionItem,
} from '@/lib/scenario-workspace';
import { computeCoverage, emptyCoverageReport, type EpcCoverageReport } from '@/lib/epc-coverage';
import { validateCrossConsistency, type CrossConsistencyIssue } from '@/lib/epc-cross-consistency';
import { lintBusinessEpc, type EpcWarning } from '@/lib/business-epc-linter';
import {
  mergeAiDraftSuggestion,
  type ModuleDraftSuggestion,
} from '@/lib/ai-draft';
import {
  applyEpcMetamodelDrafts,
  type EpcMetamodelDrafts,
} from '@/lib/business-chain/epc-metamodel-applier';
import { generateId } from '@/lib/id';

export type BusinessChainNodeRef = { kind: BusinessChainNodeKind; id: string };

export type BusinessChainNodeInput = {
  name: string;
  nameEn?: string;
  description?: string;
  semantics?: SemanticsBlock;
};

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
  addAction: (action: Action) => void;
  updateAction: (actionId: string, action: Action) => void;
  deleteAction: (actionId: string) => void;
  addFunction: (func: FunctionDefinition) => void;
  updateFunction: (funcId: string, func: FunctionDefinition) => void;
  deleteFunction: (funcId: string) => void;
  addBehaviorIndicator: (indicator: BehaviorIndicator) => void;
  updateBehaviorIndicator: (indicatorId: string, indicator: BehaviorIndicator) => void;
  deleteBehaviorIndicator: (indicatorId: string) => void;
  addBehaviorConstraint: (constraint: BehaviorConstraint) => void;
  updateBehaviorConstraint: (constraintId: string, constraint: BehaviorConstraint) => void;
  deleteBehaviorConstraint: (constraintId: string) => void;
  
  // 规则模型操作
  setRuleModel: (model: RuleModel) => void;
  addRule: (rule: Rule) => void;
  updateRule: (ruleId: string, rule: Rule) => void;
  deleteRule: (ruleId: string) => void;
  
  // ProcessModel 字段保留只读兼容；不再暴露编辑 API

  // 事件模型操作
  setEventModel: (model: EventModel) => void;
  addEventDefinition: (event: EventDefinition) => void;
  updateEventDefinition: (eventId: string, event: EventDefinition) => void;
  deleteEventDefinition: (eventId: string) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (subId: string, subscription: Subscription) => void;
  deleteSubscription: (subId: string) => void;

  // 治理层
  ensureGovernanceModel: () => GovernanceModel;
  setGovernanceModel: (model: GovernanceModel) => void;
  addGovernanceRole: (role: GovernanceRole) => void;
  updateGovernanceRole: (roleId: string, role: GovernanceRole) => void;
  deleteGovernanceRole: (roleId: string) => void;
  addFieldPermission: (permission: GovernanceFieldPermission) => void;
  updateFieldPermission: (index: number, permission: GovernanceFieldPermission) => void;
  deleteFieldPermission: (index: number) => void;
  addAgentPolicy: (policy: GovernanceAgentPolicy) => void;
  updateAgentPolicy: (policyId: string, policy: GovernanceAgentPolicy) => void;
  deleteAgentPolicy: (policyId: string) => void;

  // 数据源层
  ensureDataSourcesModel: () => DataSourcesModel;
  setDataSourcesModel: (model: DataSourcesModel) => void;
  addDataSource: (source: DataSourceDefinition) => void;
  updateDataSource: (sourceId: string, source: DataSourceDefinition) => void;
  deleteDataSource: (sourceId: string) => void;

  // 业务指标层 (B05)
  setMetricsModel: (model: MetricsModel | null) => void;
  addMetric: (metric: BusinessMetric) => void;
  updateMetric: (metricId: string, metric: Partial<BusinessMetric>) => void;
  deleteMetric: (metricId: string) => void;

  // 事务边界 (B06)
  addTransactionBoundary: (boundary: TransactionBoundary) => void;
  updateTransactionBoundary: (boundaryId: string, boundary: Partial<TransactionBoundary>) => void;
  deleteTransactionBoundary: (boundaryId: string) => void;

  // 约束层 (B07) — EPC 自动生成元模型
  addConstraint: (constraint: ConstraintDefinition) => void;
  updateConstraint: (constraintId: string, constraint: Partial<ConstraintDefinition>) => void;
  deleteConstraint: (constraintId: string) => void;

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
  createVersionFromParsedData: (config: { version: string; name: string; description?: string; parsedData: ExcelParsedData }) => ProjectVersion;
  updateVersion: (versionId: string, updates: Partial<ProjectVersion>) => void;
  deleteVersion: (versionId: string) => void;
  publishVersion: (versionId: string) => void;
  archiveVersion: (versionId: string) => void;
  rollbackVersion: (versionId: string) => void;
  getVersionsByProject: (projectId: string) => ProjectVersion[];
  getLatestVersion: () => ProjectVersion | null;

  // Excel 导入版本审核
  approveVersion: (versionId: string) => void;
  rejectVersion: (versionId: string, reason: string) => void;

  // Entity Lifecycle 审计
  auditTrail: LifecycleAuditEntry[];
  getEntityLifecycle: (entityId: string) => EntityLifecycle | null;
  addLifecycleAuditEntry: (entry: Omit<LifecycleAuditEntry, 'id'>) => void;
  getAuditTrail: (entityId: string) => LifecycleAuditEntry[];
  clearAuditTrail: (entityId: string) => void;

  // Agent Semantic Layer 操作
  setAgentSemanticLayer: (layer: AgentSemanticLayer) => void;
  addIntent: (intent: Intent) => void;
  updateIntent: (intentId: string, intent: Intent) => void;
  deleteIntent: (intentId: string) => void;
  addBusinessTerm: (term: BusinessTerm) => void;
  updateBusinessTerm: (termId: string, term: BusinessTerm) => void;
  deleteBusinessTerm: (termId: string) => void;
  addSemanticRelation: (relation: SemanticRelation) => void;
  updateSemanticRelation: (relationId: string, relation: SemanticRelation) => void;
  deleteSemanticRelation: (relationId: string) => void;
  addErrorRecovery: (recovery: ErrorRecovery) => void;
  updateErrorRecovery: (recoveryId: string, recovery: ErrorRecovery) => void;
  deleteErrorRecovery: (recoveryId: string) => void;
  addASAgentPolicy: (policy: AgentPolicy) => void;
  updateASAgentPolicy: (policyId: string, policy: AgentPolicy) => void;
  deleteASAgentPolicy: (policyId: string) => void;
  addFieldMapping: (mapping: SemanticFieldMapping) => void;
  updateFieldMapping: (mappingId: string, mapping: SemanticFieldMapping) => void;
  deleteFieldMapping: (mappingId: string) => void;
  getSemanticCoverage: () => AgentSemanticLayer['metadata']['coverage'] | null;

  // 组织体系操作
  setOrganizationModel: (model: OrganizationModel) => void;
  addDepartment: (department: Omit<Department, 'id'>) => Department;
  updateDepartment: (deptId: string, department: Partial<Department>) => void;
  deleteDepartment: (deptId: string) => void;
  addPosition: (position: Omit<Position, 'id'>) => Position;
  updatePosition: (positionId: string, position: Partial<Position>) => void;
  deletePosition: (positionId: string) => void;
  addPositionResponsibility: (positionId: string, resp: Omit<PositionResponsibility, 'id'>) => void;
  updatePositionResponsibility: (positionId: string, respId: string, resp: Partial<PositionResponsibility>) => void;
  deletePositionResponsibility: (positionId: string, respId: string) => void;
  detectResponsibilityOverlap: (positionId1: string, positionId2: string) => { field: string; value1: string; value2: string }[];
  updateHRSyncConfig: (config: HRSyncConfig) => void;
  setLastSyncResult: (result: HRSyncResult) => void;
  getDepartmentTree: () => DepartmentTreeNode[];
  getPositionsByDepartment: (deptId: string) => Position[];
  getPositionsByRole: (roleId: string) => Position[];

  // 参考文档管理
  addReferenceDocument: (doc: Omit<ReferenceDocument, 'id'>) => ReferenceDocument;
  removeReferenceDocument: (docId: string) => void;
  updateReferenceDocument: (docId: string, updates: Partial<ReferenceDocument>) => void;
  clearReferenceDocuments: () => void;

  // 简化架构 — 模块级版本 (US-S03)
  saveModuleDraft: (moduleKind: ModuleKind, moduleId: string, snapshot: unknown) => void;
  forkModuleToDraft: (moduleKind: ModuleKind, moduleId: string, snapshot: unknown) => void;
  confirmModule: (moduleKind: ModuleKind, moduleId: string) => ModuleVersionRecord;
  confirmModuleValidated: (
    moduleKind: ModuleKind,
    moduleId: string,
  ) => ConfirmFlowSuccess | ConfirmFlowFailure;
  cancelModuleDraft: (moduleKind: ModuleKind, moduleId: string) => void;
  getModuleVersions: (moduleKind: ModuleKind, moduleId: string) => ModuleVersionRecord[];
  resolveModuleRef: (ref: CrossModuleRef) => ModuleVersionRecord | null;

  // 简化架构 — 业务链 (US-S04)
  selectedBusinessChainNode: BusinessChainNodeRef | null;
  setSelectedBusinessChainNode: (node: BusinessChainNodeRef | null) => void;
  addValueDomain: (input: BusinessChainNodeInput) => ValueDomain;
  updateValueDomain: (id: string, updates: Partial<BusinessChainNodeInput>) => void;
  deleteValueDomain: (id: string) => void;
  addCapability: (parentAId: string, input: BusinessChainNodeInput) => Capability;
  updateCapability: (id: string, updates: Partial<BusinessChainNodeInput>) => void;
  deleteCapability: (id: string) => void;
  addScenario: (parentBId: string, input: BusinessChainNodeInput) => Scenario;
  updateScenario: (id: string, updates: Partial<BusinessChainNodeInput>) => void;
  deleteScenario: (id: string) => void;
  addEpcProcess: (parentCId: string, input: BusinessChainNodeInput & { autoGenerateMetamodels?: boolean }) => EpcProcess;
  updateEpcProcess: (id: string, updates: Partial<BusinessChainNodeInput>) => void;
  deleteEpcProcess: (id: string) => void;
  applyEpcMetamodelDrafts: (epcId: string, drafts: EpcMetamodelDrafts) => void;
  /** EPC 确认后，调用 AI 从步骤内容提取元数据生成 8 维元模型 */
  confirmEpcAndGenerateMetamodels: (epcId: string) => Promise<void>;
  getBusinessChainModuleStatus: (kind: BusinessChainNodeKind, moduleId: string) => ModuleStatus;

  // 简化架构 — EPC 流水线 (US-S05)
  saveEpc: (epcId: string, epcData: EpcProcess) => void;
  rebuildUsageIndex: () => void;
  getElementUsageRefs: (elementId: string) => ElementUsageRef[];
  getUnreferencedElements: () => MetaElement[];
  getScenarioChildEpcs: (scenarioId: string) => EpcProcess[];
  getScenarioReferenceUnion: (scenarioId: string) => ScenarioReferenceUnionItem[];
  getEpcCoverage: (scenarioId: string) => EpcCoverageReport;
  getCrossConsistency: (scenarioId: string) => CrossConsistencyIssue[];
  deriveEpcStepsFromScenario: (scenarioId: string) => import('@/lib/epc-derivation').DerivedEpcStep[];
  applyDerivedStepsToScenarioEpc: (
    scenarioId: string,
    targetEpcId?: string,
  ) => { ok: true; epcId: string; stepCount: number } | { ok: false; error: string };
  getBusinessEpcWarnings: () => EpcWarning[];

  // 简化架构 — AI draft 填充 (US-S11)
  applyAiModuleDraft: (
    moduleKind: BusinessChainNodeKind,
    moduleId: string,
    suggestion: ModuleDraftSuggestion,
  ) => void;

  // US-S11b-Task2: 应用 AI 生成的 EPC 步骤（带版 fork 逻辑）
  applyAiEpcDraft: (epcId: string, steps: EpcStep[]) => void;

  // US-S19-Task2 + C1': 批量应用 AI 要素（insert / draft 更新 / confirmed 跳过）
  applyAiElementDrafts: (
    elements: { name: string; dimension: string; nameEn?: string; description?: string }[],
  ) => {
    inserted: number;
    updated: number;
    skipped: { name: string; dimension: string; reason?: string }[];
  };

  // 简化架构 — legacy 迁移 (US-S12)
  migrateLegacyBusinessScenariosToChain: () => {
    migratedCount: number;
    skippedCount: number;
  };
  
  // UI状态
  setActiveModelType: (type: 'data' | 'behavior' | 'rule' | 'process' | 'event' | null) => void;

  // 重置
  resetProject: () => void;
  clearAllModels: () => void;
  
  // 导入导出
  exportProject: () => string;
  importProject: (json: string) => void;
  exportOntologyModel: () => string;
  
  // 代码生成 (M2准备)
  generateCodePackage: (versionId: string, config: PublishConfig) => Promise<string>;
}


function buildRuleCondition(conditionType: string, conditionValue?: string) {
  const condition: Rule['condition'] = { type: 'expression' };
  switch (conditionType) {
    case 'regex':
      condition.type = 'regex';
      condition.pattern = conditionValue;
      break;
    case 'range':
      condition.type = 'range';
      if (conditionValue) {
        const parts = conditionValue.split(/[,，]/).map(s => s.trim());
        if (parts[0]) condition.min = Number(parts[0]);
        if (parts[1]) condition.max = Number(parts[1]);
      }
      break;
    case 'expression':
      condition.type = 'expression';
      condition.expression = conditionValue;
      break;
    case 'reference_check':
      condition.type = 'reference_check';
      break;
    case 'sum_match':
      condition.type = 'sum_match';
      break;
    case 'deadline':
      condition.type = 'deadline';
      break;
    case 'custom':
      condition.type = 'custom';
      condition.customScript = conditionValue;
      break;
    default:
      condition.type = 'expression';
      condition.expression = conditionValue;
  }
  return condition;
}

function normalizeBusinessChainNodeInput(
  input: BusinessChainNodeInput,
): Pick<ValueDomain, 'name' | 'nameEn' | 'description' | 'semantics'> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('名称不能为空');
  }
  return {
    name,
    nameEn: input.nameEn?.trim() || undefined,
    description: input.description?.trim() || undefined,
    semantics: input.semantics,
  };
}

function businessChainSlicesFromProject(project: OntologyProject) {
  return {
    valueDomains: project.valueDomains,
    capabilities: project.capabilities,
    scenarios: project.scenarios,
    epcProcesses: project.epcProcesses,
  };
}

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
      selectedBusinessChainNode: null,
      metricsModel: null,
      auditTrail: [],
      
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
            governanceModel: createEmptyGovernanceModel(),
            dataSourcesModel: createEmptyDataSourcesModel(),
            moduleVersionRecords: [],
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

      // --- Behavior Model: Action & Methods ---

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

      addBehaviorIndicator: (indicator) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const model = state.project.behaviorModel;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...model,
                indicators: [...(model.indicators || []), indicator],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      updateBehaviorIndicator: (indicatorId, indicator) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const model = state.project.behaviorModel;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...model,
                indicators: (model.indicators || []).map((i) => (i.id === indicatorId ? indicator : i)),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      deleteBehaviorIndicator: (indicatorId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const model = state.project.behaviorModel;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...model,
                indicators: (model.indicators || []).filter((i) => i.id !== indicatorId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      addBehaviorConstraint: (constraint) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const model = state.project.behaviorModel;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...model,
                constraints: [...(model.constraints || []), constraint],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      updateBehaviorConstraint: (constraintId, constraint) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const model = state.project.behaviorModel;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...model,
                constraints: (model.constraints || []).map((c) => (c.id === constraintId ? constraint : c)),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      deleteBehaviorConstraint: (constraintId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const model = state.project.behaviorModel;
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...model,
                constraints: (model.constraints || []).filter((c) => c.id !== constraintId),
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
          const ruleWithDefaults = {
            ...normalizedRule,
            version: normalizedRule.version || '1.0.0',
            status: normalizedRule.status || 'active',
          };
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
                rules: [...currentModel.rules, ruleWithDefaults]
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
          const existingRule = state.project.ruleModel.rules.find((r) => r.id === ruleId);
          const mergedRule = {
            ...normalizedRule,
            version: rule.version !== undefined ? rule.version : (existingRule?.version ?? '1.0.0'),
            status: rule.status !== undefined ? rule.status : (existingRule?.status ?? 'active'),
          };
          return {
            project: {
              ...state.project,
              ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules
                  .map((r) => (r.id === ruleId ? mergedRule : r))
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

      // setProcessModel removed — ProcessModel 保留只读兼容

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

      ensureGovernanceModel: () => {
        const state = get();
        if (!state.project) {
          throw new Error('没有活动项目');
        }
        const model = ensureGovernanceModel(state.project.governanceModel);
        if (!state.project.governanceModel) {
          set({
            project: {
              ...state.project,
              governanceModel: model,
              updatedAt: new Date().toISOString(),
            },
          });
        }
        return model;
      },

      setGovernanceModel: (model) => {
        set((state) => ({
          project: state.project
            ? { ...state.project, governanceModel: model, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      addGovernanceRole: (role) => {
        set((state) => {
          if (!state.project) return state;
          const governance = ensureGovernanceModel(state.project.governanceModel);
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...governance,
                roles: [...governance.roles, role],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      updateGovernanceRole: (roleId, role) => {
        set((state) => {
          if (!state.project?.governanceModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...state.project.governanceModel,
                roles: state.project.governanceModel.roles.map((r) =>
                  r.id === roleId ? role : r
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteGovernanceRole: (roleId) => {
        set((state) => {
          if (!state.project?.governanceModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...state.project.governanceModel,
                roles: state.project.governanceModel.roles.filter((r) => r.id !== roleId),
                fieldPermissions: state.project.governanceModel.fieldPermissions.map((fp) => ({
                  ...fp,
                  allowedRoleIds: fp.allowedRoleIds.filter((id) => id !== roleId),
                })),
                agentPolicies: state.project.governanceModel.agentPolicies.filter(
                  (p) => p.roleId !== roleId
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      addFieldPermission: (permission) => {
        set((state) => {
          if (!state.project) return state;
          const governance = ensureGovernanceModel(state.project.governanceModel);
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...governance,
                fieldPermissions: [...governance.fieldPermissions, permission],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      updateFieldPermission: (index, permission) => {
        set((state) => {
          if (!state.project?.governanceModel) return state;
          const now = new Date().toISOString();
          const next = [...state.project.governanceModel.fieldPermissions];
          next[index] = permission;
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...state.project.governanceModel,
                fieldPermissions: next,
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteFieldPermission: (index) => {
        set((state) => {
          if (!state.project?.governanceModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...state.project.governanceModel,
                fieldPermissions: state.project.governanceModel.fieldPermissions.filter(
                  (_, i) => i !== index
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      addAgentPolicy: (policy) => {
        set((state) => {
          if (!state.project) return state;
          const governance = ensureGovernanceModel(state.project.governanceModel);
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...governance,
                agentPolicies: [...governance.agentPolicies, policy],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      updateAgentPolicy: (policyId, policy) => {
        set((state) => {
          if (!state.project?.governanceModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...state.project.governanceModel,
                agentPolicies: state.project.governanceModel.agentPolicies.map((p) =>
                  p.id === policyId ? policy : p
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteAgentPolicy: (policyId) => {
        set((state) => {
          if (!state.project?.governanceModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              governanceModel: {
                ...state.project.governanceModel,
                agentPolicies: state.project.governanceModel.agentPolicies.filter(
                  (p) => p.id !== policyId
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      ensureDataSourcesModel: () => {
        const state = get();
        if (!state.project) {
          throw new Error('没有活动项目');
        }
        const model = ensureDataSourcesModel(state.project.dataSourcesModel);
        if (!state.project.dataSourcesModel) {
          set({
            project: {
              ...state.project,
              dataSourcesModel: model,
              updatedAt: new Date().toISOString(),
            },
          });
        }
        return model;
      },

      setDataSourcesModel: (model) => {
        set((state) => ({
          project: state.project
            ? { ...state.project, dataSourcesModel: model, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      addDataSource: (source) => {
        set((state) => {
          if (!state.project) return state;
          const dataSources = ensureDataSourcesModel(state.project.dataSourcesModel);
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              dataSourcesModel: {
                ...dataSources,
                sources: [...dataSources.sources, source],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      updateDataSource: (sourceId, source) => {
        set((state) => {
          if (!state.project?.dataSourcesModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              dataSourcesModel: {
                ...state.project.dataSourcesModel,
                sources: state.project.dataSourcesModel.sources.map((s) =>
                  s.id === sourceId ? source : s
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteDataSource: (sourceId) => {
        set((state) => {
          if (!state.project?.dataSourcesModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              dataSourcesModel: {
                ...state.project.dataSourcesModel,
                sources: state.project.dataSourcesModel.sources.filter((s) => s.id !== sourceId),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      // 业务指标层操作 (B05)
      setMetricsModel: (model) => {
        set((state) => ({
          project: state.project
            ? { ...state.project, metricsModel: model, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      addMetric: (metric) => {
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          const currentModel = state.project.metricsModel || {
            id: generateId(),
            name: `${state.project.domain.name}指标模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            metrics: [],
            createdAt: now,
            updatedAt: now,
          };
          return {
            project: {
              ...state.project,
              metricsModel: {
                ...currentModel,
                metrics: [...currentModel.metrics, metric],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      updateMetric: (metricId, partialMetric) => {
        set((state) => {
          if (!state.project?.metricsModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              metricsModel: {
                ...state.project.metricsModel,
                metrics: state.project.metricsModel.metrics.map((m) =>
                  m.id === metricId ? { ...m, ...partialMetric } : m
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteMetric: (metricId) => {
        set((state) => {
          if (!state.project?.metricsModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              metricsModel: {
                ...state.project.metricsModel,
                metrics: state.project.metricsModel.metrics.filter((m) => m.id !== metricId),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      // 事务边界 (B06)
      addTransactionBoundary: (boundary) => {
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          const currentModel = state.project.behaviorModel || {
            id: generateId(),
            name: `${state.project.domain.name}行为模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            stateMachines: [],
            actions: [],
            functions: [],
            transactionBoundaries: [],
            createdAt: now,
            updatedAt: now,
          };
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...currentModel,
                transactionBoundaries: [...(currentModel.transactionBoundaries || []), boundary],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      updateTransactionBoundary: (boundaryId, partialBoundary) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                transactionBoundaries: (state.project.behaviorModel.transactionBoundaries || []).map((tb) =>
                  tb.id === boundaryId ? { ...tb, ...partialBoundary } : tb
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteTransactionBoundary: (boundaryId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              behaviorModel: {
                ...state.project.behaviorModel,
                transactionBoundaries: (state.project.behaviorModel.transactionBoundaries || []).filter(
                  (tb) => tb.id !== boundaryId
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      // 约束层 (B07)
      addConstraint: (constraint) => {
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          const nextConstraint = { ...constraint, id: constraint.id || generateId(), createdAt: constraint.createdAt || now, updatedAt: constraint.updatedAt || now };
          return {
            project: {
              ...state.project,
              constraints: [...(state.project.constraints || []), nextConstraint],
              updatedAt: now,
            },
          };
        });
      },

      updateConstraint: (constraintId, partialConstraint) => {
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              constraints: (state.project.constraints || []).map((c) =>
                c.id === constraintId ? { ...c, ...partialConstraint, updatedAt: now } : c
              ),
              updatedAt: now,
            },
          };
        });
      },

      deleteConstraint: (constraintId) => {
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              constraints: (state.project.constraints || []).filter((c) => c.id !== constraintId),
              updatedAt: now,
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
      
      // ========== Entity Lifecycle ==========

      getEntityLifecycle: (entityId) => {
        const { project } = get();
        if (!project) return null;

        const entity = project.dataModel?.entities.find((e) => e.id === entityId);
        if (!entity) return null;

        const stateMachine = project.behaviorModel?.stateMachines.find((sm) => sm.entity === entityId);
        if (!stateMachine) return null;

        const allActions = project.behaviorModel?.actions || [];
        const allRules = project.ruleModel?.rules || [];
        const allEvents = project.eventModel?.events || [];
        const allRoles = project.governanceModel?.roles || [];
        const { auditTrail } = get();

        const actionsByState: Record<string, Action[]> = {};
        const rulesByState: Record<string, Rule[]> = {};
        const eventsByState: Record<string, EventDefinition[]> = {};
        const rolesByState: Record<string, GovernanceRole[]> = {};

        for (const state of stateMachine.states) {
          actionsByState[state.id] = (state.availableActions || [])
            .map((aid) => allActions.find((a) => a.id === aid))
            .filter(Boolean) as Action[];

          rulesByState[state.id] = (state.constraints || [])
            .map((rid) => allRules.find((r) => r.id === rid))
            .filter(Boolean) as Rule[];

          eventsByState[state.id] = (state.triggerableEvents || [])
            .map((eid) => allEvents.find((e) => e.id === eid))
            .filter(Boolean) as EventDefinition[];

          rolesByState[state.id] = (state.allowedRoles || [])
            .map((rid) => allRoles.find((r) => r.id === rid))
            .filter(Boolean) as GovernanceRole[];
        }

        const entityAuditTrail = auditTrail.filter((entry) => entry.entityId === entityId);

        const bottleneckStates = stateMachine.states
          .filter((s) => s.timeout)
          .map((s) => s.id);

        return {
          entityId: entity.id,
          entityName: entity.name,
          entityNameEn: entity.nameEn,
          statusField: stateMachine.statusField,
          stateMachine: {
            id: stateMachine.id,
            name: stateMachine.name,
            states: stateMachine.states,
            transitions: stateMachine.transitions,
          },
          actionsByState,
          rulesByState,
          eventsByState,
          rolesByState,
          auditTrail: entityAuditTrail,
          stats: {
            totalStates: stateMachine.states.length,
            totalTransitions: stateMachine.transitions.length,
            totalActions: allActions.filter((a) => a.targetEntityId === entityId).length,
            bottleneckStates: bottleneckStates.length > 0 ? bottleneckStates : undefined,
          },
        };
      },

      addLifecycleAuditEntry: (entry) => {
        const newEntry: LifecycleAuditEntry = {
          ...entry,
          id: generateId(),
        };
        set((state) => ({
          auditTrail: [...state.auditTrail, newEntry],
        }));
      },

      getAuditTrail: (entityId) => {
        const { auditTrail } = get();
        return auditTrail.filter((entry) => entry.entityId === entityId);
      },

      clearAuditTrail: (entityId) => {
        set((state) => ({
          auditTrail: state.auditTrail.filter((entry) => entry.entityId !== entityId),
        }));
      },

      // ========== Agent Semantic Layer ==========

      setAgentSemanticLayer: (layer) => {
        set((state) => ({
          project: state.project
            ? { ...state.project, agentSemanticLayer: layer, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      addIntent: (intent) => {
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          const current = state.project.agentSemanticLayer || {
            intents: [],
            dialogContextTemplate: { ttl: 300, referencedEntities: [], turnCount: 0, state: 'idle' },
            semanticRelations: [],
            businessTerms: [],
            errorRecoveries: [],
            temporalValidities: [],
            fieldMappings: [],
            agentPolicies: [],
            metadata: { version: '1.0.0', lastUpdated: now, totalIntents: 0, totalTerms: 0, totalRelations: 0, coverage: { entitiesWithIntents: 0, totalEntities: 0, actionsWithRecovery: 0, totalActions: 0 } },
          };
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...current,
                intents: [...current.intents, intent],
                metadata: { ...current.metadata, totalIntents: current.intents.length + 1, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      updateIntent: (intentId, intent) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                intents: layer.intents.map((i) => (i.id === intentId ? intent : i)),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteIntent: (intentId) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          const nextIntents = layer.intents.filter((i) => i.id !== intentId);
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                intents: nextIntents,
                metadata: { ...layer.metadata, totalIntents: nextIntents.length, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      addBusinessTerm: (term) => {
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          const current = state.project.agentSemanticLayer;
          if (!current) return state;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...current,
                businessTerms: [...current.businessTerms, term],
                metadata: { ...current.metadata, totalTerms: current.businessTerms.length + 1, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      updateBusinessTerm: (termId, term) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                businessTerms: layer.businessTerms.map((t) => (t.id === termId ? term : t)),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteBusinessTerm: (termId) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          const nextTerms = layer.businessTerms.filter((t) => t.id !== termId);
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                businessTerms: nextTerms,
                metadata: { ...layer.metadata, totalTerms: nextTerms.length, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      addSemanticRelation: (relation) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                semanticRelations: [...layer.semanticRelations, relation],
                metadata: { ...layer.metadata, totalRelations: layer.semanticRelations.length + 1, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      updateSemanticRelation: (relationId, relation) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                semanticRelations: layer.semanticRelations.map((r) => (r.id === relationId ? relation : r)),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteSemanticRelation: (relationId) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          const nextRelations = layer.semanticRelations.filter((r) => r.id !== relationId);
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                semanticRelations: nextRelations,
                metadata: { ...layer.metadata, totalRelations: nextRelations.length, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      addErrorRecovery: (recovery) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                errorRecoveries: [...layer.errorRecoveries, recovery],
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      updateErrorRecovery: (recoveryId, recovery) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                errorRecoveries: layer.errorRecoveries.map((er) => (er.id === recoveryId ? recovery : er)),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteErrorRecovery: (recoveryId) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                errorRecoveries: layer.errorRecoveries.filter((er) => er.id !== recoveryId),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      addASAgentPolicy: (policy) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                agentPolicies: [...layer.agentPolicies, policy],
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      updateASAgentPolicy: (policyId, policy) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                agentPolicies: layer.agentPolicies.map((p) => (p.id === policyId ? policy : p)),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteASAgentPolicy: (policyId) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                agentPolicies: layer.agentPolicies.filter((p) => p.id !== policyId),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      addFieldMapping: (mapping) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                fieldMappings: [...layer.fieldMappings, mapping],
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      updateFieldMapping: (mappingId, mapping) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                fieldMappings: layer.fieldMappings.map((fm) => (fm.id === mappingId ? mapping : fm)),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteFieldMapping: (mappingId) => {
        set((state) => {
          if (!state.project?.agentSemanticLayer) return state;
          const now = new Date().toISOString();
          const layer = state.project.agentSemanticLayer;
          return {
            project: {
              ...state.project,
              agentSemanticLayer: {
                ...layer,
                fieldMappings: layer.fieldMappings.filter((fm) => fm.id !== mappingId),
                metadata: { ...layer.metadata, lastUpdated: now },
              },
              updatedAt: now,
            },
          };
        });
      },

      getSemanticCoverage: () => {
        const { project } = get();
        if (!project?.agentSemanticLayer) return null;
        const layer = project.agentSemanticLayer;
        const totalEntities = project.dataModel?.entities.length || 0;
        const totalActions = project.behaviorModel?.actions?.length || 0;
        const entitiesWithIntents = new Set(layer.intents.map((i) => i.targetEntityId)).size;
        const actionsWithRecovery = new Set(layer.errorRecoveries.map((er) => er.actionId)).size;
        return {
          entitiesWithIntents,
          totalEntities,
          actionsWithRecovery,
          totalActions,
        };
      },

      // ========== 组织体系 ==========

      setOrganizationModel: (model) => {
        set((state) => ({
          project: state.project
            ? { ...state.project, organizationModel: model, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      addDepartment: (department) => {
        const newDept: Department = { ...department, id: generateId() };
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          const current = state.project.organizationModel || {
            id: generateId(),
            departments: [],
            positions: [],
            createdAt: now,
            updatedAt: now,
          };
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...current,
                departments: [...current.departments, newDept],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
        return newDept;
      },

      updateDepartment: (deptId, department) => {
        set((state) => {
          if (!state.project?.organizationModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...state.project.organizationModel,
                departments: state.project.organizationModel.departments.map((d) =>
                  d.id === deptId ? { ...d, ...department } : d
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deleteDepartment: (deptId) => {
        set((state) => {
          if (!state.project?.organizationModel) return state;
          const now = new Date().toISOString();
          const org = state.project.organizationModel;
          // Also delete positions under this department
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...org,
                departments: org.departments.filter((d) => d.id !== deptId),
                positions: org.positions.filter((p) => p.departmentId !== deptId),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      addPosition: (position) => {
        const newPos: Position = { ...position, id: generateId() };
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          const current = state.project.organizationModel || {
            id: generateId(),
            departments: [],
            positions: [],
            createdAt: now,
            updatedAt: now,
          };
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...current,
                positions: [...current.positions, newPos],
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
        return newPos;
      },

      updatePosition: (positionId, position) => {
        set((state) => {
          if (!state.project?.organizationModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...state.project.organizationModel,
                positions: state.project.organizationModel.positions.map((p) =>
                  p.id === positionId ? { ...p, ...position } : p
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deletePosition: (positionId) => {
        set((state) => {
          if (!state.project?.organizationModel) return state;
          const now = new Date().toISOString();
          const org = state.project.organizationModel;
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...org,
                positions: org.positions.filter((p) => p.id !== positionId),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      addPositionResponsibility: (positionId, resp) => {
        const newResp: PositionResponsibility = { ...resp, id: generateId() };
        set((state) => {
          if (!state.project?.organizationModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...state.project.organizationModel,
                positions: state.project.organizationModel.positions.map((p) =>
                  p.id === positionId
                    ? { ...p, responsibilities: [...p.responsibilities, newResp] }
                    : p
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      updatePositionResponsibility: (positionId, respId, resp) => {
        set((state) => {
          if (!state.project?.organizationModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...state.project.organizationModel,
                positions: state.project.organizationModel.positions.map((p) =>
                  p.id === positionId
                    ? {
                        ...p,
                        responsibilities: p.responsibilities.map((r) =>
                          r.id === respId ? { ...r, ...resp } : r
                        ),
                      }
                    : p
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      deletePositionResponsibility: (positionId, respId) => {
        set((state) => {
          if (!state.project?.organizationModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...state.project.organizationModel,
                positions: state.project.organizationModel.positions.map((p) =>
                  p.id === positionId
                    ? { ...p, responsibilities: p.responsibilities.filter((r) => r.id !== respId) }
                    : p
                ),
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      detectResponsibilityOverlap: (positionId1, positionId2) => {
        const { project } = get();
        if (!project?.organizationModel) return [];
        const pos1 = project.organizationModel.positions.find((p) => p.id === positionId1);
        const pos2 = project.organizationModel.positions.find((p) => p.id === positionId2);
        if (!pos1 || !pos2) return [];

        const overlaps: { field: string; value1: string; value2: string }[] = [];

        // Check scopeRefs overlap
        const scope1 = new Set(pos1.responsibilities.flatMap((r) => r.scopeRefs));
        const scope2 = new Set(pos2.responsibilities.flatMap((r) => r.scopeRefs));
        for (const ref of scope1) {
          if (scope2.has(ref)) {
            overlaps.push({ field: 'scopeRefs', value1: ref, value2: ref });
          }
        }

        // Check actions overlap
        const actions1 = new Set(pos1.responsibilities.flatMap((r) => r.actions));
        const actions2 = new Set(pos2.responsibilities.flatMap((r) => r.actions));
        for (const action of actions1) {
          if (actions2.has(action)) {
            overlaps.push({ field: 'actions', value1: action, value2: action });
          }
        }

        return overlaps;
      },

      updateHRSyncConfig: (config) => {
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          const current = state.project.organizationModel || {
            id: generateId(),
            departments: [],
            positions: [],
            createdAt: now,
            updatedAt: now,
          };
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...current,
                syncConfig: config,
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      setLastSyncResult: (result) => {
        set((state) => {
          if (!state.project?.organizationModel) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              organizationModel: {
                ...state.project.organizationModel,
                lastSyncResult: result,
                updatedAt: now,
              },
              updatedAt: now,
            },
          };
        });
      },

      getDepartmentTree: () => {
        const { project } = get();
        if (!project?.organizationModel) return [];
        const { departments, positions } = project.organizationModel;

        const buildTree = (parentId?: string): DepartmentTreeNode[] => {
          return departments
            .filter((d) => d.parentId === parentId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((d) => ({
              department: d,
              children: buildTree(d.id),
              positions: positions.filter((p) => p.departmentId === d.id),
            }));
        };

        return buildTree(undefined);
      },

      getPositionsByDepartment: (deptId) => {
        const { project } = get();
        if (!project?.organizationModel) return [];
        return project.organizationModel.positions.filter((p) => p.departmentId === deptId);
      },

      getPositionsByRole: (roleId) => {
        const { project } = get();
        if (!project?.organizationModel) return [];
        return project.organizationModel.positions.filter((p) => p.roleIds.includes(roleId));
      },

      // 参考文档管理
      addReferenceDocument: (doc) => {
        const newDoc: ReferenceDocument = { ...doc, id: generateId() };
        set((state) => {
          if (!state.project) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              referenceDocuments: [...(state.project.referenceDocuments || []), newDoc],
              updatedAt: now,
            },
          };
        });
        return newDoc;
      },

      removeReferenceDocument: (docId) => {
        set((state) => {
          if (!state.project?.referenceDocuments) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              referenceDocuments: state.project.referenceDocuments.filter((d) => d.id !== docId),
              updatedAt: now,
            },
          };
        });
      },

      updateReferenceDocument: (docId, updates) => {
        set((state) => {
          if (!state.project?.referenceDocuments) return state;
          const now = new Date().toISOString();
          return {
            project: {
              ...state.project,
              referenceDocuments: state.project.referenceDocuments.map((d) =>
                d.id === docId ? { ...d, ...updates } : d
              ),
              updatedAt: now,
            },
          };
        });
      },

      clearReferenceDocuments: () => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: {
              ...state.project,
              referenceDocuments: [],
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      // UI状态
      setActiveModelType: (type) => {
        set({ activeModelType: type });
      },
      
      // 重置
      resetProject: () => {
        set({ project: null, activeModelType: null, selectedBusinessChainNode: null });
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
              governanceModel: createEmptyGovernanceModel(),
              dataSourcesModel: createEmptyDataSourcesModel(),
              organizationModel: null,
              agentSemanticLayer: null,
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
      
      exportOntologyModel: () => {
        const { project } = get();
        if (!project) return '{}';

        const entities = (project.dataModel?.entities ?? []).map((e) => ({
          id: e.id,
          name: e.name,
          nameEn: e.nameEn,
          description: e.description,
          attributes: (e.attributes ?? []).map((a) => ({
            name: a.name,
            nameEn: a.nameEn,
            type: a.dataType || 'string',
            required: a.required || false,
            description: a.description,
          })),
          relations: (e.relations ?? []).map((r) => ({
            target: r.targetEntity,
            type: r.type,
            name: r.name,
          })),
        }));

        const stateMachines = (project.behaviorModel?.stateMachines ?? []).map((sm) => ({
          id: sm.id,
          name: sm.name,
          entity: sm.entity,
          statusField: sm.statusField,
          states: (sm.states ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            isInitial: s.isInitial || false,
            isFinal: s.isFinal || false,
          })),
          transitions: (sm.transitions ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            from: t.from,
            to: t.to,
            trigger: t.trigger,
          })),
        }));

        const businessChain = {
          valueDomains: (project.valueDomains ?? []).map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn })),
          capabilities: (project.capabilities ?? []).map((c) => ({ id: c.id, name: c.name, nameEn: c.nameEn, parentId: c.parentId || '' })),
          scenarios: (project.scenarios ?? []).map((s) => ({ id: s.id, name: s.name, parentId: s.parentId || '' })),
          epcProcesses: (project.epcProcesses ?? []).map((e) => ({ id: e.id, name: e.name, parentId: e.parentId || '' })),
        };

        const rules = (project.ruleModel?.rules ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          entity: r.entity,
          field: r.field || '',
          condition: r.condition,
          severity: r.severity || 'warning',
        }));

        const governance = {
          roles: (project.governanceModel?.roles ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            permissions: r.permissions ?? [],
          })),
        };

        const model = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          project: {
            id: project.id,
            name: project.name,
            domain: project.domain?.name || '',
          },
          entities,
          stateMachines,
          businessChain,
          metrics: project.metricsModel?.metrics ?? [],
          rules,
          governance,
          dataSources: (project.dataSourcesModel?.sources ?? []).map((ds) => ({
            id: ds.id,
            name: ds.name,
            type: ds.type,
          })),
        };

        return JSON.stringify(model, null, 2);
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
      
      createVersionFromParsedData: (config) => {
        const state = get();
        if (!state.project) {
          throw new Error('没有活动项目');
        }

        const { parsedData } = config;
        const now = new Date().toISOString();

        // Collect project names and business scenarios from parsed data
        const projectNames = new Set<string>();
        const scenarioNames = new Set<string>();
        for (const e of parsedData.entities) {
          if (e.projectName) projectNames.add(e.projectName);
          if (e.businessScenario) scenarioNames.add(e.businessScenario);
        }

        // Build projects and scenarios from parsed data
        const projects: EntityProject[] = Array.from(projectNames).map(name => ({
          id: generateId(),
          name,
          description: '',
        }));
        const projectNameToId = new Map(projects.map(p => [p.name, p.id]));

        const businessScenarios: BusinessScenario[] = Array.from(scenarioNames).map(name => ({
          id: generateId(),
          name,
          nameEn: name,
          description: '',
          projectId: '',
        }));
        const scenarioNameToId = new Map(businessScenarios.map(s => [s.name, s.id]));

        // Build DataModel from parsed entities/attributes/relations
        const entityMap = new Map<string, string>(); // nameEn → id
        const entities: Entity[] = parsedData.entities.map(e => {
          const id = generateId();
          entityMap.set(e.nameEn, id);
          return {
            id,
            name: e.name,
            nameEn: e.nameEn,
            projectId: e.projectName ? (projectNameToId.get(e.projectName) || '') : '',
            businessScenarioId: e.businessScenario ? (scenarioNameToId.get(e.businessScenario) || '') : '',
            description: e.description,
            businessMeaning: e.businessMeaning,
            aliases: e.aliases,
            entityRole: e.role,
            parentAggregateId: e.parentAggregateId,
            attributes: [],
            relations: [],
            computedProperties: [],
            sourceMappings: [],
            domainEvents: [],
          };
        });

        // Assign attributes to entities
        for (const attr of parsedData.attributes) {
          const entityId = entityMap.get(attr.entityNameEn);
          if (!entityId) continue;
          const entity = entities.find(e => e.id === entityId);
          if (!entity) continue;
          entity.attributes.push({
            id: generateId(),
            name: attr.name,
            nameEn: attr.nameEn,
            dataType: attr.dataType as AttributeDataType,
            required: attr.required,
            unique: attr.unique,
            length: attr.length,
            precision: attr.precision,
            scale: attr.scale,
            default: attr.defaultValue,
            referencedEntityId: attr.referencedEntityNameEn ? entityMap.get(attr.referencedEntityNameEn) : undefined,
            referenceKind: attr.referenceType ? (attr.referenceType === 'one_to_one' || attr.referenceType === 'one_to_many' || attr.referenceType === 'many_to_many' ? 'entity' as const : undefined) : undefined,
            masterDataType: attr.masterDataType,
            enumRef: attr.enumRef,
            description: attr.description,
            businessMeaning: attr.businessMeaning,
            metadataTemplateName: attr.metadataTemplateName,
          });
        }

        // Assign relations to entities
        for (const rel of parsedData.relations) {
          const sourceId = entityMap.get(rel.sourceEntityNameEn);
          if (!sourceId) continue;
          const entity = entities.find(e => e.id === sourceId);
          if (!entity) continue;
          entity.relations.push({
            id: generateId(),
            name: rel.name,
            type: rel.type,
            targetEntity: entityMap.get(rel.targetEntityNameEn) || '',
            foreignKey: rel.foreignKey,
            viaEntity: rel.intermediateEntity,
            cascade: (rel.cascade === 'cascade' ? 'all' : rel.cascade === 'set_null' ? 'none' : 'none') as Relation['cascade'],
            isRecursive: rel.recursive,
            directionality: rel.directed ? 'directed' : 'undirected',
            description: rel.description,
          });
        }

        const dataModel: DataModel = {
          id: generateId(),
          name: state.project.dataModel?.name || '数据模型',
          version: '1.0.0',
          domain: state.project.domain?.name || '',
          projects,
          businessScenarios,
          entities,
          createdAt: now,
          updatedAt: now,
        };

        // Build BehaviorModel from parsed state machines
        const stateMachines: StateMachine[] = parsedData.stateMachines.map(sm => ({
          id: generateId(),
          name: sm.name,
          entity: entityMap.get(sm.entityNameEn) || sm.entityNameEn,
          statusField: sm.statusField,
          states: sm.states.map(s => ({
            id: generateId(),
            name: s.name,
            isInitial: s.isInitial,
            isFinal: s.isTerminal,
            color: s.isInitial ? '#22c55e' : s.isTerminal ? '#ef4444' : '#3b82f6',
          })),
          transitions: sm.transitions.map(t => ({
            id: generateId(),
            name: t.name,
            from: t.from,
            to: t.to,
            trigger: t.triggerType as Transition['trigger'],
          })),
        }));

        const behaviorModel: BehaviorModel = {
          id: generateId(),
          name: state.project.behaviorModel?.name || '行为模型',
          version: '1.0.0',
          domain: state.project.domain?.name || '',
          stateMachines,
          transactionBoundaries: (parsedData.boundaries || []).map(b => ({
            id: b.id || generateId(),
            name: b.name,
            nameEn: b.nameEn,
            actionIds: (b as unknown as TransactionBoundary).actionIds || [],
            aggregateRootIds: (b as unknown as TransactionBoundary).aggregateRootIds || [],
            isolation: ((b as unknown as TransactionBoundary).isolation) || 'read_committed',
            compensationActionId: (b as unknown as TransactionBoundary).compensationActionId,
          })),
          createdAt: now,
          updatedAt: now,
        };

        // Build RuleModel from parsed rules
        const rules: Rule[] = parsedData.rules.map(r => ({
          id: generateId(),
          name: r.name,
          type: r.type as Rule['type'],
          entity: entityMap.get(r.entityNameEn) || r.entityNameEn,
          field: r.field,
          priority: r.priority,
          condition: buildRuleCondition(r.conditionType, r.conditionValue),
          errorMessage: r.errorMessage,
          severity: r.severity,
          enabled: r.enabled,
          description: r.description,
        }));

        const ruleModel: RuleModel = {
          id: generateId(),
          name: state.project.ruleModel?.name || '规则模型',
          version: '1.0.0',
          domain: state.project.domain?.name || '',
          rules,
          createdAt: now,
          updatedAt: now,
        };

        // Build EventModel from parsed events
        const eventDefinitions: EventDefinition[] = parsedData.events.map(ev => ({
          id: generateId(),
          name: ev.name,
          nameEn: ev.nameEn,
          entity: entityMap.get(ev.entityNameEn) || ev.entityNameEn,
          trigger: ev.trigger,
          condition: ev.condition,
          payload: (ev.payloadFields || []).map(f => ({ field: f })),
          description: ev.description,
        }));

        const eventModel: EventModel = {
          id: generateId(),
          name: state.project.eventModel?.name || '事件模型',
          version: '1.0.0',
          domain: state.project.domain?.name || '',
          events: eventDefinitions,
          subscriptions: [],
          createdAt: now,
          updatedAt: now,
        };

        const metricsModel: MetricsModel = {
          id: generateId(),
          name: state.project.metricsModel?.name || '指标模型',
          version: '1.0.0',
          domain: state.project.domain?.name || '',
          metrics: (parsedData.metrics || []).map(m => ({
            id: m.id || generateId(),
            name: m.name,
            nameEn: m.nameEn,
            description: m.description,
            formula: m.formula,
            unit: m.unit || '',
            targetValue: m.targetValue,
            boundActionId: (m as unknown as BusinessMetric).boundActionId || '',
            measurementType: ((m as unknown as BusinessMetric).measurementType) || 'manual',
            dataSourceRef: m.dataSourceRef,
          })),
          createdAt: now,
          updatedAt: now,
        };

        const dataSourcesModel: DataSourcesModel = {
          id: generateId(),
          sources: (parsedData.dataSources || []).map(ds => ({
            id: ds.id || generateId(),
            name: ds.name,
            type: (ds.type as DataSourceDefinition['type']) || 'api',
            boundObjectTypeId: ds.boundObjectTypeId,
            api: ds.api
              ? {
                  baseUrl: ds.api.baseUrl,
                  entitySet: ds.api.entitySet,
                  authSecretRef: ds.api.authSecretRef || '',
                }
              : undefined,
            createdAt: now,
            updatedAt: now,
          })),
          createdAt: now,
          updatedAt: now,
        };

        const newVersion: ProjectVersion = {
          id: generateId(),
          projectId: state.project.id,
          version: config.version,
          name: config.name,
          description: config.description,
          metamodels: {
            data: dataModel,
            behavior: behaviorModel,
            rules: ruleModel,
            process: state.project.processModel ? JSON.parse(JSON.stringify(state.project.processModel)) : null,
            events: eventModel,
            epc: state.project.epcModel ? JSON.parse(JSON.stringify(state.project.epcModel)) : null,
            metrics: metricsModel,
            dataSources: dataSourcesModel,
            masterData: {
              definitions: JSON.parse(JSON.stringify(state.masterDataList)),
              records: JSON.parse(JSON.stringify(state.masterDataRecords)),
            },
          },
          createdAt: now,
          status: 'pending_review',
          source: 'excel_import',
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

          const restoredMasterData = targetVersion.metamodels.masterData
            ? {
                masterDataList: JSON.parse(JSON.stringify(targetVersion.metamodels.masterData.definitions)),
                masterDataRecords: JSON.parse(JSON.stringify(targetVersion.metamodels.masterData.records)),
              }
            : {};

          return {
            project: {
              ...state.project,
              dataModel: targetVersion.metamodels.data ? JSON.parse(JSON.stringify(targetVersion.metamodels.data)) : null,
              behaviorModel: targetVersion.metamodels.behavior ? JSON.parse(JSON.stringify(targetVersion.metamodels.behavior)) : null,
              ruleModel: targetVersion.metamodels.rules ? JSON.parse(JSON.stringify(targetVersion.metamodels.rules)) : null,
              processModel: targetVersion.metamodels.process ? JSON.parse(JSON.stringify(targetVersion.metamodels.process)) : null,
              eventModel: targetVersion.metamodels.events ? JSON.parse(JSON.stringify(targetVersion.metamodels.events)) : null,
              epcModel: targetVersion.metamodels.epc ? JSON.parse(JSON.stringify(targetVersion.metamodels.epc)) : null,
              metricsModel: targetVersion.metamodels.metrics ? JSON.parse(JSON.stringify(targetVersion.metamodels.metrics)) : state.project.metricsModel,
              dataSourcesModel: targetVersion.metamodels.dataSources ? JSON.parse(JSON.stringify(targetVersion.metamodels.dataSources)) : state.project.dataSourcesModel,
              updatedAt: new Date().toISOString(),
            },
            ...restoredMasterData,
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

      approveVersion: (versionId) => {
        const state = get();
        const version = state.versions.find((v) => v.id === versionId);
        if (!version || version.status !== 'pending_review') return;

        // 将版本数据应用到工作区
        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === versionId
              ? { ...v, status: 'published' as const, publishedAt: new Date().toISOString() }
              : v
          ),
          project: s.project
            ? {
                ...s.project,
                dataModel: version.metamodels.data ? JSON.parse(JSON.stringify(version.metamodels.data)) : s.project.dataModel,
                behaviorModel: version.metamodels.behavior ? JSON.parse(JSON.stringify(version.metamodels.behavior)) : s.project.behaviorModel,
                ruleModel: version.metamodels.rules ? JSON.parse(JSON.stringify(version.metamodels.rules)) : s.project.ruleModel,
                processModel: version.metamodels.process ? JSON.parse(JSON.stringify(version.metamodels.process)) : s.project.processModel,
                eventModel: version.metamodels.events ? JSON.parse(JSON.stringify(version.metamodels.events)) : s.project.eventModel,
                epcModel: version.metamodels.epc ? JSON.parse(JSON.stringify(version.metamodels.epc)) : s.project.epcModel,
                metricsModel: version.metamodels.metrics ? JSON.parse(JSON.stringify(version.metamodels.metrics)) : s.project.metricsModel,
                dataSourcesModel: version.metamodels.dataSources ? JSON.parse(JSON.stringify(version.metamodels.dataSources)) : s.project.dataSourcesModel,
              }
            : s.project,
          masterDataList: version.metamodels.masterData ? JSON.parse(JSON.stringify(version.metamodels.masterData.definitions)) : s.masterDataList,
          masterDataRecords: version.metamodels.masterData ? JSON.parse(JSON.stringify(version.metamodels.masterData.records)) : s.masterDataRecords,
        }));
      },

      rejectVersion: (versionId, reason) => {
        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === versionId
              ? { ...v, status: 'rejected' as const, rejectionReason: reason, updatedAt: new Date().toISOString() }
              : v
          ),
        }));
      },

      saveModuleDraft: (moduleKind, moduleId, snapshot) => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const records = state.project.moduleVersionRecords ?? [];
          const next = saveModuleDraftRecord(records, {
            moduleKind,
            moduleId,
            snapshot,
            recordId: generateId(),
          });
          return {
            project: {
              ...state.project,
              moduleVersionRecords: next,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      forkModuleToDraft: (moduleKind, moduleId, snapshot) => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const records = state.project.moduleVersionRecords ?? [];
          const next = forkConfirmedToDraft(records, {
            moduleKind,
            moduleId,
            snapshot,
            recordId: generateId(),
          });
          return {
            project: {
              ...state.project,
              moduleVersionRecords: next,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      confirmModule: (moduleKind, moduleId) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const records = state.project.moduleVersionRecords ?? [];
        const next = confirmModuleRecord(records, moduleKind, moduleId);
        const confirmed = getLatestConfirmed(next, moduleKind, moduleId);
        if (!confirmed) {
          throw new Error('确认失败');
        }
        set({
          project: {
            ...state.project,
            moduleVersionRecords: next,
            updatedAt: new Date().toISOString(),
          },
        });
        return confirmed;
      },

      confirmModuleValidated: (moduleKind, moduleId) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const result = runConfirmFlow(state.project, moduleKind, moduleId);
        if (!result.ok) {
          return result;
        }
        set({
          project: {
            ...state.project,
            moduleVersionRecords: result.moduleVersionRecords,
            updatedAt: new Date().toISOString(),
          },
        });
        return result;
      },

      cancelModuleDraft: (moduleKind, moduleId) => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const records = state.project.moduleVersionRecords ?? [];
          const confirmed = getLatestConfirmed(records, moduleKind, moduleId);
          const nextRecords = cancelModuleDraftRecord(records, moduleKind, moduleId);
          const baseProject: OntologyProject = {
            ...state.project,
            moduleVersionRecords: nextRecords,
            updatedAt: new Date().toISOString(),
          };
          const project =
            confirmed?.snapshot != null
              ? applyModuleSnapshotToProject(baseProject, moduleKind, moduleId, confirmed.snapshot)
              : baseProject;
          return { project };
        });
      },

      getModuleVersions: (moduleKind, moduleId) => {
        const records = get().project?.moduleVersionRecords ?? [];
        return getModuleVersionList(records, moduleKind, moduleId);
      },

      resolveModuleRef: (ref) => {
        const records = get().project?.moduleVersionRecords ?? [];
        return resolveModuleRefRecord(records, ref);
      },

      setSelectedBusinessChainNode: (node) => {
        set({ selectedBusinessChainNode: node });
      },

      addValueDomain: (input) => {
        const fields = normalizeBusinessChainNodeInput(input);
        const node: ValueDomain = { id: generateId(), ...fields };
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const valueDomains = [...(state.project.valueDomains ?? []), node];
          const records = saveModuleDraftRecord(state.project.moduleVersionRecords ?? [], {
            moduleKind: 'A',
            moduleId: node.id,
            snapshot: node,
            recordId: generateId(),
          });
          return {
            project: {
              ...state.project,
              valueDomains,
              moduleVersionRecords: records,
              updatedAt: new Date().toISOString(),
            },
          };
        });
        return node;
      },

      updateValueDomain: (id, updates) => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const valueDomains = state.project.valueDomains ?? [];
          const index = valueDomains.findIndex((item) => item.id === id);
          if (index < 0) throw new Error('业务价值域不存在');
          const current = valueDomains[index];
          const nextNode: ValueDomain = {
            ...current,
            ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
            ...(updates.nameEn !== undefined ? { nameEn: updates.nameEn.trim() || undefined } : {}),
            ...(updates.description !== undefined ? { description: updates.description.trim() || undefined } : {}),
          };
          if (!nextNode.name.trim()) throw new Error('名称不能为空');
          const nextDomains = valueDomains.slice();
          nextDomains[index] = nextNode;
          const records = saveModuleDraftRecord(state.project.moduleVersionRecords ?? [], {
            moduleKind: 'A',
            moduleId: id,
            snapshot: nextNode,
            recordId: generateId(),
          });
          return {
            project: {
              ...state.project,
              valueDomains: nextDomains,
              moduleVersionRecords: records,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      deleteValueDomain: (id) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        if (!canDeleteBusinessChainNode(businessChainSlicesFromProject(state.project), 'A', id)) {
          throw new Error('存在子节点，无法删除');
        }
        set({
          project: {
            ...state.project,
            valueDomains: (state.project.valueDomains ?? []).filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedBusinessChainNode:
            state.selectedBusinessChainNode?.kind === 'A' && state.selectedBusinessChainNode.id === id
              ? null
              : state.selectedBusinessChainNode,
        });
      },

      addCapability: (parentAId, input) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        if (!(state.project.valueDomains ?? []).some((item) => item.id === parentAId)) {
          throw new Error('父级业务价值域不存在');
        }
        const fields = normalizeBusinessChainNodeInput(input);
        const node: Capability = { id: generateId(), parentId: parentAId, ...fields };
        set((s) => {
          if (!s.project) throw new Error('没有活动项目');
          const capabilities = [...(s.project.capabilities ?? []), node];
          const records = saveModuleDraftRecord(s.project.moduleVersionRecords ?? [], {
            moduleKind: 'B',
            moduleId: node.id,
            snapshot: node,
            recordId: generateId(),
          });
          return {
            project: {
              ...s.project,
              capabilities,
              moduleVersionRecords: records,
              updatedAt: new Date().toISOString(),
            },
          };
        });
        return node;
      },

      updateCapability: (id, updates) => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const capabilities = state.project.capabilities ?? [];
          const index = capabilities.findIndex((item) => item.id === id);
          if (index < 0) throw new Error('业务能力不存在');
          const current = capabilities[index];
          const nextNode: Capability = {
            ...current,
            ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
            ...(updates.nameEn !== undefined ? { nameEn: updates.nameEn.trim() || undefined } : {}),
            ...(updates.description !== undefined ? { description: updates.description.trim() || undefined } : {}),
          };
          if (!nextNode.name.trim()) throw new Error('名称不能为空');
          const nextList = capabilities.slice();
          nextList[index] = nextNode;
          const records = saveModuleDraftRecord(state.project.moduleVersionRecords ?? [], {
            moduleKind: 'B',
            moduleId: id,
            snapshot: nextNode,
            recordId: generateId(),
          });
          return {
            project: {
              ...state.project,
              capabilities: nextList,
              moduleVersionRecords: records,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      deleteCapability: (id) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        if (!canDeleteBusinessChainNode(businessChainSlicesFromProject(state.project), 'B', id)) {
          throw new Error('存在子节点，无法删除');
        }
        set({
          project: {
            ...state.project,
            capabilities: (state.project.capabilities ?? []).filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedBusinessChainNode:
            state.selectedBusinessChainNode?.kind === 'B' && state.selectedBusinessChainNode.id === id
              ? null
              : state.selectedBusinessChainNode,
        });
      },

      addScenario: (parentBId, input) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        if (!(state.project.capabilities ?? []).some((item) => item.id === parentBId)) {
          throw new Error('父级业务能力不存在');
        }
        const fields = normalizeBusinessChainNodeInput(input);
        const node: Scenario = { id: generateId(), parentId: parentBId, ...fields };
        set((s) => {
          if (!s.project) throw new Error('没有活动项目');
          const scenarios = [...(s.project.scenarios ?? []), node];
          const records = saveModuleDraftRecord(s.project.moduleVersionRecords ?? [], {
            moduleKind: 'C',
            moduleId: node.id,
            snapshot: node,
            recordId: generateId(),
          });
          return {
            project: {
              ...s.project,
              scenarios,
              moduleVersionRecords: records,
              updatedAt: new Date().toISOString(),
            },
          };
        });
        return node;
      },

      updateScenario: (id, updates) => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const scenarios = state.project.scenarios ?? [];
          const index = scenarios.findIndex((item) => item.id === id);
          if (index < 0) throw new Error('业务场景不存在');
          const current = scenarios[index];
          const nextNode: Scenario = {
            ...current,
            ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
            ...(updates.nameEn !== undefined ? { nameEn: updates.nameEn.trim() || undefined } : {}),
            ...(updates.description !== undefined ? { description: updates.description.trim() || undefined } : {}),
          };
          if (!nextNode.name.trim()) throw new Error('名称不能为空');
          const nextList = scenarios.slice();
          nextList[index] = nextNode;
          const records = saveModuleDraftRecord(state.project.moduleVersionRecords ?? [], {
            moduleKind: 'C',
            moduleId: id,
            snapshot: nextNode,
            recordId: generateId(),
          });
          return {
            project: {
              ...state.project,
              scenarios: nextList,
              moduleVersionRecords: records,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      deleteScenario: (id) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        if (!canDeleteBusinessChainNode(businessChainSlicesFromProject(state.project), 'C', id)) {
          throw new Error('存在子节点，无法删除');
        }
        set({
          project: {
            ...state.project,
            scenarios: (state.project.scenarios ?? []).filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedBusinessChainNode:
            state.selectedBusinessChainNode?.kind === 'C' && state.selectedBusinessChainNode.id === id
              ? null
              : state.selectedBusinessChainNode,
        });
      },

      addEpcProcess: (parentCId, input) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        if (!(state.project.scenarios ?? []).some((item) => item.id === parentCId)) {
          throw new Error('父级业务场景不存在');
        }
        const fields = normalizeBusinessChainNodeInput(input);
        const node: EpcProcess = {
          id: generateId(),
          parentId: parentCId,
          steps: [],
          ...fields,
          autoGenerateMetamodels: input.autoGenerateMetamodels ?? false,
        };
        set((s) => {
          if (!s.project) throw new Error('没有活动项目');
          const epcProcesses = [...(s.project.epcProcesses ?? []), node];
          const records = saveModuleDraftRecord(s.project.moduleVersionRecords ?? [], {
            moduleKind: 'EPC',
            moduleId: node.id,
            snapshot: node,
            recordId: generateId(),
          });
          return {
            project: {
              ...s.project,
              epcProcesses,
              moduleVersionRecords: records,
              updatedAt: new Date().toISOString(),
            },
          };
        });
        return node;
      },

      applyEpcMetamodelDrafts: (epcId, drafts) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const updatedProject = applyEpcMetamodelDrafts(state.project, epcId, drafts).project;
        set((s) => {
          if (!s.project) throw new Error('没有活动项目');
          return {
            project: {
              ...updatedProject,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      confirmEpcAndGenerateMetamodels: async (epcId) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const project = state.project;

        const res = await fetch('/api/epc-processes/auto-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project, epcId, trigger: 'confirm' }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'AI 元模型生成失败');
        }

        const data = await res.json();
        if (!data.success || !data.data) {
          throw new Error(data.error || 'AI 元模型生成失败');
        }

        set((s) => {
          if (!s.project) throw new Error('没有活动项目');
          return {
            project: {
              ...data.data,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      updateEpcProcess: (id, updates) => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const epcProcesses = state.project.epcProcesses ?? [];
          const index = epcProcesses.findIndex((item) => item.id === id);
          if (index < 0) throw new Error('EPC 流程不存在');
          const current = epcProcesses[index];
          const nextNode: EpcProcess = {
            ...current,
            ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
            ...(updates.nameEn !== undefined ? { nameEn: updates.nameEn.trim() || undefined } : {}),
            ...(updates.description !== undefined ? { description: updates.description.trim() || undefined } : {}),
          };
          if (!nextNode.name.trim()) throw new Error('名称不能为空');
          const nextList = epcProcesses.slice();
          nextList[index] = nextNode;
          const records = saveModuleDraftRecord(state.project.moduleVersionRecords ?? [], {
            moduleKind: 'EPC',
            moduleId: id,
            snapshot: nextNode,
            recordId: generateId(),
          });
          return {
            project: {
              ...state.project,
              epcProcesses: nextList,
              moduleVersionRecords: records,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      deleteEpcProcess: (id) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        set({
          project: {
            ...state.project,
            epcProcesses: (state.project.epcProcesses ?? []).filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedBusinessChainNode:
            state.selectedBusinessChainNode?.kind === 'EPC' && state.selectedBusinessChainNode.id === id
              ? null
              : state.selectedBusinessChainNode,
        });
      },

      getBusinessChainModuleStatus: (kind, moduleId) => {
        const records = get().project?.moduleVersionRecords ?? [];
        return resolveBusinessChainModuleStatus(records, kind, moduleId);
      },

      saveEpc: (epcId, epcData) => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          let moduleVersionRecords = state.project.moduleVersionRecords ?? [];

          const result = runSaveEpcPipeline({
            epcProcesses: state.project.epcProcesses,
            metaElements: state.project.metaElements,
            epc: { ...epcData, id: epcId },
            generateId,
            onElementDraft: (dimension, elementId, snapshot) => {
              moduleVersionRecords = saveModuleDraftRecord(moduleVersionRecords, {
                moduleKind: dimension,
                moduleId: elementId,
                snapshot,
                recordId: generateId(),
              });
            },
            onEpcDraft: (id, snapshot) => {
              moduleVersionRecords = saveModuleDraftRecord(moduleVersionRecords, {
                moduleKind: 'EPC',
                moduleId: id,
                snapshot,
                recordId: generateId(),
              });
            },
          });

          return {
            project: {
              ...state.project,
              epcProcesses: result.epcProcesses,
              metaElements: result.metaElements,
              moduleVersionRecords,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      rebuildUsageIndex: () => {
        set((state) => {
          if (!state.project) throw new Error('没有活动项目');
          const metaElements = rebuildUsageIndexFromProject({
            epcProcesses: state.project.epcProcesses,
            metaElements: state.project.metaElements,
          });
          return {
            project: {
              ...state.project,
              metaElements,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      getElementUsageRefs: (elementId) => {
        const meta = get().project?.metaElements?.find((item) => item.id === elementId);
        return meta?.usageRefs ?? [];
      },

      getUnreferencedElements: () => {
        const elements = get().project?.metaElements ?? [];
        return filterUnreferencedElements(elements, true);
      },

      getScenarioChildEpcs: (scenarioId) => {
        return getChildEpcProcesses(scenarioId, get().project?.epcProcesses);
      },

      getScenarioReferenceUnion: (scenarioId) => {
        const project = get().project;
        return buildScenarioReferenceUnion(
          scenarioId,
          project?.epcProcesses,
          project?.metaElements,
        );
      },

      getEpcCoverage: (scenarioId) => {
        const project = get().project;
        if (!project) return emptyCoverageReport(scenarioId);
        return computeCoverage({
          scenarioId,
          scenarios: project.scenarios ?? [],
          epcProcesses: project.epcProcesses ?? [],
          metaElements: project.metaElements ?? [],
          moduleVersionRecords: project.moduleVersionRecords ?? [],
        });
      },

      getCrossConsistency: (scenarioId) => {
        const project = get().project;
        if (!project) return [];
        return validateCrossConsistency({
          scenarioId,
          scenarios: project.scenarios ?? [],
          capabilities: project.capabilities ?? [],
          valueDomains: project.valueDomains ?? [],
          epcProcesses: project.epcProcesses ?? [],
          metaElements: project.metaElements ?? [],
          moduleVersionRecords: project.moduleVersionRecords ?? [],
          behaviorModel: project.behaviorModel ?? null,
          eventModel: project.eventModel ?? null,
          ruleModel: project.ruleModel ?? null,
          metricsModel: project.metricsModel ?? null,
          dataSourcesModel: project.dataSourcesModel ?? null,
          governanceModel: project.governanceModel ?? null,
        });
      },

      deriveEpcStepsFromScenario: (scenarioId) => {
        const project = get().project;
        if (!project) return [];
        if (!getLatestConfirmed(project.moduleVersionRecords ?? [], 'C', scenarioId)) return [];
        const confirmed = filterConfirmedMetaElements(
          project.metaElements ?? [],
          project.moduleVersionRecords ?? [],
        );
        return deriveEpcSteps({ metaElements: confirmed });
      },

      applyDerivedStepsToScenarioEpc: (scenarioId, targetEpcId) => {
        const state = get();
        if (!state.project) return { ok: false, error: '没有活动项目' };

        const derived = get().deriveEpcStepsFromScenario(scenarioId);
        if (derived.length === 0) {
          return { ok: false, error: '无可推导步骤，请先确认八维要素' };
        }

        const childEpcs = get().getScenarioChildEpcs(scenarioId);
        let epc = targetEpcId
          ? state.project.epcProcesses?.find((e) => e.id === targetEpcId)
          : childEpcs[0];

        if (!epc) {
          epc = get().addEpcProcess(scenarioId, { name: '推导流程' });
        }

        const steps = derivedStepsToEpcSteps(derived, generateId);
        get().saveEpc(epc.id, { ...epc, steps });
        return { ok: true, epcId: epc.id, stepCount: steps.length };
      },

      getBusinessEpcWarnings: () => {
        const project = get().project;
        if (!project) return [];
        return lintBusinessEpc({
          moduleVersionRecords: project.moduleVersionRecords ?? [],
          scenarios: project.scenarios,
          epcProcesses: project.epcProcesses,
          metaElements: project.metaElements,
        });
      },

      applyAiModuleDraft: (moduleKind, moduleId, suggestion) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');

        const findNode = () => {
          if (moduleKind === 'A') {
            return state.project!.valueDomains?.find((item) => item.id === moduleId);
          }
          if (moduleKind === 'B') {
            return state.project!.capabilities?.find((item) => item.id === moduleId);
          }
          if (moduleKind === 'C') {
            return state.project!.scenarios?.find((item) => item.id === moduleId);
          }
          return state.project!.epcProcesses?.find((item) => item.id === moduleId);
        };

        const current = findNode();
        if (!current) throw new Error('模块不存在');

        const merged = mergeAiDraftSuggestion(current, suggestion, moduleKind);

        if (moduleKind === 'EPC') {
          get().saveEpc(moduleId, merged as EpcProcess);
          return;
        }

        const updates = {
          name: merged.name,
          nameEn: merged.nameEn,
          description: merged.description,
          semantics: merged.semantics,
        };

        if (moduleKind === 'A') get().updateValueDomain(moduleId, updates);
        else if (moduleKind === 'B') get().updateCapability(moduleId, updates);
        else get().updateScenario(moduleId, updates);
      },

      // US-S11b-Task2: 应用 AI 生成的 EPC 步骤
      applyAiEpcDraft: (epcId, steps) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');

        const epcIndex = (state.project.epcProcesses ?? []).findIndex(
          (e) => e.id === epcId,
        );
        if (epcIndex < 0) throw new Error('EPC 流程不存在');

        let moduleVersionRecords = state.project.moduleVersionRecords ?? [];
        const confirmed = getLatestConfirmed(moduleVersionRecords, 'EPC', epcId);
        const draft = getModuleDraftRecord(moduleVersionRecords, 'EPC', epcId);

        // 构建带新 steps 的 EPC 数据
        const currentEpc = state.project.epcProcesses?.[epcIndex];
        if (!currentEpc) return state;
        const nextEpc: EpcProcess = { ...currentEpc, steps };

        // fork 规则（三选一）
        if (confirmed) {
          // 1. 有 confirmed 版本 → 从 confirmed fork 出新 draft，覆盖其 steps
          moduleVersionRecords = forkConfirmedToDraft(moduleVersionRecords, {
            moduleKind: 'EPC',
            moduleId: epcId,
            snapshot: nextEpc,
            recordId: generateId(),
          });
        } else if (draft) {
          // 2. 无 confirmed 但有 draft → 全量覆盖当前 draft 的 steps
          moduleVersionRecords = saveModuleDraftRecord(moduleVersionRecords, {
            moduleKind: 'EPC',
            moduleId: epcId,
            snapshot: nextEpc,
            recordId: generateId(),
          });
        } else {
          // 3. 无任何版本 → 创建新 draft
          moduleVersionRecords = saveModuleDraftRecord(moduleVersionRecords, {
            moduleKind: 'EPC',
            moduleId: epcId,
            snapshot: nextEpc,
            recordId: generateId(),
          });
        }

        // 更新 project 中的 EPC 数据
        const nextEpcProcesses = [...(state.project.epcProcesses ?? [])];
        nextEpcProcesses[epcIndex] = nextEpc;

        set({
          project: {
            ...state.project,
            epcProcesses: nextEpcProcesses,
            moduleVersionRecords,
            updatedAt: new Date().toISOString(),
          },
        });

        // 重建反向索引（不触发 confirm）
        get().rebuildUsageIndex();
      },

      // US-S19-Task2 + C1': draft 同名更新；confirmed 同名跳过
      applyAiElementDrafts: (elements) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');

        const records = state.project.moduleVersionRecords ?? [];
        const existing = [...(state.project.metaElements ?? [])];
        const indexByKey = new Map<string, number>();
        for (let i = 0; i < existing.length; i += 1) {
          indexByKey.set(`${existing[i].dimension}:${existing[i].name}`, i);
        }

        const newElements: MetaElement[] = [];
        const skipped: { name: string; dimension: string; reason?: string }[] = [];
        let updatedCount = 0;

        for (const el of elements) {
          const key = `${el.dimension}:${el.name}`;
          const existingIndex = indexByKey.get(key);

          if (existingIndex !== undefined) {
            const existingEl = existing[existingIndex];
            const isConfirmed = Boolean(
              getLatestConfirmed(records, existingEl.dimension, existingEl.id),
            );

            if (isConfirmed) {
              skipped.push({
                name: el.name,
                dimension: el.dimension,
                reason: 'confirmed',
              });
              continue;
            }

            const now = new Date().toISOString();
            const prevDesc = (existingEl as MetaElement & { description?: string }).description;
            const mergedDescription =
              el.description && prevDesc && prevDesc !== el.description
                ? `${prevDesc}\n${el.description}`
                : el.description ?? prevDesc;

            existing[existingIndex] = {
              ...existingEl,
              ...(el.nameEn ? { nameEn: el.nameEn } : {}),
              ...(mergedDescription ? { description: mergedDescription } : {}),
              updatedAt: now,
            } as MetaElement & { updatedAt: string; description?: string };
            updatedCount += 1;
            continue;
          }

          const now = new Date().toISOString();
          const element: MetaElement & { status: string; createdAt: string; updatedAt: string } = {
            id: crypto.randomUUID(),
            name: el.name,
            nameEn: el.nameEn,
            dimension: el.dimension as MetaElement['dimension'],
            visibility: 'project',
            status: 'draft',
            createdAt: now,
            updatedAt: now,
            ...(el.description ? { description: el.description } : {}),
          };

          newElements.push(element);
          indexByKey.set(key, existing.length + newElements.length - 1);
        }

        set({
          project: {
            ...state.project,
            metaElements: [...existing, ...newElements],
            updatedAt: new Date().toISOString(),
          },
        });

        get().rebuildUsageIndex();

        return { inserted: newElements.length, updated: updatedCount, skipped };
      },

      migrateLegacyBusinessScenariosToChain: () => {
        const project = get().project;
        if (!project) {
          return { migratedCount: 0, skippedCount: 0 };
        }
        const result = migrateBusinessScenariosToChain(project);
        if (result.project !== project) {
          set({ project: result.project });
        }
        return {
          migratedCount: result.migratedCount,
          skippedCount: result.skippedCount,
        };
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
