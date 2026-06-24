# US-S03：模块版本 Store

| 字段 | 值 |
|------|-----|
| **ID** | US-S03 |
| **Phase** | 1 |
| **优先级** | P0 |
| **状态** | 已完成（2026-06-18） |
| **依赖** | US-S02（`ModuleVersionRecord`、`ModuleKind`） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 开发者，  
**我希望** 在 store 中按模块（A/B/C/EPC/E1–E8）管理 draft / confirmed / archived 版本，并解析 `latest_confirmed` 与锁定版本引用，  
**以便** 跨模块引用仅指向已确认快照，且编辑已确认内容时自动 fork 新 draft。

## 范围（In Scope）

- 纯函数库 `repo-main/src/lib/module-version/`
- `OntologyProject.moduleVersionRecords` 读写
- Store API：`saveModuleDraft`、`forkModuleToDraft`、`confirmModule`、`getModuleVersions`、`resolveModuleRef`
- 规则：每模块同时最多一个 draft；确认后 `v(N+1)`；上一 confirmed → archived

## 范围外

- UI 树导航（US-S04）
- `saveEpc` / `rebuildUsageIndex`（US-S05）

## 验收标准

- [x] draft 可创建/更新；确认生成 `v1/v2…`；旧 confirmed 变 archived
- [x] `resolveModuleRef` 支持 `latest_confirmed` 与 `{ version: 'vN' }`（含 archived pin）
- [x] draft 不可被 `resolveModuleRef` 解析为跨模块引用目标
- [x] `pnpm lint` / `ts-check` / `test:unit` 绿灯

## Unit 拆分

| Unit | Spec | 六步 |
|------|------|------|
| [US-S03-U01](../units/US-S03-U01-spec.md) | `lib/module-version` | ✅ 闭环 |
| [US-S03-U02](../units/US-S03-U02-spec.md) | `ontology-store` 挂载 | ✅ 闭环 |

## 流水线合规

- 两 Unit §7 六步均已 `[x]`；E2E: N/A（无 UI）
- S03 为**补档合规**；S04 起严格执行「③ 先于 ④」

## 确认

- [x] 用户启动 US-S03（2026-06-18）
