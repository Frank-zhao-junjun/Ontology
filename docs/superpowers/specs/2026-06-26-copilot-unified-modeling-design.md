# Copilot 统一 AI 建模助手 — 设计规格

**日期**: 2026-06-26  
**状态**: 已审阅通过（含修订）  
**项目**: Ontology 项目1 — 建模工作台  

---

## 1. 背景与目标

### 1.1 背景

当前 AI 建模能力分散在 4 个 API 与多处 UI 入口（「AI 填充草稿」「AI 解析文档」、Legacy `generate-model` 等），用户体验割裂。需求变更为：**页面右侧统一 Copilot 面板**，用户通过对话 + 文件上传驱动建模。

### 1.2 目标

- 建模工作台右侧：**可调整宽度的 Copilot 面板**（CopilotKit）
- 对话 + 上传文件 → AI 语义理解 → 自动写入 **A / B / C / EPC / E1~E8** 的 **draft**
- 用户在左侧沿用现有 **draft → confirmed** 流程确认
- **Copilot 为主**，现有 AI API 作为内部 Tool（不重写 LLM 逻辑）
- **Legacy 建模体系删除**，Copilot 仅服务简化架构

### 1.3 需求决策摘要（8 轮讨论）

| # | 议题 | 决策 |
|---|------|------|
| 1 | 与现有 API | Copilot 为主，旧 API 作 Tool；旧 UI **暂时并存** + tooltip |
| 2 | 建模范围 | 仅 A/B/C/EPC/E1~E8；Legacy 删除 |
| 3 | 写入与确认 | 直写 draft，左侧 confirm；逐轮增量；Markdown 结构化回复 |
| 4 | 面板范围 | 仅建模工作台；无项目不显示 |
| 5 | CopilotKit 深度 | MVP = 轻量 Actions；后续可升 Runtime / Generative UI |
| 6 | 文件与推断 | 整文档智能推断；全格式 + ppt/pptx；持久化 referenceDocuments；extract-entities 合并进 element-draft |
| 7 | 冲突策略 | 模块 A1 自动 fork；文档 B1'；要素 C1'（confirmed skip） |
| 8 | MVP 验收 | 6 条主路径 + 能力边界提示 + **EPC draft 必达** |

---

## 2. 总体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│  modeling-workspace                                                     │
│  ┌──────────┬─────────────────────────────┬──────────────────────────┐  │
│  │ 业务链树  │  详情 / 要素库 / 告警 …      │  CopilotKit Sidebar      │  │
│  │ (左)     │  (中)                        │  (右，固定可见，可拖拽)   │  │
│  └──────────┴─────────────────────────────┴──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
         ▲                              ▲                    │
         │ Zustand subscribe            │                    │
         └──────────────────────────────┴────────────────────┘
                                        │
              Copilot Actions (client-side handlers)
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
        Store CRUD               POST /api/* (LLM)          referenceDocuments
     addValueDomain…          generate-module-draft          upload + persist
     applyAiEpcDraft…         generate-element-draft
     forkModuleToDraft…       analyze-document-model (新增)
```

### 2.1 分层职责

| 层 | 职责 |
|----|------|
| **CopilotKit UI** | 聊天、文件上传、Markdown 渲染、加载态 |
| **CopilotKit Runtime** | LLM 编排，endpoint: `POST /api/copilotkit` |
| **Copilot Actions (client)** | 意图路由、名字匹配、fork 判断、调 API、**直写 Zustand Store**（无序列化） |
| **现有 Next.js API** | LLM 调用与 JSON 解析（`coze-coding-dev-sdk`） |
| **Zustand Store** | 唯一数据源；draft 写入、fork、要素 insert/update |
| **左侧工作台** | 展示 + 用户 confirm + **删除**（Copilot 不参与删除） |

### 2.2 CopilotKit 集成（MVP = 轻量 Actions）

- **Runtime**: `POST /api/copilotkit` — LLM 对话与 tool 选择
- **Actions**: `useCopilotAction` 注册于 client 组件，handler **直接调用** `useOntologyStore.getState()` 方法
- **不采用** server-side Store 序列化往返（除非 Phase 0 spike 证明 client Actions 不可行）

### 2.3 新增依赖

```json
"@copilotkit/react-core"
"@copilotkit/react-ui"
```

---

## 3. UI / 布局

### 3.1 布局

- **固定右栏**：Copilot 在所有工作台 Tab 下长期可见（业务链、要素库、告警等）
- 不与要素库共享 Tab；用户切 Tab 查看 E1~E8，Copilot 不隐藏
- 默认宽度 **360px**，min **280px**，max **50vw**
- 宽度持久化：`localStorage` → `copilot-panel-width`
- 可折叠（小屏默认收起）

### 3.2 结构

```tsx
<main className="flex">
  <section className="flex-1 min-w-0">{/* 现有 Tab + 内容 */}</section>
  <ResizablePanel>
    <CopilotSidebar />
  </ResizablePanel>
</main>
```

### 3.3 旧入口（MVP 并存）

- 「AI 填充草稿」「AI 解析文档」等 **保留**
- Tooltip: **「建议使用右侧 Copilot（新）」**
- Copilot 稳定运行一段时间后统一移除

### 3.4 结构化回复

助手消息使用 Markdown 列表/树形缩进，说明：
- 已创建的 draft 项（含 kind、名称、id）
- fork / skip confirmed 要素的原因
- 下一步建议（左侧确认或继续补充）

Footer 固定提示：**「所有写入均为草稿，请在左侧确认」**

---

## 4. Copilot Actions

### 4.1 只读 Actions（上下文）

| Action | 说明 |
|--------|------|
| `getProjectSummary` | A/B/C/EPC 树 + 各模块 status |
| `getModuleDetail` | kind + id → draft/confirmed 快照 |
| `getElementLibrarySummary` | E1~E8 计数与要素名 |
| `getReferenceDocuments` | 已上传文档列表 |
| `getSelectedNode` | 当前选中业务链节点（辅助，**非**填充范围依据） |

### 4.2 写入 Actions

| Action | Store / API | 场景 |
|--------|-------------|------|
| `createValueDomain` | `addValueDomain` | 新建 A |
| `createCapability` | `addCapability` | 新建 B |
| `createScenario` | `addScenario` | 新建 C |
| `createEpcProcess` | `addEpcProcess` | 新建 EPC 壳 |
| `updateModuleDraft` | fork + `update*` / `applyAiModuleDraft` | 修改 A/B/C |
| `generateEpcStepsFromText` | `generate-module-draft` (EPC) → `applyAiEpcDraft` | **MVP 必达** |
| `generateElementsFromText` | `generate-element-draft` → `applyAiElementDrafts` | E1~E8 |
| `analyzeDocumentAndModel` | upload + `analyze-document-model` → 批量 Store | 整文档推断 |
| `uploadReferenceDocument` | upload route → `addReferenceDocument` | 持久化 |

### 4.3 明确禁止的 Actions

**Copilot 不包含任何 `delete*` Action。** 模块/要素的删除由用户在左侧工作台完成。

### 4.4 模块冲突解析（A1 / B1'）

```
resolveModuleTarget(name, kind, userVerbs):
  match = fuzzyMatchExisting(name, kind)
  if match.confirmed && isModifyIntent(verbs):  // 改/完善/更新/指名
    forkModuleToDraft → update draft
    reply: "已创建草稿版本，原已确认版本保持不变"
  if match.confirmed && isNewIntent:            // 加一个/新建
    create new draft
  if documentInfer && highConfidenceMatch:
    fork → merge (B1')
  if documentInfer && lowConfidence:
    create new
  if mediumConfidence:
    merge + Markdown 告知歧义
```

### 4.5 要素冲突（C1'）

| 已有状态 | 行为 |
|----------|------|
| 无 / 仅 draft | insert；同 key draft → **更新** |
| 仅 confirmed | **skip + 告知**（MVP 无 per-element fork） |

---

## 5. API 变更

### 5.1 保留（Tool 底层）

| API | 说明 |
|-----|------|
| `POST /api/generate-module-draft` | A/B/C/EPC draft；EPC 步骤生成 |
| `POST /api/generate-element-draft` | E1~E8；合并原 extract-entities 能力 |
| `POST /api/reference-documents/upload` | 上传 + 解析；**内部** ppt/pptx → MarkItDown |

### 5.2 新增

| API | 说明 |
|-----|------|
| `POST /api/copilotkit` | CopilotKit runtime |
| `POST /api/analyze-document-model` | **MVP 必建** — 一次 LLM 输出 `{ valueDomains, capabilities, scenarios, epcProcesses, elements }`；内部复用现有 prompt 构建器 |

### 5.3 不单独新增

- ~~`POST /api/parse-pptx`~~ — ppt/pptx 在 **upload route 内**按文件类型分支，与 docx/pdf 平级

### 5.4 删除（Phase 4 Legacy 清理）

| 删除项 |
|--------|
| `POST /api/generate-model` |
| `POST /api/reference-documents/extract-entities` |
| Legacy 编辑器与 manual-generator AI 部分 |
| 旧 AI 按钮（Copilot 稳定后） |

### 5.5 文件格式

docx, pdf, xlsx, txt, md, csv, json, **ppt, pptx**（MarkItDown → markdown → extractedText）

---

## 6. System Prompt 原则（§6.1）

1. 只操作 **A/B/C/EPC/E1~E8**；Legacy 不在范围
2. **所有写入均为 draft**；不在 Copilot 内 confirm
3. **逐轮增量**；不擅自批量删改
4. **Copilot 不 delete** — 删除由用户在左侧工作台完成；Actions 无 delete*
5. 修改 **confirmed** 模块 → 自动 fork + 回复说明
6. 文档上传 → 优先 `analyzeDocumentAndModel`（整文档智能推断）
7. **无法处理** → 说明能力边界 + 建议操作；不空白、不死循环（最多重试 1 次）
8. 回复必须以 Action 返回为准，不得编造已写入内容

---

## 7. 现有缺口修复（实施前）

| 缺口 | 修复 |
|------|------|
| `business-chain-detail` 未传 `onApplyEpcDraft` | 接 `applyAiEpcDraft` |
| `extract-entities` 独立 API | 合并后删除 |
| CopilotKit × React 19 兼容性未知 | **Phase 0 spike 必做**，不通过则不进入 Phase 1 |

---

## 8. 分期实施

| Phase | 内容 | 工期 |
|-------|------|------|
| **0** | CopilotKit 安装、`/api/copilotkit`、右栏布局、**React 19 兼容 spike**、只读 Actions | 2–3d |
| **1** | 对话增量建模（create/update + fork）、Markdown 回复、旧按钮 tooltip | 3–4d |
| **2** | EPC 步骤生成（`generateEpcStepsFromText` + `applyAiEpcDraft` 接线）— **MVP 必达** | 2–3d |
| **3** | upload 持久化、ppt/pptx、`analyze-document-model`、B1'/C1'、多格式测试与 prompt 调优 | **5–7d** |
| **4** | Legacy 删除、旧 AI 按钮移除（可与 Phase 3 并行） | 3–5d |

**MVP 交付范围**: Phase 0 + 1 + 2 + 3  
**总 MVP 工期**: **12–17 天**

---

## 9. MVP 验收清单

- [ ] 进入项目 → 右侧 Copilot，宽度可拖
- [ ] 对话创建 A/B/C → 左侧树 📝 实时出现
- [ ] 口述 / 文档 → **EPC 步骤 draft**（顺序 + 要素引用，可编辑）
- [ ] 上传全格式（含 ppt/pptx）→ 持久化 referenceDocuments + 全结构推断
- [ ] 修改 confirmed 模块 → 自动 fork + 回复说明
- [ ] 要素：新建 / 更新 draft / skip confirmed + 告知
- [ ] 左侧 draft → confirmed 正常
- [ ] 无法处理 → 能力边界，无空白/死循环
- [ ] 旧 AI 按钮保留 + tooltip
- [ ] Copilot **无 delete** Action；删除仅在工作台

---

## 10. 风险

| 风险 | 缓解 |
|------|------|
| CopilotKit × React 19 不兼容 | Phase 0 spike；评估升级/降级/pin 版本后再投入 |
| 文档推断质量不稳定 | MVP 允许分轮补全；回复列出「待补充」；Phase 3 预留 prompt 调优时间 |
| MarkItDown 部署/失败 | upload route 内封装；失败时 Copilot 明确报错 |
| client-side Actions 限制 | Phase 0 验证；fallback 才考虑 server snapshot |

---

## 11. 后续升级（非 MVP）

- CopilotKit Runtime Agent 多步编排（A → B）
- Generative UI 交互卡片（仅展示可先部分采用）
- 要素级 per-element fork
- 移除旧 AI 入口

---

## 审阅记录

| 节 | 结论 |
|----|------|
| §2 架构 | ✅ client-side Actions 直写 Store |
| §3 布局 | ✅ 固定右栏 |
| §4.3 analyze-document-model | ✅ MVP 就建 |
| §8 分期 | ✅ Phase 3 调整为 5–7d |
| §5.2 pptx | ✅ 仅 upload route 内分支，无独立 API |
| §6 补充 | ✅ Copilot 不 delete |
| §10 | ✅ Phase 0 React 19 spike 必做 |
