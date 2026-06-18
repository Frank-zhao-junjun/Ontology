# US-S09：business-epc-linter + 警示中心

| 字段 | 值 |
|------|-----|
| **ID** | US-S09 |
| **Phase** | 3 |
| **优先级** | P2 |
| **状态** | ✅ **已确认**（2026-06-18）→ **已完成** |
| **依赖** | US-S03（模块版本）、US-S05（usageRefs）、US-S07（未引用） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 对已确认模块运行 W-EPC-01~05 警示规则并在警示中心查看，  
**以便** 发现引用不一致问题且不阻断确认/导出。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| `lintBusinessEpc` | W-EPC-01~05，**warning only**，仅 **confirmed** 快照 |
| Store | `getBusinessEpcWarnings()` |
| `WarningCenter` | 列表、按规则筛选、本地忽略 |
| 工作台 | 顶栏 **警示** Tab |

## 范围外

| 项 | 归属 |
|----|------|
| Excel 分模块 | US-S10 |
| AI draft 填充 | US-S11 |
| 阻断确认/导出 | 不在 ADR 范围 |

## 规则（W-EPC）

| ID | 条件 |
|----|------|
| W-EPC-01 | 已确认 EPC 步骤引用要素未确认 |
| W-EPC-02 | 已确认要素 `usageRefs` 为空 |
| W-EPC-03 | 已确认 EPC 引用仅有 draft 的要素 |
| W-EPC-04 | 已确认 C 下无 EPC 子节点 |
| W-EPC-05 | 已确认 EPC 步骤 `elementId` 不在库中 |

## Unit 拆分

| Unit | 标题 | ⑥ E2E |
|------|------|-------|
| U01 | linter 纯函数 | N/A |
| U02 | Store API | N/A |
| U03 | WarningCenter UI | N/A |
| U04 | 工作台 + smoke | ✅ |

## 确认

- [x] Frank，2026-06-18

## 验证

`pnpm run ci:check` 全绿；unit +13、integration +2、e2e smoke +1