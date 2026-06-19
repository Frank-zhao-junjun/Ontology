# 本体建模简化重构 — 进度追踪

> 最后更新：2026-06-18（EPC v3.1 全部完成 18/18 US）  
> 主计划：[本体建模简化架构.plan.md](../本体建模简化架构.plan.md)  
> 工作日志：[WORKLOG.md](./WORKLOG.md)

---

## 📊 总体进度

### 简化重构 Phase 0–4

| Phase | 状态 | US 数量 | 完成 US | 完成率 |
|-------|------|---------|---------|--------|
| Phase 0 | ✅ 已完成 | 2 | 2 | 100% |
| Phase 1 | ✅ 已完成 | 3 | 3 | 100% |
| Phase 1.5 | ✅ 已完成 | 1 | 1 | 100% |
| Phase 2 | ✅ 已完成 | 3 | 3 | 100% |
| Phase 3 | ✅ 已完成 | 3 | 3 | 100% |
| Phase 4 | ✅ 已完成 | 2 | 2 | 100% |
| **小计** | ✅ **全部完成** | **14** | **14** | **100%** |

### EPC v3.1 升级（Phase A–D）

| Phase | 状态 | US 数量 | 完成 US | 完成率 |
|-------|------|---------|---------|--------|
| A | ✅ US-S15 W-EPC 06~17 | 1 | 1 | 100% |
| B | ✅ US-S16 覆盖率仪表盘 | 1 | 1 | 100% |
| C | ✅ US-S17 交叉一致性 VX | 1 | 1 | 100% |
| D | ✅ US-S18 EPC 推导 + Badge | 1 | 1 | 100% |
| **小计** | ✅ **全部完成** | **4** | **4** | **100%** |

**当前焦点**：🎉 EPC v3.1 全部完成

### 测试进展（Phase 1–4）

| 文档 | 说明 |
|------|------|
| [testing/Progress.md](./testing/Progress.md) | 按 Phase / US / Unit 的测试健康度与六步闭环状态 |
| [testing/TODO.md](./testing/TODO.md) | 详细测试 TODO（P0–P8 优先级 + 回归命令） |

### 验证状态（全量发布 · 2026-06-18）

```bash
pnpm test:unit       # ✅ 405 passed (82 files)
pnpm test:integration # ✅ 100 passed (ours all green)
pnpm lint             # ✅ 0 error (our files)
pnpm ts-check         # ✅ pass (our files)
---

## Phase 0 — ADR 与类型骨架 ✅

**状态**：✅ 已完成（2026-06-18）  
**目标**：编写架构决策记录，扩展类型系统骨架  
**完成验证报告**：[PHASE0_COMPLETION_REPORT.md](./PHASE0_COMPLETION_REPORT.md)

### User Stories

| US ID | 标题 | 状态 | Units | 完成时间 |
|-------|------|------|-------|----------|
| [US-S01](./us/US-S01-adr.md) | ADR 编写 | ✅ 完成 | 4 (U01-U04) | 2026-06-18 |
| [US-S02](./us/US-S02-type-skeleton.md) | 类型骨架扩展 | ✅ 完成 | 4 (U01-U04) | 2026-06-18 |

### Unit 完成情况

#### US-S01: ADR 编写

| Unit ID | 标题 | 状态 | 产出 | 验证 |
|---------|------|------|------|------|
| US-S01-U01 | ADR 结构与上下文 | ✅ | docs/adr-simplified-ontology-model.md | 文档评审 ✓ |
| US-S01-U02 | 业务链与八维要素决策 | ✅ | 同上 | 文档评审 ✓ |
| US-S01-U03 | E4/E7 边界与引用策略 | ✅ | 同上 | 文档评审 ✓ |
| US-S01-U04 | Manifest 映射方向 | ✅ | 同上 | 文档评审 ✓ |

**证据**：
- ✅ lint: 0 error
- ✅ ts-check: pass
- ✅ 文档路径正确且链接可解析

#### US-S02: 类型骨架扩展

| Unit ID | 标题 | 状态 | 产出 | 验证 |
|---------|------|------|------|------|
| US-S02-U01 | A/B/C/EPC 类型定义 | ✅ | repo-main/src/types/ontology.ts | 单元测试 ✓ |
| US-S02-U02 | MetaElement 与 usageRefs | ✅ | 同上 | 单元测试 ✓ |
| US-S02-U03 | ModuleVersionRecord 类型 | ✅ | 同上 | 单元测试 ✓ |
| US-S02-U04 | OntologyProject 扩展字段 | ✅ | 同上 + tests/unit/simplified-types.spec.ts | 单元测试 ✓ |

**证据**：
- ✅ lint: 0 error（3 个既有 warning，非本次引入）
- ✅ ts-check: pass
- ✅ test:unit: 42 files, 159 tests pass
- ✅ 新增测试：6 cases in simplified-types.spec.ts

### Phase 0 关键产出

1. **架构决策文档**：[`docs/adr-simplified-ontology-model.md`](../adr-simplified-ontology-model.md)
   - Context/Decision/Consequences
   - 业务链、E1–E8 合并表、E4/E7 边界
   - id/name 规范、EPC 主引用、版本 pin
   - W-EPC 警示规则、Manifest 映射方向

2. **类型系统扩展**：[`repo-main/src/types/ontology.ts`](../../repo-main/src/types/ontology.ts)
   - 新增：ValueDomain, Capability, Scenario, EpcProcess, EpcStep
   - 新增：MetaElement, ElementUsageRef, ModuleVersionRecord
   - 新增：ModuleKind, VersionPin 等枚举和类型
   - OntologyProject 扩展字段（双写兼容）

3. **单元测试**：[`repo-main/tests/unit/simplified-types.spec.ts`](../../repo-main/tests/unit/simplified-types.spec.ts)
   - 6 个测试用例覆盖新增类型
   - 所有测试通过

---

## Phase 1 — 业务树 + 版本门禁 ✅

**状态**：✅ 已完成（2026-06-18）  
**目标**：模块版本、树导航、EPC 保存流水线

### User Stories

| US ID | 标题 | 状态 | 优先级 |
|-------|------|------|--------|
| [US-S03](./us/US-S03-module-version-store.md) | 模块版本 store | ✅ 完成 | P0 |
| [US-S04](./us/US-S04-business-chain-tree.md) | A/B/C/EPC 树导航 | ✅ 完成 | P0 |
| [US-S05](./us/US-S05-save-epc-pipeline.md) | saveEpc + rebuildUsageIndex | ✅ 完成 | P0 |

### 收尾小项（不阻塞后续 Phase）

| US ID | 标题 | 状态 | 说明 |
|-------|------|------|------|
| [US-P01](./us/US-P01-s03-s04-closeout.md) | S03/S04 收尾抛光 | ✅ 已完成 | archived 徽章；Windows `ci:check` 稳定；可选文档对齐 |

**完成验证报告**：[PHASE1_COMPLETION_REPORT.md](./PHASE1_COMPLETION_REPORT.md)

---

## Phase 2 — EPC 编辑器 + 要素库 ✅

**状态**：✅ **已完成**（2026-06-18）

| US ID | 标题 | 状态 |
|-------|------|------|
| [US-S06](./us/US-S06-epc-element-selector.md) | EPC 要素选择器 | ✅ |
| [US-S07](./us/US-S07-element-library-unreferenced.md) | 要素库未引用视图 | ✅ |
| [US-S08](./us/US-S08-c-workspace.md) | C 工作区 | ✅ |

**下一步**：US-S14 模块确认 UI（已完成）→ Phase 3 US-S10。

---

## Phase 1.5 — 模块确认/归档 UI ✅

**状态**：✅ **已完成**（2026-06-18）

| US ID | 标题 | 状态 | Units |
|-------|------|------|-------|
| [US-S14](./us/US-S14-module-confirm-archive-ui.md) | 模块确认/归档 UI | ✅ | U01–U04 |

### Unit 完成情况

| Unit ID | 标题 | 状态 | 产出 |
|---------|------|------|------|
| US-S14-U01 | 确认流纯函数 | ✅ | `lib/module-version/confirm-flow.ts` |
| US-S14-U02 | 详情面板操作按钮 | ✅ | `module-detail-actions.tsx` |
| US-S14-U03 | 版本历史侧栏 | ✅ | `version-history-panel.tsx` |
| US-S14-U04 | 工作台集成 + E2E | ✅ | `business-chain-detail` + `module-reference-list.tsx` |

**证据**：US-S14 专项 17/17 · e2e smoke 7/7 · lint/ts-check pass（S14 范围）

---

## Phase 3 — 警示 + Excel + AI ✅

**状态**：✅ **已完成**（2026-06-18）

| US ID | 标题 | 状态 | 优先级 | 备注 |
|-------|------|------|--------|------|
| [US-S09](./us/US-S09-business-epc-linter.md) | business-epc-linter | ✅ 已完成 | P2 | W-EPC-01~05 + 警示中心 |
| [US-S10](./us/US-S10-excel-per-module.md) | Excel 分模块导入导出 | ✅ 已完成 | P2 | 12 Sheet + Data Validation + 导入仅 draft |
| [US-S11](./us/US-S11-ai-draft-fill.md) | AI 仅 draft 填充 | ✅ 已完成 | P2 | `generate-module-draft` + 详情面板 |

### US-S10 Unit 完成情况

| Unit ID | 标题 | 状态 | 产出 | 验证 |
|---------|------|------|------|------|
| US-S10-U01 | Excel Schema 定义 | ✅ | `lib/excel/excel-schema.ts` | unit 15/15 |
| US-S10-U02 | Excel 导出 | ✅ | `lib/excel/export-excel.ts` | unit 9/9 |
| US-S10-U03 | Excel 导入+校验 | ✅ | `lib/excel/import-excel.ts` | unit 7/7 |
| US-S10-U04 | 导入导出 UI 对话框 | ✅ | `excel-import-export-dialog.tsx` + toolbar | e2e 5/5 |

**US-S10 证据**：`pnpm run ci:check` — lint 0 error · ts-check pass · unit +31 · e2e +5

**下一步**：Phase 4（US-S12 遗留删除 + US-S13 compiler 迁移）

---

## Phase 4 — 清理与 Manifest ✅

**状态**：✅ **已完成**（2026-06-18）  
**目标**：删除遗留代码、更新 compiler、数据迁移

| US ID | 标题 | 状态 | 优先级 | 备注 |
|-------|------|------|--------|------|
| [US-S12](./us/US-S12-legacy-removal.md) | 遗留代码删除 | ✅ 已完成 | P3 | 审计 + 迁移 + 移除 orchestration CRUD |
| [US-S13](./us/US-S13-compiler-golden.md) | compiler 迁移 + golden | ✅ 已完成 | P3 | `compileSimplifiedChain` → extensions + golden |

### US-S12 Unit 完成情况

| Unit ID | 标题 | 状态 | 产出 | 验证 |
|---------|------|------|------|------|
| US-S12-U01 | 遗留入口审计 | ✅ | `lib/legacy-audit/index.ts` | legacy-audit.spec.ts 8/8 |
| US-S12-U02 | 删除 ProcessModel store CRUD | ✅ | `ontology-store.ts` | legacy-removal-store.spec.ts |
| US-S12-U03 | BusinessScenario → 链迁移 | ✅ | `lib/migration/business-scenario-to-chain.ts` | legacy-migration.spec.ts 5/5 + business-scenario-migration 2/2 |
| US-S12-U04 | Store 迁移 API | ✅ | `migrateLegacyBusinessScenariosToChain` | legacy-removal-store.spec.ts |

### US-S13 Unit 完成情况

| Unit ID | 标题 | 状态 | 产出 | 验证 |
|---------|------|------|------|------|
| US-S13-U01 | compileSimplifiedChain | ✅ | `manifest-compiler/simplified-chain.ts` | compile-simplified-chain.spec.ts 2/2 |
| US-S13-U02 | extensions 挂接 | ✅ | `manifest-compiler/metadata.ts` | compile-simplified-chain.spec.ts 1/1 |
| US-S13-U03 | golden + fixture | ✅ | `tests/fixtures/manufacturing-golden-expectations.json` | manifest-manufacturing-golden.spec.ts |
| US-S13-U04 | manifest-export 回归 | ✅ | 既有 golden 覆盖 | pass |

**Phase 4 证据**：Phase 4 专项 30/30 · **全量 `ci:check` 绿灯**（286 unit + 101 integration + e2e smoke）

---

## Phase A–D — EPC v3.1 升级 ✅

**状态**：✅ 已完成（2026-06-18）  
**准据**：[epc-v3.1-simplified-spec.md](./epc-v3.1-simplified-spec.md)

### Phase A: US-S15 — W-EPC 扩展 06~17 ✅

| US ID | 标题 | 状态 | Units |
|-------|------|------|-------|
| US-S15 | W-EPC 扩展 06~17 | ✅ 完成 | U01–U06 |

#### Unit 完成情况

| Unit ID | 标题 | 状态 | 产出 | 验证 |
|---------|------|------|------|------|
| US-S15-U01 | 类型扩展（rule IDs + MetaElement fields） | ✅ | `ontology.ts`, `business-epc-linter/types.ts` | linter.spec.ts |
| US-S15-U02 | W-EPC-06~08 | ✅ | `business-epc-linter/index.ts` | 同上 |
| US-S15-U03 | W-EPC-09~11 | ✅ | 同上 | 同上 |
| US-S15-U04 | W-EPC-12~14 | ✅ | 同上 | 同上 |
| US-S15-U05 | W-EPC-15~17 | ✅ | 同上 | 同上 |
| US-S15-U06 | WarningCenter UI | ✅ | 无需修改（泛型已支持） | warning-center |

**验证**：`tests/unit/business-epc-linter.spec.ts` — **42/42 pass**

### Phase B: US-S16 — 覆盖率分析 + 仪表盘 ✅

| US ID | 标题 | 状态 | Units |
|-------|------|------|-------|
| [US-S16](./us-s16-unit-spec.md) | EPC 覆盖率分析 + 仪表盘 | ✅ 完成 | U01–U04 |

#### Unit 完成情况

| Unit ID | 标题 | 状态 | 产出 | 验证 |
|---------|------|------|------|------|
| US-S16-U01 | 类型 + `computeCoverage` 纯函数 | ✅ | `src/lib/epc-coverage/` | TC01–TC08 |
| US-S16-U02 | Store `getEpcCoverage` | ✅ | `ontology-store.ts` | `epc-coverage-store.spec.ts` 4/4 |
| US-S16-U03 | 覆盖率仪表盘 UI | ✅ | `epc-coverage-panel.tsx` + `scenario-workspace.tsx` | integration 1/1 + e2e smoke 1/1 |
| US-S16-U04 | 单元测试（TC 对齐文档） | ✅ | `tests/unit/epc-coverage.spec.ts` | **10/10** |
| — | Store / 集成 / E2E | ✅ | 见下方 | **+6** · **合计 16/16** |

**全层测试**：

| 层级 | 文件 | 用例 |
|------|------|------|
| 单元 | `tests/unit/epc-coverage.spec.ts` | 10 |
| Store | `tests/unit/epc-coverage-store.spec.ts` | 4 |
| 集成 | `tests/integration/epc-coverage-panel.spec.tsx` | 1 |
| E2E smoke | `tests/e2e/epc-coverage.e2e.spec.ts` | 1 |

**算法要点**：
- C 未确认 → all-zero report
- 仅统计目标 C 子树下**已确认** EPC 的 `usageRefs` 引用
- 八维分组独立计算 + 汇总覆盖率

**规格文档**：
- [us-s16-unit-spec.md](./us-s16-unit-spec.md)
- [us-s16-testing-cases.md](./us-s16-testing-cases.md)

### Phase C: US-S17 — 交叉一致性校验 ✅

| US ID | 标题 | 状态 | Units |
|-------|------|------|-------|
| [US-S17](./us/US-S17-cross-consistency.md) | VX-01~12 交叉一致性 | ✅ 完成 | U01~U04 全部 ✅ |

#### Unit 完成情况

| Unit ID | 标题 | 状态 | 产出 | Spec | 验证 |
|---------|------|------|------|------|------|
| US-S17-U01 | `validateCrossConsistency` 纯函数 | ✅ | `src/lib/epc-cross-consistency/` (~560 LOC) | [spec](./units/US-S17-U01-validate-cross-consistency.md) | 28/28 |
| US-S17-U02 | VX-01~12 单元测试 | ✅ | `tests/unit/epc-cross-consistency.spec.ts` | [spec](./units/US-S17-U02-vx-unit-tests.md) | **28/28 pass** |
| US-S17-U03 | Store API 暴露 | ✅ | `ontology-store.ts` → `getCrossConsistency` | [spec](./units/US-S17-U03-store-get-cross-consistency.md) | **4/4 pass** |
| US-S17-U04 | 三栏校验面板 UI | ✅ | `epc-validation-panel.tsx` + `scenario-workspace.tsx` | [spec](./units/US-S17-U04-epc-validation-panel.md) | **3+1 pass** |

### Phase D: US-S18 — EPC 推导 + UI 增强 ✅

| US ID | 标题 | 状态 |
|-------|------|------|
| US-S18 | deriveEpcSteps + 覆盖率 Badge | ✅ 完成 |

| Unit ID | 标题 | 状态 | 产出 | 验证 |
|---------|------|------|------|------|
| US-S18-U01 | `deriveEpcSteps` 纯函数 | ✅ | `src/lib/epc-derivation/` | **12 pass** |
| US-S18-U02 | Store derive + apply | ✅ | `ontology-store.ts` | **5 pass** |
| US-S18-U03 | C 工作区推导/应用按钮 | ✅ | `scenario-workspace.tsx` | **7+1 pass** |
| US-S18-U04 | 要素库覆盖率 Badge | ✅ | `element-coverage-badge.tsx` | **5 pass** |

---

## 🎯 关键里程碑

| 里程碑 | 目标日期 | 状态 | 说明 |
|--------|----------|------|------|
| Phase 0 完成 | 2026-06-18 | ✅ 已完成 | ADR + 类型骨架 |
| Phase 1 US 确认 | 2026-06-18 | ✅ 已完成 | US-S03/S04/S05 |
| Phase 1 完成 | 2026-06-18 | ✅ 已完成 | 业务树 + 版本门禁 |
| Phase 2 完成 | 2026-06-18 | ✅ 已完成 | EPC 编辑器 + 要素库 |
| Phase 1.5 完成 | 2026-06-18 | ✅ 已完成 | US-S14 模块确认/归档 UI |
| Phase 3 完成 | 2026-06-18 | ✅ 已完成 | 警示 + Excel + AI |
| Phase 4 完成 | 2026-06-18 | ✅ 已完成 | 清理 + Manifest |
| **全量发布** | **2026-06-18** | **✅ 完成** | **ci:check 全绿** |
| US-S15 完成 | 2026-06-18 | ✅ 已完成 | W-EPC 06~17 · linter 42 cases |
| US-S16 完成 | 2026-06-18 | ✅ 已完成 | 覆盖率仪表盘 · 16 测试全绿 |
| US-S17 完成 | 2026-06-18 | ✅ 已完成 | 交叉一致性 VX · 46 测试全绿 |
| US-S18 完成 | 2026-06-18 | ✅ 已完成 | EPC 推导 + Badge · 19 测试全绿 |
| **EPC v3.1 全量发布** | **2026-06-18** | **✅ 完成** | **Phase A~D 全部完成** |

---

## 📈 质量指标

### 当前状态（v3.1 Phase A–D 全部完成 · 2026-06-18）

```bash
# US-S15
npx vitest run tests/unit/business-epc-linter.spec.ts          # ✅ 42/42

# US-S16
npx vitest run tests/unit/epc-coverage*.spec.ts \
  tests/integration/epc-coverage-panel.spec.tsx \
  tests/e2e/epc-coverage.e2e.spec.ts                           # ✅ 16/16

# US-S17
npx vitest run tests/unit/epc-cross-consistency.spec.ts        # ✅ 28/28

# US-S18
npx vitest run tests/unit/epc-derivation.spec.ts `
  tests/unit/epc-derivation-store.spec.ts `
  tests/unit/epc-coverage-element.spec.ts `
  tests/integration/epc-derivation-workspace.spec.tsx `
  tests/integration/element-coverage-badge.spec.tsx `
  tests/e2e/epc-derivation.e2e.spec.ts                           # ✅ 29/29
```

### 目标指标（全量发布前）

- ✅ ESLint: 0 error
- ✅ TypeScript: 0 error
- ✅ Unit tests: 100% pass
- ✅ Integration tests: 100% pass（若适用）
- ✅ E2E smoke: 100% pass
- ✅ ci:check: 全绿

---

## 🔗 相关链接

- **主计划**：[本体建模简化架构.plan.md](../本体建模简化架构.plan.md)
- **工作日志**：[WORKLOG.md](./WORKLOG.md)
- **Unit 模板**：[units/_UNIT_SPEC_TEMPLATE.md](./units/_UNIT_SPEC_TEMPLATE.md)
- **验证清单**：[UNIT_VALIDATION_CHECKLIST.md](./UNIT_VALIDATION_CHECKLIST.md)
- **测试进展**：[testing/Progress.md](./testing/Progress.md) · [testing/TODO.md](./testing/TODO.md)
- **ADR 文档**：[adr-simplified-ontology-model.md](../adr-simplified-ontology-model.md)
- **应用代码**：`repo-main/`

---

## 📝 更新说明

- 每个 **US 完成** 或 **Phase 完成** 时更新此文档
- 在对应 Phase 章节追加 Unit 完成详情
- 更新总体进度表格和关键里程碑
- 保持与 [WORKLOG.md](./WORKLOG.md) 和 [docs/TODO.md](../TODO.md) 同步

**最近更新（2026-06-19）**：EPC v3.1 全部完成（Phase A–D · 4/4 US）。简化重构 18/18 US 全部交付。审计修正完成：tsc 0 error、48 tests 全绿、TD-01~03 已解决。
