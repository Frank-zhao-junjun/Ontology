# US-S09-U03：警示中心 UI

| Unit ID | US-S09-U03 | 状态 | 已完成 |
| 所属 US | [US-S09](../us/US-S09-business-epc-linter.md) |

## 测试（先于 Code）

**测试文件**：`tests/integration/warning-center.spec.tsx`

| # | 名称 | 说明 |
|---|------|------|
| TC-1 | 警示中心渲染警告列表 | 显示全部 W-EPC 警告条目 |
| TC-2 | 按规则 ID 筛选 | 可按 W-EPC-0x 过滤特定规则 |
| TC-3 | 按模块类型筛选 | 可按 EPC/C/E* 过滤 |

## 流水线 §7
①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
