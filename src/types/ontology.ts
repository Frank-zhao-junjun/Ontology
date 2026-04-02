// Ontology 本体模型类型定义

// ========== 版本管理 (M1) ==========
export interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;              // 语义化版本，如"1.0.0"
  name: string;                 // 版本名称
  description?: string;
  metamodels: {
    data: DataModel | null;
    behavior: BehaviorModel | null;
    rules: RuleModel | null;
    process: ProcessModel | null;
    events: EventModel | null;
    epc?: EpcModel | null;
  };
  createdAt: string;
  publishedAt?: string;
  status: 'draft' | 'published' | 'archived';
}

export interface PublishConfig {
  target: 'local' | 'remote' | 'download';
  includeData: boolean;         // 是否包含示例数据
  aiAgentEnabled: boolean;      // 是否启用AI运行时
  dockerCompose: boolean;       // 是否生成Docker配置
}

// ========== 元数据管理 ==========
export interface Metadata {
  id: string;
  domain: string;         // 领域（如：财务、物料、生产等）
  name: string;           // 字段中文名
  nameEn: string;         // 字段英文名
  description: string;    // 业务含义
  type: string;           // 字段属性/类型
  valueRange?: string;    // 值范围
  standard?: string;      // 参考标准
  source?: string;        // 信息源头
  createdAt: string;
  updatedAt: string;
}

// ========== 主数据管理 ==========
export interface MasterData {
  id: string;
  domain: string;         // 所属业务领域（研发管理、采购管理、销售管理、财务管理、生产管理、设备管理、人力资源管理等）
  name: string;           // 主数据中文名称
  nameEn: string;         // 主数据英文名称(SAP/通用术语)
  code: string;           // 主数据编码
  description: string;    // 备注/说明
  coreData: string;       // 核心主数据
  fieldNames: string;     // 字段清单（用于动态生成主数据表列）
  sourceSystem: string;   // 来源系统
  apiUrl?: string;        // API URL
  status: '00' | '99';    // 状态：00-生效，99-失效
  source?: string;        // 数据来源
  createdAt: string;      // 创建时间
  updatedAt: string;      // 更新时间
}

export interface MasterDataField {
  key: string;
  label: string;
  order: number;
}

export interface MasterDataRecord {
  id: string;
  definitionId: string;
  values: Record<string, string>;
  status: '00' | '99';
  createdAt: string;
  updatedAt: string;
}

// ========== 业务场景管理 ==========
export interface BusinessScenario {
  id: string;
  name: string;           // 场景名称
  nameEn: string;         // 场景英文名
  description?: string;   // 场景描述
  projectId: string;      // 所属项目ID
  color?: string;         // 颜色标识
  createdAt?: string;
  updatedAt?: string;
}

// ========== 数据模型 ==========
export interface Attribute {
  id: string;
  name: string;
  nameEn?: string;
  type: 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'enum' | 'reference' | 'text';
  length?: number;
  precision?: number;
  scale?: number;
  required?: boolean;
  unique?: boolean;
  default?: string;
  enumRef?: string;
  refEntity?: string;
  referenceTargetType?: 'entity' | 'masterdata';
  refDisplayField?: string;
  autoFill?: string;
  description?: string;
  metadataId?: string;  // 关联的元数据ID
  metadataName?: string;  // 关联的元数据名称（用于显示）
  masterDataId?: string;  // 兼容旧数据：首个关联主数据ID
  masterDataName?: string;  // 兼容旧数据：关联主数据名称（用于显示）
  masterDataIds?: string[];  // 多选关联的主数据ID列表
  masterDataNames?: string[];  // 多选关联的主数据名称列表
}

export interface Relation {
  id: string;
  name: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  targetEntity: string;
  foreignKey?: string;
  viaEntity?: string;
  cascade?: 'none' | 'delete' | 'all';
  description?: string;
}

export type EntityRole = 'aggregate_root' | 'child_entity';

export interface Entity {
  id: string;
  name: string;
  nameEn: string;
  projectId: string;  // 所属项目
  scenarioId?: string;  // 所属业务场景
  description?: string;
  entityRole?: EntityRole;     // DDD角色：聚合根 / 聚合内子实体
  parentAggregateId?: string;  // 当 entityRole=child_entity 时，指向所属聚合根
  isAggregateRoot?: boolean;   // 兼容旧数据：由 entityRole 派生，不再作为主字段
  attributes: Attribute[];
  relations: Relation[];
  indexes?: {
    fields: string[];
    type: 'btree' | 'hash';
    unique?: boolean;
  }[];
}

// 实体所属项目/模块
export interface EntityProject {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataModel {
  id: string;
  name: string;
  version: string;
  domain: string;
  projects: EntityProject[];  // 项目列表
  businessScenarios: BusinessScenario[];  // 业务场景列表
  entities: Entity[];
  createdAt: string;
  updatedAt: string;
}

// ========== 行为模型 ==========
export interface State {
  id: string;
  name: string;
  description?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  color?: string;
}

export interface Transition {
  id: string;
  name: string;
  from: string | string[];
  to: string;
  trigger: 'manual' | 'automatic' | 'scheduled';
  uiAction?: string;
  preConditions?: string[];
  postActions?: string[];
  description?: string;
}

export interface Action {
  transition: string;
  actionType: 'validate' | 'notify' | 'execute' | 'webhook';
  ruleRefs?: string[];
  template?: string;
  recipients?: string[];
  script?: string;
}

export interface StateMachine {
  id: string;
  name: string;
  entity: string;
  statusField: string;
  states: State[];
  transitions: Transition[];
  actions?: Action[];
}

export interface BehaviorModel {
  id: string;
  name: string;
  version: string;
  domain: string;
  stateMachines: StateMachine[];
  createdAt: string;
  updatedAt: string;
}

// ========== 规则模型 ==========
export type RuleType = 
  | 'field_validation' 
  | 'cross_field_validation' 
  | 'cross_entity_validation' 
  | 'aggregation_validation' 
  | 'temporal_rule';

export interface RuleCondition {
  type: 'regex' | 'range' | 'expression' | 'reference_check' | 'sum_match' | 'deadline' | 'custom';
  pattern?: string;
  min?: number;
  max?: number;
  exclusiveMin?: boolean;
  exclusiveMax?: boolean;
  expression?: string;
  fields?: string[];
  refEntity?: string;
  refField?: string;
  refValue?: string;
  masterField?: string;
  detailEntity?: string;
  detailField?: string;
  detailForeignKey?: string;
  deadlineField?: string;
  daysAfter?: number;
  checkEntity?: string;
  checkCondition?: string;
  customScript?: string;
}

export interface Rule {
  id: string;
  name: string;
  type: RuleType;
  entity: string;
  field?: string;
  condition: RuleCondition;
  errorMessage: string;
  severity?: 'error' | 'warning' | 'info';
  enabled?: boolean;
  description?: string;
}

export interface RuleModel {
  id: string;
  name: string;
  version: string;
  domain: string;
  rules: Rule[];
  createdAt: string;
  updatedAt: string;
}

// ========== 流程模型（兼容保留，当前UI默认不暴露） ==========
export interface ProcessStep {
  id: string;
  name: string;
  type: 'intent_clarification' | 'query_generation' | 'data_retrieval' | 'validation' | 'skill_execution' | 'insight_generation' | 'visualization' | 'presentation' | 'decision' | 'notification';
  description?: string;
  config?: Record<string, unknown>;
}

export interface DecisionPoint {
  condition: string;
  action: string;
  description?: string;
}

export interface Orchestration {
  id: string;
  name: string;
  description?: string;
  entryPoints: string[];
  steps: ProcessStep[];
  validationSteps?: { rule: string }[];
  decisionPoints?: DecisionPoint[];
  completionActions?: { skill?: string; ui?: string }[];
}

export interface ProcessModel {
  id: string;
  name: string;
  version: string;
  domain: string;
  orchestrations: Orchestration[];
  createdAt: string;
  updatedAt: string;
}

// ========== 事件模型 ==========
export interface EventDefinition {
  id: string;
  name: string;
  nameEn?: string;
  entity: string;
  trigger: 'create' | 'update' | 'delete' | 'state_change' | 'custom';
  condition?: string;
  payload: { field: string; path?: string }[];
  description?: string;
  
  // E1: 聚合根约束（运行时校验）
  entityRole?: EntityRole;
  entityIsAggregateRoot?: boolean; // 兼容旧导出结构
  
  // E2: 事务边界配置
  transactionPhase?: 'AFTER_COMMIT' | 'BEFORE_COMMIT';  // 默认AFTER_COMMIT
  
  // E3: 领域事件精简模式
  isDomainEvent?: boolean;        // 领域事件模式开关
  payloadFields?: string[];       // isDomainEvent=true时最多5个字段
}

export interface Subscription {
  id: string;
  name: string;
  eventId: string;
  handler: 'sync' | 'async';
  action: 'skill' | 'webhook' | 'notification' | 'script';
  actionRef: string;
  retryPolicy?: {
    maxRetries: number;
    backoff: 'fixed' | 'exponential';
    interval: number;
  };
  description?: string;
  
  // E4: 幂等性配置
  handlerId?: string;             // 处理器唯一标识
  idempotencyKeyPattern?: string; // 幂等键模式，默认: "{event_id}:{handler_id}"
}

export interface EventModel {
  id: string;
  name: string;
  version: string;
  domain: string;
  events: EventDefinition[];
  subscriptions: Subscription[];
  createdAt: string;
  updatedAt: string;
}

// ========== EPC模型（聚合根业务活动规格说明书） ==========
export type EpcProfileStatus = 'draft' | 'generated' | 'reviewed';
export type EpcOrganizationalUnitType = 'role' | 'department' | 'system' | 'external_party';
export type EpcSystemType = 'internal' | 'external' | 'platform';
export type EpcInformationSourceType = 'aggregate' | 'child_entity' | 'masterdata' | 'manual';
export type EpcActivityType = 'task' | 'auto_task' | 'review' | 'approval' | 'notification' | 'follow_up';
export type EpcActivitySource = 'state_transition' | 'event' | 'rule' | 'manual';
export type EpcConnectorType = 'xor' | 'and';
export type EpcValidationSeverity = 'error' | 'warning' | 'info';

export interface EpcOrganizationalUnit {
  id: string;
  name: string;
  type?: EpcOrganizationalUnitType;
  responsibilities?: string;
  permissions?: string;
}

export interface EpcSystemActor {
  id: string;
  name: string;
  type?: EpcSystemType;
  description?: string;
}

export interface EpcInformationObject {
  id: string;
  name: string;
  sourceType: EpcInformationSourceType;
  sourceRefId?: string;
  attributes: string[];
  description?: string;
}

export interface EpcActivityDefinition {
  id: string;
  name: string;
  activityType: EpcActivityType;
  derivedFrom: EpcActivitySource;
  transitionId?: string;
  eventId?: string;
  ruleIds?: string[];
  ownerOrgUnitId?: string;
  systemId?: string;
  inputObjectIds?: string[];
  outputObjectIds?: string[];
  precondition?: string;
  postcondition?: string;
  sla?: string;
  enabled?: boolean;
}

export interface EpcConnectorBranch {
  label: string;
  targetEventName: string;
  ruleId?: string;
}

export interface EpcConnectorDefinition {
  id: string;
  type: EpcConnectorType;
  sourceActivityId?: string;
  sourceEventId?: string;
  condition?: string;
  branches: EpcConnectorBranch[];
}

export interface EpcExceptionDefinition {
  id: string;
  name: string;
  triggerCondition: string;
  handlingFlow: string;
  ownerOrgUnitId?: string;
}

export interface EpcKpiDefinition {
  id: string;
  name: string;
  target: string;
  measurement: string;
}

export interface EpcIntegrationDefinition {
  id: string;
  systemName: string;
  integrationContent: string;
  integrationMode?: string;
  description?: string;
}

export interface EpcComplianceDefinition {
  id: string;
  requirement: string;
  verificationMethod?: string;
}

export interface EpcValidationIssue {
  code: string;
  severity: EpcValidationSeverity;
  message: string;
  field?: string;
}

export interface EpcValidationSummary {
  isValid: boolean;
  score?: number;
  issues: EpcValidationIssue[];
  validatedAt?: string;
}

export interface EpcAggregateProfile {
  aggregateId: string;
  businessName: string;
  businessCode?: string;
  documentVersion: string;
  status: EpcProfileStatus;
  purpose?: string;
  scopeStart?: string;
  scopeEnd?: string;
  businessBackground?: string;
  organizationalUnits: EpcOrganizationalUnit[];
  systems: EpcSystemActor[];
  informationObjects: EpcInformationObject[];
  activities: EpcActivityDefinition[];
  connectors: EpcConnectorDefinition[];
  exceptions: EpcExceptionDefinition[];
  kpis: EpcKpiDefinition[];
  integrations: EpcIntegrationDefinition[];
  complianceItems: EpcComplianceDefinition[];
  notes?: string;
  generatedDocument?: string;
  validationSummary?: EpcValidationSummary;
}

export interface EpcModel {
  id: string;
  name: string;
  version: string;
  profiles: EpcAggregateProfile[];
  generatedAt?: string;
  updatedAt: string;
}

// ========== 领域模型 ==========
export interface Domain {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon?: string;
  color?: string;
}

// ========== 建模手册 ==========
export interface ModelingManual {
  domain: Domain;
  dataModel: DataModel;
  behaviorModel: BehaviorModel;
  ruleModel: RuleModel;
  processModel: ProcessModel; // 兼容保留字段
  eventModel: EventModel;
  epcModel?: EpcModel | null;
  generatedAt: string;
}

// ========== 项目状态 ==========
export interface OntologyProject {
  id: string;
  name: string;
  description?: string;
  domain: Domain;
  dataModel: DataModel | null;
  behaviorModel: BehaviorModel | null;
  ruleModel: RuleModel | null;
  processModel: ProcessModel | null; // 兼容保留字段
  eventModel: EventModel | null;
  epcModel?: EpcModel | null;
  createdAt: string;
  updatedAt: string;
}
