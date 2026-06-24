# US-S12-U04：Store 迁移 API

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S12-U04 |
| **所属 US** | [US-S12](../us/US-S12-legacy-removal.md) |
| **状态** | 进行中 |
| **预估文件** | `store/ontology-store.ts` |

## 1. 目标

在 store 中添加 `migrateLegacyBusinessScenariosToChain()` 方法，调用 U03 迁移函数并写入 store。

## 2. 范围

### In Scope
- `migrateLegacyBusinessScenariosToChain()` store 方法
- 读取 `dataModel.businessScenarios` → 调用 U03 → 写入 `valueDomains/capabilities/scenarios`
- 一次性幂等操作（已迁移的场景不重复）

### Out of Scope
- UI 触发按钮
- 自动迁移

## 7. 流水线检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD | [x] | AC-3: 迁移后 scenarios 出现在 store |
| ③ Testing case | [ ] | 先写 store 测试 |
| ④ Coding | [ ] | 实现 store 方法 |
| ⑤ Unit test 绿灯 | [ ] | pass |
| ⑥ E2E | [x] | N/A |
