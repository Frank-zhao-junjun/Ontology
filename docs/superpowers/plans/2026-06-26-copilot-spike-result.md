# CopilotKit Spike Result — 2026-06-26

## Summary

Phase 0 spike for CopilotKit integration in the Ontology modeling workspace.

## Dependencies

- `@copilotkit/react-core` ^1.61.2 — installed
- `@copilotkit/react-ui` ^1.61.2 — installed

## React 19 Compatibility

**Partial pass.** CopilotKit Sidebar renders inside `ModelingWorkspace` without blocking the main UI. Some CopilotKit internals may emit warnings under React 19; no white-screen or crash observed in dev smoke. Full chat round-trip depends on Runtime adapter (see below).

## Runtime

- `GET/POST /api/copilotkit` — CopilotKit Runtime（`@copilotkit/runtime`）+ `createCozeServiceAdapter`（豆包 `doubao-seed-2-0-pro-260215` via `coze-coding-dev-sdk`）
- 不再依赖外网 `api.copilotkit.ai` 代理；鉴权头经 `HeaderUtils.extractForwardHeaders` 透传

## UI Integration

- `ModelingCopilotPanel` mounted in `modeling-workspace.tsx` (right column, resizable)
- `ModelingCopilotActions` registers read-only `getProjectSummary` action
- Footer draft hint: 「所有写入均为草稿，请在左侧确认」

## Automated Tests (Phase 0)

| TC | Status |
|----|--------|
| TC-P0-01 | Panel `data-testid` visible |
| TC-P0-02 | Footer draft hint |
| TC-P0-03 | GET route health |
| TC-P0-04 | `buildProjectSummary` / `runGetProjectSummary` |

## Blockers / Follow-ups

1. Manual TC-P0-SPIKE: send test message in browser, confirm assistant reply or explicit API error
2. Tool auto-invoke 依赖豆包 function calling；当前通过 system prompt 注入 Action 目录
