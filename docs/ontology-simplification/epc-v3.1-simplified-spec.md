# EPC v3.1 关联矩阵 — 简化架构版

> 版本: 3.1-simplified | 状态: Draft  
> 替代: [docs/EPC-Upgrade-Spec.md](../EPC-Upgrade-Spec.md)（旧版，引用已删除的 Lifecycle / Agent Semantic Layer）  
> 架构准据: [docs/adr-simplified-ontology-model.md](../adr-simplified-ontology-model.md)  
> 日期: 2026-06-18

---

## 一、背景：为什么需要重写

旧 EPC v3.1 spec 依赖两个已删除的概念层：

| 旧概念 | 旧位置 | 简化架构位置 |
|--------|--------|-------------|
| Entity Lifecycle（State/Transition/guardCondition/compensationAction/StateTimeout/DataVisibility） | 独立聚合 `EntityLifecycle` | **E2**（StateMachine/Action/Transition）+ **E7**（guard/compensate/transaction boundary） |
| Agent Semantic Layer（Intent/BusinessTerm/ErrorRecovery/AgentPolicy/SemanticRelation/TemporalValidity/SlotFillingStrategy） | 独立聚合 `AgentSemanticLayer` | **A/B/C.semantics**（terms/triggerPhrases）+ **E5**（AgentPolicy）+ **E7**（ErrorRecovery/compensation） |

旧 spec 的 71 条规则（VE×17 + VM×39 + VX×15）中，约 40% 直接引用 Lifecycle/ASL 类型——这些类型在 US-S12 中已删除。**不能丢弃这些规则的校验意图**，而是映射到简化架构的对应位置。

### 简化架构要素速查

```
A (ValueDomain) → B (Capability) → C (Scenario) → EPC (EpcProcess)
                                                      └── steps[].elementRef → E1–E8
```

| 维度 | 名称 | 包含（简化后） |
|------|------|---------------|
| E1 | 数据模型 | Entity, Attribute, Relation, 主数据 |
| E2 | 行为模型 | StateMachine, Action, Transition（**吸收原 Lifecycle**） |
| E3 | 事件模型 | EventDefinition, Subscription |
| E4 | 规则模型 | 校验规则、业务规则 |
| E5 | 岗位角色 | Department, Position, GovernanceRole（**吸收原 AgentPolicy**） |
| E6 | 指标模型 | BusinessMetric |
| E7 | 约束模型 | guard condition, transaction boundary, compensation（**吸收原 Lifecycle 策略语义 + ErrorRecovery**） |
| E8 | 接口模型 | DataSource, Integration, Webhook |

**A/B/C.semantics**：`{ terms?: string[]; triggerPhrases?: string[]; synonyms?: Record<string, string[]> }` — 吸收原 Intent/BusinessTerm/SemanticRelation。

---

## 二、旧规则映射表

### 2.1 VE 系列（EPC → 模型）：17 → 12+5

| 旧编号 | 旧规则 | 简化后 | 新编号 | 说明 |
|--------|-------|--------|--------|------|
| VE-01 | 引用存在性 | **保留** | W-EPC-05 已覆盖 | elementId 在 metaElements 中存在 |
| VE-02 | 引用一致性（name 不同步） | **保留** | W-EPC-06 ✨ | ref 的 name 与当前 MetaElement.name 不一致 |
| VE-03 | 引用类型合法性 | **保留** | W-EPC-07 ✨ | `elementRef.dimension` 与实际 MetaElement.dimension 一致 |
| VE-04 | 连线事件存在性 | **废弃** | — | 简化架构无 EpcEdge |
| VE-05 | 分支规则存在性 | **废弃** | — | 简化架构无 Connector.branches |
| VE-06 | Function 关联密度 | **保留** | W-EPC-08 ✨ | EPC 步骤至少关联 1 个 E2（行为）元素 |
| VE-07 | Function 数据依赖 | **保留** | W-EPC-09 ✨ | EPC 步骤至少关联 1 个 E1（数据）元素 |
| VE-08 | InfoObject 实体绑定 | **保留** | W-EPC-10 ✨ | 引用 E1 的步骤，E1 元素应有 Entity 归属 |
| VE-09 | OrgUnit 角色绑定 | **保留** | W-EPC-11 ✨ | 引用 E5 的步骤，E5 元素应有 Role 定义 |
| VE-10 | 链路起止 | **保留** | W-EPC-12 ✨ | EPC 步骤序列首尾应引用 E3 事件 |
| VE-11 | 交替约束 | **废弃** | — | 简化架构无严格 Event/Function 交替语义 |
| VE-12 | Connector 分支 | **废弃** | — | 简化架构无 Connector 类型 |
| **VE-13** | Lifecycle 引用存在性 | **映射到 E2+E7** | W-EPC-13 ✨ | EPC 步骤 elementRef 引用 E2/E7 的 elementId 必须存在 |
| **VE-14** | Semantic 引用存在性 | **映射到 A/B/C.semantics + E5** | W-EPC-14 ✨ | EPC 步骤引用的语义元素（E5 policy / semantics block）必须存在 |
| **VE-15** | State-Action 一致性 | **映射到 E2 内部** | W-EPC-15 ✨ | EPC 步骤引用的 E2 Action 必须在某个 StateMachine 的 transitions 中可达 |
| **VE-16** | Transition-Event 一致性 | **映射到 E2↔E3** | W-EPC-16 ✨ | EPC 步骤引用 E2 Transition + E3 EventDefinition，Transition 的 trigger/publish 是否引用该 Event |
| **VE-17** | GuardCondition 可执行性 | **映射到 E7** | W-EPC-17 ✨ | EPC 步骤引用的 E7 约束 guardCondition 应关联到具体 E2 Transition |

**结论**：VE 17 → 12 条保留/映射（W-EPC-05~17），5 条因简化架构无对应概念而废弃。

### 2.2 VM 系列（模型 → EPC 覆盖率）：39 → 22

#### 数据模型 VM-D（3→3）

| 旧编号 | 简化后 | 新编号 |
|--------|--------|--------|
| VM-D01 | E1 实体应被 EPC 引用 | VM-D01 ✅ |
| VM-D02 | E1 关键属性应被 EPC 引用 | VM-D02 ✅ |
| VM-D03 | E1 Relation 应在 EPC 中体现 | VM-D03 ✅ |

#### 行为模型 VM-B（5→5）

| 旧编号 | 简化后 | 新编号 |
|--------|--------|--------|
| VM-B01 | E2 Action 应出现在 EPC 引用中 | VM-B01 ✅ |
| VM-B02 | E2 StateMachine 应有 EPC 覆盖 | VM-B02 ✅ |
| VM-B03 | E2 Transition 应被 EPC 引用 | VM-B03 ✅ |
| VM-B04 | E2 Indicator → 废弃（E6 覆盖） | — |
| VM-B05 | E2 Constraint → 映射到 E7 | VM-E7-01 ✨ |

#### 规则/事件/流程/治理/指标/数据源（保持）

VM-R01~R02（2）、VM-E01~E02（2）、VM-P01~P02（2）、VM-G01~G02（2）、VM-M01~M02（2）、VM-S01~S02（2）→ **共 12 条，全部保留**，仅 modelType 从旧枚举映射到 E1–E8。

#### VM-LC（7→0，语义吸收）

旧 Lifecycle 覆盖率规则全部映射：

| 旧编号 | 旧规则 | 映射 |
|--------|-------|------|
| VM-LC01 | State 覆盖 | → VM-B02（StateMachine 覆盖已含 State） |
| VM-LC02 | Transition 覆盖 | → VM-B03（已覆盖） |
| VM-LC03 | GuardCondition 覆盖 | → **VM-E7-02 ✨**（E7 guard 应被 EPC 引用） |
| VM-LC04 | CompensationAction 覆盖 | → **VM-E7-03 ✨**（E7 compensation 应被 EPC 引用） |
| VM-LC05 | StateTimeout 覆盖 | → **VM-E7-04 ✨**（E7 timeout 约束应被 EPC 引用） |
| VM-LC06 | AvailableActions 覆盖 | → VM-B01（Action 覆盖已含） |
| VM-LC07 | DataVisibility 覆盖 | → **VM-E7-05 ✨**（E7 visibility 约束应被 EPC 引用） |

#### VM-AS（7→0，语义吸收）

| 旧编号 | 旧规则 | 映射 |
|--------|-------|------|
| VM-AS01 | Intent 覆盖 | → **VM-SEM-01 ✨**（A/B/C.semantics.triggerPhrases 应在 EPC 步骤 name/description 中体现） |
| VM-AS02 | ErrorRecovery 覆盖 | → VM-E7-03（compensation 覆盖） |
| VM-AS03 | SemanticRelation 覆盖 | → **VM-SEM-02 ✨**（A/B/C.semantics.synonyms 跨实体映射应在 EPC 中体现） |
| VM-AS04 | BusinessTerm 覆盖 | → **VM-SEM-03 ✨**（A/B/C.semantics.terms 应被 EPC 步骤引用） |
| VM-AS05 | AgentPolicy 覆盖 | → **VM-E5-01 ✨**（E5 GovernanceRole 的 policy 应被 EPC 引用） |
| VM-AS06 | TemporalValidity 覆盖 | → **VM-E7-06 ✨**（E7 temporal constraint 应被 EPC 引用） |
| VM-AS07 | SemanticFieldMapping 覆盖 | → VM-D03（Relation 跨实体映射已含） |

**结论**：VM 39 → 22 条（保留 12 + 新增 E7 6 条 + 新增 SEM 3 条 + 新增 E5 1 条）。

### 2.3 VX 系列（交叉一致性）：15 → 10

| 旧编号 | 旧规则 | 简化后 |
|--------|-------|--------|
| VX-01 | Action-Transition 一致 | **保留** — E2 内部一致性 |
| VX-02 | Event-Entity 一致 | **保留** — E3↔E1 一致性 |
| VX-03 | Rule-Entity 一致 | **保留** — E4↔E1 一致性 |
| VX-04 | Metric-Action 一致 | **保留** — E6↔E2 一致性 |
| VX-05 | DataSource-Entity 一致 | **保留** — E8↔E1 一致性 |
| VX-06 | Role-Permission 一致 | **保留** — E5 权限覆盖 |
| VX-07 | 连线因果一致性 | **废弃**（无 EpcEdge） |
| VX-08 | 分支-规则一致性 | **废弃**（无 Connector） |
| **VX-09** | Intent-Action 一致 | → **VX-09 ✨**（A/B/C.semantics.triggerPhrases 引用的 Action 在 E2 中存在） |
| **VX-10** | State-Intent 一致 | → **VX-10 ✨**（A/B/C.semantics 中的 triggerPhrases 描述的 State 在 E2 StateMachine 中存在） |
| **VX-11** | ErrorRecovery-Action 一致 | → **VX-11 ✨**（E7 compensation 引用的 E2 Action 存在） |
| **VX-12** | AgentPolicy-Role 一致 | → **VX-12 ✨**（E5 Role 的 policy 约束与 E7 guard 一致） |
| **VX-13** | SemanticRelation-EPC 一致 | → **VX-13 ✨**（A/B/C.semantics.synonyms 映射的两个实体是否同时出现在 EPC 链路中） |
| **VX-14** | TemporalValidity 冲突 | → **VX-14 ✨**（E7 temporal constraint 与模块 confirmed 时间矛盾） |
| **VX-15** | GuardCondition-Connector 一致 | → **VX-15 ✨**（E7 guard 引用的 E2 Transition 确实存在于对应 StateMachine） |

**结论**：VX 15 → 10 条（保留 6 + 映射 7 → 重定义为 4 条新规则）。

---

## 三、新规则体系总览

### 3.1 规模对比

| 系列 | 旧 | 新 | 变化 |
|------|----|----|------|
| VE（EPC→模型） | 17 | 12 (W-EPC-05~17) | -5（废弃 5 条不适用规则） |
| VM（模型→EPC 覆盖率） | 39 | 22 | -17（吸收到已有覆盖 + 语义映射） |
| VX（交叉一致性） | 15 | 10 | -5（废弃 2 + 重定义 7→4） |
| **总计** | **71** | **44** | **-27** |

### 3.2 W-EPC 扩展（VE 系列）

> 已有：W-EPC-01~05（US-S09 已实现）  
> 新增：W-EPC-06~17（本 spec）

| 编号 | 规则 | 严重度 | 检查内容 |
|------|------|--------|---------|
| W-EPC-01 | 引用要素未确认 | warning | 已确认 EPC 步骤引用要素未确认（**已有**） |
| W-EPC-02 | 已确认要素无引用 | warning | usageRefs 为空（**已有**） |
| W-EPC-03 | 引用仅有 draft | warning | 引用目标仅有 draft（**已有**） |
| W-EPC-04 | C 下无 EPC | warning | 已确认 C 无 EPC 子节点（**已有**） |
| W-EPC-05 | elementId 不存在 | warning | elementId 不在 metaElements 中（**已有**） |
| **W-EPC-06** | **引用名称不一致** | warning | elementRef 缓存的 name 与 MetaElement.name 不一致 |
| **W-EPC-07** | **dimension 不匹配** | error | elementRef.dimension ≠ MetaElement.dimension |
| **W-EPC-08** | **缺少行为关联** | warning | EPC 步骤无任何 E2 引用 |
| **W-EPC-09** | **缺少数据关联** | warning | EPC 步骤无任何 E1 引用 |
| **W-EPC-10** | **E1 游离** | warning | 步骤引用 E1 但对应 MetaElement 无 Entity 归属信息 |
| **W-EPC-11** | **E5 游离** | warning | 步骤引用 E5 但对应 MetaElement 无 GovernanceRole |
| **W-EPC-12** | **首尾非事件** | warning | EPC 步骤序列首尾元素非 E3（事件） |
| **W-EPC-13** | **E2/E7 引用存在性** | error | 步骤引用 E2（Action/Transition）或 E7（guard/compensation）elementId 在 metaElements 中存在 |
| **W-EPC-14** | **语义元素存在性** | error | 步骤引用 E5 policy 或语义字段在对应 A/B/C.semantics 中存在 |
| **W-EPC-15** | **Action 不可达** | warning | 步骤引用的 E2 Action 不在任何 StateMachine 的 transitions 中 |
| **W-EPC-16** | **Transition-Event 不一致** | warning | 步骤同时引用 E2 Transition + E3 Event，但 Transition 的 trigger/publish 未引用该 Event |
| **W-EPC-17** | **Guard 不可执行** | warning | E7 guard 约束未关联到具体 E2 Transition |

### 3.3 VM 覆盖率（模型→EPC）

> 全部新增（US-S09 未实现覆盖方向）

| 编号 | 规则 | 严重度 | 所属维度 |
|------|------|--------|---------|
| VM-D01 | 实体覆盖 | warning | E1 |
| VM-D02 | 关键属性覆盖 | info | E1 |
| VM-D03 | Relation 覆盖 | info | E1 |
| VM-B01 | Action 覆盖 | warning | E2 |
| VM-B02 | StateMachine 覆盖 | warning | E2 |
| VM-B03 | Transition 覆盖 | info | E2 |
| VM-R01 | Rule 覆盖 | warning | E4 |
| VM-R02 | Rule 可执行性 | warning | E4 |
| VM-E01 | EventDefinition 覆盖 | warning | E3 |
| VM-E02 | Subscription 覆盖 | info | E3 |
| VM-P01 | —（简化架构无独立 ProcessModel） | — | — |
| VM-P02 | —（简化架构无独立 ProcessModel） | — | — |
| VM-G01 | Role 覆盖 | warning | E5 |
| VM-G02 | FieldPermission 覆盖 | info | E5 |
| VM-M01 | Metric 覆盖 | warning | E6 |
| VM-M02 | Metric 绑定 | warning | E6 |
| VM-S01 | DataSource 覆盖 | info | E8 |
| VM-S02 | DataSource 绑定 | warning | E8 |
| **VM-E7-01** | **E7 约束覆盖** | warning | E7 |
| **VM-E7-02** | **E7 guard 覆盖** | info | E7 |
| **VM-E7-03** | **E7 compensation 覆盖** | warning | E7 |
| **VM-E7-04** | **E7 timeout 覆盖** | warning | E7 |
| **VM-E7-05** | **E7 visibility 覆盖** | info | E7 |
| **VM-E7-06** | **E7 temporal 覆盖** | info | E7 |
| **VM-E5-01** | **E5 AgentPolicy 覆盖** | warning | E5 |
| **VM-SEM-01** | **semantics.triggerPhrases 覆盖** | info | A/B/C |
| **VM-SEM-02** | **semantics.synonyms 跨实体映射** | info | A/B/C |
| **VM-SEM-03** | **semantics.terms 覆盖** | info | A/B/C |

### 3.4 VX 交叉一致性

> 全部新增

| 编号 | 规则 | 严重度 | 检查内容 |
|------|------|--------|---------|
| VX-01 | Action-Transition 一致 | warning | EPC 引用的 E2 Action 属于对应 StateMachine |
| VX-02 | Event-Entity 一致 | error | EPC 引用的 E3 EventDefinition 属于对应 E1 Entity |
| VX-03 | Rule-Entity 一致 | warning | EPC 引用的 E4 Rule 属于对应 E1 Entity |
| VX-04 | Metric-Action 一致 | warning | EPC 引用的 E6 Metric 的 boundActionId 与步骤引用的 E2 Action 匹配 |
| VX-05 | DataSource-Entity 一致 | warning | EPC 引用的 E8 DataSource 的 boundObjectTypeId 与链路 E1 Entity 匹配 |
| VX-06 | Role-Permission 一致 | info | EPC 引用的 E5 Role 的权限覆盖链路涉及的 E1 Entity |
| **VX-09** | **Intent-Action 一致** | error | A/B/C.semantics.triggerPhrases 中引用的 Action 在 E2 中存在 |
| **VX-10** | **State-Semantics 一致** | warning | A/B/C.semantics 中 triggerPhrases 描述的 State 在 E2 StateMachine 中存在 |
| **VX-11** | **Compensation-Action 一致** | warning | E7 compensation 引用的 E2 Action 存在且可达 |
| **VX-12** | **Policy-Role 一致** | warning | E5 Role 的 policy 约束与 E7 guard 逻辑一致 |

---

## 四、数据模型变更

### 4.1 新增类型

```typescript
// ============================================================
// EPC 覆盖率报告
// ============================================================

export interface DimensionCoverage {
  dimension: MetaDimension;
  totalElements: number;
  coveredElements: number;
  coveragePercent: number;
  uncovered: { elementId: string; elementName: string }[];
}

export interface EpcCoverageReport {
  /** 按 C 子树闭包计算 */
  scenarioId: string;
  totalElements: number;
  coveredElements: number;
  coveragePercent: number;
  byDimension: Record<MetaDimension, DimensionCoverage>;
  /** A/B/C semantics 覆盖 */
  semanticsCoverage?: {
    termsCovered: number;
    termsTotal: number;
    triggerPhrasesCovered: number;
    triggerPhrasesTotal: number;
  };
}

// ============================================================
// 校验结果扩展
// ============================================================

export type ValidationDirection = 'epc_to_model' | 'model_to_epc' | 'cross_consistency';
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface EpcValidationIssue {
  code: string;          // W-EPC-06 / VM-D01 / VX-01 等
  direction: ValidationDirection;
  severity: ValidationSeverity;
  message: string;
  epcId?: string;
  stepId?: string;
  dimension?: MetaDimension;
  elementId?: string;
  elementName?: string;
}

export interface EpcFullValidationResult {
  scenarioId: string;
  timestamp: string;
  epcToModel: EpcValidationIssue[];       // W-EPC-01~17
  modelToEpc: EpcCoverageReport;           // VM-* 覆盖率
  crossConsistency: EpcValidationIssue[];  // VX-*
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    totalCoverage: number;
  };
}
```

### 4.2 MetaElement 扩展（可选）

```typescript
export interface MetaElement extends MetaElementBase {
  visibility?: ElementVisibility;
  ownerModuleId?: string;
  confirmedVersion?: string;
  usageRefs?: ElementUsageRef[];
  // v3.1 新增
  /** E1 专属：所属 Entity ID */
  entityId?: string;
  /** E2 专属：所属 StateMachine ID */
  stateMachineId?: string;
  /** E5 专属：是否关联 GovernanceRole */
  hasPolicy?: boolean;
  /** E7 专属：约束类型 */
  constraintType?: 'guard' | 'compensation' | 'transaction' | 'timeout' | 'visibility' | 'temporal';
}
```

### 4.3 EpcWarning 扩展

```typescript
// 扩展现有 EpcWarningRuleId
export type EpcWarningRuleId =
  // 已有（US-S09）
  | 'W-EPC-01' | 'W-EPC-02' | 'W-EPC-03' | 'W-EPC-04' | 'W-EPC-05'
  // v3.1 新增（VE 扩展）
  | 'W-EPC-06' | 'W-EPC-07' | 'W-EPC-08' | 'W-EPC-09' | 'W-EPC-10'
  | 'W-EPC-11' | 'W-EPC-12' | 'W-EPC-13' | 'W-EPC-14' | 'W-EPC-15'
  | 'W-EPC-16' | 'W-EPC-17';

// 覆盖率校验规则 ID
export type CoverageRuleId =
  | 'VM-D01' | 'VM-D02' | 'VM-D03'
  | 'VM-B01' | 'VM-B02' | 'VM-B03'
  | 'VM-R01' | 'VM-R02'
  | 'VM-E01' | 'VM-E02'
  | 'VM-G01' | 'VM-G02'
  | 'VM-M01' | 'VM-M02'
  | 'VM-S01' | 'VM-S02'
  | 'VM-E7-01' | 'VM-E7-02' | 'VM-E7-03' | 'VM-E7-04' | 'VM-E7-05' | 'VM-E7-06'
  | 'VM-E5-01'
  | 'VM-SEM-01' | 'VM-SEM-02' | 'VM-SEM-03';

// 交叉一致性规则 ID
export type CrossConsistencyRuleId =
  | 'VX-01' | 'VX-02' | 'VX-03' | 'VX-04' | 'VX-05' | 'VX-06'
  | 'VX-09' | 'VX-10' | 'VX-11' | 'VX-12';
```

---

## 五、推导算法更新

旧 spec 的 10 步推导算法中有 2 步（#9 MasterData、#10 Metadata）需要保留，其余 8 步映射如下：

```
deriveEpcStepsFromModels(scenarioId):
  scenario = getScenario(scenarioId)
  elements = getElementsByScenarioClosure(scenarioId)

  steps = []

  // Step 1: E3 Event → EPC 起始/结束步骤
  for each event in elements.filter(E3):
    steps.push({ elementRef: { dimension: 'E3', elementId: event.id } })

  // Step 2: E2 Action → EPC 功能步骤
  for each action in elements.filter(E2):
    step = { elementRef: { dimension: 'E2', elementId: action.id } }
    // 关联 E1 数据：Action 的输入/输出实体
    // 关联 E4 规则：前置/后置规则
    // 关联 E6 指标：boundMetric
    // 关联 E8 数据源：boundDataSource
    steps.push(step)

  // Step 3: E7 guard/compensation → 分支/回滚步骤标记
  for each constraint in elements.filter(E7):
    if constraint.constraintType === 'guard':
      // 标记为条件分支依据
    if constraint.constraintType === 'compensation':
      // 标记为回滚补偿路径

  // Step 4: E5 Role → 执行角色关联
  for each role in elements.filter(E5):
    // 关联到对应 E2 Action 步骤

  // Step 5: A/B/C.semantics → 语义标注
  // 将 terms/triggerPhrases 标注到步骤 description

  return steps
```

---

## 六、实施分期

### Phase A: W-EPC 扩展（W-EPC-06~17）← 最小可行增量

| # | 任务 | 说明 |
|----|------|------|
| A1 | types 扩展 | `EpcWarningRuleId` 增加 12 个新 ID；`EpcValidationIssue` 等类型 |
| A2 | `lintBusinessEpc` 扩展 | 在现有 linter 中增加 W-EPC-06~17 规则函数 |
| A3 | MetaElement 扩展字段 | `entityId`/`stateMachineId`/`constraintType`/`hasPolicy`（可选，W-EPC-08~11 的依赖） |
| A4 | 测试 | W-EPC 12 条新规则 unit tests |
| A5 | WarningCenter UI 适配 | 新规则在警示中心可筛选查看 |

**预估**：~500 LOC 纯函数 + ~200 LOC 测试

### Phase B: 覆盖率分析（VM + EpcCoverageReport）

| # | 任务 | 说明 |
|----|------|------|
| B1 | `lib/epc-coverage/` | `computeCoverage(scenarioId, project)` → `EpcCoverageReport` |
| B2 | Store API | `getEpcCoverage(scenarioId)` |
| B3 | 覆盖率面板 UI | C 工作区展示 `byDimension` 覆盖率仪表盘 |
| B4 | 测试 | 覆盖率计算 unit + integration |

**预估**：~400 LOC 纯函数 + ~300 LOC UI + ~200 LOC 测试

### Phase C: 交叉一致性（VX）

| # | 任务 | 说明 |
|----|------|------|
| C1 | `lib/epc-cross-consistency/` | VX-01~12 交叉校验 |
| C2 | Store API | `validateCrossConsistency(scenarioId)` |
| C3 | 三栏校验面板 | `EpcValidationPanel`（VE / VM / VX 三栏） |
| C4 | 测试 | VX 规则 unit + integration |

**预估**：~500 LOC 纯函数 + ~300 LOC UI + ~200 LOC 测试

### Phase D: 推导算法 + UI 增强（可选）

| # | 任务 | 说明 |
|----|------|------|
| D1 | `deriveEpcSteps` | 从 E1–E8 + A/B/C.semantics 推导 EPC 步骤骨架 |
| D2 | 「从模型推导」按钮 | C 工作区触发推导 |
| D3 | EPC 步骤覆盖率 Badge | 各 E1–E8 编辑器显示 EPC 覆盖状态 |

---

## 七、US 建议

| US ID | 标题 | Phase | 规则范围 | 预估 |
|-------|------|-------|---------|------|
| US-S15 | W-EPC 扩展 06~17 | A | 12 条新 W-EPC | 2-3 天 |
| US-S16 | 覆盖率分析 + 仪表盘 | B | VM 22 条 | 2-3 天 |
| US-S17 | 交叉一致性校验 | C | VX 10 条 | 2-3 天 |
| US-S18 | EPC 推导 + UI 增强 | D | 推导算法 + Badge | 2-3 天 |

**总规则**：44 条（W-EPC 17 + VM 22 + VX 10 已去重，W-EPC-01~05 已实现不计入新增）  
**实际新增**：39 条校验规则

---

## 八、与旧 spec 的关键差异

| 维度 | 旧 EPC v3.1 | 新 EPC v3.1-simplified |
|------|------------|----------------------|
| 架构 | 12 模型（5 核心 + 5 平台 + Lifecycle + Semantic） | 8 维度（E1–E8）+ A/B/C.semantics |
| Lifecycle | 独立聚合 EntityLifecycle | 语义吸收到 E2（行为）+ E7（约束） |
| Agent Semantic Layer | 独立聚合 9 大子类型 | 吸收到 A/B/C.semantics + E5 policy |
| EPC 节点 | 5 种节点（Event/Function/Connector/InfoObject/OrgUnit） | EpcStep（统一 elementRef） |
| 连线 | EpcEdge（source→target + 条件） | 无显式连线（步骤序列顺序隐含） |
| 规则数 | 71 | 44（去除不适用 + 语义映射） |
| 校验方向 | VE + VM + VX 三向 | 同三向，但 VM-LC/VM-AS 映射到 VM-E7/VM-SEM |
| 引用方式 | EpcModelRef（modelType + elementId + refRole） | EpcStepElementRef（dimension + elementId + versionPin） |
| 流程图 | @xyflow/react 5 种自定义节点 | 当前无流程图（可后续 US 补充） |

---

## 九、确认

- [ ] Frank，日期：______

## 十、后续

确认后按 US-S15~S18 拆分 Unit，遵循六步流水线（US → Unit Spec → PRD → Testing Case → Coding → Unit Test → E2E）。
