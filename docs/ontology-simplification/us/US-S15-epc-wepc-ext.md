# US-S15：W-EPC 规则扩展 06~17

| 字段 | 值 |
|------|-----|
| **状态** | ✅ 已完成 |
| **Phase** | A（EPC v3.1 简化架构升级） |
| **规则范围** | W-EPC-06~17（12 条新校验规则） |
| **依赖** | US-S09（现有 W-EPC-01~05 linter） |
| **架构准据** | [ADR 简化架构](../adr-simplified-ontology-model.md) |
| **EPC v3.1 Spec** | [epc-v3.1-simplified-spec.md](../epc-v3.1-simplified-spec.md) |

## 目标

在现有 `business-epc-linter` 中增加 W-EPC-06~17 共 12 条新校验规则，覆盖旧 VE 系列规则的映射：

- VE-02~03 → W-EPC-06~07（引用一致性）
- VE-06~09 → W-EPC-08~11（关联密度/实体/角色）
- VE-10 → W-EPC-12（链路起止）
- VE-13~14 → W-EPC-13~14（Lifecycle/Semantic 引用映射）
- VE-15~17 → W-EPC-15~17（State-Action/Transition-Event/GuardCondition）

## Unit 拆分

| Unit | 标题 | 范围 |
|------|------|------|
| U01 | 类型扩展 | `EpcWarningRuleId` + `EPC_WARNING_RULES` + `MetaElementBase` 可选字段 |
| U02 | W-EPC-06~08 | 名称一致性、类型合法性、E2 行为关联密度 |
| U03 | W-EPC-09~11 | E1 数据依赖、实体绑定、角色绑定 |
| U04 | W-EPC-12~14 | 事件起止、E2+E7 引用存在性、语义元素引用 |
| U05 | W-EPC-15~17 | State-Action 一致性、Transition-Event 一致性、GuardCondition |
| U06 | WarningCenter UI 适配 | 新规则在警示中心可筛选查看 |

## 六步循环

每个 Unit 严格按：① Unit Spec → ② PRD → ③ Testing case（先于编码） → ④ Coding → ⑤ Unit test → ⑥ E2E

## 验证

- `pnpm run ci:check` 全绿
- `EPC_WARNING_RULES` 数组长度从 5 → 17
- 12 条新规则各有 unit test 覆盖
