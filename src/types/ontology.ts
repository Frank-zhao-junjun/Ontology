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
    metrics?: MetricsModel | null;
    dataSources?: DataSourcesModel | null;
    masterData?: {
      definitions: MasterData[];
      records: Record<string, MasterDataRecord[]>;
    };
  };
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  status: 'draft' | 'published' | 'archived' | 'pending_review' | 'rejected';
  rejectionReason?: string;       // 驳回原因
  source?: 'manual' | 'excel_import' | 'ai_generate';  // 版本来源
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

// ==========================================
// Excel 导入相关类型
// ==========================================

/** Excel 导入模板 Sheet 定义 */
export interface ExcelTemplateSheet {
  name: string;
  nameEn: string;
  headers: { label: string; key: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[]; description: string }[];
}

/** Excel 导入校验错误 */
export interface ExcelImportError {
  sheet: string;
  row: number;
  column: string;
  value: string;
  errorType: 'missing_required' | 'invalid_enum' | 'invalid_type' | 'invalid_reference' | 'duplicate';
  message: string;
}

/** Excel 导入校验结果 */
export interface ExcelImportValidation {
  totalRows: number;
  validRows: number;
  errorCount: number;
  errors: ExcelImportError[];
}

/** Excel 导入结果 */
export interface ExcelImportResult {
  success: boolean;
  validation: ExcelImportValidation;
  versionId?: string;
  versionName?: string;
  errorMessage?: string;
  parsedData?: ExcelParsedData;
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
export type AttributeDataType = 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'enum' | 'reference' | 'text';
export type AttributeReferenceKind = 'entity' | 'masterData';

export interface Attribute {
  id: string;
  name: string;
  nameEn?: string;
  dataType: AttributeDataType;
  length?: number;
  precision?: number;
  scale?: number;
  required?: boolean;
  unique?: boolean;
  default?: string;
  enumRef?: string;
  referenceKind?: AttributeReferenceKind;
  referencedEntityId?: string;
  referenceDisplayField?: string;
  isMasterDataRef?: boolean;
  masterDataType?: string;
  masterDataField?: string;
  autoFill?: string;
  description?: string;
  businessMeaning?: string;
  metadataTemplateId?: string;
  metadataTemplateName?: string;
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
  attributes?: Attribute[]; // 附加关系属性
  isRecursive?: boolean;    // 是否是自引用关系
  directionality?: 'directed' | 'undirected'; // 关系的方向性
}

export type EntityRole = 'aggregate_root' | 'child_entity';

export interface ComputedProperty {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  computationType: 'formula' | 'aggregation' | 'lookup' | 'ai-inference';
  expression: string;
  targetEntity?: string;
  aggregationFunction?: 'sum' | 'count' | 'avg' | 'min' | 'max';
  businessMeaning?: string;
}

export interface SourceMapping {
  id: string;
  entityId: string;
  attributeId: string;
  sourceSystem: string;
  sourceFieldPath: string;
  transformRule?: string;
}

export interface Entity {
  id: string;
  name: string;
  nameEn: string;
  projectId: string;  // 所属项目
  businessScenarioId: string;  // 所属业务场景
  description?: string;
  businessMeaning?: string;    // AI理解该对象的业务语义
  aliases?: string[];          // 对象同义词
  entityRole?: EntityRole;     // DDD角色：聚合根 / 聚合内子实体
  parentAggregateId?: string;  // 当 entityRole=child_entity 时，指向所属聚合根
  isAggregateRoot?: boolean;   // 兼容旧数据：由 entityRole 派生，不再作为主字段
  attributes: Attribute[];
  relations: Relation[];
  computedProperties?: ComputedProperty[]; // 派生属性
  sourceMappings?: SourceMapping[];        // 源系统映射机制
  domainEvents?: string[];                 // 聚合根发布的领域事件ID列表
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

// ========== Entity Lifecycle 子类型 ==========

/** 状态超时配置 */
export interface StateTimeout {
  /** 超时时长 */
  duration: number;
  /** 时间单位 */
  unit: 'minutes' | 'hours' | 'days';
  /** 超时处理策略 */
  onTimeout: 'auto_transition' | 'notify' | 'escalate';
  /** 自动转换的目标状态ID（onTimeout=auto_transition 时必填） */
  targetStateId?: string;
  /** 超时通知的角色ID列表（onTimeout=notify 时必填） */
  notifyRoleIds?: string[];
  /** 升级目标角色ID（onTimeout=escalate 时必填） */
  escalateRoleId?: string;
}

/** 状态级字段可见性 */
export interface StateDataVisibility {
  /** 可见但不可编辑的字段（Attribute.nameEn） */
  visibleFields: string[];
  /** 可编辑的字段（Attribute.nameEn） */
  editableFields: string[];
  /** 完全隐藏的字段（Attribute.nameEn） */
  hiddenFields: string[];
  /** 必填字段（在此状态下提交时必须填写） */
  requiredFields: string[];
}

/** 操作超时配置 */
export interface ActionTimeout {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours';
  onTimeout: 'cancel' | 'retry' | 'fallback';
  maxRetries?: number;
}

/** 生命周期审计记录 */
export interface LifecycleAuditEntry {
  id: string;
  entityId: string;
  entityNameEn: string;
  timestamp: string;
  eventType: 'state_entry' | 'state_exit' | 'transition' | 'action_executed' | 'action_failed' | 'timeout' | 'escalation';
  fromStateId?: string;
  toStateId?: string;
  transitionId?: string;
  actionId?: string;
  actorRoleId?: string;
  actorDescription?: string;
  result: 'success' | 'failure' | 'timeout' | 'cancelled';
  errorMessage?: string;
  snapshot?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ========== 行为模型 ==========
export interface State {
  // ===== 现有字段（保留，不变） =====
  id: string;
  name: string;
  description?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  color?: string;

  // ===== 生命周期增强（新增，全部可选） =====

  /** 进入状态时自动执行的动作ID列表 */
  entryActions?: string[];

  /** 离开状态时自动执行的动作ID列表 */
  exitActions?: string[];

  /** 在此状态下可执行的动作ID列表（Agent 操作菜单） */
  availableActions?: string[];

  /** 在此状态下生效的规则ID列表 */
  constraints?: string[];

  /** 在此状态下可操作的角色ID列表（为空=所有角色） */
  allowedRoles?: string[];

  /** 状态超时配置 */
  timeout?: StateTimeout;

  /** 状态级字段可见性 */
  dataVisibility?: StateDataVisibility;

  /** 状态的业务语义标签 */
  semanticTag?: 'created' | 'pending' | 'processing' | 'reviewing' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'archived' | 'custom';

  /** 在此状态下可触发的事件ID列表 */
  triggerableEvents?: string[];

  /** 状态进入/离开的审计日志开关 */
  auditEntry?: boolean;
  auditExit?: boolean;
}

export interface TransitionTriggerConfig {
  eventId?: string;
  cron?: string;
  timezone?: string;
  publishEventId?: string;
}


export interface Transition {
  // ===== 现有字段（保留，不变） =====
  id: string;
  name: string;
  from: string | string[];
  to: string;
  trigger: 'manual' | 'automatic' | 'scheduled';
  uiAction?: string;
  triggerConfig?: TransitionTriggerConfig;
  preConditions?: string[];
  postActions?: string[];
  description?: string;

  // ===== 生命周期增强（新增，全部可选） =====

  /** 守卫条件表达式（必须为 true 才能执行转换） */
  guardCondition?: string;

  /** 守卫条件失败时的提示消息 */
  guardFailureMessage?: string;

  /** 回滚/补偿动作ID（转换失败时执行） */
  compensationAction?: string;

  /** 转换时发布的事件ID */
  publishEventId?: string;

  /** 转换时通知的角色ID列表 */
  notifyRoleIds?: string[];

  /** 转换是否需要审批 */
  requiresApproval?: boolean;

  /** 审批角色ID列表（requiresApproval=true 时必填） */
  approvalRoleIds?: string[];

  /** 是否记录审计日志 */
  auditLog?: boolean;

  /** 转换优先级（多个可用转换时的排序，越大越优先） */
  priority?: number;

  /** 转换的语义标签 */
  semanticTag?: 'submit' | 'approve' | 'reject' | 'cancel' | 'revise' | 'complete' | 'archive' | 'custom';
}

export interface Parameter {
  id: string;
  name: string;
  nameEn: string;
  dataType: string;
  required?: boolean;
}

export interface Action {
  // ===== 现有字段（保留，不变） =====
  // Ontology 2.0 (Palantir-style) Top-level Behavior
  id?: string;
  name?: string;
  nameEn?: string;
  description?: string;
  targetEntityId?: string;
  actionType: 'create' | 'update' | 'delete' | 'link' | 'unlink' | 'custom' | 'validate' | 'notify' | 'execute' | 'webhook';
  parameters?: Parameter[];
  preConditions?: string[];
  postEffects?: string[];
  executionType?: 'sync' | 'async' | 'approval';
  requiredRoles?: string[];
  sideEffects?: SideEffect[];

  // V1 State Transition backwards compatibility
  transition?: string;
  ruleRefs?: string[];
  template?: string;
  recipients?: string[];
  script?: string;

  // ===== 生命周期增强（新增，全部可选） =====

  /** 自然语言别名（Agent 意图匹配用） */
  aliases?: string[];

  /** 触发短语（Agent NLU 用） */
  triggerPhrases?: string[];

  /** 操作成功后的提示模板 */
  successMessage?: string;

  /** 操作失败后的提示模板 */
  failureMessage?: string;

  /** 失败后的回退动作ID */
  fallbackActionId?: string;

  /** 是否需要二次确认 */
  requiresConfirmation?: boolean;

  /** 确认提示文案 */
  confirmationMessage?: string;

  /** 操作超时配置 */
  timeout?: ActionTimeout;

  /** 幂等键生成规则（如 "{entityId}_{actionType}_{timestamp}"） */
  idempotencyKeyTemplate?: string;

  /** 操作的事务隔离级别 */
  isolationLevel?: 'read_committed' | 'repeatable_read' | 'serializable';
}

// ========== Side Effect (B07) ==========
export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export interface SideEffect {
  id: string;
  type: 'notification' | 'sync' | 'log' | 'webhook';
  description?: string;
  async: boolean;
  retryPolicy?: RetryPolicy;
  config?: Record<string, unknown>;
}

export interface FunctionDefinition {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  apiEndpoint?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  parameters: Parameter[];
  returnType: string;
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

/**
 * EntityLifecycle 是 Agent 读取 Entity 生命周期的一站式入口。
 * 它聚合了 StateMachine + Action + Rule + Event + Governance 中与生命周期相关的所有信息。
 */
export interface EntityLifecycle {
  entityId: string;
  entityName: string;
  entityNameEn: string;
  /** 实体中表示状态的字段名（来自 StateMachine.statusField） */
  statusField: string;

  /** 状态机摘要 */
  stateMachine: {
    id: string;
    name: string;
    states: State[];
    transitions: Transition[];
  };

  /** 按状态分组的可用操作 */
  actionsByState: Record<string, Action[]>;

  /** 按状态分组的约束规则 */
  rulesByState: Record<string, Rule[]>;

  /** 按状态分组的可触发事件 */
  eventsByState: Record<string, EventDefinition[]>;

  /** 按状态分组的操作角色 */
  rolesByState: Record<string, GovernanceRole[]>;

  /** 生命周期审计记录 */
  auditTrail: LifecycleAuditEntry[];

  /** 生命周期统计 */
  stats: {
    totalStates: number;
    totalTransitions: number;
    totalActions: number;
    bottleneckStates?: string[];
  };
}

// ========== 行为指标定义 ==========
export type IndicatorType = 'count' | 'rate' | 'average' | 'duration' | 'ratio' | 'custom';

export interface BehaviorIndicator {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  type: IndicatorType;
  targetEntity: string;
  targetAttribute?: string;
  formula?: string;
  targetValue?: number;
  acceptableRange?: { min?: number; max?: number };
  unit?: string;
  isKPI: boolean;
  weight?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

// ========== 行为约束 ==========
export type ConstraintScope = 'pre_action' | 'post_action' | 'transition' | 'role_based' | 'resource_based';

export type ConstraintSeverity = 'warning' | 'blocking';

export interface BehaviorConstraint {
  id: string;
  name: string;
  description?: string;
  scope: ConstraintScope;
  constraintType?: 'preCondition' | 'postCondition' | 'role' | 'resource' | 'timing';
  targetAction?: string;
  condition: string;
  role?: string;
  severity: ConstraintSeverity;
  errorMessage?: string;
  async?: boolean;
}

export interface BehaviorModel {
  id: string;
  name: string;
  version: string;
  domain: string;
  stateMachines: StateMachine[];
  actions?: Action[];
  functions?: FunctionDefinition[];
  transactionBoundaries?: TransactionBoundary[];
  indicators?: BehaviorIndicator[];
  constraints?: BehaviorConstraint[];
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

export interface GrayscaleConfig {
  enabled: boolean;
  percentage: number;
  targetScenarioIds?: string[];
}

export interface Rule {
  id: string;
  name: string;
  type: RuleType;
  entity: string;
  field?: string;
  priority?: number;
  condition: RuleCondition;
  errorMessage: string;
  severity?: 'error' | 'warning' | 'info';
  enabled?: boolean;
  description?: string;
  version?: string;
  status?: 'draft' | 'active' | 'deprecated' | 'archived';
  effectiveFrom?: string;
  effectiveUntil?: string;
  grayscale?: GrayscaleConfig;
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

// ========== Agent Semantic Layer（Agent 语义层） ==========

/** 槽位值校验 */
export interface SlotValidation {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'datetime' | 'enum' | 'regex';
  min?: number;
  max?: number;
  pattern?: string;
  enumValues?: string[];
  errorMessage?: string;
}

/** 槽位候选值 */
export interface SlotCandidate {
  value: string;
  label: string;
  description?: string;
}

/** 意图参数槽位 */
export interface IntentSlot {
  id: string;
  /** 对应 Action.parameters 中的参数名 */
  paramName: string;
  /** 槽位显示名称 */
  displayName: string;
  /** 追问话术（Agent 用于向用户提问） */
  prompt: string;
  /** 默认值表达式 */
  defaultValue?: string;
  /** 示例值列表 */
  examples: string[];
  /** 值校验规则 */
  validation?: SlotValidation;
  /** 是否可以从上下文自动推断 */
  inferableFromContext: boolean;
  /** 推断来源（如 "dialogContext.lastEntity"） */
  inferenceSource?: string;
  /** 值的候选列表（枚举场景） */
  candidates?: SlotCandidate[];
}

/** 上下文约束 */
export interface ContextConstraint {
  /** 约束类型 */
  type: 'entity_state' | 'user_role' | 'previous_action' | 'time_range';
  /** 约束值 */
  value: string;
  /** 约束不满足时的提示 */
  failureMessage?: string;
}

/** 意图示例对话 */
export interface IntentExample {
  /** 用户输入 */
  userInput: string;
  /** Agent 响应 */
  agentResponse: string;
  /** 参数提取结果 */
  extractedSlots: Record<string, string>;
}

/** 槽位填充策略 */
export interface SlotFillingStrategy {
  /** 槽位列表 */
  slots: IntentSlot[];
  /** 必填槽位 ID 列表 */
  requiredSlots: string[];
  /** 槽位填充顺序（按此顺序逐一追问） */
  fillOrder: string[];
  /** 是否允许一次性填充所有槽位 */
  allowBatchFill: boolean;
  /** 缺失槽位时的追问模板 */
  promptTemplate?: string;
}

/** 意图定义 — Agent 语义层的核心入口 */
export interface Intent {
  id: string;
  /** 意图名称（如"创建采购订单"） */
  name: string;
  /** 意图分类 */
  category: 'crud' | 'workflow' | 'query' | 'report' | 'config' | 'custom';
  /** 自然语言触发短语 */
  triggerPhrases: string[];
  /** 否定触发短语（匹配这些短语时不应触发此意图） */
  negativePhrases?: string[];
  /** 映射到的 Action ID */
  actionId: string;
  /** 目标实体 ID */
  targetEntityId: string;
  /** 参数槽位填充策略 */
  slotFilling: SlotFillingStrategy;
  /** 意图优先级（多个意图匹配时的排序，越大越优先） */
  priority: number;
  /** 意图所需的权限角色 */
  requiredRoles?: string[];
  /** 是否需要用户确认 */
  requiresConfirmation: boolean;
  /** 确认提示文案 */
  confirmationMessage?: string;
  /** 意图生效的对话上下文（为空=全局可用） */
  contextConstraints?: ContextConstraint[];
  /** 意图示例对话 */
  examples: IntentExample[];
  /** 语义标签 */
  tags?: string[];
}

/** 对话上下文实体引用 */
export interface ContextEntityRef {
  entityId: string;
  entityName: string;
  referenceType: 'explicit' | 'anaphora' | 'demonstrative';
  mentionText: string;
  lastMentionTurn: number;
}

/** 对话上下文模型 */
export interface DialogContext {
  /** 上下文生命周期（秒，超时后自动清除） */
  ttl: number;
  /** 当前聚焦的实体 */
  focusedEntity?: {
    entityId: string;
    entityName: string;
    entityNameEn: string;
    instanceId?: string;
  };
  /** 最近执行的操作 */
  lastAction?: {
    intentId: string;
    actionId: string;
    actionName: string;
    timestamp: string;
    result: 'success' | 'failure';
    params: Record<string, unknown>;
  };
  /** 对话中引用的实体列表 */
  referencedEntities: ContextEntityRef[];
  /** 当前对话轮次 */
  turnCount: number;
  /** 用户当前意图（多轮对话中） */
  pendingIntent?: {
    intentId: string;
    filledSlots: Record<string, string>;
    missingSlots: string[];
  };
  /** 对话状态 */
  state: 'idle' | 'slot_filling' | 'confirming' | 'executing';
}

/** 语义关系类型 */
export type SemanticRelationType =
  | 'is_a'           // 上下位关系：采购订单 is_a 订单
  | 'part_of'        // 部分整体关系：订单行 part_of 采购订单
  | 'synonym_of'     // 同义关系：供应商 synonym_of 供货商
  | 'causes'         // 因果关系：审批通过 causes 库存更新
  | 'depends_on'     // 依赖关系：发货 depends_on 付款确认
  | 'conflicts_with' // 冲突关系：退货 conflicts_with 发货
  | 'precedes'       // 时序关系：创建 precedes 审批
  | 'equivalent_to'  // 等价关系：订单金额 equivalent_to 总价
  | 'derived_from'   // 派生关系：月度报表 derived_from 日交易记录
  | 'same_field_as'; // 字段等价：物料.编码 same_field_as 订单.物料编码

/** 语义关系 */
export interface SemanticRelation {
  id: string;
  /** 关系类型 */
  type: SemanticRelationType;
  /** 源实体 ID */
  sourceEntityId: string;
  /** 目标实体 ID */
  targetEntityId: string;
  /** 关系名称 */
  name: string;
  /** 关系描述 */
  description?: string;
  /** 关系权重（用于推理优先级） */
  weight: number;
  /** 关系的传递性 */
  transitive: boolean;
  /** 关系的对称性 */
  symmetric: boolean;
}

/** 术语示例 */
export interface TermExample {
  context: string;
  usage: string;
}

/** 业务术语模型引用 */
export interface BusinessTermModelRef {
  modelType: 'entity' | 'attribute' | 'action' | 'state' | 'event' | 'rule' | 'metric';
  modelId: string;
  modelName: string;
}

/** 业务术语词典 */
export interface BusinessTerm {
  id: string;
  /** 标准术语 */
  term: string;
  /** 英文术语 */
  termEn?: string;
  /** 术语定义 */
  definition: string;
  /** 同义词/别名 */
  synonyms: string[];
  /** 所属领域 */
  domain: string;
  /** 使用示例 */
  examples: TermExample[];
  /** 歧义说明（与其他术语的区分） */
  disambiguation?: string;
  /** 关联的本体模型元素 */
  modelRefs: BusinessTermModelRef[];
  /** 术语来源 */
  source?: string;
  /** 术语状态 */
  status: 'active' | 'deprecated' | 'draft';
  /** 生效时间 */
  effectiveDate?: string;
  /** 失效时间 */
  expiryDate?: string;
}

/** 错误类型 */
export type ErrorType =
  | 'validation_error'
  | 'permission_denied'
  | 'resource_not_found'
  | 'state_conflict'
  | 'timeout'
  | 'external_service_error'
  | 'data_integrity_error'
  | 'business_rule_violation';

/** 错误恢复策略类型 */
export type ErrorRecoveryStrategy =
  | 'retry'           // 重试
  | 'fallback'        // 执行回退动作
  | 'escalate'        // 升级到人工
  | 'compensate'      // 执行补偿动作
  | 'skip'            // 跳过（非关键操作）
  | 'ask_user';       // 询问用户

/** 错误恢复策略 */
export interface ErrorRecovery {
  id: string;
  /** 关联的 Action ID */
  actionId: string;
  /** 错误类型 */
  errorType: ErrorType;
  /** 错误匹配模式（错误消息正则） */
  errorPattern: string;
  /** 恢复策略 */
  strategy: ErrorRecoveryStrategy;
  /** 恢复动作 ID */
  recoveryActionId?: string;
  /** Agent 回复话术 */
  agentMessage: string;
  /** 是否允许重试 */
  allowRetry: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试间隔（秒） */
  retryInterval?: number;
}

/** 时效性标记 */
export interface TemporalValidity {
  /** 关联的模型元素类型 */
  targetType: 'entity' | 'rule' | 'action' | 'state' | 'event' | 'relation' | 'metric';
  /** 关联的模型元素 ID */
  targetId: string;
  /** 生效时间 */
  effectiveDate: string;
  /** 失效时间（为空=永久有效） */
  expiryDate?: string;
  /** 版本号 */
  version: string;
  /** 变更说明 */
  changeDescription?: string;
  /** 替代的旧版本 ID */
  supersedes?: string;
  /** 被替代的新版本 ID */
  supersededBy?: string;
}

/** 字段引用 */
export interface FieldRef {
  entityId: string;
  entityNameEn: string;
  attributeId: string;
  attributeName: string;
}

/** 跨实体字段映射 */
export interface SemanticFieldMapping {
  id: string;
  /** 映射名称 */
  name: string;
  /** 映射类型 */
  type: 'exact_match' | 'derived' | 'composed' | 'renamed';
  /** 源字段 */
  sourceField: FieldRef;
  /** 目标字段 */
  targetField: FieldRef;
  /** 转换规则（type=derived/composed 时） */
  transformRule?: string;
  /** 映射描述 */
  description?: string;
}

/** Agent 策略适用范围 */
export type AgentPolicyScope =
  | { type: 'global' }
  | { type: 'intent'; intentIds: string[] }
  | { type: 'entity'; entityIds: string[] }
  | { type: 'action'; actionIds: string[] }
  | { type: 'domain'; domains: string[] };

/** Agent 策略规则 */
export interface AgentPolicyRule {
  /** 条件表达式 */
  condition: string;
  /** 条件满足时的动作 */
  action: 'allow' | 'deny' | 'confirm' | 'escalate';
  /** 动作说明 */
  description: string;
}

/** Agent 行为策略 */
export interface AgentPolicy {
  id: string;
  /** 策略名称 */
  name: string;
  /** 关联的角色 ID */
  roleId: string;
  /** 策略类型 */
  policyType: 'allow' | 'deny' | 'confirm';
  /** 适用范围 */
  scope: AgentPolicyScope;
  /** 策略规则 */
  rules: AgentPolicyRule[];
  /** 优先级（多条策略冲突时，越大越优先） */
  priority: number;
}

/** AgentSemanticLayer — Agent 语义层聚合入口 */
export interface AgentSemanticLayer {
  /** 意图列表 */
  intents: Intent[];
  /** 对话上下文模板 */
  dialogContextTemplate: DialogContext;
  /** 语义关系 */
  semanticRelations: SemanticRelation[];
  /** 业务术语词典 */
  businessTerms: BusinessTerm[];
  /** 错误恢复策略 */
  errorRecoveries: ErrorRecovery[];
  /** 时效性标记 */
  temporalValidities: TemporalValidity[];
  /** 跨实体字段映射 */
  fieldMappings: SemanticFieldMapping[];
  /** Agent 行为策略 */
  agentPolicies: AgentPolicy[];
  /** 语义层元数据 */
  metadata: {
    version: string;
    lastUpdated: string;
    totalIntents: number;
    totalTerms: number;
    totalRelations: number;
    coverage: {
      entitiesWithIntents: number;
      totalEntities: number;
      actionsWithRecovery: number;
      totalActions: number;
    };
  };
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
  /** v3.1: per-model coverage breakdown */
  modelCoverage?: EpcModelCoverage[];
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

// ========== EPC 全域关联类型 (v3.1) ==========

/** 12 大元模型类型 */
export type EpcModelRefModelType =
  | 'data'          // 数据模型 (E1)
  | 'behavior'      // 行为模型 (E2)
  | 'rule'          // 规则模型 (E3)
  | 'event'         // 事件模型 (E4)
  | 'organization'  // 组织与岗位模型 (E5)
  | 'metric'        // 指标模型 (E6)
  | 'boundary'      // 边界约束模型 (E7)
  | 'dataSource'    // 数据源模型 (E8)
  | 'process'       // 流程模型
  | 'governance'    // 治理模型
  | 'lifecycle'     // 实体生命周期
  | 'semantic';     // Agent 语义层

/** 13 种引用角色 */
export type EpcModelRefRole =
  | 'core'          // 核心元素
  | 'input'         // 输入
  | 'output'        // 输出
  | 'trigger'       // 触发
  | 'condition'     // 条件
  | 'permission'    // 权限
  | 'owner'         // 所有者
  | 'measure'       // 度量
  | 'source'        // 数据来源
  | 'guard'         // 守卫条件
  | 'compensate'    // 补偿
  | 'recovery'      // 恢复
  | 'intent';       // 意图

export interface EpcModelRef {
  modelType: EpcModelRefModelType;
  modelId: string;
  modelName: string;
  role: EpcModelRefRole;
  description?: string;
}

/** EPC per-model coverage breakdown */
export interface EpcModelCoverage {
  modelType: EpcModelRefModelType;
  totalAvailable: number;
  totalReferenced: number;
  coveragePercent: number;
}

/** EPC 链路节点类型 */
export type EpcChainNodeType = 'event' | 'function' | 'connector' | 'infoObject' | 'orgUnit';

/** EPC 链路节点 */
export interface EpcChainNode {
  id: string;
  type: EpcChainNodeType;
  name: string;
  refs: EpcModelRef[];
  nextNodeIds: string[];
}

/** EPC 业务链路 — 从起点到终点串联完整业务流程 */
export interface EpcChain {
  id: string;
  name: string;
  description?: string;
  startNodeId: string;
  endNodeId: string;
  nodes: EpcChainNode[];
  /** 自动推导：链路涉及的所有实体 */
  derivedEntityIds: string[];
  /** 自动推导：链路涉及的所有状态 */
  derivedStateIds: string[];
  /** 自动推导：链路涉及的所有规则 */
  derivedRuleIds: string[];
  /** 自动推导：链路涉及的所有事件 */
  derivedEventIds: string[];
  /** 自动推导：链路涉及的所有角色 */
  derivedRoleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EpcModel {
  id: string;
  name: string;
  version: string;
  profiles: EpcAggregateProfile[];
  /** EPC 业务链路集合 */
  chains: EpcChain[];
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

// ========== 治理层（Manifest spec.governance）==========
export type GovernancePermissionOp = 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE';

export interface GovernanceRolePermission {
  objectTypeId: string;
  ops: GovernancePermissionOp[];
  denyActionIds?: string[];
}

export interface GovernanceRole {
  id: string;
  name: string;
  permissions: GovernanceRolePermission[];
}

export interface GovernanceFieldPermission {
  objectTypeId: string;
  propertyNameEn: string;
  allowedRoleIds: string[];
}

export interface GovernanceAgentPolicy {
  id: string;
  roleId: string;
  manifestVersion?: string;
  allowedMcpTools?: string[];
  allowedAggregateRootIds?: string[];
  allowedActionIds?: string[];
  defaultDeny?: boolean;
}

export interface GovernanceModel {
  id: string;
  roles: GovernanceRole[];
  fieldPermissions: GovernanceFieldPermission[];
  agentPolicies: GovernanceAgentPolicy[];
  createdAt: string;
  updatedAt: string;
}

// ========== 组织体系与岗位模型 ==========

/** 部门类型 */
export type DepartmentType = 'headquarters' | 'division' | 'department' | 'team' | 'group';

/** 部门 */
export interface Department {
  id: string;
  name: string;                        // 部门名称
  nameEn: string;                      // 英文名称
  code?: string;                       // 部门编码
  type: DepartmentType;                // 部门类型
  parentId?: string;                   // 上级部门ID（组织树）
  managerPositionId?: string;          // 部门负责人岗位ID
  description?: string;
  sortOrder?: number;                  // 排序
  status: 'active' | 'inactive';      // 状态
  metadata?: Record<string, string>;   // 扩展属性
  // --- HR 同步字段 ---
  syncSource?: string;                 // 同步来源，如 'feishu' | 'dingtalk' | 'sap' | 'workday'
  syncExternalId?: string;             // HR 系统中的外部ID
  syncUpdatedAt?: string;              // 最后同步时间 ISO 8601
}

/** 岗位职责项 */
export interface PositionResponsibility {
  id: string;
  name: string;                        // 职责名称，如"采购审批"
  description?: string;                // 详细描述
  scope: 'entity' | 'process' | 'domain' | 'custom';
  scopeRefs: string[];                 // 关联的 Entity/Process/Domain IDs
  actions: string[];                   // 可执行的 Action IDs
  decisionAuthority: 'none' | 'recommend' | 'approve' | 'veto';
  delegateToPositionIds?: string[];    // 可委托的岗位IDs
  isActive: boolean;
}

/** 岗位 */
export interface Position {
  id: string;
  name: string;                        // 岗位名称
  nameEn: string;                      // 英文名称
  code?: string;                       // 岗位编码
  departmentId: string;                // 所属部门ID
  parentPositionId?: string;           // 上级岗位（汇报线）
  level?: number;                      // 岗位层级
  roleIds: string[];                   // 关联的治理角色IDs → GovernanceRole
  headcount?: number;                  // 编制人数
  responsibilities: PositionResponsibility[];  // 结构化职责
  requiredCompetencies?: string[];     // 任职要求
  status: 'active' | 'inactive';
  metadata?: Record<string, string>;
  // --- HR 同步字段 ---
  syncSource?: string;                 // 同步来源
  syncExternalId?: string;             // HR 系统中的外部ID
  syncUpdatedAt?: string;              // 最后同步时间 ISO 8601
}

/** HR 同步来源 */
export type HRSyncSource =
  | 'feishu'       // 飞书
  | 'dingtalk'     // 钉钉
  | 'wechat_work'  // 企业微信
  | 'sap'          // SAP HCM
  | 'workday'      // Workday
  | 'custom_api';  // 自定义 API

/** 同步频率 */
export type HRSyncInterval =
  | 'realtime'     // 实时（Webhook 回调）
  | 'hourly'       // 每小时
  | 'daily'        // 每天
  | 'weekly'       // 每周
  | 'manual';      // 仅手动触发

/** HR 字段映射 */
export interface HRFieldMapping {
  department: {
    name?: string;          // HR 部门名称字段路径，如 'department_name'
    nameEn?: string;        // HR 英文名称字段路径
    code?: string;          // HR 部门编码字段路径
    parentId?: string;      // HR 上级部门字段路径
    type?: string;          // HR 部门类型字段路径
    managerId?: string;     // HR 部门负责人字段路径
    status?: string;        // HR 状态字段路径
  };
  position: {
    name?: string;          // HR 岗位名称字段路径
    nameEn?: string;        // HR 英文名称字段路径
    code?: string;          // HR 岗位编码字段路径
    departmentCode?: string;// HR 所属部门编码字段路径
    parentCode?: string;    // HR 上级岗位编码字段路径
    level?: string;         // HR 岗位层级字段路径
    headcount?: string;     // HR 编制人数字段路径
    status?: string;        // HR 状态字段路径
  };
}

/** 冲突策略 */
export type HRConflictStrategy =
  | 'hr_wins'       // HR 数据覆盖本地（默认）
  | 'local_wins'    // 保留本地修改
  | 'merge'         // 合并（HR 数据填充空字段，已有字段保留）
  | 'manual';       // 标记冲突，人工审核

/** 同步范围 */
export interface HRSyncScope {
  syncDepartments: boolean;            // 是否同步部门
  syncPositions: boolean;              // 是否同步岗位
  syncResponsibilities: boolean;       // 是否同步职责（少数 HR 系统支持）
  includeInactive: boolean;            // 是否包含停用的部门/岗位
  departmentFilter?: {                 // 部门过滤（如只同步特定根部门下）
    rootCodes?: string[];              // 根部门编码列表
  };
}

/** HR 系统同步配置 */
export interface HRSyncConfig {
  enabled: boolean;                    // 是否启用自动同步
  source: HRSyncSource;               // 同步来源
  endpoint?: string;                   // HR 系统 API 端点（由后端安全存储）
  syncInterval: HRSyncInterval;        // 同步频率
  fieldMapping: HRFieldMapping;        // HR 字段 → 本体模型字段映射
  conflictStrategy: HRConflictStrategy;// 冲突策略
  syncScope: HRSyncScope;             // 同步范围
}

/** 同步冲突 */
export interface HRSyncConflict {
  type: 'department' | 'position';
  externalId: string;                  // HR 系统中的 ID
  localId: string;                     // 本地 ID
  field: string;                       // 冲突字段
  hrValue: string;                     // HR 侧值
  localValue: string;                  // 本地值
  resolution?: 'hr_wins' | 'local_wins' | 'merged'; // 解决方式
}

/** 同步错误 */
export interface HRSyncError {
  type: 'department' | 'position';
  externalId?: string;
  code: string;                        // 错误码，如 'REF_NOT_FOUND'
  message: string;                     // 错误描述
  detail?: string;                     // 详细信息
}

/** HR 同步结果 */
export interface HRSyncResult {
  syncId: string;                      // 同步记录ID
  triggeredAt: string;                 // 触发时间
  completedAt?: string;                // 完成时间
  status: 'success' | 'partial' | 'failed';
  source: HRSyncSource;
  summary: {
    departments: {
      total: number;                   // HR 侧部门总数
      created: number;                 // 本地新增
      updated: number;                 // 本地更新
      deactivated: number;             // 本地停用（HR 侧已不存在）
      unchanged: number;               // 无变化
    };
    positions: {
      total: number;
      created: number;
      updated: number;
      deactivated: number;
      unchanged: number;
    };
  };
  conflicts?: HRSyncConflict[];        // 冲突列表
  errors?: HRSyncError[];              // 错误列表
}

/** 组织模型 */
export interface OrganizationModel {
  id: string;
  departments: Department[];
  positions: Position[];
  createdAt: string;
  updatedAt: string;
  // --- HR 同步配置 ---
  syncConfig?: HRSyncConfig;           // 同步配置
  lastSyncResult?: HRSyncResult;       // 最近一次同步结果
}

/** 部门树节点 */
export interface DepartmentTreeNode {
  department: Department;
  children: DepartmentTreeNode[];
  positions: Position[];
}

// ========== 数据源层（Manifest spec.dataSources）==========
export type DataSourceType = 'api' | 'database' | 'file';

export interface DataSourceApiConfig {
  baseUrl?: string;
  entitySet?: string;
  /** 仅 SecretRef，禁止明文密钥（V10） */
  authSecretRef: string;
}

export interface DataSourceDefinition {
  id: string;
  name: string;
  type: DataSourceType;
  boundObjectTypeId?: string;
  api?: DataSourceApiConfig;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourcesModel {
  id: string;
  sources: DataSourceDefinition[];
  createdAt: string;
  updatedAt: string;
}

// ========== 项目状态 ==========
// ========== Transaction Boundary (B06) ==========
export interface TransactionBoundary {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  actionIds: string[];
  aggregateRootIds: string[];
  isolation: 'read_committed' | 'repeatable_read' | 'serializable';
  compensationActionId?: string;
}

// ========== Business Metrics (B05) ==========
export interface BusinessMetric {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  formula: string;
  unit: string;
  targetValue?: number;
  boundActionId: string;
  measurementType: 'automatic' | 'manual';
  dataSourceRef?: string;
}

export interface MetricsModel {
  id: string;
  name: string;
  version: string;
  domain: string;
  metrics: BusinessMetric[];
  createdAt: string;
  updatedAt: string;
}

// ========== Excel 导入解析结果 ==========
export interface ExcelParsedData {
  entities: Array<{
    name: string;
    nameEn: string;
    role: EntityRole;
    parentAggregateId?: string;
    projectName?: string;
    businessScenario?: string;
    description?: string;
    businessMeaning?: string;
    aliases?: string[];
  }>;
  attributes: Array<{
    entityNameEn: string;
    name: string;
    nameEn: string;
    dataType: AttributeDataType;
    required: boolean;
    unique: boolean;
    length?: number;
    precision?: number;
    scale?: number;
    defaultValue?: string;
    referencedEntityNameEn?: string;
    referenceType?: 'one_to_one' | 'one_to_many' | 'many_to_many';
    masterDataType?: string;
    enumRef?: string;
    description?: string;
    businessMeaning?: string;
    metadataTemplateName?: string;
  }>;
  relations: Array<{
    sourceEntityNameEn: string;
    name: string;
    type: 'one_to_one' | 'one_to_many' | 'many_to_many';
    targetEntityNameEn: string;
    foreignKey?: string;
    intermediateEntity?: string;
    cascade?: 'none' | 'cascade' | 'set_null';
    recursive?: boolean;
    directed?: boolean;
    description?: string;
  }>;
  stateMachines: Array<{
    entityNameEn: string;
    name: string;
    statusField: string;
    states: Array<{ name: string; isInitial: boolean; isTerminal: boolean }>;
    transitions: Array<{ name: string; from: string; to: string; triggerType: string }>;
  }>;
  rules: Array<{
    entityNameEn: string;
    name: string;
    type: RuleType;
    field?: string;
    conditionType: string;
    conditionValue?: string;
    severity: 'error' | 'warning' | 'info';
    errorMessage: string;
    priority?: number;
    enabled: boolean;
    description?: string;
  }>;
  events: Array<{
    entityNameEn: string;
    name: string;
    nameEn?: string;
    trigger: 'create' | 'update' | 'delete' | 'state_change' | 'custom';
    condition?: string;
    transactionPhase?: string;
    isDomainEvent: boolean;
    payloadFields?: string[];
    description?: string;
  }>;
  departments?: Array<{
    name: string;
    nameEn: string;
    code?: string;
    type: string;
    parentCode?: string;
    managerPositionCode?: string;
    description?: string;
    sortOrder?: number;
    status: 'active' | 'inactive';
  }>;
  positions?: Array<{
    name: string;
    nameEn: string;
    code?: string;
    departmentCode: string;
    parentPositionCode?: string;
    level?: number;
    roleNames: string[];
    headcount?: number;
    responsibilities: Array<{
      name: string;
      description?: string;
      scope: string;
      scopeRefs: string[];
      actions: string[];
      decisionAuthority: string;
      delegateToPositionCodes?: string[];
    }>;
    status: 'active' | 'inactive';
  }>;
  metrics?: Array<{
    id?: string;
    name: string;
    nameEn: string;
    description?: string;
    formula: string;
    unit?: string;
    targetValue?: number;
    boundActionId?: string;
    measurementType?: string;
    dataSourceRef?: string;
  }>;
  boundaries?: Array<{
    id?: string;
    name: string;
    nameEn: string;
    type: 'consistency' | 'transactional' | 'availability' | 'performance' | 'compliance' | 'security';
    scope: 'entity' | 'aggregate' | 'bounded_context' | 'process';
    scopeRef?: string;
    ruleExpression?: string;
    violationAction?: string;
    description?: string;
  }>;
  dataSources?: Array<{
    id?: string;
    name: string;
    type: 'api' | 'database' | 'file' | 'message_queue' | 'cache' | 'external_system';
    boundObjectTypeId?: string;
    api?: {
      authSecretRef?: string;
      baseUrl?: string;
      entitySet?: string;
    };
    description?: string;
  }>;
}

// ========== 参考文档 ==========

/** 参考文档 */
export interface ReferenceDocument {
  id: string;
  fileName: string;
  fileType: 'docx' | 'pdf' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'md' | 'csv';
  fileSize: number;
  uploadedAt: string;
  extractedText: string;
  textLength: number;
  parseStatus: 'pending' | 'success' | 'failed';
  parseError?: string;
  title?: string;
  summary?: string;
  extractedEntities?: ExtractedEntity[];
  extractionStatus?: 'none' | 'processing' | 'done' | 'failed';
}

/** 从文档提取的实体候选 */
export interface ExtractedEntity {
  name: string;
  nameEn?: string;
  description: string;
  source: string;
  confidence: number;
  attributes?: ExtractedAttribute[];
}

/** 从文档提取的属性候选 */
export interface ExtractedAttribute {
  name: string;
  nameEn?: string;
  dataType: string;
  description: string;
  required?: boolean;
  source: string;
}

// ========== Simplified Ontology Model (US-S02, ADR) ==========

export interface SemanticsBlock {
  terms?: string[];
  triggerPhrases?: string[];
  synonyms?: string[];
}

export interface BusinessNodeBase {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  semantics?: SemanticsBlock;
}

/** A — 业务价值域 */
export type ValueDomain = BusinessNodeBase;

/** B — 业务能力 */
export interface Capability extends BusinessNodeBase {
  parentId: string;
}

/** C — 业务场景 */
export interface Scenario extends BusinessNodeBase {
  parentId: string;
}

export type MetaDimension = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';

export type VersionPin = 'latest_confirmed' | { version: string };

export interface EpcStepElementRef {
  dimension: MetaDimension;
  elementId: string;
  versionPin: VersionPin;
  inlineNew?: boolean;
  inlinePayload?: unknown;
  elementName?: string;  // US-S15-U02: cached element name at reference time, for W-EPC-06 name consistency check
}

export interface EpcStep {
  id: string;
  name: string;
  elementRef?: EpcStepElementRef;
}

/** EPC — 业务流程（D），挂在 C 下 */
export interface EpcProcess extends BusinessNodeBase {
  parentId: string;
  steps: EpcStep[];
}

export type ElementVisibility = 'project' | 'domain_scoped' | 'private_draft';

/** 派生反向索引条目（rebuildUsageIndex 维护） */
export interface ElementUsageRef {
  epcId: string;
  stepId: string;
  scenarioId: string;
  versionPin: VersionPin;
}

export interface MetaElementBase {
  id: string;
  name: string;
  nameEn?: string;
  dimension: MetaDimension;
  // US-S15: EPC v3.1 linter rule context fields
  entityId?: string;           // W-EPC-10: bound Entity ID (E1 elements)
  stateMachineId?: string;     // W-EPC-15/17: bound StateMachine ID (E2 elements)
  constraintType?: string;     // W-EPC-17: constraint type (E7: 'guard' | 'transaction' | 'compensation')
  hasPolicy?: boolean;         // W-EPC-14: has AgentPolicy (E5 elements)
  eventId?: string;            // W-EPC-16: bound EventDefinition ID (E3 elements)
}

export interface MetaElement extends MetaElementBase {
  visibility?: ElementVisibility;
  ownerModuleId?: string;
  confirmedVersion?: string;
  usageRefs?: ElementUsageRef[];
}

export type ModuleKind =
  | 'A'
  | 'B'
  | 'C'
  | 'EPC'
  | 'E1'
  | 'E2'
  | 'E3'
  | 'E4'
  | 'E5'
  | 'E6'
  | 'E7'
  | 'E8';

export type ModuleStatus = 'draft' | 'confirmed' | 'archived';

export interface RefPin {
  moduleKind: ModuleKind;
  moduleId: string;
  pin: VersionPin;
}

export interface CrossModuleRef {
  targetModuleKind: ModuleKind;
  targetElementId: string;
  pin: VersionPin;
}

export interface ModuleVersionRecord {
  id: string;
  moduleKind: ModuleKind;
  moduleId: string;
  status: ModuleStatus;
  version?: string;
  confirmedAt?: string;
  createdAt: string;
  snapshot: unknown;
  parentVersionRefs?: RefPin[];
}

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
  governanceModel?: GovernanceModel | null;
  dataSourcesModel?: DataSourcesModel | null;
  metricsModel?: MetricsModel | null;
  organizationModel?: OrganizationModel | null;
  agentSemanticLayer?: AgentSemanticLayer | null;
  referenceDocuments?: ReferenceDocument[];
  /** 简化架构扩展（双写，见 docs/adr-simplified-ontology-model.md） */
  valueDomains?: ValueDomain[];
  capabilities?: Capability[];
  scenarios?: Scenario[];
  epcProcesses?: EpcProcess[];
  metaElements?: MetaElement[];
  moduleVersionRecords?: ModuleVersionRecord[];
  createdAt: string;
  updatedAt: string;
}
