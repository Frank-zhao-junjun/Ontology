# US-S17：交叉一致性校验（VX）

| 字段 | 值 |
|------|-----|
| **状态** | ✅ 代码、测试、UI 全部完成，补 Spec 文档 |
| **Phase** | C（EPC v3.1 简化架构升级） |
| **规则范围** | VX-01~20（20 条交叉一致性规则：VX-01~12 语义 + VX-13~20 结构） |
| **依赖** | US-S15（EPC linter），US-S16（覆盖率分析） |
| **架构准据** | [ADR 简化架构](../adr-simplified-ontology-model.md) |

## 目标

在 EPC 步骤引用的要素与模型内部定义之间进行交叉一致性校验，确保各维度间的引用关系无矛盾。

## 规则清单

### VX-01~12：语义一致性（12 条）

| # | 名称 | 严重级 | 说明 |
|---|------|--------|------|
| VX-01 | Action-Transition 一致 | warning | EPC 引用的 E2 Action 属于对应 StateMachine |
| VX-02 | Event-Entity 一致 | error | EPC 引用的 E3 Event 所属 Entity 在 E1 链路中 |
| VX-03 | Rule-Entity 一致 | warning | EPC 引用的 E4 Rule 所属 Entity 在 E1 链路中 |
| VX-04 | Metric-Action 一致 | warning | EPC 引用的 E6 Metric 的 boundActionId 在 E2 步骤中 |
| VX-05 | DataSource-Entity 一致 | warning | EPC 引用的 E8 DataSource 的 boundObjectTypeId 在 E1 中 |
| VX-06 | Role-Permission 一致 | info | E5 Role 的权限覆盖 EPC 链路的 E1 Entity |
| VX-07 | Dept-Role 一致 | warning | EPC 引用的 E5 Department 下 Position 的 roleIds 存在 |
| VX-08 | Position-Role 一致 | warning | EPC 引用的 E5 Position 关联的 Role 在要素库中已确认 |
| VX-09 | Intent-Action 一致 | error | A/B/C.semantics.triggerPhrases 匹配 E2 Action |
| VX-10 | State-Semantics 一致 | warning | triggerPhrases 描述的状态在 E2 StateMachine 中存在 |
| VX-11 | Compensation-Action 一致 | warning | E7 compensation 引用的 Action 在行为模型中存在 |
| VX-12 | Policy-Role 一致 | warning | E5 Role 标记 hasPolicy 但 AgentPolicy 定义存在 |

### VX-13~20：结构一致性（8 条）

| # | 名称 | 严重级 | 说明 |
|---|------|--------|------|
| VX-13 | EPC-C 挂接一致 | warning | EPC 的 parentId 对应的 C 在业务树中存在 |
| VX-14 | C-B 挂接一致 | warning | C 的 parentId 对应的 B 在业务树中存在 |
| VX-15 | B-A 挂接一致 | warning | B 的 parentId 对应的 A 在业务树中存在 |
| VX-16 | Element 维度一致 | error | elementRef 引用的要素维度与步骤预期维度一致 |
| VX-17 | Step 顺序合理性 | info | EPC 步骤序列的 bookend（E3）在首尾 |
| VX-18 | Draft-Confirmed 隔离 | warning | 已确认 EPC 步骤不引用仅 draft 要素（同 W-EPC-03） |
| VX-19 | Version pin 一致性 | warning | 引用锁定的 versionPin 在要素版本历史中存在 |
| VX-20 | usageRefs 完整性 | info | 全量 usageRefs 重建后无 dangling reference |

## Unit 拆分

| Unit | 标题 | 文件范围 | 测试 | 状态 |
|------|------|----------|------|:----:|
| U01 | `validateCrossConsistency` 纯函数 | `lib/epc-cross-consistency/index.ts` + `types.ts` | 28 条 | ✅ |
| U02 | Store API `getCrossConsistency` | `store/ontology-store.ts` | 4 条 | ✅ |
| U03 | UI 三栏校验面板 | `components/ontology/epc-validation-panel.tsx` | 14 条 | ✅ |
| U04 | 场景工作台集成 | `components/ontology/scenario-workspace.tsx` | E2E | ✅ |

## 验证

```bash
npx vitest run tests/unit/epc-cross-consistency*.spec.ts tests/integration/epc-validation-panel.spec.tsx
# 46/46 pass
```
