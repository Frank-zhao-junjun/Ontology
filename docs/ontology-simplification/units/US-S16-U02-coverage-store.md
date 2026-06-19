# US-S16-U02：Store API

| Unit ID | US-S16-U02 | 状态 | ✅ 已完成 |
| 所属 US | [US-S16](../us/US-S16-epc-coverage.md) |
| 文件 | `src/store/ontology-store.ts` → `getEpcCoverage` |

## 1. 目标

在 store 中暴露 `getEpcCoverage(scenarioId)` 方法，调用 `computeCoverage` 并返回结果。

## 2. 测试（先于 Code）

**测试文件**：`tests/unit/epc-coverage-store.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | project 为 null → all-zero | 空项目返回空报告 |
| TC-02 | C 未确认 → all-zero | 场景未确认时 store 返回空报告 |
| TC-03 | store 计算 50% 覆盖率 | 创建 A→B→C→EPC，确认后计算 |
| TC-04 | 未确认 EPC 引用不计 | 场景确认但 EPC 未确认时引用不计数 |

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
