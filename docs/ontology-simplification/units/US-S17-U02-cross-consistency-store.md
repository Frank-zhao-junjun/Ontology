# US-S17-U02：Store API

| Unit ID | US-S17-U02 | 状态 | ✅ 已完成 |
| 所属 US | [US-S17](../us/US-S17-cross-consistency.md) |
| 文件 | `src/store/ontology-store.ts` → `getCrossConsistency` |

## 1. 目标

在 store 中暴露 `getCrossConsistency(scenarioId)` 方法，调用 `validateCrossConsistency` 并返回结果。

## 2. 测试

**测试文件**：`tests/unit/epc-cross-consistency-store.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | project 为 null → 空数组 | 空项目无 issues |
| TC-02 | C 未确认 → 空数组 | 场景未确认返回空 |
| TC-03 | EPC 引用无效 Action → VX-01 | store 正确返回交叉校验 issue |
| TC-04 | 无 issue → 空数组 | 完整链路无交叉冲突 |

**验证**：`npx vitest run tests/unit/epc-cross-consistency-store.spec.ts` — 4/4 pass

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
