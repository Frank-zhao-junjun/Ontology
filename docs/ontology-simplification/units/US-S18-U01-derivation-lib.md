# US-S18-U01：deriveEpcSteps 纯函数

| Unit ID | US-S18-U01 | 状态 | ✅ 已完成 |
| 所属 US | [US-S18](../us/US-S18-epc-derivation.md) |
| 文件 | `src/lib/epc-derivation/index.ts` |

## 1. 目标

实现 `deriveEpcSteps(input)` → `DerivedEpcStep[]`，从已确认的 E1–E8 要素自动推导 EPC 步骤骨架。

## 2. 测试

**测试文件**：`tests/unit/epc-derivation.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | 空要素 → 空列表 | 无要素返回空 |
| TC-02 | 仅 E3 → 首尾 bookend | 单个 E3 同时作为 start 和 end |
| TC-03 | 多 E3 → 首/尾分别为不同 E3 | E3[0] start, E3[n-1] end |
| TC-04 | E1 出现在中间 | E3(start) → E1 → E3(end) |
| TC-05 | E2 出现在中间 | 包含 stateMachineId 时标记绑定 |
| TC-06 | E7 约束 → decision/compensation | constraintType 决定标签 |
| TC-07 | E5 角色 → org unit | hasPolicy 标记策略 |
| TC-08 | 多维度混合 | E3 → E1 → E2 → E7 → E5 → E3 |
| TC-09 | E4/E6/E8 不生成步骤 | 这些维度不在 DIMENSION_ORDER 中 |
| TC-10 | `filterConfirmedMetaElements` | 仅保留有 confirmed 记录的要素 |
| TC-11 | `derivedStepsToEpcSteps` 转换 | 生成正确的 EpcStep 格式 |
| TC-12 | 集成串联 | lib → store → 按钮 → 应用步骤到 EPC draft |

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]

**验证**：`npx vitest run tests/unit/epc-derivation.spec.ts` — 12/12 pass
