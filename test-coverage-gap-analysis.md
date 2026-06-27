# Test Coverage Gap Analysis — Ontology (D:\AI\Ontology)

**Generated**: 2026-06-27
**Source files**: 253 `.ts`/`.tsx` (excluding `src/test/`, `src/types/`)
**Test files**: 207 total (25 co-located in `src/`, 182 in `tests/`)
**Current test results**: 779 pass, 1 fail (ontology-store-extended.spec.ts)

---

## 1. Cover / Uncovered Modules Table

### 1.1 API Routes (src/app/api/) — ✅ ALL COVERED

| Route | Coverage | Test Location |
|---|---|---|
| `agent/skills/route.ts` | ✅ | Co-located `route.test.ts` |
| `analyze-document-model/route.ts` | ✅ | `tests/unit/analyze-document-model-route.spec.ts` |
| `codegen/route.ts` | ✅ | Co-located `route.test.ts` |
| `copilotkit/route.ts` | ✅ | `tests/unit/copilot/copilotkit-route.spec.ts` |
| `excel-import/route.ts` | ✅ | Co-located `route.test.ts` |
| `excel-template/route.ts` | ✅ | Co-located `route.test.ts` |
| `export/route.ts` | ✅ | Co-located `route.test.ts` |
| `export/xlsx-from-manifest/route.ts` | ✅ | Co-located `route.test.ts` |
| `generate-element-draft/route.ts` | ✅ | Co-located `route.test.ts` |
| `generate-module-draft/route.ts` | ✅ | Co-located `route.test.ts` |
| `hr-sync/*/route.ts` (4 routes) | ✅ | Co-located `route.test.ts` |
| `masterdata/init/route.ts` | ✅ | Co-located `route.test.ts` |
| `metadata/init/route.ts` | ✅ | Co-located `route.test.ts` |
| `projects/route.ts` | ✅ | Co-located `route.test.ts` |
| `projects/[id]/route.ts` | ✅ | Co-located `route.test.ts` |
| `reference-documents/upload/route.ts` | ✅ | Co-located `route.test.ts` |

### 1.2 Store (src/store/)

| File | Lines | Tests? | Risk |
|---|---|---|---|
| `ontology-store.ts` | ~800 | ✅ Unit tests (5 files) | Low |
| `validation.ts` | **369** | ❌ **NONE** | **Critical** |

### 1.3 Lib Core (src/lib/)

| File | Lines | Tests? | Risk |
|---|---|---|---|
| `agent-integration.ts` | ~60 | ❌ NONE | **High** |
| `business-scenario.ts` | ~50 | ✅ `business-scenario-management.spec.ts` | Low |
| `entity-role.ts` | **56** | ❌ **NONE** | **High** (imported by validation + normalizer) |
| `id.ts` | ~20 | ✅ (indirectly) | Low |
| `manifest-export.ts` | ~80 | ✅ `manifest-export.spec.ts` | Low |
| `metadata-local.ts` | **104** | ❌ **NONE** | **Medium** (57 metadata field definitions) |
| `ontology-layer-defaults.ts` | **32** | ❌ **NONE** | **Medium** (factory functions for models) |
| `ontology-normalizer.ts` | **129** | ❌ **NONE** | **High** |
| `ontology-validator.ts` | ~200 | ✅ Co-located `__tests__/ontology-validator.test.ts` | Low |
| `utils.ts` | ~15 | ❌ NONE | Low |

### 1.4 Lib Subdirectories

| Subdirectory | Total Files | Uncovered | Coverage Status |
|---|---|---|---|
| `ai-draft/` | 3 | 0 | ✅ Full coverage |
| `business-chain/` | 3 | 1 (`module-status-label.ts`) | ⚠️ Partial |
| `business-epc-linter/` | 2 | 0 | ✅ Full |
| `code-generator/` | 2 | 0 | ✅ Full |
| `configexporter/` | 1 | 0 | ✅ Full |
| `copilot/` | 14 | **4 (`chain-doc-prompt.ts`, `parse-pptx-markitdown.ts`, copilot panel, copilot actions)** | ⚠️ Partial |
| `e1-entity/` | 2 | 0 | ✅ Full |
| `element-library/` | 2 | **1 (`unreferenced.ts`)** | ⚠️ Partial |
| `element-selector/` | 2 | **1 (`constants.ts`)** | ⚠️ Partial |
| `epc-coverage/` | 2 | 0 | ✅ Full |
| `epc-cross-consistency/` | 2 | 0 | ✅ Full |
| `epc-derivation/` | 1 | 0 | ✅ Full |
| `epc-generator/` | 1 | 0 | ✅ Full |
| `epc-pipeline/` | 4 | 0 | ✅ Full |
| `excel/` | 3 | 0 | ✅ Full |
| `gstack/` | 1 | **1 (`workflows.ts`)** | ❌ None |
| `legacy-audit/` | 1 | 0 | ✅ Full |
| `manifest-compiler/` | 17 | **11 uncovered** (events, dataSources, process + 8 mappers) | ⚠️ Low |
| `manifest-validator/` | 5 | **2 uncovered** (`collect-ids.ts`, `utils.ts`) | ⚠️ Partial |
| `markdown/` | 1 | 0 | ✅ Full |
| `masterdata/` | 2 | **2 uncovered** (`field-parser.ts`, `record-factory.ts`) | ❌ None |
| `migration/` | 1 | 0 | ✅ Full |
| `module-version/` | 3 | 0 | ✅ Full |
| `ralph-loop/` | 1 | **1 (`agent-loop.ts`, 354 lines)** | ❌ None |
| `scenario-workspace/` | 1 | 0 | ✅ Full |
| `superpowers/` | 1 | 0 | ✅ Full |

### 1.5 Components

| Directory | Total Files | Uncovered | Notes |
|---|---|---|---|
| `components/landing/` | 12 | **12 (all)** | Marketing pages — low risk |
| `components/ontology/` | 40 | **4** (`data-model-editor.tsx` 1976 lines, `manual-generator.tsx`, `masterdata-manager.tsx`, copilot components) | **High risk** for data-model-editor |
| `components/theme/` | 2 | 2 | Low risk |
| `components/ui/` | 55 | **55 (all)** | Shadcn wrappers — expected |

### 1.6 Infrastructure

| File | Lines | Tests? | Risk |
|---|---|---|---|
| `hooks/use-mobile.ts` | ~10 | ❌ | Low |
| `hooks/use-project-sync.ts` | ~30 | ❌ | Low |
| `hooks/use-confirm.tsx` | ~40 | ❌ | Low |
| `middleware.ts` | ~30 | ❌ | Low |
| `server.ts` | ~50 | ❌ | Low |
| `services/project-service.ts` | **94** | ❌ | **Medium** (API client) |
| `storage/database/supabase-client.ts` | ~40 | ❌ | Low |
| `storage/database/shared/relations.ts` | ~50 | ❌ | Low |
| `storage/database/shared/schema.ts` | ~100 | ❌ | Low |
| App pages (7 files) | — | ❌ | Low (pages, not-logic) |

---

## 2. Top 5 Critical Gaps Ranked by Risk

### 🔴 #1 — `src/store/validation.ts` (369 lines)

**Risk: Critical**
- **What it does**: Core validation engine for the entire ontology data model. Enforces entity-scenario binding, aggregate-root hierarchy, state machine integrity (max 10 states, unique state IDs, single initial state, transition validity), event definition rules (past-tense naming, aggregate-root-only, payload limits), subscription rules (retry policies, event references), and rule definition rules (field validation, cross-field validation, cross-entity constraints).
- **Why it's critical**: Every entity/state machine/event/rule mutation flows through these validators. A bug here corrupts the entire ontology model. The logic is deeply branched with multiple throw paths and complex business rules.
- **Test status**: ZERO tests — not a single unit test exists.
- **Sibling modules that also lack tests**: `entity-role.ts` and `ontology-normalizer.ts` are directly imported.

### 🔴 #2 — `src/components/ontology/data-model-editor.tsx` (1976 lines)

**Risk: Critical**
- **What it does**: The primary data model editing UI. Manages entity CRUD, attribute creation/deletion/reordering, relation management, computed properties, data source mappings, and dialog workflows. This is the most-used editor in the application.
- **Why it's critical**: Largest single component (1976 lines) with complex state management. Zero integration tests despite 40 other ontology components having them. Any regression directly impacts users.
- **Test status**: ZERO tests.
- **Note**: `behavior-model-editor.tsx`, `event-model-editor.tsx`, and `rule-model-editor.tsx` all have integration tests — `data-model-editor` is the glaring gap.

### 🟠 #3 — `src/lib/ralph-loop/agent-loop.ts` (354 lines)

**Risk: High**
- **What it does**: Autonomous AI agent loop implementing the Ralph methodology. Defines UserStory, RalphLoopConfig, RalphLoopState interfaces and the agent loop orchestration logic.
- **Why it's critical**: Orchestrates the agent workflow lifecycle (iteration management, story tracking, error handling). Is a standalone AI agent framework component that could affect downstream agent integrations.
- **Test status**: ZERO tests.

### 🟠 #4 — `src/lib/manifest-compiler/` Uncovered Mappers (11 files)

**Risk: High** (collectively)
- **Uncovered**: `events.ts`, `dataSources.ts`, `process.ts`, `mappers/business-scenarios.ts`, `mappers/domain-events.ts`, `mappers/enums.ts`, `mappers/object-types.ts`, `mappers/side-effects.ts`, `mappers/state-machines.ts`, `mappers/transaction-boundaries.ts`, `mappers/utils.ts`
- **What they do**: Map ontology domain objects to manifest output format. If these are wrong, the entire ontology export/manifest generation is corrupt.
- **Why they're critical**: The compiler is tested at the integration level (`manifest-compiler.spec.ts`, `manifest-compiler-mappers.spec.ts`) but these specific mappers are NOT individually unit-tested. The integration test may mask mapper-specific bugs.
- **Mitigation**: `mappers/actions.ts`, `mappers/metrics.ts`, `mappers/rules.ts`, `manifest-compiler/behavior.ts`, `semantic.ts`, `simplified-chain.ts`, `metadata.ts`, `governance.ts`, `index.ts` all have unit tests — these 11 are the holdouts.

### 🟡 #5 — `src/components/ontology/copilot/` (3 files)

**Risk: Medium-High**
- **Uncovered**: `modeling-copilot-actions.tsx`, `modeling-copilot-panel.tsx`, `copilot-system-prompt.ts`
- **What they do**: Copilot UI panel and action definitions for the AI-assisted modeling workflow.
- **Why it matters**: Copilot is a marquee feature. Integration tests exist for `tests/integration/copilot/` (panel, document-analyze, incremental-modeling, legacy-ai-tooltip) but do NOT directly test these specific components. These tests may cover the sub-components indirectly, but the components themselves lack direct test coverage.
- **Note**: `copilot/actions-registry.ts` and all 11 individual copilot actions DO have unit tests.

---

## 3. Missing Test Types Analysis

| Test Type | Current Count | Gaps |
|---|---|---|
| **Unit tests** | 123 files | 20+ lib files without unit tests (see §1.4) |
| **Integration tests** | 60 files | 4 ontology components untested — notably `data-model-editor` (1976 lines) |
| **E2E tests** | 17 files | Reasonable coverage. Missing: copilot full flow, data-model-editor CRUD, project setup, publication lifecycle |
| **Coverage enforcement** | ❌ None | `vitest --coverage` is configured but never run in CI — no coverage thresholds |
| **Performance tests** | ❌ None | No load/stress tests for API routes or manifest compilation |
| **Visual regression** | ❌ None | No component screenshot tests |
| **API contract tests** | ❌ None | No request/response schema validation tests |

### CI Pipeline Gaps

The CI (`ci.yml`) runs:
1. ✅ Lint
2. ✅ TypeScript check
3. ✅ `test:unit` (tests/unit + src/lib/**)
4. ✅ `test:integration`
5. ✅ `test:e2e:smoke`
6. ✅ `test:phase4` (manifest golden + compiler)

**Missing from CI:**
- ❌ **No coverage reporting** — `test:coverage` script is defined but never called
- ❌ **No `test:phase1`** (business chain + EPC pipeline core tests)
- ❌ **No `test:phase2`** (element library + EPC coverage/derivation)
- ❌ **No `test:phase3`** (EPC linter + Excel + AI draft)
- ❌ **No full e2e run** — only `@smoke` tagged tests run
- ❌ **No parallel test splitting** — all tests run sequentially (slow feedback)
- ❌ **No nightly scheduled run** — all CI is PR/main-push only

---

## 4. Recommended Next Test Targets (with Reasoning)

### Priority 1 (Do First): `src/store/validation.ts` — Unit Tests

**Files to create**: `tests/unit/store-validation.spec.ts` or `tests/unit/validation.spec.ts`
**Reasoning**: The highest-value testing target in the codebase. 369 lines of pure validation logic with 12 exported functions, each with multiple throw-on-failure paths. These are classic "state-based" unit tests that are fast to write and run. The test file already exists for `ontology-store` (5 tests covering it), so the pattern is established.
**Estimated tests needed**: 8-12 test cases covering entity validation, aggregate boundary, state machine rules, event definition rules, subscription rules, rule definition rules, and cascade delete logic.

### Priority 2: `src/lib/ontology-normalizer.ts` + `src/lib/entity-role.ts`

**Files to create**: `tests/unit/ontology-normalizer.spec.ts`, `tests/unit/entity-role.spec.ts`
**Reasoning**: These are stateless pure functions imported by validation.ts and used throughout the app. Entity-role resolution and normalization are foundational to ontology correctness. Small, isolated modules — easy to get to 100% coverage quickly.
**Estimated tests needed**: 6-8 total.

### Priority 3: `src/components/ontology/data-model-editor.tsx` — Integration Test

**Files to create**: `tests/integration/data-model-editor.spec.tsx`
**Reasoning**: 1976-line component with zero tests, while every other major ontology editor (behavior, event, rule) has integration coverage. The test infrastructure (MSW handlers, test helpers, store mocking) is already in place — copy the pattern from `tests/integration/modeling-workspace.spec.tsx`.
**Focus areas**: Entity CRUD, attribute add/edit/delete, relation picking, dialog open/close flows.

### Priority 4: Manifest Compiler Mappers (11 files)

**Files to create**: Extend `tests/unit/manifest-compiler-mappers.spec.ts` to cover the missing mappers
**Reasoning**: The existing `manifest-compiler-mappers.spec.ts` tests actions, metrics, and rules mappers. Simply add test cases for the 8 uncovered mappers. These are mostly pure data-transformation functions with straightforward inputs/outputs.
**Estimated tests needed**: 1-2 test cases per mapper (12-16 total).

### Priority 5: Copilot Components

**Files to create**: `tests/integration/copilot/modeling-copilot-panel.spec.tsx`
**Reasoning**: The copilot integration test (`copilot-panel.spec.tsx`) tests the overall panel behavior but doesn't directly target the action definitions and panel components. Given the copilot is a key feature, direct component tests would catch regressions in the action button rendering and prompt logic.

### Future CI Improvements

1. Add `test:phase1`, `test:phase2`, `test:phase3` to CI to run the staged unit/integration/e2e groups
2. Add `test:coverage` to CI with a minimum threshold (e.g., 60% line coverage, gradually increasing)
3. Add a nightly full e2e run (remove `-t @smoke` filter)
4. Split test execution into parallel jobs for faster feedback

---

## Summary

```
┌──────────────────────────────────────────────────────────┐
│                     COVERAGE OVERVIEW                     │
├──────────────────────────────────────────────────────────┤
│  API Routes     ████████████████████████████████ 100%    │
│  Store Logic    ████████████░░░░░░░░░░░░░░░░░░░░  40%    │
│  Lib Core       ██████████████░░░░░░░░░░░░░░░░░░  50%    │
│  Lib Subs       ████████████████████░░░░░░░░░░░░  75%    │
│  Components     ██████████████████████████░░░░░░  88%    │
│  UI (shadcn)    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%    │
│  Landing        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%    │
└──────────────────────────────────────────────────────────┘
```

**Key Takeaway**: The codebase has strong API route and E2E coverage, but the **core validation/normalization layer** (`store/validation.ts`, `lib/ontology-normalizer.ts`, `lib/entity-role.ts`) is completely uncovered. These modules are the most critical — a bug here corrupts the ontology data. Adding unit tests for these 3 files would be the highest-ROI testing investment.
