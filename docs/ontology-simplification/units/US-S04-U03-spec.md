# US-S04-U03：业务链树导航 UI 组件

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S04-U03 |
| **所属 US** | [US-S04](../us/US-S04-business-chain-tree.md) |
| **状态** | 已完成（六步闭环） |

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | 树展示 A/B/C/EPC 层级 | integration |
| AC-2 | 选中节点显示 name 路径 | integration |
| AC-3 | draft/confirmed 徽章 | integration |
| AC-4 | 新建/删除/编辑节点 | integration |

## 5. 测试计划（先于 Coding）

`tests/integration/business-chain-tree.spec.tsx`

## 7. 流水线

| 步骤 | 完成 |
|------|------|
| ①~③ | [x] |
| ④~⑤ | [x] | integration 2/2 |
| ⑥ E2E | [x] | U04 `@smoke` |
