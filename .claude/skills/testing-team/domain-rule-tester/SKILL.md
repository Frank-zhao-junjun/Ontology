---
name: domain-rule-tester
description: Use for rule-engine and domain logic tests—VX-01~12 cross-consistency, W-EPC-01~17 linter, epc-coverage computeCoverage, deriveEpcSteps ordering. Table-driven; one positive and one negative case per rule minimum.
---

# Domain Rule Tester（领域规则）

## Overview

**业务规则即测试矩阵。** 每条规则至少 1 正例 + 1 负例（或门禁空结果）。

## Scope

| 域 | 文件 | 规则 |
|----|------|------|
| VX | `epc-cross-consistency.spec.ts` | VX-01~12 |
| W-EPC | `business-epc-linter.spec.ts` | W-EPC-01~17 |
| VM | `epc-coverage.spec.ts` | TC01–TC08 |
| 推导 | `epc-derivation.spec.ts` | E3 首尾、维度顺序 |

## Table-Driven Pattern

```typescript
it('VX-09: trigger phrase without matching action → error', () => {
  const issues = validateCrossConsistency(input).filter(i => i.code === 'VX-09');
  expect(issues).toHaveLength(1);
  expect(issues[0].severity).toBe('error');
});

it('VX-09: matching action → no issue', () => {
  expect(validateCrossConsistency(input).filter(i => i.code === 'VX-09')).toHaveLength(0);
});
```

## Helpers

- `makeRecord`, `baseInput`, `step`, `makeMeta` — 保持与 `epc-cross-consistency.spec.ts` 一致
- `usageRef(epcId, stepId, scenarioId)` — coverage store 测试
- `confirmModule` + `saveModuleDraft` — 确认快照后再 lint

## Gate Conditions（必测）

- C 未 confirmed → `validateCrossConsistency` / `computeCoverage` 空报告
- project null → store getter 返回 `[]` / empty report
- EPC 未 confirmed → 不计入 coverage

## Commands

```bash
npx vitest run tests/unit/epc-cross-consistency.spec.ts      # 28
npx vitest run tests/unit/business-epc-linter.spec.ts        # 42
npx vitest run tests/unit/epc-coverage.spec.ts
npx vitest run tests/unit/epc-derivation.spec.ts
```

## Forbidden

- 只测 happy path
- 规则 ID 硬编码在实现里而不断言 `code`
- 改规则语义却不更新 Testing Cases 文档

## Skills to Load

- `test-driven-development`
- `systematic-debugging`

## Done When

- 本 Unit 涉及规则全部有 pass/fail 覆盖
- TC 与 `docs/.../testing-cases.md` 对齐
- 返回规则 ID → 测试名映射表
