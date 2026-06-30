# Next Sprint Plan (2026-06-30)

## 1. Baseline (Code Review + QA)

- `pnpm run ci:check`: pass
- Quality gate status:
  - unit: 1239/1239 pass
  - integration: 298/298 pass
  - e2e smoke: 24 pass / 6 skip
  - phase4: 32/32 pass
- Remaining lint debt: 112 warnings (mostly `no-unused-vars`, plus a few `react-hooks/exhaustive-deps`)

## 2. Pre-sprint fixes completed in this cycle

1. **Type-check blocker fixed**  
   File: `src/test/integration/api.test.ts`  
   Change: replaced fragile `Parameters<typeof it>[1]` with explicit `TestContext` callback type for Vitest v4 compatibility.

2. **Hook dependency risk fixed**  
   File: `src/components/ontology/element-library.tsx`  
   Change: stabilized `setActiveDimension` with `useCallback` and completed effect dependency list to avoid stale-closure behavior.

## 3. Sprint Goal

Increase engineering confidence and delivery velocity by reducing QA debt and raising automated coverage in the current low-coverage areas (API routes + editor helper logic), while keeping `ci:check` green.

## 4. Sprint Scope

### NS-01 (P0): React hook warning cleanup

- Scope:
  - `src/components/ontology/epc-coverage-panel.tsx`
  - `src/components/ontology/epc-validation-panel.tsx`
  - `src/components/ontology/organization-editor.tsx`
- Acceptance criteria:
  - All `react-hooks/exhaustive-deps` warnings in these files are resolved.
  - No behavior regression in related integration/e2e tests.

### NS-02 (P0): API route coverage uplift

- Scope:
  - `src/app/api/analyze-document-model/route.ts`
  - `src/app/api/generate-module-draft/route.ts`
  - `src/app/api/generate-element-draft/route.ts`
- Test targets:
  - invalid payload
  - success path (mocked service)
  - service failure / timeout path
- Acceptance criteria:
  - New unit tests added under `tests/unit/`.
  - Route suites pass and are included in CI.

### NS-03 (P1): Editor helper extraction and unit coverage

- Scope:
  - `data-model-editor` / `behavior-model-editor` / `event-model-editor` helper logic
- Acceptance criteria:
  - pure helper functions extracted from heavy UI components
  - table-driven unit tests added for extracted helpers
  - no user-visible behavior changes

### NS-04 (P1): Lint debt burn-down

- Scope:
  - remove obvious dead imports/vars in high-churn files (`src/components/ontology/**`, `src/lib/**`, `tests/**`)
- Acceptance criteria:
  - warning count reduced from 112 to <= 60
  - no rule disable comments added as shortcut

### NS-05 (P2): Copilot manual QA (CP-01)

- Scope:
  - browser manual test for conversation quality and response time (target <= 8s)
- Acceptance criteria:
  - checklist and observations documented
  - blocking UX/performance defects are converted into actionable issues

## 5. Execution order

1. NS-01
2. NS-02
3. NS-03
4. NS-04
5. NS-05

## 6. QA gates (must stay green)

```bash
pnpm run lint
pnpm run ts-check
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e:smoke
pnpm run ci:check
```

