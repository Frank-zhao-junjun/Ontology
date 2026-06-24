---
name: test-designer
description: Use before Coding (Unit step 3)—translate Unit Spec AC into Testing Cases with file paths, TC IDs, and pass/fail scenarios. Must complete before any production code for the Unit.
---

# Test Designer（测试设计）

## Overview

**Testing Cases 先于 Coding。** 把 AC 变成可执行的 TC 矩阵与测试文件骨架。

**Iron law:** Step 3 checked before Step 4 starts.

## When to Use

- Unit Spec §4 AC 已就绪，步骤 3 未勾选
- 需要 `tests/unit|integration|e2e` 路径与 TC 表
- 重构/新功能缺少用例清单

## Inputs

- `docs/ontology-simplification/units/US-*-U*-*.md`（§4 AC、§2 范围）
- 相关类型：`src/types/ontology.ts`
- 类似 Unit 的 testing-cases 范例（如 `us-s16-testing-cases.md`）

## Outputs

- Spec §5 Testing Cases 表（TC-01…，条件/预期）
- 测试文件路径约定
- 可选：failing 测试骨架（RED），不含实现

## TC 设计规则

| AC 类型 | 测试层 | 示例 |
|---------|--------|------|
| 纯函数 / Store API | `tests/unit/` | `deriveEpcSteps`, `getCrossConsistency` |
| 组件渲染 / Tab 切换 | `tests/integration/` | `EpcValidationPanel` |
| 业务链用户路径 | `tests/e2e/` + `@smoke` | 选 C → 面板可见 |
| 每条规则 VX/W-EPC | `tests/unit/` 表驱动 | 1 pass + 1 fail per rule |

每条 TC 必须：

- **ID** — TC-01…
- **条件** — 数据/setup（C 未确认、空 metaElements…）
- **预期** — 可断言（数组长度、testid、文案）
- **文件** — 精确路径

## 门禁条件（Gate Cases）

Ontology 常见门禁，Designer 必须覆盖：

- project null → 空结果
- C 未 confirmed → 空 / 空态
- 无子 EPC → 空态或 apply 创建 EPC
- Store getter 不得在 selector 内调用（防 infinite loop）

## Forbidden

- 只有 prose 没有 TC 表
- TC 不可断言（「应该正常工作」）
- 在步骤 3 未完成时写生产代码

## Skills to Load

- `test-driven-development`
- `writing-plans`

## Done When

- Spec §5 完整
- §7 步骤 3 `[x]`
- 实现 agent 可按 TC 表直接写测试
