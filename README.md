# Ontology 本体模型建模工具

> 此项目也被称为**项目1**。

Ontology 是一个面向业务架构师和系统设计师的本体模型可视化建模平台。基于 Next.js 16、React 19 和 TypeScript 5 构建，核心架构采用 **A→B→C→EPC 业务树 + E1–E8 八维要素库** 的简化模型体系。

```text
A (ValueDomain) ─→ B (Capability) ─→ C (Scenario) ─→ EPC (EpcProcess)
                                                          └── steps[].elementRef → E1–E8
```

当前仓库同时包含产品介绍页和实际建模工作台，并提供 **4 种服务接入方式**：

| 接入方式 | 入口 | 适用场景 |
|----------|------|----------|
| **Web UI** | `/tool` | 图形化建模工作台，含 AI Copilot 对话面板 |
| **MCP Server** | `pnpm tsx packages/ontology-mcp/src/index.ts` | AI Agent 通过 MCP 协议调用建模工具 |
| **CLI** | `pnpm ontology <command>` | 命令行批量操作，零外部依赖 |
| **Agent Skill API** | `POST /api/agent/skills/execute` | REST API 统一入口，12 种操作 |

首页 `/` 提供产品介绍、架构说明和 4 类服务入口卡片。

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

### AI 辅助建模（Copilot ✅）

工作台右侧 **建模 Copilot** 为 AI 建模主入口（对话 + 文件上传），所有写入均为 **draft**，用户在左侧沿用 `draft → confirmed` 确认流程。

| 能力 | 说明 |
|------|------|
| **Copilot 面板** | `modeling-copilot-panel.tsx`，`h-screen overflow-hidden` 边界限定，溢出滚动 |
| **AI 模型** | 豆包 Seed 2.0 Pro（`doubao-seed-2-0-pro-260215`），可通过 `CHAT_MODEL` 环境变量覆盖 |
| **流式输出** | SSE 协议，前端 `fetch` + `getReader()` 打字机式渲染 |
| **ACTION 机制** | AI 回复中嵌入 `<<<ACTION>>>{json}<<<END_ACTION>>>` 块，流结束后批量解析并执行 |
| **5 种动作** | `create_value_domain` / `create_capability` / `create_scenario` / `create_epc_process` / `create_chain` |
| **执行层** | `src/lib/copilot/chat-actions.ts` — 解析 ACTION 块，调用 Zustand store 方法执行建模 |
| **参考文档** | 上传 Word/PDF/Excel/TXT/Markdown/CSV，解析后注入 AI Prompt |
| **面板边界** | `h-screen overflow-hidden`，超出部分滚动查看 |

## 平台级能力

- **元数据管理**：通过模板统一字段语义、数据类型和业务说明
- **模型校验引擎**：`ontology-validator.ts` — 多层级校验规则引擎
- **组织体系**：部门树（5 种类型）、岗位定义、治理角色、HR 系统同步（飞书/钉钉/企微/SAP/Workday）
- **版本快照**：draft → confirmed → archived 三态，支持回滚和审核

## 测试覆盖

| 层 | 用例数 | 目录 |
|:---|:---:|------|
| Unit 测试 | **1249** | `tests/unit/`（149 文件） |
| Integration 测试 | **277** | `tests/integration/`（67 文件） |
| E2E smoke | **27**（15 文件） | `tests/e2e/` |
| Phase 4 回归 | **32**（7 文件） | `test:phase4` |
| **合计** | **~1585** | |

`pnpm run ci:check` 全绿（2026-06-27）：lint **0 error** · ts-check pass · unit **1249/1249** · integration **277/277** · e2e smoke **27/27** · phase4 **32/32**

**Scoped unit 覆盖率**（`pnpm exec vitest run --coverage tests/unit`）：

| 指标 | 当前 | Hermes 目标 |
|------|:----:|:-----------:|
| Statements | **42.07%** | ≥80% |
| Lines | **42.88%** | ≥80% |

核心 `src/lib/**` 与 `src/store/**` 已较高覆盖；`src/components/**` 仍为最大缺口。进度见 `.hermes/REPORT.md`。

Copilot 专项：`pnpm exec vitest run tests/unit/copilot tests/integration/copilot tests/e2e/copilot`

### Hermes Goal-Loop 收尾（项目1）

提交 `05afab9` · 进度 `.hermes/REPORT.md` · Skill：`D:\AI\00 - SKILL\goal-loop\`（仓库内副本 `.claude/skills/goal-loop/`）

| 子目标 | 内容 | 状态 |
|--------|------|:----:|
| GS-02 | `chain-doc-prompt` · `manifest-validator/collect-ids` — **15 tests** | ✅ |
| GS-03 | `data-model-editor` → `@/lib/data-model/helpers` — **89 tests**（+25） | ✅ |
| GS-04 | `projects/[id]` · `hr-sync/resolve-conflict` · `export` 路由 — **18 tests** | 🟡 |
| GS-06 | Scoped coverage baseline **42%**（距 80% ~38pp） | 🟡 |

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
- **AI 集成**：coze-coding-dev-sdk（豆包 Seed 2.0 Pro）
- **MCP 协议**：`@modelcontextprotocol/sdk`
- **文件解析**：xlsx、mammoth、pdf-parse
- **测试**：Vitest 4、Testing Library、happy-dom

## 快速开始

项目强制使用 pnpm。

```bash
pnpm install
pnpm dev
```

启动后访问：

- 产品介绍页：`http://localhost:5000`
- 建模工作台：`http://localhost:5000/tool`

> 端口通过 `DEPLOY_RUN_PORT` 环境变量读取，默认 5000。

### CLI 工具

```bash
pnpm ontology help          # 帮助信息
pnpm ontology projects      # 列出所有项目
pnpm ontology project <id>  # 查看项目详情
pnpm ontology metadata      # 获取元数据列表
pnpm ontology template      # 下载 Excel 模板
pnpm ontology skills        # 列出 Agent 技能
pnpm ontology sync          # HR 同步状态
```

### MCP Server

```bash
pnpm tsx packages/ontology-mcp/src/index.ts   # 启动 MCP Server（Stdio transport）
```

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

```env
# AI 模型（可选，默认 doubao-seed-2-0-pro-260215）
CHAT_MODEL=

# Supabase（可选，无配置时使用 localStorage）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 关键目录

```text
src/
├── app/
│   ├── page.tsx                  # 产品介绍页 + 4类服务入口
│   ├── tool/page.tsx             # 建模工作台入口
│   ├── cli/index.ts              # CLI 入口（pnpm ontology）
│   └── api/
│       ├── chat/                 # AI 对话（SSE 流式，豆包 Seed 2.0 Pro）
│       ├── generate-model/       # AI 模型生成
│       ├── generate-element-draft/ # AI 要素草稿生成
│       ├── agent/skills/         # Agent 技能元数据
│       │   └── execute/          # Skill 统一执行 API（12 种操作）
│       ├── excel-import/         # Excel 导入
│       ├── excel-template/       # Excel 模板下载
│       ├── export/               # Excel 导出（xlsx-from-manifest）
│       ├── reference-documents/  # 参考文档上传与解析
│       ├── hr-sync/              # HR 同步 (trigger/config/history)
│       ├── metadata/init/        # 元数据初始化
│       ├── entity-lifecycle/     # 实体生命周期导出
│       ├── agent-semantic-layer/ # Agent 语义层导出
│       └── projects/             # 项目持久化
├── components/
│   ├── landing/                  # 产品介绍页组件
│   │   ├── Hero.tsx              # Hero 区（GSAP 动画 + CTA）
│   │   └── ServiceEntry.tsx      # 4 类服务入口卡片
│   └── ontology/                 # 建模工作台组件
│       ├── copilot/              # AI Copilot 子系统
│       │   ├── modeling-copilot-panel.tsx # AI 对话面板（SSE + ACTION 执行）
│       │   └── copilot-system-prompt.ts   # 系统提示词
│       ├── epc-steps-editor.tsx  # EPC 步骤表格编辑器
│       └── ...
├── lib/
│   ├── copilot/                  # ACTION 解析 + Store 执行
│   │   └── chat-actions.ts       # 5 种动作解析与执行
│   ├── action-executor.ts        # 纯函数版 ACTION 执行器
│   ├── business-chain/           # A/B/C 业务链树
│   ├── excel/                    # Excel 导入导出（中文表头 + 字母前缀 Sheet 名）
│   ├── epc-pipeline/             # saveEpc
│   ├── module-version/           # 模块版本管理
│   ├── ontology-validator.ts     # 校验引擎
│   └── ...
├── store/
│   └── ontology-store.ts         # 全局状态 (Zustand + persist，内联实现)
├── cli/
│   └── index.ts                  # CLI 工具入口
└── types/
    └── ontology.ts               # 核心类型定义

packages/
└── ontology-mcp/                 # MCP Server 包
    └── src/
        ├── index.ts              # MCP Server 入口（Stdio transport）
        ├── tools/                # MCP 工具定义
        ├── resources/            # MCP 资源
        ├── prompts/              # MCP 提示词
        └── store/                # MCP 项目存储

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

# Excel 导入导出（中文表头 + 字母前缀 Sheet 名）
GET    /api/excel-template
POST   /api/excel-import
POST   /api/export/xlsx-from-manifest

# AI 对话（SSE 流式）
POST   /api/chat

# AI 模型生成
POST   /api/generate-model
POST   /api/generate-element-draft

# Agent Skill 执行（统一入口，12 种操作）
GET    /api/agent/skills/execute
POST   /api/agent/skills/execute

# 参考文档
POST   /api/reference-documents/upload
DELETE /api/reference-documents/:docId

# 实体生命周期 & Agent 语义层
GET    /api/entity-lifecycle?entityId=xxx
GET    /api/agent-semantic-layer

# HR 同步
POST   /api/hr-sync/trigger
GET    /api/hr-sync/config
PUT    /api/hr-sync/config
GET    /api/hr-sync/history
POST   /api/hr-sync/resolve-conflict
```

## 开发约束

- 必须使用 pnpm，`preinstall` 会通过 `only-allow` 拦截其它包管理器。
- 端口固定为 5000（通过 `DEPLOY_RUN_PORT` 环境变量读取），禁止硬编码。
- 不要回退到旧字段契约（`scenarioId`、`type`、`metadataId` 等已淘汰字段）。
- 实体业务归属以 `businessScenarioId` 为准，实体角色以 `entityRole` 为准。
- Excel 导入/导出 Sheet 名格式：字母前缀+中文（如 `E1-实体`），导入时自动去除前缀。
- Excel 导出表头为中文，导入时自动归一化中文表头到英文 key。
- `ontology-store.ts` 为内联实现（4214行），不依赖外部 store-adapter。
- AI 模型默认为豆包 Seed 2.0 Pro，可通过 `CHAT_MODEL` 环境变量覆盖。
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
- `.hermes/GOAL.md` · `.hermes/REPORT.md` — Hermes Goal-Loop 目标与进度
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
