# US-S12-U03：BusinessScenario → 业务链迁移纯函数

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S12-U03 |
| **所属 US** | [US-S12](../us/US-S12-legacy-removal.md) |
| **状态** | 进行中 |
| **预估文件** | `lib/legacy-migration/index.ts` |

## 1. 目标

将 legacy `BusinessScenario[]` 迁移为简化架构的 `ValueDomain[]` + `Capability[]` + `Scenario[]`，业务场景映射为 C 节点。

## 2. 范围

### In Scope
- `migrateBusinessScenariosToChain(scenarios, options)` 纯函数
- 每个 legacy BusinessScenario → A(域占位) → B(能力占位) → C(场景)
- 同名 A/B 可合并；同名 C 跳过
- 返回 { valueDomains, capabilities, scenarios }

### Out of Scope
- 写入 store（U04）
- Entity 迁移

## 3. 技术设计

```ts
function migrateBusinessScenariosToChain(
  businessScenarios: BusinessScenario[],
  options?: { domainName?: string; capabilityName?: string }
): { valueDomains: ValueDomain[]; capabilities: Capability[]; scenarios: Scenario[] }
```

## 7. 流水线检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD | [x] | AC-3: scenarios 出现在 project.scenarios |
| ③ Testing case | [ ] | 先写 test |
| ④ Coding | [ ] | 实现函数 |
| ⑤ Unit test 绿灯 | [ ] | pass |
| ⑥ E2E | [x] | N/A |
