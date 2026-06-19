# US-S09-U02：Store API

| Unit ID | US-S09-U02 | 状态 | 已完成 |
| 所属 US | [US-S09](../us/US-S09-business-epc-linter.md) |

## 测试（先于 Code）

**测试文件**：`tests/unit/business-epc-linter-store.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-1 | store 返回 project 状态警告 | `getBusinessEpcWarnings()` 调用 linter 并返回结果 |
| TC-2 | W-EPC-02 通过 store 可检测 | 已确认要素无引用时 store 返回对应警告 |

## 流水线 §7
①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
