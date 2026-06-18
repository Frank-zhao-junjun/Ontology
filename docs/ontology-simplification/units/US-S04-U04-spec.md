# US-S04-U04：工作台集成 + E2E @smoke

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S04-U04 |
| **所属 US** | [US-S04](../us/US-S04-business-chain-tree.md) |
| **状态** | 已完成（六步闭环） |

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | 工作台「业务链」Tab 可进入 | E2E @smoke |
| AC-2 | 空树可创建首个 A | E2E @smoke |
| AC-3 | 不破坏实体建模 Tab | 回归 integration |

## 5. 测试计划（先于 Coding）

`tests/e2e/business-chain-tree.e2e.spec.ts` — `@smoke`

## 7. 流水线

| 步骤 | 完成 | 证据 |
|------|------|------|
| ①~⑤ | [x] | workspace 集成 |
| ⑥ E2E | [x] | `@smoke` 通过 |

**完成日期**：2026-06-18
