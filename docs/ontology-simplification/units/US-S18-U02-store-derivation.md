# US-S18-U02：Store deriveEpcStepsFromScenario + apply

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S18-U02 |
| **所属 US** | [US-S18](../us/US-S18-epc-derivation.md) |
| **状态** | ✅ 已完成 — 六步闭环 |
| **预估文件** | `src/store/ontology-store.ts` |

## 1. 目标

在 `ontology-store` 暴露 `deriveEpcStepsFromScenario` 和 `applyDerivedStepsToScenarioEpc` 两个 Store 方法，桥接纯函数与 UI。

## 2. 范围

### In Scope

- `deriveEpcStepsFromScenario(scenarioId)` — 从 state 提取已确认 MetaElement，调用 `filterConfirmedMetaElements` + `deriveEpcSteps`
- `applyDerivedStepsToScenarioEpc(scenarioId, targetEpcId?)` — 将推导结果写入目标 EPC 或自动创建新 EPC
- 门禁：project null → 空 / C 未确认 → 空 / 无已确认要素 → 空

### Out of Scope

- `deriveEpcSteps` 纯函数逻辑（U01）
- UI 按钮（U03）

## 3. 技术设计

### deriveEpcStepsFromScenario

```typescript
deriveEpcStepsFromScenario: (scenarioId) => {
  const project = get().project;
  if (!project) return [];
  if (!getLatestConfirmed(project.moduleVersionRecords ?? [], 'C', scenarioId)) return [];
  const confirmed = filterConfirmedMetaElements(
    project.metaElements ?? [],
    project.moduleVersionRecords ?? [],
  );
  return deriveEpcSteps({ metaElements: confirmed });
}
```

### applyDerivedStepsToScenarioEpc

```typescript
applyDerivedStepsToScenarioEpc: (scenarioId, targetEpcId?) => {
  // 1. 调用 deriveEpcStepsFromScenario 获取推导结果
  // 2. 查找目标 EPC（指定 ID > 首个子 EPC > 新建）
  // 3. 调用 derivedStepsToEpcSteps 转换为 EpcStep[]
  // 4. 调用 saveEpc 写入
  // 5. 返回 { ok: true, epcId, stepCount } 或 { ok: false, error }
}
```

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | 对应 TC |
|---|--------|----------|:--:|
| AC-1 | project null → [] | Store 测试 | TC-01 |
| AC-2 | C 未确认 → [] | Store 测试 | TC-02 |
| AC-3 | 已确认 E3+E2 要素生成对应步骤 | Store 测试 | TC-03 |
| AC-4 | 混合 E1+E2+E5 生成正确数量步骤 | Store 测试 | TC-04 |
| AC-5 | apply 到无 EPC 场景自动创建新 EPC | Store 测试 | TC-05 |

## 5. 测试用例

| # | 场景 | 条件 | 预期 |
|---|------|------|------|
| TC-01 | 无 metaElements | project 无 metaElements | `deriveEpcStepsFromScenario` 返回 [] |
| TC-02 | C 未确认 | C 仅 draft | 返回 [] |
| TC-03 | E3+E2 已确认 | 1 E3 + 1 E2 已确认 | 结果含 2xE3 + 1xE2 步骤 |
| TC-04 | E1+E2+E5 混合 | E3 + E1 + E2 + E5 已确认 | 首尾 E3 + 中间维度步骤 |
| TC-05 | apply 创建 EPC | C 无子 EPC | `applyDerivedStepsToScenarioEpc` 返回 ok=true + epcId + stepCount>0 |

## 6. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 验收条款 — 5 项 AC 全部通过）
- [x] ③ Testing case（§5 — 5 cases，先于编码）
- [x] ④ Coding（`ontology-store.ts` ~30 LOC）
- [x] ⑤ Unit test（`tests/unit/epc-derivation-store.spec.ts` 5/5 全绿）
- [x] ⑥ E2E（N/A，store 方法通过 U03 E2E 端到端验证）

## 7. 验证命令

```bash
cd D:\AI\Ontology
npx vitest run tests/unit/epc-derivation-store.spec.ts --reporter=verbose
# 5/5 pass ✅
```
