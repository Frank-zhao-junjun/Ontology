# EPC 流程创建时自动生成 8 个元模型草案

## 1. 背景与目标

### 1.1 背景

当前系统中：
- 业务链节点（A 价值域 / B 能力 / C 场景 / EPC 流程）与 E1-E8 元模型是两套独立数据
- 创建 EPC 流程时只生成 EPC 容器，不生成具体的 8 个元模型
- 用户需要额外手动或通过 AI 单独创建实体、状态机、规则、事件等

### 1.2 目标

统一建模入口：**创建 EPC 流程时，自动触发 AI 生成 8 个元模型草案**，使每个 EPC 流程自包含完整建模上下文，降低用户/Agent 建模成本。

---

## 2. 设计原则

| 原则 | 说明 |
|------|------|
| 强制完整 | 每个 EPC 流程必须包含完整的 8 个元模型草案 |
| AI 生成 | 基于 EPC 名称 + 描述，由 AI 自动推断并生成 8 个元模型 |
| 引用关联 | EPC 节点通过 `refs` 引用生成的元模型，不内嵌 |
| 复用优先 | 如果元模型已存在，优先复用，不重复创建 |
| 独立生命周期 | 修改/删除 EPC 不影响已生成的元模型 |
| 全渠道一致 | Web UI / MCP / CLI / Skill API 行为完全一致 |

---

## 3. 8 个元模型与 EPC 的映射

| 元模型 | 字段/内容 | EPC 中对应角色 |
|--------|----------|----------------|
| E1 数据模型 | 1 个核心实体 + 2-5 个属性 + 1-2 个关系 | EPC 操作的数据对象 |
| E2 行为模型 | 1 个状态机 + 3-5 个状态 + 转换规则 | EPC 中业务对象的状态流转 |
| E3 事件模型 | 1-2 个事件定义（创建/更新/状态变更） | EPC 中触发流程的事件 |
| E4 规则模型 | 1-2 条规则（字段校验/跨字段/跨实体） | EPC 中必须满足的业务规则 |
| E5 岗位角色 | 1 个部门 + 1-2 个岗位 + 职责 | EPC 中执行功能的组织单元 |
| E6 指标模型 | 1-2 个指标定义 | EPC 流程的衡量指标 |
| E7 约束模型 | 1-2 条一致性/完整性约束 | EPC 的全局约束 |
| E8 接口模型 | 1 个系统接口契约 | EPC 与外部系统的交互点 |

> 注：具体数量由 AI 根据 EPC 复杂度决定，但至少包含上述最小集合。

---

## 4. 关联关系设计

### 4.1 EPC 节点结构扩展

```typescript
interface EpcProcess {
  id: string;
  parentId: string; // 所属 Scenario id
  name: string;
  nameEn?: string;
  description?: string;
  // 新增：自动生成元模型的引用集合
  generatedRefs: EpcModelRef[];
  steps?: EpcStep[];
  semantics?: SemanticsBlock;
}
```

### 4.2 EpcModelRef

```typescript
interface EpcModelRef {
  modelType:
    | 'entity'           // E1
    | 'attribute'        // E1
    | 'relation'         // E1
    | 'state_machine'    // E2
    | 'state'            // E2
    | 'transition'       // E2
    | 'event_definition' // E3
    | 'subscription'     // E3
    | 'rule'             // E4
    | 'department'       // E5
    | 'position'         // E5
    | 'indicator'        // E6
    | 'constraint'       // E7
    | 'interface'        // E8
    | 'capability'
    | 'scenario'
    | 'value_domain';
  refId: string;      // 被引用模型元素 id
  refRole: 'subject' | 'object' | 'trigger' | 'actor' | 'constraint' | 'metric' | 'system' | 'input' | 'output' | 'owner' | 'consumer' | 'dependency' | 'extension';
  description?: string;
}
```

### 4.3 复用判定逻辑

当 AI 生成元模型草案时，先检查项目中是否已存在语义相近的元素：

```typescript
function findReusableElement(
  project: OntologyProject,
  modelType: EpcModelRef['modelType'],
  name: string,
  nameEn?: string,
): ModelElement | null {
  // 1. 精确匹配：name 或 nameEn 相同
  // 2. 模糊匹配：名称相似度 > 0.85（如使用 Levenshtein）
  // 3. 若找到，返回已有元素；否则返回 null
}
```

复用判定成功后，`generatedRefs` 引用已有元素 ID，不新建。

---

## 5. AI 生成 Prompt 设计

### 5.1 输入

```json
{
  "epcProcess": {
    "name": "生产订单审批流程",
    "nameEn": "ProductionOrderApproval",
    "description": "生产订单创建后，由车间主管审批，确认物料齐套后下达生产任务"
  },
  "domain": { "name": "离散制造" },
  "existingModels": {
    "entities": [...],
    "stateMachines": [...],
    "rules": [...]
  },
  "metadataList": [...]
}
```

### 5.2 输出 Schema

```json
{
  "dataModel": {
    "entities": [{ "name": "生产订单", "nameEn": "ProductionOrder", "role": "aggregate_root", "attributes": [...] }],
    "relations": [...]
  },
  "behaviorModel": {
    "stateMachines": [{ "name": "生产订单状态机", "states": [...], "transitions": [...] }]
  },
  "eventModel": {
    "eventDefinitions": [...]
  },
  "ruleModel": {
    "rules": [...]
  },
  "organizationModel": {
    "departments": [...],
    "positions": [...]
  },
  "indicatorModel": {
    "indicators": [...]
  },
  "constraintModel": {
    "constraints": [...]
  },
  "interfaceModel": {
    "interfaces": [...]
  },
  "refs": [
    { "modelType": "entity", "refId": "...", "refRole": "subject" }
  ]
}
```

### 5.3 系统提示词要点

```text
你是一位企业本体建模专家。请根据给定的 EPC 流程信息，自动生成完整的 8 个元模型草案。

约束：
1. 必须先检查 existingModels，语义相近的元素必须复用，不要重复创建
2. 每个 EPC 必须生成完整的 E1-E8 元模型
3. 实体名称使用中文，nameEn 使用大驼峰英文
4. 属性优先从 metadataList 中匹配标准元数据
5. 生成的 refs 必须准确指向对应模型元素
6. 不要生成过于复杂的模型，保持最小可用集合
```

---

## 6. 全渠道行为一致

### 6.1 Web UI

创建 EPC 流程时：
1. 用户填写 EPC 名称 + 描述
2. 点击「生成 8 个元模型草案」或自动触发
3. AI 生成草案并展示确认面板
4. 用户确认后，保存 EPC + 8 个元模型 + refs

### 6.2 MCP

`add_epc_process` tool 扩展：

```json
{
  "name": "add_epc_process",
  "arguments": {
    "parentId": "scenario-xxx",
    "name": "生产订单审批流程",
    "description": "...",
    "autoGenerateMetamodels": true
  }
}
```

返回：

```json
{
  "success": true,
  "epcProcessId": "epc-xxx",
  "generatedRefs": [...],
  "models": {
    "entities": [...],
    "stateMachines": [...]
  }
}
```

### 6.3 CLI

```bash
ontology epc add --scenario <scenario-id> --name "生产订单审批流程" --description "..." --generate-models
```

### 6.4 Skill API

`create_model` / 新增 `add_epc_process` operation：

```json
{
  "operation": "add_epc_process",
  "params": {
    "parentId": "scenario-xxx",
    "name": "生产订单审批流程",
    "description": "...",
    "autoGenerateMetamodels": true
  }
}
```

---

## 7. 实现计划

### Phase 1：核心后端能力
- 新增 `POST /api/generate-epc-metamodels` 接口
- 实现 AI Prompt 和输出解析
- 实现复用判定逻辑

### Phase 2：Store 层改造
- 扩展 `addEpcProcess` action，支持 `autoGenerateMetamodels` 参数
- 新增 `addEntity` / `addStateMachine` / `addRule` / `addEvent` / `addDepartment` / `addPosition` / `addIndicator` / `addConstraint` / `addInterface` 等方法
- 确保事务性：EPC 和 8 个元模型一起保存

### Phase 3：MCP / CLI / Skill API 扩展
- MCP `add_epc_process` 支持 `autoGenerateMetamodels`
- CLI 新增 `ontology epc add` 命令
- Skill API 扩展对应 operation

### Phase 4：Web UI
- EPC 创建面板增加「自动生成 8 个元模型草案」开关
- 生成结果预览面板

### Phase 5：文档与测试
- 更新 README / AGENTS.md
- 补充测试用例

---

## 8. 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| AI 生成质量不稳定 | 元模型草案可能不准确 | 生成后必须用户/Agent 确认，支持一键重新生成 |
| 复用判定误判 | 不同语义元素被错误复用 | 提高相似度阈值，增加 nameEn 精确匹配权重 |
| 元模型数量膨胀 | 大量 EPC 导致项目臃肿 | 删除 EPC 不删除元模型，需定期清理孤儿元模型 |
| 8 个元模型字段缺失 | `OntologyProject` 可能不支持某些模型 | 先补齐 indicator/constraint/interface 模型字段 |

---

## 9. 待确认问题

1. `OntologyProject` 是否已有 indicator/constraint/interface 模型的存储字段？如果没有，是否需要先扩展类型？
2. EPC 创建时默认开启自动生成，还是默认关闭、由用户/Agent 显式开启？
3. AI 生成失败时（如模型不可用），是否允许仅创建空 EPC 容器？
4. 是否需要为每个 EPC 保存生成历史（prompt/结果），便于追溯和重试？
5. 复用判定的相似度阈值建议为多少（默认 0.85 是否合适）？
