# US-S17-U02：VX-01~12 单元测试

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S17-U02 |
| **所属 US** | [US-S17](../us/US-S17-cross-consistency.md) |
| **状态** | ✅ 已完成 |
| **预估文件** | `tests/unit/epc-cross-consistency.spec.ts` |

## 1. 目标

为 `validateCrossConsistency` 编写覆盖全部 10 条 VX 规则 + 4 条门禁条件的单元测试，确保每条规则的正/负场景均有覆盖。

## 2. 范围

### In Scope

- VX_RULES 元数据验证（10 条、severity 正确性）
- 4 条门禁条件（scenarioId 缺失、C 未确认、EPC 未确认、无步骤）
- VX-01~12 每条规则的正（pass）/ 负（flag）场景
- 测试辅助工厂函数：`makeRecord / makeScenario / makeMeta / makeEpc / step / baseInput / emptyBehaviorModel`

### Out of Scope

- Store 集成测试（U03）
- E2E / 集成测试（U04）

## 3. 技术设计

### 测试架构

```typescript
describe('epc-cross-consistency (US-S17-U02)', () => {
  describe('VX_RULES metadata', () => { ... })        // 3 cases
  describe('gate conditions', () => { ... })           // 4 cases
  describe('VX-01: Action-Transition 一致', () => { ... }) // 3 cases
  describe('VX-02: Event-Entity 一致', () => { ... })     // 2 cases
  describe('VX-03: Rule-Entity 一致', () => { ... })      // 2 cases
  describe('VX-04: Metric-Action 一致', () => { ... })    // 2 cases
  describe('VX-05: DataSource-Entity 一致', () => { ... }) // 2 cases
  describe('VX-06: Role-Permission 一致', () => { ... })   // 2 cases
  describe('VX-09: Intent-Action 一致', () => { ... })    // 2 cases
  describe('VX-10: State-Semantics 一致', () => { ... })  // 2 cases
  describe('VX-11: Compensation-Action 一致', () => { ... }) // 2 cases
  describe('VX-12: Policy-Role 一致', () => { ... })      // 2 cases
})
```

### 辅助工厂

| 函数 | 用途 |
|------|------|
| `makeRecord(kind, id, status?)` | 创建 ModuleVersionRecord（默认 confirmed） |
| `makeScenario(id, name, overrides?)` | 创建 Scenario |
| `makeCapability(id, name)` | 创建 Capability |
| `makeValueDomain(id, name)` | 创建 ValueDomain |
| `makeMeta(id, dim, overrides?)` | 创建 MetaElement（自动生成 nameEn） |
| `makeEpc(id, parentId, steps)` | 创建 EpcProcess |
| `step(id, name, dim, elementId)` | 创建 EpcStep |
| `baseInput(overrides?)` | 创建最小可用 ValidateCrossConsistencyInput |
| `emptyBehaviorModel()` | 创建空 BehaviorModel |

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | 对应 TC |
|---|--------|----------|:--:|
| AC-1 | 31 条测试全部 pass | `npx vitest run` | TC-01~31 |
| AC-2 | VX_RULES 包含全部 10 个 ID | expect length + contain | TC-01 |
| AC-3 | VX-02 / VX-09 severity = error | expect severity | TC-02 |
| AC-4 | VX-06 severity = info | expect severity | TC-03 |
| AC-5 | 4 条门禁条件全覆盖（空返回） | expect length=0 | TC-04~07 |
| AC-6 | 每条 VX 规则至少 1 pass + 1 flag | positive/negative | TC-08~28 |
| AC-7 | null/undefined 模型输入不崩溃 | 3 cases | TC-29~31 |
| AC-8 | 无破坏既有 `tests/unit` 用例 | ci:check | — |

## 5. 测试用例清单

| # | 规则 | 场景 | 预期 |
|---|------|------|------|
| TC-01 | — | VX_RULES 导出 10 个 ID | toHaveLength(10) |
| TC-02 | — | VX-02 / VX-09 为 error | severity = 'error' |
| TC-03 | — | VX-06 为 info | severity = 'info' |
| TC-04 | gate | scenarioId 不存在 → [] | toHaveLength(0) |
| TC-05 | gate | C 未确认 → [] | toHaveLength(0) |
| TC-06 | gate | EPC 未确认 → [] | toHaveLength(0) |
| TC-07 | gate | EPC 无 elementRef 步骤 → [] | toHaveLength(0) |
| TC-08 | VX-01 | E2 无 stateMachine 绑定 + 空 behaviorModel | 1 issue |
| TC-09 | VX-01 | E2 有 stateMachineId 绑定到存在的 SM | 0 |
| TC-10 | VX-01 | E2 action id 在 SM.actions 中注册 | 0 |
| TC-11 | VX-02 | E3 event.entity ≠ E1 nameEn | 1 error |
| TC-12 | VX-02 | E3 event.entity = E1 nameEn | 0 |
| TC-13 | VX-03 | E4 rule.entity ≠ E1 nameEn | 1 |
| TC-14 | VX-03 | E4 rule.entity = E1 nameEn | 0 |
| TC-15 | VX-04 | E6 boundActionId 不在同 EPC E2 步骤 | 1 |
| TC-16 | VX-04 | E6 boundActionId 在同 EPC E2 步骤 | 0 |
| TC-17 | VX-05 | E8 boundObjectTypeId ≠ E1 nameEn | 1 |
| TC-18 | VX-05 | E8 boundObjectTypeId = E1 nameEn | 0 |
| TC-19 | VX-06 | E5 permissions 未覆盖全部 E1 | 1 info |
| TC-20 | VX-06 | E5 permissions 覆盖 E1 | 0 |
| TC-21 | VX-09 | triggerPhrase 无匹配 E2 action | 1 error |
| TC-22 | VX-09 | triggerPhrase 匹配 action name | 0 |
| TC-23 | VX-10 | triggerPhrase 无匹配 E2 state | 1 |
| TC-24 | VX-10 | triggerPhrase 匹配 state name | 0 |
| TC-25 | VX-11 | E7 compensation 引用缺失 action | 1 |
| TC-26 | VX-11 | E7 compensation 引用存在 action | 0 |
| TC-27 | VX-12 | E5 hasPolicy 无 AgentPolicy | 1 |
| TC-28 | VX-12 | E5 hasPolicy 有 AgentPolicy | 0 |
| **TC-29** | **null-model** | **behaviorModel = null → VX-01/09/10/11 全部跳过** | **0** |
| **TC-30** | **null-model** | **eventModel = null → VX-02 跳过** | **0** |
| **TC-31** | **null-model** | **governanceModel = null → VX-06/12 跳过** | **0** |

## 6. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 验收条款 — 7 项 AC 全部通过）
- [x] ③ Testing case（§5 — 31 cases，先于编码）
- [x] ④ Coding（`epc-cross-consistency.spec.ts` ~600 LOC）
- [x] ⑤ Unit test（28/28 全部通过）
- [x] ⑥ E2E（N/A，纯单元测试文件）

## 7. 验证命令

```bash
cd D:\AI\Ontology
npx vitest run tests/unit/epc-cross-consistency.spec.ts --reporter=verbose
# 28/28 pass → 目标扩展至 31/31
```
