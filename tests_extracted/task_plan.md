# Task Plan: README、REQUIREMENT 与代码生成器草案整理

## Goal
将 README(NEW).md 合并为正式 README，继续修正 REQUIREMENT.md 中与当前方案不一致的章节，并补充一版可执行的代码生成器目录与接口草案。

## Current Phase
Phase 7

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: README Merge
- [x] Compare README and README(NEW)
- [x] Promote README(NEW) content into formal README.md
- [x] Ensure naming and structure are consistent
- **Status:** complete

### Phase 3: REQUIREMENT Audit
- [x] Review sections beyond 2.3.2 for inconsistencies
- [x] Fix mismatches against current dual-system roadmap
- [x] Keep terminology aligned with README
- **Status:** complete

### Phase 4: Generator Draft
- [x] Draft generator directory layout
- [x] Draft core interfaces and generation flow
- [x] Add the draft to project docs
- **Status:** complete

### Phase 5: Verification & Delivery
- [x] Review modified docs
- [x] Record outcomes in progress.md
- [x] Deliver concise summary to user
- **Status:** complete

### Phase 6: Requirement Formatting Cleanup
- [x] Locate residual pasted-format markers in REQUIREMENT.md
- [x] Rewrite affected sections into formal markdown structure
- [x] Preserve implementation intent while removing chat/paste artifacts
- **Status:** complete

### Phase 7: TDD Test Structure Split
- [x] Split TEST_CASES into unit/integration/e2e test docs
- [x] Provide per-case test file naming map
- [x] Add minimum CI checklist aligned for local and pipeline
- **Status:** complete

## Key Questions
1. Which README should remain as the canonical document after merge?
2. Which REQUIREMENT sections still describe outdated five-model or process-model assumptions?
3. Where should the code generator draft live so it is useful to follow-on implementation?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use README(NEW).md as the source of truth for merge | It is already closer to the current modeling-tool plus runtime-publish direction |
| Rewrite generator design as pipeline-oriented pseudocode | More aligned with versioned publishing than raw string concatenation |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

## Notes
- Keep terminology consistent: four metamodels in modeling tool, generated runtime package on publish.
- Avoid changing unrelated requirements unless they conflict with the current architecture.