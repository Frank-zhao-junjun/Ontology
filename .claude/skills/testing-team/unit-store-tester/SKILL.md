---
name: unit-store-tester
description: Use for tests/unit and store integration—pure functions (lib/*), Zustand store getters, and helpers. RED-GREEN with vitest; no React unless unavoidable.
---

# Unit & Store Tester

## Overview

测试 **纯函数** 与 **Store API**，路径 `tests/unit/*.spec.ts`。

## Scope

| 类型 | 路径示例 |
|------|----------|
| 纯函数 | `epc-derivation`, `epc-coverage`, `epc-cross-consistency`, `business-epc-linter` |
| Store | `*-store.spec.ts`, `ontology-store` getters |

## Patterns（Ontology）

### Store 测试 setup

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
  useOntologyStore.setState({ project: null, /* reset */ });
  useOntologyStore.getState().createProject('测试', domain);
});
```

### 确认要素后再 derive/lint

```typescript
store.saveModuleDraft('E3', el.id, el);
store.confirmModule('E3', el.id);
store.confirmModule('C', scenario.id);
```

### Zustand 反模式

```typescript
// ❌ 在 selector 内调用 getter
useOntologyStore((s) => s.getBusinessEpcWarnings());

// ✅ 取函数引用 + useMemo
const getWarnings = useOntologyStore((s) => s.getBusinessEpcWarnings);
const warnings = useMemo(() => getWarnings(), [getWarnings, project]);
```

## RED-GREEN

1. 按 TC 写 failing test
2. 跑 `npx vitest run <file>` 确认 RED（或预期 pass）
3. 最小实现
4. 再跑确认 GREEN

## Commands

```bash
npx vitest run tests/unit/epc-cross-consistency.spec.ts
npx vitest run tests/unit/epc-derivation-store.spec.ts
pnpm test:unit
```

## Forbidden

- 用 integration 测纯函数逻辑
- 不测实现细节（内部变量名）
- mock 整个 store 而跳过真实 `createProject` 流程（store 集成除外）

## Skills to Load

- `test-driven-development`
- `systematic-debugging`

## Done When

- 本 Unit 相关 unit/store 文件 100% pass
- 返回：文件路径 + 命令 + pass 计数
