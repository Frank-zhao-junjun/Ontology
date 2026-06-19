# US-S17-U01：validateCrossConsistency 纯函数

| Unit ID | US-S17-U01 | 状态 | ✅ 已完成 |
| 所属 US | [US-S17](../us/US-S17-cross-consistency.md) |
| 文件 | `src/lib/epc-cross-consistency/index.ts`, `types.ts` |

## 1. 目标

实现 `validateCrossConsistency(input)` → `CrossConsistencyIssue[]`，检查 EPC 步骤引用与各模型内部定义之间的交叉一致性（VX-01~12 共 10 条规则）。

## 2. 测试

**测试文件**：`tests/unit/epc-cross-consistency.spec.ts`

| # | 场景 | 预期 |
|---|------|------|
| TC-01 | VX-01：E2 Action 无绑定 StateMachine | warning |
| TC-02 | VX-01：E2 Action 有绑定 StateMachine | 无 issue |
| TC-03 | VX-02：E3 Event entity 不在 E1 链路 | error |
| TC-04 | VX-02：E3 Event entity 在 E1 链路 | 无 issue |
| TC-05 | VX-03：E4 Rule entity 不在 E1 链路 | warning |
| TC-06 | VX-03：E4 Rule entity 在 E1 链路 | 无 issue |
| TC-07 | VX-04：E6 Metric boundActionId 不在 E2 中 | warning |
| TC-08 | VX-04：E6 Metric boundActionId 在 E2 中 | 无 issue |
| TC-09 | VX-05：E8 DataSource boundObjectTypeId 不在 E1 中 | warning |
| TC-10 | VX-05：E8 DataSource boundObjectTypeId 在 E1 中 | 无 issue |
| TC-11 | VX-06：E5 Role 权限未覆盖全部 E1 | info |
| TC-12 | VX-06：E5 Role 权限覆盖全部 E1 | 无 issue |
| TC-13 | VX-09：triggerPhrase 未匹配 E2 Action | error |
| TC-14 | VX-09：triggerPhrase 匹配 E2 Action | 无 issue |
| TC-15 | VX-10：triggerPhrase 未匹配 State | warning |
| TC-16 | VX-10：triggerPhrase 匹配 State | 无 issue |
| TC-17 | VX-11：E7 compensation 引用不存在的 Action | warning |
| TC-18 | VX-11：E7 compensation 引用存在的 Action | 无 issue |
| TC-19 | VX-12：E5 hasPolicy 但无 AgentPolicy | warning |
| TC-20 | VX-12：E5 hasPolicy 且有 AgentPolicy | 无 issue |

**验证**：`npx vitest run tests/unit/epc-cross-consistency.spec.ts` — 28/28 pass

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
