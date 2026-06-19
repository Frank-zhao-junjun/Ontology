# US-S15-U01：类型扩展

| 字段 | 值 |
|------|-----|
| **所属 US** | [US-S15](../us/US-S15-epc-wepc-ext.md) |
| **状态** | ✅ 已完成 |
| **预估文件** | `src/lib/business-epc-linter/types.ts`, `src/types/ontology.ts` |

## 1. 目标

扩展 `EpcWarningRuleId` 联合类型以包含 W-EPC-06~17，更新 `EPC_WARNING_RULES` 数组，在 `MetaElementBase` 添加可选字段支撑新规则的校验上下文。

## 2. 范围

### In Scope

- `EpcWarningRuleId` 增加 `'W-EPC-06'` ~ `'W-EPC-17'`
- `EPC_WARNING_RULES` 数组包含全部 17 条规则 ID
- `MetaElementBase` 增加可选字段：`entityId`, `stateMachineId`, `constraintType`, `hasPolicy`, `eventId`（各字段类型见 §3）

### Out of Scope

- 新规则的实际校验逻辑（U02~U05）
- UI 适配（U06）

## 3. 技术设计

### EpcWarningRuleId 扩展

```typescript
// types.ts 现有
export type EpcWarningRuleId =
  | 'W-EPC-01' | 'W-EPC-02' | 'W-EPC-03' | 'W-EPC-04' | 'W-EPC-05'
  | 'W-EPC-06' | 'W-EPC-07' | 'W-EPC-08' | 'W-EPC-09' | 'W-EPC-10'
  | 'W-EPC-11' | 'W-EPC-12' | 'W-EPC-13' | 'W-EPC-14' | 'W-EPC-15'
  | 'W-EPC-16' | 'W-EPC-17';
```

`EPC_WARNING_RULES` 数组顺序追加新 ID。

### MetaElementBase 扩展字段

```typescript
export interface MetaElementBase {
  id: string;
  name: string;
  nameEn?: string;
  dimension: MetaDimension;
  // === US-S15 新增（可选）===
  entityId?: string;           // W-EPC-10: 关联的 Entity ID（E1 要素需有 entity 归属）
  stateMachineId?: string;     // W-EPC-15/17: 关联的 StateMachine ID（E2 要素）
  constraintType?: string;     // W-EPC-17: 约束类型（E7 要素：'guard' | 'transaction' | 'compensation'）
  hasPolicy?: boolean;         // W-EPC-14: 是否有 AgentPolicy 定义（E5 要素）
  eventId?: string;            // W-EPC-16: 关联的 EventDefinition ID（E3 要素）
}
```

所有字段均为可选（`?`），不破坏现有兼容性。

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | `EpcWarningRuleId` 包含 17 个值 | 单元测试 |
| AC-2 | `EPC_WARNING_RULES.length === 17` | 单元测试 |
| AC-3 | `MetaElementBase` 可选字段编译通过，不破坏现有用法 | ts-check |
| AC-4 | 现有 linter 测试仍全部通过 | 单元测试 |

## 5. 测试用例

| # | 场景 | 预期 |
|---|------|------|
| TC-1 | `EpcWarningRuleId` 可赋值为 `'W-EPC-06'` | 编译通过 |
| TC-2 | `EPC_WARNING_RULES` 包含新 ID | `includes('W-EPC-06')` |
| TC-3 | `EPC_WARNING_RULES.length === 17` | 长度匹配 |
| TC-4 | `MetaElementBase` 创建时不传新字段 | 编译通过，值为 undefined |
| TC-5 | `MetaElementBase` 创建时传 `entityId` | 正确赋值 |
| TC-6 | 现有 `lintBusinessEpc` 测试不受影响 | 全部通过 |

## 6. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 验收条款 — 4 项 AC 全部通过）
- [x] ③ Testing case（§5 — 全部通过，见 business-epc-linter.spec.ts）
- [x] ④ Coding（types.ts + ontology.ts 已实现）
- [x] ⑤ Unit test（356/356 全部通过）
- [x] ⑥ E2E（不适用，纯类型变更）

## 7. 命令

```bash
cd D:\\AI\\Ontology
pnpm run ci:check
```
