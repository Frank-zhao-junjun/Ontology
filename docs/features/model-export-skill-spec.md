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
├── ontology.json           # 完整或部分本体模型数据
├── intents.json            # 自然语言意图映射
├── README.md               # 使用说明
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

### 4.4 README.md

包含：
- Skill 简介
- 适用场景
- 快速开始（如何加载到常见 Agent 框架）
- 文件说明
- 示例查询
- 限制与免责声明

### 4.5 examples/

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
5. 写入 skill.json / ontology.json / intents.json / README.md / examples/
6. 单元/接口测试

### Phase 2：UI 集成（预计 1 轮迭代）
1. 在导出功能处新增"Skill 包（ZIP）"选项
2. 新增范围选择弹窗/下拉
3. 调用 POST /api/export/skill 并触发下载
4. 未确认状态置灰并提示

### Phase 3：文档更新（预计 0.5 轮迭代）
1. 更新 README.md 导出说明
2. 更新 AGENTS.md API 列表
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

---

## 12. 待确认问题

1. 项目当前是否有 `confirmed` 状态字段？如果有，字段名是什么？
2. 导出功能当前位于哪个组件/页面？
3. Skill 包命名规则是否接受 `ontology-model-skill-{projectName}-v{version}.zip`？
4. 是否需要支持导出时自定义 Skill 名称和描述？
5. examples/ 内容希望自动生成还是使用固定模板？
