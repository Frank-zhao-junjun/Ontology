# US-S18-U01：deriveEpcSteps 纯函数

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S18-U01 |
| **所属 US** | [US-S18](../us/US-S18-epc-derivation.md) |
| **状态** | ✅ 已完成 — 六步闭环 |
| **预估文件** | `src/lib/epc-derivation/index.ts` |

## 1. 目标

实现 `deriveEpcSteps` 纯函数及两个辅助函数：给定已确认的 MetaElement 列表，按 EPC v3.1 推导规则自动生成 EPC 步骤骨架建议。

## 2. 范围

### In Scope

- `DerivedEpcStep` 类型（name / dimension / elementId / derivation）
- `DeriveEpcStepsInput` 输入类型
- `deriveEpcSteps` 纯函数：E3 起止 + E1/E2/E7/E5 中间步骤
- `filterConfirmedMetaElements`：仅保留已确认要素
- `derivedStepsToEpcSteps`：DerivedEpcStep[] → EpcStep[]

### Out of Scope

- Store 集成（U02）
- UI 按钮（U03）
- 覆盖率 Badge（U04）

## 3. 技术设计

### 推导规则

| 优先级 | 维度 | 规则 |
|--------|------|------|
| 1 | E3 | 取 events[0] 作为起始步骤 |
| 2 | E1 | 每个数据要素生成 1 个 info 步骤 |
| 3 | E2 | 每个行为要素生成 1 个功能步骤（含 stateMachineId 标注） |
| 4 | E7 | guard → "决策点"步骤, compensation → "补偿"步骤 |
| 5 | E5 | 每个角色生成 1 个岗位步骤（含 hasPolicy 标注） |
| 6 | E3 | 取 events[last] 或 events[0] 作为结束步骤 |

输出顺序：E3(start) → E1* → E2* → E7* → E5* → E3(end)

### 辅助函数

- `filterConfirmedMetaElements(elements, records)` — 调用 getLatestConfirmed 过滤
- `derivedStepsToEpcSteps(derived, generateId)` — 转换为 EpcStep 格式

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | 对应 TC |
|---|--------|----------|:--:|
| AC-1 | 空 metaElements 返回空数组 | 单元测试 | TC-01 |
| AC-2 | 仅 E3 时生成首尾事件步骤 | 单元测试 | TC-02, TC-09 |
| AC-3 | E2 元素生成功能步骤 | 单元测试 | TC-03 |
| AC-4 | E7 guard 生成决策点步骤 | 单元测试 | TC-04 |
| AC-5 | E7 compensation 生成补偿步骤 | 单元测试 | TC-05 |
| AC-6 | 输出按 E3→E1→E2→E7→E5→E3 排序 | 单元测试 | TC-06 |
| AC-7 | E1 元素生成 info 步骤 | 单元测试 | TC-07 |
| AC-8 | E5 元素生成岗位步骤 | 单元测试 | TC-08 |
| AC-9 | 2+ E3 时首尾取不同元素 | 单元测试 | TC-10 |
| AC-10 | filterConfirmedMetaElements 仅保留已确认 | 单元测试 | TC-11 |
| AC-11 | derivedStepsToEpcSteps 正确转换 | 单元测试 | TC-12 |
| AC-12 | lint 0 error · ts-check pass | ci:check | — |

## 5. 测试覆盖

| # | 场景 | 预期 |
|---|------|------|
| TC-01 | 空数组 | 返回 [] |
| TC-02 | 1 个 E3 元素 | 2 步骤（首+尾） |
| TC-03 | 2 个 E2 元素 | 2 功能步骤 |
| TC-04 | E7 guard | 决策点步骤 |
| TC-05 | E7 compensation | 补偿步骤 |
| TC-06 | 混合 E1+E2+E3+E7+E5 | 正确顺序 |
| TC-07 | 2 个 E1 元素 | 2 info 步骤 |
| TC-08 | E5 含 hasPolicy | 岗位步骤 |
| TC-09 | 仅 1 个 E3 用作首尾 | 同 elementId |
| TC-10 | 2+ E3 取不同首尾 | 不同 elementId |
| TC-11 | filterConfirmedMetaElements | 仅保留已确认 |
| TC-12 | derivedStepsToEpcSteps | 正确 elementRef |

## 6. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 验收条款 — 12 项 AC 全部通过）
- [x] ③ Testing case（§5 — 12 cases，先于编码）
- [x] ④ Coding（`src/lib/epc-derivation/index.ts` ~135 LOC）
- [x] ⑤ Unit test（`tests/unit/epc-derivation.spec.ts` 12/12 全绿）
- [x] ⑥ E2E（N/A，纯 lib 变更）

## 7. 验证命令

```bash
cd D:\AI\Ontology
npx vitest run tests/unit/epc-derivation.spec.ts
# 12/12 pass ✅
```
