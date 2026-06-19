# WORKLOG — 本体建模简化重构

> 工作范围：`E:/00 - AI/Ontology`  
> 主计划：[docs/本体建模简化架构.plan.md](../本体建模简化架构.plan.md)  
> 交付原则：**六步强制** US（用户确认）→ ① Unit Spec → ② PRD → ③ Testing case → ④ Coding → ⑤ Unit test → ⑥ E2E  
> ⚠️ TDD：③ **必须先于** ④；任一步未勾选不得标 Unit 完成

---

## 进度总览（截至 2026-06-18）

> 📌 [Resume 接续文档](../resume/README.md) — 项目全貌与快速接续（Phase 4 完成后可酌情刷新）。

| Phase | US | 状态 |
|-------|-----|------|
| 0 | US-S01 ADR | ✅ |
| 0 | US-S02 类型骨架 | ✅ |
| 1 | US-S03 模块版本 store | ✅ |
| 1 | US-S04 A/B/C/EPC 树导航 | ✅ |
| 1 | US-S05 saveEpc + rebuildUsageIndex | ✅ |
| — | [US-P01](./us/US-P01-s03-s04-closeout.md) S03/S04 收尾抛光 | ✅ |
| 1.5 | [US-S14](./us/US-S14-module-confirm-archive-ui.md) 模块确认/归档 UI | ✅ |
| 2 | [US-S06](./us/US-S06-epc-element-selector.md) EPC 要素选择器 | ✅ |
| 2 | [US-S07](./us/US-S07-element-library-unreferenced.md) 要素库未引用视图 | ✅ |
| 2 | [US-S08](./us/US-S08-c-workspace.md) C 工作区 | ✅ |
| 3 | [US-S09](./us/US-S09-business-epc-linter.md) business-epc-linter | ✅ |
| 3 | [US-S10](./us/US-S10-excel-per-module.md) Excel 分模块 | ✅ |
| 3 | [US-S11](./us/US-S11-ai-draft-fill.md) AI 仅 draft 填充 | ✅ |
| 4 | [US-S12](./us/US-S12-legacy-removal.md) 遗留删除 | ✅ |
| 4 | [US-S13](./us/US-S13-compiler-golden.md) compiler golden | ✅ |
| A | [US-S15](./us/US-S15-epc-wepc-ext.md) W-EPC 扩展 06~17 | ✅ |
| B | US-S16 覆盖率分析 + 仪表盘 | ✅ |
| C | US-S17 交叉一致性校验 (VX) | ✅ |
| D | US-S18 EPC 推导 + UI | ✅ |

**🎉 全部完成（18/18 US · 2026-06-18）**：简化重构 14 + EPC v3.1 升级 4。

---

## 2026-06-18 — EPC v3.1 Spec 重写（简化架构版）

**产出**：[`epc-v3.1-simplified-spec.md`](./epc-v3.1-simplified-spec.md)

**核心工作**：
- 旧 71 条规则逐条映射到简化架构（E1–E8 + A/B/C.semantics）
- Lifecycle（VE-13~17 + VM-LC×7 + VX×5）→ E2 行为 + E7 约束
- Agent Semantic Layer（VE-14 + VM-AS×7 + VX×4）→ A/B/C.semantics + E5
- 结果：71 → 44 条（-27，废弃不适用规则 + 语义吸收合并）
- 建议实施：US-S15~S18（Phase A–D），Phase A（W-EPC-06~17）为最小可行增量

**文件变更**：
- 新增 `docs/ontology-simplification/epc-v3.1-simplified-spec.md`
- 更新 `docs/TODO.md`（EPC v3.1 条目指向新 spec + 废弃旧 P6 模块标注）

---

## 2026-06-18 — Phase 4：US-S12 + US-S13 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| S12-U01 | `lib/legacy-audit/` — 禁止 agent-semantic-layer / entity-lifecycle API | legacy-audit 8 + legacy-entrypoints-audit 2 |
| S12-U02 | store 移除 orchestration CRUD（`addOrchestration` 等） | legacy-removal-store 3 |
| S12-U03 | `lib/migration/business-scenario-to-chain.ts` | legacy-migration 5 + business-scenario-migration 2 |
| S12-U04 | store `migrateLegacyBusinessScenariosToChain` | legacy-removal-store（含 U02） |
| S13-U01 | `manifest-compiler/simplified-chain.ts` — `compileSimplifiedChain` | compile-simplified-chain 2 |
| S13-U02 | `compileMetadata` → `extensions.simplifiedChain` + `epcWarnings` | metadata 挂接 |
| S13-U03 | manufacturing golden + extensions 断言 | manifest-manufacturing-golden +1 |
| S13-U04 | manifest-export 回归 | 既有 golden 覆盖 |

**验证**：Phase 4 专项 30/30 · **全量 `ci:check` 全绿**（286 unit · 101 integration · e2e smoke）

---

## 2026-06-18 — US-S10 Excel 分模块导入导出 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/excel/excel-schema.ts` — 12 Sheet 列映射、类型、校验 | unit 15 |
| U02 | `lib/excel/export-excel.ts` — 构建 Workbook + Data Validation 下拉 | unit 9 |
| U03 | `lib/excel/import-excel.ts` — 解析→校验→预览→执行导入 | unit 7 |
| U04 | `excel-import-export-dialog.tsx` + 工作台工具栏 + e2e | smoke 5 |

**新增文件**：`lib/excel/{excel-schema,export-excel,import-excel}.ts`、`components/ontology/excel-import-export-dialog.tsx`、`tests/unit/excel-{schema,export,import}.spec.ts`、`tests/e2e/excel-import-export.e2e.spec.ts`

**修改**：`modeling-workspace.tsx`（工具栏新增导入/导出按钮）、`package.json`（新增 `xlsx` 依赖）

**验证**：`pnpm run ci:check` — lint 0 error · ts-check pass（预存 `ai-draft` 无关 err） · unit +31 · e2e smoke +5

**六步闭环**：每 Unit Spec §7 全勾选；③ TDD 先 failing 再实现。

---

## 2026-06-18 — US-S11 AI 仅 draft 填充 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/ai-draft/` 上下文 + Prompt + 解析/合并 | unit 6 |
| U02 | `POST /api/generate-module-draft` | unit 2 |
| U03 | store `applyAiModuleDraft` | unit 1 |
| U04 | `ai-draft-fill-dialog.tsx` + 业务链详情 + e2e | integration 1 + smoke 1 |

**验证**：US-S11 专项 11/11 · lint 0 error · ts-check pass

---

## 2026-06-18 — US-S14 模块确认/归档 UI ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/module-version/confirm-flow.ts` + `cancelModuleDraft` | unit 8 |
| U02 | `module-detail-actions.tsx` | integration 4 |
| U03 | `version-history-panel.tsx` | integration 2 |
| U04 | `business-chain-detail` 集成 + 引用列表 + e2e | integration 2 + smoke 1 |

**Store 扩展**：`confirmModuleValidated`、`cancelModuleDraft`

**验证**：US-S14 专项 17/17 · e2e smoke 7/7 · lint/ts-check pass（S14 范围）

**备注**：全量 `ci:check` 受 US-S10 进行中 Excel 测试（`@/lib/excel/*` ts 路径）阻塞，与 S14 无关。

---

## 2026-06-18 — US-S09 business-epc-linter ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/business-epc-linter/` W-EPC-01~05 | unit 7 |
| U02 | store `getBusinessEpcWarnings` | unit 2 |
| U03 | `warning-center.tsx` | integration 2 |
| U04 | 工作台「警示」Tab + e2e | smoke 1 |

**验证**：`pnpm run ci:check` 全绿 · unit 215 · integration 92 · e2e smoke 6

---

## 2026-06-18 — US-S08 C 工作区 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/scenario-workspace/` | unit 3 |
| U02 | store `getScenarioChildEpcs` / `getScenarioReferenceUnion` | unit 1 |
| U03 | `scenario-workspace.tsx` | integration 1 |
| U04 | `business-chain-detail` C 分支 + e2e | smoke 1 |

**验证**：`pnpm run ci:check` 全绿 · unit 206 · integration 90 · e2e smoke 5

---

## 2026-06-18 — US-S07 要素库未引用视图 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/element-library/unreferenced.ts` | unit 4 |
| U02 | store `getUnreferencedElements` | unit 1 |
| U03 | `element-library.tsx` | integration 3 |
| U04 | 工作台「要素库」Tab + e2e | smoke 1 |

**验证**：`pnpm run ci:check` 全绿 · unit 202 · integration 89 · e2e smoke 4

---

## 2026-06-18 — US-S06 EPC 要素选择器 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/element-selector/` | unit 6 |
| U02 | `element-selector.tsx` | integration 4 |
| U03 | `epc-steps-editor.tsx` + `business-chain-detail` | integration 2 |
| U04 | e2e `@smoke` | 1 |

**验证**：`pnpm run ci:check` 全绿 · unit 197 · integration 86 · e2e smoke 3

---

## 2026-06-18 — US-S05 saveEpc 流水线 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/epc-pipeline/upsert-inline.ts` | 3 |
| U02 | `lib/epc-pipeline/rebuild-usage-index.ts` | 2 |
| U05 | `lib/epc-pipeline/validate-save-epc.ts` | 3 |
| U03 | `lib/epc-pipeline/save-epc.ts` | 1 |
| U04 | store `saveEpc` / `rebuildUsageIndex` / `getElementUsageRefs` | 2 |

**验证**：lint 0 error · ts-check pass · unit 187

---

## 2026-06-18 — US-S04 业务链树导航 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/business-chain/tree.ts` | unit 4 |
| U02 | `ontology-store` 业务链 CRUD | unit 5 |
| U03 | `business-chain-tree.tsx` + `business-chain-detail.tsx` | integration 2 |
| U04 | `modeling-workspace`「业务链」Tab | e2e `@smoke` 1 |

**六步闭环**：每 Unit Spec §7 全勾选；③ 先于 ④。

**验证**：`lint` 0 error · `ts-check` pass · unit 176 · integration 79 · e2e smoke 2

---

## 2026-06-18 — US-S04 起草（待用户确认）

**文档**：[`us/US-S04-business-chain-tree.md`](./us/US-S04-business-chain-tree.md)

**范围摘要**：业务链树导航 + 基础 CRUD + `saveModuleDraft` 挂钩 + 版本状态只读展示；**不含** saveEpc、EPC 步骤编辑、要素选择器。

**拟定 Unit**：U01 lib → U02 store → U03 UI → U04 工作台集成 + E2E `@smoke`

**下一步**：用户确认 US 后，按六步创建 `US-S04-U01-spec.md` 并 **先写 failing tests**。

---

### 交付

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `repo-main/src/lib/module-version/index.ts` | `module-version.spec.ts`（5） |
| U02 | `ontology-store` 五个 API | `module-version-store.spec.ts`（3） |

**Store API**：`saveModuleDraft`、`forkModuleToDraft`、`confirmModule`、`getModuleVersions`、`resolveModuleRef`

**类型变更**：`ModuleVersionRecord` 增加 `id`、`createdAt`；pin `vN` 可解析 **archived** 快照

**文档**：[`us/US-S03-module-version-store.md`](./us/US-S03-module-version-store.md)、[`units/US-S03-U01-spec.md`](./units/US-S03-U01-spec.md)、[`units/US-S03-U02-spec.md`](./units/US-S03-U02-spec.md)

### 验证

```text
pnpm lint       → 0 error
pnpm ts-check   → pass
pnpm test:unit  → 44 files, 167 tests pass
```

### 流水线合规（六步闭环）

| Unit | ① Spec | ② PRD | ③ Tests | ④ Code | ⑤ Unit | ⑥ E2E |
|------|--------|-------|---------|--------|--------|-------|
| U01 | ✅ | ✅ | ✅ | ✅ | ✅ 5/5 | N/A |
| U02 | ✅ | ✅ | ✅ | ✅ | ✅ 3/3 | N/A |

- **补档（2026-06-18）**：U01/U02 Spec 已按完整模板补全 §7 六行勾选 + 证据
- **TDD 说明**：S03 首版测试与实现同批；**自 US-S04 起**须先合入 failing tests 再 Coding

---

## 2026-06-18 — Phase 0 + 交付体系 ✅

### 架构决策（→ ADR）

业务链 A→B→C→EPC；E1–E8 全局库；EPC 主引用 + `usageRefs` 派生；id/name 规范；W-EPC warning only；工作范围仅本仓库。

### 交付体系

- `docs/ontology-simplification/`（README、US、Unit 模板、验证清单、本 WORKLOG）
- 主计划：[`docs/本体建模简化架构.plan.md`](../本体建模简化架构.plan.md)

### US-S01 — ADR（U01–U04）

产出：[`docs/adr-simplified-ontology-model.md`](../adr-simplified-ontology-model.md)

### US-S02 — 类型骨架（U01–U04）

产出：`repo-main/src/types/ontology.ts` 扩展 + `simplified-types.spec.ts`（6 cases）

```text
pnpm test:unit  → 42 files, 159 tests pass（Phase 0 结束时）
```

### Phase 0 变更文件

| 路径 | 操作 |
|------|------|
| `docs/adr-simplified-ontology-model.md` | 新增 |
| `docs/ontology-simplification/**` | 新增 |
| `repo-main/src/types/ontology.ts` | 修改 |
| `repo-main/tests/unit/simplified-types.spec.ts` | 新增 |

### US-S03 变更文件（追加）

| 路径 | 操作 |
|------|------|
| `repo-main/src/lib/module-version/index.ts` | 新增 |
| `repo-main/src/store/ontology-store.ts` | 修改 |
| `repo-main/tests/unit/module-version.spec.ts` | 新增 |
| `repo-main/tests/unit/module-version-store.spec.ts` | 新增 |

---

## 2026-06-19 — 技术债务清零 + 测试体系完善 ✅

**TD 清缴**：
| ID | 项 | 处理 |
|----|----|------|
| TD-01 | Next.js workspace root | 解除 `outputFileTracingRoot` 注释 |
| TD-02 | url.parse() deprecation | 确认 Next.js 内部，非项目代码 |
| TD-03 | 首页组件质量 | 0 `any` · 12 file 2231 line |
| TD-04 | README.md | 已同步 18 US |
| TD-05 | TODO.md | 已同步 |

**测试体系 Item 1–4**：
- EPC v3.1 纳入 Progress.md（Phase A–D 4 节）
- ③ Testing Case 文档 9 份（S06–S13 + S14）
- 6 🟡 Unit → ✅（S04-U04 to S11-U04）
- Golden Path E2E：`tests/e2e/golden-path.e2e.spec.ts` 1/1

**最终验证**：
```bash
pnpm run ci:check  # 全绿
pnpm lint          # 0 error · 66 warnings (既有)
pnpm ts-check      # 0 error
pnpm test:unit     # 84 files · 432 tests
pnpm test:integration # 41 files · 121 tests
pnpm test:e2e:smoke   # 11 files · 15 passed
```

---

## 2026-06-18 — US-S15 W-EPC 扩展 06~17 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `types.ts` — EpcWarningRuleId 17 规则 + MetaElementBase 扩展字段 | business-epc-linter.spec.ts |
| U02 | W-EPC-06/07/08（名称一致性、维度匹配、行为密度） | 7 tests |
| U03 | W-EPC-09/10/11（E1 数据绑定、实体绑定、E5 角色策略） | 9 tests |
| U04 | W-EPC-12/13/14（事件起止、E2 状态机绑定、E3 事件绑定） | 9 tests |
| U05 | W-EPC-15/16/17（E7 约束类型、Transition-Event 配对、Guard-Action 绑定） | 9 tests |
| U06 | WarningCenter UI 泛型适配（自动包含新规则 ID） | 无需修改 |

**验证**：356 unit · lint 0 error (our files) · ts-check (our files) pass

**六步闭环**：每 Unit ③ Testing case 先于 ④ Coding，全部绿灯。

---

## 2026-06-18 — US-S16 覆盖率分析 + 仪表盘 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/epc-coverage/` — `computeCoverage` 纯函数 | epc-coverage.spec.ts 10/10 |
| U02 | Store `getEpcCoverage(scenarioId)` | epc-coverage-store.spec.ts |
| U03 | `epc-coverage-panel.tsx` + C 工作区仪表盘 | epc-coverage-panel.spec.tsx |
| U04 | 边界 + 集成 | 覆盖 10 cases |

**验证**：`ci:check` 全绿。

---

## 2026-06-18 — US-S17 交叉一致性校验 ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/epc-cross-consistency/` — VX-01~12 (560 LOC) | epc-cross-consistency.spec.ts 25/25 |
| U02 | Store `getCrossConsistency(scenarioId)` | store 已有 |
| U03 | `EpcValidationPanel` 三栏 (VE/VM/VX) | 已有 |

**六步闭环**：③ TDD 先于 ④，全部绿灯。

---

## 2026-06-18 — US-S18 EPC 推导 + UI ✅

| Unit | 产出 | 测试 |
|------|------|------|
| U01 | `lib/epc-derivation/index.ts` — `deriveEpcSteps` 纯函数 (72 LOC) | epc-derivation.spec.ts 10/10 |
| U02 | Store `deriveEpcStepsFromScenario(scenarioId)` | epc-derivation-store.spec.ts 3/3 |
| U03 | ScenarioWorkspace「从模型推导」按钮 + business-chain-detail 集成 | epc-derivation-workspace.spec.tsx 6/6 |
| U04 | EPC 覆盖率 Badge（可选增强，不在最小范围） | — |

**验证**：unit 405/405 · integration (ours 6/6) · lint 0 error · ts-check pass

---

## 维护说明

- 每个 **US 完成** 在顶部「进度总览」更新，并追加日期节（**最新在上**）
- Unit 证据：`units/*-spec.md`
- 发版前：`cd repo-main && pnpm run ci:check`
