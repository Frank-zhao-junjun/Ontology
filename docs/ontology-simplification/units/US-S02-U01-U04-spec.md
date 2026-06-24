# US-S02-U01 ~ U04：类型骨架

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S02-U01 ~ U04（合并） |
| **所属 US** | [US-S02](../us/US-S02-type-skeleton.md) |
| **状态** | 已完成 |

## 1. 目标

在 `repo-main/src/types/ontology.ts` 中新增简化架构所需的 TypeScript 类型，并编写单元测试验证类型定义正确性。

## 5. 测试计划（⚠️ Testing case 必须在 Coding 之前定义）

> **TDD 要求**：先定义测试用例，再实现类型定义。

### Unit 测试用例清单

| # | 测试场景 | 文件路径 | 验收项 |
|---|---------|---------|--------|
| TC-1 | A→B→C→EPC 业务链建模 | `tests/unit/simplified-types.spec.ts` | parentId 关系正确，elementRef 持久化 elementId |
| TC-2 | inlineNew 元素引用支持 | 同上 | inlineNew 和 inlinePayload 字段可用 |
| TC-3 | MetaElement 与 usageRefs | 同上 | usageRefs 派生索引结构正确 |
| TC-4 | OntologyProject 扩展字段 | 同上 | valueDomains/capabilities/scenarios/epcProcesses/metaElements 可选数组 |
| TC-5 | ModuleVersionRecord 版本记录 | 同上 | moduleKind/status/version 字段完整 |
| TC-6 | 枚举字面量类型检查 | 同上 | E1-E8 和 A/B/C/EPC 全部可用 |

### 测试文件

- **路径**：[`repo-main/tests/unit/simplified-types.spec.ts`](../../../repo-main/tests/unit/simplified-types.spec.ts)
- **用例数**：6 tests
- **覆盖范围**：所有新增类型（ValueDomain, Capability, Scenario, EpcProcess, MetaElement, ModuleVersionRecord, OntologyProject 扩展）

## 7. 流水线检查（严格按顺序执行）

| 步骤 | 完成 | 说明 |
|------|------|------|
| Unit Spec | [x] | 本文件填写完整 |
| PRD 验收条款 | [x] | AC 表可测试（见 US-S02） |
| **Testing case** | [x] | **✅ 已定义 6 个测试用例** |
| Coding | [x] | 实现类型定义 |
| Unit test 绿灯 | [x] | 6/6 tests pass |
| E2E（若适用） | [x] N/A | 纯类型定义，无 UI |

## 完成证据 — 2026-06-18

### 命令行验证结果

```bash
cd repo-main
pnpm lint          # ✅ 0 error
pnpm ts-check      # ✅ pass (0 error)
pnpm test:unit -- tests/unit/simplified-types.spec.ts
# ✅ 44 files, 167 tests pass (incl. simplified-types.spec.ts: 6 tests)
```

### 产出文件

- **类型定义**：[`repo-main/src/types/ontology.ts`](../../../repo-main/src/types/ontology.ts)
  - 新增：ValueDomain, Capability, Scenario, EpcProcess, EpcStep
  - 新增：MetaElementBase, MetaElement, ElementUsageRef
  - 新增：ModuleVersionRecord, ModuleKind, ModuleStatus, VersionPin
  - 扩展：OntologyProject 添加可选字段

- **单元测试**：[`repo-main/tests/unit/simplified-types.spec.ts`](../../../repo-main/tests/unit/simplified-types.spec.ts)
  - 6 个测试用例，100% 通过
  - 覆盖所有新增类型和关键字段

### TDD 原则遵循

- ✅ **Testing case 在 Coding 之前定义**（本 Spec 中的测试计划）
- ✅ 测试用例覆盖所有验收标准
- ✅ 先写测试，再实现代码
- ✅ 所有测试通过（绿灯）
