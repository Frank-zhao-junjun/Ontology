# Ontology 本体模型建模工具

> 此项目也被称为**项目1**。

Ontology 是一个面向业务架构师和系统设计师的本体模型可视化建模平台。基于 Next.js 16、React 19 和 TypeScript 5 构建，核心架构采用 **A→B→C→EPC 业务树 + E1–E8 八维要素库** 的简化模型体系。

```text
A (ValueDomain) ─→ B (Capability) ─→ C (Scenario) ─→ EPC (EpcProcess)
                                                          └── steps[].elementRef → E1–E8
```

当前仓库同时包含产品介绍页和实际建模工作台：

- `/`：产品介绍、架构说明和功能展示。
- `/tool`：本体建模工作台。

## 核心架构

### 三层业务树（A/B/C）

| 层级 | 模型 | 含义 | 示例 |
|------|------|------|------|
| A | ValueDomain | 业务价值域 | 生产制造、财务会计 |
| B | Capability | 业务能力 | 计划能力、库存管理 |
| C | Scenario | 业务场景 | MTS排产场景、收货场景 |

严格父子关系：C → B → A，每层 `parentId` 指向父节点。

### 业务链导航

选择 A（价值域）→ B（能力）→ C（场景）→ 管理该场景下的 EPC 流程：
- **要素选择器**：在 EPC 步骤中按维度筛选或内联新建 E1–E8 要素
- **要素库**：全局查看所有要素，筛选未引用的要素补充到 EPC
- **saveEpc 流水线**：保存时自动 upsert 内联要素 + 重建引用索引
- **模块确认**：draft → confirmed → archived 三态管理，confirmed 可被跨模块引用

### 八维要素库（E1–E8）

| 维度 | 名称 | 包含内容 |
|------|------|----------|
| E1 | 数据模型 | Entity、Attribute、Relation、主数据 |
| E2 | 行为模型 | StateMachine、Action、Transition |
| E3 | 事件模型 | EventDefinition、Subscription |
| E4 | 规则模型 | 字段/跨字段/跨实体/聚合/时序校验规则 |
| E5 | 岗位角色 | Department、Position、GovernanceRole |
| E6 | 指标模型 | BusinessMetric |
| E7 | 约束模型 | guard condition、transaction boundary、compensation |
| E8 | 接口模型 | DataSource、Integration、Webhook |

**A/B/C.semantics** 吸收自然语言语义：`{ terms, triggerPhrases, synonyms }`，替代旧 Intent/BusinessTerm/SemanticRelation。

### EPC 全域关联

EPC 通过 **A→B→C→EPC 业务树** 将八维要素（E1–E8）串联为完整业务流程的视图：
- EPC 编辑器：通过 `EpcStep[]` 序列构建流程，每步可引用要素库元素
- 步骤引用（`elementRef`）为权威数据源，要素库维护 `usageRefs` 反向索引
- 引用版本锁定：支持 `latest_confirmed` 或具体版本号

### 校验体系

#### W-EPC 警示规则（warning only，不阻断导出）

| # | 条件 | 范围 | 状态 |
|---|------|------|:----:|
| W-EPC-01 | 引用要素已确认但非最新确认版 | EPC confirmed | ✅ |
| W-EPC-02 | 已确认要素 usageRefs 为空 | E* confirmed | ✅ |
| W-EPC-03 | 引用要素仅有草稿 | 跨模块 ref | ✅ |
| W-EPC-04 | C 已确认但无 EPC 子节点 | C confirmed | ✅ |
| W-EPC-05 | elementId 在库中不存在 | confirmed | ✅ |
| W-EPC-06~17 | EPC 步骤引用语义/行为/约束一致性扩展 | 各类引用 | ✅ v3.1 |

共 **17 条 W-EPC 规则**（基础 5 + v3.1 扩展 12），覆盖引用完整性、dimension 一致性、Action 可达性、Event 联动等。

#### EPC 覆盖率分析（US-S16）✅ 已完成

遍历 E1–E8 各维度要素，统计被 EPC 引用的比例，生成覆盖率仪表盘：
- VM-D/R/B/E/P/G/M/S 共 **22 条覆盖率规则**
- 发现覆盖率缺口并指导要素补充

#### 交叉一致性验证（US-S17）✅ 已完成

**VX 规则**：跨要素的一致性校验，确保 A/B/C 语义定义与要素实际使用不矛盾。
- VX-01~12：语义一致性
- VX-13~20：结构一致性

#### EPC 推导（US-S18）✅ 已完成

从已知要素和 EPC 步骤引用自动推导：
- **向下推导**：从 C 场景的 EPC 步骤中提取要素覆盖
- **Badge 展示**：在业务树节点上显示 EPC 覆盖状态徽章

### 导出与迁移

- **Manifest 编译**（US-S13）：`compileSimplifiedChain` 将业务树 + EPC 映射到平台契约格式
- **Excel 分模块导入导出**（US-S10）：12 个模块 Sheet + 隐藏引用表，支持模板下载和批量导入
- **业务场景迁移**（US-S12）：旧 `BusinessScenario` → A/B/C 一键迁移
- **Legacy 审计**（US-S12）：检测并报告旧结构残留

### AI 辅助建模（Copilot 统一助手 MVP ✅）

工作台右侧 **建模 Copilot** 为 AI 建模主入口（对话 + 文件上传），所有写入均为 **draft**，用户在左侧沿用 `draft → confirmed` 确认流程。

| 能力 | 说明 |
|------|------|
| **Copilot 面板** | CopilotKit Sidebar，可拖拽宽度，`localStorage: copilot-panel-width` |
| **14 个 Actions** | 创建 A/B/C/EPC、更新模块 draft、文档推断、要素/EPC 文本生成等（**无 delete\***） |
| **Runtime** | `GET/POST /api/copilotkit` → `CozeServiceAdapter` → 豆包 `doubao-seed-2-0-pro-260215`（coze-coding-dev-sdk，不依赖外网 CopilotKit API） |
| **文档推断** | `POST /api/analyze-document-model` — 3 个子 prompt 编排（业务链 / EPC / 要素） |
| **模块 Draft API** | `POST /api/generate-module-draft`、`POST /api/generate-element-draft` — Copilot Actions 内部调用 |
| **参考文档** | 上传 Word/PDF/Excel/PPT/TXT/Markdown；Copilot `uploadReferenceDocument` + `analyzeDocumentAndModel` |
| **Legacy 入口** | 旧 AI 按钮保留 + tooltip「建议使用右侧 Copilot」；`generate-model` / `extract-entities` 已删除 |

权威设计：[`docs/superpowers/specs/2026-06-26-copilot-unified-modeling-design.md`](docs/superpowers/specs/2026-06-26-copilot-unified-modeling-design.md)

## 平台级能力

- **元数据管理**：通过模板统一字段语义、数据类型和业务说明
- **模型校验引擎**：`ontology-validator.ts` — 多层级校验规则引擎
- **组织体系**：部门树（5 种类型）、岗位定义、治理角色、HR 系统同步（飞书/钉钉/企微/SAP/Workday）
- **版本快照**：draft → confirmed → archived 三态，支持回滚和审核

## 测试覆盖

| 层 | 用例数 | 目录 |
|:---|:---:|------|
| Unit 测试 | **1134** | `tests/unit/`（139 文件） |
| Integration 测试 | **277** | `tests/integration/`（67 文件） |
| E2E smoke | **27**（15 文件） | `tests/e2e/` |
| Phase 4 回归 | **32**（7 文件） | `test:phase4` |
| **合计** | **~1470** | |

`pnpm run ci:check` 全绿（2026-06-27）：lint **0 error** · ts-check pass · unit **1134/1134** · integration **277/277** · e2e smoke **27/27** · phase4 **32/32**

覆盖率 **40.61%**（Statements），核心逻辑已覆盖，组件渲染留待后续。

Copilot 专项：`pnpm exec vitest run tests/unit/copilot tests/integration/copilot tests/e2e/copilot`

Copilot 专项：`pnpm exec vitest run tests/unit/copilot tests/integration/copilot tests/e2e/copilot`

## 与项目2（Ontology Platform）对接

| 项目 | 路径 | 角色 |
|------|------|------|
| **项目1**（本仓库） | `D:\AI\Ontology` | Next.js 建模工作台，产出 `OntologyProject` / Manifest |
| **项目2** | `../ontology-platform` | Spring Boot 治理平台 + MCP，持久化 / 发布 / Agent 编排 |

- **导出**：`compileSimplifiedChain` → Manifest v2，供项目2 `POST /api/v1/ontologies/import` 消费
- **共享文档权威源**：[`../ontology-platform/docs/shared/`](../ontology-platform/docs/shared/)（本仓库 `docs/shared/` 为跳转说明）
- **差距分析**：[`../ontology-platform/docs/shared/项目1-项目2对接差距分析.md`](../ontology-platform/docs/shared/项目1-项目2对接差距分析.md)
- **跨项目 E2E**：项目2 `Project1ToProject2E2ETest`（6 场景）已覆盖导入 / 发布 / 导出链路

## 技术栈

- **应用框架**：Next.js 16 App Router
- **前端运行时**：React 19
- **语言**：TypeScript 5
- **UI**：shadcn/ui、Radix UI、lucide-react、antd
- **样式**：Tailwind CSS 4
- **动画**：GSAP
- **状态管理**：Zustand + persist
- **数据服务**：Supabase / PostgreSQL 适配
- **AI 集成**：coze-coding-dev-sdk（豆包 LLM）
- **Copilot UI**：`@copilotkit/react-core` · `@copilotkit/react-ui` · `@copilotkit/runtime`
- **文件解析**：xlsx、mammoth、pdf-parse
- **测试**：Vitest 4、Testing Library、happy-dom

## 快速开始

项目强制使用 pnpm。

```bash
pnpm install
pnpm dev
```

启动后访问：

- 产品介绍页：`http://localhost:3000`
- 建模工作台：`http://localhost:3000/tool`

生产构建：

```bash
pnpm build
pnpm start
```

## 常用脚本

```bash
pnpm lint                        # ESLint 检查
pnpm ts-check                    # TypeScript 类型检查
pnpm test:unit                   # Unit 测试
pnpm test:integration            # Integration 测试
pnpm test:e2e:smoke              # E2E smoke 测试
pnpm test:coverage               # 带覆盖率报告
pnpm run test:phase:all          # 全 Phase 回归测试
pnpm run ci:check                # lint → ts-check → unit → integration → e2e smoke
```

`ci:check` 执行顺序：

```text
lint → ts-check → unit → integration → e2e smoke
```

## 环境变量

项目可以在无远端数据源时使用内置示例数据；接入 Supabase 或远端初始化数据时再配置：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 关键目录

```text
src/
├── app/
│   ├── page.tsx                  # 产品介绍页
│   ├── tool/page.tsx             # 建模工作台入口
│   └── api/
│       ├── excel-import/         # Excel 导入
│       ├── excel-template/       # Excel 模板下载
│       ├── copilotkit/           # CopilotKit Runtime（coze 豆包）
│       ├── analyze-document-model/ # 文档推断（3 子 prompt）
│       ├── generate-module-draft/  # 模块 draft 生成（A/B/C/EPC）
│       ├── generate-element-draft/ # 要素 draft 生成（E1–E8）
│       ├── reference-documents/  # 参考文档上传与解析
│       ├── hr-sync/              # HR 同步 (trigger/config/history)
│       ├── masterdata/init/      # 主数据初始化
│       ├── metadata/init/        # 元数据初始化
│       └── projects/             # 项目持久化
├── components/
│   ├── landing/                  # 产品介绍页组件
│   └── ontology/                 # 建模工作台组件
│       └── copilot/              # Copilot 面板 + Actions
├── lib/
│   ├── copilot/                  # Copilot Actions、文档编排、coze adapter
│   ├── business-chain/           # US-S04: A/B/C 业务链树
│   ├── element-library/          # US-S07: 要素库 + 未引用查询
│   ├── element-selector/         # US-S06: EPC 要素选择器
│   ├── epc-pipeline/             # US-S05: saveEpc
│   ├── module-version/           # US-S03/S14: 模块版本管理
│   ├── scenario-workspace/       # US-S08: C 工作区逻辑
│   ├── business-epc-linter/      # US-S09/S15: W-EPC 17 条警示规则
│   ├── epc-coverage/             # US-S16: 覆盖率分析
│   ├── epc-cross-consistency/    # US-S17: 交叉一致性验证
│   ├── epc-derivation/           # US-S18: EPC 推导 + Badge
│   ├── excel/                    # US-S10: Excel 分模块导入导出
│   ├── ai-draft/                 # US-S11: AI draft 填充
│   ├── legacy-audit/             # US-S12: 遗留代码审计
│   ├── migration/                # US-S12: BusinessScenario → A/B/C
│   ├── manifest-compiler/        # US-S13: compileSimplifiedChain
│   ├── e1-entity/                # US-S06: E1 实体创建
│   ├── metadata-local.ts         # 本地元数据 (57 条)
│   ├── ontology-validator.ts     # 校验引擎
│   └── ontology-normalizer.ts    # 模型规范化
├── store/
│   └── ontology-store.ts         # 全局状态 (Zustand + persist)
└── types/
    └── ontology.ts               # 核心类型定义

tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/
```

## 核心类型

建模主类型定义在 `src/types/ontology.ts`：

### 简化架构核心类型

- `ValueDomain` / `Capability` / `Scenario` / `EpcProcess` / `EpcStep` — A→B→C→EPC 业务树
- `MetaElement` / `MetaDimension` (E1–E8) — 八维要素库
- `ElementUsageRef` / `VersionPin` — 引用索引与版本锁定
- `ModuleVersionRecord` / `ModuleKind` — 模块三态（draft/confirmed/archived）
- `SemanticsBlock` — A/B/C 语义块（terms/triggerPhrases）

### 校验与覆盖

- `WepcWarning` / `EpcCoverage` / `CrossConsistencyResult` / `DerivationResult`
- `EpcValidationSummary` — 综合校验摘要
- `EPC_WARNING_RULES` — 17 条 W-EPC 规则定义数组

### 平台级类型

- `OntologyProject` / `Entity` / `Attribute` / `Relation`
- `StateMachine` / `Action` / `Transition`
- `Rule` / `EventDefinition`
- `Department` / `Position` / `GovernanceRole` / `HRSyncConfig`
- `BusinessMetric` / `DataSource` / `Integration`

## 主要接口

```text
# 项目与数据
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
GET    /api/metadata/init
GET    /api/masterdata/init

# Excel 导入导出
GET    /api/excel-template
POST   /api/excel-import

# AI / Copilot
GET    /api/copilotkit              # CopilotKit Runtime（coze 豆包）
POST   /api/copilotkit
POST   /api/analyze-document-model  # 整文档推断（chain + EPC + elements）
POST   /api/generate-module-draft   # A/B/C/EPC 模块 draft
POST   /api/generate-element-draft  # E1–E8 要素 draft

# 参考文档
POST   /api/reference-documents/upload
DELETE /api/reference-documents/:docId

# HR 同步
POST   /api/hr-sync/trigger
GET    /api/hr-sync/config
PUT    /api/hr-sync/config
GET    /api/hr-sync/history
POST   /api/hr-sync/resolve-conflict
```

## 开发约束

- 必须使用 pnpm，`preinstall` 会通过 `only-allow` 拦截其它包管理器。
- 不要回退到旧字段契约（`scenarioId`、`type`、`metadataId` 等已淘汰字段）。
- 实体业务归属以 `businessScenarioId` 为准，实体角色以 `entityRole` 为准。
- 所有变更必须通过 TDD 六步法：Spec → PRD → Testing(Case) → Coding → Unit → E2E。
- 提交前运行 `ci:check` 确保全绿。

## 相关文档

### 用户文档
- `docs/concepts-guide.md` — 核心概念通俗解释（面向非技术人员）
- `docs/quickstart.md` — 5 分钟快速入门教程
- `docs/user-manual.md` — 完整用户操作手册

### 架构与设计
- `docs/adr-simplified-ontology-model.md` — 简化架构决策记录
- `docs/ontology-simplification/epc-v3.1-simplified-spec.md` — EPC v3.1 关联矩阵
- `docs/ontology-simplification/PROGRESS.md` — 简化重构进度追踪

### 功能规格
- `docs/superpowers/specs/2026-06-26-copilot-unified-modeling-design.md` — **Copilot 统一 AI 建模助手（权威 spec）**
- `docs/superpowers/plans/2026-06-26-copilot-unified-modeling.md` — Copilot 实施计划与 TC 索引
- `docs/Organization-Position-Spec.md` — 组织体系与岗位模型 v2.0
- `docs/Reference-Doc-Upload-Spec.md` — 参考文档上传辅助 AI 建模

### 开发
- `docs/TODO.md` — 待办清单
- `docs/progress.md` — 工作日志
- `CONTRIBUTING.md` — 贡献规范
- `docs/agentic-engineering-checklist.md` — AI 工程检查清单
- [`../ontology-platform/docs/shared/`](../ontology-platform/docs/shared/) — 与项目2 共享 PRD / API 契约 / Manifest 规范

## 知识图谱（Graphify）

项目代码已通过 [graphify](https://github.com/safishamsi/graphify) 构建知识图谱，帮助 AI Agent 快速理解项目结构：

| 指标 | 值（全项目） | 值（源码） |
|------|:----------:|:---------:|
| 节点数 | **4,939** | 1,634 |
| 关系边数 | **9,467** | 4,583 |
| 社区数 | **624** | 86 |
| 图谱路径 | `graphify-out/` | `src/graphify-out/` |
| 报告 | `graphify-out/GRAPH_REPORT.md` | `src/graphify-out/GRAPH_REPORT.md` |
| Codex Hook | ✅ `AGENTS.md` + `.codex/hooks.json` |

进入项目目录后，Codex 等 AI Agent 会自动加载图谱代替全文搜索。使用 `graphify update src/` 可在代码变更后快速更新图谱（仅 AST，无 API 费用）。
