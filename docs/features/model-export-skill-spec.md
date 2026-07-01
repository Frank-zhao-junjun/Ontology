# 模型导出为 Skill 包 — 功能规格说明书

> 状态：待确认  
> 相关概念：第二个 Skill（已建好的本体模型作为 Agent 可消费的产物）

---

## 1. 背景与目标

### 1.1 背景
当前建模工具在模型确认后支持 4 种导出格式：JSON / YAML / Excel / Markdown。这些格式主要用于人工阅读、备份、协作或二次开发，但**无法被 Agent 直接理解和消费**。

### 1.2 目标
新增第 5 种导出格式 **Skill 包（ZIP）**，将已确认的本体模型封装为 Agent 可直接加载的领域知识技能。用户导出后，可导入到任意支持 Skill 的 Agent 框架，使 Agent 具备对该领域模型的理解、查询和推理能力。

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
> 作为业务分析师，我在 UI 中完成了「离散制造」领域的本体建模并确认，希望导出为 Skill 包，交给 Agent 使用，让它能回答关于该领域模型的问题。

**验收标准**：
- 确认状态的模型才显示"导出为 Skill"选项
- 导出过程在 3 秒内完成
- 下载的 ZIP 可被常见解压工具打开

### US-2 Agent 消费导出的 Skill
> 作为 Agent 开发者，我拿到了用户导出的 Skill ZIP，希望直接加载到 Agent 框架中，无需手动解析原始 JSON。

**验收标准**：
- ZIP 内含 `skill.json` 清单文件
- 内含结构化的 `ontology.json` 模型数据
- 内含 `intents.json` 自然语言意图映射
- 内含 `README.md` 使用说明

### US-3 选择导出范围
> 作为建模人员，我希望只导出部分已确认的模块（如只导出数据模型 + 规则模型），而不是整个项目。

**验收标准**：
- 导出界面提供范围选择：全部 / 仅数据模型 / 仅行为模型 / 仅规则模型 / 仅流程模型 / 仅事件模型
- 未选择的部分不包含在 Skill 包中

---

## 3. 功能范围

### 3.1 In Scope
- UI 导出功能新增"Skill 包（ZIP）"选项
- 仅允许状态为 `confirmed` 的模型导出
- 导出范围选择（全部/部分模型）
- 后端生成 ZIP（skill.json + ontology.json + intents.json + README.md + examples/）
- 下载接口：`POST /api/export/skill` 或 `GET /api/export/skill?projectId=xxx&scope=all`

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

直接复用项目数据结构，但根据导出范围过滤。保留核心模型字段：

```json
{
  "metadata": {
    "projectId": "proj-xxx",
    "projectName": "生产管理",
    "domain": "离散制造",
    "description": "...",
    "exportedAt": "...",
    "scope": ["data", "behavior", "rule", "process", "event"]
  },
  "dataModel": {
    "entities": [...],
    "attributes": [...],
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

## 示例查询
见 examples/query-examples.md
```

### 4.5 README.md

面向最终用户的说明文件，包含：
- Skill 简介
- 适用场景
- 快速开始（如何加载到常见 Agent 框架）
- 文件说明
- 示例查询
- 限制与免责声明

### 4.6 examples/

- `query-examples.md`：10-20 个查询类示例
- `reasoning-examples.md`：5-10 个推理类示例

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

### 5.3 状态限制
- 只有状态为 `confirmed` 的模型才能导出为 Skill
- 未确认时，Skill 选项置灰，Tooltip 提示："请将模型确认后再导出为 Skill"

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
  "projectId": "proj-xxx",
  "scope": "all",
  "includeExamples": true,
  "includeSemanticLayer": true
}
```

### 6.3 参数说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 是 | 项目 ID |
| scope | string | 否 | 导出范围：`all` / `data` / `behavior` / `rule` / `process` / `event`，默认 `all` |
| includeExamples | boolean | 否 | 是否包含 examples/，默认 `true` |
| includeSemanticLayer | boolean | 否 | 是否包含 Agent Semantic Layer，默认 `true` |

### 6.4 响应

成功：返回 `application/zip` 二进制流，Content-Disposition: attachment; filename="ontology-model-skill-{projectName}-{version}.zip"

失败：
```json
{ "success": false, "error": "模型未确认，无法导出为 Skill" }
```

---

## 6.5 Agent 通过 MCP / CLI / Skill API 导出模型

除了 UI 导出，Agent 通过 MCP、CLI、Skill API 接入建模能力后，也应能产出 5 种格式之一的本体模型制品。5 种格式统一为：`json` | `yaml` | `excel` | `md` | `skill`。

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
- `json` / `yaml` / `md`：调用现有导出逻辑，写入文本文件
- `excel`：调用 `/api/export/xlsx-from-manifest`，写入 `.xlsx`
- `skill`：调用 `/api/export/skill`，写入 ZIP
- 未指定 `--format` 时默认 `json`，保持向后兼容
- 导出 `skill` 时项目状态必须为 `confirmed`

### 6.5.2 MCP Server

扩展 `export_project` 工具：

```json
{
  "name": "export_project",
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

**返回示例（skill 格式）**：

```json
{
  "success": true,
  "format": "skill",
  "downloadUrl": "https://Ontology1.coze.site/api/export/skill?projectId=proj-xxx&scope=all&token=xxx",
  "filename": "ontology-model-skill-生产管理-v1.0.0.zip",
  "sizeBytes": 15360
}
```

**返回示例（json/yaml/md 格式）**：

```json
{
  "success": true,
  "format": "json",
  "content": "{...}",
  "filename": "ontology-proj-xxx.json"
}
```

**设计原则**：
- 大文件（excel/skill）返回下载 URL，避免塞爆 MCP 消息体
- 小文件（json/yaml/md）直接返回内容，便于 Agent 立即使用
- 项目状态不是 `confirmed` 时返回错误，明确提示 Agent 先确认模型

### 6.5.3 Skill API

扩展 `export_manifest` 操作：

```json
{
  "operation": "export_manifest",
  "params": {
    "projectId": "proj-xxx",
    "format": "skill",
    "scope": "all"
  }
}
```

**行为说明**：
- 与 MCP `export_project` 工具对齐
- `json`/`yaml`/`md`：返回 `content` 字段
- `excel`/`skill`：返回 `downloadUrl` 字段
- 错误码统一：未确认返回 `MODEL_NOT_CONFIRMED`

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
项目对象中需要新增或复用状态字段：

```typescript
interface OntologyProject {
  // ... 已有字段
  status?: 'draft' | 'review' | 'confirmed' | 'archived';
  confirmedAt?: string;
  version?: string;
}
```

如果当前已存在"确认/归档"相关功能（AGENTS.md 中提到 Phase 1.5 S14 模块确认/归档 UI），则直接复用该状态字段。

### 7.2 导出范围过滤逻辑

| scope 值 | 包含内容 |
|----------|----------|
| all | 全部模型 + 组织 + 语义层 |
| data | dataModel.entities / attributes / relations |
| behavior | behaviorModel.stateMachines |
| rule | ruleModel.rules |
| process | processModel.orchestrations |
| event | eventModel.eventDefinitions / subscriptions |

---

## 8. 校验规则

### 8.1 导出前置校验
1. projectId 必须存在
2. 项目必须存在
3. 项目状态必须为 `confirmed`
4. 根据 scope 至少包含一个非空模型

### 8.2 数据完整性校验
1. 导出的 entities 必须有 name 和 nameEn
2. 导出的 relations 必须引用存在的 entity
3. 状态机的 states 必须包含初始状态和至少一个终止状态
4. 规则必须有 condition 和 message

---

## 9. 实现计划

### Phase 1：后端 API（预计 1-2 轮迭代）
1. 新建 `src/app/api/export/skill/route.ts`
2. 实现项目状态校验
3. 实现 scope 过滤逻辑
4. 使用 JSZip 生成 ZIP
5. 写入 skill.json / SKILL.md / README.md / ontology.json / intents.json / examples/ 
6. 单元/接口测试

### Phase 2：UI 集成（预计 1 轮迭代）
1. 在导出功能处新增"Skill 包（ZIP）"选项
2. 新增范围选择弹窗/下拉
3. 调用 POST /api/export/skill 并触发下载
4. 未确认状态置灰并提示

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
- `POST /api/export/skill` 正常流程
- 未确认项目返回 400
- 无效 scope 返回 400
- ZIP 内容完整性验证

### 10.3 UI 测试
- Skill 选项可见性
- 未确认状态禁用
- 范围选择正确传递

---

## 11. 风险与依赖

### 11.1 风险
1. **模型状态字段缺失**：如果当前项目没有 `confirmed` 状态字段，需要先补充
2. **模型数据量大**：大模型导出 ZIP 可能耗时较长，需要设置合理的超时
3. **Agent 框架标准不统一**：不同 Agent 对 Skill 包格式要求不同，本次采用通用 JSON 结构

### 11.2 依赖
1. 需要确认 UI 中"确认"状态的具体实现位置
2. 需要确认导出功能当前所在的组件
3. 需要确认 Agent 导出能力是否和 UI 导出能力在同一版本交付

---

## 12. 待确认问题

1. 项目当前是否有 `confirmed` 状态字段？如果有，字段名是什么？
2. 导出功能当前位于哪个组件/页面？
3. Skill 包命名规则是否接受 `ontology-model-skill-{projectName}-v{version}.zip`？
4. 是否需要支持导出时自定义 Skill 名称和描述？
5. examples/ 内容希望自动生成还是使用固定模板？
6. Agent 导出 5 种格式是否和 UI Skill 导出一起实现？还是分阶段？
