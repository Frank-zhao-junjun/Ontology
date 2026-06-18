# US-S08：C 工作区

| 字段 | 值 |
|------|-----|
| **ID** | US-S08 |
| **Phase** | 2 |
| **优先级** | P1 |
| **状态** | ✅ **已确认**（2026-06-18）→ **已完成** |
| **依赖** | US-S04（业务链）、US-S05（usageRefs）、US-S06（EPC 步骤） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 选中场景 (C) 时看到场景语义、子 EPC 列表及引用要素并集（只读），  
**以便** 在场景维度总览挂接情况，无需维护独立挂接表。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| 纯函数 | `getChildEpcProcesses`、`buildScenarioReferenceUnion` |
| Store | `getScenarioChildEpcs`、`getScenarioReferenceUnion` |
| `ScenarioWorkspace` | 场景语义只读、子 EPC 列表、引用并集预览 |
| 集成 | `BusinessChainDetail` 选中 C 时展示 |

## 范围外

| 项 | 归属 |
|----|------|
| 独立挂接表 / CRUD | 不在 ADR 范围 |
| EPC 步骤编辑 | US-S06（已完成） |
| W-EPC linter | US-S09 |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | 子 EPC 列表仅含 `parentId === C.id` | unit |
| AC-2 | 引用并集聚合子 EPC 全部 `steps[].elementRef` | unit |
| AC-3 | 同一 `elementId` 多 EPC 引用合并为一条 | unit |
| AC-4 | UI 展示语义块、子 EPC、并集（只读） | integration |
| AC-5 | 点击子 EPC 可跳转选中树节点 | integration |
| AC-6 | `ci:check` 绿灯 | CI |
| AC-7 | E2E `@smoke` | e2e |

## Unit 拆分

| Unit | 标题 | ⑥ E2E |
|------|------|-------|
| U01 | 引用并集纯函数 | N/A |
| U02 | Store API | N/A |
| U03 | ScenarioWorkspace 组件 | N/A |
| U04 | 详情集成 + smoke | ✅ |

## 确认

- [x] Frank，2026-06-18（US-S08 start）

## 验证

`pnpm run ci:check` 全绿；unit +4、integration +1、e2e smoke +1