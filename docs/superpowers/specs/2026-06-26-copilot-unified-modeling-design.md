# Copilot 统一 AI 建模助手 — 设计稿（MVP）

> 版本：v1.1
> 日期：2026-06-26
> 基于：前 8 轮需求讨论
> 实施计划：[`docs/superpowers/plans/2026-06-26-copilot-unified-modeling.md`](../plans/2026-06-26-copilot-unified-modeling.md)

---

## 1. 目标与边界

### 1.1 目标

在**建模工作台**右侧提供**可调整宽度的 Copilot 面板**，用户通过**对话 + 文件上传**驱动 AI 建模，自动写入 A / B / C / EPC / E1~E8 的 **draft**，用户在左侧沿用现有 `draft → confirmed` 流程确认。

### 1.2 MVP 内

| 能力 | 说明 |
|------|------|
| CopilotKit Sidebar | 轻量 Actions（非 Agent 多步编排）；聊天仍走 `/api/copilotkit` Runtime endpoint |
| 逐轮增量建模 | 一轮一意图，直写 Store |
| 文档智能推断 | 整份文档 → 推断 A/B/C/EPC/E1~E8 |
| 模块 fork | confirmed 模块修改 → 自动 forkModuleToDraft |
| EPC 步骤生成 | 文档/口述 → EPC 步骤 draft（**必达**） |
| Markdown 结构化回复 | 说明做了什么、skipped、能力边界 |
| 旧入口并存 | tooltip「建议使用右侧 Copilot（新）」 |

### 1.3 MVP 外

| 能力 | 说明 |
|------|------|
| Copilot 内 confirm / diff 预览 UI | MVP 不做 |
| CopilotKit Runtime / Generative UI 卡片 | 后续升级路径 |
| 要素 confirmed 的 automatic fork | 当前要素库无 per-element fork 机制 |
| Legacy 实体建模 | generate-model 及对应 UI，**Phase 3 删除**（Copilot 稳定后，非 MVP 阻塞） |
| EPC 校验、覆盖率、图模型 | 高级能力，MVP 不覆盖 |

---

## 2. 总体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  modeling-workspace                                                         │
│  ┌──────────┬──────────────────────────────┬──────────────────────────────┐│
│  │ 业务链树  │ 详情 / 要素库 / 告警 …       │ CopilotKit Sidebar           ││
│  │ (左)     │ (中)                         │ (右，可拖拽宽度)              ││
│  └──────────┴──────────────────────────────┴──────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
         ▲                              ▲                     │
         │ Zustand subscribe            │                     │
         └──────────────────────────────┴─────────────────────┘
                                        │
                    Copilot Actions (client-side handlers)
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
        Store CRUD               POST /api/* (LLM)          referenceDocuments
     addValueDomain…          generate-module-draft          upload + persist
     applyAiEpcDraft…         generate-element-draft
     forkModuleToDraft…       analyze-document-model (new)
```

### 2.1 分层职责

| 层 | 职责 |
|----|------|
| CopilotKit UI | 聊天、文件上传、Markdown 渲染、加载态 |
| Copilot Actions | 意图路由、名字匹配、fork 判断、调 API、调 Store、组装回复 |
| 现有 Next.js API | LLM 调用与 JSON 解析（复用 coze-coding-dev-sdk） |
| Zustand Store | 唯一数据源；draft 写入、fork、要素 insert/update |
| 左侧工作台 | 展示 + 用户 confirm（不变） |

### 2.2 CopilotKit 集成方式

```tsx
// 概念结构 — MVP = A 档（轻量 Actions）
<CopilotKit runtimeUrl="/api/copilotkit">
  <CopilotSidebar defaultOpen width={360} resizable>
    <ModelingCopilotActions projectId={...} />
  </CopilotSidebar>
  {/* 现有 main 三栏 */}
</CopilotKit>
```

- `useCopilotAction` 在前端注册 Actions
- LLM 编排走 CopilotKit 默认 `/api/copilotkit` route
- Actions 内调现有 API（LLM 部分）+ 直写 Store（Zustand，client-side）
- 优先 client-side Store 直写，减少序列化开销

### 2.3 新增依赖

```
"@copilotkit/react-core"
"@copilotkit/react-ui"
// 版本 pin 到与 Next.js 16 / React 19 兼容的最新 stable
```

新增 route：`src/app/api/copilotkit/route.ts`（CopilotKit 标准 endpoint）。

---

## 3. UI / 布局设计

### 3.1 布局改造

```tsx
<main className="flex">
  <section className="flex-1 min-w-0">
    {/* 现有 Tab + 内容 */}
  </section>
  <ResizablePanel>
    <CopilotSidebar />
  </ResizablePanel>
</main>
```

| 属性 | 值 |
|------|-----|
| 默认宽度 | 360px |
| 最小宽度 | 280px |
| 最大宽度 | 50vw |
| 宽度持久化 | `localStorage key: copilot-panel-width` |
| 可折叠 | 保留展开/收起按钮（小屏默认收起） |

### 3.2 与现有 Tab 的关系

- Copilot **始终可见**（在业务链、要素库、告警等 Tab 下均存在）
- 不替换要素库 Tab；用户可在 Copilot 建模后切 Tab 查看 E1~E8
- 旧按钮保留 + tooltip，不抢 Copilot 视觉主位

### 3.3 Copilot 面板内容

| 区域 | 内容 |
|------|------|
| Header | 「建模 Copilot」+ 当前项目名 + 折叠按钮 |
| Chat | 消息流；助手消息支持 Markdown（列表、树形缩进） |
| Input | 文本 + 附件上传（与 referenceDocuments 共用解析管道） |
| Footer hint | 「所有写入均为草稿，请在左侧确认」 |

### 3.4 结构化回复模板

```
已创建以下内容（均为草稿）：

**价值域**
- A · 生产制造 `id: vd-xxx`

**能力**
- B · 计划管理（隶属于 A-生产制造）

**EPC 流程**
- EPC · 订单处理（7 步，隶属于 C-MTS排产）
  1. 接收订单 → 引用 E1-Order
  2. 审核 …

**要素**
- 新建 3 条 · 更新 draft 1 条 · 跳过 confirmed 1 条

> 模块「计划管理」已有 confirmed 版本，已 fork 到 draft，原 confirmed 未改动。

请到左侧工作台确认，或继续补充细节。
```

---

## 4. Copilot Actions 清单

### 4.1 上下文 Actions（只读，供 LLM 感知）

| Action | 说明 |
|--------|------|
| `getProjectSummary` | 返回 A/B/C/EPC 树摘要 + 各模块 status |
| `getModuleDetail` | 按 kind+id 返回 draft/confirmed 快照 |
| `getElementLibrarySummary` | E1~E8 计数、最近要素名 |
| `getReferenceDocuments` | 已上传文档列表 + 摘要 |
| `getSelectedNode` | 当前 selectedBusinessChainNode |

### 4.2 写入 Actions（调 Store ± API）

| Action | Store / API | 场景 |
|--------|-------------|------|
| `createValueDomain` | `addValueDomain` | 新建 A |
| `createCapability` | `addCapability(parentAId, …)` | 新建 B |
| `createScenario` | `addScenario(parentBId, …)` | 新建 C |
| `createEpcProcess` | `addEpcProcess(parentCId, …)` | 新建空 EPC 壳 |
| `updateModuleDraft` | fork 判断 + update* / applyAiModuleDraft | 修改 A/B/C 语义描述 |
| `generateEpcStepsFromText` | POST generate-module-draft (EPC) → applyAiEpcDraft | **8c 必达** |
| `generateElementsFromText` | POST generate-element-draft → applyAiElementDrafts | E1~E8 |
| `analyzeDocumentAndModel` | 编排：upload → 多 API → 批量 Store | **整文档推断** |
| `uploadReferenceDocument` | POST reference-documents/upload → addReferenceDocument | 持久化 |

### 4.3 内部编排：analyzeDocumentAndModel

文档上传后的主编排 Action，由系统 prompt 强制走此路径：

```
1. uploadReferenceDocument(file) → extractedText 持久化
2. POST /api/analyze-document-model（编排层，非「大而全」单次 LLM）
   ├─ 子 prompt A：业务链结构（A/B/C 骨架）     ─┐
   ├─ 子 prompt B：EPC 步骤序列                   ├─ 并行或串行 2–3 路
   └─ 子 prompt C：E1~E8 要素                    ─┘
   → 外层 API 聚合各子结果，分别 parse；某路失败可单独重试，不拖垮全局
3. applyAiElementDrafts (C1' 规则)
4. applyAiEpcDraft (EPC 步骤)
5. 批量 Store 写入（A/B/C/EPC draft）
6. 汇总 Markdown 回复
```

**设计约束（避免踩坑）**：

- **不对 LLM 输出施加「大一统 JSON schema」**（一次输出 A/B/C/EPC/E1~E8 全结构，任一字段格式错误即整段重试）
- 外层 `analyze-document-model` **只做编排与聚合**，内部 2–3 个子 prompt 各自小 schema、各自 parse
- 子 prompt 复用现有 `buildEpcDocPrompt`、`buildElementDocPrompt` 等

### 4.4 Fork / 冲突（Action 内统一实现）

```
resolveModuleTarget(name, kind, userVerbs):
  match = fuzzyMatchExisting(name, kind)
  if match.status === 'confirmed' && isModifyIntent(userVerbs):
    forkModuleToDraft(kind, match.id, snapshot)
    return { mode: 'fork', moduleId: match.id }
  if match.status === 'confirmed' && isNewIntent:
    return { mode: 'create' }
  if match.status === 'draft':
    return { mode: 'update', moduleId: match.id }
  return { mode: 'create' }
```

要素侧 C1' 在 `applyAiElementDrafts` 内实现（已有 US-S19 基础，扩展 draft 更新分支）。

---

## 5. API 变更计划

### 5.1 保留并作为 Tool 底层

| API | 变更 |
|-----|------|
| `POST /api/generate-module-draft` | 保留；EPC 分支确保 Copilot 可达；补 onApplyEpcDraft 接线 |
| `POST /api/generate-element-draft` | 保留；合并原 extract-entities 能力 |
| `POST /api/reference-documents/upload` | 保留；扩展 ppt/pptx 解析（MarkItDown 内联分支） |

### 5.2 新增（MVP）

| API | 用途 |
|-----|------|
| `POST /api/copilotkit` | CopilotKit runtime endpoint |
| `POST /api/analyze-document-model` | 编排层：内部 2–3 个子 prompt（业务链 / EPC / 要素），聚合后返回 |

### 5.3 删除（Phase 3 执行，非 MVP 阻塞）

| 删除项 | 说明 |
|--------|------|
| `POST /api/generate-model` | Legacy 实体 AI |
| `POST /api/reference-documents/extract-entities` | 合并进 element-draft |
| `manual-generator.tsx` AI 部分 | 随 Legacy 删除 |
| Legacy 编辑器 Tab / 组件 | data-model-editor 等（按 test:phase4 legacy audit 清单） |

### 5.4 ppt/pptx 解析

```
upload(pptx) →  server: markitdown 转 md → extractedText 存入 ReferenceDocument
             → 后续与普通 md 相同管道
```

不单独新增 `/api/parse-pptx`，在 upload route 内检测文件类型后走 MarkItDown 分支。

---

## 6. 对话与意图路由

### 6.1 System Prompt 要点

```
- 你是 Ontology 建模 Copilot，只操作 A/B/C/EPC/E1~E8
- 所有写入均为 draft，不要提示用户「已确认」
- 逐轮增量：每轮只处理当前意图，不擅自批量删改
- 修改 confirmed 模块：必须 fork，并在回复中说明
- Copilot 不执行任何删除操作（delete*），删除由用户在左侧完成
- 无法处理时：说明能力边界 + 建议用户怎么做（验收第 8 条）
- 文档上传：优先调用 analyzeDocumentAndModel
```

### 6.2 意图 → Action 映射

| 用户输入 | 路由 |
|----------|------|
| "建价值域生产制造 + 计划管理" | `createValueDomain` → `createCapability` |
| "把计划管理改成供应链计划" | `updateModuleDraft`（fork） |
| "订单流程：接收→审核→排产→下发" | `generateEpcStepsFromText` |
| 上传 SOP.docx | `analyzeDocumentAndModel` |
| "帮我导出 Manifest" | 拒绝，告知去顶部导出菜单 |
| "删除这个模块" | 拒绝，告知去左侧工作台操作 |

### 6.3 死循环防护

- Action 失败最多重试 1 次
- 连续 2 轮无法映射到 Action → 固定话术：能力边界 + 可选操作列表
- LLM 不得编造已写入；必须以 Action 返回结果为准生成回复

---

## 7. 需修复的现有缺口（实施前必做）

| 缺口 | 影响 | 修复 |
|------|------|------|
| `business-chain-detail` 未传 onApplyEpcDraft | EPC AI 步骤写不进 Store | 接 `applyAiEpcDraft` |
| ReferenceDocPanel 未挂载 | 文档能力分散 | Copilot 统一 upload，面板可废弃或仅作只读列表 |
| extract-entities 独立存在 | 与 6d 决策冲突 | 合并后删 route |
| Legacy 与简化架构并存 | 用户困惑 | 分阶段删除，Copilot 不暴露 Legacy Tools |

---

## 8. 分期实施计划

### 8.1 Phase 0：先 spike 再 commit（Day 1 上午）

CopilotKit × React 19 是**最大风险**。Phase 0 **第一天上午**（约半天）必须先验证，通过后再投入后续工作：

```bash
pnpm add @copilotkit/react-core @copilotkit/react-ui
```

最小验证：

```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  <CopilotSidebar>hello</CopilotSidebar>
</CopilotKit>
```

验收：**能渲染、能聊天**。不行则立即评估降级 React / 换集成方式 / pin 版本，**不等到 Phase 0 末尾才发现**。

Phase 0 剩余：右栏布局、`/api/copilotkit`、只读 Actions、可拖拽宽度。

| Phase | 内容 | 工期 |
|:-----:|------|:----:|
| **0** | **Day 1 上午 spike** + CopilotKit 安装、/api/copilotkit、右栏 + 可拖拽、只读 Actions | 2–3d |
| **1** | **对话增量建模 + EPC 必达（合并）**：create*/update* + fork、`generateEpcStepsFromText`、`applyAiEpcDraft` 接线、Markdown 回复、旧按钮 tooltip、口述 EPC E2E | **4–5d** |
| **2** | 文档智能推断：upload + ppt/pptx、analyze-document-model（子 prompt 编排）、C1'/B1'、多格式测试与 prompt 调优 | **5–7d** |
| **3** | Legacy 清理：**Copilot 稳定运行一段时间后**再删 generate-model、Legacy 编辑器、旧 AI 按钮；更新 test/CI | 3–5d（**非 MVP 阻塞**） |

> Phase 1 与旧 Phase 2 合并理由：对话建 A/B/C 与 EPC 步骤生成同属「用户一句话 → Tool → 写 draft」；EPC 仅多一个 `generateEpcStepsFromText` Action，无新 API 依赖，减少交接点。

**总 MVP 工期：11–15 天**（Phase 0 + 1 + 2）

**MVP 交付 = Phase 0 + 1 + 2**。Phase 3（Legacy 删除）**不急**——过渡期旧 AI 按钮 + tooltip 足够；删代码不解决用户问题，Copilot 好用才是关键。

---

## 9. MVP 验收清单

- [ ] 进入项目 → 右侧 Copilot，宽度可拖拽
- [ ] 对话创建 A/B/C → 左侧树 🌲 实时出现
- [ ] 口述 / 文档 → EPC 步骤 draft（含顺序、要素引用）
- [ ] 上传 docx/pdf/xlsx/txt/md/csv/json/ppt(x) → 持久化 + 全结构推断
- [ ] 修改 confirmed 模块 → 自动 fork + 回复说明
- [ ] 要素：新建 / 更新 draft / skip confirmed + 告知
- [ ] 左侧 draft → confirmed 正常
- [ ] 无法处理 → 能力边界，无空白/死循环
- [ ] 旧 AI 按钮保留 + tooltip
- [ ] Copilot 无 delete Action
- [ ] **性能（对话建模）**：不含文档上传时，用户提交 → Markdown 回复展示 **≤ 8s**；超过则优化 prompt 简化或 LLM 响应策略

---

## 10. 风险与待定项

| 项 | 说明 | 建议 |
|----|------|------|
| CopilotKit × React 19 | **最大风险** | **Phase 0 Day 1 上午 spike**（约半天），能渲染能聊天后再 commit |
| Client-side Actions + Store | CopilotKit 若强制 server-side，需调整 | 优先 client |
| 单次文档推断质量 | 结构复杂时可能漏 | 子 prompt 拆分 + 单路失败可重试；回复列出「待补充」 |
| MarkItDown 部署 | pptx 依赖外部工具 | upload route 内封装，失败友好提示 |
| analyze-document-model 大而全 | 任一字段错即整段重试 | **编排层 + 2–3 子 prompt**，无大一统 JSON schema |
| 对话响应 > 5s「思考中」 | 体验崩溃 | 验收 ≤ 8s；必要时简化 prompt / 降 temperature |
