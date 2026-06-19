# 精简架构 — 测试 TODO List

> 最后更新：2026-06-18  
> 进展追踪：[Progress.md](./Progress.md)  
> 六步门禁：[UNIT_VALIDATION_CHECKLIST.md](../UNIT_VALIDATION_CHECKLIST.md)

---

## 使用说明

1. **每个 Unit** 按六步门禁推进：`Spec → PRD → ③Testing case → Coding → ⑤Unit test → ⑥E2E`
2. 完成一项在 [Progress.md](./Progress.md) 更新对应单元格，并在本文件勾选 `[x]`
3. 建议用 **Subagent 测试团队** 分工（见 `.claude/skills/testing-team/`）：
   - **test-lead**：排期、Progress 更新、回归门禁
   - **test-designer**：补 ③ testing-cases.md
   - **unit-store-tester**：⑤ lib/store 单测
   - **integration-ui-tester**：集成 + 组件
   - **e2e-smoke-tester**：⑥ Playwright smoke
   - **domain-rule-tester**：W-EPC / VX / VM 规则用例

---

## P0 — 基础设施（一次性）

- [x] **T-00-01** 在 `package.json` 增加 Phase 回归脚本 → `scripts/test-phase.sh` + `test:phase1`…`test:phase:all`
- [x] **T-00-02** 在 `docs/ontology-simplification/PROGRESS.md` 增加「测试进展」链接 → `./testing/Progress.md`
- [x] **T-00-03** 建立 `testing-cases` 模板 → `testing/testing-cases/_TEMPLATE.md`
- [x] **T-00-04** CI 文档：`AGENTS.md` + `CONTRIBUTING.md` 注明 Phase 回归命令

---

## P1 — ③ Testing Case 文档补全

> 现状：仅 `us-s16-testing-cases.md` 有独立 TC 文档；其余 Unit 依赖 Spec §5，标记为 🟡

### Phase 1

- [x] **T-P1-S03** US-S03 两 Unit → [testing-cases/S03-module-version.md](./testing-cases/S03-module-version.md)
- [x] **T-P1-S04** US-S04 四 Unit → [testing-cases/S04-business-chain-tree.md](./testing-cases/S04-business-chain-tree.md)
- [x] **T-P1-S05** US-S05 四 Unit → [testing-cases/S05-save-epc.md](./testing-cases/S05-save-epc.md)

### Phase 1.5

- [x] **T-P1.5-S14** US-S14 四 Unit → [testing-cases/S14-module-confirm-ui.md](./testing-cases/S14-module-confirm-ui.md)

### Phase 2

- [x] **T-P2-S06** US-S06 → [testing-cases/S06-element-selector.md](./testing-cases/S06-element-selector.md)
- [x] **T-P2-S07** US-S07 → [testing-cases/S07-element-library.md](./testing-cases/S07-element-library.md)
- [x] **T-P2-S08** US-S08 → [testing-cases/S08-scenario-workspace.md](./testing-cases/S08-scenario-workspace.md)

### Phase 3

- [x] **T-P3-S09** US-S09 → [testing-cases/S09-business-epc-linter.md](./testing-cases/S09-business-epc-linter.md)
- [x] **T-P3-S10** US-S10 → [testing-cases/S10-excel-module.md](./testing-cases/S10-excel-module.md)
- [x] **T-P3-S11** US-S11 → [testing-cases/S11-ai-draft.md](./testing-cases/S11-ai-draft.md)

### Phase 4

- [x] **T-P4-S12** US-S12 → [testing-cases/S12-legacy-removal.md](./testing-cases/S12-legacy-removal.md)
- [x] **T-P4-S13** US-S13 → [testing-cases/S13-compiler-golden.md](./testing-cases/S13-compiler-golden.md)

---

## P2 — Phase 1 测试深化

### US-S03 模块版本

- [x] **T-P1-S03-U02-01** `module-version.spec.ts`：fork 后 `latest_confirmed` 仍指向 confirmed 非 draft
- [x] **T-P1-S03-U04-01** store：无 draft 时 `confirmModule` 抛错
- [x] **T-P1-S03-E2E-01** 与 S14 `module-confirm.e2e` 合并覆盖

### US-S04 业务链树

- [x] **T-P1-S04-U04-01** integration：树选中 ↔ 详情路径/徽章联动
- [x] **T-P1-S04-E2E-01** E2E：深层树展开 + 选中持久化
- [x] **T-P1-S04-E2E-02** E2E：有子节点时隐藏删除按钮

### US-S05 saveEpc

- [x] **T-P1-S05-U01-01** `validate-save-epc`：重复 step id / 空 id
- [x] **T-P1-S05-U04-01** `save-epc-store`：usageRefs 与 element-library 未引用筛选一致
- [x] **T-P1-S05-REG-01** 跑 Phase 1 回归命令 → **38/38 pass**（2026-06-18）

---

## P3 — Phase 1.5 测试深化

- [x] **T-P1.5-S14-REG-01** 重跑 `test:phase1.5` → **17/17 pass**（2026-06-18）
- [x] **T-P1.5-S14-INT-01** `version-history-panel`：archive 后列表排序 draft→confirmed→archived
- [x] **T-P1.5-S14-INT-02** `scenario-workspace`：C 未 confirm 时禁用「应用到 EPC」

---

## P4 — Phase 2 测试深化

### US-S06 要素选择器

- [x] **T-P2-S06-U01-01** 空库 / 无匹配筛选边界 → `element-selector.spec.ts`
- [x] **T-P2-S06-E2E-01** 回归 `epc-element-selector.e2e.spec.ts` ✅

### US-S07 要素库

- [x] **T-P2-S07-U03-01** integration：`ElementCoverageBadge` 已覆盖/未覆盖
- [x] **T-P2-S07-E2E-01** E2E：Tab 切换 + Badge 可见性
- [x] **T-P2-S07-E2E-02** — N/A（要素库无跳转 EPC 步骤交互，仅有 focusTarget API）

### US-S08 C 工作区

- [x] **T-P2-S08-INT-01** integration：`EpcValidationPanel` 与子 EPC/引用并集共存
- [x] **T-P2-S08-INT-02** 纳入 phase2：`epc-derivation-workspace.spec.tsx` + `epc-validation-panel.spec.tsx`
- [x] **T-P2-S08-E2E-01** E2E：场景工作区 + 校验面板 smoke
- [x] **T-P2-S08-REG-01** 跑 Phase 2 回归 → **56/56 pass**

---

## P5 — Phase 3 测试深化

### US-S09 business-epc-linter

- [ ] **T-P3-S09-DOC-01** W-EPC-06~17 与 `business-epc-linter.spec.ts` 用例一一对照表
- [ ] **T-P3-S09-U03-01** integration：`warning-center` VX Tab 切换 + 严重级别排序
- [ ] **T-P3-S09-U03-02** integration：scenario 未 confirm 时 VX 空态
- [ ] **T-P3-S09-U04-01** 忽略/筛选 warning 持久化（localStorage）
- [ ] **T-P3-S09-E2E-01** 回归 `warning-center.e2e.spec.ts`

### US-S10 Excel

- [ ] **T-P3-S10-U03-01** import：分 module Sheet 缺失时的错误信息
- [ ] **T-P3-S10-E2E-01** 回归 `excel-import-export.e2e.spec.ts` 5/5
- [ ] **T-P3-S10-E2E-02** 大文件（>5MB）拒绝上传

### US-S11 AI draft

- [ ] **T-P3-S11-INT-01** `ai-draft-fill.spec.tsx`：mock API 失败 toast
- [ ] **T-P3-S11-E2E-01** 新增 smoke：打开 AI 填充对话框（不调用真实 LLM）
- [ ] **T-P3-S11-REG-01** 跑 Phase 3 回归命令

---

## P6 — Phase 4 测试深化

### US-S12 遗留删除

- [ ] **T-P4-S12-U01-01** `legacy-entrypoints-audit`：确认已删 API 无残留 import
- [ ] **T-P4-S12-U03-01** 旧项目 JSON 迁移后 businessScenarios 完整性
- [ ] **T-P4-S12-REG-01** legacy + migration 全量单测

### US-S13 compiler golden

- [ ] **T-P4-S13-U03-01** golden fixture 变更时更新流程文档化
- [ ] **T-P4-S13-U04-01** manifest export 与 simplified chain 字段对齐断言
- [ ] **T-P4-S13-REG-01** 跑 Phase 4 回归命令

---

## P7 — 跨 Phase 回归与门禁

- [ ] **T-REG-01** 全量 `pnpm run ci:check` 通过并记录日期到 Progress.md
- [ ] **T-REG-02** Phase 1→2→3→4 顺序回归（发现跨 Phase 耦合问题）
- [x] **T-REG-03** 黄金路径 E2E → `tests/e2e/golden-path.e2e.spec.ts` · 1/1 pass · A→B→C→EPC + linter 零 error
- [ ] **T-REG-04** Excel 导入 → confirm → 导出 manifest 往返 E2E
- [ ] **T-REG-05** 性能基线：linter 1000 step 场景 < 2s（可选 benchmark）

---

## P8 — Subagent 测试团队试点

- [ ] **T-TEAM-01** test-lead：按 Phase 分配 sprint，每周更新 Progress.md
- [ ] **T-TEAM-02** test-designer：优先 S09 W-EPC 矩阵 + S08 工作区 TC 文档
- [ ] **T-TEAM-03** domain-rule-tester：VX-01~09 与 S17 交叉一致性用例对照
- [ ] **T-TEAM-04** e2e-smoke-tester：实现 T-REG-03 黄金路径
- [ ] **T-TEAM-05** 复盘：试点 1 个 US 后更新 `testing-team/README.md` 工作流

---

## 附录 A — 六步闭环检查表（48 Units 简表）

| Phase | US | U01 | U02 | U03 | U04 |
|-------|-----|-----|-----|-----|-----|
| 1 | S03 | ✅ | ✅ | ✅ | ✅ |
| 1 | S04 | ✅ | ✅ | ✅ | 🟡 |
| 1 | S05 | ✅ | ✅ | ✅ | ✅ |
| 1.5 | S14 | ✅ | ✅ | ✅ | ✅ |
| 2 | S06 | ✅ | ✅ | ✅ | ✅ |
| 2 | S07 | ✅ | ✅ | ✅ | ✅ |
| 2 | S08 | ✅ | ✅ | ✅ | ✅ |
| 3 | S09 | ✅ | ✅ | 🟡 | 🟡 |
| 3 | S10 | ✅ | ✅ | ✅ | ✅ |
| 3 | S11 | ✅ | ✅ | ✅ | 🟡 |
| 4 | S12 | ✅ | ✅ | ✅ | ✅ |
| 4 | S13 | ✅ | ✅ | ✅ | ✅ |

**🟡 待办集中**：S09-U03/U04、S11-U04

---

## 附录 B — 测试文件索引（Phase 1–4）

<details>
<summary>点击展开完整路径</summary>

### Phase 1
- `tests/unit/module-version.spec.ts`
- `tests/unit/module-version-store.spec.ts`
- `tests/unit/confirm-flow.spec.ts`
- `tests/unit/business-chain-store.spec.ts`
- `tests/unit/business-chain-tree.spec.ts`
- `tests/unit/business-chain-module-status.spec.ts`
- `tests/unit/save-epc.spec.ts`
- `tests/unit/save-epc-store.spec.ts`
- `tests/unit/validate-save-epc.spec.ts`
- `tests/unit/rebuild-usage-index.spec.ts`
- `tests/unit/upsert-inline.spec.ts`
- `tests/integration/business-chain-tree.spec.tsx`
- `tests/integration/business-chain-confirm.spec.tsx`
- `tests/e2e/business-chain-tree.e2e.spec.ts`

### Phase 1.5
- `tests/integration/module-detail-actions.spec.tsx`
- `tests/integration/version-history-panel.spec.tsx`
- `tests/e2e/module-confirm.e2e.spec.ts`

### Phase 2
- `tests/unit/element-selector.spec.ts`
- `tests/unit/element-library.spec.ts`
- `tests/unit/element-library-store.spec.ts`
- `tests/unit/scenario-workspace.spec.ts`
- `tests/unit/scenario-workspace-store.spec.ts`
- `tests/integration/element-selector.spec.tsx`
- `tests/integration/element-library.spec.tsx`
- `tests/integration/scenario-workspace.spec.tsx`
- `tests/integration/epc-steps-editor.spec.tsx`
- `tests/e2e/epc-element-selector.e2e.spec.ts`
- `tests/e2e/element-library.e2e.spec.ts`
- `tests/e2e/scenario-workspace.e2e.spec.ts`

### Phase 3
- `tests/unit/business-epc-linter.spec.ts`
- `tests/unit/business-epc-linter-store.spec.ts`
- `tests/unit/excel-schema.spec.ts`
- `tests/unit/excel-export.spec.ts`
- `tests/unit/excel-import.spec.ts`
- `tests/unit/ai-draft.spec.ts`
- `tests/unit/ai-draft-store.spec.ts`
- `tests/unit/generate-module-draft-route.spec.ts`
- `tests/integration/warning-center.spec.tsx`
- `tests/integration/ai-draft-fill.spec.tsx`
- `tests/e2e/warning-center.e2e.spec.ts`
- `tests/e2e/excel-import-export.e2e.spec.ts`

### Phase 4
- `tests/unit/legacy-audit.spec.ts`
- `tests/unit/legacy-entrypoints-audit.spec.ts`
- `tests/unit/legacy-removal-store.spec.ts`
- `tests/unit/legacy-migration.spec.ts`
- `tests/unit/business-scenario-migration.spec.ts`
- `tests/unit/compile-simplified-chain.spec.ts`
- `tests/unit/manifest-manufacturing-golden.spec.ts`

</details>

---

## 附录 C — EPC v3.1（S15–S18）✅ 已纳入主体系

> 2026-06-18 已全部纳入 [Progress.md](./Progress.md) Phase A–D 追踪 · 4 US · 18 Unit · 六步全 ✅

- [x] **T-V31-S15** W-EPC-06~17 + types-ext · 42/42 pass
- [x] **T-V31-S16** `us-s16-testing-cases.md` · 16/16 pass
- [x] **T-V31-S17** cross-consistency + validation panel · 35/35 pass
- [x] **T-V31-S18** derivation + badge · 29/29 pass


---

## Q-T3 — 测试覆盖率提升至 80%+

> 目标：`manifest-compiler/mappers/*` 和 `module-version/*` 单元测试覆盖

- [x] **Q-T3-01** `manifest-compiler-mappers.spec.ts` — 64 tests，覆盖 utils/enums/rules/metrics/transaction-boundaries/business-scenarios/domain-events/actions/side-effects/state-machines/object-types 共 11 个 mapper 文件
- [x] **Q-T3-02** `module-references.spec.ts` — 13 tests，覆盖 listIncomingModuleReferences / listOutgoingModuleReferences
- [x] **Q-T3-03** `manifest-compiler/mappers/*` 语句覆盖率：0% → **96.47%**（行覆盖率 96.87%）
- [x] **Q-T3-04** `module-version/module-references.ts` 语句覆盖率：0% → **94.73%**（行覆盖率 97.91%）
- [x] **Q-T3-05** `module-version/*` 综合语句覆盖率：49% → **77.89%**（行覆盖率 50% → 77.45%）
- [x] **Q-T3-06** 全量语句覆盖率：2.78% → **6.61%**（行覆盖率 3.04% → 7.05%），新增 2 个测试文件，77 tests

> 注：全量 80%+ 目标受 `ontology-store.ts`（4,236 行 0% 覆盖）、`epc-generator/index.ts`（1,065 行）、API routes 等大模块制约。下一步建议拆分 store 或专项攻坚。

### Q-T3 文件清单

- `tests/unit/manifest-compiler-mappers.spec.ts` — 新增 · 64 tests · 覆盖 11/11 mapper 文件
- `tests/unit/module-references.spec.ts` — 新增 · 13 tests · 覆盖 module-references.ts


---

## 完成标准

| 里程碑 | 标准 |
|--------|------|
| Phase 测试完成 | 该 Phase 所有 Unit 六步 ✅ + 回归命令全绿 |
| 文档完成 | 10 份 US 级 testing-cases 或 Spec §5 审计签字 |
| 发布门禁 | T-REG-01 + T-REG-03 黄金路径 E2E 通过 |

