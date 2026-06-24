# Agent LLM 与本体 MCP Server 互动设计

本文定义 Agent LLM 与本体模型 MCP Server 的典型互动方式。目标是把本体从“被动知识库”提升为 Agent 的语义标准、规则推理、冲突裁决和经验沉淀层。

## 1. 设计目标

Agent LLM 负责自然语言理解、任务拆解、上下文组织和最终表达。本体 MCP Server 负责结构化知识查询、语义标准解释、规则推理、计划校验、可解释路径返回和受控知识演化。

核心目标：

- 让 Agent 在遇到专业概念、业务规则、语义歧义或多 Agent 冲突时主动查询本体。
- 让本体返回结构化、可追溯、可验证的结果，而不是只返回文本解释。
- 将只读查询、推理验证、写入演化三类能力分层授权。
- 为未来 MCP tools、resources、prompts 的实现提供稳定接口草案。

## 2. 总体交互模式

```text
用户输入
  |
  v
Agent LLM 理解意图并识别是否需要本体支持
  |
  v
调用本体 MCP Server tool/resource
  |
  v
本体执行概念查询、语义解释、规则推理、计划验证或知识写入
  |
  v
MCP Server 返回结构化结果、置信度、来源和推导链
  |
  v
Agent LLM 生成回答、修正计划、继续调用工具或提交写入建议
```

## 3. 十一类典型互动场景

| # | 场景 | LLM 角色 | 本体角色 | 触发时机 | 交互类型 |
|---|---|---|---|---|---|
| 1 | 概念查询 | 提问者 | 知识库 | 收到任何业务相关查询的第一步 | 只读查询 |
| 2 | 任务规划验证 | 生成者 | 审核者 | 生成多步计划后 | 验证 |
| 3 | 语义标准查询 | 理解者 | 解释者 | 拿到业务数据需要判断 | 只读查询 |
| 4 | 规则推理 | 提供事实 | 精确计算 | 多维度事实需要综合判断 | 推理 |
| 5 | 存储反馈 | 经验提炼者 | 结构化存储 | 任务完成且有验证结果 | 写入 |
| 6 | 冲突裁决 | 检测冲突 | 权威裁定 | 多规则或多 Agent 结论矛盾 | 验证/裁决 |
| 7 | 概念演化 | 发现新概念 | 扩展定义 | 现有概念无法覆盖新场景 | 写入/审核 |
| 8 | 路径回溯 | 请求解释 | 返回推导链 | 用户质疑结论依据 | 可解释查询 |
| 9 | 上下文继承 | 使用指代 | 维护实体绑定 | 多轮对话中出现“这个/该对象”等指代 | 状态查询 |
| 10 | 跨本体映射 | 发现术语差异 | 提供对齐关系 | 不同系统术语不一致 | 映射查询 |
| 11 | 假设推演 | 提出假设 | 执行反事实推理 | 用户问“如果...会怎样” | 推理 |

## 4. 场景定义

### 场景 1：概念查询 `ontology_intent_parse`

目的：将自然语言意图映射到本体概念图谱。

输入：用户原始查询字符串。

输出：

- 核心概念，例如 `SupplierRisk`
- 关联概念列表
- 涉及的实体实例，例如供应商 ABC
- 建议的查询维度

LLM 触发时机：收到任何业务相关查询的第一步。

### 场景 2：任务规划验证 `ontology_plan_validate`

目的：检查 LLM 生成的执行计划是否完整、合规。

输入：初步执行计划，即步骤列表。

输出：

- 遗漏步骤
- 顺序调整建议
- 约束条件提醒
- 依赖关系修正

LLM 触发时机：生成多步骤计划后，执行前。

### 场景 3：语义标准查询 `ontology_semantic_check`

目的：解释业务数据在本体中的含义和判断标准。

输入：原始数据值和概念名。

输出：

- 字段业务定义
- 阈值标准，例如制造业 `debt_ratio > 0.7` 为高风险
- 关联检查项
- 数据质量状态，例如是否过期

LLM 触发时机：拿到原始数据后，做业务判断前。

### 场景 4：规则推理 `ontology_reason_execute`

目的：基于事实执行精确的逻辑或数学推理。

输入：结构化事实数据。

输出：

- 综合结论，例如风险等级
- 置信度
- 触发因素权重
- 建议行动

LLM 触发时机：多维度数据收集完毕后。

### 场景 5：存储反馈 `ontology_learn_case`

目的：记录验证案例，更新规则命中率，发现盲区。

输入：案例摘要、预测结果和实际结果。

输出：

- 规则命中率统计
- 新发现的规则盲区
- 本体扩展建议

LLM 触发时机：任务完成，有验证反馈时。

### 场景 6：冲突裁决 `ontology_conflict_resolve`

目的：解决多规则或多 Agent 结论冲突。

输入：冲突项列表，包括来源、结论、置信度。

输出：

- 最终裁决结论
- 裁决路径，即为什么选这个结论
- 被否决的异议及原因

LLM 触发时机：检测到结论矛盾时。

### 场景 7：概念演化 `ontology_concept_evolve`

目的：发现现有概念无法覆盖新场景，触发本体扩展。

输入：新场景描述和现有概念匹配失败记录。

输出：

- 建议新增概念
- 与现有概念的关系建议
- 审批流程触发

LLM 触发时机：反复遇到无法归类的业务场景。

### 场景 8：路径回溯 `ontology_explain_trace`

目的：追溯推理结论的推导路径。

输入：结论和目标实体。

输出：

- 完整推理路径，即概念 -> 关系 -> 规则 -> 结论
- 每步的依据
- 置信度传递

LLM 触发时机：用户质疑为什么是这个结论。

### 场景 9：上下文继承 `ontology_context_bind`

目的：多轮对话中保持概念实例的状态一致性。

输入：当前查询和会话历史。

输出：

- 指代消解结果
- 当前活跃的实体绑定
- 缺失的上下文提示

LLM 触发时机：出现“该供应商”“这个合同”等指代时。

### 场景 10：跨本体映射 `ontology_cross_map`

目的：不同部门或系统本体概念不一致时对齐。

输入：源概念和目标系统。

输出：

- 概念等价关系
- 属性映射
- 关系映射
- 冲突标记与转换函数

LLM 触发时机：多系统集成时发现术语差异。

### 场景 11：假设推演 `ontology_what_if`

目的：基于当前本体模拟反事实场景。

输入：假设条件和基准状态。

输出：

- 推演结论
- 关键敏感因子
- 置信度变化

LLM 触发时机：用户问“如果...会怎样”。

## 5. 能力分层

| 能力层 | 覆盖场景 | 代表工具 | 权限建议 |
|---|---|---|---|
| 查询层 | 1, 3, 8, 9, 10 | `ontology_intent_parse`, `ontology_semantic_check`, `ontology_explain_trace`, `ontology_context_bind`, `ontology_cross_map` | 默认允许 |
| 验证层 | 2, 6 | `ontology_plan_validate`, `ontology_conflict_resolve` | 默认允许，记录审计日志 |
| 推理层 | 4, 11 | `ontology_reason_execute`, `ontology_what_if` | 默认允许，限制耗时和深度 |
| 写入层 | 5, 7 | `ontology_learn_case`, `ontology_concept_evolve` | 需要授权、版本记录和审核 |

## 6. MCP Tool 清单草案

### 6.1 `ontology_intent_parse`

用于概念查询。Agent 收到业务相关查询后，先将自然语言意图映射到本体概念图谱。

```json
{
  "name": "ontology_intent_parse",
  "description": "Map a natural language business query to ontology concepts, entity instances, and recommended query dimensions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "domain": { "type": "string" },
      "conversationId": { "type": "string" }
    },
    "required": ["query"]
  }
}
```

返回建议：

```json
{
  "coreConcept": {
    "conceptId": "SupplierRisk",
    "label": "供应商风险"
  },
  "relatedConcepts": ["FinancialRisk", "ComplianceRisk", "DeliveryRisk"],
  "entityInstances": [
    {
      "entityId": "SupplierABC",
      "label": "供应商 ABC",
      "type": "Supplier"
    }
  ],
  "suggestedDimensions": ["financial", "delivery", "compliance", "quality"],
  "confidence": 0.93
}
```

### 6.2 `ontology_plan_validate`

用于任务规划验证。Agent 生成多步计划后，请本体检查是否缺步骤、违反约束或顺序错误。

```json
{
  "name": "ontology_plan_validate",
  "description": "Validate a multi-step task plan against ontology constraints and process rules.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "taskGoal": { "type": "string" },
      "steps": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "description": { "type": "string" },
            "dependsOn": {
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["id", "description"]
        }
      },
      "domain": { "type": "string" }
    },
    "required": ["taskGoal", "steps"]
  }
}
```

返回建议：

```json
{
  "valid": false,
  "missingSteps": [
    {
      "after": "step-2",
      "description": "校验供应商合规状态和黑名单记录。"
    }
  ],
  "orderSuggestions": [],
  "constraintReminders": [
    {
      "constraintId": "RiskAssessment.RequiresComplianceCheck",
      "message": "风险评级前必须完成合规数据校验。"
    }
  ],
  "dependencyFixes": []
}
```

### 6.3 `ontology_semantic_check`

用于语义标准查询。Agent 拿到业务字段、指标或枚举值后，查询它在本体中的标准含义。

```json
{
  "name": "ontology_semantic_check",
  "description": "Explain the standard meaning, value range, unit, and interpretation rules of a business term or data field.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conceptName": { "type": "string" },
      "fieldName": { "type": "string" },
      "rawValue": {},
      "domain": { "type": "string" },
      "sourceSystem": { "type": "string" }
    },
    "required": ["conceptName", "rawValue"]
  }
}
```

### 6.4 `ontology_reason_execute`

用于规则推理。Agent 提交事实，本体规则引擎返回判断结果。

```json
{
  "name": "ontology_reason_execute",
  "description": "Run ontology rules on provided facts and return inferred conclusions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ruleSet": { "type": "string" },
      "facts": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "subject": { "type": "string" },
            "predicate": { "type": "string" },
            "object": {}
          },
          "required": ["subject", "predicate", "object"]
        }
      },
      "explain": { "type": "boolean", "default": true }
    },
    "required": ["facts"]
  }
}
```

### 6.5 `ontology_learn_case`

用于存储反馈。Agent 在任务完成后，把经过验证的经验、结果和证据结构化提交给本体。

```json
{
  "name": "ontology_learn_case",
  "description": "Store a validated case, update rule hit statistics, and detect ontology blind spots.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "caseSummary": { "type": "string" },
      "predictedResult": {},
      "actualResult": {},
      "evidence": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": { "type": "string" },
            "content": { "type": "string" },
            "source": { "type": "string" }
          }
        }
      }
    },
    "required": ["caseSummary", "predictedResult", "actualResult"]
  }
}
```

写入策略：

- 预测结果与实际结果不一致时默认进入待审核区，不直接修改正式本体。
- 所有写入必须生成版本号、操作者、来源任务和回滚点。
- 写入类工具默认不允许 Agent 静默执行，应由策略层或人工审批控制。

### 6.6 `ontology_conflict_resolve`

用于冲突裁决。多个规则、多 Agent 或多个系统返回矛盾结论时调用。

```json
{
  "name": "ontology_conflict_resolve",
  "description": "Resolve conflicting conclusions using ontology authority, rule priority, evidence strength, and version metadata.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conflicts": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "claim": { "type": "string" },
            "source": { "type": "string" },
            "confidence": { "type": "number" },
            "evidence": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["claim", "source"]
        }
      },
      "domain": { "type": "string" }
    },
    "required": ["conflicts"]
  }
}
```

### 6.7 `ontology_concept_evolve`

用于概念演化。Agent 发现现有概念无法覆盖新场景时，提交新增或修改建议。

```json
{
  "name": "ontology_concept_evolve",
  "description": "Trigger ontology extension when existing concepts cannot cover repeated new business scenarios.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "newScenarioDescription": { "type": "string" },
      "failedMatches": {
        "type": "array",
        "items": { "type": "object" }
      },
      "observedExamples": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "required": ["newScenarioDescription", "failedMatches"]
  }
}
```

### 6.8 `ontology_explain_trace`

用于路径回溯。用户质疑结论依据时，Agent 请求本体返回推导链。

```json
{
  "name": "ontology_explain_trace",
  "description": "Return the reasoning path, matched rules, intermediate facts, and source evidence for a conclusion.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conclusionText": { "type": "string" },
      "targetEntity": { "type": "string" },
      "includeEvidence": { "type": "boolean", "default": true },
      "maxDepth": { "type": "integer", "default": 5 }
    },
    "required": ["conclusionText", "targetEntity"]
  }
}
```

### 6.9 `ontology_context_bind`

用于上下文继承。多轮对话中出现“这个供应商”“该风险”“刚才那个流程”等指代时调用。

```json
{
  "name": "ontology_context_bind",
  "description": "Resolve pronouns and context references to ontology entities in a multi-turn conversation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "currentQuery": { "type": "string" },
      "conversationHistory": {
        "type": "array",
        "items": { "type": "object" }
      }
    },
    "required": ["currentQuery", "conversationHistory"]
  }
}
```

### 6.10 `ontology_cross_map`

用于跨本体映射。不同系统或团队对同一概念使用不同术语时调用。

```json
{
  "name": "ontology_cross_map",
  "description": "Map terms across ontologies, domains, or source systems and return alignment relationships.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sourceConcept": { "type": "string" },
      "targetSystem": { "type": "string" },
      "sourceOntology": { "type": "string" }
    },
    "required": ["sourceConcept", "targetSystem"]
  }
}
```

### 6.11 `ontology_what_if`

用于假设推演。用户提出“如果...会怎样”时，Agent 将假设事实提交给本体执行反事实推理。

```json
{
  "name": "ontology_what_if",
  "description": "Run counterfactual reasoning on hypothetical facts and compare with current ontology conclusions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "hypothesisConditions": { "type": "array", "items": { "type": "object" } },
      "baselineState": { "type": "object" },
      "targetQuestion": { "type": "string" },
      "explainDifference": { "type": "boolean", "default": true }
    },
    "required": ["hypothesisConditions", "baselineState"]
  }
}
```

## 7. Agent 调用决策规则

Agent 不应在所有问题上都调用本体。推荐使用以下触发规则：

| 触发条件 | 推荐动作 |
|---|---|
| 收到业务相关查询 | 调用 `ontology_intent_parse` |
| 用户要求给出业务判断、评级、合规结论 | 调用 `ontology_semantic_check` 和 `ontology_reason_execute` |
| Agent 生成了多步执行计划 | 调用 `ontology_plan_validate` |
| 多个来源给出矛盾结论 | 调用 `ontology_conflict_resolve` |
| 用户追问“为什么”“依据是什么” | 调用 `ontology_explain_trace` |
| 多轮对话出现指代歧义 | 调用 `ontology_context_bind` |
| 不同系统字段或术语不一致 | 调用 `ontology_cross_map` |
| 用户提出反事实问题 | 调用 `ontology_what_if` |
| 任务完成且结果已被验证 | 调用 `ontology_learn_case`，或提交人工审核 |
| 反复遇到无法归类的业务场景 | 调用 `ontology_concept_evolve` |

## 8. 调用控制机制

### 8.1 LLM 何时需要调用本体

推荐采用“默认业务入口解析 + 条件触发”的组合策略。

任何业务相关查询进入 Agent 后，第一步调用 `ontology_intent_parse`，用于识别核心概念、实体实例、业务域和建议查询维度。之后是否继续调用其他本体能力，由意图、数据状态和任务阶段决定。

必须调用本体的情况：

| 情况 | 原因 | 必调工具 |
|---|---|---|
| 用户输入包含业务对象、指标、合同、供应商、客户、风险、合规等领域语义 | 需要先把自然语言映射到本体概念 | `ontology_intent_parse` |
| Agent 需要给出评级、判断、审批、合规、风险结论 | 结论必须基于标准和规则 | `ontology_semantic_check`, `ontology_reason_execute` |
| Agent 生成了多步骤计划并准备执行 | 执行前需要检查完整性、顺序和约束 | `ontology_plan_validate` |
| 原始数据字段或指标含义不确定 | 防止误读字段、阈值、口径和单位 | `ontology_semantic_check` |
| 多个 Agent、系统或规则给出冲突结论 | 需要权威裁决路径 | `ontology_conflict_resolve` |
| 用户追问依据、为什么、怎么算出来的 | 需要可解释推理链 | `ontology_explain_trace` |
| 多轮对话出现“这个”“该供应商”“刚才那个合同”等指代 | 需要保持实体绑定一致 | `ontology_context_bind` |
| 跨系统集成发现术语、字段、模型不一致 | 需要概念和属性映射 | `ontology_cross_map` |
| 用户提出反事实问题 | 需要基于规则模拟变化 | `ontology_what_if` |
| 任务完成且有实际结果反馈 | 需要沉淀案例和发现规则盲区 | `ontology_learn_case` |
| 多次出现无法归类的新业务场景 | 需要触发概念演化 | `ontology_concept_evolve` |

### 8.2 调用本体的哪个能力

Agent 应使用意图路由表选择工具，而不是让模型自由猜测工具名。

| 用户意图或内部状态 | 本体能力 | 工具 |
|---|---|---|
| “这是什么意思”“帮我判断某对象” | 概念图谱解析 | `ontology_intent_parse` |
| “这个计划能不能执行”“步骤是否完整” | 计划验证 | `ontology_plan_validate` |
| “这个字段/指标/值代表什么” | 语义标准检查 | `ontology_semantic_check` |
| “综合这些数据给出结论” | 规则推理 | `ontology_reason_execute` |
| “结果和实际不一致，记录下来” | 案例学习 | `ontology_learn_case` |
| “两个结论矛盾，以哪个为准” | 冲突裁决 | `ontology_conflict_resolve` |
| “这个新场景没法归类” | 概念演化 | `ontology_concept_evolve` |
| “为什么是这个结论” | 路径回溯 | `ontology_explain_trace` |
| “这个/该对象/刚才那个” | 上下文绑定 | `ontology_context_bind` |
| “A 系统字段和 B 系统字段怎么对应” | 跨本体映射 | `ontology_cross_map` |
| “如果条件变化会怎样” | 假设推演 | `ontology_what_if` |

复杂任务中允许链式调用。例如供应商风险评估的推荐调用顺序：

```text
ontology_intent_parse
  -> ontology_plan_validate
  -> ontology_semantic_check
  -> ontology_reason_execute
  -> ontology_explain_trace
  -> ontology_learn_case
```

### 8.3 如何传递参数

参数传递采用三段式结构：原始输入、结构化上下文、控制选项。

```json
{
  "rawInput": {
    "query": "帮我判断供应商 ABC 的风险等级",
    "language": "zh-CN"
  },
  "context": {
    "conversationId": "conv-001",
    "domain": "procurement",
    "ontologyVersion": "1.2.0",
    "activeEntities": [
      {
        "entityId": "SupplierABC",
        "entityType": "Supplier",
        "label": "供应商 ABC"
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

不同工具的业务参数放在 `payload` 中。例如 `ontology_reason_execute`：

```json
{
  "rawInput": {
    "query": "综合这些数据给出供应商 ABC 风险等级"
  },
  "context": {
    "conversationId": "conv-001",
    "domain": "procurement",
    "ontologyVersion": "1.2.0"
  },
  "payload": {
    "ruleSet": "SupplierRiskAssessment",
    "facts": [
      { "subject": "SupplierABC", "predicate": "financialScore", "object": 62 },
      { "subject": "SupplierABC", "predicate": "onTimeDeliveryRate", "object": 0.81 },
      { "subject": "SupplierABC", "predicate": "complianceStatus", "object": "normal" },
      { "subject": "SupplierABC", "predicate": "qualityIncidentCount", "object": 3 }
    ]
  },
  "options": {
    "explain": true,
    "maxDepth": 5
  }
}
```

参数传递规则：

- `rawInput` 保留用户原始表达，便于追溯和纠错。
- `context` 传递会话、本体版本、业务域、活跃实体、权限和租户信息。
- `payload` 传递当前工具的结构化业务参数。
- `options` 传递推理深度、是否解释、超时时间、返回数量等控制项。
- 所有实体优先传 `entityId`，没有 ID 时再传 `label` 和 `type`。
- 所有判断型调用必须带 `domain` 和 `ontologyVersion`，否则结果不可审计。

### 8.4 如何确保 LLM 一定会调用

不能只依赖 LLM 自觉调用工具，应在 Agent 编排层加入强制门控。

推荐四层控制：

| 控制层 | 机制 | 示例 |
|---|---|---|
| System Prompt | 明确规定哪些场景必须调用本体 | “任何业务相关查询必须先调用 `ontology_intent_parse`。” |
| Tool Router | 在模型生成回答前执行规则路由 | 检测到“风险等级”时强制插入 `ontology_reason_execute` |
| Workflow Gate | 关键阶段没有本体结果就不能进入下一步 | 没有 `ontology_plan_validate.valid=true` 不允许执行计划 |
| Response Guard | 最终回答前检查依据完整性 | 没有规则结果时禁止输出确定性评级 |

建议的硬性约束：

```text
IF query.isBusinessRelated == true
THEN ontology_intent_parse MUST be called before final answer.

IF answer.containsBusinessJudgement == true
THEN ontology_semantic_check OR ontology_reason_execute MUST provide evidence.

IF task.plan.steps.length > 1
THEN ontology_plan_validate MUST pass before execution.

IF user.asksWhy == true AND conclusion.exists == true
THEN ontology_explain_trace MUST be called.
```

最终回答也应带有本体调用痕迹检查：

```json
{
  "answerAllowed": true,
  "requiredOntologyCalls": ["ontology_intent_parse", "ontology_reason_execute"],
  "completedOntologyCalls": ["ontology_intent_parse", "ontology_reason_execute"],
  "missingCalls": []
}
```

如果 `missingCalls` 非空，Agent 不能直接回答，只能继续调用工具或说明缺少必要依据。

### 8.5 调用失败或参数缺失时如何处理

失败处理分为参数缺失、工具失败、无匹配结果和推理冲突四类。

| 异常类型 | 处理方式 | Agent 行为 |
|---|---|---|
| 参数缺失 | MCP 返回 `missingFields` 和 `followUpQuestions` | 向用户追问，或调用其他工具补齐 |
| 工具超时/服务不可用 | 返回 `TOOL_TIMEOUT` 或 `SERVICE_UNAVAILABLE` | 降级为说明无法完成权威判断，不输出确定性结论 |
| 概念无匹配 | 返回 `NO_CONCEPT_MATCH` | 记录失败，必要时调用 `ontology_concept_evolve` |
| 事实不足无法推理 | 返回 `INSUFFICIENT_FACTS` | 列出缺失事实，暂停结论生成 |
| 多规则冲突 | 返回 `RULE_CONFLICT` | 调用 `ontology_conflict_resolve` |
| 权限不足 | 返回 `PERMISSION_DENIED` | 请求授权或进入人工审批 |

标准缺参响应：

```json
{
  "ok": false,
  "tool": "ontology_reason_execute",
  "error": {
    "code": "INSUFFICIENT_FACTS",
    "message": "缺少供应商交付准时率，无法完成风险等级推理。",
    "missingFields": ["onTimeDeliveryRate"]
  },
  "followUpQuestions": [
    "是否可以提供供应商 ABC 最近 12 个月的交付准时率？"
  ],
  "recoverable": true
}
```

Agent 处理策略：

```text
1. 如果缺失参数可以从会话历史中恢复，先调用 ontology_context_bind。
2. 如果缺失参数可以从本体标准中推导，调用 ontology_semantic_check。
3. 如果仍缺失关键事实，向用户提出最少数量的追问。
4. 如果工具失败且无法恢复，明确说明无法给出权威本体结论。
5. 不允许把无本体依据的猜测包装成确定性业务结论。
```

## 9. 标准响应结构

所有 MCP tools 建议统一返回以下外层结构，便于 Agent 稳定解析。

```json
{
  "ok": true,
  "tool": "ontology_intent_parse",
  "requestId": "req-20260609-001",
  "data": {},
  "confidence": 0.91,
  "sources": [
    {
      "type": "ontology",
      "id": "ontology:v1.2",
      "uri": "ontology://domain/supplier-risk"
    }
  ],
  "warnings": [],
  "audit": {
    "ontologyVersion": "1.2.0",
    "ruleVersion": "2026.06",
    "timestamp": "2026-06-09T16:00:00+08:00"
  }
}
```

错误响应：

```json
{
  "ok": false,
  "tool": "ontology_reason_execute",
  "requestId": "req-20260609-002",
  "error": {
    "code": "MISSING_REQUIRED_FACT",
    "message": "缺少供应商履约记录，无法完成风险评级。",
    "missingFields": ["deliveryPerformance"]
  },
  "followUpQuestions": [
    "是否可以提供该供应商最近 12 个月的交付准时率？"
  ]
}
```

## 10. 权限与治理

### 10.1 只读工具

只读工具包括：

- `ontology_intent_parse`
- `ontology_semantic_check`
- `ontology_explain_trace`
- `ontology_context_bind`
- `ontology_cross_map`

这些工具默认允许 Agent 调用，但应记录 requestId、调用时间、调用来源和 ontologyVersion。

### 10.2 推理与验证工具

推理与验证工具包括：

- `ontology_plan_validate`
- `ontology_reason_execute`
- `ontology_conflict_resolve`
- `ontology_what_if`

这些工具需要限制最大推理深度、最大节点数量、超时时间和规则集范围。返回结果必须包含命中规则、关键事实和置信度。

### 10.3 写入工具

写入工具包括：

- `ontology_learn_case`
- `ontology_concept_evolve`

写入类工具必须具备：

- 权限控制：区分 Agent 自动提交、人工审核通过、管理员发布。
- 版本管理：每次写入生成变更集和回滚点。
- 证据链：记录来源任务、原始事实、验证结果和操作者。
- 生命周期：草稿、待审核、已发布、已废弃。

## 11. 端到端示例

### 11.1 供应商风险评估

用户：

```text
帮我判断供应商 ABC 的风险等级。
```

Agent 判断：

```text
“供应商风险”是专业业务概念，需要先查询本体中的风险维度和规则。
```

调用 `ontology_intent_parse`：

```json
{
  "query": "帮我判断供应商 ABC 的风险等级。",
  "domain": "procurement"
}
```

本体返回：

```json
{
  "conceptId": "SupplierRisk",
  "dimensions": ["FinancialRisk", "DeliveryRisk", "ComplianceRisk", "QualityRisk"],
  "requiredFacts": ["financialScore", "onTimeDeliveryRate", "complianceStatus", "qualityIncidentCount"]
}
```

Agent 获取业务数据后调用 `ontology_reason_execute`：

```json
{
  "ruleSet": "SupplierRiskAssessment",
  "facts": [
    { "subject": "SupplierABC", "predicate": "financialScore", "object": 62 },
    { "subject": "SupplierABC", "predicate": "onTimeDeliveryRate", "object": 0.81 },
    { "subject": "SupplierABC", "predicate": "complianceStatus", "object": "normal" },
    { "subject": "SupplierABC", "predicate": "qualityIncidentCount", "object": 3 }
  ],
  "explain": true
}
```

本体返回：

```json
{
  "conclusion": "medium_risk",
  "label": "中风险",
  "matchedRules": [
    "DeliveryRisk.RateBelow85",
    "QualityRisk.IncidentCountAbove2"
  ],
  "reasoningPathId": "path-abc-risk-001"
}
```

Agent 最终回答：

```text
供应商 ABC 当前为中风险。主要依据是交付准时率低于 85%，且质量事故次数超过 2 次。合规状态正常，因此没有触发高风险规则。
```

### 11.2 用户追问依据

用户：

```text
为什么不是高风险？
```

Agent 调用 `ontology_explain_trace`：

```json
{
  "conclusionText": "SupplierABC is medium risk",
  "targetEntity": "SupplierABC",
  "includeEvidence": true,
  "maxDepth": 5
}
```

本体返回推导链后，Agent 解释：

```text
没有被判定为高风险，是因为高风险规则要求命中严重合规异常、财务评分低于 50，或交付准时率低于 70%。目前 ABC 的合规状态正常、财务评分为 62、交付准时率为 81%，因此只满足中风险条件。
```

## 12. 实现建议

后端实现时，可以将 MCP Server 映射到现有分层架构：

| MCP 层 | 建议模块 |
|---|---|
| Tool Adapter | `ontology-api` |
| 应用服务编排 | `ontology-application` |
| 本体概念、关系、规则领域模型 | `ontology-domain` |
| PostgreSQL、Apache AGE、Redis、规则引擎适配 | `ontology-infrastructure` |
| 通用响应、错误码、审计字段 | `ontology-common` |

优先级建议：

1. 第一阶段实现入口解析和只读查询：`ontology_intent_parse`, `ontology_semantic_check`, `ontology_cross_map`。
2. 第二阶段实现验证与推理：`ontology_plan_validate`, `ontology_reason_execute`, `ontology_explain_trace`。
3. 第三阶段实现上下文和反事实：`ontology_context_bind`, `ontology_what_if`。
4. 第四阶段实现写入治理：`ontology_learn_case`, `ontology_concept_evolve`。

## 13. 待确认问题

- 本体规则引擎使用 Apache AGE 图查询、数据库规则表，还是引入独立规则引擎。
- MCP Server 是作为现有 Spring Boot 服务的一组 endpoint 暴露，还是单独进程。
- 写入类工具是否要求人工审批工作流。
- 多租户或多业务域下，本体版本如何选择和隔离。
- Agent 是否需要在 system prompt 中被强制要求对特定场景调用本体工具。
