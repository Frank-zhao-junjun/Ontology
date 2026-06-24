# US-S18-U03：C 工作区「从模型推导」按钮 + 应用到 EPC

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S18-U03 |
| **所属 US** | [US-S18](../us/US-S18-epc-derivation.md) |
| **状态** | ✅ 已完成 — 六步闭环 |
| **预估文件** | `src/components/ontology/scenario-workspace.tsx` |

## 1. 目标

在 C 工作区（`scenario-workspace.tsx`）增加「从模型推导」按钮，用户点击后展示推导出的 EPC 步骤列表，并可「应用到 EPC」一键写入。

## 2. 范围

### In Scope

- `scenario-workspace.tsx` 新增 Props：`onDeriveSteps?` / `derivedSteps?` / `onApplyDerivedSteps?`
- 推导按钮（`data-testid="derive-epc-steps-btn"`）— 仅 `onDeriveSteps` 存在时渲染
- 推导步骤列表展示（名称 / 维度 / 推导原因）
- 空推导结果提示
- 应用按钮（`data-testid="apply-derived-steps-btn"`）— 仅 `derivedSteps.length > 0` 时渲染

### Out of Scope

- `deriveEpcSteps` 纯函数（U01）
- Store 方法（U02）
- 覆盖率 Badge（U04）

## 3. 技术设计

### Props 扩展

```typescript
export interface ScenarioWorkspaceProps {
  // ...existing props...
  onDeriveSteps?: () => void;
  derivedSteps?: DerivedEpcStep[];
  onApplyDerivedSteps?: () => void;
}
```

### 交互流程

```
[从模型推导] 按钮 → onDeriveSteps() → Store.deriveEpcStepsFromScenario()
  ↓
展示 derivedSteps 列表（每行: name + dimension Badge + derivation reason）
  ↓
[应用到 EPC] 按钮 → onApplyDerivedSteps() → Store.applyDerivedStepsToScenarioEpc()
  ↓
EPC 步骤写入完成 → 刷新视图
```

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | 对应 TC |
|---|--------|----------|:--:|
| AC-1 | onDeriveSteps 存在时渲染推导按钮 | 集成测试 | TC-01 |
| AC-2 | onDeriveSteps 不存在时不渲染按钮 | 集成测试 | TC-02 |
| AC-3 | 点击按钮触发 onDeriveSteps 回调 | 集成测试 | TC-03 |
| AC-4 | derivedSteps 非空时展示步骤列表 | 集成测试 | TC-04 |
| AC-5 | derivedSteps 为空时显示空状态提示 | 集成测试 | TC-05 |
| AC-6 | derivedSteps 非空时渲染应用按钮 | 集成测试 | TC-06 |
| AC-7 | E2E smoke：真实 Store 推导并应用 | E2E | TC-07 |

## 5. 测试用例

### 集成测试（`tests/integration/epc-derivation-workspace.spec.tsx`）

| # | 场景 | 条件 | 预期 |
|---|------|------|------|
| TC-01 | 推导按钮渲染 | `onDeriveSteps={fn}` | button 可见 |
| TC-02 | 推导按钮不渲染 | 无 onDeriveSteps | button 不存在 |
| TC-03 | 点击触发回调 | 点击推导按钮 | onDeriveSteps 被调用 |
| TC-04 | 展示推导步骤 | `derivedSteps={[3 items]}` | 列表渲染 3 行 |
| TC-05 | 空推导结果 | `derivedSteps={[]}` | 显示空状态提示 |
| TC-06 | 应用按钮渲染 | derivedSteps 非空 | 「应用到 EPC」按钮可见 |

### E2E Smoke（`tests/e2e/epc-derivation.e2e.spec.ts`）

| # | 场景 | 预期 |
|---|------|------|
| TC-07 | 完整推导+应用流程 | 确认 C → 推导 → 应用 → EPC 步骤已写入 |

## 6. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 验收条款 — 7 项 AC 全部通过）
- [x] ③ Testing case（§5 — 6 + 1 E2E = 7 cases，先于编码）
- [x] ④ Coding（`scenario-workspace.tsx` Props 扩展 + UI）
- [x] ⑤ Unit test（`epc-derivation-workspace.spec.tsx` 6/6 + `epc-derivation.e2e.spec.ts` 1/1 全绿）
- [x] ⑥ E2E（`tests/e2e/epc-derivation.e2e.spec.ts` — smoke pass）

## 7. 验证命令

```bash
cd D:\AI\Ontology
npx vitest run tests/integration/epc-derivation-workspace.spec.tsx tests/e2e/epc-derivation.e2e.spec.ts --reporter=verbose
# 7/7 pass ✅
```
