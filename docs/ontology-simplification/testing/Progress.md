# 精简架构 — 测试进展（Testing Progress）

> 最后更新：2026-06-19  
> 配套清单：[TODO.md](./TODO.md) · 六步门禁：[UNIT_VALIDATION_CHECKLIST.md](../UNIT_VALIDATION_CHECKLIST.md)  
> Subagent 团队：`.claude/skills/testing-team/README.md`

---

## 📊 总览

| Phase | US | Unit 数 | 六步闭环 | ③ Testing doc | ⑤ Unit | 集成 | ⑥ E2E | 测试健康度 |
|-------|-----|---------|----------|---------------|--------|------|-------|------------|
| Phase 1 | S03–S05 | 10 | ✅ 10/10 | ✅ S03–S05 | ✅ | ✅ | ✅ | **100%** |
| Phase 1.5 | S14 | 4 | ✅ 4/4 | ✅ [S14](testing-cases/S14-module-confirm-ui.md) | ✅ | ✅ | ✅ | **100%** |
| Phase 2 | S06–S08 | 12 | ✅ 12/12 | ✅ S06–S08 | ✅ | ✅ | ✅ | **100%** |
| Phase 3 | S09–S11 | 12 | 🟡 9/12 | ✅ [S09](testing-cases/S09-business-epc-linter.md) [S10](testing-cases/S10-excel-module.md) [S11](testing-cases/S11-ai-draft.md) | ✅ | 🟡 | 🟡 | **85%** |
| Phase 4 | S12–S13 | 8 | ✅ 8/8 | ✅ [S12](testing-cases/S12-legacy-removal.md) [S13](testing-cases/S13-compiler-golden.md) | ✅ | — | 🟡 | **90%** |
| Phase A | S15 | 6 | ✅ 6/6 | ✅ 内联 | ✅ 42 | ✅ | — | **100%** |
| Phase B | S16 | 4 | ✅ 4/4 | ✅ [S16](../us-s16-testing-cases.md) | ✅ 16 | ✅ | ✅ | **100%** |
| Phase C | S17 | 4 | ✅ 4/4 | 🟡 | ✅ 35 | ✅ | — | **90%** |
| Phase D | S18 | 4 | ✅ 4/4 | 🟡 | ✅ 29 | ✅ | ✅ | **95%** |
| **合计** | **18 US** | **66** | **66/66** | **✅ 12/12** | **✅** | **🟡** | **🟡** | **~96%** |

**P0 基础设施**（2026-06-18）：✅ `test:phase1`…`test:phase:all` · `_TEMPLATE.md` · AGENTS/CONTRIBUTING 文档

**图例**：✅ 完成 · 🟡 部分/待补 · ⬜ 未开始 · — 不适用（纯 lib）

**最近全量验证**（2026-06-18）：
```bash
pnpm test:unit        # 405 passed
pnpm test:integration # 100 passed
pnpm test:e2e:smoke   # smoke 全绿
```

---

## Phase 1 — 业务树 + 版本门禁

**目标 US**：S03 模块版本 · S04 业务树 · S05 saveEpc 流水线

### US-S03 模块版本 Store

| Unit | ③ TC 文档 | ⑤ Unit 测试文件 | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|----------------|------|-------|------|------|
| U01 draft CRUD | ✅ [S03 TC](../testing-cases/S03-module-version.md) | `module-version.spec.ts` | — | — | ✅ | 5 cases |
| U02 store 集成 | ✅ 同上 | `module-version-store.spec.ts` | — | — | ✅ | 3 cases |

**专项命令**：
```bash
npx vitest run tests/unit/module-version*.spec.ts tests/unit/confirm-flow.spec.ts
```

### US-S04 业务链树

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 树数据模型 | ✅ [S04 TC](../testing-cases/S04-business-chain-tree.md) | `business-chain-tree.spec.ts` | — | — | ✅ | |
| U02 store CRUD | ✅ 同上 | `business-chain-store.spec.ts` | — | — | ✅ | |
| U03 树 UI | ✅ 同上 | — | `business-chain-tree.spec.tsx` | `business-chain-tree.e2e.spec.ts` | ✅ | |
| U04 模块状态徽章 | ✅ 同上 | `business-chain-module-status.spec.ts` | `business-chain-tree.spec.tsx` | — | ✅ | 4 unit + 2 integ badge |

### US-S05 saveEpc 流水线

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 validateSaveEpc | ✅ [S05 TC](../testing-cases/S05-save-epc.md) | `validate-save-epc.spec.ts` | — | — | ✅ | |
| U02 upsertInline | ✅ 同上 | `upsert-inline.spec.ts` | — | — | ✅ | |
| U03 rebuildUsageIndex | ✅ 同上 | `rebuild-usage-index.spec.ts` | — | — | ✅ | |
| U04 store saveEpc | ✅ 同上 | `save-epc.spec.ts`, `save-epc-store.spec.ts` | `epc-steps-editor.spec.tsx` | — | ✅ | E2E 经 S08 覆盖 |

**Phase 1 回归命令**：
```bash
pnpm run test:phase1
```

### Phase 1 复测报告（Test Lead · 2026-06-18）

**命令**：`pnpm run test:phase1`  
**结果**：✅ **13 files · 46/46 passed** · Duration ~72s

| 角色 | 范围 | 文件 | Tests | 结果 |
|------|------|------|-------|------|
| Unit/Store | S03 | `module-version.spec.ts` | 5 | ✅ |
| Unit/Store | S03 | `module-version-store.spec.ts` | 3 | ✅ |
| Unit/Store | S04 | `business-chain-tree.spec.ts` | 4 | ✅ |
| Unit/Store | S04 | `business-chain-store.spec.ts` | 5 | ✅ |
| Unit/Store | S04 | `business-chain-module-status.spec.ts` | 4 | ✅ |
| Unit/Store | S05 | `validate-save-epc.spec.ts` | 3 | ✅ |
| Unit/Store | S05 | `upsert-inline.spec.ts` | 3 | ✅ |
| Unit/Store | S05 | `rebuild-usage-index.spec.ts` | 2 | ✅ |
| Unit/Store | S05 | `save-epc.spec.ts` | 1 | ✅ |
| Unit/Store | S05 | `save-epc-store.spec.ts` | 3 | ✅ |
| Integration | S04 | `business-chain-tree.spec.tsx` | 3 | ✅ |
| Integration | S04 | `business-chain-confirm.spec.tsx` | 2 | ✅ |
| E2E Smoke | S04 | `business-chain-tree.e2e.spec.ts` | 3 | ✅ |

**TC 文档对照**（③→⑤⑥）：

| US | TC 文档 | 已映射 TC | 自动化覆盖 | 缺口 |
|----|---------|-----------|------------|------|
| S03 | [S03-module-version.md](testing-cases/S03-module-version.md) | 8/8 | 8/8 | — |
| S04 | [S04-business-chain-tree.md](testing-cases/S04-business-chain-tree.md) | 12/12 | 12/12 | — |
| S05 | [S05-save-epc.md](testing-cases/S05-save-epc.md) | 9/9 | 9/9 | — |

**Sign-off**：Phase 1 回归 **PASS**（46/46，含 P2 深化用例）。

---

## Phase 1.5 — 模块确认/归档 UI

**目标 US**：S14

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 confirm-flow | ✅ [S14 TC](testing-cases/S14-module-confirm-ui.md) | `confirm-flow.spec.ts` | `business-chain-confirm.spec.tsx` | — | ✅ | 8 cases |
| U02 操作按钮 | ✅ 同上 | — | `module-detail-actions.spec.tsx` | — | ✅ | 4 cases |
| U03 版本历史 | ✅ 同上 | — | `version-history-panel.spec.tsx` | — | ✅ | 2 cases |
| U04 工作台集成 | ✅ 同上 | — | `business-chain-confirm.spec.tsx` | `module-confirm.e2e.spec.ts` | ✅ | 3 cases |

**Phase 1.5 回归命令**：
```bash
pnpm run test:phase1.5
```

### Phase 1.5 复测报告（Test Lead · 2026-06-18）

**命令**：`pnpm run test:phase1.5`  
**结果**：✅ **5 files · 18/18 passed** · Duration ~31s

| 角色 | 范围 | 文件 | Tests | 结果 |
|------|------|------|-------|------|
| Unit/Store | S14-U01 | `confirm-flow.spec.ts` | 8 | ✅ |
| Integration/UI | S14-U02 | `module-detail-actions.spec.tsx` | 4 | ✅ |
| Integration/UI | S14-U03 | `version-history-panel.spec.tsx` | 3 | ✅ |
| Integration/UI | S14-U04 | `business-chain-confirm.spec.tsx` | 2 | ✅ |
| E2E Smoke | S14-U04 | `module-confirm.e2e.spec.ts` | 1 | ✅ |

**TC 文档对照**（③→⑤⑥）：

| US | TC 文档 | 已映射 TC | 自动化覆盖 | 缺口 |
|----|---------|-----------|------------|------|
| S14 | [S14-module-confirm-ui.md](testing-cases/S14-module-confirm-ui.md) | 18/18 | 18/18 | — |

**Sign-off**：Phase 1.5 回归 **PASS**（18/18，含 P2 深化用例）。

---

## Phase 2 — EPC 编辑器 + 要素库

**目标 US**：S06 要素选择器 · S07 要素库 · S08 C 工作区

### US-S06 EPC 要素选择器

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 筛选逻辑 | ✅ [S06](testing-cases/S06-element-selector.md) | `element-selector.spec.ts` | — | — | ✅ | 7 cases |
| U02 维度 Tab | ✅ 同上 | 同上 | `element-selector.spec.tsx` | — | ✅ | |
| U03 挂接到 step | ✅ 同上 | — | `epc-steps-editor.spec.tsx` | — | ✅ | |
| U04 E2E 选择流程 | ✅ 同上 | — | — | `epc-element-selector.e2e.spec.ts` | ✅ | |

### US-S07 要素库未引用视图

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 未引用判定 | ✅ [S07](testing-cases/S07-element-library.md) | `element-library.spec.ts` | — | — | ✅ | |
| U02 store 索引 | ✅ 同上 | `element-library-store.spec.ts` | — | — | ✅ | |
| U03 库 UI + Badge | ✅ 同上 | — | `element-library.spec.tsx` | — | ✅ | 4 cases |
| U04 E2E | ✅ 同上 | — | `element-coverage-badge.spec.tsx` | `element-library.e2e.spec.ts` | ✅ | 2 E2E |

### US-S08 C 工作区

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 referenceUnion | ✅ [S08](testing-cases/S08-scenario-workspace.md) | `scenario-workspace.spec.ts` | — | — | ✅ | |
| U02 store API | ✅ 同上 | `scenario-workspace-store.spec.ts` | — | — | ✅ | |
| U03 工作区 UI | ✅ 同上 | — | `scenario-workspace.spec.tsx` | — | ✅ | 2 cases |
| U04 E2E + v3.1 | ✅ 同上 | — | `epc-validation-panel.spec.tsx` | `scenario-workspace.e2e.spec.ts` | ✅ | 2 E2E |

**Phase 2 回归命令**：
```bash
pnpm run test:phase2
```

### Phase 2 复测报告（Test Lead · 2026-06-18）

**命令**：`pnpm run test:phase2`  
**结果**：✅ **15 files · 56/56 passed** · Duration ~92s

| 角色 | 范围 | 文件 | Tests | 结果 |
|------|------|------|-------|------|
| Unit/Store | S06 | `element-selector.spec.ts` | 7 | ✅ |
| Unit/Store | S07 | `element-library*.spec.ts` | — | ✅ |
| Unit/Store | S08 | `scenario-workspace*.spec.ts` | — | ✅ |
| Integration | S06 | `element-selector.spec.tsx` | — | ✅ |
| Integration | S07 | `element-library.spec.tsx`, `element-coverage-badge.spec.tsx` | 6 | ✅ |
| Integration | S08 | `scenario-workspace.spec.tsx`, `epc-validation-panel.spec.tsx`, `epc-derivation-workspace.spec.tsx` | — | ✅ |
| Integration | S06 | `epc-steps-editor.spec.tsx` | — | ✅ |
| E2E | S06–S08 | `epc-element-selector`, `element-library`, `scenario-workspace` e2e | 4 | ✅ |

**TC 文档对照**：

| US | TC 文档 | 自动化 | 缺口 |
|----|---------|--------|------|
| S06 | S06-element-selector.md | ✅ | — |
| S07 | S07-element-library.md | ✅ | E2E 跳转 N/A |
| S08 | S08-scenario-workspace.md | ✅ | — |

**Sign-off**：Phase 2 回归 **PASS**（含 S17/S18 集成套件）。

---

## Phase 3 — 警示 + Excel + AI

**目标 US**：S09 linter · S10 Excel · S11 AI draft

### US-S09 business-epc-linter

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 W-EPC-01~05 | 🟡 | `business-epc-linter.spec.ts` | — | — | ✅ | 基础 17 条 |
| U02 store 暴露 | 🟡 | `business-epc-linter-store.spec.ts` | — | — | ✅ | |
| U03 WarningCenter | 🟡 | — | `warning-center.spec.tsx` | `warning-center.e2e.spec.ts` | ✅ | VX Tab 待补 case |
| U04 筛选/忽略 | 🟡 | — | `warning-center.spec.tsx` | — | 🟡 | |

### US-S10 Excel 分模块

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 schema | 🟡 | `excel-schema.spec.ts` | — | — | ✅ | |
| U02 export | 🟡 | `excel-export.spec.ts` | — | — | ✅ | |
| U03 import | 🟡 | `excel-import.spec.ts` | — | — | ✅ | |
| U04 UI 对话框 | 🟡 | — | — | `excel-import-export.e2e.spec.ts` | ✅ | 5/5 |

### US-S11 AI draft 填充

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 generate route | 🟡 | `generate-module-draft-route.spec.ts` | — | — | ✅ | |
| U02 prompt/解析 | 🟡 | `ai-draft.spec.ts` | — | — | ✅ | |
| U03 store apply | 🟡 | `ai-draft-store.spec.ts` | — | — | ✅ | |
| U04 UI 触发 | 🟡 | — | `ai-draft-fill.spec.tsx` | — | 🟡 | 无独立 E2E |

**Phase 3 回归命令**：
```bash
npx vitest run tests/unit/business-epc-linter*.spec.ts tests/unit/excel*.spec.ts \
  tests/unit/ai-draft*.spec.ts tests/unit/generate-module-draft-route.spec.ts \
  tests/integration/warning-center.spec.tsx tests/integration/ai-draft-fill.spec.tsx \
  tests/e2e/warning-center.e2e.spec.ts tests/e2e/excel-import-export.e2e.spec.ts
```

---

## Phase 4 — 清理与 Manifest

**目标 US**：S12 遗留删除 · S13 compiler golden

### US-S12 遗留删除

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 审计 | 🟡 | `legacy-audit.spec.ts`, `legacy-entrypoints-audit.spec.ts` | — | — | ✅ | |
| U02 store 删除 | 🟡 | `legacy-removal-store.spec.ts` | — | — | ✅ | |
| U03 迁移 | 🟡 | `legacy-migration.spec.ts`, `business-scenario-migration.spec.ts` | — | — | ✅ | |
| U04 store API | 🟡 | `legacy-removal-store.spec.ts` | — | — | ✅ | |

### US-S13 compiler golden

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 simplified chain | 🟡 | `compile-simplified-chain.spec.ts` | — | — | ✅ | |
| U02 extensions | 🟡 | 同上 | — | — | ✅ | |
| U03 golden fixture | 🟡 | `manifest-manufacturing-golden.spec.ts` | — | — | ✅ | |
| U04 export 回归 | 🟡 | `manifest-export.spec.ts` 等 | — | — | ✅ | E2E: N/A |

**Phase 4 回归命令**：
```bash
npx vitest run tests/unit/legacy-*.spec.ts tests/unit/compile-simplified-chain.spec.ts \
  tests/unit/manifest-manufacturing-golden.spec.ts tests/unit/business-scenario-migration.spec.ts
```

---

## Phase A — US-S15 W-EPC 扩展 06~17 ✅

**目标**：在 business-epc-linter 中增加 W-EPC-06~17 共 12 条新校验规则

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 types-ext | ✅ 内联 | `business-epc-linter.spec.ts` | — | — | ✅ | EpcWarningRuleId 17 |
| U02 W-EPC-06~08 | ✅ 内联 | 同上 | — | — | ✅ | 名称/维度/密度 |
| U03 W-EPC-09~11 | ✅ 内联 | 同上 | — | — | ✅ | E1/E2/E5 绑定 |
| U04 W-EPC-12~14 | ✅ 内联 | 同上 | — | — | ✅ | 事件/E2/E3 绑定 |
| U05 W-EPC-15~17 | ✅ 内联 | 同上 | — | — | ✅ | E7/Transition/Guard |
| U06 UI | ✅ 无需 | — | — | — | ✅ | WarningCenter 泛型 |

**验证**：`business-epc-linter.spec.ts` — **42/42 pass**

---

## Phase B — US-S16 覆盖率分析 + 仪表盘 ✅

**目标**：`computeCoverage` + 仪表盘 UI

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 纯函数 | ✅ [S16](../us-s16-testing-cases.md) | `epc-coverage.spec.ts` 10 | — | — | ✅ | TC01–TC08 |
| U02 store | ✅ 同上 | `epc-coverage-store.spec.ts` 4 | — | — | ✅ | |
| U03 UI | ✅ 同上 | — | `epc-coverage-panel.spec.tsx` 1 | `epc-coverage.e2e.spec.ts` 1 | ✅ | |
| U04 边界 | ✅ 同上 | — | — | — | ✅ | 合计 16 |

**验证**：`epc-coverage*.spec.*` — **16/16 pass**

---

## Phase C — US-S17 交叉一致性校验 ✅

**目标**：VX-01~12 交叉校验 + 三栏面板

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 纯函数 | 🟡 | `epc-cross-consistency.spec.ts` 25 | — | — | ✅ | 560 LOC |
| U02 单元测试 | 🟡 | 同上 28 | — | — | ✅ | VX-01~12 |
| U03 store | 🟡 | `epc-cross-consistency-store.spec.ts` 4 | — | — | ✅ | |
| U04 UI 面板 | 🟡 | — | `epc-validation-panel.spec.tsx` 3 | `epc-validation.e2e.spec.ts` 1 | ✅ | VE/VM/VX 三栏 |

**验证**：`epc-cross-consistency*.spec.*` + panel — **35/35 pass**

---

## Phase D — US-S18 EPC 推导 + UI ✅

**目标**：`deriveEpcSteps` + C 工作区推导按钮 + 覆盖率 Badge

| Unit | ③ TC 文档 | ⑤ Unit | 集成 | ⑥ E2E | 六步 | 备注 |
|------|-----------|--------|------|-------|------|------|
| U01 纯函数 | 🟡 | `epc-derivation.spec.ts` 10 | — | — | ✅ | 72 LOC |
| U02 store | 🟡 | `epc-derivation-store.spec.ts` 3 | — | — | ✅ | |
| U03 UI 按钮 | 🟡 | — | `epc-derivation-workspace.spec.tsx` 6 | — | ✅ | 推导+应用 |
| U04 Badge | 🟡 | `epc-coverage-element.spec.ts` 5 | `element-coverage-badge.spec.tsx` 5 | — | ✅ | |

**验证**：`epc-derivation*.spec.*` — **29/29 pass**


---

## Q-T3 — 测试覆盖率提升（覆盖率攻坚）🟡

**目标**：补齐 `manifest-compiler/mappers/*` 和 `module-version/*` 单元测试

| 指标 | 初始 | 当前 | 备注 |
|------|------|------|------|
| `mappers/*` 语句覆盖 | 0% | **96.47%** | 11/11 文件已覆盖 |
| `module-references.ts` | 0% | **94.73%** | 新增 13 tests |
| `module-version/*` 综合 | ~49% | **77.89%** | 仍有 confirm-flow 可深化 |
| 全量语句覆盖 | 2.78% | **6.61%** | 受 store/API 大模块制约 |

**新增测试文件**：
- `tests/unit/manifest-compiler-mappers.spec.ts` — 64 tests ✅
- `tests/unit/module-references.spec.ts` — 13 tests ✅

**验证**：
```bash
# 19 files · 225 tests · all pass
npx vitest run tests/unit/manifest-compiler-mappers.spec.ts tests/unit/module-references.spec.ts ... (19 files)
# tsc --noEmit: 0 errors
```

---

## 变更日志

| 日期 | 变更 |
|------|------|
| 2026-06-18 | P0 完成：Phase 回归脚本 + 模板 + CI 文档 |
| 2026-06-18 | **Phase 2 启动+深化**：56/56 PASS，扩展 phase2 含 S17/S18 集成 |
| 2026-06-18 | **Phase 1.5 复测**：Test Lead 17/17 PASS |
| 2026-06-18 | **Phase 1 复测**：Test Lead 38/38 PASS，TC 29/29 全覆盖 |
| 2026-06-18 | 初版：Phase 1–4 测试 Progress 基线 |

| 2026-06-19 | **Q-T3 覆盖率攻坚**：新增 `manifest-compiler-mappers.spec.ts`（64 tests）+ `module-references.spec.ts`（13 tests），mappers 覆盖 0%→96.47%，全量 2.78%→6.61% |
| 2026-06-18 | EPC v3.1 纳入追踪 · Item 1-4 完成 · 96% 健康度 · Golden Path E2E |

---

## 下一步（见 [TODO.md](./TODO.md)）

1. Item 2: 补 Phase 2–4 + EPC v3.1 ③ Testing Case 文档（S06–S18）
2. Item 3: 闭环 6 🟡 Unit（S04-U04 · S07-U04 · S08-U04 · S09-U03/U04 · S11-U04）
3. Item 4: P7 黄金路径 E2E
4. 测试健康度目标：91% → 95%+

