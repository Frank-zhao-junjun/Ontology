# US-S16-U03：覆盖率面板 UI

| Unit ID | US-S16-U03 | 状态 | ✅ 已完成 |
| 所属 US | [US-S16](../us/US-S16-epc-coverage.md) |
| 文件 | `src/components/ontology/epc-coverage-panel.tsx` |

## 1. 目标

实现 `EpcCoveragePanel` 组件，在 C 工作区中以仪表盘形式展示 `EpcCoverageReport`，包含：

- 整体覆盖率进度条（百分比）
- 按 E1–E8 维度的详细覆盖率条
- 未覆盖要素列表（含定位导航）

## 2. 测试（先于 Code）

**测试文件**：`tests/integration/epc-coverage-panel.spec.tsx`

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | 渲染覆盖率仪表盘 | 展示整体百分比和维度条 |
| TC-02 | 按维度展开/收起 | 点击维度展开未覆盖要素列表 |
| TC-03 | 未覆盖要素定位 | 点击未覆盖要素导航到要素库 |

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
