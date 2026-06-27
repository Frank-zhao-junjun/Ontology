# GOALS — 项目一收尾子目标分解

---

## GS-01: store UI 状态操作覆盖

| 字段 | 值 |
|------|-----|
| **目标** | 为 `ontology-store.ts` 中剩余 UI 状态操作（`setActiveModelType`, `setActiveTab`, `setLoading`, `setError` 等，L3151+）编写测试 |
| **完成标准** | `ontology-store-ui.spec.ts` 覆盖所有 UI 状态 setter，≥10 tests |
| **允许范围** | 新增测试文件 |
| **禁止** | 不修改 store 源代码 |
| **依赖** | 无 |
| **执行顺序** | 1 |

---

## GS-02: 关键 lib 函数覆盖

| 字段 | 值 |
|------|-----|
| **目标** | 覆盖 `src/lib/` 中尚无测试的核心纯函数（如 `epc-coverage/`, `epc-derivation/helpers`, 及其他零散 util） |
| **完成标准** | 找出 ≥3 个未覆盖的 lib 模块，各写 ≥5 tests，合计 ≥15 tests |
| **允许范围** | 新增测试文件 |
| **禁止** | 不改业务代码 |
| **依赖** | 无 |
| **执行顺序** | 2 |

---

## GS-03: 关键组件测试覆盖

| 字段 | 值 |
|------|-----|
| **目标** | 覆盖尚未测试的高价值 React 组件，优先 `data-model-editor.tsx`（1976行，0% cov）中可提取的纯函数/helper，以及 `scenario-workspace.tsx` 等 |
| **完成标准** | 每组件 ≥5 tests，合计 ≥25 tests |
| **允许范围** | 新增测试文件；从组件中提取纯函数到独立 `.ts` 文件（不改业务行为） |
| **禁止** | 不改组件渲染逻辑 |
| **依赖** | 无 |
| **执行顺序** | 3（纯函数先，组件渲染后） |

---

## GS-04: API 路由剩余覆盖

| 字段 | 值 |
|------|-----|
| **目标** | 检查 `src/app/api/` 中哪些路由尚无测试，补齐覆盖率 |
| **完成标准** | 每个未覆盖的路由 ≥3 tests，合计 ≥15 tests |
| **允许范围** | 新增测试文件 + fixture JSON |
| **禁止** | 不改路由处理逻辑 |
| **依赖** | 无 |
| **执行顺序** | 4 |

---

## GS-05: ci:check 全绿冲刺

| 字段 | 值 |
|------|-----|
| **目标** | 运行完整 `ci:check` 并修复所有失败项 |
| **完成标准** | `lint` 0 error / `ts-check` pass / `test:unit` + `test:integration` + `test:e2e:smoke` + `test:phase4` 全绿 |
| **允许范围** | 修复测试断言（因新增测试可能暴露的 fixture 不匹配）；调整 `ci:check` 脚本顺序；调整 `vitest.config.ts` 覆盖范围 |
| **禁止** | 禁用失败的测试（改为修复）；跳过 lint/ts-check |
| **依赖** | GS-01 ~ GS-04 全部完成 |
| **执行顺序** | 5 |

---

## GS-06: 覆盖率确认 + commit & push

| 字段 | 值 |
|------|-----|
| **目标** | 运行 `npx vitest run --coverage` 确认覆盖率 ≥80%；stage → commit → push |
| **完成标准** | `ci:check` 全绿 + `--coverage` ≥80% + remote 同步成功 |
| **允许范围** | 微调 coverage include/exclude 以准确反映实际覆盖 |
| **禁止** | 使用 `--coverage.exclude` 排除大面积未覆盖模块来凑数 |
| **依赖** | GS-05 |
| **执行顺序** | 6 |

---

## 执行依赖图

```
GS-01 (store UI) ─┐
GS-02 (lib) ──────┤
GS-03 (components) ─┤──→ GS-05 (ci:check) ──→ GS-06 (coverage+push)
GS-04 (API) ──────┘
```

GS-01~04 可并行执行。
