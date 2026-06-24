# US-S19-U02：Store applyAiElementDrafts（insert 去重）

| Unit ID | US-S19-U02 | 状态 | 📝 草稿 |
| 所属 US | [US-S19](../us/US-S19-doc-element-draft.md) |
| 文件 | `src/store/ontology-store.ts` → `applyAiElementDrafts` |

## 1. 目标

实现 `applyAiElementDrafts` Store 方法，将 AI 生成的 E1~E8 要素**增量 insert** 到要素库 draft，**不覆盖已有**，**不 confirm**。

## 2. 范围

### In Scope

- `applyAiElementDrafts(elements)`：批量 insert 要素到对应维度的 draft
- **insert 模式**：仅新增，不修改、不删除已有要素
- **去重逻辑**：按 `name + dimension` 判断是否已存在，重复则跳过
- 已存在要素通过 `existingElementNames` 优先过滤（Prompt 层 + Store 层双重保障）
- 写入后调用 `rebuildUsageIndex()`
- 所有新要素均为 draft 状态

### Out of Scope

- 文档解析、Prompt、UI、API

## 3. 技术设计

```typescript
// ontology-store.ts 新增
applyAiElementDrafts: (elements: ElementDraftSuggestion[]) => {
  // 1. 获取当前 metaElements
  // 2. 构建去重索引: Map<`${dimension}:${name}`, true>
  // 3. 遍历 elements，跳过重复
  // 4. 为新要素生成 id，设置 status='draft'
  // 5. push 到 metaElements
  // 6. 调用 rebuildUsageIndex()
  // 7. 返回实际 insert 数量
}
```

去重策略：
```typescript
const existingKeys = new Set(
  metaElements.map(e => `${e.dimension}:${e.name}`)
);
const inserted = elements.filter(
  e => !existingKeys.has(`${e.dimension}:${e.name}`)
);
```

## 4. AC

| # | 验收项 | 验证 |
|---|--------|------|
| AC-1 | 新要素成功 insert 到对应维度 | unit + store |
| AC-2 | 同名同维度要素被跳过（不重复 insert） | unit |
| AC-3 | insert 后已有要素完整保留 | unit |
| AC-4 | 返回值正确反映实际 insert 数量 | unit |
| AC-5 | 写入后 rebuildUsageIndex 更新 | unit |
| AC-6 | insert 后不触发 confirm | unit |

## 5. 测试计划

| 类型 | 文件 | 说明 |
|------|------|------|
| Unit | `tests/unit/ai-draft/apply-element-drafts.spec.ts` | 6 TC |

## 6. 依赖

- **前置 Unit**：US-S19-U01
- **阻塞 US**：US-S19-U03, US-S19-U04

## 7. 六步检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | |
| ② PRD AC | [ ] | |
| ③ Testing case | [ ] | |
| ④ Coding | [ ] | |
| ⑤ Unit test | [ ] | |
| ⑥ E2E | N/A | Store |
