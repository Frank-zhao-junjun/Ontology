# US-S09-U01：linter 纯函数

| Unit ID | US-S09-U01 | 状态 | 已完成 |
| 所属 US | [US-S09](../us/US-S09-business-epc-linter.md) |

## 测试（先于 Code）

**测试文件**：`tests/unit/business-epc-linter.spec.ts` (US-S09-U01 原有测试) + US-S15 扩展测试

| # | 名称 | 说明 |
|---|------|------|
| TC-1 | W-EPC-01：引用未确认要素 | step 引用 meta 存在但未确认 |
| TC-2 | W-EPC-02：已确认要素未被引用 | element usageRefs 为空 |
| TC-3 | W-EPC-03：引用仅草稿要素 | step 引用仅有 draft 状态的要素 |
| TC-4 | W-EPC-04：已确认 C 无子 EPC | scenario confirmed 但无子 EPC |
| TC-5 | W-EPC-05：引用不存在的要素 | elementId 在库中不存在 |

**注**：US-S15 扩展的 W-EPC-06~17 规则测试见对应 Unit Spec。

## 流水线 §7
①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
