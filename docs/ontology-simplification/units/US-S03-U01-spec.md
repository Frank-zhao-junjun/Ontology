# US-S03-U01：module-version 纯函数库

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S03-U01 |
| **所属 US** | [US-S03](../us/US-S03-module-version-store.md) |
| **状态** | 已完成（六步闭环） |
| **预估文件** | `repo-main/src/lib/module-version/index.ts`、`repo-main/tests/unit/module-version.spec.ts` |

## 1. 目标

实现模块级版本纯函数：`saveModuleDraft`、`confirmModule`、`resolveModuleRef` 等，不依赖 store。

## 2. 范围

### In Scope

- `src/lib/module-version/index.ts`
- draft 单例、confirm 递增 vN、confirmed→archived
- `resolveModuleRef`：`latest_confirmed` 与 pin `vN`（含 archived）

### Out of Scope

- `ontology-store` 挂载（U02）
- UI / E2E

## 3. 技术设计

导出：`saveModuleDraft`、`forkConfirmedToDraft`、`confirmModule`、`getModuleDraft`、`getLatestConfirmed`、`getModuleVersions`、`resolveModuleRef`

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | AC 映射 |
|---|--------|----------|---------|
| AC-1 | 每模块仅一个 draft，可 upsert | `module-version.spec.ts` | US-S03 #1 |
| AC-2 | confirm → v1/v2，旧 confirmed→archived | 同上 | US-S03 #1 |
| AC-3 | `latest_confirmed` 与 pin `vN` 可解析 | 同上 | US-S03 #2 |
| AC-4 | draft 不可被 resolve | 同上 | US-S03 #3 |

## 5. 测试计划（先于 Coding）

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| Unit test | `repo-main/tests/unit/module-version.spec.ts` | 5 cases，覆盖 AC-1~4 |

## 6. 依赖

- **前置 Unit**：US-S02（`ModuleVersionRecord` 类型）
- **阻塞 US**：US-S03-U02

## 7. 流水线检查（六步强制）

| 步骤 | 完成 | 证据 |
|------|------|------|
| 1 Unit Spec | [x] | 本文件 |
| 2 PRD 验收条款 | [x] | §4 AC 表 |
| 3 **Testing case** | [x] | `module-version.spec.ts` 已创建并覆盖 AC |
| 4 Coding | [x] | `src/lib/module-version/index.ts` |
| 5 Unit test 绿灯 | [x] | 5/5 pass |
| 6 E2E | [x] N/A | 纯 lib，无 UI |

> **补档说明（2026-06-18）**：本 Unit 首版与测试同批落地；按「六步强制」补全 Spec 与勾选。**自 US-S04 起**：须先合入 Testing case（可 failing），再合入 Coding。

## 8. 完成证据

```text
cd repo-main
pnpm lint       → 0 error
pnpm ts-check   → pass
pnpm test:unit -- tests/unit/module-version.spec.ts → 5 passed
```

**完成日期**：2026-06-18
