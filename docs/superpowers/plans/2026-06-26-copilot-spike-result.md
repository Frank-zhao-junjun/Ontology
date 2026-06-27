# CopilotKit Spike Result — 2026-06-26

## Summary

Phase 0 spike for CopilotKit integration in the Ontology modeling workspace.

## Dependencies

- `@copilotkit/react-core` ^1.61.2 — installed
- `@copilotkit/react-ui` ^1.61.2 — installed

## React 19 Compatibility

**Partial pass.** CopilotKit Sidebar renders inside `ModelingWorkspace` without blocking the main UI. Some CopilotKit internals may emit warnings under React 19; no white-screen or crash observed in dev smoke. Full chat round-trip depends on Runtime adapter (see below).

## Runtime

- `GET /api/copilotkit` — health check returns `{ status: 'ok', service: 'copilotkit' }` (TC-P0-03)
- `POST /api/copilotkit` — proxies to `COPILOTKIT_RUNTIME` (default `https://api.copilotkit.ai`); **may need coze-coding-dev-sdk adapter** for production LLM routing

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

1. Wire POST runtime to coze-coding-dev-sdk if CopilotKit cloud proxy is insufficient
2. Manual TC-P0-SPIKE: send test message in browser, confirm assistant reply or explicit API error
3. Phase 1: incremental modeling actions + system prompt
