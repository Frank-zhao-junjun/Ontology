# Ontology 简化重构 — 交付文档

> **状态（2026-06-18）**：✅ **全部完成** — 14/14 User Story · Phase 0–4 · `ci:check` 全绿  
> 进度详情：[PROGRESS.md](./PROGRESS.md) · 工作日志：[WORKLOG.md](./WORKLOG.md)

本目录承载 [本体建模简化架构计划](../本体建模简化架构.plan.md) 的 **User Story / Unit** 交付物。

## 目录结构

| 路径 | 用途 |
|------|------|
| [`PROGRESS.md`](./PROGRESS.md) | Phase / US 进度追踪与验证证据 |
| [`us/`](./us/) | User Story（**仅 US 需用户确认**） |
| [`units/`](./units/) | Unit Spec（US 确认后自动拆分） |
| [`UNIT_VALIDATION_CHECKLIST.md`](./UNIT_VALIDATION_CHECKLIST.md) | Unit 流水线验证清单 |
| [`WORKLOG.md`](./WORKLOG.md) | 按日期记录的工作日志 |

## 工作流（六步强制 + TDD）

```
US（用户确认）→ ① Unit Spec → ② PRD → ③ Testing case → ④ Coding → ⑤ Unit test → ⑥ E2E
```

**门禁（2026-06-18 起强制执行）**：

| 规则 | 说明 |
|------|------|
| 顺序不可跳步 | 1→2→3→4→5→6，任一步未勾选不得标 Unit「已完成」 |
| TDD | ③ **必须先于** ④（测试骨架可先 failing） |
| E2E | 纯 lib/文档 Unit 须 Spec 写明 `E2E: N/A` |
| 证据 | Spec §7 六行 `[x]` + §8 命令输出 |

- 清单：[`UNIT_VALIDATION_CHECKLIST.md`](./UNIT_VALIDATION_CHECKLIST.md)
- Unit 模板：[`units/_UNIT_SPEC_TEMPLATE.md`](./units/_UNIT_SPEC_TEMPLATE.md)
- 应用代码与测试：`repo-main/`
- 架构准据：[`docs/adr-simplified-ontology-model.md`](../adr-simplified-ontology-model.md)

## 验证（发版前）

```bash
cd repo-main
pnpm run ci:check
```

**最终证据（2026-06-18）**：lint 0 error · ts-check pass · unit 286 · integration 101 · e2e smoke pass

## Phase 4 关键产出（收尾）

| 模块 | 路径 | 说明 |
|------|------|------|
| 遗留审计 | `repo-main/src/lib/legacy-audit/` | 禁止 Agent/Lifecycle API 路由 |
| 场景迁移 | `repo-main/src/lib/migration/business-scenario-to-chain.ts` | `BusinessScenario` → A/B/C |
| Store 迁移 | `ontology-store.migrateLegacyBusinessScenariosToChain()` | 一键迁移 legacy 场景 |
| Compiler | `repo-main/src/lib/manifest-compiler/simplified-chain.ts` | `compileSimplifiedChain` |
| Manifest 扩展 | `metadata.extensions.simplifiedChain` + `epcWarnings` | 不阻断 P0-12 golden |

## 收尾小项（Polish）

| ID | 标题 | 状态 |
|----|------|------|
| [US-P01](./us/US-P01-s03-s04-closeout.md) | S03/S04 收尾抛光 | ✅ 已完成 |

## Phase 0 User Stories ✅

| ID | 标题 | 状态 |
|----|------|------|
| [US-S01](./us/US-S01-adr.md) | ADR 编写 | 已完成 |
| [US-S02](./us/US-S02-type-skeleton.md) | 类型骨架扩展 | 已完成 |

## Phase 1 User Stories ✅

| ID | 标题 | 状态 |
|----|------|------|
| [US-S03](./us/US-S03-module-version-store.md) | 模块版本 store | 已完成 |
| [US-S04](./us/US-S04-business-chain-tree.md) | A/B/C/EPC 树导航 | 已完成 |
| [US-S05](./us/US-S05-save-epc-pipeline.md) | saveEpc + rebuildUsageIndex | 已完成 |

## Phase 1.5 User Stories ✅

| ID | 标题 | 状态 |
|----|------|------|
| [US-S14](./us/US-S14-module-confirm-archive-ui.md) | 模块确认/归档 UI | 已完成 |

## Phase 2 User Stories ✅

| ID | 标题 | 状态 |
|----|------|------|
| [US-S06](./us/US-S06-epc-element-selector.md) | EPC 要素选择器 | 已完成 |
| [US-S07](./us/US-S07-element-library-unreferenced.md) | 要素库未引用视图 | 已完成 |
| [US-S08](./us/US-S08-c-workspace.md) | C 工作区 | 已完成 |

## Phase 3 User Stories ✅

| ID | 标题 | 状态 |
|----|------|------|
| [US-S09](./us/US-S09-business-epc-linter.md) | business-epc-linter + 警示中心 | 已完成 |
| [US-S10](./us/US-S10-excel-per-module.md) | Excel 分模块导入导出 | 已完成 |
| [US-S11](./us/US-S11-ai-draft-fill.md) | AI 仅 draft 填充 | 已完成 |

## Phase 4 User Stories ✅

| ID | 标题 | 状态 |
|----|------|------|
| [US-S12](./us/US-S12-legacy-removal.md) | 遗留代码删除 | 已完成 |
| [US-S13](./us/US-S13-compiler-golden.md) | compiler 迁移 + golden | 已完成 |
