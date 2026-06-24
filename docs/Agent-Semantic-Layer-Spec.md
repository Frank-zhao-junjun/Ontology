# Agent Semantic Layer（Agent 语义层）完整规格

> **版本**: v1.0  
> **定位**: 本体模型之上的第 11 个模型，专门解决"AI Agent 如何精准理解企业语义并正确执行任务"的问题。  
> **核心命题**: 当用户说"帮我创建一个采购订单"，Agent 如何从本体模型中推导出正确的 Action、参数、约束和上下文。

---

## 一、问题诊断

### 1.1 当前本体模型的 Agent 盲区

本体模型定义了"企业有什么"（Entity）、"能做什么"（Action）、"有什么规则"（Rule），但缺少一层关键的语义映射——**Agent 如何理解用户的自然语言意图并将其映射到模型元素**。

| 用户说 | Agent 需要知道 | 当前状态 |
|--------|---------------|:---:|
| "创建一个采购订单" | → 调用哪个 Action？参数是什么？ | ❌ |
| "审批通过" | → 映射到哪个 Transition/Action？ | ❌ |
| "再帮我加一个" | → "加"什么？加到哪？上下文是什么？ | ❌ |
| "数量填100" | → 100 是整数还是小数？单位是什么？ | ❌ |
| "这个规则还生效吗" | → 规则的生效时间范围？ | ❌ |
| "采购订单和销售订单有什么区别" | → 两者的语义关系？ | ❌ |
| "我没权限怎么办" | → 谁能做？升级路径？ | ❌ |

### 1.2 根因分析

本体模型是**结构化知识图谱**，Agent 需要的是**语义映射层**。两者之间的鸿沟：

```
用户自然语言 ──→ [Agent Semantic Layer] ──→ 本体模型元素
                      ↑
                 当前完全缺失
```

---

## 二、设计目标

### 2.1 Agent 的"一分钟理解"

Agent 加载 Agent Semantic Layer 后，应能回答：

| # | Agent 问题 | 数据来源 |
|---|-----------|---------|
| Q1 | 用户说 X 时我应该调用哪个 Action？ | Intent → Action 映射 |
| Q2 | 这个 Action 需要哪些参数？每个参数的类型、校验、示例？ | ParameterSpec |
| Q3 | 参数值不完整时我应该追问什么？ | SlotFillingStrategy |
| Q4 | 当前对话上下文是什么？用户说的"它"指什么？ | DialogContext |
| Q5 | 这个实体和其他实体有什么关系？ | SemanticRelation |
| Q6 | 这个术语在不同上下文中有不同含义吗？ | BusinessTerm |
| Q7 | 操作失败了怎么办？ | ErrorRecovery |
| Q8 | 这个规则现在生效吗？ | TemporalValidity |
| Q9 | 哪些操作我可以自主执行？哪些需要确认？ | AgentPolicy |
| Q10 | 用户说的"物料编码"和"订单.物料编码"是同一个东西吗？ | SemanticFieldMapping |

### 2.2 设计原则

1. **映射而非替代** — Agent Semantic Layer 是本体模型之上的索引/映射层，不替代本体模型
2. **可计算** — 所有映射关系都是结构化 ID 引用，Agent 可直接查找
3. **渐进增强** — 所有字段可选，缺失时 Agent 降级到本体模型直接查询
4. **领域无关** — 语义层框架通用，具体内容由业务架构师填充

---

## 三、数据模型

### 3.1 Intent（意图定义）

Agent 语义层的核心入口——将用户的自然语言意图映射到可执行的 Action。

```typescript
interface Intent {
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

interface SlotFillingStrategy {
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

interface IntentSlot {
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

interface SlotValidation {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'datetime' | 'enum' | 'regex';
  min?: number;
  max?: number;
  pattern?: string;
  enumValues?: string[];
  errorMessage?: string;
}

interface SlotCandidate {
  value: string;
  label: string;
  description?: string;
}

interface ContextConstraint {
  /** 约束类型 */
  type: 'entity_state' | 'user_role' | 'previous_action' | 'time_range';
  /** 约束值 */
  value: string;
  /** 约束不满足时的提示 */
  failureMessage?: string;
}

interface IntentExample {
  /** 用户输入 */
  userInput: string;
  /** Agent 响应 */
  agentResponse: string;
  /** 参数提取结果 */
  extractedSlots: Record<string, string>;
}
```

### 3.2 DialogContext（对话上下文模型）

解决"再帮我加一个"这类指代消解问题。

```typescript
interface DialogContext {
  /** 上下文生命周期 */
  ttl: number;  // 秒，超时后自动清除
  
  /** 当前聚焦的实体 */
  focusedEntity?: {
    entityId: string;
    entityName: string;
    entityNameEn: string;
    instanceId?: string;  // 运行时实例 ID
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

interface ContextEntityRef {
  entityId: string;
  entityName: string;
  referenceType: 'explicit' | 'anaphora' | 'demonstrative';
  mentionText: string;
  lastMentionTurn: number;
}
```

### 3.3 SemanticRelation（语义关系）

超越结构关系（one_to_many），定义实体间的语义关系。

```typescript
interface SemanticRelation {
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

type SemanticRelationType =
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
```

### 3.4 BusinessTerm（业务术语词典）

统一的业务术语定义，消除歧义。

```typescript
interface BusinessTerm {
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

interface TermExample {
  context: string;
  usage: string;
}

interface BusinessTermModelRef {
  modelType: 'entity' | 'attribute' | 'action' | 'state' | 'event' | 'rule' | 'metric';
  modelId: string;
  modelName: string;
}
```

### 3.5 ErrorRecovery（错误恢复策略）

定义操作失败后的恢复路径。

```typescript
interface ErrorRecovery {
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

type ErrorType =
  | 'validation_error'
  | 'permission_denied'
  | 'resource_not_found'
  | 'state_conflict'
  | 'timeout'
  | 'external_service_error'
  | 'data_integrity_error'
  | 'business_rule_violation';

type ErrorRecoveryStrategy =
  | 'retry'           // 重试
  | 'fallback'        // 执行回退动作
  | 'escalate'        // 升级到人工
  | 'compensate'      // 执行补偿动作
  | 'skip'            // 跳过（非关键操作）
  | 'ask_user';       // 询问用户
```

### 3.6 TemporalValidity（时效性标记）

为模型元素添加时间维度。

```typescript
interface TemporalValidity {
  /** 关联的模型元素 */
  targetType: 'entity' | 'rule' | 'action' | 'state' | 'event' | 'relation' | 'metric';
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
```

### 3.7 SemanticFieldMapping（跨实体字段映射）

自动推断"物料.编码"和"订单.物料编码"是同一个语义字段。

```typescript
interface SemanticFieldMapping {
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

interface FieldRef {
  entityId: string;
  entityNameEn: string;
  attributeId: string;
  attributeName: string;
}
```

### 3.8 AgentPolicy（Agent 行为策略）

定义 Agent 的行为边界。

```typescript
interface AgentPolicy {
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

type AgentPolicyScope = 
  | { type: 'global' }
  | { type: 'intent'; intentIds: string[] }
  | { type: 'entity'; entityIds: string[] }
  | { type: 'action'; actionIds: string[] }
  | { type: 'domain'; domains: string[] };

interface AgentPolicyRule {
  /** 条件表达式 */
  condition: string;
  /** 条件满足时的动作 */
  action: 'allow' | 'deny' | 'confirm' | 'escalate';
  /** 动作说明 */
  description: string;
}
```

### 3.9 AgentSemanticLayer（聚合入口）

```typescript
interface AgentSemanticLayer {
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
```

---

## 四、Agent 工作流

### 4.1 意图识别 → 槽位填充 → 执行

```
用户输入: "帮我创建一个采购订单，供应商是华为，数量100个"

Step 1: 意图识别
  ┌─────────────────────────────────────────┐
  │ 匹配 Intent.triggerPhrases              │
  │ "创建" + "采购订单" → Intent: create_po │
  │ confidence: 0.95                        │
  └─────────────────────────────────────────┘
                    ↓
Step 2: 槽位填充
  ┌─────────────────────────────────────────┐
  │ Intent.slotFilling.slots:               │
  │ ✅ supplier = "华为"                     │
  │ ✅ quantity = 100                        │
  │ ❌ deliveryDate = ?                      │
  │ ❌ paymentTerms = ?                      │
  │                                         │
  │ requiredSlots 全部填充？                 │
  │ deliveryDate 是必填 → 追问               │
  └─────────────────────────────────────────┘
                    ↓
Step 3: 追问缺失槽位
  ┌─────────────────────────────────────────┐
  │ Agent: "好的，还需要确认交货日期，       │
  │        您希望什么时候交货？"              │
  │                                         │
  │ 用户: "下周五"                           │
  │ ✅ deliveryDate = "2025-01-24"           │
  └─────────────────────────────────────────┘
                    ↓
Step 4: 确认 + 执行
  ┌─────────────────────────────────────────┐
  │ Agent: "确认创建采购订单：               │
  │        供应商=华为，数量=100，            │
  │        交货日期=2025-01-24，确认吗？"     │
  │                                         │
  │ 用户: "确认"                             │
  │ → 调用 Action: createPurchaseOrder      │
  │ → 参数: { supplier, quantity, date }    │
  └─────────────────────────────────────────┘
```

### 4.2 对话上下文维护

```
Turn 1:
  用户: "帮我查一下采购订单 PO-2024-001"
  Agent: [执行查询，返回结果]
  DialogContext: { focusedEntity: PO-2024-001, lastAction: query, ... }

Turn 2:
  用户: "审批通过"
  Agent: [上下文推断] focusedEntity = PO-2024-001
  Agent: [意图匹配] "审批通过" → Intent: approve_po
  Agent: [状态校验] PO-2024-001.currentState = "pending_approval" ✅
  Agent: [执行审批]
  
Turn 3:
  用户: "再帮我创建一个，供应商换成中兴"
  Agent: [上下文推断] lastAction = createPurchaseOrder
  Agent: [槽位继承] 复用上次参数，替换 supplier
  Agent: [执行创建]
```

### 4.3 错误恢复

```
用户: "帮我审批通过 PO-2024-001"

Agent: [执行 approveAction]
系统返回: Error "订单金额超出剩余预算"

Agent: [查找 ErrorRecovery]
  errorPattern: "超出.*预算"
  strategy: ask_user
  agentMessage: "订单金额超出剩余预算。建议：1) 调整订单金额 2) 申请预算追加"

Agent 回复: "无法审批通过：订单金额超出剩余预算。您希望：1) 调整订单金额 2) 申请预算追加？"
```

---

## 五、User Stories

### US-AS-1: 意图管理
- **角色**: 业务架构师
- **需求**: 创建和管理 Intent，将自然语言短语映射到 Action
- **验收**:
  - Intent 列表页：展示所有意图，支持搜索/筛选
  - Intent 编辑对话框：配置 triggerPhrases/actionId/slotFilling/requiredRoles/requiresConfirmation
  - triggerPhrases 支持标签式多值输入
  - actionId 从已有 Action 列表选择
  - slotFilling.slots 自动从 Action.parameters 生成，可手动调整
  - examples 支持添加/编辑示例对话

### US-AS-2: 槽位填充配置
- **角色**: 业务架构师
- **需求**: 为每个 Intent 配置参数槽位的填充策略
- **验收**:
  - 槽位列表展示：paramName/displayName/prompt/required/inferableFromContext
  - 拖拽调整 fillOrder
  - validation 配置（类型/范围/正则/枚举）
  - candidates 配置（枚举值候选列表）
  - 预览模式：模拟对话填充流程

### US-AS-3: 语义关系管理
- **角色**: 业务架构师
- **需求**: 定义实体间的语义关系
- **验收**:
  - 语义关系列表页
  - 关系编辑对话框：选择 type/sourceEntityId/targetEntityId
  - 关系图谱可视化（力导向图）
  - 传递性/对称性配置
  - 与 EPC 全域关联层的关系引用

### US-AS-4: 业务术语词典
- **角色**: 业务架构师
- **需求**: 维护统一的业务术语词典
- **验收**:
  - 术语列表页：搜索/筛选/排序
  - 术语编辑对话框：term/definition/synonyms/examples/modelRefs
  - 术语与模型元素的双向关联
  - 术语歧义检测（同名词不同定义）
  - 术语导入/导出（CSV/JSON）

### US-AS-5: 错误恢复配置
- **角色**: 业务架构师
- **需求**: 为 Action 配置错误恢复策略
- **验收**:
  - ErrorRecovery 列表页（按 Action 分组）
  - 编辑对话框：errorType/errorPattern/strategy/recoveryActionId/agentMessage
  - errorPattern 支持正则表达式测试
  - recoveryActionId 从已有 Action 列表选择

### US-AS-6: Agent 策略配置
- **角色**: 管理员
- **需求**: 定义 Agent 的行为边界
- **验收**:
  - AgentPolicy 列表页
  - 编辑对话框：roleId/policyType/scope/rules
  - scope 支持全局/意图/实体/操作/领域多级范围
  - rules 支持条件表达式编辑
  - 策略冲突检测（同一 scope 多条策略）

### US-AS-7: 跨实体字段映射
- **角色**: 业务架构师
- **需求**: 定义跨实体的字段等价关系
- **验收**:
  - SemanticFieldMapping 列表页
  - 编辑对话框：sourceField/targetField/type/transformRule
  - 自动发现候选映射（同名/同类型字段）
  - 映射图谱可视化

### US-AS-8: Agent 语义层导出
- **角色**: Agent 开发者
- **需求**: 导出完整的 AgentSemanticLayer JSON
- **验收**:
  - GET /api/agent-semantic-layer 返回完整 JSON
  - 包含所有 intents/terms/relations/recoveries/policies/mappings
  - 包含 metadata.coverage 统计
  - 支持按领域筛选导出

### US-AS-9: 语义完备性仪表盘
- **角色**: 业务架构师
- **需求**: 可视化查看语义层的覆盖度
- **验收**:
  - 仪表盘页面：总览卡片（意图数/术语数/关系数/覆盖率）
  - 覆盖率图表：entitiesWithIntents/totalEntities
  - 缺失提醒：有 Action 但无 Intent 的实体列表
  - 无 ErrorRecovery 的 Action 列表
  - 无 AgentPolicy 的 Role 列表

---

## 六、校验规则

| 编号 | 规则 | 级别 | 说明 |
|------|------|------|------|
| V-AS-01 | Intent.actionId 引用完整性 | error | 引用的 Action 必须存在 |
| V-AS-02 | Intent.targetEntityId 引用完整性 | error | 引用的 Entity 必须存在 |
| V-AS-03 | Intent.slotFilling.slots[].paramName 必须在 Action.parameters 中 | error | 槽位必须对应真实参数 |
| V-AS-04 | Intent.requiredSlots 必须是 slots 的子集 | error | 必填槽位必须已定义 |
| V-AS-05 | SemanticRelation 两端实体必须存在 | error | 引用完整性 |
| V-AS-06 | BusinessTerm.modelRefs 引用完整性 | error | 模型引用必须存在 |
| V-AS-07 | ErrorRecovery.actionId 引用完整性 | error | 关联的 Action 必须存在 |
| V-AS-08 | ErrorRecovery.recoveryActionId 引用完整性 | error | 恢复动作必须存在 |
| V-AS-09 | AgentPolicy.roleId 引用完整性 | error | 关联的 Role 必须存在 |
| V-AS-10 | SemanticFieldMapping 两端字段必须存在 | error | 引用完整性 |
| V-AS-11 | TemporalValidity.targetId 引用完整性 | error | 关联的模型元素必须存在 |
| V-AS-12 | TemporalValidity 时间范围合法性 | error | effectiveDate < expiryDate |
| V-AS-13 | Intent.triggerPhrases 非空 | warning | 无触发短语的意图无法匹配 |
| V-AS-14 | 同一 Action 无 ErrorRecovery | warning | 无恢复策略的操作失败后 Agent 无措 |
| V-AS-15 | 同一 Role 无 AgentPolicy | warning | 无策略的角色 Agent 行为不可控 |

---

## 七、UI 设计

### 7.1 语义层管理入口

```
┌─────────────────────────────────────────────────────────────┐
│ 本体建模工具                                                  │
├─────────────────────────────────────────────────────────────┤
│ [领域选择] [项目管理] [建模工作台] [EPC] [语义层] [手册]      │  ← 新增语义层入口
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 意图管理  │ │ 术语词典  │ │ 语义关系  │ │ 错误恢复  │      │
│  │   12      │ │   89     │ │   34     │ │   8      │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Agent策略 │ │ 字段映射  │ │ 时效管理  │ │ 完备性    │      │
│  │   5       │ │   23     │ │   15     │ │   78%    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 意图编辑器

```
┌──────────────────────────────────────────────────────────────┐
│ 编辑意图: 创建采购订单                                         │
├──────────────────────────────────────────────────────────────┤
│ 基本信息                                                      │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ 名称: [创建采购订单]                                        ││
│ │ 分类: [crud ▾]          优先级: [10]                        ││
│ │ 目标实体: [采购订单 (PurchaseOrder) ▾]                      ││
│ │ 目标动作: [createPurchaseOrder ▾]                           ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ 触发短语                                                      │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ [创建采购订单 ×] [新建PO ×] [帮我下采购单 ×] [+ 添加]       ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ 否定短语                                                      │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ [查询采购订单 ×] [查看PO ×] [+ 添加]                        ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ ▼ 槽位填充策略                                                │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ 填充顺序: [supplier] → [quantity] → [deliveryDate] → [...] ││
│ │ ☑ 允许批量填充                                              ││
│ │                                                             ││
│ │ 槽位列表:                                                   ││
│ │ ┌──────────────────────────────────────────────────────┐   ││
│ │ │ # | 参数名       | 显示名   | 追问话术          | 必填│   ││
│ │ │ 1 | supplier     | 供应商   | 请选择供应商      | ☑  │   ││
│ │ │ 2 | quantity     | 数量     | 请输入数量        | ☑  │   ││
│ │ │ 3 | deliveryDate | 交货日期 | 请选择交货日期    | ☑  │   ││
│ │ │ 4 | paymentTerms | 付款条件 | 请选择付款条件    | ☐  │   ││
│ │ │ 5 | remarks      | 备注     | 有什么备注吗？    | ☐  │   ││
│ │ └──────────────────────────────────────────────────────┘   ││
│ │                                        [编辑槽位] [拖拽排序] ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ ▼ 权限与确认                                                  │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ 所需角色: [采购员 ▾] [采购经理 ▾]                           ││
│ │ ☑ 需要用户确认                                              ││
│ │ 确认文案: [确认创建采购订单？供应商={supplier}，数量=...]     ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ ▼ 上下文约束                                                  │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ [+ 添加约束]                                                ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ ▼ 示例对话                                                    │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ 用户: 帮我创建一个采购订单，供应商华为，数量100              ││
│ │ Agent: 好的，还需要确认交货日期，您希望什么时候交货？        ││
│ │ 用户: 下周五                                                ││
│ │ Agent: 确认创建采购订单：供应商=华为，数量=100，...          ││
│ │                                        [编辑] [删除]        ││
│ │ ────────────────────────────────────────────────────────   ││
│ │ [+ 添加示例]                                                ││
│ └────────────────────────────────────────────────────────────┘│
│                                                               │
│ [取消] [保存]                                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 八、实施计划

### Phase 1: 类型定义 + Store（1 周）
- 更新 `src/types/ontology.ts`：新增所有 Agent Semantic Layer 类型
- 新增 `src/store/agent-semantic-store.ts`：语义层专用 store
- 新增校验规则 V-AS-01~15

### Phase 2: 意图管理 + 槽位填充（1 周）
- 意图列表页 + 编辑对话框
- 槽位填充策略编辑器
- 示例对话编辑器

### Phase 3: 术语词典 + 语义关系（1 周）
- 业务术语词典 CRUD
- 语义关系管理 + 图谱可视化
- 跨实体字段映射

### Phase 4: 错误恢复 + Agent 策略（1 周）
- ErrorRecovery 配置
- AgentPolicy 配置
- 策略冲突检测

### Phase 5: 导出 + 仪表盘（1 周）
- API: GET /api/agent-semantic-layer
- 语义完备性仪表盘
- 与 EPC 全域关联层集成

---

## 九、与现有模型的关联

| 语义层元素 | 关联的本体模型元素 |
|-----------|------------------|
| Intent | Action, Entity, GovernanceRole |
| IntentSlot | Action.parameters |
| DialogContext | Entity, Action |
| SemanticRelation | Entity, Relation |
| BusinessTerm | Entity, Attribute, Action, State, Event, Rule, Metric |
| ErrorRecovery | Action, Transition.compensationAction |
| TemporalValidity | Entity, Rule, Action, State, Event, Relation, Metric |
| SemanticFieldMapping | Entity, Attribute |
| AgentPolicy | GovernanceRole, Intent, Action, Entity |

---

## 十、Agent 完备性再评估（目标）

实施 Agent Semantic Layer 后，重新评估 10 个维度：

| 维度 | 实施前 | 实施后 | 提升 |
|------|:---:|:---:|:---:|
| 身份识别 | 8 | 9 | +1 (BusinessTerm 增强) |
| 可操作性 | 6 | 9 | +3 (Intent + SlotFilling) |
| 时机判断 | 7 | 9 | +2 (EntityLifecycle) |
| 约束感知 | 7 | 8 | +1 (SlotValidation) |
| 后果预知 | 6 | 8 | +2 (ErrorRecovery) |
| 归属认知 | 6 | 8 | +2 (AgentPolicy) |
| 数据溯源 | 5 | 7 | +2 (SemanticFieldMapping) |
| 度量感知 | 5 | 5 | — (待指标体系增强) |
| 关联理解 | 5 | 9 | +4 (SemanticRelation) |
| 意图映射 | 0 | 9 | +9 (Intent 核心) |
| **总分** | **55** | **81** | **+26** |
