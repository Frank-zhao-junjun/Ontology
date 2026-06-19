# US-S07-U01：未引用纯函数

| Unit ID | US-S07-U01 | 状态 | 已完成 |
| 所属 US | [US-S07](../us/US-S07-element-library-unreferenced.md) |

## 测试（先于 Code）

**测试文件**：`tests/unit/element-library.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-1 | 空或缺失 usageRefs 视为未引用 | `isUnreferencedElement` 对空数组和 undefined 均返回 true |
| TC-2 | 计数 usage refs | `getUsageCount` 返回正确引用数 |
| TC-3 | 筛选未引用 | `filterUnreferencedElements(true)` 仅返回未引用要素 |
| TC-4 | 按维度筛选 | `filterMetaElementsByDimension` 按 E1~E8 筛选 |

## 流水线 §7
①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
