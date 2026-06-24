# US-S17-U03：UI 三栏校验面板

| Unit ID | US-S17-U03 | 状态 | ✅ 已完成 |
| 所属 US | [US-S17](../us/US-S17-cross-consistency.md) |
| 文件 | `src/components/ontology/epc-validation-panel.tsx` (323 行) |

## 1. 目标

实现 `EpcValidationPanel` 组件，在场景工作区中以 VE / VM / VX 三栏展示全部校验结果，支持按严重级筛选和定位导航。

## 2. 测试

**测试文件**：`tests/integration/epc-validation-panel.spec.tsx`

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | 三栏 Tab 切换 | VE/VM/VX 三个 Tab 可切换显示 |
| TC-02 | VX 规则展示 | VX Tab 显示交叉一致性 issue 列表 |
| TC-03 | 按严重级筛选 | error/warning/info 筛选按钮 |
| TC-04 | issue 定位导航 | 点击 issue 行触发 `onNavigate` |
| TC-05 | 无 issue 状态 | 全部通过时显示"暂无问题" |

**验证**：`npx vitest run tests/integration/epc-validation-panel.spec.tsx` — 14/14 pass

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
