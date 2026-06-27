# Copilot 统一 AI 建模助手 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在建模工作台右侧交付 CopilotKit Copilot 面板，通过 client-side Actions 直写 Zustand Store draft，复用现有 LLM API，完成对话增量建模 + EPC 必达 + 文档智能推断（MVP）。

**Architecture:** CopilotKit UI + `/api/copilotkit` Runtime；`useCopilotAction` 在 client 调 Store / 现有 Next.js API；文档推断走 `analyze-document-model` 编排层（2–3 子 prompt，无大一统 JSON schema）。

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Zustand · CopilotKit (`@copilotkit/react-core` `@copilotkit/react-ui`) · coze-coding-dev-sdk · Vitest · Testing Library

**Authoritative spec:** [`docs/superpowers/specs/2026-06-26-copilot-unified-modeling-design.md`](../specs/2026-06-26-copilot-unified-modeling-design.md)

---

## 0. 测试用例索引（TC）

每个 Task 的 **Verify** 步骤引用下列 TC。`Automated` = vitest；`Manual` = 浏览器手测；`Perf` = 计时。

| TC ID | 映射 spec §9 | 描述 | 类型 |
|-------|-------------|------|------|
| **TC-P0-SPIKE** | 风险 §10 | CopilotKit × React 19：Sidebar 渲染 + 能发消息 | Manual |
| **TC-P0-01** | #1 | 右栏 Copilot 可见、`data-testid` 可测 | Integration |
| **TC-P0-02** | #1 | 面板宽度可拖拽，持久化 `copilot-panel-width` | Integration |
| **TC-P0-03** | — | `GET /api/copilotkit` 返回 ok | Unit |
| **TC-P0-04** | — | `getProjectSummary` Action 返回 JSON | Unit |
| **TC-01** | #1 | 进入项目 → 工作台右侧 Copilot | E2E @smoke |
| **TC-02** | #2 | 对话创建 A/B/C → 左侧树 draft 实时出现 | Integration + E2E |
| **TC-03** | #3 | 上传文档 → referenceDocuments + 推断写 draft | Integration |
| **TC-04** | #4 | 修改 confirmed 模块 → fork + 回复说明 | Unit + Integration |
| **TC-05** | #5 | 左侧 draft → confirmed 回归（现有流程） | `pnpm run test:phase1.5` |
| **TC-06** | #6 | 旧 AI 按钮 tooltip 文案 | Integration |
| **TC-07** | #7 | 口述/SOP → EPC 步骤 draft | Unit + Integration + E2E @smoke |
| **TC-08** | #8 | 无法处理 → 能力边界话术，无死循环 | Unit |
| **TC-09** | #9 | Actions 注册表无 `delete*` | Unit |
| **TC-10** | #10 | 对话建模（无上传）端到端 ≤ 8s | Perf Manual |

**常用命令速查**

```bash
# 单文件
pnpm exec vitest run tests/unit/copilot/actions-registry.spec.ts

# Copilot 相关目录（随实现逐步扩充）
pnpm exec vitest run tests/unit/copilot tests/integration/copilot

# 回归 Store / 模块版本
pnpm run test:phase1
pnpm run test:phase1.5
pnpm run test:phase3

# 类型与 lint
pnpm run ts-check
pnpm run lint

# MVP 冒烟子集（计划末期）
pnpm exec vitest run tests/integration/copilot tests/e2e/copilot -t @smoke

# 全 CI（提交前）
pnpm run ci:check
```

---

## 1. 文件结构（实施前锁定）

| 文件 | 职责 | Phase |
|------|------|-------|
| `src/app/api/copilotkit/route.ts` | CopilotKit Runtime（**已存在 stub，需改为 coze/自托管适配**） | 0 |
| `src/components/ontology/copilot/modeling-copilot-panel.tsx` | 右栏容器：Header、折叠、ResizablePanel | 0 |
| `src/components/ontology/copilot/modeling-copilot-actions.tsx` | 注册全部 `useCopilotAction` | 1–2 |
| `src/components/ontology/copilot/copilot-system-prompt.ts` | System prompt 常量（§6.1） | 1 |
| `src/lib/copilot/resolve-module-target.ts` | fork / 新建 / 更新 判断（§4.4） | 1 |
| `src/lib/copilot/format-copilot-reply.ts` | Markdown 结构化回复（§3.4） | 1 |
| `src/lib/copilot/project-summary.ts` | 只读：树摘要、要素摘要 | 0 |
| `src/lib/copilot/analyze-document-orchestrator.ts` | 文档推断编排（调 3 子 prompt） | 2 |
| `src/app/api/analyze-document-model/route.ts` | 文档推断 API | 2 |
| `src/lib/copilot/parse-pptx-markitdown.ts` | upload 内 ppt/pptx → md | 2 |
| `src/components/ontology/modeling-workspace.tsx` | 挂载 CopilotPanel + Provider | 0 |
| `src/components/ontology/business-chain-detail.tsx` | 补 `onApplyEpcDraft`（缺口 §7） | 1 |
| `tests/unit/copilot/*.spec.ts` | 纯函数 / Action handler 单测 | 0–2 |
| `tests/integration/copilot/*.spec.tsx` | 组件 + Store 集成 | 1–2 |
| `tests/e2e/copilot/*.spec.ts` | @smoke 端到端（vitest e2e 风格，与现有一致） | 1–2 |

**已存在（Phase 0 部分完成，Task 中标注 SKIP/VERIFY）：**

- `package.json` 已有 `@copilotkit/react-core` `@copilotkit/react-ui`
- `modeling-workspace.tsx` 已包 `<CopilotKit><CopilotSidebar />`（**无** Resizable、**无** Actions）

---

## Phase 0：Spike + 基础设施（2–3d）

> **Gate：** TC-P0-SPIKE 通过后才能进入 Task 0.4 及之后所有 Task。

---

### Task 0.1: Spike — 验证 CopilotKit 渲染

**Files:**
- Modify: `src/app/api/copilotkit/route.ts`
- Modify: `src/components/ontology/modeling-workspace.tsx`（确认现有挂载）

**TC:** TC-P0-SPIKE

- [ ] **Step 1: 确认依赖已安装**

Run: `pnpm list @copilotkit/react-core @copilotkit/react-ui`  
Expected: 显示 `1.x` 版本，无 `ERR`

- [ ] **Step 2: 启动 dev**

Run: `pnpm dev`  
Expected: 端口 5000 就绪

- [ ] **Step 3: Manual — 打开项目进入建模工作台**

URL: `http://localhost:5000` → 进入任意项目  
Expected: 右侧出现 Copilot Sidebar，无 React 控制台 error

- [ ] **Step 4: Manual — 发送测试消息**

在 Copilot 输入框发送：`hello`  
Expected: 有 assistant 回复 **或** 明确 API 错误（非白屏）；记录响应时间

- [ ] **Step 5: Spike 结论写入**

Create: `docs/superpowers/plans/2026-06-26-copilot-spike-result.md`  
内容：React 19 兼容 Y/N、Runtime 是否需改 coze adapter、阻塞项

**若 TC-P0-SPIKE 失败：** STOP — 评估 pin CopilotKit 版本 / 自定义 Runtime 接 `coze-coding-dev-sdk`，重新 spike。**不得进入 Task 0.4+**

---

### Task 0.2: Runtime route 健康检查单测

**Files:**
- Test: `tests/unit/copilot/copilotkit-route.spec.ts`
- Modify: `src/app/api/copilotkit/route.ts`

**TC:** TC-P0-03

- [ ] **Step 1: 写 failing test**

```typescript
// tests/unit/copilot/copilotkit-route.spec.ts
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/copilotkit/route';

describe('GET /api/copilotkit', () => {
  it('TC-P0-03 returns ok status', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('copilotkit');
  });
});
```

- [ ] **Step 2: Run — 应 PASS（route 已存在）**

Run: `pnpm exec vitest run tests/unit/copilot/copilotkit-route.spec.ts`  
Expected: 1 passed

- [ ] **Step 3: Commit**

```bash
git add tests/unit/copilot/copilotkit-route.spec.ts
git commit -m "test(copilot): TC-P0-03 copilotkit route health check"
```

---

### Task 0.3: 抽取 `project-summary` 纯函数

**Files:**
- Create: `src/lib/copilot/project-summary.ts`
- Test: `tests/unit/copilot/project-summary.spec.ts`

**TC:** TC-P0-04（partial）

- [ ] **Step 1: 写 failing test**

```typescript
// tests/unit/copilot/project-summary.spec.ts
import { describe, expect, it } from 'vitest';
import { buildProjectSummary } from '@/lib/copilot/project-summary';
import { createMockProject } from '@/tests/unit/test-helpers';

describe('buildProjectSummary', () => {
  it('TC-P0-04 returns valueDomains count', () => {
    const project = createMockProject({
      valueDomains: [{ id: 'a1', name: '生产', nameEn: 'Mfg', description: '' }],
    } as Partial<import('@/types/ontology').OntologyProject>);
    const summary = buildProjectSummary(project);
    expect(summary.valueDomainCount).toBe(1);
    expect(summary.valueDomains[0].name).toBe('生产');
  });
});
```

- [ ] **Step 2: Run — 应 FAIL**

Run: `pnpm exec vitest run tests/unit/copilot/project-summary.spec.ts`  
Expected: FAIL `Cannot find module '@/lib/copilot/project-summary'`

- [ ] **Step 3: 最小实现**

```typescript
// src/lib/copilot/project-summary.ts
import type { OntologyProject } from '@/types/ontology';

export type ProjectSummary = {
  valueDomainCount: number;
  valueDomains: Array<{ id: string; name: string }>;
  capabilityCount: number;
  scenarioCount: number;
  epcCount: number;
  metaElementCount: number;
};

export function buildProjectSummary(project: OntologyProject): ProjectSummary {
  const valueDomains = project.valueDomains ?? [];
  return {
    valueDomainCount: valueDomains.length,
    valueDomains: valueDomains.map((v) => ({ id: v.id, name: v.name })),
    capabilityCount: project.capabilities?.length ?? 0,
    scenarioCount: project.scenarios?.length ?? 0,
    epcCount: project.epcProcesses?.length ?? 0,
    metaElementCount: project.metaElements?.length ?? 0,
  };
}
```

- [ ] **Step 4: Run — 应 PASS**

Run: `pnpm exec vitest run tests/unit/copilot/project-summary.spec.ts`  
Expected: 1 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/copilot/project-summary.ts tests/unit/copilot/project-summary.spec.ts
git commit -m "feat(copilot): TC-P0-04 project summary helper"
```

---

### Task 0.4: `ModelingCopilotPanel` — 可拖拽右栏

**Files:**
- Create: `src/components/ontology/copilot/modeling-copilot-panel.tsx`
- Modify: `src/components/ontology/modeling-workspace.tsx`
- Test: `tests/integration/copilot/copilot-panel.spec.tsx`

**TC:** TC-P0-01, TC-P0-02, TC-01（partial）

- [ ] **Step 1: 写 failing integration test**

```tsx
// tests/integration/copilot/copilot-panel.spec.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelingCopilotPanel } from '@/components/ontology/copilot/modeling-copilot-panel';

describe('ModelingCopilotPanel', () => {
  it('TC-P0-01 renders copilot panel test id', () => {
    render(<ModelingCopilotPanel projectName="测试项目" defaultWidth={360} />);
    expect(screen.getByTestId('modeling-copilot-panel')).toBeInTheDocument();
  });

  it('TC-P0-02 shows footer draft hint', () => {
    render(<ModelingCopilotPanel projectName="测试项目" defaultWidth={360} />);
    expect(screen.getByText(/所有写入均为草稿/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — FAIL**

Run: `pnpm exec vitest run tests/integration/copilot/copilot-panel.spec.tsx`  
Expected: FAIL module not found

- [ ] **Step 3: 实现 Panel（含 min 280 max 50vw localStorage）**

`modeling-copilot-panel.tsx` 职责：
- `data-testid="modeling-copilot-panel"`
- 内部 `<CopilotSidebar />` + Header「建模 Copilot · {projectName}」
- 拖拽分隔条：`onMouseDown` 更新 width，写入 `localStorage.setItem('copilot-panel-width', String(w))`
- Footer：「所有写入均为草稿，请在左侧确认」

- [ ] **Step 4: 修改 `modeling-workspace.tsx`**

将现有：

```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  <div className="flex-1 ...">...</div>
  <CopilotSidebar />
</CopilotKit>
```

改为：

```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  <div className="flex flex-1 min-w-0 overflow-hidden">
    <div className="flex-1 flex flex-col overflow-hidden">{/* 原 Tab 内容 */}</div>
    <ModelingCopilotPanel projectName={project.name} />
  </div>
</CopilotKit>
```

- [ ] **Step 5: Run integration — PASS**

Run: `pnpm exec vitest run tests/integration/copilot/copilot-panel.spec.tsx`  
Expected: 2 passed

- [ ] **Step 6: Manual TC-01 partial**

Run: `pnpm dev` → 进入项目  
Expected: 右侧 Panel、Footer 文案可见

- [ ] **Step 7: Commit**

```bash
git add src/components/ontology/copilot/modeling-copilot-panel.tsx \
  src/components/ontology/modeling-workspace.tsx \
  tests/integration/copilot/copilot-panel.spec.tsx
git commit -m "feat(copilot): TC-P0-01/02 resizable copilot panel"
```

---

### Task 0.5: 只读 Action `getProjectSummary`

**Files:**
- Create: `src/components/ontology/copilot/modeling-copilot-actions.tsx`
- Modify: `src/components/ontology/copilot/modeling-copilot-panel.tsx`（挂载 Actions）
- Test: `tests/unit/copilot/get-project-summary-action.spec.ts`

**TC:** TC-P0-04

- [ ] **Step 1: 写 failing test（mock useCopilotAction 导出 handler）**

模式：将 action handler 抽成纯函数 `runGetProjectSummary(project)` 单测；组件内 `useCopilotAction` 仅委托。

```typescript
// tests/unit/copilot/get-project-summary-action.spec.ts
import { describe, expect, it } from 'vitest';
import { runGetProjectSummary } from '@/lib/copilot/actions/get-project-summary';
import { createMockProject } from '@/tests/unit/test-helpers';

describe('runGetProjectSummary', () => {
  it('TC-P0-04 returns JSON string summary', () => {
    const project = createMockProject({ valueDomains: [] } as Partial<import('@/types/ontology').OntologyProject>);
    const result = runGetProjectSummary(project);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('valueDomainCount');
  });
});
```

- [ ] **Step 2: Run — FAIL**

Run: `pnpm exec vitest run tests/unit/copilot/get-project-summary-action.spec.ts`

- [ ] **Step 3: 实现 `runGetProjectSummary` + 在 `ModelingCopilotActions` 注册**

```typescript
useCopilotAction({
  name: 'getProjectSummary',
  description: '获取当前项目 A/B/C/EPC/要素库摘要',
  handler: async () => runGetProjectSummary(useOntologyStore.getState().project!),
});
```

- [ ] **Step 4: Run — PASS**

Run: `pnpm exec vitest run tests/unit/copilot/get-project-summary-action.spec.ts`

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(copilot): TC-P0-04 getProjectSummary action"
```

---

### Task 0.6: Phase 0 门禁

- [ ] **Run: 类型检查**

Run: `pnpm run ts-check`  
Expected: 0 errors

- [ ] **Run: lint**

Run: `pnpm run lint`  
Expected: 0 errors

- [ ] **Checklist**

- [ ] TC-P0-SPIKE 文档已填写
- [ ] TC-P0-01 / 02 / 03 / 04 自动化通过

---

## Phase 1：对话增量建模 + EPC 必达（4–5d）

---

### Task 1.1: `resolve-module-target` 纯函数

**Files:**
- Create: `src/lib/copilot/resolve-module-target.ts`
- Test: `tests/unit/copilot/resolve-module-target.spec.ts`

**TC:** TC-04（partial）

- [ ] **Step 1: 写 4 个 failing tests**

用例：
1. confirmed + `isModifyIntent('把计划管理改成供应链')` → `{ mode: 'fork', moduleId }`
2. confirmed + `isNewIntent('加一个供应链能力')` → `{ mode: 'create' }`
3. 仅 draft 存在 → `{ mode: 'update', moduleId }`
4. 无匹配 → `{ mode: 'create' }`

Run: `pnpm exec vitest run tests/unit/copilot/resolve-module-target.spec.ts`  
Expected: FAIL

- [ ] **Step 2: 实现 `resolveModuleTarget()`**

输入：`{ name, kind, userText, modules, records }`  
输出：`{ mode: 'fork' | 'create' | 'update', moduleId?: string }`

- [ ] **Step 3: Run — 4 passed**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(copilot): TC-04 resolveModuleTarget fork logic"
```

---

### Task 1.2: Action `createValueDomain`

**Files:**
- Create: `src/lib/copilot/actions/create-value-domain.ts`
- Test: `tests/unit/copilot/create-value-domain.spec.ts`

**TC:** TC-02

- [ ] **Step 1: failing test — 调 Store 后 valueDomains +1**

使用 `useOntologyStore` test reset 模式（参考 `tests/unit/business-chain-store.spec.ts`）

- [ ] **Step 2: 实现 handler 返回 `{ id, name, message }`**

- [ ] **Step 3: Run PASS**

Run: `pnpm exec vitest run tests/unit/copilot/create-value-domain.spec.ts`

- [ ] **Step 4: Commit**

---

### Task 1.3: Actions `createCapability` / `createScenario` / `createEpcProcess`

**Files:**
- Create: `src/lib/copilot/actions/create-*.ts`（3 文件）
- Test: `tests/unit/copilot/create-chain-nodes.spec.ts`

**TC:** TC-02

- [ ] **Step 1: 每个 Action 一个 test case（共 3）**

- [ ] **Step 2: 实现并注册到 `ModelingCopilotActions`**

- [ ] **Step 3: Run**

Run: `pnpm exec vitest run tests/unit/copilot/create-chain-nodes.spec.ts`

- [ ] **Step 4: Commit**

---

### Task 1.4: Action `updateModuleDraft`（含 fork）

**Files:**
- Create: `src/lib/copilot/actions/update-module-draft.ts`
- Test: `tests/unit/copilot/update-module-draft.spec.ts`

**TC:** TC-04

- [ ] **Step 1: test — confirmed 模块更新前先 fork**

- [ ] **Step 2: 实现：resolveModuleTarget → forkModuleToDraft → update* / applyAiModuleDraft**

- [ ] **Step 3: Run PASS**

- [ ] **Step 4: Commit**

---

### Task 1.5: `format-copilot-reply` Markdown

**Files:**
- Create: `src/lib/copilot/format-copilot-reply.ts`
- Test: `tests/unit/copilot/format-copilot-reply.spec.ts`

**TC:** TC-02, TC-04（回复格式）

- [ ] **Step 1: test — 输入 `{ created: [...], forked: [...], skipped: [...] }` 输出含 `**价值域**` 标题**

- [ ] **Step 2: 实现**

- [ ] **Step 3: Run PASS**

- [ ] **Step 4: Commit**

---

### Task 1.6: 修复 `business-chain-detail` EPC 接线

**Files:**
- Modify: `src/components/ontology/business-chain-detail.tsx`
- Test: 扩展现有 `tests/integration/ai-draft/epc-dialog.spec.tsx`

**TC:** TC-07（partial，旧 UI 路径）

- [ ] **Step 1: 在 `BusinessChainDetail` 增加 handler**

```typescript
const applyAiEpcDraft = useOntologyStore((s) => s.applyAiEpcDraft);

const handleApplyEpcDraft = (steps: EpcStepSuggestion[]) => {
  applyAiEpcDraft(selected.id, steps as EpcStep[]);
  toast.success('EPC 步骤已写入草稿');
};
```

传给 `<AiDraftFillTrigger onApplyEpcDraft={handleApplyEpcDraft} />`

- [ ] **Step 2: Run 现有 EPC dialog 测试**

Run: `pnpm exec vitest run tests/integration/ai-draft/epc-dialog.spec.tsx`  
Expected: 全部 pass（含 `onApplyEpcDraft` case）

- [ ] **Step 3: Commit**

```bash
git commit -m "fix(copilot): TC-07 wire onApplyEpcDraft in business-chain-detail"
```

---

### Task 1.7: Action `generateEpcStepsFromText`

**Files:**
- Create: `src/lib/copilot/actions/generate-epc-steps-from-text.ts`
- Test: `tests/unit/copilot/generate-epc-steps-from-text.spec.ts`

**TC:** TC-07

- [ ] **Step 1: mock fetch → `generate-module-draft` EPC 响应**

- [ ] **Step 2: handler：POST API → `applyAiEpcDraft(epcId, steps)`**

- [ ] **Step 3: Run PASS**

Run: `pnpm exec vitest run tests/unit/copilot/generate-epc-steps-from-text.spec.ts`

- [ ] **Step 4: 复用 Store 测试**

Run: `pnpm exec vitest run tests/unit/ai-draft/apply-epc-draft.spec.ts`  
Expected: 仍 pass

- [ ] **Step 5: Commit**

---

### Task 1.8: System prompt + 无 delete 门禁

**Files:**
- Create: `src/components/ontology/copilot/copilot-system-prompt.ts`
- Create: `src/lib/copilot/actions-registry.ts`（导出 ALLOWED_ACTION_NAMES）
- Test: `tests/unit/copilot/actions-registry.spec.ts`

**TC:** TC-08, TC-09

- [ ] **Step 1: test — 注册表不包含 `/delete/i`**

```typescript
expect(ALLOWED_ACTION_NAMES.some((n) => /delete/i.test(n))).toBe(false);
```

- [ ] **Step 2: 实现 registry + system prompt 常量**

- [ ] **Step 3: Run PASS**

- [ ] **Step 4: Commit**

---

### Task 1.9: 旧 AI 按钮 tooltip

**Files:**
- Modify: `src/components/ontology/ai-draft-fill-dialog.tsx`（Trigger tooltip）
- Modify: `src/components/ontology/element-library.tsx`（「AI 解析文档」按钮）
- Test: `tests/integration/copilot/legacy-ai-tooltip.spec.tsx`

**TC:** TC-06

- [ ] **Step 1: integration test 检查 tooltip 文案「建议使用右侧 Copilot」**

- [ ] **Step 2: 用 shadcn Tooltip 包裹按钮**

- [ ] **Step 3: Run PASS**

Run: `pnpm exec vitest run tests/integration/copilot/legacy-ai-tooltip.spec.tsx`

- [ ] **Step 4: Commit**

---

### Task 1.10: Integration — 对话创建 A/B/C 刷新树

**Files:**
- Create: `tests/integration/copilot/incremental-modeling.spec.tsx`

**TC:** TC-02

- [ ] **Step 1: 渲染 `ModelingCopilotActions` + mock 直接调 `createValueDomain` handler**

- [ ] **Step 2: assert Store 更新 + 可查询 `data-testid` 业务链节点**

- [ ] **Step 3: Run PASS**

Run: `pnpm exec vitest run tests/integration/copilot/incremental-modeling.spec.tsx`

- [ ] **Step 4: Commit**

---

### Task 1.11: E2E smoke — Copilot 面板 + EPC

**Files:**
- Create: `tests/e2e/copilot/smoke.spec.ts`

**TC:** TC-01, TC-07 @smoke

- [ ] **Step 1: 写 smoke — 进入 workspace assert `modeling-copilot-panel`**

- [ ] **Step 2: 写 smoke — mock LLM 或直接调 handler 后 assert epc steps length > 0**

- [ ] **Step 3: Run**

Run: `pnpm exec vitest run tests/e2e/copilot/smoke.spec.ts -t @smoke`

- [ ] **Step 4: Commit**

---

### Task 1.12: 能力边界话术单测

**Files:**
- Create: `src/lib/copilot/capability-boundary.ts`
- Test: `tests/unit/copilot/capability-boundary.spec.ts`

**TC:** TC-08

- [ ] **Step 1: `buildBoundaryReply(intent)` 对 `export` / `delete` 返回固定话术**

- [ ] **Step 2: Run PASS**

- [ ] **Step 3: Commit**

---

### Task 1.13: Phase 1 回归门禁

- [ ] **Run module confirm 回归**

Run: `pnpm run test:phase1.5`  
Expected: 100% pass（**TC-05**）

- [ ] **Run phase3 AI draft 回归**

Run: `pnpm run test:phase3`  
Expected: 100% pass

- [ ] **Run ts-check + lint**

Run: `pnpm run ts-check && pnpm run lint`

---

### Task 1.14: Manual 性能采样（TC-10 基线）

**TC:** TC-10

- [ ] **Step 1: 浏览器 Network + Performance**

场景：对话「建价值域测试域」（无文件）  
记录：发送到 Markdown 回复可见的时间  
Expected: ≤ 8s（超标则记录瓶颈：Runtime / LLM / Action 链）

- [ ] **Step 2: 结果写入 `docs/superpowers/plans/2026-06-26-copilot-spike-result.md` 附录**

---

## Phase 2：文档智能推断（5–7d）

---

### Task 2.1: `analyze-document-orchestrator` 骨架

**Files:**
- Create: `src/lib/copilot/analyze-document-orchestrator.ts`
- Test: `tests/unit/copilot/analyze-document-orchestrator.spec.ts`

**TC:** TC-03（partial）

- [ ] **Step 1: test — 3 个子调用 stub，一路失败不影响其他路结果**

- [ ] **Step 2: 实现 `runAnalyzeDocument({ documentText, project })` 返回 `{ chain, epc, elements, errors[] }`**

- [ ] **Step 3: Run PASS**

- [ ] **Step 4: Commit**

---

### Task 2.2: API `POST /api/analyze-document-model`

**Files:**
- Create: `src/app/api/analyze-document-model/route.ts`
- Test: `tests/unit/analyze-document-model-route.spec.ts`

**TC:** TC-03

- [ ] **Step 1: mock coze SDK，stub 3 段 JSON 响应**

- [ ] **Step 2: 实现 route 调 orchestrator**

- [ ] **Step 3: Run PASS**

Run: `pnpm exec vitest run tests/unit/analyze-document-model-route.spec.ts`

- [ ] **Step 4: Commit**

---

### Task 2.3: Action `uploadReferenceDocument`

**Files:**
- Create: `src/lib/copilot/actions/upload-reference-document.ts`
- Test: `tests/unit/copilot/upload-reference-document.spec.ts`

**TC:** TC-03

- [ ] **Step 1: mock `/api/reference-documents/upload` + `addReferenceDocument`**

- [ ] **Step 2: Run PASS**

- [ ] **Step 3: Commit**

---

### Task 2.4: Action `analyzeDocumentAndModel`

**Files:**
- Create: `src/lib/copilot/actions/analyze-document-and-model.ts`
- Test: `tests/unit/copilot/analyze-document-and-model.spec.ts`

**TC:** TC-03

- [ ] **Step 1: 集成 upload + analyze API + 批量 Store 写入**

- [ ] **Step 2: assert Markdown 回复含新建/跳过统计**

- [ ] **Step 3: Run PASS**

- [ ] **Step 4: Commit**

---

### Task 2.5: 要素 C1' — 扩展 `applyAiElementDrafts`

**Files:**
- Modify: `src/store/ontology-store.ts`（若逻辑已在 store）
- Test: 扩展 `tests/unit/ai-draft/apply-element-drafts.spec.ts`

**TC:** TC-03, spec §4.4 C1'

- [ ] **Step 1: test — draft 同名更新；confirmed 同名 skip**

- [ ] **Step 2: 实现**

- [ ] **Step 3: Run**

Run: `pnpm exec vitest run tests/unit/ai-draft/apply-element-drafts.spec.ts`

- [ ] **Step 4: Commit**

---

### Task 2.6: ppt/pptx — upload route MarkItDown 分支

**Files:**
- Create: `src/lib/copilot/parse-pptx-markitdown.ts`
- Modify: `src/app/api/reference-documents/upload/route.ts`
- Test: `tests/unit/reference-documents-upload-pptx.spec.ts`

**TC:** TC-03

- [ ] **Step 1: test — `.pptx` mock markitdown 返回 markdown 文本**

- [ ] **Step 2: 实现（失败时返回明确 error，不 silent fail）**

- [ ] **Step 3: Run PASS**

- [ ] **Step 4: Commit**

---

### Task 2.7: 文档推断 Integration + E2E

**Files:**
- Create: `tests/integration/copilot/document-analyze.spec.tsx`
- Create: `tests/e2e/copilot/document-upload.spec.ts`

**TC:** TC-03 @smoke

- [ ] **Step 1: 上传 txt fixture → assert valueDomains 增加**

- [ ] **Step 2: Run**

Run: `pnpm exec vitest run tests/integration/copilot/document-analyze.spec.tsx tests/e2e/copilot/document-upload.spec.ts`

- [ ] **Step 3: Commit**

---

### Task 2.8: Phase 2 全量门禁

- [ ] **Run Copilot 全套件**

Run: `pnpm exec vitest run tests/unit/copilot tests/integration/copilot tests/e2e/copilot`

- [ ] **Run CI**

Run: `pnpm run ci:check`

- [ ] **MVP 验收勾选（spec §9）**

对照 TC-01～TC-10 逐项打勾

---

## Phase 3：Legacy 清理（非 MVP 阻塞）

> Copilot 稳定运行 2+ 周后执行。仅列 Task 标题，不在 MVP 分支开发。

| Task | 内容 | 验证 |
|------|------|------|
| 3.1 | 删除 `generate-model` route + tests | `pnpm run test:phase4` |
| 3.2 | 删除 `extract-entities` route | integration api.test 更新 |
| 3.3 | 移除 Legacy 编辑器入口 | `legacy-entrypoints-audit.spec` |
| 3.4 | 移除旧 AI 按钮（保留 Copilot） | TC-06 更新为「无旧按钮」 |
| 3.5 | 更新 spec / README | docs review |

---

## Spec 覆盖自检（Plan ↔ Spec）

| Spec 章节 | 覆盖 Task |
|-----------|-----------|
| §1 目标边界 | Phase 0–2 全局 |
| §2 架构 client Actions | 0.5, 1.x Actions |
| §3 UI 布局 | 0.4 |
| §4 Actions 清单 | 0.5, 1.2–1.7, 2.3–2.4 |
| §4.3 analyze 子 prompt | 2.1, 2.2 |
| §4.4 fork/C1' | 1.1, 1.4, 2.5 |
| §5 API | 0.2, 2.2, 2.6 |
| §6 System prompt / 无 delete | 1.8 |
| §7 缺口 onApplyEpcDraft | 1.6 |
| §8 分期 | Phase 0–3 本 plan |
| §9 验收 | TC-01～TC-10 |
| §10 风险 spike | 0.1, 0.6 |

**Gap：** TC-10 仅 Manual 基线（Task 1.14）；若需 CI perf gate，后续加 `tests/perf/copilot-latency.spec.ts`（非 MVP）。

---

## 执行选项

Plan 已保存至 `docs/superpowers/plans/2026-06-26-copilot-unified-modeling.md`。

1. **Subagent-Driven（推荐）** — 每 Task 派生子 agent，Task 间人工 review  
2. **Inline Execution** — 本会话按 Task 0.1 起连续实现，Phase 门禁处暂停

请选择执行方式，或指定从 **Task 0.1** 开始。
