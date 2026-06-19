# US-S16-U01：computeCoverage 纯函数

| Unit ID | US-S16-U01 | 状态 | ✅ 已完成 |
| 所属 US | [US-S16](../us/US-S16-epc-coverage.md) |
| 文件 | `src/lib/epc-coverage/index.ts`, `src/lib/epc-coverage/types.ts` |

## 1. 目标

实现 `computeCoverage(scenarioId, project)` → `EpcCoverageReport`，按 E1–E8 逐维度计算要素的 EPC 覆盖率。

## 2. 测试（先于 Code）

**测试文件**：`tests/unit/epc-coverage.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | 空项目 → 全 0 | 无要素无 EPC 时返回 all-zero 报告 |
| TC-02 | C 未确认 → 全 0 | 场景未确认时返回 empty |
| TC-03 | 无 EPC → 全部未覆盖 | 有要素但无 EPC 时覆盖率 0% |
| TC-04 | EPC 未确认 → 引用不计 | 要素有引用但 EPC 未确认时不计数 |
| TC-05 | 全量覆盖 → 100% | 所有要素均被已确认 EPC 引用 |
| TC-06 | 部分覆盖 → 50% | 4 个 E1 要素中 2 个被引用 |
| TC-07 | 跨维度混合 | E1 50% / E2 100% / E3 0% / E4 100% |
| TC-08 | 场景隔离 | 不同 C 的 EPC 引用互不影响 |
| TC-09 | 未知 scenarioId | 返回 all-zero empty 报告 |

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
