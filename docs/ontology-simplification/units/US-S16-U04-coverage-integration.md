# US-S16-U04：C 工作区集成

| Unit ID | US-S16-U04 | 状态 | ✅ 已完成 |
| 所属 US | [US-S16](../us/US-S16-epc-coverage.md) |
| 文件 | `src/components/ontology/scenario-workspace.tsx` |

## 1. 目标

在 `scenario-workspace.tsx` 中集成 `EpcCoveragePanel`，选中 C 节点时自动计算并展示覆盖率。

## 2. 测试（先于 Code）

**测试文件**：`tests/e2e/scenario-workspace.e2e.spec.ts`（已有，扩展验证覆盖率面板渲染）

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | C 工作区显示覆盖率面板 | 选中 C 节点后覆盖率面板渲染 |
| TC-02 | 覆盖率随 EPC 变更更新 | 增减 EPC 步骤后覆盖率变化 |

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E [x] smoke pass
