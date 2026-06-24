# ADR：本体建模简化架构（A→B→C→EPC + E1–E8）

| 字段 | 值 |
|------|-----|
| **状态** | 已接受 |
| **日期** | 2026-06-18 |
| **主计划** | [docs/本体建模简化架构.plan.md](./本体建模简化架构.plan.md) |
| **Manifest 契约** | [ontology-platform/docs/shared/ontology-manifest-spec.md](../ontology-platform/docs/shared/ontology-manifest-spec.md) |

## Context

Ontology 建模工具当前具备多 Tab 元模型（数据/行为/规则/流程/事件）、Agent 语义层、Entity Lifecycle 等横切能力，与「业务链 + 八维要素 + EPC 挂接」的产品叙事不一致，实施与导出边界模糊。

团队决定：

- 采用 **A→B→C→EPC** 严格业务树（一 C 多 EPC）
- 收敛为 **E1–E8** 全局要素库
- **EPC 步骤内联引用** 为权威数据源，要素库维护 **派生反向索引**
- 模块级 **draft / confirmed / archived** 与引用 pin
- EPC↔八维 **警示不阻断** 导出

本 ADR 为 Phase 0–4 实施的唯一架构准据（与主计划一致）。

## Decision

### 1. 业务链：严格父子树

```
A 业务价值域 (ValueDomain)
└── B 业务能力 (Capability)
    └── C 业务场景 (Scenario)
        ├── EPC-01 (EpcProcess)
        └── EPC-02 (EpcProcess)
```

| 节点 | 类型名 | parentId | 说明 |
|------|--------|----------|------|
| A | `ValueDomain` | 无 | 顶层价值域 |
| B | `Capability` | A.id | 一个 A 下多个 B |
| C | `Scenario` | B.id | 一个 B 下多个 C；C 只属于一个 B |
| EPC | `EpcProcess` | C.id | 一个 C 下多个 EPC；路径 `A/B/C/EPC-01` |

- A/B/C **不允许轻量分类**；均需完整结构 + `semantics`（术语、触发短语等同义词，承接原 Agent 语义层字段）。
- **标识**：`id` 不可变，`name` 可改；引用与索引用 `id`，UI 展示 `name`。

### 2. 八维元模型（E1–E8）

| 维度 | 名称 | 合并自现状 | 主要内容 |
|------|------|------------|----------|
| E1 | 数据模型 | DataModel | Entity、Attribute、Relation、主数据 |
| E2 | 行为模型 | BehaviorModel | StateMachine、Action（生命周期语义并入，不再独立 Lifecycle 聚合） |
| E3 | 事件模型 | EventModel | EventDefinition、Subscription |
| E4 | 规则模型 | RuleModel | 字段/跨字段/跨实体/聚合/时序 **校验与业务规则** |
| E5 | 岗位角色 | GovernanceModel、组织岗位 | Department、Position、治理角色 |
| E6 | 指标模型 | MetricsModel | BusinessMetric |
| E7 | 约束模型 | BehaviorConstraint、TransactionBoundary | **跨切面策略约束**、事务边界、补偿 |
| E8 | 接口模型 | DataSourcesModel | DataSource、集成/Webhook |

#### E4 规则 vs E7 约束 — 边界

| 场景 | 归属 | 示例 |
|------|------|------|
| 单字段格式、范围、必填 | **E4** | 订单号正则 `^SO\d{8}$` |
| 两字段之间大小关系 | **E4** | 结束日期 ≥ 开始日期 |
| 状态机守卫、谁可在何状态执行何操作 | **E7** | 「已关闭」状态禁止 `edit` Action |
| 跨实体事务边界与补偿 | **E7** | 下单 Action 与库存扣减同一事务边界 |

原则：**可表述为「若…则报错/警告」的校验规则 → E4**；**可表述为「允许/禁止/必须确认」的行为策略与事务语义 → E7**。

### 3. 八维要素：全局库 + EPC 主引用

- 要素存放在项目级 **MetaElement** 注册表，**不按 C 所有权拆分**。
- **权威引用**：`EpcProcess.steps[].elementRef`（仅存 `elementId` + `versionPin`，不缓存 `name`）。
- **派生索引**：`MetaElement.usageRefs[]` 由 `rebuildUsageIndex()` 扫描全部 EPC 步骤生成。
- **挂接 UX**：在 EPC 编辑器选八维要素；无匹配可内联新建 → 保存 EPC 时 upsert 到对应 E 维 **draft** → 重建索引。
- C 工作区 **不维护独立挂接表**；仅只读展示子 EPC 引用并集。

**saveEpc 流水线**：

1. 扫描 `steps[].elementRef`（含 `inlineNew`）
2. upsert 新要素到 E1–E8 draft
3. `rebuildUsageIndex()`
4. （confirmed 快照）触发 business-epc-linter

### 4. 标识规范（业务链 + 八要素）

| 字段 | 规则 | 用途 |
|------|------|------|
| `id` | 创建后不可修改 | elementRef、usageRefs、跨模块引用、Manifest |
| `name` | 可修改 | 选择器、列表、步骤标签 |
| `nameEn` | 可选、可改 | Manifest / 平台列名 |

展示：`resolveElementLabel(id) → name`（运行时查库）。

### 5. 模块版本与引用 pin

| 状态 | version | 可引用 |
|------|---------|--------|
| draft | 无 | 仅本模块内编辑 |
| confirmed | v1, v2… | 可被跨模块引用 |
| archived | 历史 vN | 只读；已有 pin 可保持 |

- 编辑已确认内容 → fork 新 draft，不覆盖旧 confirmed。
- 默认引用 **`latest_confirmed`**；支持锁定 `{ version: 'v2' }`。
- `ModuleKind`: `A|B|C|EPC|E1|…|E8`。

### 6. 警示规则（W-EPC，warning only）

| ID | 条件 | 作用范围 |
|----|------|----------|
| W-EPC-01 | 步骤引用的 elementId 不在八维已确认集 | EPC confirmed |
| W-EPC-02 | 已确认要素 usageRefs 为空 | E* confirmed |
| W-EPC-03 | 引用目标仅有 draft | 跨模块 ref |
| W-EPC-04 | C 已确认但无 EPC 子节点 | C confirmed |
| W-EPC-05 | elementId 在库中不存在 | confirmed |

**不阻断**确认与 Manifest 导出；警示中心可查询。

### 7. Manifest / compiler 映射方向

| 简化模型 | Manifest 段（v1） | 备注 |
|----------|-------------------|------|
| A/B/C | metadata / semantic 扩展 | 与平台 boundedContext 对齐评审 |
| EPC | behavior / process 扩展或 steps 投影 | 按 C 子树闭包 |
| E1–E4 | data / behavior / events / rules | 现有 compiler 段 |
| E5–E8 | governance / metrics / extensions | P0 compiler 增量 |

导出时按 **C 下全部 EPC 的 elementRef 闭包** 投影要素子集，非全库导出。

## Consequences

### 正面

- 导航与业务叙事一致（`A/B/C/EPC-01`）
- EPC 画流程时自然挂接要素；孤儿要素可筛
- 版本与 pin 可审计；警示不阻塞交付

### 负面 / 成本

- Phase 1–4 需双写迁移；旧 `BusinessScenario` / Agent 语义层 / Lifecycle 待删除
- `rebuildUsageIndex` 需幂等全量扫描；大项目需关注性能
- E4/E7 边界需建模培训

## Alternatives Considered

| 方案 | 放弃原因 |
|------|----------|
| C 下单例 D（单 EPC） | 不符合一 C 多流程 |
| ElementAttachment 双向主表 | EPC 主引用 + 派生索引更简单 |
| 警示阻断导出 | 产品要求 warning only |
| 实体挂 businessScenarioId | 改为全局 E1 + EPC 引用 |

## 参考

- [docs/本体建模简化架构.plan.md](./本体建模简化架构.plan.md)
- [docs/ontology-simplification/us/US-S01-adr.md](./ontology-simplification/us/US-S01-adr.md)
- [repo-main/src/types/ontology.ts](../repo-main/src/types/ontology.ts)（US-S02 类型骨架）
