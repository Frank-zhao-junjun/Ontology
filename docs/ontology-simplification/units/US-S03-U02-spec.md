# US-S03-U02：ontology-store 模块版本 API

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S03-U02 |
| **所属 US** | [US-S03](../us/US-S03-module-version-store.md) |
| **状态** | 已完成（六步闭环） |
| **预估文件** | `repo-main/src/store/ontology-store.ts`、`repo-main/tests/unit/module-version-store.spec.ts` |

## 1. 目标

将 `module-version` 库挂载到 Zustand store，读写 `project.moduleVersionRecords`。

## 2. 范围

### In Scope

- Store API：`saveModuleDraft`、`forkModuleToDraft`、`confirmModule`、`getModuleVersions`、`resolveModuleRef`
- `createProject` 初始化 `moduleVersionRecords: []`

### Out of Scope

- `saveEpc` / `rebuildUsageIndex`（US-S05）
- 树导航 UI（US-S04）

## 3. 技术设计

`confirmModule` 委托 `confirmModuleRecord` + `getLatestConfirmed`；无 project 时 throw。

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | AC 映射 |
|---|--------|----------|---------|
| AC-1 | draft 持久化到 `project.moduleVersionRecords` | `module-version-store.spec.ts` | US-S03 #1 |
| AC-2 | store 层 confirm + resolve `latest_confirmed` | 同上 | US-S03 #2 |
| AC-3 | 二次 confirm 后 history 含 archived + confirmed v2 | 同上 | US-S03 #1 |

## 5. 测试计划（先于 Coding）

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| Unit test | `repo-main/tests/unit/module-version-store.spec.ts` | 3 cases，覆盖 AC-1~3 |

## 6. 依赖

- **前置 Unit**：US-S03-U01
- **阻塞 US**：US-S04、US-S05

## 7. 流水线检查（六步强制）

| 步骤 | 完成 | 证据 |
|------|------|------|
| 1 Unit Spec | [x] | 本文件 |
| 2 PRD 验收条款 | [x] | §4 AC 表 |
| 3 **Testing case** | [x] | `module-version-store.spec.ts` 已创建并覆盖 AC |
| 4 Coding | [x] | `ontology-store.ts` 五 API |
| 5 Unit test 绿灯 | [x] | 3/3 pass（全量 167） |
| 6 E2E | [x] N/A | 无 UI |

> **补档说明（2026-06-18）**：同 U01；**自 US-S04 起**严格 TDD 顺序。

## 8. 完成证据

```text
cd repo-main
pnpm lint       → 0 error
pnpm ts-check   → pass
pnpm test:unit -- tests/unit/module-version-store.spec.ts → 3 passed
```

**完成日期**：2026-06-18
