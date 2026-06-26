# Sprint Consolidation — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Implement 3 consolidation/polish features in parallel for Project 1 (Ontology)

**Architecture:** Three independent workstreams — (A) test infrastructure, (B) UI resilience + code health, (C) new code quality gate. All can execute in parallel, with (A) having a slight priority since its output feeds (C).

**Tech Stack:** Next.js + Vitest + Zustand + shadcn/ui + MSW (for API mocking)

**Location:** `D:\AI\Ontology`

---

## Workstream A: 测试基础设施修复

### Task A1: 修正 globals.css 重复规则

**Objective:** Merge duplicate body rules and keyframes in globals.css (quick structural cleanup)

**Files:**
- Modify: `src/app/globals.css`

**Step 1:** Read current globals.css to find the duplicates

**Step 2:** Merge duplicate `body` rules (lines 127-138 area) and `flow-line`/`data-flow` keyframes into single definitions

**Step 3:** Run `npx tsc --noEmit && pnpm lint` — verify no errors

**Step 4:** Commit
```bash
git add src/app/globals.css
git commit -m "chore(css): merge duplicate body rules and keyframes"
```

---

### Task A2: 修正 vitest.config.ts coverage include

**Objective:** Add `src/components/**`, `src/hooks/**`, `src/app/api/**` to coverage.include so coverage reports are meaningful

**Files:**
- Modify: `vitest.config.ts` (project root)

**Step 1:** Read vitest.config.ts to understand current coverage config structure

**Step 2:** Update `coverage.include` to include components, hooks, and API routes

```ts
// Expected shape — add these to coverage.include:
include: [
  'src/lib/**',
  'src/store/**',
  'src/app/api/**',
  'src/components/**',
  'src/hooks/**',
],
```

**Step 3:** Run baseline: `npx vitest run --coverage` — record the baseline percentage

**Step 4:** Add `coverage.thresholds` — set to current baseline -5% as initial threshold (to allow a small tolerance window while we build coverage)

**Step 5:** Run `npx vitest run --coverage` — verify thresholds pass

**Step 6:** Commit
```bash
git add vitest.config.ts
git commit -m "fix(test): expand coverage include to components/hooks/API routes"
```

---

### Task A3: 更新 TODO.md 覆盖率追踪

**Objective:** Update TODO.md Q-T3 item with actual coverage baseline and per-area breakdown

**Files:**
- Modify: `docs/TODO.md`

**Step 1:** Read TODO.md to see current Q-T3 format

**Step 2:** Update Q-T3 entry to show:
- Current baseline (from Task A2)
- Target: 80%
- Per-area breakdown (lib, store, components, API, etc.)
- Gap analysis: biggest uncovered areas sorted by code size

**Step 3:** Commit
```bash
git add docs/TODO.md
git commit -m "docs: update TODO.md with coverage baseline"
```

---

## Workstream B: UI 韧性 + 代码健康

### Task B1: 创建全局 Error Boundary

**Objective:** Prevent white-screen crashes with App Router error.tsx and not-found.tsx

**Files:**
- Create: `src/app/tool/[id]/error.tsx`
- Create: `src/app/not-found.tsx`

**Step 1:** Create `src/app/tool/[id]/error.tsx`:
```tsx
'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ToolError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">出了点问题</h1>
      <p className="text-muted-foreground text-center max-w-md">
        建模工作台遇到了一个意外错误。请重试或返回首页。
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          <RefreshCw className="mr-2 h-4 w-4" />
          重试
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

**Step 2:** Create `src/app/not-found.tsx`:
```tsx
import { Button } from '@/components/ui/button';
import { Home, SearchX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">页面未找到</h1>
      <p className="text-muted-foreground text-center max-w-md">
        您访问的页面不存在或已被移除。
      </p>
      <Button asChild variant="default">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          返回首页
        </Link>
      </Button>
    </div>
  );
}
```

**Step 3:** Run `npx tsc --noEmit` — verify 0 errors

**Step 4:** Verify by checking the error page renders correctly. Since we can't easily trigger an error, at minimum verify:
```bash
grep -c "error.tsx" src/app/tool/\[id\]/error.tsx  # should return 1
```

**Step 5:** Commit
```bash
git add src/app/tool/\[id\]/error.tsx src/app/not-found.tsx
git commit -m "feat(ui): add global ErrorBoundary and 404 pages"
```

---

### Task B2: 创建 loading.tsx 骨架屏

**Objective:** Add route-level skeleton loading for the tool workspace

**Files:**
- Create: `src/app/tool/[id]/loading.tsx`

**Step 1:** Create loading.tsx:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ToolLoading() {
  return (
    <div className="flex h-screen gap-4 p-4">
      {/* Sidebar skeleton */}
      <div className="w-64 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
```

**Step 2:** Run `npx tsc --noEmit` — verify 0 errors

**Step 3:** Commit
```bash
git add src/app/tool/\[id\]/loading.tsx
git commit -m "feat(ui): add skeleton loading for tool workspace"
```

---

### Task B3: 统一 generateId

**Objective:** Create a single `generateId()` utility and replace all 13+ duplicated definitions

**Files:**
- Create: `src/lib/id.ts`
- Modify: all files with inline `generateId` definitions

**Step 1:** Create `src/lib/id.ts`:
```ts
/**
 * Generate a unique identifier.
 * Uses crypto.randomUUID() in browser environments.
 * Falls back to Math.random() for SSR compatibility.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a prefixed unique identifier for context-specific entities.
 * @param prefix - Short prefix string (e.g., 'epc', 'step')
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${generateId()}`;
}
```

**Step 2:** Find all inline generateId definitions across the codebase.

Files known to have them (from audit): behavior-model-editor.tsx, business-chain-detail.tsx, e1-entity-panel.tsx, event-model-editor.tsx, data-model-editor.tsx, manual-generator.tsx, metadata-manager.tsx, masterdata-manager.tsx, metrics-editor.tsx, rule-model-editor.tsx, record-factory.ts, store/ontology-store.ts, ontology-layer-defaults.ts

For each, replace the inline:
```ts
// BEFORE:
const generateId = () => Math.random().toString(36).substring(2, 10);
// or
const generateId = () => Math.random().toString(36).substring(2, 15);
// or
const generateId = () => crypto.randomUUID();

// AFTER:
import { generateId } from '@/lib/id';
```

Also replace any direct usages of `Math.random().toString(36).substring(...)` inline patterns.

**Step 3:** For epc-generator/index.ts — rename its `generateId(prefix)` to use the new `generatePrefixedId`:
```ts
// BEFORE:
function generateId(prefix: string): string { ... }

// AFTER:
import { generatePrefixedId } from '@/lib/id';
// replace calls to generateId('xxx') with generatePrefixedId('xxx')
```

**Step 4:** Run `npx tsc --noEmit` — verify 0 errors

**Step 5:** Run `pnpm run ci:check` — verify all tests pass

**Step 6:** Verify no remaining inline definitions:
```bash
grep -rn "const generateId\|function generateId\|generateId = ()" src/ --include="*.ts" --include="*.tsx" | grep -v "src/lib/id.ts"
```
Expected: empty output

**Step 7:** Commit
```bash
git add src/lib/id.ts [all modified files]
git commit -m "refactor: unify generateId into src/lib/id.ts"
```

---

## Workstream C: 新代码质量门禁

### Task C1: MSW 测试基础设施

**Objective:** Set up MSW (Mock Service Worker) for API route mocking in tests

**Files:**
- Create: `src/test/mocks/handlers.ts`
- Create: `src/test/mocks/server.ts`
- Modify: `vitest.config.ts` (setup files)

**Step 1:** Check if MSW is installed:
```bash
grep -c "msw" package.json
```

**Step 2:** If not installed:
```bash
pnpm add -D msw
```

**Step 3:** Create `src/test/mocks/handlers.ts`:
```ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // HR Sync routes
  http.get('/api/hr-sync/config', () =>
    HttpResponse.json({ enabled: true, syncInterval: 3600 })
  ),
  http.post('/api/hr-sync/trigger', () =>
    HttpResponse.json({ status: 'started', jobId: 'mock-job-001' })
  ),
  http.get('/api/hr-sync/history', () =>
    HttpResponse.json({
      records: [
        { id: 'h1', timestamp: '2026-06-26T10:00:00Z', status: 'success', recordsSynced: 42 },
        { id: 'h2', timestamp: '2026-06-25T10:00:00Z', status: 'failed', error: 'Connection timeout' },
      ],
    })
  ),
  http.post('/api/hr-sync/resolve', () =>
    HttpResponse.json({ status: 'resolved' })
  ),

  // Agent Skills routes
  http.get('/api/agent/skills', () =>
    HttpResponse.json({
      skills: [
        { id: 'sk-1', name: 'DataModel Query', enabled: true },
        { id: 'sk-2', name: 'EPC Linter', enabled: true },
        { id: 'sk-3', name: 'Document Generator', enabled: false },
      ],
    })
  ),
  http.post('/api/agent/skills', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ id: 'sk-new', ...body, enabled: true }, { status: 201 });
  }),
  http.delete('/api/agent/skills/:id', () =>
    new HttpResponse(null, { status: 204 })
  ),

  // Excel import
  http.post('/api/excel-import', () =>
    HttpResponse.json({
      status: 'success',
      imported: { entities: 15, relations: 8 },
    })
  ),
];
```

**Step 4:** Create `src/test/mocks/server.ts`:
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Step 5:** Configure vitest setup to use MSW server:
- Create or modify `src/test/setup.ts` (or equivalent) to:
```ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Step 6:** Ensure vitest.config.ts has the setup file referenced:
```ts
test: {
  setupFiles: ['./src/test/setup.ts'],  // or wherever setup.ts is
  // ... existing config
}
```

**Step 7:** Run `npx tsc --noEmit` — verify 0 errors

**Step 8:** Commit
```bash
git add src/test/mocks/ package.json
git commit -m "test: add MSW infrastructure for API mocking"
```

---

### Task C2: HR Sync 集成测试

**Objective:** Write integration tests for HR sync manager component and API routes

**Files:**
- Create: `tests/integration/hr-sync-manager.spec.tsx`
- Create: (if API route unit tests) `tests/unit/api/hr-sync.test.ts`

**Step 1:** Create HR Sync manager component test:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HrSyncManager } from '@/components/ontology/hr-sync-manager';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('HrSyncManager', () => {
  it('renders sync config on load', async () => {
    render(<HrSyncManager />);
    await waitFor(() => {
      expect(screen.getByText(/同步已启用/i)).toBeInTheDocument();
    });
  });

  it('shows sync history list', async () => {
    render(<HrSyncManager />);
    await waitFor(() => {
      expect(screen.getByText(/2026-06-26/i)).toBeInTheDocument();
      expect(screen.getByText(/失败/i)).toBeInTheDocument();
    });
  });

  it('handles trigger sync button click', async () => {
    render(<HrSyncManager />);
    const triggerBtn = await screen.findByRole('button', { name: /触发同步/i });
    await userEvent.click(triggerBtn);
    await waitFor(() => {
      expect(screen.getByText(/同步已启动/i)).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/api/hr-sync/config', () => HttpResponse.error())
    );
    render(<HrSyncManager />);
    await waitFor(() => {
      expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2:** Run the tests:
```bash
npx vitest run tests/integration/hr-sync-manager.spec.tsx -v
```

**Step 3:** Fix any issues, verify all tests pass

**Step 4:** Commit
```bash
git add tests/integration/hr-sync-manager.spec.tsx
git commit -m "test: add HR sync manager integration tests"
```

---

### Task C3: Agent Skills 测试

**Objective:** Write tests for Agent Skills manager

**Files:**
- Create: `tests/integration/agent-skills-manager.spec.tsx`

**Step 1:** Create Agent Skills manager test:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentSkillsManager } from '@/components/ontology/agent-skills-manager';

describe('AgentSkillsManager', () => {
  it('renders skill list on load', async () => {
    render(<AgentSkillsManager />);
    await waitFor(() => {
      expect(screen.getByText(/DataModel Query/i)).toBeInTheDocument();
      expect(screen.getByText(/EPC Linter/i)).toBeInTheDocument();
    });
  });

  it('allows filtering skills by name', async () => {
    render(<AgentSkillsManager />);
    await waitFor(() => {
      expect(screen.getByText(/DataModel Query/i)).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/搜索/i);
    await userEvent.type(searchInput, 'EPC');
    await waitFor(() => {
      expect(screen.queryByText(/DataModel Query/i)).not.toBeInTheDocument();
      expect(screen.getByText(/EPC Linter/i)).toBeInTheDocument();
    });
  });

  it('allows enabling/disabling a skill', async () => {
    render(<AgentSkillsManager />);
    const toggleBtn = await screen.findByRole('button', { name: /启用.*技能/i });
    await userEvent.click(toggleBtn);
    await waitFor(() => {
      expect(screen.getByText(/已更新/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2:** Run the tests:
```bash
npx vitest run tests/integration/agent-skills-manager.spec.tsx -v
```

**Step 3:** Fix any issues, verify all tests pass

**Step 4:** Commit
```bash
git add tests/integration/agent-skills-manager.spec.tsx
git commit -m "test: add agent skills manager integration tests"
```

---

### Task C4: Markdown 导入核心函数测试

**Objective:** Unit tests for the Markdown import pure function

**Files:**
- Create: `tests/unit/markdown-import.spec.ts`

**Step 1:** Read `src/lib/markdown/markdown-import.ts` to understand the API surface

**Step 2:** Create unit tests covering:
- Basic markdown parsing
- Edge cases: empty input, malformed markdown
- Import with different heading levels
- Import with code blocks / tables
- Error handling for invalid formats

**Step 3:** Run the tests:
```bash
npx vitest run tests/unit/markdown-import.spec.ts -v
```

**Step 4:** Verify all tests pass

**Step 5:** Commit
```bash
git add tests/unit/markdown-import.spec.ts
git commit -m "test: add markdown import unit tests"
```

---

### Task C5: Excel 导入/导出 API 路由测试

**Objective:** Unit tests for the Excel import API route

**Files:**
- Create: `tests/unit/api/excel-import.test.ts` (or in existing test structure)

**Step 1:** Create API route tests:
```ts
// For Next.js App Router API routes, test the request handling
describe('POST /api/excel-import', () => {
  it('accepts valid FormData with expected fields', async () => {
    // ... test request validation
  });

  it('returns 400 for missing required fields', async () => {
    // ... test error handling
  });

  it('returns 200 with import results on success', async () => {
    // ... test success response
  });
});
```

**Step 2:** Run the tests:
```bash
npx vitest run tests/unit/api/excel-import.test.ts -v
```

**Step 3:** Fix any issues, verify all tests pass

**Step 4:** Commit
```bash
git add tests/unit/api/excel-import.test.ts
git commit -m "test: add excel import API route tests"
```

---

## Final Verification

After all tasks complete:

```bash
# Full type check
npx tsc --noEmit

# Lint check
pnpm lint

# Full test suite
pnpm run ci:check

# Coverage baseline
npx vitest run --coverage

# Verify no remaining inline generateId
grep -rn "const generateId\|function generateId\|generateId = ()" src/ --include="*.ts" --include="*.tsx" | grep -v "src/lib/id.ts"
```

Expected: all green, 0 lint errors, 0 type errors, tests passing, coverage baseline recorded.
