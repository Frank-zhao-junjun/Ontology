# Ontology 项目接续文档 (Resume)

> 最后更新: 2026-06-18 19:30 CST
> 当前 commit: `95458fb` — `test(manifest): P0-12 manufacturing golden compile-validate test (#22)`
> 仓库根: `E:\00 - AI\Ontology`
> 代码根: `E:\00 - AI\Ontology\repo-main`

---

## 0. 一句话项目概要

**Ontology** 是一个面向企业建模的本体建模平台（Next.js + TypeScript + Vite test），已建成 **12 大模型体系**：数据模型、行为模型、规则模型、事件模型、流程模型、元数据、主数据、治理、指标、数据源、组织体系（含岗位）、Agent 语义层，外加 **EPC 全域关联层**（5 节点 × 12 模型关联矩阵，71 条双向校验规则）。

当前正在执行 **本体建模简化重构**（Phase 0–4），已完成 Phase 0–3（US-S01~S09 + US-S14），**US-S10 进行中**（Excel 分模块导入导出）。

---

## 1. 目录结构速览

```
E:\00 - AI\Ontology\
├── docs/                              ← 规格文档 + 简化重构文档
│   ├── ontology-simplification/        ← 简化重构 US/Unit Spec/进度
│   │   ├── WORKLOG.md                 ← 按日期记录，最新在上
│   │   ├── PROGRESS.md               ← 各 US + CI 质量统计
│   │   ├── us/                        ← 每个 US 的完整规格
│   │   ├── units/                     ← 每个 Unit 的 Spec
│   │   └── README.md
│   ├── resume/                         ← 本目录 (接续文档)
│   ├── progress.md                    ← 主项目进度 (P1–P6)
│   ├── TODO.md                        ← 待办清单 (P1–简化重构)
│   ├── ADR-*.md / *-Spec.md          ← 各类规格 + ADR
│   └── 本体建模简化架构.plan.md
│
├── repo-main/                         ← 🔥 核心代码仓库
│   ├── src/
│   │   ├── app/                       ← Next.js 路由 + API
│   │   │   ├── api/                   ← 20+ API 路由
│   │   │   └── page.tsx              ← 首页
│   │   ├── components/
│   │   │   └── ontology/              ← 🔥 核心 UI 组件 (约40个文件)
│   │   │       ├── modeling/          ← 建模工作台 + 各模型编辑器
│   │   │       ├── epc/               ← EPC 编辑器 + 画布
│   │   │       ├── organization/      ← 组织/岗位/HR同步
│   │   │       └── shared/            ← 共享组件
│   │   ├── lib/                        ← 🔥 核心逻辑库
│   │   │   ├── element-library/       ← US-S07 要素库
│   │   │   ├── scenario-workspace/    ← US-S08 C 工作区
│   │   │   ├── element-selector/      ← US-S06 EPC 要素选择器
│   │   │   ├── epc-pipeline/          ← US-S05 saveEpc 流水线
│   │   │   ├── business-chain/        ← US-S04 业务链树
│   │   │   ├── module-version/        ← US-S03 模块版本
│   │   │   ├── business-epc-linter/   ← US-S09 警示中心
│   │   │   ├── excel/                 ← US-S10 Excel 分模块 (进行中)
│   │   │   ├── validator/             ← 71+ 条校验规则
│   │   │   └── epc-generator/         ← EPC 推导算法
│   │   ├── store/
│   │   │   └── ontology-store.ts      ← 🔥 统一状态管理 (~1800行)
│   │   └── types/
│   │       └── ontology.ts            ← 🔥 类型定义 (~905行/23KB)
│   └── tests/
│       ├── unit/                       ← 单元测试 (约70个文件)
│       ├── integration/               ← 集成测试 (约30个文件)
│       └── e2e/                        ← e2e smoke 测试 (7个)
```

---

## 2. 类型体系总览 (src/types/ontology.ts, ~905行)

### 2.1 12 大模型体系

| # | 模型 | 核心类型 | 关键特性 |
|---|------|----------|----------|
| 1 | **数据模型** | Entity, Property, Relation, ComputedProperty, SourceMapping | 9 种数据类型, 聚合根/子实体, 计算属性 |
| 2 | **行为模型** | StateMachine, State, Transition, Action, SideEffect, TransactionBoundary, RetryPolicy | 状态机, guardCondition, compensationAction |
| 3 | **规则模型** | Rule(5类), RuleVersion, GrayscaleRule | 字段级/跨字段/跨实体/聚合/时序, 版本化 |
| 4 | **事件模型** | DomainEvent, EventSubscription, TransactionPhase, IdempotencyKey | 领域事件, 事务阶段, 幂等 |
| 5 | **流程模型** | BusinessProcess, ProcessStep, DecisionPoint | 流程编排 |
| 6 | **元数据** | Metadata | 57 条标准元数据 (本地化) |
| 7 | **主数据** | MasterData, MasterDataRecord | 动态表列 |
| 8 | **治理** | GovernanceRole, Permission, AgentPolicy | 角色权限 |
| 9 | **指标** | Metric, Indicator, MetricsModel | 公式 |
| 10 | **数据源** | DataSource(API/DB/File) | 三模式配置 |
| 11 | **组织体系** | Department, Position, PositionResponsibility, HRSyncConfig | 部门树, 结构化职责, HR 同步 |
| 12 | **Agent语义层** | Intent, SlotFilling, DialogContext, SemanticRelation, BusinessTerm, ErrorRecovery, TemporalValidity, SemanticFieldMapping, AgentPolicy | 9 大子模型, 完备性评估 |

### 2.2 简化重构新增类型 (US-S02)

```typescript
// 业务链
export interface BusinessChain {
  id: string;
  name: string;
  description?: string;
  children: BusinessChain[];
}

// 模块版本
export interface ModuleVersionRecord {
  id: string;
  entityId: string;
  entityType: ModuleEntityType;  // 'data' | 'behavior' | 'rules' | 'process' | 'events' | 'epc' | 'businessScenario'
  version: number;
  status: 'draft' | 'validated' | 'archived';
  snapshot: unknown;
  createdAt: string;
}

// 8 维度元要素
export type MetaDimension = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
export interface MetaElement extends MetaElementBase {
  id: string;
  name: string;
  dimension: MetaDimension;
  description?: string;
}

// EPC 步骤 + 要素引用
export interface EpcStep {
  id: string;
  name: string;
  elementRef?: EpcStepElementRef;  // E1–E8 引用
}

export interface EpcProcess extends BusinessNodeBase {
  scenarioId: string;
  steps: EpcStep[];
}

// 场景 (业务场景 = C 节点)
export interface Scenario extends BusinessNodeBase {
  businessScenarioId: string;
}

// usageRefs 用法索引
export interface UsageIndexEntry {
  elementId: string;
  usedBy: Array<{ entityId: string; entityType: string; stepIndex?: number }>;
}
```

### 2.3 关键枚举

| 枚举 | 值 | 用途 |
|------|-----|------|
| `MetaDimension` | E1–E8 | 8 维度元要素分类 |
| `ModuleEntityType` | data/behavior/rules/process/events/epc/businessScenario | 模块类型 |
| `BusinessNodeType` | 'A' / 'B' / 'C' / 'EPC' | 四级业务链节点 |
| `EpcModelRefModelType` | 12种 | EPC 关联引用 |
| `EpcModelRefRole` | 16种 | EPC 引用角色 |

---

## 3. Store 总览 (src/store/ontology-store.ts, ~1800行)

### 3.1 数据存储

- **OntologyProject** 顶层状态，包含 12 大模型的所有数据
- **scenarios**: Scenario[] — 业务场景 (C 节点)
- **epcProcesses**: EpcProcess[] — EPC 流程
- **metaElements**: MetaElement[] — 8 维度元要素全局库
- **businessChains**: BusinessChain[] — 业务链 A→B→C→EPC
- **moduleVersions**: ModuleVersionRecord[] — 模块版本管理

### 3.2 简化重构新增 Store API (US-S03~S09)

| API | 来源 | 用途 |
|-----|------|------|
| `saveModuleDraft` | S03 | 保存模块草稿 (自动 pin vN) |
| `forkModuleToDraft` | S03 | 从 archived 快照 fork 新草稿 |
| `confirmModule` | S03 | 确认草稿 → validated |
| `cancelModuleDraft` | S14 | 取消草稿 → archived |
| `confirmModuleValidated` | S14 | 确认已验证模块 |
| `getModuleVersions` | S03 | 获取版本列表 |
| `resolveModuleRef` | S03 | 解析模块引用 |
| `addBusinessChain` | S04 | 添加业务链节点 |
| `updateBusinessChain` | S04 | 更新业务链 |
| `deleteBusinessChain` | S04 | 删除业务链节点 |
| `saveEpc` | S05 | 保存 EPC (触发 upsert + rebuild) |
| `rebuildUsageIndex` | S05 | 重建 usageRefs 索引 |
| `getElementUsageRefs` | S05 | 获取要素被引用列表 |
| `getUnreferencedElements` | S07 | 获取未被 EPC 引用的要素 |
| `getScenarioChildEpcs` | S08 | 获取场景下所有 EPC |
| `getScenarioReferenceUnion` | S08 | 获取场景引用并集 |
| `getBusinessEpcWarnings` | S09 | 获取业务EPC警告 |

### 3.3 原有 Store API (P1–P5)

包含 12 大模型的 CRUD: entities, properties, relations, states, transitions, actions, rules, events, governanceRoles, metrics, indicators, datasources, departments, positions, intents, businessTerms 等 50+ API。

---

## 4. 组件架构 (src/components/ontology/, ~40 文件)

### 4.1 建模工作台 (core)

```
modeling-workspace.tsx         ← 🔥 主工作台 (Tab 路由: 元模型 + 平台 + EPC + 组织 + 语义层)
├── data-model-editor.tsx      ← 数据模型编辑器
├── behavior-model-editor.tsx  ← 行为模型编辑器 (含 Lifecycle Tab)
├── rule-model-editor.tsx      ← 规则模型编辑器
├── event-model-editor.tsx     ← 事件模型编辑器
├── process-model-editor.tsx   ← 流程模型编辑器
├── governance-editor.tsx      ← 治理编辑器
├── metrics-editor.tsx         ← 指标编辑器
├── datasource-editor.tsx      ← 数据源编辑器
├── organization-editor.tsx    ← 组织编辑器
├── semantic-layer-tab.tsx     ← Agent 语义层
├── lifecycle-tab.tsx          ← Entity Lifecycle 聚合视图
├── epc-tab.tsx                ← EPC 编辑器
├── reference-docs-panel.tsx   ← 参考文档上传
├── element-library.tsx        ← 🔥 US-S07 要素库 Tab
├── warning-center.tsx         ← 🔥 US-S09 警示中心 Tab
├── business-chain-tree.tsx    ← 🔥 US-S04 业务链树
├── business-chain-detail.tsx  ← 🔥 US-S04+S08 业务链详情 (含 C 工作区)
├── scenario-workspace.tsx     ← 🔥 US-S08 C 工作区 Tab
├── module-detail-actions.tsx  ← 🔥 US-S14 模块操作按钮
└── version-history-panel.tsx  ← 🔥 US-S14 版本历史面板
```

### 4.2 关键交互流程

1. **业务链导航**: business-chain-tree → 选节点 → business-chain-detail
   - A 节点: 显示数据/行为/规则/事件/流程模块
   - B 节点: 同上 + 聚合视图
   - C 节点: 显示 scenario-workspace (关联 EPC + 要素引用并集)
   - EPC 节点: 显示 EPC 编辑区
2. **EPC 编辑**: epc-steps-editor → element-selector (US-S06) → 关联 E1–E8 要素
3. **要素库**: element-library.tsx (US-S07) → 显示未引用要素 + 按维度筛选
4. **警示中心**: warning-center.tsx (US-S09) → W-EPC-01~05 警告

---

## 5. 测试现状

### 5.1 测试数量 (截至 2026-06-18)

| 层级 | 文件数 | 用例数 | 状态 |
|------|--------|--------|------|
| Unit | ~70 | 215 | ✅ 全绿 |
| Integration | ~30 | 92 | ✅ 全绿 |
| E2E Smoke | 7 | 7 | ✅ 全绿 |
| **总计** | **~107** | **314** | |

> 注: `pnpm run ci:check` 目前有 **2 个失败的文件** (非测试失败，是 vite import 解析失败): `tests/unit/excel-import.spec.ts` 和 `tests/unit/excel-export.spec.ts` — 这两个文件属于 **US-S10 进行中**，`@/lib/excel/import-excel` 尚未创建。

### 5.2 CI 脚本

```bash
pnpm lint         # ESLint 0 error
pnpm ts-check     # tsc --noEmit pass
pnpm test:unit    # vitest run tests/unit/
pnpm test:int     # vitest run tests/integration/
pnpm test:e2e     # vitest run tests/e2e/
pnpm run ci:check # lint + ts-check + test:unit + test:int + test:e2e
```

---

## 6. 当前状态: US-S10 Excel 分模块导入导出 (进行中)

### 6.1 已完成

- [x] US 已确认: `docs/ontology-simplification/us/US-S10-excel-per-module.md`
- [x] Unit Spec U01–U04 已起草: `docs/ontology-simplification/units/`
- [x] `repo-main/src/lib/excel/` 骨架已创建:
  - `excel-schema.ts` — Excel 模板 schema 定义
  - `export-excel.ts` — 导出逻辑
  - `import-excel.ts` — ❌ 导入逻辑 (待实现)

### 6.2 阻塞点

**`tests/unit/excel-import.spec.ts`** 引用 `@/lib/excel/import-excel`，但该文件尚未实现，导致 vitest 在 vite import 解析阶段就报错。同理 **`tests/unit/excel-export.spec.ts`** 也可能有路径问题。

### 6.3 下一步 (U01)

按六步强制流程:
1. 确认 Unit Spec `US-S10-U01-spec.md`
2. 先写 failing tests（如果现有 test 文件需要调整）
3. 实现 `src/lib/excel/import-excel.ts`
4. 跑 `pnpm test:unit` 确保 U01 通过
5. 继续 U02→U03→U04

---

## 7. 未完成工作清单 (按优先级)

### 🔴 当前阻塞: US-S10 Excel 分模块

| 任务 | 文件 | 状态 |
|------|------|------|
| U01 lib + tests | `lib/excel/import-excel.ts` + `tests/unit/excel-import.spec.ts` | 🔄 进行中 |
| U02 导出 | `lib/excel/export-excel.ts` (已有骨架) | ⏸️ |
| U03 导入 UI | 对话框 + 解析 | ⏸️ |
| U04 E2E | e2e 测试 | ⏸️ |

### 🟡 待开始

| US | 说明 | 依赖 |
|----|------|------|
| US-S11 | AI 仅 draft 填充 | S10 |
| US-S12 | 遗留代码删除 | S11 |
| US-S13 | compiler 迁移 + golden | S12 |

### 🔵 EPC v3.1 升级

| 任务 | 说明 | 状态 |
|------|------|------|
| EPC-T1 | types: EpcModelRef 扩展 (lifecycle/semantic) | ⬜ |
| EPC-T2 | epc-generator 扩展 (5×12 矩阵) | ⬜ |
| EPC-T3 | 校验规则扩展 (71→? 条) | ⬜ |
| EPC-T4 | UI: EPC 画布展示 Lifecycle/Semantic | ⬜ |

### ⚪ 技术债务

| ID | 描述 | 优先级 |
|----|------|--------|
| TD-01 | Next.js workspace root warning | 低 |
| TD-02 | url.parse() deprecation warning | 低 |
| TD-03 | 测试覆盖率提升至 80%+ | 中 |

---

## 8. 开发工作流

### 8.1 六步强制流程

```
US 确认 → ① Unit Spec → ② PRD → ③ Testing case → ④ Coding → ⑤ Unit test → ⑥ E2E
```

⚠️ TDD: ③ 必须先于 ④；任一步未勾选不得标 Unit 完成。

### 8.2 提交规范

- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- 分支: `feature/*` → PR → CI 通过 → 合并到 main

### 8.3 关键命令

```bash
cd E:\00 - AI\Ontology\repo-main

# 开发
pnpm dev                  # Next.js 开发服务器 (端口 3000)

# 测试
pnpm test:unit            # 单元测试
pnpm test:int             # 集成测试
pnpm test:e2e             # e2e smoke 测试
pnpm run ci:check         # 全量质量门禁

# 代码质量
pnpm lint                 # ESLint
pnpm ts-check             # TypeScript 类型检查
```

---

## 9. 快速接续指南

### 如果你想继续 US-S10

1. 打开 `E:\00 - AI\Ontology\docs\ontology-simplification\us\US-S10-excel-per-module.md` 回顾 US
2. 查看 `E:\00 - AI\Ontology\docs\ontology-simplification\units\` 下的 U01–U04 spec
3. 修复 `tests/unit/excel-import.spec.ts` 和 `tests/unit/excel-export.spec.ts` 的路径/实现
4. 实现 `src/lib/excel/import-excel.ts`
5. 跑 `pnpm run ci:check` 确认全绿

### 如果你想了解某个已完成 US

查看 `E:\00 - AI\Ontology\docs\ontology-simplification\WORKLOG.md`，找到对应日期和 US 章节，里面列出了所有 Unit 的产出文件和测试数量。

### 如果你想了解 12 大模型

- 类型定义: `repo-main/src/types/ontology.ts`
- Store: `repo-main/src/store/ontology-store.ts`
- UI: `repo-main/src/components/ontology/modeling/`
- 规格: `E:\00 - AI\Ontology\docs\` 下各 Spec 文档

---

## 10. 关键文件速查表

| 我想知道... | 看这个文件 |
|-------------|-----------|
| 项目整体进度 | `docs/progress.md` |
| 待办清单 | `docs/TODO.md` |
| 简化重构进度 | `docs/ontology-simplification/WORKLOG.md` |
| 简化重构 US 列表 | `docs/ontology-simplification/PROGRESS.md` |
| 简化重构计划 | `docs/本体建模简化架构.plan.md` |
| 当前 US 规格 | `docs/ontology-simplification/us/US-S10-excel-per-module.md` |
| 所有类型定义 | `repo-main/src/types/ontology.ts` |
| 所有 Store API | `repo-main/src/store/ontology-store.ts` |
| 主要 UI 组件 | `repo-main/src/components/ontology/` |
| 核心业务逻辑 | `repo-main/src/lib/` |
| CI 脚本 | `repo-main/package.json` → `scripts` |

---

> 📌 本文件位于 `E:\00 - AI\Ontology\docs\resume\README.md`
