# AI 文档驱动 EPC 生成 — 实施计划 (US-S11b)

> **For agentic workers:** 使用 `executing-plans` 或 `subagent-driven-development` 逐 Task 实施。
> 步骤使用 `- [ ]` checkbox 语法跟踪进度。

**Goal:** 在 EPC 节点上传业务文档（.txt/.md/.csv/.json），AI 解析后全量生成 EPC 步骤序列草稿，遵循 fork 规则写入 Store，不触发 confirm。

**Architecture:** 复用 `POST /api/generate-module-draft` API（moduleKind='EPC'），四层 Unit 管道：Prompt 构建 → Store 写入 → UI 交互 → E2E 验证。EPC 步骤通过 `elementRef` 引用已确认要素，AI 在 Prompt 层接收链上下文和已确认要素目录作为约束。

**Tech Stack:** TypeScript 5 + Zustand + React 19 + shadcn/ui

---

## 架构决策 (ADR)

| 决策 | 选项 | 选择 | 理由 |
|:---|:---|:---|:---|
| API 端点 | 新建 vs 复用 | **复用** `/api/generate-module-draft` | US-S11b 与 US-S11 语义一致，仅 `moduleKind` 区分路线，避免 API 膨胀 |
| 写入模式 | 全量替换 vs 增量合并 | **全量替换** | EPC 步骤有确定顺序，文档生成应代表完整流程骨架；用户后续手动调优 |
| fork 规则 | 单层 vs 递归 | **单层 fork** | fork 仅从最新 confirmed 快照分叉，不递归合并多版本 |
| elementRef 匹配 | LLM 自由生成 vs 约束目录 | **约束目录** | Prompt 传入已确认要素 `{id, name, dimension}[]`，LLM 优先匹配；无匹配则省略 |
| 文档格式 | .txt/.md/.csv/.json | **四种** | 覆盖常见轻量文本格式，同现有 `AiDraftFillDialog` 限制 |
| 字符上限 | 50000 | **50000** | 平衡 LLM 上下文窗口与实用性 |
| API route 扩展 | 新增字段 | **`documentText` 字段** | 在现有 `GenerateModuleDraftRequest` body 中新增可选字段，不破坏现有调用方 |

---

## 模块划分

| 模块 | 文件 | 职责 |
|:---|:---|:---|
| **Prompt 引擎** | `src/lib/ai-draft/epc-doc-prompt.ts` | 构建 EPC 步骤生成 Prompt + 解析 LLM 输出 |
| **Store 集成** | `src/store/ontology-store.ts` (新增 `applyAiEpcDraft`) | fork 逻辑 + 全量替换 draft steps + 重建索引 |
| **API 路由** | `src/app/api/generate-module-draft/route.ts` (扩展) | 接收 `documentText`，调用 Prompt 引擎 + LLM |
| **UI 对话框** | `src/components/ontology/ai-draft-fill-dialog.tsx` (扩展) | EPC 模式下显示文档上传 + 触发生成 + 写入 Store |
| **E2E 验证** | `tests/e2e/ai-draft/fork-rules.epc.spec.ts` | 三种 fork 场景 + 完整上传流程 |

---

## 接口定义

### API 请求/响应

```typescript
// POST /api/generate-module-draft (扩展)
interface GenerateModuleDraftRequest {
  moduleKind: ModuleKind;
  moduleId: string;
  project: ProjectContext;
  userHint?: string;
  documentText?: string;           // 新增：文档原文，最多 50000 字符
}

interface GenerateModuleDraftResponse {
  suggestion: {
    steps: EpcStepSuggestion[];
  };
}
```

### Prompt 引擎接口

```typescript
// src/lib/ai-draft/epc-doc-prompt.ts

interface EpcDocContext {
  chainPath: string;
  confirmedElements: { id: string; name: string; dimension: string }[];
}

interface EpcStepSuggestion {
  name: string;
  description: string;
  elementRef?: { elementId: string; versionPin?: string };
}

function buildEpcDocPrompt(docText: string, context: EpcDocContext): string;
function parseEpcSteps(llmOutput: string): { steps: EpcStepSuggestion[] };
```

### Store 接口

```typescript
// ontology-store.ts 新增
applyAiEpcDraft: (epcId: string, steps: EpcStepSuggestion[]) => void;
// fork 规则：①有确认版→fork ②有 draft→覆盖 ③无→创建
```

### UI 组件接口

```typescript
// AiDraftFillDialogProps 扩展
onApplyEpcDraft?: (epcId: string, steps: EpcStepSuggestion[]) => void;
```

---

## 数据流

```
用户上传文档 (.txt/.md/.csv/.json)
    │
    ▼
AiDraftFillDialog → POST /api/generate-module-draft
    { moduleKind:'EPC', moduleId, project, documentText }
    │
    ▼
API Route: buildEpcDocPrompt(docText, context)
    context.chainPath ← project.businessTree
    context.confirmedElements ← project.metaElements
    │
    ▼
LLM → JSON { steps: [...] } → parseEpcSteps → Response
    │
    ▼
onApplyEpcDraft(epcId, steps)
    → applyAiEpcDraft → fork + 替换 steps + rebuildUsageIndex
    → EPC 编辑器刷新（draft 状态）
```

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|:---|:---|:---|:---|
| LLM 生成的 elementRef 指向不存在的要素 | 中 | 中 | Prompt 中明确列出可用要素 ID，Store 层抛掉无效 ref |
| LLM 生成非标准 JSON 导致解析失败 | 中 | 高 | `parseEpcSteps` 带 Zod schema 校验 + 友好报错 + 重试按钮 |
| fork 覆盖用户未保存的修改 | 低 | 高 | 仅操作 draft，confirmed 不可变；生成前弹窗确认 |
| 大文档超出 LLM 上下文 | 低 | 中 | 前端限制 50000 字符 + 提示裁剪 |
| API 复用导致 US-S11 调用方受影响 | 低 | 中 | `documentText` 为可选字段，不传时行为不变 |

---

## Task 列表

### Task 1: Prompt 引擎 (US-S11b-U01)

**Files:** Create `src/lib/ai-draft/epc-doc-prompt.ts` · Test `tests/unit/ai-draft/epc-doc-prompt.spec.ts`

- [ ] **Step 1: 实现 `buildEpcDocPrompt`** — 拼接 system 指令（EPC 建模专家）+ 链路径 + 已确认要素目录 + 文档原文 + 输出 JSON schema
- [ ] **Step 2: 实现 `parseEpcSteps`** — Zod schema 校验 `EpcStepSuggestion[]`，非法 JSON 抛出 `EpcDocParseError`
- [ ] **Step 3: 编写测试 (5 TC)** — Prompt 包含 context / 合法 JSON 解析 / 非法 JSON 抛错 / elementRef 正确引用 / 空文档
- [ ] **Step 4: Commit**

### Task 2: Store 集成 (US-S11b-U02)

**Files:** Modify `src/store/ontology-store.ts` · Test `tests/unit/ai-draft/apply-epc-draft.spec.ts`

- [ ] **Step 1: 实现 `applyAiEpcDraft(epcId, steps)`** — fork 规则判断（确认版→fork / draft→覆盖 / 无→创建）
- [ ] **Step 2: 实现 fork 辅助函数** — `forkFromConfirmed` 深拷贝 + 记录 fork 来源
- [ ] **Step 3: 编写测试 (10 TC)** — fork 三种场景 + 不 confirm + rebuildUsageIndex
- [ ] **Step 4: Commit**

### Task 3: UI 对话框 + 文档上传 (US-S11b-U03)

**Files:** Modify `src/components/ontology/ai-draft-fill-dialog.tsx` · Modify `src/app/api/generate-module-draft/route.ts`

- [ ] **Step 1: 扩展 API 路由** — 检测 `moduleKind='EPC'` + 提取 `documentText` + 调用 Prompt 引擎
- [ ] **Step 2: 扩展 AiDraftFillDialog** — EPC 模式显示文档上传 + FileReader + 提交 + 回调
- [ ] **Step 3: 加载状态与错误处理** — 上传中 spinner / 成功 toast / 失败重试 / 非法格式提示
- [ ] **Step 4: 编写测试 (9 TC)** — Unit(3) + Integration(6)
- [ ] **Step 5: Commit**

### Task 4: fork 规则集成 + E2E (US-S11b-U04)

**Files:** Create `tests/e2e/ai-draft/fork-rules.epc.spec.ts`

- [ ] **Step 1: E2E 编写 (5 TC)** — 有确认版 fork / 无确认覆盖 / 无版创建 / 步骤刷新 / CI
- [ ] **Step 2: 运行完整 CI** — `pnpm run ci:check` 0 error
- [ ] **Step 3: Commit**

---

## Spec 覆盖检查

| 规范要求 | 对应 Task |
|:---|:---|
| 文档上传 → AI 返回合法 EPC 步骤 JSON | Task 1, 3 |
| fork 规则（覆盖/创建）| Task 2, 4 |
| elementRef 仅引用已确认要素 | Task 1 (Prompt 约束) |
| 步骤 draft 不自动 confirm | Task 2 (Store 约束) |
| EPC 编辑器触发生成并刷新 | Task 3, 4 |
| lint/ts-check 0 error | Task 4 (CI) |
| 文档格式 .txt/.md/.csv/.json, ≤50000 char | Task 3 (UI 校验) |
| API 复用 `POST /api/generate-module-draft` | Task 3 (route 扩展) |
