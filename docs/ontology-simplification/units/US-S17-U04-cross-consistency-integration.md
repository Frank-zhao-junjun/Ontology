# US-S17-U04：场景工作台集成

| Unit ID | US-S17-U04 | 状态 | ✅ 已完成 |
| 所属 US | [US-S17](../us/US-S17-cross-consistency.md) |
| 文件 | `src/components/ontology/scenario-workspace.tsx` |

## 1. 目标

在 `scenario-workspace.tsx` 中集成 `EpcValidationPanel`，选中 C 节点时自动计算并展示 VE/VM/VX 交叉校验结果。

## 2. 测试

**测试文件**：`tests/e2e/warning-center.e2e.spec.ts`（已有，验证三栏校验面板渲染）

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | C 工作区显示校验面板 | 选中 C 节点后 EpcValidationPanel 渲染 |
| TC-02 | 三栏 Tab 正常交互 | 切换 Tab 展示对应规则类别 |

**验证**：E2E smoke pass

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E [x] smoke pass
