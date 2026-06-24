# US-S11b-U02：Store applyAiEpcDraft

| Unit ID | US-S11b-U02 | 状态 | 📝 草稿 |
| 所属 US | [US-S11b](../us/US-S11b-doc-epc-generate.md) |
| 文件 | `src/store/ontology-store.ts` → `applyAiEpcDraft` |

## 1. 目标

实现 `applyAiEpcDraft` Store 方法，将 AI 生成的 EPC 步骤合并到当前 EPC draft，**不 confirm**。

## 2. 范围

### In Scope

- `applyAiEpcDraft(epcId, steps)`：全量替换当前 EPC 的 `steps[]`（draft 模式）
- fork 逻辑：①有已确认版→fork 新 draft；②有 draft→覆盖；③无→创建 draft
- 调用 `rebuildUsageIndex()` 更新引用索引
- 仅操作 draft，不影响 confirmed 快照

### Out of Scope

- UI、API 路由、文档解析

## 3. 技术设计

```typescript
// ontology-store.ts 新增
applyAiEpcDraft: (epcId: string, steps: EpcStepSuggestion[]) => {
  // 1. 检查 epcId 对应 EPC 状态
  // 2. 根据 fork 规则创建/覆盖 draft
  // 3. 替换 steps
  // 4. 调用 rebuildUsageIndex()
  // 5. 更新 moduleVersionRecords
}
```

fork 规则优先级：
1. 有确认版 → 从确认版 fork，steps 写新 draft，原确认版不变
2. 无确认版有 draft → 直接覆盖当前 draft
3. 都没有 → 创建新 draft

## 4. AC

| # | 验收项 | 验证 |
|---|--------|------|
| AC-1 | 有确认版时 fork 新 draft，不修改原确认版 | unit + store |
| AC-2 | 无确认版有 draft 时覆盖 | unit + store |
| AC-3 | 无确认版无 draft 时创建 | unit + store |
| AC-4 | 调用后 rebuildUsageIndex 更新 | unit |
| AC-5 | 不触发 confirm | unit |

## 5. 测试计划

| 类型 | 文件 | 说明 |
|------|------|------|
| Unit | `tests/unit/ai-draft/apply-epc-draft.spec.ts` | 5 TC |
| Store | `tests/store/apply-epc-draft-store.spec.ts` | 5 TC |

## 6. 依赖

- **前置 Unit**：US-S11b-U01
- **阻塞 US**：US-S11b-U03, US-S11b-U04

## 7. 六步检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | |
| ② PRD AC | [ ] | |
| ③ Testing case | [ ] | |
| ④ Coding | [ ] | |
| ⑤ Unit test | [ ] | |
| ⑥ E2E | N/A | Store |
