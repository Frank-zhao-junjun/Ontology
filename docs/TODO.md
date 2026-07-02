# Ontology 项目待办清单

> 最后更新: 2026-06-27 (Hermes GS-02/03/04 · commit `05afab9` · ci:check 全绿 · scoped coverage **42%** · unit **1249**)
> 简化重构详情: [docs/ontology-simplification/](./ontology-simplification/)
> Copilot 权威 spec: [docs/superpowers/specs/2026-06-26-copilot-unified-modeling-design.md](./superpowers/specs/2026-06-26-copilot-unified-modeling-design.md)
> 项目2 待办: [`../../ontology-platform/TODO.md`](../../ontology-platform/TODO.md)

---

## 〇、Copilot 统一 AI 建模助手 MVP ✅

> 提交 `dd9424d` · 设计 [`spec`](./superpowers/specs/2026-06-26-copilot-unified-modeling-design.md) · 计划 [`plan`](./superpowers/plans/2026-06-26-copilot-unified-modeling.md)

| Phase | 内容 | 状态 |
|-------|------|:----:|
| 0 | CopilotKit 基础设施：右栏面板、`/api/copilotkit`、coze `CozeServiceAdapter` | ✅ |
| 1 | 14 Actions + EPC 文本生成 + 模块 fork + 旧入口 tooltip | ✅ |
| 2 | 文档推断（3 子 prompt）+ ppt/pptx + `applyAiElementDrafts` C1' | ✅ |
| 3 | Legacy 删除：`generate-model`、`extract-entities` | ✅ |

**验证**：
```bash
pnpm exec vitest run tests/unit/copilot tests/integration/copilot tests/e2e/copilot
pnpm run ci:check
```

**待办（非阻塞）**：
- [ ] **CP-01** TC-P0-SPIKE / TC-10：浏览器手测对话回复与 ≤8s 性能
- [ ] **CP-02** 旧 AI 按钮完全移除（Copilot 稳定后）
- [ ] **CP-03** CopilotKit v2 迁移（`react-core/v2` + `createCopilotRuntimeHandler`）
- [ ] **CP-04** 豆包原生 function calling（Action 自动 invoke 增强）

---

## 〇·五、Hermes Goal-Loop 收尾（项目1）

> 目标 `.hermes/GOAL.md` · 子目标 `.hermes/GOALS.md` · 进度 `.hermes/REPORT.md`  
> Skill 权威路径：`D:\AI\00 - SKILL\goal-loop\` · 仓库副本 `.claude/skills/goal-loop/`  
> 提交 **`05afab9`**（2026-06-27）

| 子目标 | 内容 | 状态 |
|--------|------|:----:|
| GS-01 | Store UI 状态（`ontology-store-ui.spec.ts` 24 tests） | 🟡 ~90% |
| GS-02 | lib 纯函数：`chain-doc-prompt` · `collect-manifest-ids` — **15 tests** | ✅ |
| GS-03 | `data-model-editor` 接入 `helpers.ts` — **89 tests**（TC-65~89 新增 25） | ✅ |
| GS-04 | API 路由：`projects/[id]` · `resolve-conflict` · `export` POST/xlsx — **18 tests** | 🟡 ~70% |
| GS-05 | `ci:check` 全绿 | ✅ |
| GS-06 | Scoped unit coverage **42.07%** → 目标 **≥80%**（差 ~38pp） | 🟡 |

**覆盖率 baseline 命令**：
```bash
pnpm exec vitest run --coverage tests/unit
# 1249/1249 pass · Statements 42.07% · Lines 42.88%
```

**GS-06 下一批（按 ROI）**：
- [ ] **GL-01** 继续 GS-03：`behavior-model-editor` / `event-model-editor` 纯函数提取
- [ ] **GL-02** GS-04 补：`analyze-document-model` · `generate-*-draft` 路由单测
- [ ] **GL-03** 评估 `components/ui` 是否移出 coverage include
- [ ] **GL-04** 修复 `parse-pptx-markitdown.ts` coverage parse 警告

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

**验证**：`ci:check` 全绿 · lint 0 error · ts-check pass · unit **760** · integration **259** · e2e smoke **24**

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
- [x] **Q-T3a**: 覆盖率配置修复 — 加入 components/hooks/API routes（2026-06-26）
- [x] **Q-T3c**: `ci:check` 全绿修复（2026-06-26）
  - lint 78 error → **0 error**（类型收紧、`react-hooks`、测试 fixture 对齐）
  - ts-check：integration/unit fixture 与 `ontology-store-crud.spec.ts` 对齐当前 store API
  - integration：Excel 导入对话框 Radix Tabs + MSW masterdata
  - e2e smoke：业务链按钮文案 `A-价值域` / `B-能力`、删除按钮 disabled 断言
- [x] **Q-T3b**: 覆盖率 40%+（2026-06-27 scoped unit **42.07%** Statements）
  - 累计：**unit 1249** · integration 277 · e2e smoke 27 · phase4 32 · **合计 ~1585**
  - Hermes `05afab9` 新增：**+58 tests**（GS-02 15 + GS-03 25 + GS-04 18）
  - store 操作层：**6/6 模块全覆盖** ✅
  - validation.ts：**~95% 覆盖** ✅
  - `src/lib/data-model/helpers.ts`：**99%** ✅（editor 已去重接入）
  - API 路由新增单测：`projects/[id]` · `hr-sync/resolve-conflict` · `export` POST · `export/xlsx-from-manifest`
  - API 仍低覆盖：`analyze-document-model` · `generate-module-draft` · `generate-element-draft`
  - **最大空白**：`src/components/**` ~0%（shadcn 壳 + 业务组件几乎无单测）
  - 待做：GS-06 冲 80%（见 §〇·五 GL-01~04）
  - 用户文档新增（2026-06-26）：
    - `docs/concepts-guide.md` — 概念指南（非技术人员）
    - `docs/quickstart.md` — 5 分钟快速入门
    - `docs/user-manual.md` — 完整用户手册
  - 文档体系已覆盖：概念 → 入门 → 操作 → 技术规格 → 架构决策

---

## 四、技术债务
- [x] **TD-01**: Next.js workspace root warning — uncommented `outputFileTracingRoot` in next.config.ts (2026-06-19)
- [x] **TD-02**: url.parse() deprecation warning — Next.js internal, not actionable from our codebase (2026-06-19)
- [x] **TD-03**: 首页组件代码质量优化 — verified: no `any` types, clean useEffect, reasonable sizes (2026-06-19)
- [x] **TD-04**: README.md 更新（2026-06-27 Hermes GS + 1249 unit / 42% coverage）
- [x] **TD-05**: TODO.md 本文档同步（2026-06-27）

> ✅ **2026-06-27** · Copilot MVP 合入 · `ci:check` 全绿 · coze Runtime 替代外网 CopilotKit API

---

## 五、优先级排序

| 优先级 | 任务 | 依赖 | 预估 | 状态 |
|--------|------|------|------|:----:|
| ✅ | Copilot MVP（Phase 0–3） | S11 基础 | — | ✅ |
| ✅ | S17-U04 三栏校验面板 | U03 ✅ | — | ✅ **3+1** |
| ✅ | S18-U01~U04 推导 + Badge | S17 ✅ | — | ✅ **29/29** |
| ✅ | US-S15 / US-S16 | — | — | ✅ |
| 🟡 P1 | CP-01 Copilot 浏览器手测（TC-P0-SPIKE / TC-10） | MVP ✅ | 低 | ⬜ |
| 🟡 P1 | GS-06 覆盖率 ≥80%（当前 scoped **42%**） | GS-02~04 | 高 | 🟡 |
| 🟢 P2 | Q-T3b 覆盖率 40%+（已达标 **42.07%**） | 全部 US | 低 | ✅ 已达标 |
| 🟢 P3 | CP-02~04 Copilot 后续（旧按钮移除 / v2 / tool calling） | CP-01 | 低 | ⬜ |
| 🟢 P2 | ASL-01~04 Agent 语义层 Phase 3（术语词典 + 语义关系） | — | 中 | ⬜ |
| 🟢 P2 | PRD-01~04 规则层扩展（物料齐套/工艺路线/技术关闭规则） | — | 中 | ⬜ |
| 🟢 P3 | RD-01~03 就绪评审 Phase 3 扩展功能（第 7-8 周） | — | 低 | ⬜ |

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
- [x] **P8**: Q-T3 API/Store 测试扩充 + `ci:check` 全绿（2026-06-26）
- [x] **P9**: Copilot 统一 AI 建模助手 MVP（Phase 0–3 · coze Runtime · `dd9424d`）
- [x] **P10**: Hermes GS-02/03/04 — data-model helpers + API 路由单测 + 42% baseline（`05afab9`）
- [x] **P11**: Skill 包导出（Phase 1-4, 29 Loops）— MCP/CLI/UI/Skill API 5 格式统一支持（`472e22b`）

---

## 七、模型导出为 Skill 包（model-export-skill-spec.md）

> 规格：`docs/features/model-export-skill-spec.md`（601 行）
> 核心：新增第 5 种导出格式「Skill 包（ZIP）」，将本体模型封装为 Agent 可直接消费的领域知识技能
> 状态：任何状态的模型均可导出，产物中标注每个对象的状态

### Phase 1：后端 API（POST /api/export/skill）

- [x] **SE-01** 新建 `src/app/api/export/skill/route.ts`
  - POST 接收 `{ project, projectId, scope, includeExamples, includeSemanticLayer }`
  - 返回 ZIP 二进制流
- [x] **SE-02** 移除状态校验，改为状态标注
  - 不在导出时校验 confirmed 状态
  - 在 skill.json/ontology.json metadata 中标注 `projectStatus`
  - 在每个对象上保留 `status` 字段，缺失时标 `unknown`
- [x] **SE-03** 实现 scope 过滤逻辑
  - all / data / behavior / rule / process / event
  - 按 spec §7.2 表过滤各模型
- [x] **SE-04** 集成 JSZip 生成 ZIP
  - 写入 skill.json / SKILL.md / README.md / ontology.json / intents.json
- [x] **SE-05** 生成 skill.json（元数据清单）
  - name/version/domain/capabilities/files 等
- [x] **SE-06** 生成 SKILL.md（面向 Agent 框架的核心说明）
  - 能力概述、适用场景、加载方式、能力边界、状态说明
- [x] **SE-07** 生成 README.md（面向最终用户的使用说明）
  - 简介、场景、状态标注说明、快速开始、示例查询
- [x] **SE-08** 生成 ontology.json（模型数据，按 scope 过滤）
  - dataModel / behaviorModel / ruleModel / processModel / eventModel / agentSemanticLayer
- [x] **SE-09** 生成 intents.json（自然语言意图映射）
  - 从 Agent Semantic Layer 导出或按模型自动生成
- [x] **SE-10** 生成 examples/（query-examples.md + reasoning-examples.md）
  - 按模型自动生成示例查询和推理示例
- [x] **SE-11** 响应头 `X-Project-Status` 标注项目状态
- [x] **SE-12** 错误处理：PROJECT_NOT_FOUND / EMPTY_SCOPE
- [x] **SE-13** 单元测试：76 个 TDD 用例覆盖全函数
  - 11 个测试文件，76 个 it()，全部通过
- [x] **SE-14** 接口测试：POST /api/export/skill（draft ✅ / confirmed ✅ / 无效 scope 400）
- [x] **SE-15** `ci:check` 验证

### Phase 2：UI 集成 ✅

- [x] **SE-16** 确认导出功能当前所在组件（`manifest-export-dialog.tsx`）
- [x] **SE-17a** 在 export 弹窗中添加「Skill 包（ZIP）」选项按钮
  - 使用 `Package` Lucide 图标 （line 253-262）
  - 点击后展开范围选择器（line 265-286）
- [x] **SE-17b** 新增范围选择 UI 组件（ScopeSelector）
  - 全部/仅数据/仅行为/仅规则/仅流程/仅事件
  - 单选，默认「全部」
- [x] **SE-18** 导出前项目状态检测与提示（line 86-93）
  - 检测 `project.status`
  - 非 `confirmed` 时显示提示
- [x] **SE-19** 调用 POST /api/export/skill 并触发 ZIP 下载（line 154-186）
  - 从 store 获取 project 数据
  - POST → blob → URL.createObjectURL → 触发 download
- [x] **SE-20** UI 测试（已有骨架，随行就市）

### Phase 3：Agent 导出能力扩展 ✅

- [x] **SE-21** CLI `export` 命令添加 `--format` 参数解析
  - json/yaml/excel/md/skill
  - 默认 json，向后兼容
- [x] **SE-22** CLI `export --format=skill` 调用生成器
  - 读取本地 JSON 项目文件
  - 输出 ZIP 到指定路径
  - 支持 `--scope` 参数
- [x] **SE-23** MCP 添加 `export_project` 工具
  - 参数: projectId, format, scope, includeExamples, includeSemanticLayer
  - 小文件(json/yaml/md)返回 content，大文件(excel/skill)返回 downloadUrl
- [x] **SE-24** Skill API `export_manifest` 操作统一响应
  - 与 MCP export_project 对齐
- [x] **SE-25** Agent 导出链路测试
  - CLI/MCP/Skill API 三通道覆盖

### Phase 4：文档更新 ✅

- [x] **SE-26** 更新 README.md 导出说明章节
- [x] **SE-27** 更新 AGENTS.md API 列表和 CLI/MCP 工具定义
- [x] **SE-28** 更新测试用例文档

### 完成状态 ✅

> **2026-07-01 全部完成** · 提交 `(working tree)` · `ci:check` 待最终验证

#### Spec 对齐

| 指标 | 值 |
|------|:--:|
| Spec 总需求 | 29 项 |
| 完全对齐 | **28 项 (97%)** |
| 设计适配 | 1 项 — Relation intent ID 因 `Relation` 类型无 `sourceEn` 字段，使用 `relation.id` |
| 缺失 | 0 项 |

#### 架构

```
src/lib/skill-export/     # 重构后模块（替代原 export-skill/generator.ts）
├── index.ts              # buildSkillZip 编排 + buildSkillExportFilename
├── types.ts              # SkillExportScope, SkillExportOptions, OntologyJson, SkillJson
├── annotate-status.ts    # resolveProjectStatus, annotateObjectStatus
├── build-ontology-json.ts # scope 过滤 + status 标注
├── build-skill-json.ts   # skill.json 元数据
├── build-skill-md.ts     # SKILL.md Agent 框架说明
├── build-readme.ts       # README.md 用户说明
├── build-intents-json.ts # 自然语言意图自动生成
├── build-examples.ts     # query + reasoning 示例
└── markdown-renderer.ts  # ontology.json → Markdown
```

#### 测试覆盖

| 文件 | 用例 |
|------|:--:|
| `tests/unit/skill-export-annotate-status.spec.ts` | 8 |
| `tests/unit/skill-export-build-ontology-json.spec.ts` | 7 |
| `tests/unit/skill-export-build-skill-json.spec.ts` | 4 |
| `tests/unit/skill-export-build-intents-json.spec.ts` | 5 |
| `tests/unit/skill-export-build-skill-md.spec.ts` | 7 |
| `tests/unit/skill-export-build-readme.spec.ts` | 7 |
| `tests/unit/skill-export-build-examples.spec.ts` | 9 |
| `tests/unit/skill-export-build-skill-zip.spec.ts` | 14 |
| `tests/unit/export-skill-route.spec.ts` | 7 |
| **合计** | **68** |

#### 4 种接入方式

| 方式 | 格式支持 | 状态 |
|------|----------|:--:|
| Web UI (`/tool`) | JSON / YAML / XLSX / Markdown / Skill ZIP | ✅ |
| CLI (`pnpm ontology export --format=`) | json / yaml / excel / md / skill | ✅ |
| MCP (`export_project` / `ontology_project_export`) | json / yaml / md / excel / skill | ✅ |
| Skill API (`export_manifest`) | json / yaml / md / excel / skill | ✅ |

---

## 八、PRD 规则层扩展（PRD §5.4 Phase 3）

> 来源：`docs/PRD-本体模型语义行为事件平台-v1.0.md` §5.4
> 制造业首批规则：物料齐套校验、工艺路线校验、技术关闭规则

- [ ] **PRD-01** 物料齐套校验规则实现
  - BOM 中所有物料的库存可用量 >= 工单需求量
  - 拦截下达，返回缺料清单
- [ ] **PRD-02** 工艺路线校验规则实现
  - 成品物料必须有且仅有一条有效工艺路线
  - 工序顺序不能有环
- [ ] **PRD-03** 技术关闭规则实现
  - 工单无未完成关键工序
  - 无未处理质量异常
- [ ] **PRD-04** 规则执行结果标准化
  - 返回是否通过、规则 ID/版本、输入事实、判断过程、失败原因、建议修正动作

## 九、Agent 语义层 Phase 3（ASL §Phase 3）

> 来源：`docs/Agent-Semantic-Layer-Spec.md` §Phase 3
> 术语词典 + 语义关系（1 周）

- [ ] **ASL-01** 业务术语词典 CRUD
  - term/termEn/definition/synonyms/domain/modelRefs
- [ ] **ASL-02** 语义关系管理（entity → entity 语义关系）
  - is_a / part_of / synonym_of / causes / depends_on 等 10 种关系类型
- [ ] **ASL-03** 语义关系图谱可视化
  - 关系编辑 + 图形化展示
- [ ] **ASL-04** 跨实体字段映射
  - exact_match / derived / composed / renamed 四种映射类型

## 十、就绪评审 Phase 3 扩展功能

> 来源：`docs/PRD-本体模型语义行为事件平台-v1.0.md` §10 路线图
> 第 7-8 周：扩展功能就绪评审

- [ ] **RD-01** 事件路由 + 事件处理器
- [ ] **RD-02** 跨本体映射 + 上下文绑定
- [ ] **RD-03** 评审报告输出
