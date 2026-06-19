# Ontology 本体模型建模工具

Ontology 是一个面向业务架构师、系统设计师和交付工程师的本体模型可视化建模工具。项目基于 Next.js 16、React 19 和 TypeScript 5 构建，围绕"项目 -> 业务场景 -> 实体 -> 元模型 -> EPC 全域关联"的链路组织建模和验证能力。
Ontology 是一个面向业务架构师、系统设计师和交付工程师的本体模型可视化建模工具。项目基于 Next.js 16、React 19 和 TypeScript 5 构建，围绕“项目 -> 业务场景 -> 实体 ->  EPC -> 元模型 -> Manifest  / 导出JSON或YAML”的链路组织建模、导出能力。

当前仓库同时包含产品介绍页和实际建模工作台：

- `/`：产品介绍、架构说明、路线图和验收标准。
- `/tool`：本体建模工作台。

## 核心能力

### 建模工作台

- 项目与业务场景管理：实体必须归属于具体业务场景，工作台按当前业务场景过滤实体。
- DDD 实体角色：支持 `aggregate_root` 聚合根与 `child_entity` 聚合内子实体，聚合根可承载 EPC 与领域事件链路。
- 数据模型：维护实体、属性、关系、指标、指标计算属性、指标数据来源映射等结构。
- 行为模型：维护状态机、状态、状态流转、触发器、动作和副作用。
- 规则模型：维护字段校验、跨字段校验、跨实体校验、聚合校验和时序规则。
- 事件模型：维护领域事件、订阅、事务阶段、幂等键和处理策略。
- 流程模型：维护业务流程编排、步骤定义和决策点。

### 本体建模简化重构（Phase 0–4 ✅）

> 2026-06-18 完成 | 14/14 User Story | `ci:check` 全绿

将原有的 12 大模型混合架构收敛为清晰的业务树 + 八维要素体系：

```
A (ValueDomain) → B (Capability) → C (Scenario) → EPC (EpcProcess)
                                                      └── steps[].elementRef → E1–E8
```

- **A/B/C 三层业务树**：业务价值域 → 业务能力 → 业务场景，严格父子关系
- **E1–E8 八维要素库**：数据模型 / 行为模型 / 事件模型 / 规则模型 / 岗位角色 / 指标模型 / 约束模型 / 接口模型
- **EPC 步骤内联引用**为权威数据源，要素库维护派生反向索引
- **模块三态**：draft → confirmed → archived，confirmed 可跨模块引用
- **W-EPC 警示规则**：5 条 warning only 规则，不阻断导出

核心新增模块见 `src/lib/` 下的 `business-chain/`、`element-library/`、`element-selector/`、`epc-pipeline/`、`module-version/`、`scenario-workspace/`、`business-epc-linter/`、`excel/`、`ai-draft/`、`legacy-audit/`、`migration/`。

### EPC 全域关联层

EPC 不是独立的第六个模型，而是通过 **A→B→C→EPC 业务树** 将八维要素（E1–E8）串联为完整业务流程的视图。

- 业务链导航：选择 A（业务价值域）→ B（业务能力）→ C（业务场景）→ 管理 EPC 流程
- EPC 编辑器：通过步骤序列（`EpcStep`）构建流程，每步可引用八维要素库中的元素
- 要素选择器（US-S06）：在 EPC 步骤中按维度筛选、选择或内联新建 E1–E8 要素
- 要素库（US-S07）：全局查看 E1–E8 所有要素，筛选未被 EPC 引用的要素
- saveEpc 流水线（US-S05）：保存 EPC 时自动 upsert 内联要素 + 重建 usageRefs 索引
- 模块确认（US-S14）：draft → confirmed → archived 三态，confirmed 可被跨模块引用
- 警示中心（US-S09）：W-EPC-01~05 检查要素引用一致性，warning only 不阻断

#### 八维要素库（E1–E8）

| 维度 | 名称 | 包含内容 |
|------|------|----------|
| E1 | 数据模型 | Entity、Attribute、Relation |
| E2 | 行为模型 | StateMachine、Action、Transition |
| E3 | 事件模型 | EventDefinition、Subscription |
| E4 | 规则模型 | 字段/跨字段/跨实体/聚合/时序校验规则 |
| E5 | 岗位角色 | Department、Position、GovernanceRole |
| E6 | 指标模型 | BusinessMetric |
| E7 | 约束模型 | guard condition、transaction boundary、compensation |
| E8 | 接口模型 | DataSource、Integration、Webhook |

#### 校验体系（W-EPC 警示规则）

| # | 条件 | 作用范围 |
|---|------|----------|
| W-EPC-01 | 引用要素已确认但非最新确认版 | EPC confirmed |
| W-EPC-02 | 已确认要素 usageRefs 为空 | E* confirmed |
| W-EPC-03 | 引用要素仅有草稿 | 跨模块 ref |
| W-EPC-04 | C 已确认但无 EPC 子节点 | C confirmed |
| W-EPC-05 | elementId 在库中不存在 | confirmed |

> EPC v3.1 升级（US-S15~S17）将扩展至 44 条规则：W-EPC-06~17 + VM 22 条 + VX 10 条。参见 [docs/ontology-simplification/epc-v3.1-simplified-spec.md](./ontology-simplification/epc-v3.1-simplified-spec.md)。

- Manifest 编译（US-S13）：`compileSimplifiedChain` 将业务树 + EPC 映射到 platform Manifest 格式
- 业务场景迁移（US-S12）：旧 `BusinessScenario` → A/B/C 一键迁移

### 平台级模型

- 元数据管理：通过模板统一字段语义、数据类型和业务说明。
- 主数据管理：支持主数据定义、字段解析、动态记录和属性引用。
- 指标模型：维护业务指标、公式、单位、绑定动作和度量方式。
- 数据源模型：维护 API地址和说明、数据库地址和说明、文件地址和说明等外部数据源配置。
- 治理模型：维护角色、本体模型的任意要素设置权限、字段权限和 创建/修改/删除/查看权限。


### 组织体系与岗位模型

- 部门树：5 种类型（集团/事业部/部门/团队/班组），通过 `parentId` 构建组织树。
- 岗位定义：归属部门、关联治理角色（`roleIds → GovernanceRole`）、汇报线、编制、任职要求。
- **结构化职责**：`PositionResponsibility` 定义职责项（scope + actions + decisionAuthority），支持职责重叠检测和委托链。
- 关联链路：`Department → Position → GovernanceRole → permissions`，`Position → responsibilities → Action/Entity/Process`。
- EPC 集成：`EpcOrganizationalUnit` 通过 `refType/refId` 引用 Department 或 Position。
- **HR 系统同步**：支持飞书/钉钉/企微/SAP/Workday/自定义 API 定时同步，含字段映射、冲突策略、同步历史。

### Entity Lifecycle（实体生命周期）

- State 增强：entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility。
- Transition 增强：guardCondition/compensationAction/sideEffects/publishEventId/notifyRoleIds/requiresApproval/auditLog。
- Action 增强：aliases/triggerPhrases/successMessage/failureMessage/fallbackActionId/requiresConfirmation/idempotencyKeyTemplate。
- 聚合视图：EntityLifecycle 一站式聚合 StateMachine + Action + Rule + Event 中的生命周期信息。
- 审计追溯：LifecycleAuditEntry 记录每次状态变更的完整上下文。
- 校验规则：V-LC-01~15 生命周期完整性与一致性校验。

### Agent Semantic Layer（Agent 语义层）

本体模型之上的第 11 个模型，专门解决"AI Agent 如何精准理解企业语义并正确执行任务"的问题。

- 意图映射：Intent 将自然语言短语映射到 Action，含 triggerPhrases/slotFilling/contextConstraints。
- 槽位填充：SlotFillingStrategy 定义参数追问顺序、校验规则、默认值、上下文推断。
- 对话上下文：DialogContext 维护聚焦实体、最近操作、指代消解。
- 语义关系：SemanticRelation 定义 is-a/part-of/synonym-of/causes/depends-on 等 10 种语义关系。
- 业务术语词典：BusinessTerm 统一术语定义、同义词、歧义说明、模型引用。
- 错误恢复：ErrorRecovery 定义操作失败后的重试/回退/升级/补偿策略。
- 时效性标记：TemporalValidity 为模型元素添加生效/失效时间。
- 字段映射：SemanticFieldMapping 自动推断跨实体字段等价关系。
- Agent 策略：AgentPolicy 定义 Agent 行为边界（允许/拒绝/确认/升级）。
- 完备性仪表盘：可视化语义层覆盖度（意图覆盖率/术语数/关系数/缺失提醒）。

### 版本管理与审核

- 版本快照：保存当前工作区的完整模型快照（DataModel / BehaviorModel / RuleModel / EventModel / EpcModel / GovernanceModel / DataSourcesModel / MetricsModel / OrganizationModel）。
- 版本状态：`draft` → `pending_review` / `published` / `rejected` / `archived`。
- 版本回滚：支持将工作区回滚到任意已发布版本。
- 版本审核：Excel 导入生成的 `pending_review` 版本支持审批通过（应用到工作区）或驳回（填写原因）。

### Excel 导入

- 模板下载：生成含填写说明 + 8 个数据 Sheet（实体 / 属性 / 关系 / 状态机 / 规则 / 事件 / 部门 / 岗位）的 `.xlsx` 导入模板。
- 文件上传：仅接受 `.xlsx` 格式，5MB 上限制，至少包含 1 个数据 Sheet 即可导入。
- 数据校验：逐行校验必填字段、枚举值、布尔类型和跨 Sheet 引用完整性，返回行级错误明细。组织数据校验含部门树环检测、职责列对齐等 23 条规则。
- 数据解析：校验通过后将 Excel 行数据解析为 Entity / Attribute / Relation / StateMachine / Rule / EventDefinition / Department / Position 模型对象，岗位职责自动解析为结构化 PositionResponsibility。
- 版本生成：基于解析数据生成 `pending_review` 状态版本（非工作区快照），版本号按日期自动递增。
- 审核流程：审核通过将解析数据应用到工作区（替换当前数据），驳回需填写原因。

### 参考文档上传辅助 AI 建模

- 文档上传：支持 Word(.docx) / PDF(.pdf) / Excel(.xlsx) / TXT / Markdown / CSV，10MB/文件，最多 10 份/项目。
- 文档解析：自动提取纯文本和表格内容（mammoth / pdf-parse / xlsx），解析失败时提示错误。
- AI 注入：AI 生成模型时自动将参考文档内容注入 Prompt，属性命名、状态流转、规则定义优先与文档一致。
- 实体提取：AI 从文档中自动识别实体候选（含属性、置信度、来源定位），可批量创建。
- 安全：文档仅存于浏览器 localStorage，不上传云端。
- Manifest 编译：将 `OntologyProject` 编译为平台交付契约 `OntologyManifest`。
- Manifest 校验：校验 Manifest 结构、引用完整性、治理约束、事件约束和数据源约束。
- Manifest 导出：支持本体模型导出和 EPC 产物导出。
- AI 辅助：提供本体模型生成接口和 agent skills 查询接口，为后续 Agentic Engineering 流程预留集成点。

## 技术栈

- 应用框架：Next.js 16 App Router
- 前端运行时：React 19
- 语言：TypeScript 5
- UI：shadcn/ui、Radix UI、lucide-react
- 样式：Tailwind CSS 4
- 动画：GSAP
- 状态管理：Zustand + persist
- 数据服务：Supabase / PostgreSQL 适配
- AI 集成：coze-coding-dev-sdk
- 文件解析：xlsx、mammoth、pdf-parse
- 测试：Vitest、Testing Library、happy-dom

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
pnpm lint
pnpm ts-check
pnpm test:unit
pnpm test:integration
pnpm test:e2e:smoke
pnpm test:coverage
pnpm run ci:check
```

`pnpm run ci:check` 的执行顺序为：

```text
lint -> ts-check -> unit -> integration -> e2e smoke
```

## 测试覆盖

| 层 | 用例数 | 文件 |
|---|:---:|---|
| Unit 测试（简化重构 + validator + store） | 286 | `tests/unit/` (~70 文件) |
| Integration 测试 | 101 | `tests/integration/` (~30 文件) |
| E2E smoke | 7+ | `tests/e2e/` (7 文件) |
| **合计** | **394+** | |

`pnpm run ci:check` 全绿（2026-06-18）：lint 0 error · ts-check pass · unit 286 · integration 101 · e2e smoke pass

## 环境变量

项目可以在无远端数据源时使用内置示例数据；接入 Supabase 或远端初始化数据时再配置环境变量。常见变量包括：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

主数据和元数据初始化接口也支持远端来源覆盖，具体以 `src/app/api/metadata/init/route.ts` 和 `src/app/api/masterdata/init/route.ts` 为准。

## 关键目录

```text
src/
├── app/
│   ├── page.tsx                  # 产品介绍页
│   ├── tool/page.tsx             # 建模工作台入口
│   └── api/
│       ├── agent/skills/         # Agent skills 查询
│       ├── generate-model/       # AI 建模建议
│       ├── reference-documents/  # 参考文档上传与解析
│       ├── excel-import/         # Excel 文件上传与解析
│       ├── excel-template/       # Excel 导入模板下载
│       ├── entity-lifecycle/     # 实体生命周期 API
│       ├── agent-semantic-layer/ # Agent 语义层 API
│       ├── hr-sync/              # HR 同步 (trigger/config/history)
│       ├── masterdata/init/      # 主数据初始化
│       ├── metadata/init/        # 元数据初始化
│       └── projects/             # 项目持久化
├── components/
│   ├── landing/                  # 产品介绍页组件
│   └── ontology/                 # 建模工作台组件 (20+ 组件)
├── lib/
│   ├── business-chain/            # US-S04: A/B/C 业务链树（tree.ts）
│   ├── element-library/           # US-S07: 要素库 + 未引用查询
│   ├── element-selector/          # US-S06: EPC 要素选择器
│   ├── epc-pipeline/              # US-S05: saveEpc（upsert-inline/rebuildUsageIndex）
│   ├── module-version/            # US-S03+S14: 模块版本管理（confirm-flow）
│   ├── scenario-workspace/        # US-S08: C 工作区逻辑
│   ├── business-epc-linter/       # US-S09: W-EPC 警示规则 + 待扩展
│   ├── excel/                     # US-S10: Excel 分模块导入导出
│   ├── ai-draft/                  # US-S11: AI 仅 draft 填充
│   ├── legacy-audit/              # US-S12: 遗留代码审计
│   ├── migration/                 # US-S12: BusinessScenario → A/B/C
│   ├── manifest-compiler/         # US-S13: compileSimplifiedChain
│   ├── e1-entity/                 # US-S06: E1 实体创建
│   ├── epc-generator/             # EPC 生成器 (旧)
│   ├── metadata-local.ts          # 本地元数据 (57 条)
│   ├── ontology-validator.ts      # 校验引擎
│   └── ontology-normalizer.ts     # 模型规范化
├── storage/database/             # Supabase / 数据库适配
├── store/ontology-store.ts       # 全局状态 (50+ actions, Zustand persist)
└── types/ontology.ts             # 核心类型定义 (70+ 类型, 1700+ 行)

tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/
```

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

# Excel 导入
GET    /api/excel-template
POST   /api/excel-import

# AI 辅助
POST   /api/generate-model

# 参考文档
POST   /api/reference-documents/upload
DELETE /api/reference-documents/:docId
POST   /api/reference-documents/extract-entities

# Entity Lifecycle
POST   /api/entity-lifecycle

# Agent Semantic Layer
POST   /api/agent-semantic-layer

# HR 同步
POST   /api/hr-sync/trigger
GET    /api/hr-sync/config
PUT    /api/hr-sync/config
GET    /api/hr-sync/history
POST   /api/hr-sync/resolve-conflict
```

## 核心契约

建模主类型定义在 `src/types/ontology.ts`。关键模型包括：

- `OntologyProject`
- `DataModel`
- `BehaviorModel`
- `RuleModel`
- `EventModel`
- `EpcModel`
- `GovernanceModel`
- `DataSourcesModel`
- `MetricsModel`
- `OrganizationModel`
- `ProjectVersion`
- `ExcelParsedData`
- `ExcelImportResult`
- `AgentSemanticLayer` / `Intent` / `BusinessTerm` / `SemanticRelation` / `ErrorRecovery` / `AgentPolicy`
- `EntityLifecycle` / `LifecycleAuditEntry` / `StateTimeout` / `StateDataVisibility`
- `OrganizationModel` / `Department` / `Position` / `PositionResponsibility` / `HRSyncConfig` / `HRSyncResult`
- `ReferenceDocument` / `ExtractedEntity` / `ExtractedAttribute`
- **简化重构新增**：
  - `ValueDomain` / `Capability` / `Scenario` / `EpcProcess` / `EpcStep` — A→B→C→EPC 业务树
  - `MetaElement` / `MetaDimension` (E1–E8) — 八维要素库
  - `ElementUsageRef` / `VersionPin` — 引用索引与版本锁定
  - `ModuleVersionRecord` / `ModuleKind` — 模块版本管理（draft/confirmed/archived）
  - `SemanticsBlock` — A/B/C.semantics（terms/triggerPhrases）
- `EpcChain` / `EpcNode` / `EpcEdge` / `EpcModelRef`（旧 EPC v3.0，逐步淘汰）
- `EpcValidationSummary` / `EpcModelCoverage`
- `IntentSlot` / `SlotFillingStrategy` / `DialogContext`
- `TemporalValidity` / `ExtractedAttribute`
- `State` (增强 11 字段) / `Transition` (增强 10 字段) / `Action` (增强 10 字段)

## 开发约束

- 必须使用 pnpm，`preinstall` 会通过 `only-allow` 拦截其它包管理器。
- 不要回退到旧字段契约，例如 `scenarioId`、`type`、`metadataId`、`referenceTargetType`、`masterDataIds`。
- 实体业务归属以 `businessScenarioId` 为准，实体角色以 `entityRole` 为准。
- 开发、评审和交接前请参考 `docs/agentic-engineering-checklist.md`。

## 相关文档

### 需求与规格
- `assets/REQUIREMENT.md` / `docs/REQUIREMENT.md` — 用户需求规格
- `assets/ontology-ai-driven-system-specification-v2.0.md` — 系统设计规格 v2.0
- `assets/系统架构设计文档.md` — 系统架构设计

### 功能规格文档
- `docs/EPC-Upgrade-Spec.md` — EPC 全域关联层 v3.1（71条双向校验规则）
- `docs/Organization-Position-Spec.md` — 组织体系与岗位模型 v2.0（结构化职责+HR同步+Excel导入）
- `docs/Entity-Lifecycle-Spec.md` — 实体生命周期 v2.0（State/Transition/Action增强）
- `docs/Agent-Semantic-Layer-Spec.md` — Agent 语义层 v1.0（9大子模型+完备性评估）
- `docs/Reference-Doc-Upload-Spec.md` — 参考文档上传辅助AI建模 v1.0

### 开发与交付
- `docs/TODO.md` — 待办清单（5模块×27任务）
- `docs/progress.md` — 工作日志
- `CONTRIBUTING.md` — 贡献规范
- `docs/agentic-engineering-checklist.md` — AI工程检查清单
