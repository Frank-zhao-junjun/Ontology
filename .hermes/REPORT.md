# REPORT — 项目一收尾进度

> 最后更新: 2026-06-27

---

## ✅ 已完成

| # | 子目标 | 交付物 | 完成时间 |
|---|--------|--------|----------|
| — | Hermes 目标分解 | `.hermes/GOAL.md` · `GOALS.md` · `REPORT.md` | 2026-06-27 |
| — | GS-01（部分） | `tests/unit/ontology-store-ui.spec.ts` — **24 tests**（`setActiveModelType` / `setSelectedBusinessChainNode` / `resetProject` / `clearAllModels`） | 已存在 |
| — | GS-02 部分 | `chain-doc-prompt.spec.ts` · `manifest-validator-collect-ids.spec.ts` — **15 tests** | 2026-06-27 |
| — | GS-03 | `data-model-editor` 接入 `@/lib/data-model/helpers` + **25 tests**（TC-65~89） | 2026-06-27 |

---

## 🔄 当前进度

| 子目标 | 状态 | 进度 | 备注 |
|--------|:----:|:----:|------|
| GS-01 store UI 状态 | 🟡 | ~90% | `ontology-store-ui.spec.ts` 已覆盖主要 setter；store 无 `setLoading`/`setError` |
| GS-02 lib 函数 | 🟡 | ~50% | `chain-doc-prompt` 9 · `collect-manifest-ids` 6 tests 新增 |
| GS-03 组件测试 | ✅ | 100% | `helpers.ts` 新增索引/领域事件/元数据/列表/实体校验；editor 去重接入；**89 tests** in `data-model-helpers.spec.ts` |
| GS-04 API 路由 | 🟡 | ~70% | 新增 `projects/[id]` · `hr-sync/resolve-conflict` · `export/xlsx-from-manifest` · `export POST`（18 tests） |
| GS-05 ci:check | ✅ | 100% | **2026-06-27** `pnpm run ci:check` exit 0 |
| GS-06 覆盖+推送 | 🟡 | baseline | scoped unit coverage **42%**（距 80% 差 ~38pp） |

---

## 📊 Baseline（2026-06-27）

| 指标 | 值 |
|------|-----|
| `ci:check` | ✅ exit 0（lint · ts-check · unit · integration · e2e smoke · phase4） |
| **Scoped unit coverage** | `pnpm exec vitest run --coverage tests/unit` — **1249/1249 pass** |
| Statements | **42.07%** (4385/10422) |
| Branches | **34.03%** (3106/9127) |
| Functions | **36.08%** (1168/3237) |
| Lines | **42.88%** (3945/9198) |
| **距 80% 目标** | **~38pp**（以 statements/lines 计） |
| 测试规模（unit） | **1249 tests** · 149 files |
| 全量 `vitest run --coverage` | ⚠️ 1689 tests 中 27 failed（e2e/happy-dom teardown）；**GS-06 以 scoped unit 为准** |

### 覆盖率分层（scoped unit）

| 目录 | Statements | 主要缺口 |
|------|:----------:|----------|
| `src/lib/**` | ~75–99% | `ralph-loop` 30% · `superpowers/skills` 52% · `module-version/confirm-flow` 57% |
| `src/store/**` | **70%** | `ontology-store.ts` 主体 67% |
| `src/app/api/**` | 部分 | draft/generate/analyze 等路由仍低 |
| `src/components/**` | **~0%** | UI 组件几乎无单测 — **最大拖累** |
| `src/lib/data-model/helpers.ts` | **99%** | GS-03 已达标 |

**冲 80% 建议路径**（按 ROI）：
1. 继续 GS-03：behavior/event/epc 等 editor 纯函数提取 + 单测
2. GS-02/04：`ontology-store` 剩余 action · 未覆盖 API 路由
3. 评估是否将 `components/ui`（shadcn 壳）从 coverage include 排除，或仅测 ontology 业务组件
4. 修复 `parse-pptx-markitdown.ts` coverage parse 警告（Buffer 类型 / rolldown）

**未覆盖 API 路由（优先 GS-04）**：

- `analyze-document-model` · `generate-module-draft` · `generate-element-draft`
- `export` · `export/xlsx-from-manifest`
- `projects/[id]`（仅有 `projects` 列表）
- `hr-sync/resolve-conflict`（config/trigger/history 部分已有）
- `copilotkit`（有 `tests/unit/copilot/copilotkit-route.spec.ts`，可并入 GS-04 计数）

---

## 🚫 阻塞问题

| 问题 | 影响 | 状态 | 解决方案 |
|------|------|:----:|----------|
| 全量 coverage 跑挂 27 tests | GS-06 baseline 不准 | 🔄 | 先 `ci:check` 子集绿；全量失败多为 e2e/happy-dom 环境，单独排查 |
| 80% 与当前 ~15–20% 差距大 | GS-06 可能多轮 | ⚠️ | GS-02~04 并行冲量；组件大文件优先纯函数提取 |

---

## ⚠️ 风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|:----:|:----:|----------|
| 组件测试需渲染环境，setup 成本高 | 中 | GS-03 延期 | 优先提取纯函数，组件渲染测试放在最后 |
| 覆盖率距离 80% 差距可能较大 | 高 | GS-06 不达标 | 先跑稳定 baseline；必要时多轮 GS-02~04 |
| ci:check 中 e2e smoke 可能 flaky | 低 | GS-05 阻塞 | ci 已通过；全量 run 与 ci 子集分离 |

---

## 📋 下一步计划

- [x] 跑 `ci:check` 确认当前绿/红
- [x] 跑稳定 coverage baseline（`pnpm exec vitest run --coverage tests/unit` → **42%**）
- [x] GS-03: 组件纯函数提取+测试（data-model-editor 接入 helpers，**+25 tests**）

---

## ❓ 需要你确认的问题

- 全量 `vitest run --coverage` 与 `ci:check` 子集不一致时，**GS-06 验收以哪条命令为准**？（建议：`ci:check` + `vitest run --coverage --project unit` 或 scoped include）
- GS-01 目标中的 `setLoading`/`setError` 在 store 中不存在 — 是否从 GOALS.md 移除？
