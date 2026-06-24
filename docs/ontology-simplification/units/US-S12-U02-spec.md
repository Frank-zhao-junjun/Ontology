# US-S12-U02：删除 ProcessModel store CRUD

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S12-U02 |
| **所属 US** | [US-S12](../us/US-S12-legacy-removal.md) |
| **状态** | 进行中 |
| **预估文件** | `store/ontology-store.ts` |

## 1. 目标

从 store 接口和实现中移除 `setProcessModel` 方法；保留 `OntologyProject.processModel` 字段为只读兼容。

## 2. 范围

### In Scope
- 移除 `setProcessModel` 签名（interface 第 171 行）
- 移除 `setProcessModel` 实现（第 1368-1372 行）
- 保留 `processModel: null` 初始化（兼容导入/回滚）

### Out of Scope
- 删除 ProcessModel 类型定义（保留只读兼容）
- 删除 processModel 在 importProject/rollback 中的读写（数据兼容）

## 7. 流水线检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD | [x] | AC-2: store 无 ProcessModel CRUD |
| ③ Testing case | [x] | ts-check 确保 setProcessModel 可移除 |
| ④ Coding | [ ] | 删除 store 方法 |
| ⑤ Unit test 绿灯 | [ ] | grep 验证无残留 |
| ⑥ E2E | [x] | N/A |
