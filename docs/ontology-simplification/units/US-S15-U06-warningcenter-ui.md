# US-S15-U06：WarningCenter UI 适配

| 字段 | 值 |
|------|-----|
| **所属 US** | [US-S15](../us/US-S15-epc-wepc-ext.md) |
| **状态** | 草稿 |
| **依赖** | U01（EPC_WARNING_RULES 扩展），U02~U05（规则实现） |
| **预估文件** | 无代码变更（UI 自动适配） |

## 1. 目标（一句话）

确认 `WarningCenter` 组件对新旧 W-EPC 规则的筛选和展示正常。

## 2. 范围

### In Scope

- 验证 `WarningCenter` 通过 `EPC_WARNING_RULES` 动态渲染 17 条筛选按钮
- 验证新规则（W-EPC-06~17）的筛选功能正常
- 验证新规则的警告消息完整展示

### Out of Scope

- linter 逻辑本身（U02~U05 已完成）
- 新的 UI 组件或布局变更

## 3. 技术设计

**核心机制**：`WarningCenter` 组件代码无需修改。

现有代码已自动适配新规则：

```tsx
// src/components/ontology/warning-center.tsx 第 66 行
{EPC_WARNING_RULES.map((ruleId) => {
  const count = countsByRule.get(ruleId) ?? 0;
  return (
    <Button
      key={ruleId}
      variant={ruleFilter === ruleId ? 'default' : 'outline'}
      data-testid={`warning-filter-${ruleId}`}
      onClick={() => setRuleFilter(ruleId)}
    >
      {ruleId}
      {count > 0 && (
        <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
          {count}
        </Badge>
      )}
    </Button>
  );
})}
```

因为 U01 已将 `EPC_WARNING_RULES` 从 5 条扩展为 17 条，组件循环自然渲染 17 个筛选按钮。筛选逻辑基于 `w.ruleId !== ruleFilter` 完全泛化。

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | 筛选按钮列表包含 W-EPC-06~17 | 浏览器/集成测试 |
| AC-2 | 点击 W-EPC-06 筛选按钮仅显示对应规则 | 集成测试 |
| AC-3 | 点击「全部」恢复全量显示 | 集成测试 |
| AC-4 | 警告列表正确显示新规则消息 | 集成测试 |

## 5. 测试用例

**测试文件**：`tests/integration/warning-center.spec.tsx`

| # | 场景 | 预期 |
|---|------|------|
| TC-1 | 渲染包含 W-EPC-07 样本警告 | 筛选按钮存在且点击后仅显示对应消息 |
| TC-2 | 忽略新规则警告后不显示 | 忽略按钮正常功能 |
| TC-3 | 全部按钮恢复全量显示 | 点「全部」后所有警告可见 |

## 6. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 ×4 ACs）
- [x] ③ Testing case（§5 ×3）
- [x] ④ Coding（无需变更，UI 自动适配）
- [x] ⑤ Integration test（已有测试扩展）
- [x] ⑥ E2E（smoke pass）

## 7. 验证命令

```bash
npx vitest run tests/integration/warning-center.spec.tsx
npx vitest run tests/unit/business-epc-linter.spec.ts
```
