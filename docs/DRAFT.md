# 本体建模平台 — 模型讨论草案

> 创建日期：2026-06-16~17
> 状态：草案（讨论阶段，未定稿）
> 范围：仅讨论项目1（Ontology），不涉及项目2

---

## 一、顶层范围

所有 11 个维度共享同一顶层范围：

```
Domain（领域）
  └── Project（项目）
       └── BusinessScenario（业务场景）
            ├── 维度1: DataModel
            ├── 维度2: BehaviorModel
            ├── 维度3: RuleModel
            ├── 维度4: EventModel
            ├── 维度5: DataSourcesModel
            ├── 维度6: Interfaces
            ├── 维度7: GovernanceModel
            ├── 维度8: OrganizationModel
            ├── 维度9: EpcModel
            ├── 维度10: AgentSemanticLayer
            └── 维度11: ReferenceDocuments
```

### 维度顺序调整历史

| 步 | 操作 |
|:--:|------|
| 初始 | 参考文档(11) → EPC(5) 原始顺序 |
| 1 | 维度11 与 维度5 互换 |
| 2 | 回退，改为 维度10(数据源层) 与 维度5 互换 |
| 3 | Agent语义层(原7) 移至 EPC之后、参考文档之前 |

最终排序如上。

---

## 二、维度1：数据模型（DataModel）— 已确认

### 结构

```
DataModel
├── domain: string
├── projects: EntityProject[]
│   └── id, name, nameEn, description, color, icon, createdAt
├── businessScenarios: BusinessScenario[]
│   └── id, name, nameEn, description, projectId, color, createdAt
└── entities: Entity[]
    ├── id, name (中文名), nameEn
    ├── projectId, businessScenarioId
    ├── description, businessMeaning, aliases
    ├── entityRole: aggregate_root | child_entity
    ├── parentAggregateId
    ├── tags: string[]              ← 可选标记
    ├── attributes: Attribute[]
    │   ├── id, name, nameEn, dataType (9种)
    │   ├── length, precision, scale
    │   ├── required, unique, default
    │   ├── enumRef, referenceKind, referencedEntityId
    │   ├── description, businessMeaning
    │   └── metadataTemplateId/Name
    ├── relations: Relation[]
    │   ├── id, name, type (1:1/1:N/N:M)
    │   ├── targetEntity, foreignKey, viaEntity
    │   ├── cascade, isRecursive, directionality
    │   └── attributes?: Attribute[]
    ├── computedProperties?: ComputedProperty[]
    │   └── name, nameEn, computationType (formula|aggregation|lookup|ai-inference)
    │       expression, targetEntity, aggregationFunction, businessMeaning
    ├── sourceMappings?: SourceMapping[]
    │   └── entityId, attributeId, sourceSystem, sourceFieldPath, transformRule
    ├── domainEvents?: string[]
    └── indexes?: {fields, type, unique}[]
```

### 已确认要点

| 要点 | 结论 |
|------|------|
| **中文名（name）** | Entity 的主标识 |
| **nameEn** | 辅助字段 |
| **ID** | 有 |
| **Entity ↔ Project/BusinessScenario** | **M:N 关系** — 一个 Entity 可以出现在多个项目、多个业务场景 |
| **tags** | ✅ 需要标记机制（可选标记） |
| businessMeaning | 保留，未深入讨论 |
| entityRole / parentAggregateId | 保留，未深入讨论 |
| computedProperties | 保留，未深入讨论 |
| sourceMappings | 保留，未深入讨论 |
| 其他字段（aliases, indexes 等） | Agree all |

---

## 三、维度2：行为模型（BehaviorModel）— 简化方向

### 核心原则

> 「砍掉增强字段，只保留最核心的 state, transition, action 基础结构」

保留：
- **StateMachine**: id, name, entity, statusField
- **State**: id, name, isInitial, isFinal, color
- **Transition**: id, name, from, to, trigger (manual\|automatic\|scheduled), preConditions, postActions, guardCondition, requiresApproval, description
- **Action**: id, name, nameEn, description, targetEntityId, actionType, parameters, preConditions, postEffects, executionType (sync\|async\|approval), requiredRoles

砍掉的增强字段：timeout, dataVisibility, semanticTag, auditEntry/Exit, triggerConfig, guardFailureMessage, compensationAction, publishEventId, sideEffects, functions, transactionBoundaries, indicators, constraints, metrics 等全部非核心字段。

---

## 四、OKF 启发的极简重构方向

> 受 Google OKF (Open Knowledge Format) 启发，提出的极简 6 元素方案

### 新旧对比

| 原 11 维度 | 新方案 | 说明 |
|-----------|--------|------|
| 数据模型 → | **DataModel** | 保留 |
| 行为模型 → | **action** | 大幅简化，扁平化 |
| 规则模型 → | **rules** | 扁平化 |
| 事件模型 | ❌ | 未显式纳入 |
| 数据源层 | ❌ | 未显式纳入 |
| 外部接口 → | **api** | 简化 |
| 治理层 | ❌ | 未显式纳入 |
| 组织模型 | ❌ | 未显式纳入 |
| EPC 模型 → | **EPC** | ⬆️ 提升到顶层 |
| Agent语义层 → | **+语义** | 内聚到 Domain/Project |
| 参考文档 | ❌ | 未显式纳入 |

### 新结构骨架

```
Domain（领域）+ 语义
└── EntityProject（项目）+ 语义
     ├── DataModel
     ├── action
     ├── rules
     ├── api
     └── EPC
```

> **状态：讨论中，未定稿**

### 未解决问题

`+语义` 具体指什么？

1. **业务术语词典** — `BusinessTerm { term, definition, synonyms, domain }`，共享名词定义
2. **Agent 意图映射** — `Intent { triggerPhrase → action }`，自然语言触发底层 action
3. **语义关系** — `SemanticRelation { is_a / part_of / depends_on }` 连接词汇
4. **以上全部打包**，按 Domain（全局）/ Project（局部）分层挂载

---

## 五、讨论中参考的外部资料

- **[Google OKF (Open Knowledge Format)](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf)** — v0.1 Draft, 2026-06-12 发布。极简 Markdown+YAML Frontmatter 格式规范。核心理念：唯一必填字段只有 `type`，其余全可选。
- **[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)** — 24 个生产级技能模板，覆盖 DEFINE→PLAN→BUILD→VERIFY→REVIEW→SHIP 全生命周期。
- **[Karpathy LLM Wiki](https://github.com/karpathy/LLM-wiki)** — Markdown 知识库概念原型，OKF 的灵感来源。

---

## 六、待决策事项

| # | 事项 | 状态 |
|:-:|------|:----:|
| 1 | `+语义` 的具体范围 | ⏳ 待定 |
| 2 | 是否采用 6 元素极简方案替代 11 维度 | ⏳ 待定 |
| 3 | 维度2（行为模型）简化后的精确字段列表 | ⏳ 待定 |
| 4 | 砍掉的维度（事件/数据源/治理/组织/参考文档）如何处理 | ⏳ 待定 |
