# 本体模型语义行为事件平台 PRD

版本：v1.0  
状态：草案  
日期：2026-06-09  
适用范围：本体建模平台、Agent MCP Server、制造业首个行业模板

## 1. 产品定位

本产品是面向企业 AI Agent 的本体语义层平台。它不只是保存“对象、属性、关系”的静态模型，而是把企业业务知识拆成三类可治理资产：

- 语义：业务是什么，包括领域、场景、对象、属性、值对象、关系、状态、数据获取方式和 API/MCP 能力。
- 行为：业务能做什么，包括业务动作、前置校验、规则、行为边界、指标定义和执行权限。
- 事件：业务发生了什么，包括领域事件、事件存储、事件路由、事件处理器和跨系统影响。

平台通过 MCP Server 向 Agent 暴露本体能力，使 LLM 在理解业务、制定计划、执行动作、解释结论和沉淀经验时，必须以本体作为语义标准、规则依据和审计来源。

## 2. 背景与问题

企业已有 ERP、MES、WMS、QMS、CRM 等系统，但这些系统中的业务含义通常隐藏在字段、枚举、流程和人员经验里。LLM 可以理解自然语言，却不知道企业内部“生产订单下达”“物料齐套”“技术关闭”“准时完工率”等概念的准确含义、规则边界和数据来源。

当前主要问题：

| 问题 | 表现 | 后果 |
|---|---|---|
| 语义不统一 | 同一概念在不同系统、部门、场景中含义不同 | Agent 理解偏差，回答不稳定 |
| 行为不可控 | Agent 知道要做什么，但不知道能否执行、如何校验 | 容易越权、漏步骤、违反业务规则 |
| 事件不可追溯 | 行为完成后缺少标准事件记录和推导链 | 结果难审计，经验难沉淀 |
| 指标口径不清 | 指标公式、数据来源和维度分散 | AI 分析结论不可复核 |
| 本体调用不强制 | 只靠提示词要求 LLM 调用工具 | 关键判断可能绕过本体 |

## 3. 产品目标

### 3.1 业务目标

1. 让企业可以用统一方式定义业务语义、行为规则和事件闭环。
2. 让 Agent 在业务相关问题上先查本体、再判断、再行动。
3. 让制造业场景中的生产订单、物料、BOM、工艺路线、库存、质量、设备等知识可被 Agent 准确理解和调用。
4. 让业务规则、指标口径和行为边界从人员经验变成可版本化、可审计、可复用的资产。

### 3.2 产品成功指标

| 指标 | MVP 目标 | 说明 |
|---|---:|---|
| 业务查询本体命中率 | >= 80% | Agent 业务查询可映射到本体概念 |
| 强制调用合规率 | 100% | 关键业务判断前必须完成本体调用检查 |
| 规则执行可解释率 | >= 90% | 规则推理结果可返回命中规则和证据 |
| 行为计划验证覆盖率 | >= 80% | 多步计划执行前经过本体校验 |
| 制造模板可复用对象数 | >= 20 个 | 覆盖生产制造核心对象、行为和事件 |

## 4. 目标用户

| 用户 | 需求 |
|---|---|
| 业务专家 | 用业务语言定义对象、规则、行为和指标，减少口口相传 |
| 企业架构师 | 建立跨系统统一语义模型，约束 Agent 与系统集成 |
| AI Agent 开发者 | 通过 MCP/API 获取稳定的业务概念、规则和工具签名 |
| 系统集成工程师 | 定义对象与 ERP/MES/WMS/QMS 等系统的数据获取方式 |
| 审计与治理人员 | 追踪 Agent 为什么这样判断、调用了什么规则、产生了什么事件 |

## 5. 核心产品模型

### 5.1 总体结构

```text
领域 Domain
  ├─ 业务场景 Scenario
  ├─ 语义模型 Semantic Model
  │   ├─ 聚合根 Aggregate Root
  │   ├─ 对象 Object
  │   ├─ 对象属性 Property
  │   ├─ 值对象 Value Object
  │   ├─ 关系 Relationship
  │   ├─ 状态 State
  │   └─ 数据获取方式 Data Access Method / API / MCP
  ├─ 行为 Behavior
  │   ├─ 行为参数
  │   ├─ 前置规则
  │   ├─ 后置规则
  │   ├─ 事务边界
  │   ├─ 指标定义
  │   └─ 发布事件
  └─ 事件 Event
      ├─ 领域事件
      ├─ 事件存储
      ├─ 事件路由
      └─ 事件处理器
```

### 5.2 语义层

语义层回答“业务是什么”。它负责定义领域内的业务对象和对象之间的关系，并记录对象数据从哪里获取。

核心需求：

| 功能 | 说明 | 优先级 |
|---|---|---|
| 领域管理 | 支持生产制造、质量管理、设备管理、供应链等领域 | P0 |
| 业务场景管理 | 支持面向库存生产、面向订单生产等场景 | P0 |
| 聚合根建模 | 定义物料、生产订单、BOM、工单等聚合根 | P0 |
| 对象建模 | 定义对象、属性、值对象、关系、状态 | P0 |
| 数据获取方式 | 为对象或属性记录 SQL、API、MCP 工具等获取方式 | P0 |
| 跨本体映射 | 支持不同系统术语、字段、对象之间的映射 | P1 |

制造业首批对象建议：

| 对象 | 类型 | 示例属性 |
|---|---|---|
| Material | 聚合根 | 物料编码、名称、规格、单位、状态 |
| ProductionOrder | 聚合根 | 订单号、产品、计划数量、计划开始时间、计划完工时间、状态 |
| WorkOrder | 聚合根 | 工单号、工序、设备、责任班组、状态 |
| BOM | 聚合根 | 成品物料、版本、生效日期、失效日期 |
| BOMItem | 聚合内对象 | 子物料、用量、损耗率、替代料 |
| InventoryBalance | 对象 | 物料、仓库、可用量、冻结量 |
| Routing | 聚合根 | 成品物料、工艺路线版本、有效状态 |
| Operation | 值对象/对象 | 工序号、工序名称、标准工时、前后序关系 |

### 5.3 行为层

行为层回答“业务能做什么”。每个行为必须绑定目标对象或聚合根，并声明参数、规则、事务边界、事件和权限。

制造业首批行为：

| 行为 | 目标对象 | 说明 | 优先级 |
|---|---|---|---|
| 创建生产订单 | ProductionOrder | 创建生产订单草稿 | P0 |
| 生产订单下达 | ProductionOrder | 校验物料齐套与工艺路线后下达 | P0 |
| 物料领用 | WorkOrder / InventoryBalance | 记录实际投料并扣减库存 | P0 |
| 生产报工 | WorkOrder | 记录工序完成数量、工时、人员、设备 | P0 |
| 成品产出 | ProductionOrder | 记录完工入库数量 | P0 |
| 工单技术关闭 | WorkOrder | 结束工单技术状态，不再允许报工或投料 | P1 |

行为定义必须包含：

| 字段 | 说明 |
|---|---|
| behaviorCode | 行为唯一编码，例如 `release_production_order` |
| displayName | 行为显示名，例如“生产订单下达” |
| targetObject | 行为挂载对象，优先挂载聚合根 |
| inputSchema | 行为入参 JSON Schema |
| preRules | 执行前校验规则 |
| postRules | 执行后校验规则 |
| transactionBoundary | 必须原子提交或回滚的数据变更范围 |
| events | 行为成功后发布的领域事件 |
| permissions | 可执行角色、需审批角色、禁止角色 |

### 5.4 规则层

规则是行为执行和业务判断的标准依据。规则必须可版本化、可解释、可审计。

制造业首批规则：

| 规则 | 触发行为 | 规则描述 | 失败处理 |
|---|---|---|---|
| 物料齐套校验规则 | 生产订单下达 | BOM 中所有物料的库存可用量 >= 工单需求量 | 拦截下达，返回缺料清单 |
| 工艺路线校验规则 | 生产订单下达 | 成品物料必须有且仅有一条有效工艺路线，且工序顺序不能有环 | 拦截下达，返回异常路线 |
| 技术关闭规则 | 工单技术关闭 | 工单无未完成关键工序、无未处理质量异常 | 拦截关闭，返回待处理项 |

规则执行结果必须返回：

- 是否通过。
- 命中规则 ID 和版本。
- 输入事实。
- 判断过程。
- 缺失事实或失败原因。
- 建议修正动作。

### 5.5 指标层

指标是特殊的查询行为，用于规范 AI 分析口径。

首批指标：

| 指标 | 定义 | 数据来源 |
|---|---|---|
| 准时完工率 | 准时完工订单数 / 应完工订单数 | 生产订单计划完工时间、实际完工时间 |
| 工单平均完成时间 | SUM(工单完工时间 - 工单开始时间) / 完工工单数 | 工单开始、报工、关闭事件 |

指标定义必须包含：

- 计算公式。
- 统计口径。
- 时间窗口。
- 维度，例如产品、产线、班组、车间。
- 数据来源。
- 数据质量要求。
- 是否可被 Agent 直接引用。

### 5.6 事件层

事件层回答“业务发生了什么”。事件由行为成功后声明式发布，不由建模者事后手工补录。

制造业首批领域事件：

| 事件 | 发布行为 | 说明 |
|---|---|---|
| ProductionOrderCreated | 创建生产订单 | 生产订单已创建 |
| ProductionOrderReleased | 生产订单下达 | 生产订单已下达 |
| ProductionOrderPartiallyIssued | 物料领用 | 生产订单已部分投料 |
| WorkOrderPartiallyReported | 生产报工 | 生产订单已部分报工 |
| ProductionOrderPartiallyCompleted | 成品产出 | 生产订单已部分产出 |
| WorkOrderTechnicallyClosed | 工单技术关闭 | 生产订单技术关闭 |

事件能力需求：

| 功能 | 说明 | 优先级 |
|---|---|---|
| 事件定义 | 定义事件编码、名称、载荷结构、发布者行为 | P0 |
| 事件存储 | 持久化领域事件，记录事件 ID、聚合 ID、版本、载荷、时间 | P0 |
| 事件路由 | 定义事件会影响哪些领域和系统 | P1 |
| 事件处理器 | 定义事件触发后的行为、通知、Webhook 或外部 API 调用 | P1 |
| 事件回溯 | 支持按对象、行为、时间、事件类型追踪业务过程 | P1 |

### 5.7 治理层

治理层回答“谁能做什么、Agent 能看到什么、Agent 能做到什么程度”。治理层横跨 MCP Server 与后端应用 API，不是单点能力。

核心原则：

- Agent 默认无权限，必须显式授权后才能看到对象、字段、行为和工具。
- MCP Server 负责 Agent 入口侧的前置治理，包括工具裁剪、资源裁剪、参数边界校验和调用审计。
- 后端应用 API 负责最终强制鉴权，包括对象级访问控制、字段级脱敏、条件权限判断、行为执行授权和不可绕过的安全审计。
- MCP Server 可以减少 Agent 发起错误请求，但后端 API 必须假设 MCP 不可信，并对每次请求重新鉴权。

推荐调用链：

```text
Agent / LLM
  -> MCP Server：前置权限过滤、工具暴露控制、参数校验、审计
  -> 后端应用 API：最终鉴权、对象级/字段级/条件权限强制执行
  -> 业务系统 / 数据源
```

核心需求：

| 功能 | 说明 | 优先级 |
|---|---|---|
| 本体版本 | 草稿、待审核、已发布、已废弃 | P0 |
| 角色定义与权限分配 | 定义用户、Agent、角色、权限集、授权范围和有效期 | P0 |
| 对象级权限 | 控制 Agent 可见对象类型、关系、事件和可访问实例范围 | P0 |
| 字段级权限 | 控制字段可见、隐藏、脱敏、可作为入参或仅可作为出参 | P0 |
| 行为权限 | 控制行为可见、可校验、可执行、需审批或禁止 | P0 |
| 条件权限 | 根据租户、业务场景、对象状态、时间窗口、会话目的动态授权 | P0 |
| Agent 沙箱 | 限制 Agent 可见对象、可执行行为、最大推理深度、最大返回数量 | P0 |
| Agent Manifest | 根据本体版本和权限策略生成 Agent 专属工具/资源白名单 | P0 |
| 调用审计 | 记录 requestId、Agent、工具、参数摘要、结果、版本 | P0 |
| 写入审批 | 本体演化、案例学习必须进入审核流 | P1 |

权限策略示例：

```json
{
  "agentId": "production-planner-agent",
  "role": "ProductionPlanner",
  "domain": "manufacturing",
  "ontologyVersion": "1.0.0",
  "permissions": {
    "objects": {
      "ProductionOrder": ["read", "execute"],
      "Material": ["read"],
      "InventoryBalance": ["read_masked"],
      "CostRecord": []
    },
    "fields": {
      "ProductionOrder": {
        "visible": ["orderNo", "productMaterial", "plannedQty", "status"],
        "hidden": ["internalCost", "customerPriorityScore"],
        "masked": []
      },
      "InventoryBalance": {
        "visible": ["materialCode", "availableQty"],
        "masked": ["warehouseLocation"],
        "hidden": ["reservedForCustomer"]
      }
    },
    "actions": {
      "release_production_order": "allowed",
      "technical_close_work_order": "approval_required",
      "delete_production_order": "denied"
    }
  }
}
```

MCP Server 根据该策略生成 Agent 专属 Manifest：

- 只暴露 `ProductionOrder`、`Material`、`InventoryBalance` 相关 Resource。
- 不暴露 `CostRecord` 相关 Resource。
- 不暴露 `ProductionOrder.internalCost` 字段定义。
- 允许 `release_production_order` 工具。
- 将 `technical_close_work_order` 标记为需审批。
- 隐藏或拒绝 `delete_production_order` 工具。

后端 API 仍必须在每次真实查询或行为执行时重新校验同一套策略，不能因为请求来自 MCP Server 就跳过鉴权。

## 6. Agent 与 MCP Server 需求

### 6.1 Agent 何时必须调用本体

| 场景 | 必调工具 |
|---|---|
| 收到任何业务相关查询 | `ontology_intent_parse` |
| 生成多步骤计划并准备执行 | `ontology_plan_validate` |
| 解释字段、指标、状态、阈值 | `ontology_semantic_check` |
| 基于多维事实给出判断 | `ontology_reason_execute` |
| 任务完成且有验证反馈 | `ontology_learn_case` |
| 多个结论冲突 | `ontology_conflict_resolve` |
| 新场景无法归类 | `ontology_concept_evolve` |
| 用户追问依据 | `ontology_explain_trace` |
| 多轮对话出现指代 | `ontology_context_bind` |
| 跨系统术语不一致 | `ontology_cross_map` |
| 用户提出假设推演 | `ontology_what_if` |

### 6.2 参数传递规范

所有工具调用统一使用四段式参数：

```json
{
  "rawInput": {
    "query": "下达生产订单 PO-1001 前帮我检查是否能执行",
    "language": "zh-CN"
  },
  "context": {
    "conversationId": "conv-001",
    "tenantId": "default",
    "domain": "manufacturing",
    "scenario": "make_to_order",
    "ontologyVersion": "1.0.0",
    "activeEntities": [
      {
        "entityId": "PO-1001",
        "entityType": "ProductionOrder",
        "label": "生产订单 PO-1001"
      }
    ]
  },
  "payload": {},
  "options": {
    "explain": true,
    "maxDepth": 5,
    "timeoutMs": 5000
  }
}
```

### 6.3 强制调用机制

不能只依赖提示词要求 LLM 调用本体。必须在 Agent 编排层加入强制门控：

| 控制层 | 机制 |
|---|---|
| System Prompt | 声明业务查询和判断场景必须调用本体 |
| Tool Router | 根据意图分类强制插入本体工具调用 |
| Workflow Gate | 未完成计划验证、规则推理或权限校验时禁止执行行为 |
| Response Guard | 最终回答前检查必需本体调用是否完成 |
| Audit Guard | 将本体调用链写入审计日志 |

硬性约束：

```text
IF query.isBusinessRelated == true
THEN ontology_intent_parse MUST be called before final answer.

IF answer.containsBusinessJudgement == true
THEN ontology_semantic_check OR ontology_reason_execute MUST provide evidence.

IF task.plan.steps.length > 1
THEN ontology_plan_validate MUST pass before execution.

IF action.isWriteOperation == true
THEN permission_check AND behavior_rule_check MUST pass before execution.
```

### 6.4 Agent 可见性与可执行性治理

MCP Server 必须在 Agent 会话启动时，根据 Agent 身份、租户、角色、业务域、本体版本和治理策略，动态生成该 Agent 的工具、资源和提示词白名单。

会话初始化流程：

```text
Agent 会话启动
  -> MCP Server 获取 Agent 身份、租户、角色和授权范围
  -> 加载已发布本体版本
  -> 加载治理策略
  -> 生成 Agent 专属 Manifest
  -> 编译可见 Resources、可调用 Tools 和可用 Prompts
  -> Agent 只能看到裁剪后的能力
```

MCP Server 必须回答以下五类问题：

| 问题 | MCP Server 处理 | 后端 API 兜底 |
|---|---|---|
| Agent 能不能看到某个对象 | 按对象级权限裁剪 Resource 和 Schema | 查询实例时做行级过滤 |
| Agent 能不能调用某个行为 | 只把允许行为编译成 Tool，需审批行为标记状态 | 执行行为前重新校验权限、状态、审批和规则 |
| Agent 能不能拿到某个字段定义 | 按字段级权限过滤 Schema，隐藏或脱敏字段定义 | 返回数据时再次脱敏、隐藏或拒绝 |
| Agent 工具列表是否按权限动态裁剪 | 每个会话生成专属工具白名单 | 校验 actionCode 是否在授权范围内 |
| Agent 请求参数是否符合本体和权限边界 | 校验 JSON Schema、枚举、字段白名单、对象范围、条件约束 | 最终参数校验、权限校验和业务规则校验 |

MCP 侧必须提供五个治理检查点：

| 检查点 | 说明 |
|---|---|
| Object Visibility Check | 判断 Agent 是否可见对象类型、关系、指标和事件 |
| Action Executability Check | 判断 Agent 是否可调用某个行为，或是否需要审批 |
| Field Visibility Check | 判断字段定义是否可见、是否脱敏、是否可作为工具参数 |
| Tool Manifest Pruning | 根据权限动态裁剪 MCP tools、resources、prompts |
| Request Boundary Validation | 校验请求是否越过对象、字段、行为、租户、本体版本和上下文边界 |

如果 Agent 构造了越权参数，MCP Server 必须在调用后端 API 前拒绝。例如：

```json
{
  "actionCode": "release_production_order",
  "parameters": {
    "orderNo": "PO-1001",
    "internalCost": 12000
  }
}
```

MCP 拒绝响应：

```json
{
  "ok": false,
  "error": {
    "code": "FIELD_NOT_ALLOWED",
    "message": "Agent 无权提交字段 internalCost。",
    "field": "internalCost"
  },
  "recoverable": false
}
```

关键设计原则：

```text
MCP Server 负责不让 Agent 看见和发起不该做的事。
后端 API 负责即使 Agent 发起了，也绝不执行不该做的事。
```

### 6.5 调用失败处理

| 异常 | Agent 行为 |
|---|---|
| 参数缺失 | 优先从上下文补齐；无法补齐时向用户追问最少问题 |
| 工具超时 | 降级为“无法给出权威本体结论”，不输出确定性判断 |
| 概念无匹配 | 记录失败；重复出现时调用概念演化 |
| 事实不足 | 返回缺失事实清单，暂停推理 |
| 规则冲突 | 调用冲突裁决 |
| 权限不足 | 阻止执行，提示需要授权或人工审批 |
| 字段越权 | MCP 侧拒绝请求；后端 API 仍需重复拒绝 |
| 对象越权 | 不暴露对象 Resource；如果被构造请求则返回 `OBJECT_NOT_ALLOWED` |
| 行为越权 | 不暴露行为 Tool；如果被构造请求则返回 `ACTION_NOT_ALLOWED` |
| 条件权限不满足 | 返回缺失条件、审批要求或当前上下文不满足原因 |

标准错误响应：

```json
{
  "ok": false,
  "tool": "ontology_reason_execute",
  "error": {
    "code": "INSUFFICIENT_FACTS",
    "message": "缺少物料可用库存，无法完成生产订单下达校验。",
    "missingFields": ["InventoryBalance.availableQty"]
  },
  "followUpQuestions": [
    "是否允许从 WMS 查询物料可用库存？"
  ],
  "recoverable": true
}
```

## 7. 关键用户故事

### US-01 创建制造业本体

作为业务专家，我希望可以创建“生产制造”领域本体，并定义面向库存生产、面向订单生产两个业务场景，以便后续对象、行为、规则和事件都归属到清晰的业务边界。

验收标准：

- 可以创建领域和业务场景。
- 可以在场景下创建对象、行为、规则和事件。
- 同一对象在不同场景下可以有不同规则。

### US-02 定义生产订单聚合根

作为建模人员，我希望把生产订单定义为聚合根，并配置物料、BOM、工单、库存、工艺路线之间的关系，以便系统知道生产订单下达需要哪些事实。

验收标准：

- 可以定义聚合根、属性、关系和值对象。
- 可以标记主键、状态字段和数据获取方式。
- 可以生成对象 Schema 和 MCP Resource。

### US-03 定义生产订单下达行为

作为业务专家，我希望定义“生产订单下达”行为，并绑定物料齐套校验和工艺路线校验，以便 Agent 在执行下达前自动检查业务规则。

验收标准：

- 行为必须挂载在 ProductionOrder 聚合根。
- 行为必须声明 inputSchema。
- 行为执行前必须运行规则。
- 任一 P0 规则失败时不得执行。
- 成功后发布 `ProductionOrderReleased` 事件。

### US-04 Agent 校验业务计划

作为 Agent 开发者，我希望 Agent 在生成生产订单处理计划后调用 `ontology_plan_validate`，以便发现漏掉的校验步骤和错误顺序。

验收标准：

- 多步骤计划执行前必须通过计划验证。
- 计划缺少物料齐套或工艺路线校验时返回遗漏步骤。
- 计划顺序错误时返回调整建议。

### US-05 规则推理与解释

作为一线计划员，我希望问“PO-1001 为什么不能下达”时，Agent 能返回具体缺料、异常工艺路线和命中规则，而不是泛泛回答。

验收标准：

- Agent 必须调用规则推理或路径回溯工具。
- 返回命中规则、输入事实、失败原因和建议动作。
- 回答中不得编造本体不存在的字段或规则。

### US-06 事件追踪

作为审计人员，我希望查看一个生产订单从创建、下达、投料、报工、产出到技术关闭的完整事件链，以便追踪业务过程。

验收标准：

- 可以按生产订单 ID 查询事件时间线。
- 每个事件包含发布行为、操作者、时间、载荷摘要和本体版本。
- 支持导出审计记录。

### US-07 Agent 权限裁剪

作为平台管理员，我希望给不同 Agent 分配最小权限，并让 MCP Server 按权限动态裁剪工具和资源，以便 Agent 只能看到和调用被授权的对象、字段和行为。

验收标准：

- Agent 默认无权限，未授权时不能看到业务对象 Resource 和行为 Tool。
- 授权后，MCP Server 按角色、本体版本和业务域生成 Agent 专属 Manifest。
- 无权限对象不出现在 Resource 列表中。
- 无权限字段不出现在 Schema 中，敏感字段按策略隐藏或脱敏。
- 无权限行为不出现在 Tool 列表中，需审批行为必须返回审批要求。
- Agent 构造越权参数时，MCP Server 在调用后端 API 前拒绝。
- 后端 API 对同一请求再次执行最终鉴权。

## 8. MVP 范围

### 8.1 必做范围

| 模块 | MVP 内容 |
|---|---|
| 语义建模 | 领域、场景、对象、属性、关系、状态、数据获取方式 |
| 行为建模 | 行为定义、参数 Schema、聚合根入口标记 |
| 规则建模 | 前置规则、规则执行结果、缺失事实返回 |
| 指标建模 | 准时完工率、工单平均完成时间两个指标样例 |
| 事件建模 | 领域事件定义、行为声明式发布、事件存储 |
| MCP 工具 | 入口解析、计划验证、语义检查、规则推理、路径回溯 |
| 治理 | 本体版本、调用审计、角色权限、对象级权限、字段级权限、行为权限 |
| MCP 治理 | Agent Manifest、工具动态裁剪、资源动态裁剪、请求边界校验 |
| 后端 API 鉴权 | 后端最终鉴权、字段脱敏、对象级过滤、行为执行授权 |
| 制造模板 | 生产订单、物料、BOM、库存、工艺路线、工单模板 |

### 8.2 暂不做

| 不做 | 原因 |
|---|---|
| 不存储完整业务实例数据 | 本体平台是语义与规则层，不替代 ERP/MES/WMS |
| 不做通用工作流引擎 | 行为编排由 Agent 或外部工作流系统负责 |
| 不做 BI 报表 | 本体只定义指标口径，展示由 BI 工具负责 |
| 不直接训练 LLM | 平台提供上下文、规则和工具，不训练模型参数 |
| 不开放 Agent 静默修改正式本体 | 本体演化必须版本化并经过审核 |

## 9. 端到端示例

用户：

```text
帮我检查生产订单 PO-1001 能不能下达。
```

推荐调用链：

```text
ontology_intent_parse
  -> ontology_semantic_check
  -> ontology_plan_validate
  -> ontology_reason_execute
  -> ontology_explain_trace
```

规则推理入参示例：

```json
{
  "ruleSet": "ProductionOrderRelease",
  "facts": [
    { "subject": "PO-1001", "predicate": "productMaterial", "object": "MAT-FG-001" },
    { "subject": "PO-1001", "predicate": "requiredQty", "object": 100 },
    { "subject": "MAT-RM-001", "predicate": "availableQty", "object": 80 },
    { "subject": "MAT-RM-001", "predicate": "requiredQty", "object": 100 },
    { "subject": "MAT-FG-001", "predicate": "validRoutingCount", "object": 1 },
    { "subject": "MAT-FG-001", "predicate": "routingHasCycle", "object": false }
  ],
  "explain": true
}
```

本体返回：

```json
{
  "ok": true,
  "conclusion": "blocked",
  "label": "不可下达",
  "matchedRules": [
    {
      "ruleId": "MATERIAL_KITTING_CHECK",
      "version": "1.0.0",
      "passed": false,
      "reason": "MAT-RM-001 可用库存 80，小于需求 100。"
    },
    {
      "ruleId": "ROUTING_VALIDATION_CHECK",
      "version": "1.0.0",
      "passed": true
    }
  ],
  "suggestedActions": [
    "补足 MAT-RM-001 至至少 100。",
    "或配置经批准的替代料。"
  ]
}
```

Agent 回答：

```text
生产订单 PO-1001 当前不能下达。原因是物料齐套校验未通过：MAT-RM-001 可用库存为 80，低于工单需求量 100。工艺路线校验已通过，该成品物料存在且仅存在一条有效工艺路线，工序顺序没有环。建议先补足 MAT-RM-001，或配置经批准的替代料后再重新下达。
```

## 10. 路线图

| 阶段 | 时间 | 目标 |
|---|---|---|
| MVP | 4-6 周 | 完成制造业语义、行为、规则、事件基础闭环和 5 个 MCP 工具 |
| V1.1 | 6-10 周 | 增加事件路由、事件处理器、跨本体映射、上下文绑定 |
| V1.5 | 3 个月 | 支持 Agent Manifest 编译、动态 MCP 工具、写入审批 |
| V2.0 | 6 个月 | 支持假设推演、规则命中率学习、行业模板市场 |

## 11. 待确认问题

1. 制造业模板的首个落地系统是 MES、ERP、WMS 还是三者组合。
2. 规则引擎优先采用数据库规则表、Java 规则服务，还是引入独立规则引擎。
3. MCP Server 是集成在现有 Spring Boot 服务中，还是单独部署。
4. 写入类能力是否必须人工审批，是否允许特定 Agent 自动提交草稿。
5. 生产订单、工单、BOM 的主数据以哪个系统为主数据源。
6. 事件存储是否需要满足事件溯源级别的不可变审计要求。
