# US-S09-U04：工作台 Tab + E2E

| Unit ID | US-S09-U04 | 状态 | 已完成 |
| 所属 US | [US-S09](../us/US-S09-business-epc-linter.md) |

## 测试（先于 Code）

**测试文件**：`tests/e2e/warning-center.e2e.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-1 | 工作台「警示」Tab 可切换 | Tab 切换后显示警示中心面板 |
| TC-2 | 警告列表展示 | 面板中展示从 linter 返回的警告列表 |
| TC-3 | 筛选交互 | 按规则 ID/模块类型筛选后列表更新 |

## 流水线 §7
①②③ [x] ④⑤ [x] ⑥ E2E [x] smoke pass
