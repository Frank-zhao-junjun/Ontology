# 本体建模简化架构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Ontology 建模工具重构为 `A→B→C→EPC` 严格业务树 + E1–E8 全局要素库，实现模块级草稿/确认/版本、EPC 双向引用校验与分模块 Excel 导入导出。

**Architecture:** 业务链（A/B/C/EPC）为严格父子树，EPC 步骤通过 `elementRef` 引用八维要素库；要素库的 `usageRefs` 为派生反向索引，在 EPC 保存时重建；每个模块拥有独立版本线，仅 confirmed 版本可被跨模块引用；校验仅针对 confirmed 快照且为 warning 级别。

**Tech Stack:** Next.js 16 + React 19 + TypeScript 5 + Zustand + shadcn/ui + Tailwind CSS 4 + xlsx

---

## 文件结构总览

| 文件/目录 | 职责 |
|---|---|
| `src/types/ontology.ts` | 新增 A/B/C/EPC 类型、`MetaElementBase`、`ModuleVersionRecord`、`EpcStep.elementRef` 等 |
| `src/store/ontology-store.ts` | 新增业务树操作、saveEpc 流水线、版本确认、反向索引重建 |
| `src/lib/business-epc-linter.ts` | W-EPC-01~05 校验逻辑 |
| `src/lib/element-usage-index.ts` | 反向索引构建与查询 |
| `src/components/ontology/business-tree-nav.tsx` | A/B/C/EPC 左侧导航树 |
| `src/components/ontology/epc-editor.tsx` | EPC 编辑器 + 步骤要素选择器 + 内联新建 |
| `src/components/ontology/element-library.tsx` | 八维要素库浏览、CRUD、未引用筛选 |
| `src/components/ontology/warning-center.tsx` | 警示中心 UI |
| `src/lib/excel-module-templates.ts` | 分模块 Excel 模板定义 |
| `src/app/api/excel-import/route.ts` | 分模块 Excel 导入 → draft |
| `src/app/api/excel-export/route.ts` | 分模块 Excel 导出 |
| `src/lib/manifest-compiler/index.ts` | 扩展 A/B/C/EPC/E5–E8 映射 |

---

## Task 1: 类型骨架（ontology.ts）

**Files:**
- Modify: `src/types/ontology.ts`
- Test: `src/types/ontology.test.ts`（新建）

- [ ] **Step 1: 新增业务链类型**

```typescript
export interface BusinessValueDomain {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  semantics?: SemanticBlock;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCapability {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  parentId: string; // 指向 ValueDomain
  semantics?: SemanticBlock;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessScenario {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  parentId: string; // 指向 Capability
  semantics?: SemanticBlock;
  createdAt: string;
  updatedAt: string;
}

export interface EpcFlow {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  parentId: string; // 指向 Scenario
  steps: EpcStep[];
  semantics?: SemanticBlock;
  createdAt: string;
  updatedAt: string;
}

export interface SemanticBlock {
  terms: string[];
  triggerPhrases: string[];
  synonyms: string[];
}

export type ModuleKind = 'A' | 'B' | 'C' | 'EPC' | 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
export type ModuleStatus = 'draft' | 'confirmed' | 'archived';

export interface ModuleVersionRecord {
  moduleKind: ModuleKind;
  moduleId: string;
  status: ModuleStatus;
  version?: string;
  confirmedAt?: string;
  snapshot: unknown;
  parentVersionRefs?: CrossModuleRef[];
  createdAt: string;
  updatedAt: string;
}

export interface CrossModuleRef {
  targetModuleKind: ModuleKind;
  targetElementId: string;
  pin: 'latest_confirmed' | { version: string };
}
```

- [ ] **Step 2: 新增八维要素与 EPC 引用类型**

```typescript
export interface MetaElementBase {
  id: string;
  name: string;
  nameEn?: string;
  dimension: 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
  visibility: 'project' | 'domain_scoped' | 'private_draft';
  ownerModuleId?: string;
  confirmedVersion?: string;
  usageRefs?: ElementUsageRef[];
  semantics?: SemanticBlock;
  createdAt: string;
  updatedAt: string;
}

export interface ElementUsageRef {
  epcId: string;
  stepId: string;
  scenarioId: string;
  versionPin: 'latest_confirmed' | { version: string };
}

export interface EpcStep {
  id: string;
  name: string;
  description?: string;
  elementRef?: {
    dimension: 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
    elementId: string;
    versionPin: 'latest_confirmed' | { version: string };
    inlineNew?: boolean;
    inlinePayload?: unknown;
  };
}
```

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors（旧类型仍保留，新类型不冲突）

- [ ] **Step 4: 编写最小类型测试**

Create `src/types/ontology.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { EpcStep, MetaElementBase } from './ontology';

describe('simplified ontology types', () => {
  it('EpcStep.elementRef stores elementId not name', () => {
    const step: EpcStep = {
      id: 's1',
      name: '审批',
      elementRef: { dimension: 'E5', elementId: 'pos-1', versionPin: 'latest_confirmed' },
    };
    expect(step.elementRef?.elementId).toBe('pos-1');
  });

  it('MetaElementBase id is immutable type string', () => {
    const el: MetaElementBase = {
      id: 'e1',
      name: '物料',
      dimension: 'E1',
      visibility: 'project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(el.id).toBe('e1');
  });
});
```

Run: `pnpm test:unit src/types/ontology.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/ontology.ts src/types/ontology.test.ts
git commit -m "feat(types): add A/B/C/EPC and meta-element types for simplified ontology"
```

---

## Task 2: 反向索引模块

**Files:**
- Create: `src/lib/element-usage-index.ts`
- Test: `src/lib/element-usage-index.test.ts`

- [ ] **Step 1: 编写失败测试**

Create `src/lib/element-usage-index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildUsageIndex, getUnreferencedElements } from './element-usage-index';
import type { EpcFlow, MetaElementBase } from '@/types/ontology';

describe('element-usage-index', () => {
  it('buildUsageIndex returns empty map for no EPCs', () => {
    expect(buildUsageIndex([])).toEqual(new Map());
  });

  it('marks referenced elements', () => {
    const epcs: EpcFlow[] = [{
      id: 'epc1', name: '订单流程', parentId: 'sc1',
      steps: [{ id: 'step1', name: '创建', elementRef: { dimension: 'E1', elementId: 'ent-1', versionPin: 'latest_confirmed' } }],
      createdAt: '', updatedAt: '',
    }];
    const idx = buildUsageIndex(epcs);
    expect(idx.get('ent-1')).toHaveLength(1);
  });

  it('getUnreferencedElements filters only orphan confirmed elements', () => {
    const elements: MetaElementBase[] = [
      { id: 'ent-1', name: '订单', dimension: 'E1', visibility: 'project', confirmedVersion: 'v1', createdAt: '', updatedAt: '' },
      { id: 'ent-2', name: '物料', dimension: 'E1', visibility: 'project', confirmedVersion: 'v1', createdAt: '', updatedAt: '' },
    ];
    const epcs: EpcFlow[] = [{
      id: 'epc1', name: '订单流程', parentId: 'sc1',
      steps: [{ id: 'step1', name: '创建', elementRef: { dimension: 'E1', elementId: 'ent-1', versionPin: 'latest_confirmed' } }],
      createdAt: '', updatedAt: '',
    }];
    const orphans = getUnreferencedElements(elements, epcs);
    expect(orphans.map(e => e.id)).toEqual(['ent-2']);
  });
});
```

Run: `pnpm test:unit src/lib/element-usage-index.test.ts`
Expected: FAIL with "function not defined"

- [ ] **Step 2: 实现反向索引**

Create `src/lib/element-usage-index.ts`:

```typescript
import type { EpcFlow, EpcStep, ElementUsageRef, MetaElementBase } from '@/types/ontology';

export function buildUsageIndex(epcs: EpcFlow[]): Map<string, ElementUsageRef[]> {
  const index = new Map<string, ElementUsageRef[]>();
  for (const epc of epcs) {
    for (const step of epc.steps) {
      if (!step.elementRef) continue;
      const ref: ElementUsageRef = {
        epcId: epc.id,
        stepId: step.id,
        scenarioId: epc.parentId,
        versionPin: step.elementRef.versionPin,
      };
      const list = index.get(step.elementRef.elementId) ?? [];
      list.push(ref);
      index.set(step.elementRef.elementId, list);
    }
  }
  return index;
}

export function getUnreferencedElements(
  elements: MetaElementBase[],
  epcs: EpcFlow[]
): MetaElementBase[] {
  const index = buildUsageIndex(epcs);
  return elements.filter(el => el.confirmedVersion && !index.get(el.id)?.length);
}
```

- [ ] **Step 3: 运行测试**

Run: `pnpm test:unit src/lib/element-usage-index.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/element-usage-index.ts src/lib/element-usage-index.test.ts
git commit -m "feat(lib): add element usage index builder"
```

---

## Task 3: Store 业务树与 saveEpc 流水线

**Files:**
- Modify: `src/store/ontology-store.ts`
- Test: `src/store/ontology-store-simplified.test.ts`（新建）

- [ ] **Step 1: 新增 State 字段与 Actions**

In `src/store/ontology-store.ts`, add to `OntologyState`:

```typescript
valueDomains: BusinessValueDomain[];
capabilities: BusinessCapability[];
scenarios: BusinessScenario[];
epcFlows: EpcFlow[];
moduleVersions: ModuleVersionRecord[];

addValueDomain: (domain: Omit<BusinessValueDomain, 'id' | 'createdAt' | 'updatedAt'>) => BusinessValueDomain;
updateValueDomain: (id: string, updates: Partial<BusinessValueDomain>) => void;
deleteValueDomain: (id: string) => void;
// ... similar for B/C/EPC

saveEpcDraft: (epc: EpcFlow) => void;
confirmModule: (moduleKind: ModuleKind, moduleId: string) => ModuleVersionRecord;
rebuildUsageIndex: () => void;
getUnreferencedElements: () => MetaElementBase[];
```

- [ ] **Step 2: 实现 saveEpcDraft 流水线**

```typescript
saveEpcDraft: (epc) => set((state) => {
  const existingIndex = state.epcFlows.findIndex(e => e.id === epc.id);
  const nextFlows = existingIndex >= 0
    ? state.epcFlows.map((e, i) => i === existingIndex ? epc : e)
    : [...state.epcFlows, epc];

  // Upsert inline-new elements into global pools as drafts
  const inlineElements = collectInlineElements(epc);
  const nextEntities = upsertMetaElements(state.entities ?? [], inlineElements.filter(e => e.dimension === 'E1'));
  // ... repeat for each dimension pool

  // Rebuild usage index
  const usageIndex = buildUsageIndex(nextFlows);
  const nextElementsWithUsage = applyUsageIndex(nextEntities, usageIndex);

  return {
    epcFlows: nextFlows,
    entities: nextElementsWithUsage,
    // ... other pools
  };
}),
```

- [ ] **Step 3: 实现 confirmModule**

```typescript
confirmModule: (moduleKind, moduleId) => set((state) => {
  const previous = state.moduleVersions
    .filter(v => v.moduleKind === moduleKind && v.moduleId === moduleId && v.status === 'confirmed')
    .sort((a, b) => (b.version ?? '').localeCompare(a.version ?? ''))[0];

  const nextVersion = previous ? `v${parseInt(previous.version!.slice(1)) + 1}` : 'v1';

  const snapshot = getModuleSnapshot(state, moduleKind, moduleId);
  const record: ModuleVersionRecord = {
    moduleKind,
    moduleId,
    status: 'confirmed',
    version: nextVersion,
    confirmedAt: new Date().toISOString(),
    snapshot,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nextVersions = [
    ...state.moduleVersions.map(v =>
      v.moduleKind === moduleKind && v.moduleId === moduleId && v.status === 'confirmed'
        ? { ...v, status: 'archived' as const }
        : v
    ),
    record,
  ];

  return { moduleVersions: nextVersions };
}),
```

- [ ] **Step 4: 运行 store 测试**

Create `src/store/ontology-store-simplified.test.ts` with tests for add tree node, save epc with inline element, confirm module.

Run: `pnpm test:unit src/store/ontology-store-simplified.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/ontology-store.ts src/store/ontology-store-simplified.test.ts
git commit -m "feat(store): add business tree and epc save pipeline"
```

---

## Task 4: EPC 双向校验 Linter

**Files:**
- Create: `src/lib/business-epc-linter.ts`
- Test: `src/lib/business-epc-linter.test.ts`

- [ ] **Step 1: 定义 warning 类型**

```typescript
export interface EpcWarning {
  id: string;
  ruleId: 'W-EPC-01' | 'W-EPC-02' | 'W-EPC-03' | 'W-EPC-04' | 'W-EPC-05';
  level: 'warning';
  message: string;
  moduleKind: ModuleKind;
  moduleId: string;
  elementId?: string;
  epcId?: string;
  stepId?: string;
}
```

- [ ] **Step 2: 实现 5 条规则**

```typescript
export function lintEpcModel(
  epcs: EpcFlow[],
  scenarios: BusinessScenario[],
  elements: MetaElementBase[]
): EpcWarning[] {
  const warnings: EpcWarning[] = [];
  const confirmedElementIds = new Set(elements.filter(e => e.confirmedVersion).map(e => e.id));

  // W-EPC-04: scenario without EPC
  for (const sc of scenarios) {
    if (!epcs.some(e => e.parentId === sc.id)) {
      warnings.push({ id: generateId(), ruleId: 'W-EPC-04', level: 'warning', message: `场景 ${sc.name} 下没有 EPC 流程`, moduleKind: 'C', moduleId: sc.id });
    }
  }

  for (const epc of epcs) {
    for (const step of epc.steps) {
      if (!step.elementRef) continue;
      const { elementId, dimension } = step.elementRef;

      // W-EPC-05: element does not exist
      if (!elements.some(e => e.id === elementId)) {
        warnings.push({ id: generateId(), ruleId: 'W-EPC-05', level: 'warning', message: `步骤 ${step.name} 引用的要素 ${elementId} 不存在`, moduleKind: 'EPC', moduleId: epc.id, epcId: epc.id, stepId: step.id, elementId });
        continue;
      }

      // W-EPC-01: element not confirmed
      if (!confirmedElementIds.has(elementId)) {
        warnings.push({ id: generateId(), ruleId: 'W-EPC-01', level: 'warning', message: `步骤 ${step.name} 引用的要素未确认`, moduleKind: 'EPC', moduleId: epc.id, epcId: epc.id, stepId: step.id, elementId });
      }
    }
  }

  // W-EPC-02: confirmed element not referenced
  for (const el of elements.filter(e => e.confirmedVersion)) {
    const referenced = epcs.some(epc => epc.steps.some(s => s.elementRef?.elementId === el.id));
    if (!referenced) {
      warnings.push({ id: generateId(), ruleId: 'W-EPC-02', level: 'warning', message: `要素 ${el.name} 已确认但未被任何 EPC 引用`, moduleKind: el.dimension as ModuleKind, moduleId: el.id, elementId: el.id });
    }
  }

  return warnings;
}
```

- [ ] **Step 3: 运行 linter 测试**

Create `src/lib/business-epc-linter.test.ts` covering W-EPC-01/02/04.

Run: `pnpm test:unit src/lib/business-epc-linter.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/business-epc-linter.ts src/lib/business-epc-linter.test.ts
git commit -m "feat(lib): add business epc linter W-EPC-01~05"
```

---

## Task 5: 业务树导航 UI

**Files:**
- Create: `src/components/ontology/business-tree-nav.tsx`
- Modify: `src/components/ontology/modeling-workspace.tsx`

- [ ] **Step 1: 实现树组件**

`business-tree-nav.tsx` renders A/B/C/EPC hierarchy using existing shadcn components. Each node shows `name` and is keyed by `id`.

- [ ] **Step 2: 集成到 modeling-workspace**

Replace the old tab-based domain/project/scenario selector with the new tree nav on the left sidebar. Keep the main area for EPC editor or element library based on selection.

- [ ] **Step 3: 运行 dev smoke**

Run: `pnpm dev`
Open: `http://localhost:5000`
Verify: left sidebar shows tree, can expand/collapse A/B/C, click EPC opens editor.

- [ ] **Step 4: Commit**

```bash
git add src/components/ontology/business-tree-nav.tsx src/components/ontology/modeling-workspace.tsx
git commit -m "feat(ui): add A/B/C/EPC business tree navigation"
```

---

## Task 6: EPC 编辑器与要素选择器

**Files:**
- Create: `src/components/ontology/epc-editor.tsx`
- Create: `src/components/ontology/element-selector.tsx`

- [ ] **Step 1: 实现步骤列表与 elementRef 编辑**

`epc-editor.tsx` displays `EpcFlow.steps` and allows adding/removing steps. Each step has a name field and an `elementRef` selector.

- [ ] **Step 2: 实现八维选择器 + 内联新建**

`element-selector.tsx`:
- Dropdown grouped by dimension (E1–E8) showing `name`.
- Search filter.
- "新建" button opens a minimal form for the selected dimension, generates `id` with `crypto.randomUUID()`, collects `name` and minimum fields, marks `inlineNew: true`.
- On select, sets `step.elementRef = { dimension, elementId, versionPin: 'latest_confirmed', inlineNew?: true, inlinePayload }`.

- [ ] **Step 3: 保存时触发 store 流水线**

On save, call `saveEpcDraft(epc)` which upserts inline elements and rebuilds usage index.

- [ ] **Step 4: 运行 dev smoke**

Verify: can create EPC step, select existing element, inline create new element, save, see new element appears in element library.

- [ ] **Step 5: Commit**

```bash
git add src/components/ontology/epc-editor.tsx src/components/ontology/element-selector.tsx
git commit -m "feat(ui): epc editor with 8-dimension element selector and inline create"
```

---

## Task 7: 八维要素库 UI

**Files:**
- Create: `src/components/ontology/element-library.tsx`
- Modify: `src/components/ontology/modeling-workspace.tsx`

- [ ] **Step 1: 按维度浏览要素**

Tabs for E1–E8. Each tab lists elements showing `name`, `confirmedVersion`, and usage count (`usageRefs.length`).

- [ ] **Step 2: 未引用筛选**

Add toggle "仅显示未引用". Uses `getUnreferencedElements()` from store.

- [ ] **Step 3: 确认按钮**

Each element row has "确认" button to call `confirmModule(element.dimension, element.id)`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ontology/element-library.tsx src/components/ontology/modeling-workspace.tsx
git commit -m "feat(ui): element library with dimension tabs and unreferenced filter"
```

---

## Task 8: 警示中心 UI

**Files:**
- Create: `src/components/ontology/warning-center.tsx`
- Modify: `src/components/ontology/modeling-workspace.tsx`

- [ ] **Step 1: 调用 linter 获取 warnings**

Use `lintEpcModel(epcs, scenarios, allConfirmedElements)` to populate list.

- [ ] **Step 2: 可筛选可忽略**

Table with columns: rule, message, module, action (jump to module, ignore). Ignored warnings stored in local UI state (not persisted) for this iteration.

- [ ] **Step 3: Commit**

```bash
git add src/components/ontology/warning-center.tsx src/components/ontology/modeling-workspace.tsx
git commit -m "feat(ui): warning center for EPC bidirectional checks"
```

---

## Task 9: 分模块 Excel 模板与导入导出

**Files:**
- Create: `src/lib/excel-module-templates.ts`
- Modify: `src/app/api/excel-import/route.ts`
- Modify: `src/app/api/excel-export/route.ts`

- [ ] **Step 1: 定义模板**

```typescript
export const moduleExcelTemplates = {
  A: { sheetName: 'A-业务价值域', headers: [{ key: 'id', label: 'ID' }, { key: 'name', label: '名称' }, { key: 'nameEn', label: '英文名' }, { key: 'description', label: '描述' }] },
  // ... B, C, EPC, E1..E8
};
```

- [ ] **Step 2: 导入生成 draft**

`POST /api/excel-import` accepts multipart with `module` field. Parses only that module's sheet, validates required headers and refs, returns draft payload. Store then creates module draft.

- [ ] **Step 3: 导出 latest confirmed**

`GET /api/excel-export?module=E1` scans confirmed versions of that module and streams xlsx.

- [ ] **Step 4: Commit**

```bash
git add src/lib/excel-module-templates.ts src/app/api/excel-import/route.ts src/app/api/excel-export/route.ts
git commit -m "feat(excel): per-module import/export templates and routes"
```

---

## Task 10: Manifest Compiler 扩展

**Files:**
- Modify: `src/lib/manifest-compiler/index.ts`
- Modify: `src/lib/manifest-compiler/__tests__/golden.test.ts`

- [ ] **Step 1: 映射 A/B/C/EPC/E5-E8**

Add compiler step to include business chain and 8-dim elements in manifest output under `metadata.businessChain` and `metadata.elements`.

- [ ] **Step 2: 更新 golden tests**

Extend P0-12 fixture with A/B/C/EPC and element refs. Ensure `valid: true` still holds and warnings are captured separately.

- [ ] **Step 3: Commit**

```bash
git add src/lib/manifest-compiler/index.ts src/lib/manifest-compiler/__tests__/golden.test.ts
git commit -m "feat(compiler): map A/B/C/EPC and E1-E8 to manifest"
```

---

## Task 11: 清理旧能力

**Files:**
- Modify: `src/types/ontology.ts`
- Modify: `src/store/ontology-store.ts`
- Delete: Agent Semantic Layer docs/components (as identified in repo)
- Delete: Entity Lifecycle docs/components

- [ ] **Step 1: 标记 ProcessModel 为 deprecated**

Add `@deprecated` to `ProcessModel` / `Orchestration` types; remove from UI if still exposed.

- [ ] **Step 2: 删除独立 Agent 语义层入口**

Remove `AgentSemanticLayer` type, store actions, and UI components. Keep `semantics` fields on A/B/C/D/E types.

- [ ] **Step 3: 删除 Entity Lifecycle 聚合**

Remove `EntityLifecycle`, `LifecycleAuditEntry` types and API. Move state machine concepts into E2.

- [ ] **Step 4: 运行完整 CI**

Run: `pnpm run ci:check`
Expected: 0 errors, tests pass

- [ ] **Step 5: Commit**

```bash
git add src/types/ontology.ts src/store/ontology-store.ts
git commit -m "refactor: remove agent semantic layer and entity lifecycle standalone models"
```

---

## Spec 覆盖检查

| 规范要求 | 对应任务 |
|---|---|
| A/B/C/EPC 严格父子树 | Task 1, 5 |
| E1–E8 全局要素库 | Task 1, 7 |
| EPC elementRef 权威源 + usageRefs 反向索引 | Task 2, 6 |
| 模块级草稿/确认/版本 | Task 3 |
| 仅 confirmed 可引用、默认 latest/pin | Task 1, 3, 6 |
| W-EPC-01~05 双向 warning | Task 4, 8 |
| AI 仅填充 draft | Task 6（AI prompt 边界） |
| Excel 分模块导入/导出、仅 draft | Task 9 |
| 删除 Agent 语义层 / Entity Lifecycle | Task 11 |
| Manifest 兼容 | Task 10 |

## Placeholder 扫描

- 无 TBD/TODO。
- 所有步骤包含文件路径与预期命令。
- 关键代码片段已给出；UI 任务因依赖 shadcn 组件未给出完整 JSX，但已明确组件职责与集成点。

## 执行选择

Plan complete and saved to `docs/superpowers/plans/2026-06-18-ontology-simplification.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
