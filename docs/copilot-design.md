# 项目1 Copilot 集成设计（MVP）

> 决策日期：2026-06-26
> 基于：CopilotKit (35K ⭐ · MIT · React/TypeScript)

---

## 一、集成方式

| 维度 | 决策 |
|------|------|
| 框架 | CopilotKit（`react-core` + `react-ui`） |
| 层级 | 轻量 Actions（方案 A） |
| UI | 右侧可拖拽面板，替换/共存于要素库栏 |
| 挂载范围 | 仅建模工作台（modeling-workspace），无项目时不显示 |

## 二、覆盖范围

| 范围 | 状态 |
|------|:----:|
| A/B/C/EPC | ✅ Tool → Store action → draft |
| E1~E8 要素库 | ✅ Tool → Store action → draft |
| 文档上传解析 | ✅ extract-entities 改造为"从文档生成 E1~E8" |
| **Legacy**（实体/行为/规则/事件模型、generate-model API、五模型编辑器） | 🗑️ **删除** |

## 三、底层 API

现有 4 个 API 包装为 CopilotKit Tool（方案 B）：

| 现有 API | 在 Copilot 中的角色 |
|----------|-------------------|
| `POST /api/generate-module-draft` | A/B/C/EPC 生成 |
| `POST /api/generate-element-draft` | E1~E8 要素生成（含文件解析后推断） |
| `POST /api/generate-model` | 🗑️ 删除（Legacy） |
| `POST /api/reference-documents/upload` | 文件上传解析 |
| `POST /api/reference-documents/extract-entities` | 🗑️ 删除，能力合并进 generate-element-draft |

## 四、写入与确认

```
用户: "帮我建一个生产制造价值域"
  │
  ▼
CopilotKit Sidebar → Action(createValueDomain)
  │
  ▼
POST /api/generate-module-draft → draft 写入
  │
  ▼
Zustand set() → React 自动 re-render → 左侧树实时刷新
  │
  ▼
Copilot 回复: Markdown 列表"已创建 X（草稿），请到左侧确认"
```

- **写入**：Tool → Store action → 直接落 draft
- **修改已有模块**：自动 forkModuleToDraft，confirmed 不动。Copilot 回复说明「已创建草稿版本」
- **确认**：用户到左侧工作台走现有 `draft → confirmed` 流程
- **节奏**：逐轮增量，每轮只改当前意图相关内容
- **刷新**：Zustand 自动订阅，无需额外同步
- **模块冲突（A/B/C/EPC）**：高置信匹配 confirmed → 自动 forkModuleToDraft 合并；低置信/无匹配 → 新建；中等歧义 → 合并 + Markdown 告知
- **要素冲突（E1~E8）**：无或仅有 draft → insert/更新 draft；confirmed 同名 → skip + 告知（MVP 不做要素级 fork）

## 五、UI

- 右侧 Copilot 面板，宽度可拖拽调整
- 与要素库可切换 / 分 tab（设计阶段定）
- Copilot 回复用 Markdown 结构化展示

## 六、升级路线

```
MVP（现在） → 轻量 Actions（A）
     ↓ 需要多步推理时
Runtime（可选） → CopilotKit Runtime 编排（B）
     ↓ 需要交互卡片时
Generative UI（可选） → 聊天内可交互组件（C）
```

## 七、实施步骤

1. `npm install @copilotkit/react-core @copilotkit/react-ui`
2. 在 `layout.tsx` 中加 `<CopilotKit>` Provider
3. 在 `modeling-workspace.tsx` 中加 `<CopilotSidebar>`
4. 定义 Actions（包装现有 4 个 API + Store operations）
5. 改造 `extract-entities` 为 E1~E8 要素提取
6. 删除 Legacy 代码

## 八、文件上传

| 子项 | 决策 |
|------|------|
| 格式 | docx/pdf/xlsx/txt/md/csv/json/ppt/pptx（PPT 经 MarkItDown 转 Markdown） |
| 持久化 | 写入项目 referenceDocuments，localStorage，对话刷新不丢 |
| 填充范围 | B — 智能推断整份文档，自动识别 A/B/C/EPC/E1~E8 |
| extract-entities | 🗑️ 删除，能力合并进 generate-element-draft |

上传后主流程：

```
上传文件 → 解析文本 → LLM 推断结构
        → 逐条写 draft（A/B/C/EPC/E1~E8）
        → Markdown 结构化回复「已创建以下内容」
```

## 九、MVP 验收标准

### 必须走通的主路径

| # | 场景 | 验收条件 |
|:-:|------|---------|
| 1 | 面板展示 | 进入项目 → 建模工作台右侧出现可拖拽 Copilot 面板 |
| 2 | 对话增量建模 | "建价值域生产制造 + 计划管理能力" → 自动创建 A/B/C draft → 左侧树实时更新 → Markdown 列出已创建项 |
| 3 | 上传文档 | 全格式（含 ppt/pptx）→ 持久化到 referenceDocuments → 推断 A/B/C/EPC/E1~E8 → 逐条写 draft → 结构化回复 |
| 4 | 修改 confirmed 模块 | "把计划管理改成供应链计划" → 自动 fork → draft 修改 → 回复说明 confirmed 未动 |
| 5 | 用户确认 | 左侧对模块执行 draft → confirmed（沿用现有流程） |
| 6 | Legacy 退出 | 旧 AI 按钮保留 + tooltip「建议使用右侧 Copilot」；generate-model 等不参与主路径 |
| **7** | **EPC 生成** | **SOP 文档或口述流程 → 生成 EPC 步骤 draft（顺序 + 要素引用，可编辑）** |
| 8 | 能力边界 | 无法处理时说明边界，不空白/不死循环 |

### 明确不做（MVP 外）

- Copilot 内 confirm / 模块级预览 diff UI
- CopilotKit Runtime（Agent 编排）
- Generative UI 交互卡片
- 要素 confirmed 的 automatic fork
- Legacy generate-model 与实体编辑器
