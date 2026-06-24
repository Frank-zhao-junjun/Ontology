# Entity Lifecycle 完整规格

> **版本**: v2.0（修正版）
> **定位**: 将 State 从"标签"升级为"一等公民"，让 Agent 无需跨模型拼凑即可完整理解 Entity 生命周期。
> **与代码对齐**: 本 spec 所有类型、组件、API 均基于 `src/types/ontology.ts`、`src/store/ontology-store.ts`、`src/components/ontology/behavior-model-editor.tsx` 的实际结构编写。

---

## 一、问题诊断

### 1.1 当前状态（代码现状）

`src/types/ontology.ts` 中 `State` 定义（行 251-258）：

```typescript
export interface State {
  id: string;
  name: string;
  description?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  color?: string;
}
```

`Transition` 定义（行 268-279）：

```typescript
export interface Transition {
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
}
```

`Action` 定义（行 289-310）：

```typescript
export interface Action {
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
  transition?: string;
  ruleRefs?: string[];
  template?: string;
  recipients?: string[];
  script?: string;
}
```

### 1.2 Agent 视角的碎片化

Agent 想理解"采购订单"的完整生命周期，需要跨 4 个模型自行拼凑：

| 信息 | 所在模型 | Agent 能否找到 |
|------|---------|:---:|
| 有哪些状态 | StateMachine.states | ✅ |
| 状态间如何转换 | Transition.from→to | ✅ |
| 转换触发条件 | Transition.preConditions | ⚠️ 字符串数组，无结构化 |
| 转换后做什么 | Transition.postActions | ⚠️ 字符串数组，无结构化 |
| 每个状态能执行什么操作 | Action（分散在 BehaviorModel.actions） | ❌ 无关联 |
| 每个状态有哪些约束 | Rule（分散在 RuleModel.rules） | ❌ 无关联 |
| 谁能在哪个状态操作 | GovernanceRole + Action.requiredRoles | ❌ 无状态维度 |
| 状态超时怎么办 | — | ❌ 完全缺失 |
| 操作失败如何回滚 | — | ❌ 完全缺失 |
| 字段在不同状态下的可见性 | — | ❌ 完全缺失 |
| 生命周期审计追溯 | — | ❌ 完全缺失 |

---

## 二、设计目标

### 2.1 Agent 的"一句话理解"

| # | Agent 问题 | 数据来源 |
|---|-----------|---------|
| Q1 | 这个实体有哪些状态？ | StateMachine.states |
| Q2 | 当前处于什么状态？ | StateMachine.statusField → Entity 实例字段 |
| Q3 | 现在能做什么操作？ | State.availableActions |
| Q4 | 谁来做？ | State.allowedRoles + Action.requiredRoles |
| Q5 | 有什么限制？ | State.constraints + Transition.guardCondition |
| Q6 | 做完会发生什么？ | Transition.sideEffects + Transition.publishEventId |
| Q7 | 做错了怎么回滚？ | Transition.compensationAction |
| Q8 | 状态卡住了怎么办？ | State.timeout |
| Q9 | 哪些字段现在可编辑？ | State.dataVisibility |
| Q10 | 这个操作的历史记录？ | LifecycleAuditEntry |

### 2.2 设计原则

1. **State 是一等公民** — 所有生命周期信息以 State 为中心组织
2. **自包含** — Agent 读取一个 State 即可获得该状态下的完整操作能力
3. **可执行** — 所有引用都是结构化 ID，Agent 可直接查找
4. **可审计** — 每次状态变更记录完整上下文
5. **向后兼容** — 现有 State/Transition/Action 字段全部保留，新增字段可选（`?`）

---

## 三、类型定义变更

### 3.1 新增子类型

以下类型需新增到 `src/types/ontology.ts`，放在 `State` 定义之前：

```typescript
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
```

### 3.2 State 增强

修改 `src/types/ontology.ts` 中 `State` 接口（行 251-258），新增以下可选字段：

```typescript
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
```

### 3.3 Transition 增强

修改 `src/types/ontology.ts` 中 `Transition` 接口（行 268-279），新增以下可选字段：

```typescript
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
```

### 3.4 Action 增强

修改 `src/types/ontology.ts` 中 `Action` 接口（行 289-310），新增以下可选字段：

```typescript
export interface Action {
  // ===== 现有字段（保留，不变） =====
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
  sideEffects?: SideEffect[];   // 注意：SideEffect 已存在于 types/ontology.ts 行 318-325，无需重新定义
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
```

### 3.5 新增：EntityLifecycle（聚合视图）

新增到 `src/types/ontology.ts`，放在 `LifecycleAuditEntry` 之后：

```typescript
/**
 * EntityLifecycle 是 Agent 读取 Entity 生命周期的一站式入口。
 * 它聚合了 StateMachine + Action + Rule + Event + Governance 中与生命周期相关的所有信息。
 * 通过 GET /api/entity-lifecycle?entityId=xxx 获取。
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
```

---

## 四、Store 变更

### 4.1 新增方法

在 `src/store/ontology-store.ts` 中新增：

```typescript
// Entity Lifecycle 聚合查询（纯计算，不修改状态）
getEntityLifecycle: (entityId: string) => EntityLifecycle | null;

// 生命周期审计
addLifecycleAuditEntry: (entry: LifecycleAuditEntry) => void;
getAuditTrail: (entityId: string) => LifecycleAuditEntry[];
clearAuditTrail: (entityId: string) => void;
```

### 4.2 getEntityLifecycle 实现逻辑

```typescript
getEntityLifecycle: (entityId: string) => {
  const { project } = get();
  if (!project) return null;

  const entity = project.dataModel?.entities.find(e => e.id === entityId);
  if (!entity) return null;

  const stateMachine = project.behaviorModel?.stateMachines.find(sm => sm.entity === entityId);
  if (!stateMachine) return null;

  const allActions = project.behaviorModel?.actions || [];
  const allRules = project.ruleModel?.rules || [];
  const allEvents = project.eventModel?.events || [];
  const allRoles = project.governanceModel?.roles || [];

  // 按状态分组
  const actionsByState: Record<string, Action[]> = {};
  const rulesByState: Record<string, Rule[]> = {};
  const eventsByState: Record<string, EventDefinition[]> = {};
  const rolesByState: Record<string, GovernanceRole[]> = {};

  for (const state of stateMachine.states) {
    // 从 State.availableActions 收集
    actionsByState[state.id] = (state.availableActions || [])
      .map(aid => allActions.find(a => a.id === aid))
      .filter(Boolean) as Action[];

    // 从 State.constraints 收集
    rulesByState[state.id] = (state.constraints || [])
      .map(rid => allRules.find(r => r.id === rid))
      .filter(Boolean) as Rule[];

    // 从 State.triggerableEvents 收集
    eventsByState[state.id] = (state.triggerableEvents || [])
      .map(eid => allEvents.find(e => e.id === eid))
      .filter(Boolean) as EventDefinition[];

    // 从 State.allowedRoles 收集
    rolesByState[state.id] = (state.allowedRoles || [])
      .map(rid => allRoles.find(r => r.id === rid))
      .filter(Boolean) as GovernanceRole[];
  }

  return {
    entityId,
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
    auditTrail: get().lifecycleAuditTrail?.filter(e => e.entityId === entityId) || [],
    stats: {
      totalStates: stateMachine.states.length,
      totalTransitions: stateMachine.transitions.length,
      totalActions: allActions.filter(a => a.targetEntityId === entityId).length,
    },
  };
};
```

### 4.3 State 接口扩展

在 `OntologyState` 接口中新增：

```typescript
lifecycleAuditTrail: LifecycleAuditEntry[];
```

---

## 五、API 路由

### 5.1 GET /api/entity-lifecycle

新建 `src/app/api/entity-lifecycle/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';

// 注意：此 API 依赖客户端 store 数据。
// 由于 store 使用 zustand persist（localStorage），
// 此 API 从请求中接收项目数据或使用服务端缓存。
// 实际实现中，项目数据通过请求体或查询参数传递。

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get('entityId');

  if (!entityId) {
    return NextResponse.json({ success: false, error: '缺少 entityId 参数' }, { status: 400 });
  }

  // 从客户端 store 获取数据的逻辑
  // 由于 store 在客户端，此 API 作为代理层
  // 前端调用时传入项目数据：
  // POST /api/entity-lifecycle  body: { entityId, project }

  return NextResponse.json({ success: false, error: '请使用 POST 方法并传入项目数据' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityId, project } = body;

    if (!entityId || !project) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const entity = project.dataModel?.entities?.find((e: any) => e.id === entityId);
    if (!entity) {
      return NextResponse.json({ success: false, error: '实体不存在' }, { status: 404 });
    }

    const stateMachine = project.behaviorModel?.stateMachines?.find((sm: any) => sm.entity === entityId);
    if (!stateMachine) {
      return NextResponse.json({ success: false, error: '该实体未配置状态机' }, { status: 404 });
    }

    const allActions = project.behaviorModel?.actions || [];
    const allRules = project.ruleModel?.rules || [];
    const allEvents = project.eventModel?.events || [];
    const allRoles = project.governanceModel?.roles || [];

    const actionsByState: Record<string, any[]> = {};
    const rulesByState: Record<string, any[]> = {};
    const eventsByState: Record<string, any[]> = {};
    const rolesByState: Record<string, any[]> = {};

    for (const state of stateMachine.states) {
      actionsByState[state.id] = (state.availableActions || [])
        .map((aid: string) => allActions.find((a: any) => a.id === aid))
        .filter(Boolean);
      rulesByState[state.id] = (state.constraints || [])
        .map((rid: string) => allRules.find((r: any) => r.id === rid))
        .filter(Boolean);
      eventsByState[state.id] = (state.triggerableEvents || [])
        .map((eid: string) => allEvents.find((e: any) => e.id === eid))
        .filter(Boolean);
      rolesByState[state.id] = (state.allowedRoles || [])
        .map((rid: string) => allRoles.find((r: any) => r.id === rid))
        .filter(Boolean);
    }

    return NextResponse.json({
      success: true,
      data: {
        entityId,
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
        stats: {
          totalStates: stateMachine.states.length,
          totalTransitions: stateMachine.transitions.length,
          totalActions: allActions.filter((a: any) => a.targetEntityId === entityId).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
```

---

## 六、校验规则

| 编号 | 规则 | 级别 | 说明 |
|------|------|:---:|------|
| V-LC-01 | 非终止状态必须有 outgoing transition | warning | 否则实体将卡在该状态 |
| V-LC-02 | 非初始状态必须有 incoming transition | warning | 否则该状态永远无法到达 |
| V-LC-03 | availableActions 引用完整性 | error | 引用的 Action ID 必须在 BehaviorModel.actions 中存在 |
| V-LC-04 | constraints 引用完整性 | error | 引用的 Rule ID 必须在 RuleModel.rules 中存在 |
| V-LC-05 | allowedRoles 引用完整性 | error | 引用的 Role ID 必须在 GovernanceModel.roles 中存在 |
| V-LC-06 | timeout.targetStateId 有效性 | error | 目标状态必须存在于同一 StateMachine 中且不同于当前状态 |
| V-LC-07 | guardCondition 语法校验 | error | 表达式语法必须合法（不含未闭合括号、非法运算符） |
| V-LC-08 | compensationAction 引用完整性 | error | 引用的 Action ID 必须存在 |
| V-LC-09 | dataVisibility 字段有效性 | error | 字段名必须在 Entity.attributes 的 nameEn 中存在 |
| V-LC-10 | 孤立状态检测 | warning | 无 incoming 且无 outgoing 且非 initial |
| V-LC-11 | entryActions 引用完整性 | error | 引用的 Action ID 必须存在 |
| V-LC-12 | exitActions 引用完整性 | error | 引用的 Action ID 必须存在 |
| V-LC-13 | triggerableEvents 引用完整性 | error | 引用的 EventDefinition ID 必须存在 |
| V-LC-14 | fallbackActionId 引用完整性 | error | 引用的 Action ID 必须存在 |
| V-LC-15 | 终止状态不应有 outgoing transition | warning | 终止状态是生命周期的终点 |

---

## 七、UI 变更

### 7.1 State 编辑对话框增强

在 `src/components/ontology/behavior-model-editor.tsx` 的 State 编辑对话框中，新增「生命周期配置」折叠面板。

**现有代码位置**: `handleAddState`（行 105-131）使用 `editingState` state 管理表单。

**变更内容**:
- 在 State 表单中新增折叠面板 `<Collapsible>`，包含：
  - 语义标签下拉（semanticTag）
  - 进入动作多选（entryActions，从 actions 列表选取）
  - 离开动作多选（exitActions）
  - 可用操作多选（availableActions）
  - 约束规则多选（constraints，从 rules 列表选取）
  - 操作角色多选（allowedRoles，从 governanceRoles 列表选取）
  - 超时配置（timeout: duration + unit + onTimeout + targetStateId/notifyRoleIds/escalateRoleId）
  - 字段可见性（dataVisibility: 从 entity.attributes 选取分配到 visible/editable/hidden/required）
  - 审计开关（auditEntry/auditExit checkbox）
  - 可触发事件多选（triggerableEvents，从 events 列表选取）

### 7.2 Transition 编辑对话框增强

在 Transition 编辑对话框中新增「高级配置」折叠面板。

**现有代码位置**: `handleAddTransition`（行 133-198）使用 `editingTransition` state。

**变更内容**:
- 守卫条件表达式输入（guardCondition）+ 失败提示（guardFailureMessage）
- 补偿动作单选（compensationAction，从 actions 列表选取）
- 发布事件单选（publishEventId，从 events 列表选取）
- 通知角色多选（notifyRoleIds）
- 审批开关（requiresApproval）+ 审批角色多选（approvalRoleIds）
- 审计开关（auditLog checkbox）
- 优先级数字输入（priority）
- 语义标签下拉（semanticTag）

### 7.3 Action 编辑对话框增强

在 Action 编辑对话框中新增「Agent 语义」折叠面板。

**现有代码位置**: `handleSaveAction`（行 245-259）使用 `editingAction` state。

**变更内容**:
- 自然语言别名标签输入（aliases，tag-input 组件）
- 触发短语标签输入（triggerPhrases）
- 成功/失败消息模板输入（successMessage/failureMessage）
- 回退动作单选（fallbackActionId，从 actions 列表选取）
- 二次确认开关（requiresConfirmation）+ 确认文案（confirmationMessage）
- 操作超时配置（timeout: duration + unit + onTimeout + maxRetries）
- 幂等键模板输入（idempotencyKeyTemplate）
- 事务隔离级别下拉（isolationLevel）

### 7.4 生命周期 Tab（新增）

在 `modeling-workspace.tsx` 的 Tab 区新增「生命周期」Tab。

**布局**:
```
┌─────────────────────────────────────────────────────────────┐
│ [数据模型] [行为模型] [规则模型] [事件模型] [EPC] [生命周期] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │   状态流转图          │  │  状态详情: pending_approval   │ │
│  │  (Mermaid 渲染)      │  │                              │ │
│  │                     │  │  语义标签: reviewing         │ │
│  │  [草稿] ──→ [待审批] │  │  超时: 48小时后自动驳回       │ │
│  │    │          │     │  │                              │ │
│  │    ↓          ↓     │  │  可用操作:                    │ │
│  │  [已驳回]  [已通过]  │  │  ✅ 审批通过 / 驳回 / 补充    │ │
│  │              │     │  │                              │ │
│  │              ↓     │  │  约束规则:                    │ │
│  │           [已归档]   │  │  📏 金额上限校验 (error)      │ │
│  │                     │  │                              │ │
│  │                     │  │  操作角色:                    │ │
│  │                     │  │  👤 采购经理 / 财务主管       │ │
│  │                     │  │                              │ │
│  │                     │  │  字段可见性:                  │ │
│  │                     │  │  ✏️ 审批意见  🔒 订单金额     │ │
│  └─────────────────────┘  └──────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 审计记录                                    [导出] [筛选] ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ 2024-01-15 14:30 | state_entry | →待审批 | 系统自动 | ✅ ││
│  │ 2024-01-15 10:00 | action      | 提交审批 | 张三     | ✅ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**实现要点**:
- 左侧状态流转图使用 Mermaid 渲染（`stateDiagram-v2`），从 StateMachine.states + transitions 动态生成
- 点击状态节点 → 右侧显示该状态的完整详情
- 状态详情从 `getEntityLifecycle(entityId)` 聚合数据渲染
- 审计记录从 `lifecycleAuditTrail` 过滤当前 entityId

---

## 八、与现有代码的兼容性

### 8.1 不影响现有功能

- 所有新增字段均为可选（`?`），现有 State/Transition/Action 数据无需迁移
- `behavior-model-editor.tsx` 中 `handleAddState`/`handleAddTransition`/`handleSaveAction` 只需在构造对象时包含新增字段（值为 `undefined` 时不写入）
- `epc-generator/index.ts` 中 `buildFlowArtifacts` 函数无需修改（它只读取 `states`/`transitions` 的基础字段）

### 8.2 需要修改的文件清单

| 文件 | 变更类型 | 说明 |
|------|:---:|------|
| `src/types/ontology.ts` | 修改 | State/Transition/Action 增强 + 新增 StateTimeout/StateDataVisibility/ActionTimeout/LifecycleAuditEntry/EntityLifecycle |
| `src/store/ontology-store.ts` | 修改 | 新增 getEntityLifecycle + lifecycleAuditTrail + 审计方法 |
| `src/components/ontology/behavior-model-editor.tsx` | 修改 | State/Transition/Action 编辑对话框增强 |
| `src/components/ontology/modeling-workspace.tsx` | 修改 | 新增生命周期 Tab |
| `src/app/api/entity-lifecycle/route.ts` | 新建 | EntityLifecycle 聚合查询 API |

### 8.3 不需要修改的文件

- `src/lib/epc-generator/index.ts` — 无需修改（EPC 已在 v3.1 中扩展了关联矩阵，Lifecycle 数据通过 `EpcModelRef` 引用）
- `src/components/ontology/side-effect-section.tsx` — 无需修改（`SideEffect` 类型不变）
- 其他模型编辑器 — 无需修改

---

## 九、与其他模型的关联

| 关联方向 | 字段 | 说明 |
|---------|------|------|
| State → Action | State.availableActions / entryActions / exitActions | State 维度关联 Action |
| State → Rule | State.constraints | State 维度关联 Rule |
| State → GovernanceRole | State.allowedRoles | State 维度关联角色 |
| State → EventDefinition | State.triggerableEvents | State 维度关联事件 |
| Transition → Action | Transition.compensationAction | 转换失败补偿 |
| Transition → EventDefinition | Transition.publishEventId | 转换触发事件 |
| Transition → GovernanceRole | Transition.notifyRoleIds / approvalRoleIds | 转换通知/审批角色 |
| Action → Action | Action.fallbackActionId | 操作失败回退链 |
| EntityLifecycle → EPC | EpcModelRef(modelType='lifecycle') | EPC v3.1 全域关联 |
| EntityLifecycle → Organization | State.allowedRoles → GovernanceRole → Position → Department | 组织维度权限 |

---

## 十、User Stories

### US-LC-1: State 生命周期增强
- **角色**: 业务架构师
- **需求**: 在 State 编辑器中配置 entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility
- **验收**:
  - State 编辑对话框新增「生命周期」折叠面板
  - availableActions 从已有 Action 列表多选
  - constraints 从已有 Rule 列表多选
  - allowedRoles 从已有 GovernanceRole 列表多选
  - timeout 配置三选一(auto_transition/notify/escalate)
  - dataVisibility 从 Entity.attributes 多选分配

### US-LC-2: Transition 生命周期增强
- **角色**: 业务架构师
- **需求**: 在 Transition 编辑器中配置 guardCondition/compensationAction/publishEventId/notifyRoleIds/requiresApproval/auditLog
- **验收**:
  - Transition 编辑对话框新增「高级配置」折叠面板
  - guardCondition 支持表达式输入
  - compensationAction 从已有 Action 列表单选
  - publishEventId 从已有 EventDefinition 列表单选
  - requiresApproval 勾选后显示 approvalRoleIds 多选

### US-LC-3: Action 语义增强
- **角色**: 业务架构师
- **需求**: 在 Action 编辑器中配置 aliases/triggerPhrases/successMessage/failureMessage/fallbackActionId/requiresConfirmation
- **验收**:
  - Action 编辑对话框新增「Agent 语义」折叠面板
  - aliases 支持标签式多值输入
  - triggerPhrases 支持标签式多值输入
  - fallbackActionId 从已有 Action 列表单选
  - requiresConfirmation 勾选后显示 confirmationMessage 输入

### US-LC-4: EntityLifecycle 聚合视图
- **角色**: 业务架构师 / Agent
- **需求**: 以 Entity 为中心展示完整的生命周期聚合视图
- **验收**:
  - 新增「生命周期」Tab
  - 左侧：Mermaid 状态流转图
  - 右侧：选中状态的完整信息（可用操作/约束/角色/事件/字段可见性/超时配置）
  - 底部：生命周期统计

### US-LC-5: 生命周期校验
- **角色**: 交付工程师
- **需求**: 校验生命周期的完整性和一致性（V-LC-01~15）
- **验收**:
  - 校验面板展示所有 V-LC 规则结果
  - error 级别阻止保存，warning 级别提示

### US-LC-6: 生命周期审计
- **角色**: 业务架构师
- **需求**: 查看 Entity 的生命周期变更历史
- **验收**:
  - 生命周期 Tab 底部「审计记录」列表
  - 支持按事件类型/状态/结果筛选
  - 支持导出审计记录

### US-LC-7: Agent 语义层导出
- **角色**: Agent 开发者
- **需求**: 导出 EntityLifecycle 为 Agent 可消费的 JSON
- **验收**:
  - POST /api/entity-lifecycle 返回完整 EntityLifecycle JSON
  - 包含 actionsByState/rulesByState/eventsByState/rolesByState 聚合数据
  - 包含所有 triggerPhrases/aliases 用于 NLU 匹配

---

## 十一、实施计划

### Phase 1: 类型定义（与 Phase 2 并行）
- 更新 `src/types/ontology.ts`：State/Transition/Action 增强 + 新增 5 个子类型 + EntityLifecycle

### Phase 2: Store + API（与 Phase 1 并行）
- 更新 `src/store/ontology-store.ts`：新增 getEntityLifecycle + lifecycleAuditTrail + 审计方法
- 新建 `src/app/api/entity-lifecycle/route.ts`

### Phase 3: UI 增强
- State 编辑对话框增强（生命周期配置面板）
- Transition 编辑对话框增强（高级配置面板）
- Action 编辑对话框增强（Agent 语义面板）

### Phase 4: 生命周期 Tab + 校验
- 新增生命周期 Tab（状态流转图 + 状态详情 + 审计记录）
- 实现 V-LC-01~15 校验规则
