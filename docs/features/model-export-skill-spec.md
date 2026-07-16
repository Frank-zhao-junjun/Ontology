# 模型导出为 Skill 包 — 功能规格说明书

> 状态：待确认  
> 相关概念：第二个 Skill（已建好的本体模型作为 Agent 可消费的产物）  
> 核心约束：**不强制 confirmed 状态，任何状态均可导出，但必须在产物中标注每个本体对象的状态**

---

## 1. 背景与目标

### 1.1 背景
当前建模工具支持 4 种导出格式：JSON / YAML / Excel / Markdown。这些格式主要用于人工阅读、备份、协作或二次开发，但**无法被 Agent 直接理解和消费**。

### 1.2 目标
新增第 5 种导出格式 **Skill 包（ZIP）**，将本体模型封装为 Agent 可直接加载的领域知识技能。用户导出后，可导入到任意支持 Skill 的 Agent 框架，使 Agent 具备对该领域模型的理解、查询和推理能力。

### 1.3 与第一个 Skill 的区别

| 维度 | 第一个 Skill（建模能力） | 第二个 Skill（本 Spec） |
|------|------------------------|------------------------|
| 本质 | 工具技能：让 Agent 学会建模 | 知识技能：让 Agent 理解模型 |
| 内容 | API 端点、操作定义、配置示例 | 实体、属性、关系、规则、事件等完整模型 |
| 使用场景 | "帮我建一个物料模型" | "物料的编码规则是什么？" |
| 位置 | 首页 Skill Tab 下载 | UI 工作台导出功能中 |
| 文件大小 | 较小（约 10-20KB） | 取决于模型复杂度（10KB-数 MB） |

---

## 2. 用户故事

### US-1 业务人员导出模型给 Agent
> 作为业务分析师，我在 UI 中完成了「离散制造」领域的本体建模，希望导出为 Skill 包，交给 Agent 使用，让它能回答关于该领域模型的问题。

**验收标准**：
- 任何状态的模型都可以导出为 Skill
- 导出过程在 3 秒内完成
- 下载的 ZIP 可被常见解压工具打开
- 导出的文档中注明每个本体对象的状态

### US-2 Agent 消费导出的 Skill
> 作为 Agent 开发者，我拿到了用户导出的 Skill ZIP，希望直接加载到 Agent 框架中，无需手动解析原始 JSON。

**验收标准**：
- ZIP 内含 `skill.json` 清单文件
- 内含结构化的 `ontology.json` 模型数据
- 内含 `intents.json` 自然语言意图映射
- 内含 `README.md` 使用说明

### US-3 选择导出范围
> 作为建模人员，我希望只导出部分模块（如只导出数据模型 + 规则模型），而不是整个项目。

**验收标准**：
- 导出界面提供范围选择：全部 / 仅数据模型 / 仅行为模型 / 仅规则模型 / 仅流程模型 / 仅事件模型
- 未选择的部分不包含在 Skill 包中

---

## 3. 功能范围

### 3.1 In Scope
- UI 导出功能新增"Skill 包（ZIP）"选项
- 任何状态的模型均可导出，但导出的文档和每个本体对象上需标注状态
- 导出范围选择（全部/部分模型）
- 支持 4 种生成方式：UI 点击导出、Agent 调用 MCP、Agent 调用 CLI、Agent 调用 Skill API
- 后端生成 ZIP（skill.json + ontology.json + intents.json + README.md + examples/）
- 下载接口：`POST /api/export/skill`（请求体携带完整 project 对象，避免服务端无法访问浏览器 localStorage 中的项目数据）

### 3.2 Out of Scope（后续版本）
- 自动上传到 Skill 市场
- Agent 运行时动态加载
- 版本比对与差异导出
- 模型变更后自动同步到已发布 Skill

---

## 4. Skill 包结构

```
ontology-model-skill/
├── skill.json              # Skill 清单与元数据
├── SKILL.md                # Skill 能力说明（面向 Agent/开发者）
├── README.md               # 使用说明（面向最终用户）
├── ontology.json           # 完整或部分本体模型数据
├── intents.json            # 自然语言意图映射
└── examples/
    ├── query-examples.md   # 查询类示例
    └── reasoning-examples.md  # 推理类示例
```

### 4.1 skill.json

```json
{
  "name": "离散制造本体模型",
  "nameEn": "DiscreteManufacturingOntology",
  "version": "1.0.0",
  "description": "涵盖物料、BOM、工艺路线、生产订单等核心实体的离散制造领域本体模型",
  "domain": "离散制造",
  "exportedAt": "2026-07-01T12:00:00.000Z",
  "source": {
    "tool": "Ontology 本体模型建模工具",
    "url": "https://Ontology1.coze.site",
    "projectId": "proj-xxx"
  },
  "format": {
    "type": "ontology-model-skill",
    "version": "1.0"
  },
  "files": {
    "skill": "SKILL.md",
    "ontology": "ontology.json",
    "intents": "intents.json",
    "readme": "README.md"
  },
  "capabilities": [
    "entity-query",
    "relation-query",
    "rule-explanation",
    "state-transition-analysis",
    "event-impact-analysis"
  ]
}
```

### 4.2 ontology.json

直接复用项目数据结构，但根据导出范围过滤。每个本体对象保留原始状态字段（如 `status`、`confirmed`、`version` 等），并在 `metadata` 中汇总整体状态。

```json
{
  "metadata": {
    "projectId": "proj-xxx",
    "projectName": "生产管理",
    "domain": "离散制造",
    "description": "...",
    "exportedAt": "...",
    "scope": ["data", "behavior", "rule", "process", "event"],
    "projectStatus": "draft",
    "version": "1.0.0",
    "statusAnnotation": "本 Skill 由 draft 状态项目导出，部分对象可能尚未确认"
  },
  "dataModel": {
    "entities": [
      {
        "id": "ent-xxx",
        "name": "物料",
        "nameEn": "Material",
        "status": "confirmed",
        "...": "..."
      }
    ],
    "attributes": [
      {
        "id": "attr-xxx",
        "name": "物料编码",
        "nameEn": "materialCode",
        "status": "draft",
        "...": "..."
      }
    ],
    "relations": [...]
  },
  "behaviorModel": {
    "stateMachines": [...]
  },
  "ruleModel": {
    "rules": [...]
  },
  "processModel": {
    "orchestrations": [...]
  },
  "eventModel": {
    "eventDefinitions": [...],
    "subscriptions": [...]
  },
  "organization": {
    "departments": [...],
    "positions": [...]
  },
  "agentSemanticLayer": {
    "intents": [...],
    "terms": [...],
    "relations": [...]
  }
}
```

### 4.3 intents.json

基于模型自动生成或复用 Agent Semantic Layer 中的意图定义：

```json
{
  "intents": [
    {
      "id": "intent-material-query",
      "name": "查询物料信息",
      "triggerPhrases": [
        "物料的编码规则是什么",
        "查询物料 {materialName}",
        "物料有哪些属性"
      ],
      "action": "query_entity",
      "targetEntity": "Material",
      "slots": [
        { "name": "materialName", "required": false, "type": "string" }
      ]
    }
  ]
}
```

### 4.4 SKILL.md

面向 Agent 框架/开发者的核心说明文件，描述该 Skill 能做什么、如何调用、能力边界。典型结构：

```markdown
# 离散制造本体模型 Skill

## 能力概述
该 Skill 包含离散制造领域的核心本体模型，Agent 可基于它进行：
- 实体属性查询
- 实体关系推理
- 业务规则解释
- 状态机分析
- 事件影响分析

## 适用场景
- 回答关于物料、BOM、工艺路线、生产订单的结构化问题
- 辅助业务人员理解领域模型
- 作为 RAG 知识库补充

## 加载方式
### Coze
将 ontology.json 作为知识库导入，intents.json 作为意图示例。

### 自定义 Agent
读取 skill.json 和 ontology.json，根据 intents.json 的 triggerPhrases 匹配用户查询。

## 文件说明
- skill.json — Skill 元数据
- ontology.json — 本体模型数据
- intents.json — 自然语言意图映射

## 能力边界
- 仅回答模型中已定义的实体、属性、关系、规则
- 不涉及模型外的业务判断
- 不执行写操作

## 状态说明
本 Skill 从 `{projectStatus}` 状态的项目导出。对象级状态含义如下：
- `confirmed`：已确认对象，可放心使用
- `draft` / `review`：未最终确认，使用时需谨慎
- `unknown`：源数据中未记录状态，已按默认处理

## 示例查询
见 examples/query-examples.md
```

### 4.5 README.md

面向最终用户的说明文件，包含：
- Skill 简介
- 适用场景
- 导出时的项目状态说明
- 对象状态标注说明（draft / confirmed / unknown 等含义）
- 快速开始（如何加载到常见 Agent 框架）
- 文件说明
- 示例查询
- 限制与免责声明

### 4.6 examples/

- `query-examples.md`：10-20 个查询类示例
- `reasoning-examples.md`：5-10 个推理类示例

---

## 4.7 Markdown 导出格式

`md` 格式将按 scope 过滤后的 `ontology.json` 渲染为人类可读的 Markdown 文档，结构如下：

```markdown
# 离散制造本体模型

> 导出状态：draft
> 导出范围：all
> 导出时间：2026-07-01T12:00:00.000Z

## 数据模型

### 实体：物料（Material）

- 状态：confirmed
- 属性：
  - 物料编码（materialCode）：string，状态 confirmed
  - 物料名称（materialName）：string，状态 draft

### 关系：物料.BOM（MaterialHasBOM）

- 源实体：Material
- 目标实体：BOM
- 类型：one-to-many

## 行为模型
...

## 规则模型
...
```

渲染规则：
1. 一级标题为项目名称
2. 顶部 metadata 块包含导出状态、范围、时间
3. 每个模型按二级标题分组
4. 每个实体/状态机/规则按三级标题展示
5. 每个对象必须显示其 `status`
6. 空模型省略或显示「无数据」

---

## 4.8 intents.json 与 examples/ 生成算法

### 4.8.1 intents.json 生成规则

按以下顺序为模型中的对象生成意图：

1. **实体查询意图**：为每个 `Entity` 生成
   - id: `intent-query-entity-{nameEn}`
   - name: `查询{name}`
   - action: `query_entity`
   - targetEntity: `nameEn`
   - triggerPhrases: `["{name}是什么", "查询{name}", "{name}有哪些属性"]`

2. **实体解释意图**：为每个 `Entity` 生成
   - id: `intent-explain-entity-{nameEn}`
   - name: `解释{name}`
   - action: `explain_entity`
   - targetEntity: `nameEn`

3. **关系意图**：为每个 `Relation` 生成
   - id: `intent-relation-{relation.id}`（因 `Relation` 类型无 `sourceEn` 字段，使用 `relation.id` 保证唯一性）
   - name: `{relation.name}关系查询`
   - action: `query_relation`

4. **规则意图**：为每个 `Rule` 生成
   - id: `intent-rule-{id}`
   - name: `{name}规则解释`
   - action: `explain_rule`

5. **状态机意图**：为每个 `StateMachine` 生成
   - id: `intent-statemachine-{nameEn}`
   - name: `{name}状态分析`
   - action: `analyze_state_machine`

### 4.8.2 examples/ 生成规则

**query-examples.md**：
- 每个 Entity 2 条查询示例（属性查询 + 业务含义）
- 每个 Relation 1 条关系查询示例
- 每个 Rule 1 条规则解释示例
- 每个 StateMachine 1 条状态查询示例

**reasoning-examples.md**：
- 每个 Relation 1 条跨实体推理示例
- 每个 StateMachine 1 条状态转换推理示例
- 每个 Rule 1 条规则触发推理示例
- 至少 1 条跨模型综合推理示例（如：实体属性变化 → 规则触发 → 事件通知）

---

## 5. UI/UX 设计

### 5.1 入口位置
在建模工作台页面的导出功能区域，与 JSON / YAML / Excel / Markdown 并列。

### 5.2 交互流程

```
用户点击"导出"按钮
  └─ 弹出导出方式选择弹窗
      ├─ JSON
      ├─ YAML
      ├─ Excel
      ├─ Markdown
      └─ Skill 包（ZIP） ← 新增
          点击后弹出范围选择
            ├─ 全部模型
            ├─ 仅数据模型
            ├─ 仅行为模型
            ├─ 仅规则模型
            ├─ 仅流程模型
            └─ 仅事件模型
          用户确认后生成并下载 ZIP
```

### 5.3 状态标注
- 任何状态的项目均可导出为 Skill，不强制要求 `confirmed`
- 导出时在每个本体对象上保留并标注其原始状态
- README.md 和 SKILL.md 中需说明导出时的整体项目状态
- UI 中 Skill 选项始终可用，导出前给出提示："当前项目为 {status} 状态，导出的 Skill 将包含未确认对象"

### 5.4 视觉规范
- 遵循现有工作台设计风格
- 导出弹窗保持简洁
- Skill 选项使用 Lucide 的 `Package` 图标

---

## 6. API 设计

### 6.1 端点

```
POST /api/export/skill
```

### 6.2 请求体

```json
{
  "project": { /* 完整 OntologyProject 对象 */ },
  "scope": "all",
  "includeExamples": true,
  "includeSemanticLayer": true
}
```

### 6.3 参数说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project | `OntologyProject` | 是 | 完整项目对象。因项目数据存储在浏览器 localStorage，服务端无法通过 projectId 查询，故由前端传入完整对象 |
| scope | string | 否 | 导出范围：`all` / `data` / `behavior` / `rule` / `process` / `event`，默认 `all` |
| includeExamples | boolean | 否 | 是否包含 examples/，默认 `true` |
| includeSemanticLayer | boolean | 否 | 是否包含 `ontology.json` 中的 `agentSemanticLayer`，默认 `true` |

### 6.4 响应

成功：返回 `application/zip` 二进制流，Content-Disposition: attachment; filename="ontology-model-skill-{projectName}-v{version}.zip"

失败：
```json
{
  "success": false,
  "error": "PROJECT_NOT_FOUND",
  "message": "请求体中缺少 project 对象"
}
```

| HTTP 状态码 | error | 说明 |
|------------|-------|------|
| 200 | — | 成功，返回 ZIP 二进制 |
| 400 | MISSING_PROJECT | 请求体缺少 `project` |
| 400 | INVALID_SCOPE | `scope` 不在允许范围内 |
| 400 | EMPTY_SCOPE | `scope` 过滤后无任何模型数据 |
| 500 | INTERNAL_ERROR | 服务端内部错误 |

**说明**：导出不再校验 `confirmed` 状态，但会在响应头 `X-Project-Status` 和 ZIP 内的 `skill.json` / `ontology.json` 中注明项目状态。

---

## 6.5 Agent 通过 MCP / CLI / Skill API 导出模型

除了 UI 导出，Agent 通过 MCP、CLI、Skill API 接入建模能力后，也应能产出 5 种格式之一的本体模型制品。5 种格式统一为：`json` | `yaml` | `excel` | `md` | `skill`。4 种生成方式（UI / MCP / CLI / Skill API）行为一致，均不强制 `confirmed` 状态，但都会在产物中标注状态。

### 6.5.1 CLI

扩展 `ontology export` 命令：

```bash
# 导出 JSON（当前已实现）
ontology export <projectId> [outputPath]

# 显式指定格式
ontology export <projectId> [outputPath] --format=json
ontology export <projectId> [outputPath] --format=yaml
ontology export <projectId> [outputPath] --format=excel
ontology export <projectId> [outputPath] --format=md
ontology export <projectId> [outputPath] --format=skill

# Skill 格式可追加 scope
ontology export <projectId> ./my-skill.zip --format=skill --scope=data
```

**行为说明**：
1. CLI 先调用 `GET /api/projects/<projectId>` 获取完整项目对象
2. 若项目不存在，返回 `PROJECT_NOT_FOUND`
3. 根据 `--format` 选择导出路径：
   - `json` / `yaml` / `md`：调用本地序列化逻辑，写入文本文件
   - `excel`：调用 `/api/export/xlsx-from-manifest`，写入 `.xlsx`
   - `skill`：调用 `POST /api/export/skill`（请求体携带完整 project），写入 ZIP
4. 未指定 `--format` 时默认 `json`，保持向后兼容
5. `--scope` 仅在 `--format=skill` 时生效，其他格式自动忽略
6. 任何状态的项目均可导出；导出文件内会标注对象状态

### 6.5.2 MCP Server

**新增** `packages/ontology-mcp/src/tools/export-tools.ts`，注册 `ontology_project_export` 工具：

```json
{
  "name": "ontology_project_export",
  "arguments": {
    "projectId": "proj-xxx",
    "format": "skill",
    "scope": "all",
    "includeExamples": true,
    "includeSemanticLayer": true
  }
}
```

**参数说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 是 | 项目 ID |
| format | string | 否 | 导出格式：`json`/`yaml`/`excel`/`md`/`skill`，默认 `json` |
| scope | string | 否 | `skill` 格式专用，导出范围，默认 `all` |
| includeExamples | boolean | 否 | `skill` 格式专用，默认 `true` |
| includeSemanticLayer | boolean | 否 | `skill` 格式专用，默认 `true` |

**实现流程**：
1. MCP Server 通过 `projectStore.get(projectId)` 获取项目
2. 若不存在，返回 `PROJECT_NOT_FOUND`
3. 根据 `format` 处理：
   - `json` / `yaml` / `md`：本地生成文本内容返回
   - `excel`：调用 `POST /api/export/xlsx-from-manifest`
   - `skill`：调用 `POST /api/export/skill`（请求体携带完整 project）

**返回示例（skill 格式）**：

```json
{
  "success": true,
  "format": "skill",
  "filename": "ontology-model-skill-生产管理-v1.0.0.zip",
  "sizeBytes": 15360,
  "endpoint": "/api/export/skill",
  "method": "POST",
  "body": {
    "project": { /* 完整项目对象 */ },
    "scope": "all",
    "includeExamples": true,
    "includeSemanticLayer": true
  }
}
```

**返回示例（json/yaml/md 格式）**：

```json
{
  "success": true,
  "format": "json",
  "content": "{...}",
  "filename": "ontology-proj-xxx.json",
  "projectStatus": "draft"
}
```

**设计原则**：
- 大文件（excel/skill）返回 endpoint + body，由调用方自行下载，避免塞爆 MCP 消息体
- 小文件（json/yaml/md）直接返回内容，便于 Agent 立即使用
- 不强制项目状态为 `confirmed`，但返回内容中需包含 `projectStatus` 和对象级状态标注

### 6.5.3 Skill API

扩展 `export_manifest` 操作：

```json
{
  "operation": "export_manifest",
  "params": {
    "projectId": "proj-xxx",
    "format": "skill",
    "scope": "all",
    "includeExamples": true,
    "includeSemanticLayer": true
  }
}
```

**实现流程**：
1. Skill API 路由先调用 `GET /api/projects/<projectId>` 获取完整项目对象
2. 若项目不存在，返回 `{ success: false, error: 'PROJECT_NOT_FOUND' }`
3. 根据 `format` 处理：
   - `json` / `yaml` / `md`：本地生成文本内容返回
   - `excel`：调用 `POST /api/export/xlsx-from-manifest`
   - `skill`：调用 `POST /api/export/skill`（请求体携带完整 project）

**返回示例（skill 格式）**：

```json
{
  "success": true,
  "format": "skill",
  "filename": "ontology-model-skill-生产管理-v1.0.0.zip",
  "sizeBytes": 15360,
  "endpoint": "/api/export/skill",
  "method": "POST",
  "body": { /* 与 MCP 相同 */ }
}
```

**行为说明**：
- 与 MCP `ontology_project_export` 工具对齐
- `json`/`yaml`/`md`：返回 `content` 字段
- `excel`/`skill`：返回 `endpoint` + `method` + `body`
- 错误码统一：项目不存在返回 `PROJECT_NOT_FOUND`，导出范围为空返回 `EMPTY_SCOPE`
- 不强制 `confirmed` 状态，响应中返回 `projectStatus`

### 6.5.4 统一格式对照

| 格式 | UI 导出 | CLI | MCP | Skill API | 输出形式 |
|------|---------|-----|-----|-----------|----------|
| JSON | 已支持 | 已支持，默认 | 扩展后支持 | 扩展后支持 | 文本内容 |
| YAML | 已支持 | 扩展后支持 | 扩展后支持 | 扩展后支持 | 文本内容 |
| Excel | 已支持 | 扩展后支持 | 扩展后支持 | 扩展后支持 | 下载 URL |
| Markdown | 已支持 | 扩展后支持 | 扩展后支持 | 扩展后支持 | 文本内容 |
| Skill ZIP | 新增 | 扩展后支持 | 扩展后支持 | 扩展后支持 | 下载 URL |

---

## 7. 数据模型映射

### 7.1 状态字段

统一状态类型定义：

```typescript
// 项目级状态
type ProjectStatus = 'draft' | 'review' | 'confirmed' | 'archived';

// 对象级状态（实体、属性、关系、状态机、规则、事件等）
type ObjectStatus = 'draft' | 'confirmed' | 'archived' | 'unknown';

interface OntologyProject {
  // ... 已有字段
  status?: ProjectStatus;
  confirmedAt?: string;
  version?: string;
}

interface Entity {
  // ... 已有字段
  status?: ObjectStatus;
}

// Attribute、Relation、StateMachine、Rule、EventDefinition、Orchestration 等对象同理
```

导出时：**不校验状态，只保留并标注状态**。如果对象上没有状态字段，默认标注为 `'unknown'`。

### 7.2 导出范围过滤逻辑

| scope 值 | 包含的五大模型 | 是否受 includeSemanticLayer 影响 |
|----------|----------------|----------------------------------|
| all | dataModel + behaviorModel + ruleModel + processModel + eventModel | 是；`includeSemanticLayer=false` 时不包含 `agentSemanticLayer` |
| data | dataModel.entities / attributes / relations | 否 |
| behavior | behaviorModel.stateMachines | 否 |
| rule | ruleModel.rules | 否 |
| process | processModel.orchestrations | 否 |
| event | eventModel.eventDefinitions / subscriptions | 否 |

**补充说明**：
- `organization`（部门/岗位）在 `scope=all` 时始终包含；其他 scope 下不包含
- `agentSemanticLayer` 仅在 `scope=all` 且 `includeSemanticLayer=true` 时包含
- `examples/` 目录仅在 `includeExamples=true` 时包含

---

## 8. 校验规则

### 8.1 导出前置校验
1. 请求体中必须存在 `project` 对象
2. 根据 `scope` 过滤后至少包含一个非空模型
3. **不校验**项目状态，但需在导出产物中标注状态

### 8.2 数据完整性校验
1. 导出的 entities 必须有 name 和 nameEn
2. 导出的 relations 必须引用存在的 entity
3. 状态机的 states 必须包含初始状态和至少一个终止状态
4. 规则必须有 condition 和 message
5. 每个导出的对象必须保留 `status` 字段；缺失时标记为 `unknown`

---

## 9. 实现计划

### Phase 1：后端 API（预计 1-2 轮迭代）
1. 新建 `src/app/api/export/skill/route.ts`
2. 移除状态校验，改为状态标注
3. 实现 scope 过滤逻辑
4. 使用 JSZip 生成 ZIP
5. 写入 skill.json / SKILL.md / README.md / ontology.json / intents.json / examples/ 
6. 单元/接口测试

### Phase 2：UI 集成（预计 1 轮迭代）
1. 在导出功能处新增"Skill 包（ZIP）"选项
2. 新增范围选择弹窗/下拉
3. 调用 POST /api/export/skill 并触发下载
4. 导出前提示当前项目状态，并在产物中标注对象状态

### Phase 3：Agent 导出能力扩展（预计 1 轮迭代）
1. CLI `export` 命令支持 `--format` 参数
2. MCP `export_project` 工具支持 `format` 参数
3. Skill API `export_manifest` 操作支持 `format` 参数
4. 统一 5 种格式响应规范

### Phase 4：文档更新（预计 0.5 轮迭代）
1. 更新 README.md 导出说明
2. 更新 AGENTS.md API 列表和 CLI/MCP 工具定义
3. 补充测试用例文档

---

## 10. 测试策略

### 10.1 单元测试
- 状态校验逻辑
- scope 过滤逻辑
- ZIP 文件生成

### 10.2 接口测试
- `POST /api/export/skill` 正常流程（draft / confirmed 均可）
- 无效 scope 返回 400
- ZIP 内容完整性验证
- 导出产物中包含正确的对象状态标注

### 10.3 UI 测试
- Skill 选项始终可见
- 导出前状态提示正确
- 范围选择正确传递
- 导出产物状态标注正确

---

## 11. 风险与依赖

### 11.1 风险
1. **模型状态字段缺失**：如果当前对象没有 `status` 字段，导出时默认标记为 `unknown`，不影响功能
2. **模型数据量大**：大模型导出 ZIP 可能耗时较长，需要设置合理的超时
3. **Agent 框架标准不统一**：不同 Agent 对 Skill 包格式要求不同，本次采用通用 JSON 结构

### 11.2 依赖
1. ✅ 导出功能当前所在的组件：`src/components/ontology/manifest-export-dialog.tsx`
2. ✅ Agent 导出能力与 UI 导出能力在同一版本交付（A 方案）
3. ✅ 对象状态字段的命名和取值范围已统一

---

## 12. 已确认问题

> 确认时间：2026-07-01

### 12.1 Spec §12 原始问题确认

| # | 问题 | 确认结果 |
|---|------|----------|
| 1 | 导出功能当前位于哪个组件/页面？ | **UI 入口**：`src/components/ontology/manifest-export-dialog.tsx`；**导出逻辑库**：`src/lib/manifest-export.ts` |
| 2 | Skill 包命名规则是否接受 `ontology-model-skill-{projectName}-v{version}.zip`？ | **接受**。示例：`ontology-model-skill-生产管理-v1.0.0.zip` |
| 3 | 是否需要支持导出时自定义 Skill 名称和描述？ | **不需要**。Skill 名称/描述直接取自项目名/项目描述 |
| 4 | examples/ 内容希望自动生成还是使用固定模板？ | **自动生成**。基于模型实体/关系/规则动态生成 query-examples.md 和 reasoning-examples.md |
| 5 | Agent 导出 5 种格式是否和 UI Skill 导出一起实现？还是分阶段？ | **A 方案：一起实现**。UI/CLI/MCP/Skill API 统一支持 5 种格式：`json` / `yaml` / `excel` / `md` / `skill` |
| 6 | 对象状态字段若缺失，默认标记为 `unknown` 是否可接受？ | **可接受**。缺失 `status` 的对象导出时标记为 `unknown` |

### 12.2 Spec Review 关键决策确认

| # | 决策项 | 确认结果 |
|---|--------|----------|
| 7 | `/api/export/skill` 请求体设计 | **传完整 `project` 对象**。因项目数据在浏览器 localStorage，服务端无法通过 projectId 查询 |
| 8 | 是否保留 GET `/api/export/skill` | **删除**。只保留 POST |
| 9 | MCP 导出工具实现方式 | **新建 `packages/ontology-mcp/src/tools/export-tools.ts`**，注册 `ontology_project_export` |
| 10 | Markdown 格式定义 | `md` = 按 scope 过滤后的 `ontology.json` 的人类可读 Markdown 渲染 |
| 11 | 状态字段类型 | `ProjectStatus = 'draft' \| 'review' \| 'confirmed' \| 'archived'`；`ObjectStatus = 'draft' \| 'confirmed' \| 'archived' \| 'unknown'` |
| 12 | 错误响应格式 | `{ success: false, error: code, message: text }`，HTTP 状态码见 §6.4 |
