# US-S18-U03：覆盖率 Badge

| Unit ID | US-S18-U03 | 状态 | ✅ 已完成 |
| 所属 US | [US-S18](../us/US-S18-epc-derivation.md) |
| 文件 | `src/components/ontology/element-coverage-badge.tsx` |

## 1. 目标

实现 `ElementCoverageBadge` 组件，在各要素编辑器中显示 EPC 覆盖状态（已覆盖 / 未覆盖），使用 US-S16 的 `getEpcCoverage` 数据。

## 2. 测试

**测试文件**：`tests/integration/element-coverage-badge.spec.tsx`

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | 已覆盖 → 绿色 Badge | usageRefs 非空时显示 covered |
| TC-02 | 未覆盖 → 灰色 Badge | usageRefs 为空时显示 uncovered |

**验证**：`npx vitest run tests/integration/element-coverage-badge.spec.tsx` — 2/2 pass

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
