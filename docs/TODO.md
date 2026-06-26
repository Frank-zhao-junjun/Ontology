# Ontology 项目待办清单

> 最后更新: 2026-06-19 (审计修正 · tsc 0 error · 48 test 全绿 · TD-01~03 resolved)
> 简化重构详情: [docs/ontology-simplification/](./ontology-simplification/)

---

## 一、本体建模简化重构（Phase 0–4）✅ 全部完成

> 2026-06-18 提交 `2d4327b`，191 文件，+18,858 / −2,349

已完成 14/14 User Story：

| Phase | US | 标题 | 状态 |
|-------|-----|------|------|
| 0 | US-S01 | ADR 编写（A→B→C→EPC + E1–E8） | ✅ |
| 0 | US-S02 | 类型骨架扩展（ValueDomain/Capability/Scenario/EpcProcess/MetaElement） | ✅ |
| 1 | US-S03 | 模块版本 store（draft/confirmed/archived + version pin） | ✅ |
| 1 | US-S04 | A/B/C/EPC 树导航（business-chain-tree + detail） | ✅ |
| 1 | US-S05 | saveEpc 流水线（upsert-inline + rebuildUsageIndex） | ✅ |
| 1.5 | US-S14 | 模块确认/归档 UI（confirm-flow + version-history） | ✅ |
| 2 | US-S06 | EPC 要素选择器（element-selector + epc-steps-editor） | ✅ |
| 2 | US-S07 | 要素库未引用视图（element-library + unreferenced） | ✅ |
| 2 | US-S08 | C 工作区（scenario-workspace） | ✅ |
| 3 | US-S09 | business-epc-linter（W-EPC-01~05 + warning-center） | ✅ |
| 3 | US-S10 | Excel 分模块导入导出（12 Sheet + Data Validation） | ✅ |
| 3 | US-S11 | AI 仅 draft 填充（generate-module-draft API） | ✅ |
| 4 | US-S12 | 遗留代码删除（legacy-audit + migration） | ✅ |
| 4 | US-S13 | compiler 迁移 + golden（compileSimplifiedChain） | ✅ |

**验证**：`ci:check` 全绿 · lint 0 error · ts-check pass · unit 405 · integration 100 · e2e smoke pass

---

## 二、EPC v3.1 简化架构升级（Phase A–D）

> 基于 [epc-v3.1-simplified-spec.md](./ontology-simplification/epc-v3.1-simplified-spec.md)
> 旧 71 条规则 → 44 条（W-EPC 17 + VM 22 + VX 10, 已去重）

| Phase | US | 状态 | 完成率 |
|-------|-----|------|--------|
| A | US-S15 W-EPC 06~17 | ✅ | 100% |
| B | US-S16 覆盖率仪表盘 | ✅ | 100% |
| C | [US-S17](./ontology-simplification/us/US-S17-cross-consistency.md) 交叉一致性 VX | ✅ | 100% |
| D | US-S18 EPC 推导 + Badge | ✅ | 100% |
| **合计** | | ✅ **完成** | **4/4 US（100%）** |

### 执行路线（Phase C → D，严格顺序）

```
US-S17-U02 修复测试  →  US-S17-U03/U04 Store+UI  →  US-S18 推导+Badge
     ✅ 完成                 ✅ 完成                    ✅ 完成
```

| 步骤 | Unit | 交付物 | 退出标准 | 状态 |
|:----:|------|--------|----------|:----:|
| **①** | **S17-U02** | [spec](./ontology-simplification/units/US-S17-U02-vx-unit-tests.md) + `tests/unit/epc-cross-consistency.spec.ts` | VX-01~12 共 **28 cases 全绿** | ✅ |
| **②** | **S17-U03** | [spec](./ontology-simplification/units/US-S17-U03-store-get-cross-consistency.md) + `ontology-store.ts` → `getCrossConsistency` | store 集成测试通过 | ✅ **4/4** |
| **②** | **S17-U04** | [spec](./ontology-simplification/units/US-S17-U04-epc-validation-panel.md) + `EpcValidationPanel`（VE / VM / VX 三栏） | 集成/E2E 可展示 VX 问题列表 | ✅ **3+1** |
| **③** | **S18-U01** | `src/lib/epc-derivation/` → `deriveEpcSteps` | 单元测试覆盖推导逻辑 | ✅ **12** |
| **③** | **S18-U02** | Store derive + apply | store 集成测试 | ✅ **5** |
| **③** | **S18-U03** | C 工作区「推导步骤」+「应用到 EPC」 | integration + e2e | ✅ **7+1** |
| **③** | **S18-U04** | 要素库 `ElementCoverageBadge` | integration + unit | ✅ **5** |

> **规则**：不得跳过 ① 开始 ②；不得 S17 未完成开始 S18。S16 已完成，为 S18-U03 Badge 提供 `getEpcCoverage` 基础。

**当前焦点**：🎉 EPC v3.1 全部完成（Phase A–D · 4/4 US · 412 tests）

---

### Phase A: US-S15 — W-EPC 扩展 06~17 ✅

| Unit | 标题 | 文件范围 | 状态 |
|------|------|----------|:----:|
| U01 | 类型扩展（rule IDs + MetaElement fields） | `types.ts`, `ontology.ts`, `linter.spec.ts` | ✅ |
| U02 | W-EPC-06~08（名称一致性、类型一致性、E2 密度） | `business-epc-linter/index.ts` | ✅ |
| U03 | W-EPC-09~11（E1 数据依赖、实体绑定、角色绑定） | 同上 | ✅ |
| U04 | W-EPC-12~14（事件起止、E2+E7 引用、语义元素引用） | 同上 | ✅ |
| U05 | W-EPC-15~17（State-Action/Transition-Event/GuardCondition） | 同上 | ✅ |
| U06 | WarningCenter UI 适配 | `warning-center.tsx` | ✅ 无需修改 |

**验证**：`tests/unit/business-epc-linter.spec.ts` — 42 cases

---

### Phase B: US-S16 — 覆盖率分析 + 仪表盘 ✅

| Unit | 标题 | 文件范围 | 状态 |
|------|------|----------|:----:|
| U01 | `lib/epc-coverage/`（`computeCoverage` 纯函数） | `src/lib/epc-coverage/` | ✅ |
| U02 | Store API（`getEpcCoverage`） | `ontology-store.ts` | ✅ |
| U03 | 覆盖率面板 UI（C 工作区仪表盘） | `epc-coverage-panel.tsx` + `scenario-workspace.tsx` | ✅ |
| U04 | 测试覆盖（TC01–TC08 对齐文档 + store/集成/E2E） | 见下方 | ✅ **16/16** |

**规格**：[us/US-S16-epc-coverage.md](./ontology-simplification/us/US-S16-epc-coverage.md) · 详见 `units/US-S16-U0*`

| 层级 | 文件 | 用例 |
|------|------|------|
| 单元 | `tests/unit/epc-coverage.spec.ts` | TC01–TC08 + 边界，10 |
| Store | `tests/unit/epc-coverage-store.spec.ts` | null/C未确认/50%/EPC未确认，4 |
| 集成 | `tests/integration/epc-coverage-panel.spec.tsx` | 仪表盘渲染 + 维度展开，1 |
| E2E smoke | `tests/e2e/epc-coverage.e2e.spec.ts` | 业务链 → C 覆盖率面板，1 |

**验证**：
```bash
npx vitest run tests/unit/epc-coverage*.spec.ts \
  tests/integration/epc-coverage-panel.spec.tsx \
  tests/e2e/epc-coverage.e2e.spec.ts
# 16/16 pass
```

---

### Phase C: US-S17 — 交叉一致性校验（VX）✅

| Unit | 标题 | 文件范围 | 状态 |
|------|------|----------|:----:|
| U01 | `validateCrossConsistency` 纯函数（VX-01~12） | `src/lib/epc-cross-consistency/` | ✅ ~560 LOC |
| U02 | 单元测试（VX-01~12 per-rule cases） | `tests/unit/epc-cross-consistency.spec.ts` | ✅ **28/28** |
| U03 | Store API（`getCrossConsistency` 暴露） | `ontology-store.ts` | ✅ **4/4** |
| U04 | 三栏校验面板（VE/VM/VX） | `epc-validation-panel.tsx` + `scenario-workspace.tsx` | ✅ **3+1** |

**验证（U04）**：
```bash
npx vitest run tests/integration/epc-validation-panel.spec.tsx \
  tests/e2e/epc-validation.e2e.spec.ts
# 4/4 pass（含 S16 覆盖率 VM tab 回归）
```

---

### Phase D: US-S18 — EPC 推导 + UI 增强 ✅

| Unit | 标题 | 文件范围 | 状态 |
|------|------|----------|:----:|
| U01 | `deriveEpcSteps` 纯函数 + helpers | `src/lib/epc-derivation/` | ✅ **12** |
| U02 | Store API（derive + apply） | `ontology-store.ts` | ✅ **5** |
| U03 | C 工作区推导/应用按钮 | `scenario-workspace.tsx` + `business-chain-detail.tsx` | ✅ **7+1** |
| U04 | 要素库覆盖率 Badge | `element-coverage-badge.tsx` + `element-library.tsx` | ✅ **5** |

**验证**：
```bash
npx vitest run tests/unit/epc-derivation.spec.ts \
  tests/unit/epc-derivation-store.spec.ts \
  tests/unit/epc-coverage-element.spec.ts \
  tests/integration/epc-derivation-workspace.spec.tsx \
  tests/integration/element-coverage-badge.spec.tsx \
  tests/e2e/epc-derivation.e2e.spec.ts
# 29/29 pass
```

---

## 三、测试与质量

- [x] **Q-T1**: 单元测试补充（简化重构 Phase 0–4 已覆盖）
- [x] **Q-T2a**: US-S15 linter 测试（`business-epc-linter.spec.ts` 42 cases）
- [x] **Q-T2b**: US-S16 覆盖率全层测试（unit 10 + store 4 + integration 1 + e2e 1 = **16**）
- [x] **Q-T2c**: US-S17 交叉一致性测试（`epc-cross-consistency.spec.ts` **28/28**）
- [x] **Q-T2d**: US-S18 推导 + Badge 测试（**29/29**）
|- [x] **Q-T3a**: 覆盖率配置修复 — 加入 components/hooks/API routes（2026-06-26）
|- [ ] **Q-T3b**: 覆盖率从 ~15-20% → 80%（持续进行，当前基线 15-20%）
  - 新增测试 7 cases（HR sync 4 + Agent skills 3）
  - 测试总量：**851**（unit 560+ · integration 146 · e2e 30 · inline 115）
  - 最大空白区域：store/ontology-store.ts (4432 lines, ~2% cov), API routes (17 routes, ~0%), components (23 files, ~0%)
  - 待做：为 API 路由和 store action 方法添加结构化测试

---

## 四、技术债务
- [x] **TD-01**: Next.js workspace root warning — uncommented `outputFileTracingRoot` in next.config.ts (2026-06-19)
- [x] **TD-02**: url.parse() deprecation warning — Next.js internal, not actionable from our codebase (2026-06-19)
- [x] **TD-03**: 首页组件代码质量优化 — verified: no `any` types, clean useEffect, reasonable sizes (2026-06-19)
- [x] **TD-04**: README.md 更新（2026-06-18 已完成）
- [x] **TD-05**: TODO.md 本文档同步（2026-06-18）

> ✅ **2026-06-19 技术债务全部清零** · `ci:check` 全绿 · lint 0 error · ts-check 0 error · unit 432 · integration 121 · e2e 15

---

## 五、优先级排序

| 优先级 | 任务 | 依赖 | 预估 | 状态 |
|--------|------|------|------|:----:|
| ✅ | S17-U04 三栏校验面板 | U03 ✅ | — | ✅ **3+1** |
| ✅ | S18-U01~U04 推导 + Badge | S17 ✅ | — | ✅ **29/29** |
| ✅ | US-S15 / US-S16 | — | — | ✅ |
| 🟢 P2 | Q-T3 测试覆盖率 80%+ | 全部 US | 中 | ⬜ |
| ✅ P3 | TD-01~03 技术债务 | 无 | 低 | ✅ 已解决 |

---

## 六、已完成 ✅

- [x] **P0–P5**: 完整元模型体系（数据/行为/规则/事件/流程/EPC/治理/指标/元数据/主数据/数据源/组织）
- [x] **P0**: 简化重构 ADR + 类型骨架（US-S01~S02）
- [x] **P1**: 业务树 + 版本门禁 + saveEpc（US-S03~S05）
- [x] **P1.5**: 模块确认/归档 UI（US-S14）
- [x] **P2**: EPC 编辑器 + 要素库（US-S06~S08）
- [x] **P3**: 警示 + Excel + AI（US-S09~S11）
- [x] **P4**: 清理 + Manifest（US-S12~S13）
- [x] **P5**: EPC v3.1 W-EPC 扩展（US-S15 U01–U06）
- [x] **P6**: Phase 1–3 缺失 Testing Case 补完（US-S07~S09 ×12 Units）
- [x] **P7**: EPC v3.1 覆盖率分析（US-S16 U01–U04，16 测试全绿）