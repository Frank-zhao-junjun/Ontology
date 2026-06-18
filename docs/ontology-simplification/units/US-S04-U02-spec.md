# US-S04-U02：Store 业务链 CRUD + draft 挂钩

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S04-U02 |
| **所属 US** | [US-S04](../us/US-S04-business-chain-tree.md) |
| **状态** | 已完成（六步闭环） |
| **预估文件** | `ontology-store.ts`、`business-chain-store.spec.ts` |

## 1. 目标

在 Zustand store 中提供 A/B/C/EPC CRUD，并在新建/更新时调用 `saveModuleDraft`。

## 2. 范围

### In Scope

- `add/update/delete` 四级节点 API
- `selectedBusinessChainNode`、`setSelectedBusinessChainNode`
- `getBusinessChainModuleStatus`
- 删除前 `canDeleteBusinessChainNode` 校验

### Out of Scope

- UI、E2E

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | AC 映射 |
|---|--------|----------|---------|
| AC-1 | CRUD 持久化到 project 扩展字段 | unit | US-S04 |
| AC-2 | 新建/更新触发 `saveModuleDraft` | unit | US-S04 #4 |
| AC-3 | 有子节点删除抛错 | unit | US-S04 #6 |

## 5. 测试计划（先于 Coding）

| 类型 | 文件路径 |
|------|----------|
| Unit test | `tests/unit/business-chain-store.spec.ts` |

## 7. 流水线检查

| 步骤 | 完成 |
|------|------|
| ① Unit Spec | [x] |
| ② PRD | [x] |
| ③ Testing case | [x] |
| ④ Coding | [x] | `ontology-store.ts` |
| ⑤ Unit test | [x] | 5/5 pass |
| ⑥ E2E | [x] N/A |
