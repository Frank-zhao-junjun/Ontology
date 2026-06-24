# AI 文档驱动 E1~E8 要素草稿 — 实施计划 (US-S19)

> **For agentic workers:** 使用 `executing-plans` 或 `subagent-driven-development` 逐 Task 实施。
> 步骤使用 `- [ ]` checkbox 语法跟踪进度。

**Goal:** 在要素库（本体模型工作区）上传业务文档，AI 解析后增量生成 E1~E8 八维要素草稿，按 `name + dimension` 去重后 **insert** 写入要素库，不覆盖已有要素，不触发 confirm。

**Architecture:** 新建 `POST /api/generate-element-draft` 独立端点，四层 Unit 管道：Prompt 构建（E1~E8 维度感知）→ Store insert+去重 → UI 对话框 → E2E 验证。双重去重保障：Prompt 层（告知 LLM 已有要素名称）+ Store 层（按 `dimension:name` 跳过重复）。

**Tech Stack:** TypeScript 5 + Zustand + React 19 + shadcn/ui

---

## 架构决策 (ADR)

| 决策 | 选项 | 选择 | 理由 |
|:---|:---|:---|:---|
| API 端点 | 复用 vs 新建 | **新建** `POST /api/generate-element-draft` | E1~E8 要素生成语义独立于模块草稿，输出 schema 差异大（要素数组 vs 步骤序列） |
| 写入模式 | 全量替换 vs 增量 insert | **增量 insert** | 要素库是积累式资源，不同文档覆盖不同维度；全量替换会丢失已有成果 |
| 去重策略 | 仅 LLM 层 vs 双重保障 | **双重保障** | Prompt 传入已有要素名称列表 + Store 按 `dimension:name` 再过滤 |
| 维度分配 | LLM 自由判断 vs 预设规则 | **LLM 自由判断** | E1~E8 分类依赖语义理解，LLM 比规则更准确 |
| 文档格式 | 四种 vs 六种 | **六种** | 增加 .docx/.pdf 覆盖正式文档 |
| 字符上限 | 50000 | **50000** | 同 US-S11b |
| 三通道关系 | EPC内联/文档AI/手动 | **统一 draft→confirmed→archived** | 三条通道殊途同归 |

---

## 模块划分

| 模块 | 文件 | 职责 |
|:---|:---|:---|
| **Prompt 引擎** | `src/lib/ai-draft/element-doc-prompt.ts` | 构建 E1~E8 要素生成 Prompt + 解析 LLM 输出 + 去重提示注入 |
| **Store 集成** | `src/store/ontology-store.ts` (新增 `applyAiElementDrafts`) | insert 模式 + 去重 + 维度路由 + 索引重建 |
| **API 路由** | `src/app/api/generate-element-draft/route.ts` (新建) | 接收 documentText + 已有要素名，调用 Prompt 引擎 + LLM |
| **UI 对话框** | `src/components/ontology/element-library.tsx` (扩展) | 要素库「AI 解析文档」按钮 + 上传对话框 + 结果展示 |
| **E2E 验证** | `tests/e2e/ai-draft/element-insert.spec.ts` | insert 模式 + 去重 + UI 刷新 |

---

## 接口定义

### API 请求/响应 (新端点)

```typescript
// POST /api/generate-element-draft
interface GenerateElementDraftRequest {
  projectId: string;
  documentText: string;            // ≤50000 字符
  existingElementNames: { dimension: string; name: string }[];
}

interface GenerateElementDraftResponse {
  elements: ElementDraftSuggestion[];
}

interface ElementDraftSuggestion {
  name: string;
  nameEn?: string;
  description: string;
  dimension: 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
  fields: Record<string, any>;
}
```

### Prompt 引擎接口

```typescript
// src/lib/ai-draft/element-doc-prompt.ts
function buildElementDocPrompt(docText: string, context: ElementDocContext): string;
function parseElementDrafts(llmOutput: string): ParsedElementDrafts;
```

### Store 接口

```typescript
applyAiElementDrafts: (elements: ElementDraftSuggestion[]) => {
  inserted: number;
  skipped: { name: string; dimension: string }[];
};
// insert: 去重 Map<dimension:name> → 增量 push → rebuildUsageIndex
// 不触发 confirm，所有新要素 status='draft'
```

---

## 数据流

```
ElementLibrary → 上传文档
    ↓
POST /api/generate-element-draft { projectId, documentText, existingElementNames }
    ↓
Prompt: 领域 + 八维定义 + 已有要素名(去重) + 文档原文
    ↓
LLM → JSON { elements: [...] } → parseElementDrafts
    ↓
applyAiElementDrafts → 去重 → insert draft → rebuildUsageIndex
    ↓
toast "已新增 N 个，跳过 M 个重复" + 要素库刷新
```

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|:---|:---|:---|:---|
| LLM 将要素归入错误维度 | 中 | 中 | Prompt 详述 E1~E8 定义与示例；用户可在 UI 手动修改维度 |
| LLM 忽略去重提示生成重复 | 中 | 低 | Store 双重过滤，自动跳过 + 告知用户 |
| .docx/.pdf 解析失败 | 中 | 中 | 使用成熟解析库（mammoth，pdf-parse）；解析失败返回友好错误 |
| insert 模式要素累积过多 | 低 | 中 | 要素库已有未引用筛选 + 确认/归档三态管理 |
| LLM 生成非标准 JSON | 中 | 高 | Zod schema 严格校验 + 重试 + 友好提示 |
| 空文档生成垃圾要素 | 中 | 低 | Prompt 指令：无有效信息时返回空数组 |

---

## Task 列表

### Task 1: 要素 Prompt 引擎 (US-S19-U01)

**Files:** Create `src/lib/ai-draft/element-doc-prompt.ts` · Test `tests/unit/ai-draft/element-doc-prompt.spec.ts`

- [ ] **Step 1: 实现 `buildElementDocPrompt`** — System 指令 + 八维定义注入 + 领域 + 去重提示 + 文档原文 + 输出 schema
- [ ] **Step 2: 实现 `parseElementDrafts`** — Zod schema 校验（name/dimension/description/fields），非法 JSON 抛 `ElementDocParseError`
- [ ] **Step 3: 编写测试 (5 TC)** — Prompt 含 domain+existingNames / 合法 JSON 解析 / 非法抛错 / 去重提示 / 空文档
- [ ] **Step 4: Commit**

### Task 2: Store insert+去重 (US-S19-U02)

**Files:** Modify `src/store/ontology-store.ts` · Test `tests/unit/ai-draft/apply-element-drafts.spec.ts`

- [ ] **Step 1: 实现 `applyAiElementDrafts`** — 去重 Map → 过滤 → 生成 id/status='draft' → push → rebuildUsageIndex
- [ ] **Step 2: 编写测试 (6 TC)** — 新增成功 / 同名跳过 / 已有保留 / 返回值正确 / 索引重建 / 不 confirm
- [ ] **Step 3: Commit**

### Task 3: 要素库 UI + 文档上传 (US-S19-U03)

**Files:** Create `src/app/api/generate-element-draft/route.ts` · Modify `src/components/ontology/element-library.tsx`

- [ ] **Step 1: 创建 API 路由** — `POST /api/generate-element-draft` → buildElementDocPrompt → LLM → parseElementDrafts → Response
- [ ] **Step 2: 扩展 element-library.tsx** — 顶部「AI 解析文档」按钮 → Dialog → 文件上传 → 调 API → applyAiElementDrafts
- [ ] **Step 3: 进度与错误处理** — 进度条 + toast 成功/跳过/失败 + 格式校验
- [ ] **Step 4: 编写测试 (9 TC)** — Unit(3) + Integration(6)
- [ ] **Step 5: Commit**

### Task 4: insert 模式验证 + 去重 + E2E (US-S19-U04)

**Files:** Create `tests/e2e/ai-draft/element-insert.spec.ts`

- [ ] **Step 1: E2E 编写 (5 TC)** — 上传生成新要素 / 已有不变 / 重复跳过 / 均为 draft / CI
- [ ] **Step 2: 运行完整 CI** — `pnpm run ci:check` 0 error
- [ ] **Step 3: Commit**

---

## Spec 覆盖检查

| 规范要求 | 对应 Task |
|:---|:---|
| 文档上传 → AI 返回 E1~E8 要素 JSON | Task 1, 3 |
| 要素仅写入 draft | Task 2 (Store 约束) |
| 重复要素不重复 insert | Task 2 (Store 去重) |
| insert 模式不清空已有 | Task 2 (append 逻辑) |
| 要素库 UI 触发生成并刷新 | Task 3, 4 |
| lint/ts-check 0 error | Task 4 (CI) |
| 文档格式 .txt/.md/.csv/.json/.docx/.pdf | Task 3 (UI 校验) |
| 新建 API `POST /api/generate-element-draft` | Task 3 (route 新建) |
| 三通道殊途同归（EPC内联/文档AI/手动）| Task 2 (共享三态管理) |
