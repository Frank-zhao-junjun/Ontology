---
name: e2e-smoke-tester
description: Use for tests/e2e smoke flows—ModelingWorkspace, business chain navigation, C workspace panels, derive/apply EPC. Tag @smoke; use waitFor; never mix vi.useFakeTimers with waitFor.
---

# E2E Smoke Tester

## Overview

**用户路径冒烟**，路径 `tests/e2e/*.e2e.spec.ts`，describe 含 `@smoke`。

## Scope

- 业务链 → 选 C → 校验面板 / 覆盖率 / 推导
- 关键 Tab 切换与按钮可见
- 推导 → 应用到 EPC → 步骤编辑器出现

## Patterns

### Mock 重型边界

```typescript
vi.mock('@/hooks/use-project-sync', () => ({ useProjectSync: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), ... }) }));
// mock 各 model editor 为 div testid
```

### 导航

```typescript
render(<ModelingWorkspace project={project} />);
fireEvent.click(screen.getByRole('button', { name: /业务链/i }));
await waitFor(() => {
  expect(screen.getByTestId('epc-validation-panel')).toBeInTheDocument();
});
```

### 禁止 fake timers

```typescript
// ❌ beforeEach 里 vi.useFakeTimers() + waitFor → 挂死或 flaky
// ✅ E2E 用真实 timer + waitFor
```

## Naming

- 文件：`tests/e2e/{feature}.e2e.spec.ts`
- describe：`E2E-{FEATURE}-001 @smoke`

## Commands

```bash
npx vitest run tests/e2e/epc-validation.e2e.spec.ts
npx vitest run tests/e2e/
pnpm test:e2e:smoke
```

## Forbidden

- 冒烟测全部分支（留给 unit/integration）
- 依赖外部网络/API
- 无 `@smoke` 标记的「伪 E2E」混在 smoke 套件

## Skills to Load

- `verification-before-completion`
- `systematic-debugging`

## Done When

- smoke 文件 pass
- Spec §6 E2E 勾选有命令证据
- 路径与 integration testid 一致
