我将为您输出完整的《本体模型+AI驱动系统 最终规格说明书》作为Markdown文件。由于我无法直接生成可下载文件，我将提供完整的Markdown内容，您可以复制保存为`.md`文件。

---

```markdown
# 本体模型+AI驱动系统 最终规格说明书

## Ontology-Driven Metamodeling & Hybrid AI Execution Framework
### Final Specification Document v2.0

**版本**：v2.0（整合DDD事件设计）  
**日期**：2026-03-30  
**状态**：基于6议题+6DDD议题全部确认  

---

## 目录

1. [文档概述](#1-文档概述)
2. [架构总览](#2-架构总览)
3. [系统A：建模工具规格](#3-系统a建模工具规格)
   - [3.2.3 业务场景归属与实体管理（详细设计）](#323-业务场景归属与实体管理详细设计)
   - [3.2.4 EPC事件说明书页签（详细设计）](#324-epc事件说明书页签详细设计)
   - [3.2.5 属性编辑与主数据关联（详细设计）](#325-属性编辑与主数据关联详细设计)
4. [系统B：交付加载规格](#4-系统b交付加载体系规格)
5. [DDD领域事件设计](#5-ddd领域事件设计)
6. [AI编排器详细设计](#6-ai编排器详细设计)
7. [实施路线图](#7-实施路线图)
8. [附录](#8-附录)

---

## 1. 文档概述

### 1.1 文档目的

本规格说明书定义"本体模型+AI驱动的原生应用系统"的完整技术规格，涵盖：
- **建模期（设计时）**：可视化五大元模型编辑工具
- **生成期（Auto-Dev）**：基于元模型自动生成可执行代码
- **交付期（Delivery）**：AI动态编排的自然语言操作界面

### 1.2 核心设计哲学

```
业务本体抽象 → 模型共识 → AI生成底座 + AI动态运行
```

### 1.3 关键决策汇总

| 类别 | 议题 | 确认决策 |
|:---|:---|:---|
| **架构** | 系统定位 | 双系统：建模工具（Coze Studio）+ 交付加载体系（Docker） |
| **技术栈** | 建模工具 | Next.js 16 + Coze平台 |
| | 交付加载前端 | React + Vite + Ant Design |
| | 交付加载后端 | Flask + SQLite + SQLAlchemy |
| | AI集成 | 单一模型（DeepSeek/豆包）+ Function Calling |
| **元模型** | 数据模型 | 全动态，支持交付加载定义新实体 |
| | 行为模型 | 简单状态机，用户手动触发 |
| | 规则模型 | 全部五类，配置期热加载 |
| | 流程模型 | AI原生编排，无预设BPMN |
| | 事件模型 | DDD领域事件，聚合根发布 |
| **AI能力** | 语义注入 | 按需注入，混合格式，仅直接关联 |
| | 交付加载入口 | 独立对话界面（左栏） |
| | 自愈机制 | 最多2次重试，详细展示，返回原始错误 |
| **EPC** | 定位 | 全域关联层，串联12大模型（含Lifecycle+Semantic），非只读文档视图 |
| | 节点类型 | Event/Function/Connector/InfoObject/OrgUnit，每节点可引用多模型元素 |
| | 双向校验 | EPC→模型(VE×17) + 模型→EPC(VM×39) + 交叉一致性(VX×15) = 71条规则 |
| | 流程图 | @xyflow/react 自定义节点渲染 |
| **组织** | 组织模型 | Department(树形)+Position(岗位)，OrganizationModel为一级模型 |
| | 岗位关联 | Position.roleIds→GovernanceRole，EPC OrgUnit引用Department/Position |
| | 结构化职责 | PositionResponsibility(scope+actions+decisionAuthority+delegateToPositionIds) |
| | HR同步 | 飞书/钉钉/企微/SAP/Workday/自定义API定时同步，含字段映射+冲突策略 |
| **生命周期** | State增强 | entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility |
| | Transition增强 | guardCondition/compensationAction/sideEffects/publishEventId/notifyRoleIds/requiresApproval/auditLog |
| | Action增强 | aliases/triggerPhrases/successMessage/failureMessage/fallbackActionId/requiresConfirmation |
| | 聚合视图 | EntityLifecycle一站式聚合+LifecycleAuditEntry审计追溯 |
| | 校验规则 | V-LC-01~15 生命周期完整性与一致性校验 |
| **语义层** | 意图映射 | Intent将自然语言短语映射到Action，含triggerPhrases/slotFilling |
| | 槽位填充 | SlotFillingStrategy定义参数追问顺序、校验规则、默认值、上下文推断 |
| | 对话上下文 | DialogContext维护聚焦实体、最近操作、指代消解 |
| | 语义关系 | SemanticRelation定义is-a/part-of/synonym-of/causes等10种语义关系 |
| | 术语词典 | BusinessTerm统一术语定义、同义词、歧义说明、模型引用 |
| | 错误恢复 | ErrorRecovery定义操作失败后的重试/回退/升级/补偿策略 |
| | Agent策略 | AgentPolicy定义Agent行为边界（allow/deny/confirm/escalate） |
| | 完备性 | 10维度评估：55→81分（+26），意图映射从0→9 |
| **导入** | Excel导入 | 模板下载+文件上传+数据校验+解析为模型对象+生成待审核版本 |
| | 版本审核 | pending_review/rejected状态，审核通过应用Excel数据到工作区 |
| **交互** | 布局 | 三栏式（对话/数据/上下文） |
| | 数据视图 | 6种模式，Flowchart默认 |
| | 可视化 | ECharts静态展示，Table为P0 |
| **部署** | 发布机制 | 版本发布：建模工具保存版本→交付加载选择切换 |

---

## 2. 架构总览

### 2.1 双系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           双系统架构全景图                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────┐      ┌─────────────────────────────┐  │
│  │      系统A：建模工具         │      │      系统B：交付加载        │  │
│  │   (Ontology Modeling Tool)  │ ────→│   (Ontology Delivery Engine)   │  │
│  │                             │ 发布   │                             │  │
│  │  • 部署：Coze Studio        │──────→│  • 部署：版本化代码包       │  │
│  │  • 技术：Next.js 16         │ 版本   │  • 技术：Config Loader + Validation Service    │  │
│  │  • 功能：五大元模型可视化编辑 │      │  • 功能：自然语言操作业务数据   │  │
│  │  • AI：设计时辅助生成        │      │  • AI：交付加载动态编排执行       │  │
│  │                             │      │                             │  │
│  │  用户：业务架构师/系统设计师  │      │  用户：交付工程师/验证人员      │  │
│  └─────────────────────────────┘      └─────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         桥接机制：版本发布                           │ │
│  │  建模工具"发布"按钮 → 生成代码包（React+Flask+SQLite）→ Docker启动   │ │
│  │  版本管理：建模工具保存多版本 → 交付加载选择版本切换                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流转架构

```
建模期（设计时）                    发布                    交付期（加载）
┌─────────────────┐            ┌─────────────┐            ┌─────────────────┐
│   可视化编辑器    │───────────→│  版本化代码包  │───────────→│   交付加载引擎      │
│                 │   生成     │             │   加载      │                 │
│ • 数据模型定义   │            │ • SQLite DDL │            │ • SQLite数据库   │
│ • 行为模型定义   │            │ • Flask API  │            │ • Flask REST API │
│ • 规则模型定义   │            │ • React组件  │            │ • React前端      │
│ • 流程模型定义   │            │ • AI Agent   │            │ • AI编排器服务   │
│ • 事件模型定义   │            │ • Docker配置  │            │ • Docker容器     │
└─────────────────┘            └─────────────┘            └─────────────────┘
         │                                                        │
         ↓                                                        ↓
┌─────────────────┐                                        ┌─────────────────┐
│   Zustand状态    │                                        │   文件监听热载    │
│   localStorage   │                                        │   元模型缓存     │
└─────────────────┘                                        └─────────────────┘
```

---

## 3. 系统A：建模工具规格

### 3.1 核心功能保持

| 模块 | 功能 | 状态 |
|:---|:---|:---|
| 领域建模 | 8大行业领域选择 | ✅ 保持 |
| 项目管理 | 创建/编辑/删除项目分组 | ✅ 保持 |
| 实体管理 | CRUD+分组，标记聚合根 | ✅ 增强 |
| 四大元模型编辑 | 数据/行为/规则/事件 | ✅ 保持 |
| 元数据管理 | 57条标准字段+CRUD | ✅ 保持 |
| AI辅助生成 | 豆包大模型生成建议 | ✅ 保持 |
| 手册导出 | Markdown格式 | ✅ 保持 |
| EPC全域关联 | 事件-流程-动作链路+12大模型关联+流程图 | 🆕 新增 |
| 组织体系建模 | 部门树+结构化岗位职责+HR系统同步+EPC引用 | 🆕 新增 |
| Entity Lifecycle | State/Transition/Action增强+聚合视图+审计 | 🆕 新增 |
| Agent Semantic Layer | 意图映射+槽位填充+语义关系+术语词典+Agent策略 | 🆕 新增 |
| 双向校验 | EPC↔模型 71条规则(VE×17+VM×39+VX×15)+覆盖率 | 🆕 新增 |
| Excel导入 | 模板下载+上传校验+解析+待审核版本 | 🆕 新增 |
| 版本审核 | pending_review/rejected+应用数据 | 🆕 新增 |

### 3.2 新增：版本发布功能

#### 3.2.1 类型定义

```typescript
interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;        // 语义化版本，如"1.0.0"
  name: string;            // 版本名称
  description: string;
  metamodels: {
    data: DataModel;
    behavior: BehaviorModel;
    rules: RuleModel;
    process: ProcessModel;
    events: EventModel;    // DDD增强后的事件模型
  };
  createdAt: string;
  publishedAt?: string;
  status: 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';
  source?: 'manual' | 'excel_import';
  reviewComment?: string;
  parsedData?: ExcelParsedData;
}

interface PublishConfig {
  target: 'local' | 'remote';
  includeData: boolean;        // 是否包含示例数据
  aiAgentEnabled: boolean;     // 是否启用AI交付加载
}
```

#### 3.2.2 发布流程UI

```
建模工作台新增"发布"按钮：
┌─────────────────────────────────────────────────────────┐
│  [项目: 合同管理] [保存] [发布▼] [导出手册] [设置]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  点击[发布▼]下拉菜单：                                   │
│  ├── 📦 发布新版本...                                    │
│  ├── 📋 版本历史                                         │
│  └── ⚙️ 发布设置                                         │
│                                                         │
│  点击"发布新版本..."弹出对话框：                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │  发布新版本                                        │  │
│  │  ─────────────────────────────────────────────────│  │
│  │  版本号：  [1.0.0          ]                      │  │
│  │  版本名称：[合同管理系统初始版本]                   │  │
│  │  说明：    [基于离散制造领域...                    │  │
│  │            ]                                       │  │
│  │                                                    │  │
│  │  发布选项：                                         │  │
│  │  ☑ 包含示例数据                                     │  │
│  │  ☑ 启用AI交付加载助手                                  │  │
│  │  ☑ 生成版本化代码包配置                           │  │
│  │                                                    │  │
│  │  目标： ○ 本地Docker  ○ 下载代码包                   │  │
│  │                                                    │  │
│  │        [  取消  ]        [  生成并发布  ]           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
### 3.2.3 业务场景归属与实体管理——详细设计

> **可追溯**：与 `REQUIREMENT.md` 中 **REQ-BS-01～REQ-BS-06** 一一对应；测试映射见 `TEST_CASES.md` §6、`tests/*/cases.md`。

| 需求编号 | 设计要点 |
|----------|----------|
| REQ-BS-01 | 创建实体必须带 `businessScenarioId` |
| REQ-BS-02 | 创建后归属不可变 |
| REQ-BS-03 | 仅当前选定业务场景下新建；列表按场景过滤 |
| REQ-BS-04 | 详情只读展示归属 |
| REQ-BS-05 | 历史数据补录后均有场景 ID |
| REQ-BS-06 | 业务场景 `description` 为说明书等业务背景**唯一**来源 |

#### 1. 数据结构

**实体（Entity）**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | string | 必填 | 实体唯一标识 |
| `businessScenarioId` | string | 必填；**创建后不可更改** | 指向业务场景主数据/主表记录 |
| … | … | … | 其他建模字段略 |

**业务场景（BusinessScenario）**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | string | 全局唯一 | 作为 `businessScenarioId` 引用目标 |
| `name` / `nameEn` | string | 建议必填 | 展示名称 |
| `description` | string | 必填（业务约定） | **EPC 说明书「业务背景/场景说明」唯一引用源**；禁止由模型或 LLM 虚构替代 |
| … | … | … | 项目、领域等扩展字段略 |

持久化实现可为关系库表、文档集合或统一 JSON 存储；无论何种介质，**语义上**须满足上表约束。

#### 2. 业务流与接口

| 接口语义 | 方法/路径（示例） | 请求要点 | 响应/行为 |
|----------|-------------------|----------|-----------|
| 新建实体 | `POST /api/entities` | Body **必须**含 `businessScenarioId`；须与当前工作台选中的业务场景一致（或由服务端校验） | 201；持久化后该字段不可再通过更新接口修改 |
| 更新实体 | `PATCH /api/entities/:id` | **禁止**携带 `businessScenarioId` 或携带与存量不一致的值 | 400/403；或忽略该字段并文档化 |
| 查询实体列表 | `GET /api/entities?businessScenarioId=…` | 支持按 `businessScenarioId` **过滤**；未传时策略二选一（须产品拍板）：仅允许在已选场景上下文中默认注入，或 400 要求必传 | 仅返回该场景下实体 |
| 实体详情 | `GET /api/entities/:id` | — | 返回实体字段 + **只读**展开：`businessScenario`（含 `id`、`name`、`description` 等）供详情页展示 |

**前端交互**

- 仅在用户**已选定业务场景**时允许「新建实体」；实体列表**按当前 `businessScenarioId` 过滤**。
- 实体详情页**只读**展示归属业务场景（名称/标识）；不提供修改归属的控件。

**历史数据**

- 对缺失 `businessScenarioId` 的历史实体执行**补录**（批处理或管理界面），补录完成后系统内不应再存在无场景归属的实体记录（与 REQ-BS-05 对齐）。

---

### 3.2.4 EPC全域关联层——详细设计

> **可追溯**：与 `docs/EPC-Upgrade-Spec.md` v3.1 对应；EPC 从只读文档升级为全域关联层。

#### 核心定位

EPC 不是第六个模型，而是将五大核心模型+五大平台模型+组织模型+Entity Lifecycle+Agent Semantic Layer 串联为一体的**复合关联视图**。

#### EPC 链路数据结构

```typescript
interface EpcChain {
  id: string;
  name: string;
  entityId: string;            // 关联的聚合根实体
  description?: string;
  nodes: EpcNode[];
  edges: EpcEdge[];
  createdAt: string;
  updatedAt: string;
}

interface EpcNode {
  id: string;
  type: 'event' | 'function' | 'connector' | 'infoObject' | 'orgUnit';
  label: string;
  refs: EpcModelRef[];         // 关联的模型元素引用
  position?: { x: number; y: number };
  style?: Record<string, unknown>;
}

interface EpcEdge {
  id: string;
  source: string;              // 源节点ID
  target: string;              // 目标节点ID
  label?: string;
  type?: 'normal' | 'conditional';
  condition?: string;          // 条件表达式
}

interface EpcModelRef {
  modelType: 'data' | 'behavior' | 'rule' | 'event' | 'process' | 'governance' | 'metric' | 'dataSource' | 'masterData' | 'metadata' | 'organization';
  elementId: string;
  elementName?: string;
  refRole: 'primary' | 'input' | 'output' | 'constraint' | 'metric' | 'source' | 'permission'
         | 'guard' | 'compensate' | 'recovery' | 'intent' | 'term' | 'timeout';  // v3.1 新增
}
```

#### 全域关联矩阵 (v3.1)

| EPC节点 | 数据模型 | 行为模型 | 规则模型 | 事件模型 | 流程模型 | 治理模型 | 指标模型 | 数据源 | 主数据 | 元数据 | 组织模型 | **Lifecycle** | **Semantic** |
|---------|---------|---------|---------|---------|---------|---------|---------|--------|-------|-------|---------|:---:|:---:|
| Event   | 触发实体 | 状态转换 | 触发规则 | 事件定义 | 流程步骤 | 权限角色 | 关联指标 | 数据源 | 主数据 | 元数据 | 处理岗位 | State.entry/exitActions | Intent(触发类), BusinessTerm |
| Function| 输入输出实体 | 动作/转换 | 前后置规则 | 产生事件 | 流程步骤 | 执行角色 | 活动指标 | 数据源 | 主数据 | 元数据 | 责任岗位 | availableActions, guardCondition | Intent(操作类), ErrorRecovery |
| Connector| - | - | 分支规则 | - | 决策点 | 角色权限 | - | - | - | - | - | guardCondition | contextConstraints |
| InfoObject| 实体/属性 | - | 校验规则 | 变更事件 | - | 字段权限 | 质量指标 | 数据源 | 主数据 | 元数据 | - | dataVisibility | SemanticFieldMapping, BusinessTerm |
| OrgUnit | - | 行为约束 | 角色规则 | 事件处理 | 流程参与 | 角色/权限 | 考核指标 | - | - | - | 部门/岗位 | allowedRoles, notifyRoleIds | AgentPolicy |

#### 双向校验体系（71 条规则）

| 方向 | 编号前缀 | 规则数 | 核心问题 |
|------|---------|--------|---------|
| EPC → 模型 | VE | 17 | EPC引用的模型元素是否真实有效、一致、合法？ |
| 模型 → EPC | VM | 39 | 模型定义的元素是否被EPC覆盖？(10大模型+组织+Lifecycle+Semantic) |
| 交叉一致性 | VX | 15 | EPC关联声明与模型内部定义是否矛盾？ |

#### 推导生成

从已有模型自动推导 EPC 链路骨架：
1. 遍历聚合根的 DomainEvent → Event 节点
2. Event.trigger → 关联 StateMachine.Transition → Function 节点
3. Transition.fromState/toState → 标注状态
4. Action → Function 节点 + OrgUnit(执行角色)
5. Rule → Connector 条件分支
6. Orchestration.Step → Function 序列
7. Entity.Attribute → InfoObject 节点
8. State.availableActions → Function 节点关联的 State 上下文 (v3.1)
9. Transition.guardCondition → Connector 分支条件 (v3.1)
10. Transition.compensationAction → 回滚 Function 节点 (v3.1)
11. Intent → Function/Event 节点的语义关联 (v3.1)
12. AgentPolicy → OrgUnit 节点的策略关联 (v3.1)
8. Metric → 关联 Function/Event KPI
9. DataSource → 关联 InfoObject 数据来源
10. Position/Department → OrgUnit 节点

#### 流程图渲染

使用 @xyflow/react 自定义5种节点形状：
- Event: 六边形（起始）/ 椭圆（中间/终止）
- Function: 圆角矩形
- Connector: 菱形
- InfoObject: 矩形
- OrgUnit: 椭圆+阴影

#### 导出增强

| 格式 | 内容 |
|------|------|
| Markdown | 链路文档+关联模型清单+校验报告 |
| JSON | EpcChain完整数据+关联映射 |
| 整包 | 所有链路+关联模型快照 |

#### 1. 展示与生成逻辑

- **可见性**：仅在**聚合根**实体（`isAggregateRoot === true`）的详情页**页签区**显示「**EPC事件说明书**」页签；非聚合根**不显示**该页签。
- **交互**：页签内容为**只读**自动汇总；**不支持**新建、编辑、保存说明书草稿。
- **内容结构**（生成结果须包含以下逻辑章节，顺序可配置但须在技能模板中固定）：

| 序号 | 章节 | 数据来源 |
|------|------|----------|
| 1 | 实体基础信息 | 实体数据模型 / 实体主数据 |
| 2 | 业务背景/场景说明 | **严格**来自 `businessScenarioId` → `BusinessScenario.description`（**禁止** LLM 编造或拼接无关文案） |
| 3 | 事件列表 | 事件模型 |
| 4 | 关键业务规则 | 规则模型 |
| 5 | 关键行为流程 | 行为模型 |
| 6 | 相关数据结构 | 数据模型（字段/关系摘要） |
| 7 | 备注 | 可选；仅允许来自配置或显式备注字段，**不得**用生成文案顶替第 2 节 |

#### 2. 生成流程

1. 前端或后端在需要**展示**或**导出** EPC 事件说明书时，**必须调用**技能 **`business-spec-generator`**（入参至少包含：聚合根实体 ID、冻结版本/项目上下文、四类元模型快照、`businessScenarioId`）。
2. 该技能汇总：**聚合根实体**、**数据模型**、**行为模型**、**规则模型**、**事件模型**及 **`BusinessScenario`（至少 `description`）**，输出**结构化**说明书内容（建议 JSON AST + 渲染模板，便于导出与版本对比）。
3. **导出**：支持 **Markdown、PDF**（MVP 可先 Markdown，PDF 为增强）；**导出正文与页面展示一致**（同源：同一次技能输出或同哈希内容）。

#### 3. 关键约束

- 「业务背景/场景说明」**必须**等于业务场景表中 **`description` 字段原文引用**（允许换行与 Markdown 转义，**不允许**同义改写、扩写、摘要替代 unless 产品单独批准并记录版本）。
- **前后端均不得**用模板默认文案、占位符或 LLM 直接生成该段落正文。
- 非聚合根实体：前端路由与页签配置层**不注册** EPC 页签。

#### 4. 示例结构（导出/页面可参考）

```markdown
#### EPC事件说明书 - [实体名称]

#### 1. 实体基础信息
- 实体名称：[xxx]
- 实体编号：[xxx]
- 描述：[xxx]

#### 2. 业务背景/场景说明
[与 BusinessScenario.description 完全一致，逐字引用]

#### 3. 事件列表
| 事件名称 | 触发条件 | 处理流程 | 输入 | 输出 | 相关规则 |
|----------|----------|----------|------|------|----------|
| ...      | ...      | ...      | ...  | ...  | ...      |

#### 4. 关键业务规则
- …

#### 5. 关键行为流程
- …

#### 6. 相关数据结构
- …

#### 7. 备注
[如有]
```

---

### 3.2.5 组织体系与岗位模型——详细设计

> **可追溯**：与 `docs/Organization-Position-Spec.md` v2.0 对应

#### 核心类型

```typescript
interface Department {
  id: string;
  name: string;
  nameEn: string;
  code?: string;
  type: 'headquarters' | 'division' | 'department' | 'team' | 'group';
  parentId?: string;           // 组织树
  managerPositionId?: string;
  description?: string;
  status: 'active' | 'inactive';
  syncSource?: string;         // HR同步来源
  syncExternalId?: string;     // HR系统外部ID
  syncUpdatedAt?: string;      // 最后同步时间
}

interface PositionResponsibility {
  id: string;
  name: string;                // 职责名称
  description?: string;
  scope: 'entity' | 'process' | 'domain' | 'custom';
  scopeRefs: string[];         // 关联 Entity/Process/Domain IDs
  actions: string[];           // 可执行 Action IDs
  decisionAuthority: 'none' | 'recommend' | 'approve' | 'veto';
  delegateToPositionIds?: string[]; // 可委托岗位IDs
  isActive: boolean;
}

interface Position {
  id: string;
  name: string;
  nameEn: string;
  code?: string;
  departmentId: string;        // 归属部门
  parentPositionId?: string;   // 汇报线
  level?: number;
  roleIds: string[];           // → GovernanceRole
  headcount?: number;
  responsibilities: PositionResponsibility[];  // 结构化职责
  status: 'active' | 'inactive';
  syncSource?: string;
  syncExternalId?: string;
  syncUpdatedAt?: string;
}

interface OrganizationModel {
  id: string;
  departments: Department[];
  positions: Position[];
  syncConfig?: HRSyncConfig;
  lastSyncResult?: HRSyncResult;
}
```

#### HR 系统同步

- 支持 6 种 HR 数据源：飞书/钉钉/企微/SAP/Workday/自定义API
- 同步频率：实时(Webhook)/每小时/每天/每周/手动
- 字段映射：`HRFieldMapping` 定义 HR 字段 → 本体模型字段路径
- 冲突策略：HR优先/本地优先/合并/人工审核
- 差异比对：3-way diff，自动识别新增/更新/停用
- 安全：API凭证存后端环境变量，同步日志脱敏
- API: `POST /api/hr-sync/trigger`, `GET /api/hr-sync/config`, `GET /api/hr-sync/history`, `POST /api/hr-sync/resolve-conflict`

#### 关联链路

```
Department (组织树)
  └── Position (岗位)
        ├── roleIds → GovernanceRole (权限角色)
        │     └── permissions → 实体/动作/字段权限
        └── responsibilities[] → PositionResponsibility
              ├── scopeRefs → Entity / Process / Domain
              ├── actions → Action
              └── delegateToPositionIds → Position (委托链)
```

EPC 的 `EpcOrganizationalUnit` 通过 `refType/refId` 引用 Department 或 Position。

#### UI

建模工作台新增「组织」Tab，含部门树+岗位列表+结构化职责编辑+HR同步配置面板。

#### 双向校验(新增)

| 编号 | 规则 | 级别 |
|------|------|------|
| VM-O01 | 聚合根实体关联部门至少1个 | warning |
| VM-O02 | 部门树无环路 | error |
| VM-O03 | 活跃岗位必须有部门归属 | error |
| VM-O04 | 岗位引用的Role必须存在 | error |
| VM-O05 | 组织变更(部门/岗位)需EPC确认 | warning |
| VM-O06 | 岗位职责无重叠冲突 | warning |
| VM-O07 | 职责中的actions必须存在 | warning |
| VM-O08 | 委托链无环路 | info |
| VM-HR01 | syncExternalId引用HR侧记录存在 | error |
| VM-HR02 | 同步时效告警 | warning |
| VM-HR03 | 孤儿记录标记停用 | warning |
| VM-HR04 | 同步配置完整性 | info |

---

### 3.2.6 Entity Lifecycle（实体生命周期）——详细设计

> **可追溯**：与 `docs/Entity-Lifecycle-Spec.md` v1.0 对应

#### 设计目标

将 State 从"标签"升级为"一等公民"，让 Agent 无需跨模型拼凑即可完整理解 Entity 的生命周期。

#### State 增强

```typescript
interface State {
  // 现有字段保留...
  /** 进入状态时自动执行的动作ID列表 */
  entryActions?: string[];
  /** 离开状态时自动执行的动作ID列表 */
  exitActions?: string[];
  /** 在此状态下可执行的动作ID列表（Agent 操作菜单） */
  availableActions?: string[];
  /** 在此状态下生效的规则ID列表 */
  constraints?: string[];
  /** 在此状态下可操作的角色ID列表 */
  allowedRoles?: string[];
  /** 状态超时配置 */
  timeout?: StateTimeout;
  /** 状态级字段可见性 */
  dataVisibility?: StateDataVisibility;
  /** 业务语义标签 */
  semanticTag?: 'created' | 'pending' | 'processing' | 'reviewing' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'archived' | 'custom';
}
```

#### Transition 增强

```typescript
interface Transition {
  // 现有字段保留...
  /** 守卫条件表达式 */
  guardCondition?: string;
  guardFailureMessage?: string;
  /** 回滚/补偿动作ID */
  compensationAction?: string;
  /** 结构化的副作用 */
  sideEffects?: SideEffect[];
  /** 转换时发布的事件ID */
  publishEventId?: string;
  /** 转换时通知的角色ID列表 */
  notifyRoleIds?: string[];
  /** 是否需要审批 */
  requiresApproval?: boolean;
  approvalRoleIds?: string[];
  /** 是否记录审计日志 */
  auditLog?: boolean;
  /** 语义标签 */
  semanticTag?: 'submit' | 'approve' | 'reject' | 'cancel' | 'revise' | 'complete' | 'archive' | 'custom';
}
```

#### Action 增强

```typescript
interface Action {
  // 现有字段保留...
  /** 自然语言别名（Agent 意图匹配用） */
  aliases?: string[];
  /** 触发短语（Agent NLU 用） */
  triggerPhrases?: string[];
  successMessage?: string;
  failureMessage?: string;
  /** 失败后的回退动作ID */
  fallbackActionId?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  idempotencyKeyTemplate?: string;
}
```

#### 新增类型

- `EntityLifecycle`：聚合视图（actionsByState/rulesByState/eventsByState/rolesByState/auditTrail/stats）
- `LifecycleAuditEntry`：审计记录（timestamp/eventType/fromStateId/toStateId/actionId/actorRoleId/result/snapshot）
- `StateTimeout`：超时配置（duration/unit/onTimeout/targetStateId/notifyRoleIds/escalateRoleId）
- `StateDataVisibility`：字段可见性（visibleFields/editableFields/hiddenFields/requiredFields）

#### 校验规则（15 条）

| 编号 | 规则 | 级别 |
|------|------|------|
| V-LC-01 | 非终止状态必须有 outgoing transition | warning |
| V-LC-02 | 非初始状态必须有 incoming transition | warning |
| V-LC-03 | availableActions 引用完整性 | error |
| V-LC-04 | constraints 引用完整性 | error |
| V-LC-05 | allowedRoles 引用完整性 | error |
| V-LC-06 | timeout.targetStateId 有效性 | error |
| V-LC-07 | guardCondition 语法校验 | error |
| V-LC-08 | compensationAction 引用完整性 | error |
| V-LC-09 | dataVisibility 字段有效性 | error |
| V-LC-10 | 孤立状态检测 | warning |
| V-LC-11 | entryActions 引用完整性 | error |
| V-LC-12 | exitActions 引用完整性 | error |
| V-LC-13 | triggerableEvents 引用完整性 | error |
| V-LC-14 | fallbackActionId 引用完整性 | error |
| V-LC-15 | 终止状态不应有 outgoing transition | warning |

#### UI

- 建模工作台新增「生命周期」Tab：状态流转图（Mermaid/@xyflow）+ 状态详情 + 审计记录
- State 编辑对话框新增「生命周期配置」折叠面板
- Transition 编辑对话框新增「高级配置」折叠面板
- Action 编辑对话框新增「Agent 语义」折叠面板

#### API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/entity-lifecycle?entityId=xxx` | GET | 返回完整 EntityLifecycle JSON |

---

### 3.2.7 Agent Semantic Layer（Agent 语义层）——详细设计

> **可追溯**：与 `docs/Agent-Semantic-Layer-Spec.md` v1.0 对应

#### 定位

本体模型之上的第 11 个模型，专门解决"AI Agent 如何精准理解企业语义并正确执行任务"的问题。

#### 核心数据结构

```typescript
interface AgentSemanticLayer {
  intents: Intent[];                    // 意图列表
  dialogContextTemplate: DialogContext; // 对话上下文模板
  semanticRelations: SemanticRelation[]; // 语义关系
  businessTerms: BusinessTerm[];       // 业务术语词典
  errorRecoveries: ErrorRecovery[];    // 错误恢复策略
  temporalValidities: TemporalValidity[]; // 时效性标记
  fieldMappings: SemanticFieldMapping[];  // 跨实体字段映射
  agentPolicies: AgentPolicy[];        // Agent 行为策略
  metadata: { version, lastUpdated, totalIntents, totalTerms, totalRelations, coverage };
}
```

#### 9 大子模型

| 子模型 | 核心字段 | 解决的问题 |
|--------|---------|-----------|
| Intent | triggerPhrases/actionId/slotFilling/contextConstraints | "用户说X时我该做什么？" |
| SlotFillingStrategy | slots/requiredSlots/fillOrder/allowBatchFill | "参数不完整时追问什么？" |
| DialogContext | focusedEntity/lastAction/referencedEntities/pendingIntent | "用户说的'它'指什么？" |
| SemanticRelation | type(is-a/part-of/synonym-of等)/sourceEntityId/targetEntityId | "采购订单和销售订单什么关系？" |
| BusinessTerm | term/synonyms/definition/examples/modelRefs | "这个术语在不同上下文中的含义？" |
| ErrorRecovery | errorType/errorPattern/strategy/recoveryActionId/agentMessage | "操作失败了怎么办？" |
| TemporalValidity | targetType/targetId/effectiveDate/expiryDate/version | "这个规则现在生效吗？" |
| SemanticFieldMapping | sourceField/targetField/type/transformRule | "物料.编码和订单.物料编码是同一个吗？" |
| AgentPolicy | roleId/policyType/scope/rules/priority | "Agent能自主执行哪些操作？" |

#### Agent 工作流

```
用户: "帮我创建一个采购订单，供应商华为，数量100"

Step 1: 意图识别 → Intent: create_po (confidence: 0.95)
Step 2: 槽位填充 → supplier=华为 ✅, quantity=100 ✅, deliveryDate=? ❌
Step 3: 追问 → "好的，还需要确认交货日期，您希望什么时候交货？"
Step 4: 确认+执行 → 调用 Action: createPurchaseOrder
```

#### 校验规则（15 条）

| 编号 | 规则 | 级别 |
|------|------|------|
| V-AS-01 | Intent.actionId 引用完整性 | error |
| V-AS-02 | Intent.targetEntityId 引用完整性 | error |
| V-AS-03 | Intent.slotFilling.slots[].paramName 必须在 Action.parameters 中 | error |
| V-AS-04 | Intent.requiredSlots 必须是 slots 的子集 | error |
| V-AS-05 | SemanticRelation 两端实体必须存在 | error |
| V-AS-06 | BusinessTerm.modelRefs 引用完整性 | error |
| V-AS-07 | ErrorRecovery.actionId 引用完整性 | error |
| V-AS-08 | ErrorRecovery.recoveryActionId 引用完整性 | error |
| V-AS-09 | AgentPolicy.roleId 引用完整性 | error |
| V-AS-10 | SemanticFieldMapping 两端字段必须存在 | error |
| V-AS-11 | TemporalValidity.targetId 引用完整性 | error |
| V-AS-12 | TemporalValidity 时间范围合法性 | error |
| V-AS-13 | Intent.triggerPhrases 非空 | warning |
| V-AS-14 | 同一 Action 无 ErrorRecovery | warning |
| V-AS-15 | 同一 Role 无 AgentPolicy | warning |

#### Agent 完备性评估

| 维度 | 实施前 | 实施后 | 提升 |
|------|:---:|:---:|:---:|
| 身份识别 | 8 | 9 | +1 |
| 可操作性 | 6 | 9 | +3 |
| 时机判断 | 7 | 9 | +2 |
| 约束感知 | 7 | 8 | +1 |
| 后果预知 | 6 | 8 | +2 |
| 归属认知 | 6 | 8 | +2 |
| 数据溯源 | 5 | 7 | +2 |
| 度量感知 | 5 | 5 | — |
| 关联理解 | 5 | 9 | +4 |
| 意图映射 | 0 | 9 | +9 |
| **总分** | **55** | **81** | **+26** |

#### UI

- 新增「语义层」管理入口（与领域选择/项目管理/建模工作台/EPC/手册平级）
- 8 个子模块：意图管理/术语词典/语义关系/错误恢复/Agent策略/字段映射/时效管理/完备性仪表盘

#### API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/agent-semantic-layer` | GET | 返回完整 AgentSemanticLayer JSON（含 coverage 统计） |

---

### 3.2.6 Excel导入与版本审核——详细设计

> **可追溯**：与 `assets/REQUIREMENT.md` 第六章对应

#### API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/excel-template` | GET | 下载含7个Sheet(填写说明+实体/属性/关系/状态机/规则/事件)的.xlsx模板 |
| `/api/excel-import` | POST | 上传.xlsx(5MB上限)，校验+解析+生成待审核版本 |

#### 校验规则

- 文件格式: 仅 .xlsx，最大5MB
- Sheet结构: 必须包含6个数据Sheet
- 必填字段: 各Sheet(必填)标记字段
- 枚举值: 实体角色、数据类型、关系类型、规则类型、触发时机等
- 布尔类型: 必须为 true/false
- 跨Sheet引用: 属性/关系/状态机/规则/事件中的实体英文名必须在实体Sheet中存在

#### 版本状态扩展

```typescript
type VersionStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';
```

#### 流程

1. 下载模板 → 填写数据 → 上传文件
2. 后端校验(格式/大小/Sheet结构/必填/枚举/引用完整性) + 解析为模型对象
3. 生成 `pending_review` 版本(数据来自Excel而非工作区快照)
4. 审核通过 → 应用Excel数据到工作区；驳回 → 填写原因

#### Store方法

- `createVersionFromParsedData({ parsedData })` — 从Excel解析数据创建版本
- `approveVersion(versionId)` — 审核通过，应用parsedData到工作区
- `rejectVersion(versionId, reason)` — 驳回版本

---

### 3.2.7 属性编辑与主数据关联——详细设计

> **可追溯**：与 `REQUIREMENT.md` 中 **REQ-ATTR-MD-01～REQ-ATTR-MD-05** 对应。

| 需求编号 | 设计要点 |
|----------|----------|
| REQ-ATTR-MD-01 | 「是否关联主数据」开关 |
| REQ-ATTR-MD-02 | 关联时主数据类型下拉，数据来自主数据管理 |
| REQ-ATTR-MD-03 | 持久化 `isMasterDataRef`、`masterDataType`、`masterDataField` |
| REQ-ATTR-MD-04 | 前后端与主数据模块联动 |
| REQ-ATTR-MD-05 | 关联为真则类型必填；为假则清空 |

#### 1. UI 与交互

- 属性编辑弹窗增加 **「是否关联主数据」** 开关（布尔，`isMasterDataRef`）。
- 当开关为 **是**：
  - 展示 **主数据类型** 下拉框（选项来自**主数据管理模块**中已注册类型/定义，如组织、物料、客户等）。
  - **可选**：**主数据字段**二级下拉（`masterDataField`），用于绑定到该主数据类型下的具体列/字段。
- 当开关为 **否**：
  - 隐藏主数据类型与字段控件，并在保存前 **清空** `masterDataType`、`masterDataField`（或不提交）。

#### 2. 数据结构

建议在属性（`Attribute`）或等价结构上扩展：

```typescript
interface AttributeMasterDataExtension {
  isMasterDataRef: boolean;
  masterDataType?: string;   // 主数据定义 ID 或类型编码，与主数据管理一致
  masterDataField?: string;  // 可选：主数据字段名
}
```

校验规则：

- `isMasterDataRef === true` ⇒ `masterDataType` **必填**。
- `isMasterDataRef === false` ⇒ `masterDataType`、`masterDataField` **必须为空或未设置**。

#### 3. 接口与校验

| 接口语义 | 请求 | 响应/校验 |
|----------|------|-----------|
| 新增/更新属性 | Body 含 `isMasterDataRef`、`masterDataType?`、`masterDataField?` | 服务端按上表校验；非法组合返回 400 及明确字段错误 |
| 查询属性详情 | `GET …/attributes/:id` | 返回上述字段供前端回显 |
| 主数据类型列表 | `GET /api/masterdata/definitions`（或既有主数据 API） | 供下拉；与主数据管理模块同源 |
| 主数据字段列表（可选） | `GET /api/masterdata/definitions/:typeId/fields` | 供二级下拉 |

前端通过上述接口获取类型及字段列表；**不得**在前端硬编码完整主数据枚举（允许缓存）。

#### 4. 元数据模板关联与「数据类型 / 引用」的关系（必须与 REQUIREMENT 2.1.3.1～2.1.3.6 一致）

以下与 `REQUIREMENT.md` **§2.1.3** 子节对齐，作为实现与验收的单一事实来源（SSOT）摘要。

**三个独立维度**

| 维度 | 说明 |
|------|------|
| 关联元数据模板 | 下拉选择某一 `MetadataTemplate`，或选「不关联元数据」 |
| 数据类型 | 字符串、长文本、…、枚举、**引用** 等 |
| 引用指向（仅类型=引用） | **引用本体实体** 或 **引用主数据**（二选一，互斥） |

**模式 A：已关联元数据模板（强绑定）**

- **数据类型**、引用语义（若有）**以模板为准**；属性编辑区**不提供**与模板冲突的「数据类型」手选，亦不提供与模板冲突的「引用实体 / 引用主数据」自由编辑。
- 界面可展示**只读**类型回显，或完全隐藏相关控件。
- 对应需求：**REQ-ATTR-META-01～03**（见 `REQUIREMENT.md`）。

**模式 B：不关联元数据**

- 用户可从完整 **数据类型** 清单中选择（含 **引用**）。
- **不关联元数据**不排除「引用主数据」：`isMasterDataRef` 与主数据类型下拉与「元数据模板」为**不同维度**。
- 对应需求：**REQ-ATTR-META-04、05**。

**类型 = 引用（Reference）时的二分**

- **引用实体**：`referenceKind: 'entity'` + `referencedEntityId`（本体内实体）。
- **引用主数据**：`referenceKind: 'masterData'` + `isMasterDataRef: true` + `masterDataType` 必填 + 可选 `masterDataField`。
- **默认**不允许同一条属性同时有效绑定「引用实体」与「主数据引用」两套目标（互斥）。

**合法组合矩阵**与 **建议持久化结构 `AttributeModel`** 见 `REQUIREMENT.md` **§2.1.3.5、§2.1.3.6**。

### 3.3 代码生成器规格

#### 3.3.1 生成物结构

```
生成的代码包（contract-management-v1.0.0/）：
├── docker-compose.yml          # Docker编排
├── README.md                   # 部署说明
├── backend/                    # Flask后端
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py                  # 主应用
│   ├── config.py
│   ├── models/
│   │   ├── dynamic_entity.py   # 动态实体基类
│   │   └── generated/          # 生成的实体类
│   ├── api/
│   │   ├── entities.py         # CRUD接口
│   │   ├── state_machine.py    # 状态机接口
│   │   ├── rules.py            # 规则校验接口
│   │   └── agent.py            # AI编排器接口
│   ├── ai/                     # AI交付加载
│   │   ├── orchestrator.py     # 编排器
│   │   ├── intent_analyzer.py  # 意图识别
│   │   ├── tool_executor.py    # 工具执行
│   │   ├── self_healing.py     # 自愈机制
│   │   └── prompts/
│   │       └── system_prompt.jinja2
│   ├── services/               # 领域技能
│   │   └── generated/
│   ├── rules/                  # 规则引擎
│   │   └── evaluator.py
│   ├── state_machine/
│   │   └── engine.py
│   └── utils/
│       └── sql_sanitizer.py    # SQL安全过滤
├── frontend/                   # React前端
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # 三栏式布局
│       ├── components/
│       │   ├── layout/
│       │   │   ├── ThreeColumnLayout.tsx
│       │   │   ├── LeftSidebar.tsx      # 左栏：对话
│       │   │   ├── CenterPanel.tsx      # 中栏：数据视图
│       │   │   └── RightSidebar.tsx     # 右栏：上下文
│       │   ├── chat/
│       │   │   ├── ChatHistory.tsx
│       │   │   ├── ChatInput.tsx
│       │   │   └── MessageBubble.tsx
│       │   ├── data/
│       │   │   ├── EntityList.tsx       # 列表视图
│       │   │   ├── EntityForm.tsx       # 表单视图
│       │   │   ├── FlowchartView.tsx    # 流程视图（默认）
│       │   │   ├── ERDiagramView.tsx    # ER图视图
│       │   │   └── TableView.tsx        # 表格视图
│       │   ├── visualization/
│       │   │   ├── EChartsRenderer.tsx  # ECharts渲染
│       │   │   └── MermaidRenderer.tsx  # Mermaid渲染
│       │   └── context/
│       │       └── EntityContext.tsx    # 右栏上下文
│       ├── services/
│       │   ├── entityApi.ts
│       │   ├── agentApi.ts
│       │   └── versionApi.ts
│       └── store/
│           └── deliveryStore.ts
└── database/
    ├── init.sql                # 初始化脚本
    └── seed.sql                # 示例数据
```

---

## 4. 系统B：交付加载规格

### 4.1 技术栈

| 层级 | 技术 | 版本 |
|:---|:---|:---|
| 前端框架 | React | 18+ |
| 构建工具 | Vite | 4+ |
| UI组件 | Ant Design | 5.x |
| 图表 | ECharts | 5.x |
| 流程图 | Mermaid | 10.x |
| 后端框架 | Flask | 2.3+ |
| ORM | SQLAlchemy | 2.0+ |
| 数据库 | SQLite | 3.x |
| AI SDK | OpenAI/DeepSeek | - |
| 部署 | 版本化代码包 | - |

### 4.2 三栏式布局

```typescript
// ThreeColumnLayout.tsx
interface LayoutState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  currentView: ViewType;      // 当前中栏视图
  focusEntity: EntityRef | null; // 右栏上下文
}

const ThreeColumnLayout: React.FC = () => {
  const [state, setState] = useState<LayoutState>({
    leftCollapsed: false,
    rightCollapsed: false,
    currentView: { type: 'flowchart' },  // 默认流程视图
    focusEntity: null
  });

  return (
    <Layout className="delivery-layout">
      {/* 左栏：对话（280px固定） */}
      <Sider width={280} collapsed={state.leftCollapsed}>
        <ChatInterface 
          onEntityFocus={(entity) => setState({...state, focusEntity: entity})}
        />
      </Sider>

      {/* 中栏：数据视图（自适应） */}
      <Content>
        <CenterPanel 
          view={state.currentView}
          onViewChange={(view) => setState({...state, currentView: view})}
        />
      </Content>

      {/* 右栏：上下文（300px固定，自动跟随） */}
      <Sider width={300} collapsed={state.rightCollapsed}>
        <EntityContext entity={state.focusEntity} />
      </Sider>
    </Layout>
  );
};
```

### 4.3 数据视图模式（6种）

| 视图 | 标识 | 默认 | 说明 |
|:---|:---|:---|:---|
| 列表视图 | `list` | - | 实体表格，筛选/分页/排序 |
| 表单视图 | `form` | - | 单实体详情/编辑 |
| **流程视图** | `flowchart` | ✅ **默认** | Mermaid状态流转图 |
| ER图视图 | `erdiagram` | - | Mermaid实体关系图 |
| 表格视图 | `table` | P0 | 明细数据表格 |
| 图表视图 | `chart` | - | ECharts统计图表 |

### 4.4 AI交付加载API

```typescript
// AI执行接口
POST /api/agent/execute
Content-Type: application/json

Request:
{
  "sessionId": "sess-xxx",
  "userInput": "按部门统计本季度合同金额饼图",
  "context": {
    "currentView": { "type": "flowchart" },
    "focusEntity": { "type": "contract", "id": "2025-001" }
  }
}

Response:
{
  "message": "已为您生成按部门统计的合同金额分布",
  "actions": [
    {
      "type": "EXECUTE_QUERY",
      "sql": "SELECT d.name, SUM(c.total_amount) as amount FROM contract c JOIN department d ON c.dept_id = d.id WHERE c.sign_date >= '2025-01-01' GROUP BY d.name",
      "explanation": "统计2025年各部门合同总金额"
    },
    {
      "type": "GENERATE_CHART",
      "chartType": "pie",
      "config": { /* ECharts配置 */ }
    },
    {
      "type": "OPEN_TAB",
      "page": "chart_view",
      "params": { "chartId": "chart-xxx" }
    }
  ],
  "contextUpdates": {
    "focusEntity": { "type": "chart", "id": "chart-xxx" }
  },
  "healingLog": null  // 如有自愈过程，展示详细修正步骤
}
```

---

## 5. DDD领域事件设计

### 5.1 核心设计决策

| 议题 | 决策 | 说明 |
|:---|:---|:---|
| E1 聚合根约束 | **标记聚合根** | 数据模型`isAggregateRoot`标记，仅聚合根可发布事件 |
| E2 事务边界 | **默认AFTER_COMMIT** | 事务提交后发布（默认），事务内执行（高级BEFORE_COMMIT） |
| E3 事件内容 | **强制精简模式** | "领域事件模式"开关，限制5个字段，强制ID+关键字段 |
| E4 幂等性 | **事件ID去重** | 交付加载生成唯一事件ID，订阅者记录已处理ID |
| E5 跨上下文 | **保持现状** | MVP阶段webhook作为跨系统方式 |
| E6 事件溯源 | **不支持** | MVP阶段事件仅作为通知，状态存储于实体表 |

### 5.2 事件模型定义

```typescript
interface EventDefinition {
  id: string;
  name: string;                    // 过去时命名，如ContractApprovedEvent
  nameEn: string;                  // ContractApprovedEvent
  
  // E1: 聚合根约束
  entityId: string;
  entityIsAggregateRoot: boolean;  // 校验：必须为true
  
  // E2: 事务边界
  trigger: 'create' | 'update' | 'delete' | 'state_change' | 'custom';
  transactionPhase: 'AFTER_COMMIT' | 'BEFORE_COMMIT';  // 默认AFTER_COMMIT
  
  // E3: 强制精简模式
  isDomainEvent: boolean;          // 领域事件模式开关
  payloadFields: string[];        // isDomainEvent=true时最多5个
  
  // 载荷定义（精简模式限制）
  payload: {
    mandatory: ['entity_id', 'related_aggregate_id'];  // 强制字段
    optional: string[];  // 可选字段，最多3个
  };
  
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface EventSubscription {
  id: string;
  name: string;
  eventId: string;
  
  // E4: 幂等性
  handlerId: string;               // 处理器唯一标识
  idempotencyKeyPattern: string;  // 默认: "{event_id}:{handler_id}"
  
  processingType: 'sync' | 'async';
  actionType: 'skill' | 'webhook' | 'notification' | 'script';
  actionRef: string;
  
  condition?: string;              // 可选过滤条件
  createdAt: string;
}
```

### 5.3 建模界面示例

```
事件定义编辑器：
┌─────────────────────────────────────────────────────────┐
│  事件定义: [ContractApprovedEvent          ]            │
│                                                         │
│  关联实体: [合同                ]  ☑ 聚合根 (E1)        │
│                                                         │
│  触发时机: [state_change       ▼]                       │
│  事务阶段: [AFTER_COMMIT       ▼]  ← 默认（E2）         │
│            - AFTER_COMMIT: 事务提交后（默认，业务动作）   │
│            - BEFORE_COMMIT: 事务内（高级，校验/审计）     │
│                                                         │
│  ☑ 领域事件模式 (E3)                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  精简模式已启用：                                  │   │
│  │  • 最多选择5个字段                                │   │
│  │  • 强制包含: contract_id, customer_id              │   │
│  │  • 推荐: approved_amount, approved_date, approver_id│  │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  载荷字段:                                              │
│  ☑ contract_id (强制)     ☑ customer_id (强制)          │
│  ☑ approved_amount        ☑ approved_date               │
│  ☑ approver_id                                            │
│  ☐ contract_content (禁用 - 大文本)                      │
│                                                         │
│  订阅列表:                                              │
│  ├─ 发票自动创建 (sync, skill)                         │
│  │   动作: invoice_service.create_from_contract         │
│  ├─ 邮件通知 (async, webhook)                          │
│  │   动作: https://api.company.com/webhooks/notify      │
│  └─ 审计日志 (async, script)                             │
│      动作: audit_logger.log_contract_approval            │
│                                                         │
│              [  保存  ]        [  取消  ]               │
└─────────────────────────────────────────────────────────┘
```

### 5.4 交付加载事件处理

```python
# 事件发布（E1+E2+E3）
class DomainEventPublisher:
    def publish(self, event_def: EventDefinition, entity: Entity, 
                context: dict) -> DomainEvent:
        # E1: 聚合根校验
        if not entity.is_aggregate_root:
            raise DomainError(f"实体 {entity.type} 不是聚合根，不能发布领域事件")
        
        # E3: 构建精简载荷
        if event_def.is_domain_event:
            payload = self._build_minimal_payload(entity, event_def.payload_fields)
        else:
            payload = self._build_standard_payload(entity)
        
        event = DomainEvent(
            id=generate_uuid(),           # E4: 幂等ID
            type=event_def.name_en,
            aggregate_type=entity.type,
            aggregate_id=entity.id,
            payload=payload,               # E3: 精简
            occurred_at=datetime.utcnow(),
            version=entity.version
        )
        
        # E2: 事务阶段处理
        if event_def.transaction_phase == 'BEFORE_COMMIT':
            # 立即执行（事务内）
            self._dispatch_sync(event, context)
        else:  # AFTER_COMMIT（默认）
            # 注册事务提交后回调
            db.session.after_commit(lambda: self._dispatch(event, context))
        
        return event

# 事件订阅处理（E4幂等）
class EventSubscriber:
    def handle(self, event: DomainEvent, subscription: EventSubscription):
        # 构建幂等键
        idempotency_key = f"{event.id}:{subscription.handler_id}"
        
        with db.transaction():
            # 尝试记录处理（INSERT IGNORE语义）
            recorded = ProcessedEvent.insert_ignore(
                event_id=event.id,
                handler_id=subscription.handler_id,
                idempotency_key=idempotency_key,
                processed_at=datetime.utcnow()
            )
            
            if not recorded:
                logger.info(f"事件 {event.id} 已被处理器 {subscription.handler_id} 处理，跳过")
                return  # 已处理，幂等返回
            
            # 执行业务逻辑
            self._execute_action(subscription, event)
```

---

## 6. AI编排器详细设计

### 6.1 架构组件

```
┌─────────────────────────────────────────────────────────┐
│                    AI Agent Orchestrator                 │
├─────────────────────────────────────────────────────────┤
│  1. 上下文管理器 (Context Manager)                        │
│     ├── 会话历史（SQLite）                               │
│     ├── 当前聚焦实体追踪                                 │
│     └── 元模型语义缓存（文件监听热载）                     │
├─────────────────────────────────────────────────────────┤
│  2. 意图分析器 (Intent Analyzer) - 本地执行               │
│     ├── 分类：query/analyze/operate/navigate             │
│     ├── 实体链接：识别涉及的实体类型                       │
│     └── 操作提取：CRUD、聚合、时序等                     │
├─────────────────────────────────────────────────────────┤
│  3. 语义注入器 (Semantic Injector)                       │
│     ├── 按需注入：仅直接关联实体（Q3.3）                  │
│     ├── 混合格式：JSON Schema + 自然语言注释（Q3.2）      │
│     └── 缓存：元模型文件监听热载（Q3.4）                  │
├─────────────────────────────────────────────────────────┤
│  4. LLM策略引擎 (LLM Strategy) - 远程调用                │
│     ├── 单模型：DeepSeek-V3/豆包                         │
│     ├── Function Calling：结构化工具调用                  │
│     └── 温度：0.3（低随机性）                             │
├─────────────────────────────────────────────────────────┤
│  5. 工具执行器 (Tool Executor)                            │
│     ├── execute_query: 只读SQL（安全过滤）               │
│     ├── call_skill: 领域技能（写操作）                    │
│     ├── open_ui: 路由跳转（OPEN_TAB等）                 │
│     └── generate_chart: ECharts/Mermaid配置生成          │
├─────────────────────────────────────────────────────────┤
│  6. 自愈机制 (Self-Healing) - 最多2次重试（Q6.2）        │
│     ├── 错误捕获：SQL/工具执行异常                        │
│     ├── 修正Prompt：错误信息+元模型+原始调用               │
│     ├── LLM分析：生成修正方案                            │
│     └── 详细展示：完整修正过程（Q6.4）                    │
└─────────────────────────────────────────────────────────┘
```

### 6.2 系统Prompt模板

```jinja2
你是一个{{ domain }}领域的业务系统AI助手，具备以下领域知识：

【数据模型】（按需注入：{{ injected_entity_names }}）

{{ injected_entities_json }}

关键字段说明：
{{ field_descriptions }}

【行为模型】
{{ state_machine_summary }}

【规则模型】
{{ rules_summary }}

【当前上下文】
- 当前用户：{{ user.name }} ({{ user.role }})
- 会话历史：{{ conversation_history }}
- 当前聚焦实体：{{ focus_entity }}

【可用工具】
1. execute_query: 执行只读SQL查询（自动阻断UPDATE/DELETE/INSERT）
   - 参数：sql (string), explanation (string)
   
2. call_skill: 调用业务技能（写操作）
   - 参数：skill_name (string), parameters (object)
   - 可用技能：{{ available_skills }}
   
3. open_ui: 打开UI页面
   - 参数：action (OPEN_TAB/OPEN_MODAL/NAVIGATE), page (string), params (object)
   
4. generate_chart: 生成图表配置
   - 参数：chart_type (bar/line/pie/table/mermaid_flow/mermaid_er), 
           title (string), data (array), config (object)

请根据用户输入，选择合适的工具并生成参数。优先使用execute_query回答数据问题，
使用call_skill执行写操作，使用generate_chart生成可视化。
```

### 6.3 自愈机制详细流程

```python
class SelfHealingExecutor:
    MAX_RETRIES = 2  # Q6.2确认：最多2次
    
    async def execute_with_healing(self, tool_call: dict, context: dict) -> Result:
        attempt = 0
        healing_log = []
        
        while attempt <= self.MAX_RETRIES:
            try:
                result = await self.tool_executor.execute(tool_call)
                if healing_log:
                    # 有自愈过程，返回详细展示（Q6.4）
                    return Success(result, healing_log=healing_log)
                return Success(result)
                
            except ExecutionError as e:
                attempt += 1
                if attempt > self.MAX_RETRIES:
                    break  # 重试耗尽
                
                # 构建修正Prompt
                healing_prompt = self._build_healing_prompt(
                    original_call=tool_call,
                    error=e,
                    context=context,
                    attempt=attempt
                )
                
                # 请求LLM分析修正
                correction = await self.llm.generate_correction(healing_prompt)
                
                healing_log.append({
                    "attempt": attempt,
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "analysis": correction.analysis,
                    "correction": correction.action
                })
                
                # 应用修正
                tool_call = self._apply_correction(tool_call, correction)
        
        # 重试耗尽，返回原始错误（Q6.3确认）
        raise SelfHealingExhaustedError(
            message=f"经过{self.MAX_RETRIES}次尝试仍无法修正",
            healing_log=healing_log,
            original_error=str(e)
        )
    
    def _build_healing_prompt(self, original_call, error, context, attempt):
        return f"""
执行工具调用时发生错误（第{attempt}次重试）。

原始调用：
{json.dumps(original_call, indent=2, ensure_ascii=False)}

错误信息：{str(error)}
错误类型：{type(error).__name__}

当前数据模型上下文：
{json.dumps(context.get('injected_entities', {}), ensure_ascii=False, indent=2)[:1000]}

请分析错误原因：
1. 如果是SQL错误，检查字段名、表名是否正确（参考数据模型定义）
2. 如果是参数错误，检查参数类型和值是否符合要求
3. 如果是语法错误，修正SQL/JSON语法

返回JSON格式：
{{
    "analysis": "错误原因分析...",
    "corrected_call": {{ 修正后的工具调用参数 }}
}}
"""
```

### 6.4 工具定义（Function Calling Schema）

```json
{
  "tools": [
    {
      "name": "execute_query",
      "description": "执行安全的只读SQL查询，自动阻断任何数据修改操作",
      "parameters": {
        "type": "object",
        "properties": {
          "sql": {
            "type": "string",
            "description": "SELECT语句，支持JOIN、GROUP BY、聚合函数、子查询"
          },
          "explanation": {
            "type": "string",
            "description": "用自然语言解释这条查询的业务意图，用于审计"
          }
        },
        "required": ["sql", "explanation"]
      }
    },
    {
      "name": "call_skill",
      "description": "调用后端领域服务执行写操作或复杂业务逻辑",
      "parameters": {
        "type": "object",
        "properties": {
          "skill_name": {
            "type": "string",
            "enum": ["contract_service.create", "contract_service.update", 
                     "contract_service.transition", "customer_service.create",
                     "invoice_service.create", "event_publisher.publish"]
          },
          "parameters": {
            "type": "object",
            "description": "技能所需的参数对象，必须符合技能schema"
          }
        },
        "required": ["skill_name", "parameters"]
      }
    },
    {
      "name": "open_ui",
      "description": "指示前端打开特定页面或表单，或切换当前视图",
      "parameters": {
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": ["OPEN_TAB", "OPEN_MODAL", "NAVIGATE", "SWITCH_VIEW"],
            "description": "OPEN_TAB: 中栏新标签, OPEN_MODAL: 弹窗, NAVIGATE: 整页跳转, SWITCH_VIEW: 切换中栏视图"
          },
          "page": {
            "type": "string",
            "description": "页面标识：entity_list, entity_form, entity_detail, flowchart_view, erdiagram_view, chart_view, table_view"
          },
          "params": {
            "type": "object",
            "description": "页面参数：{entity_type, entity_id, mode, view_type等}"
          }
        },
        "required": ["action", "page"]
      }
    },
    {
      "name": "generate_chart",
      "description": "生成数据可视化图表配置，支持ECharts统计图表和Mermaid流程图",
      "parameters": {
        "type": "object",
        "properties": {
          "chart_type": {
            "type": "string",
            "enum": ["bar", "line", "pie", "scatter", "table", 
                     "mermaid_flow", "mermaid_er", "relation_graph"],
            "description": "图表类型：bar/line/pie为ECharts统计图，mermaid_flow为状态流程图，mermaid_er为实体关系图"
          },
          "title": {
            "type": "string",
            "description": "图表标题"
          },
          "data": {
            "type": "array",
            "description": "图表数据数组，ECharts为{name, value}对象，Mermaid为字符串定义"
          },
          "config": {
            "type": "object",
            "description": "额外配置：ECharts配置项或Mermaid主题"
          }
        },
        "required": ["chart_type", "title", "data"]
      }
    },
    {
      "name": "respond",
      "description": "直接向用户返回自然语言响应，不包含工具调用",
      "parameters": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string",
            "description": "Markdown格式的响应内容，可包含表格、列表等"
          },
          "suggestions": {
            "type": "array",
            "description": "建议的下一步操作按钮文本",
            "items": {"type": "string"}
          }
        },
        "required": ["message"]
      }
    }
  ]
}
```

---

## 7. 实施路线图

### 7.1 里程碑规划（16-24周）

| 阶段 | 周期 | 目标 | 关键交付物 | 验收标准 |
|:---|:---|:---|:---|:---|
| **M1** | Week 1-4 | 建模工具增强 | 版本管理功能、发布对话框、聚合根标记 | 可创建版本、标记聚合根 |
| **M2** | Week 5-8 | 代码生成器 | 后端生成器（Flask模型/API）、前端生成器（React组件）、Docker配置 | 点击"发布"生成可运行的代码包 |
| **M3** | Week 9-12 | AI编排器核心 | 意图识别、按需注入、混合格式Prompt、工具执行 | AI能理解自然语言并调用工具 |
| **M4** | Week 13-16 | 交付加载体系 | 三栏式布局、6种数据视图、对话界面、版本切换 | 交付加载系统可加载版本、自然语言操作 |
| **M5** | Week 17-20 | 自愈机制+可视化 | 错误修正循环、ECharts/Mermaid渲染、详细展示 | SQL错误自动修正、图表静态展示 |
| **M6** | Week 21-24 | DDD事件增强 | 聚合根约束、事务边界、精简模式、幂等性 | 事件发布符合DDD规范、订阅幂等 |

### 7.2 详细任务分解

#### M1: 建模工具增强（Week 1-4）

```
Week 1-2: 版本管理基础
├── 数据模型：ProjectVersion类型定义
├── API：/api/versions CRUD
├── UI：版本列表、创建版本对话框
└── 存储：Zustand状态+localStorage持久化

Week 3-4: 发布功能+聚合根标记
├── 发布对话框：版本号、名称、选项配置
├── 聚合根标记：Entity.isAggregateRoot字段
├── UI增强：实体编辑器聚合根复选框
└── 校验：非聚合根实体发布事件时警告
```

#### M2: 代码生成器（Week 5-8）

```
Week 5-6: 后端生成器
├── SQLAlchemy模型生成（动态实体）
├── Flask API路由生成（CRUD+状态机+规则）
├── 领域技能骨架生成
└── AI编排器服务生成（Prompt模板）

Week 7-8: 前端生成器+Docker
├── React组件生成（列表/表单/详情）
├── 三栏式布局模板
├── ECharts/Mermaid渲染组件
├── docker-compose.yml模板
└── 整合测试：生成→构建→运行
```

#### M3: AI编排器（Week 9-12）

```
Week 9-10: 核心引擎
├── 意图分析器：分类+实体链接
├── 语义注入器：按需注入+混合格式
├── 上下文管理器：会话+聚焦实体
└── 文件监听：元模型变更热载

Week 11-12: 工具执行
├── execute_query：SQL生成+安全过滤
├── call_skill：技能调用封装
├── open_ui：路由指令生成
└── generate_chart：ECharts/Mermaid配置生成
```

#### M4: 交付加载体系（Week 13-16）

```
Week 13-14: 基础布局
├── ThreeColumnLayout实现
├── LeftSidebar：对话历史+输入
├── CenterPanel：视图切换框架
└── RightSidebar：实体上下文

Week 15-16: 数据视图+版本切换
├── 6种视图实现（list/form/flowchart/erdiagram/table/chart）
├── 版本API：/api/delivery/version
├── 版本切换UI
└── 端到端：建模→发布→交付加载
```

#### M5: 自愈+可视化（Week 17-20）

```
Week 17-18: 自愈机制
├── 错误捕获：SQL/工具异常分类
├── 修正Prompt构建
├── 重试循环（最多2次）
├── 详细展示：修正过程日志
└── 降级：原始错误返回

Week 19-20: 可视化渲染
├── EChartsRenderer：pie/bar/line/table
├── MermaidRenderer：flowchart/erdiagram
├── 静态展示（无交互）
└── AI自动识别图表类型
```

#### M6: DDD事件增强（Week 21-24）

```
Week 21-22: 事件发布增强
├── 聚合根约束校验（E1）
├── 事务阶段配置（E2：AFTER_COMMIT默认）
├── 精简模式实现（E3：5字段限制）
└── 事件存储表设计（非溯源，仅通知）

Week 23-24: 订阅幂等+集成
├── 事件ID生成（UUID）
├── 订阅者处理记录表
├── 幂等性检查（INSERT IGNORE语义）
├── 端到端测试：事件流完整验证
└── 文档：DDD事件最佳实践指南
```

### 7.3 验收标准汇总

| 场景 | 验收标准 |
|:---|:---|
| **版本发布** | 建模工具点击"发布"→生成代码包→`docker-compose up`→浏览器访问`localhost:3000`→看到交付加载登录页 |
| **聚合根约束** | 非聚合根实体尝试定义事件→系统警告"仅聚合根可发布领域事件" |
| **事务边界** | 状态流转事件默认AFTER_COMMIT→数据库事务提交后才触发订阅者 |
| **事件精简** | 开启"领域事件模式"→字段选择器限制5个→强制包含ID字段 |
| **自然语言查询** | 在交付加载中输入"列出张三的合同"→AI生成SQL→返回表格→右栏自动显示"张三"上下文 |
| **自然语言分析** | 在交付加载中输入"按部门统计合同金额"→AI生成饼图→中栏显示ECharts（静态） |
| **自然语言操作** | 在交付加载中输入"将合同2025-001状态改为生效"→AI调用`contract_service.transition`→状态变更成功 |
| **自愈机制** | 在交付加载中输入"查寻合同"（错别字）→AI首次SQL失败→自动修正"查询"→成功执行→对话显示完整修正过程 |
| **版本切换** | 交付加载界面切换至v1.0.0→数据模型回退→操作旧版本数据 |
| **事件订阅幂等** | 同一事件被订阅者处理两次→第二次检测到已处理ID→跳过不重复执行 |
| **EPC全域关联** | 聚合根实体创建EPC链路→添加Event/Function/OrgUnit节点→关联已有模型元素(含Lifecycle+Semantic)→流程图正确渲染 |
| **EPC双向校验** | EPC引用不存在的模型元素→VE报error；模型Action未被EPC覆盖→VM报warning；EPC声明与模型定义矛盾→VX报error；71条规则全覆盖 |
| **组织体系建模** | 创建部门树+岗位→结构化职责(PositionResponsibility)→HR系统定时同步→EPC OrgUnit引用Department/Position |
| **Excel导入** | 下载模板→填写数据→上传→校验通过→生成pending_review版本→审核通过→数据应用到工作区 |
| **版本审核** | 上传Excel→生成待审核版本→审核通过→工作区数据更新；驳回→版本状态rejected+原因记录 |

---

## 8. 附录

### 8.1 核心类型定义汇总

```typescript
// ==================== 建模工具类型 ====================

interface Domain {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  domainId: string;
  createdAt: string;
  updatedAt: string;
}

interface Entity {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  projectId?: string;
  isAggregateRoot: boolean;        // E1: 聚合根标记
  attributes: Attribute[];
  relations: Relation[];
}

interface Attribute {
  id: string;
  name: string;
  nameEn: string;
  type: 'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 
         'date' | 'datetime' | 'enum' | 'reference' | 'json';
  required: boolean;
  unique: boolean;
  description: string;
  // 扩展：值范围、参考标准等
}

interface Relation {
  id: string;
  name: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  targetEntity: string;
  foreignKey?: string;
  viaEntity?: string;              // 多对多中间表
}

// 五大元模型
interface DataModel {
  entities: Entity[];
}

interface BehaviorModel {
  stateMachines: StateMachine[];
}

interface StateMachine {
  id: string;
  name: string;
  entityId: string;
  statusField: string;
  states: State[];
  transitions: Transition[];
}

interface State {
  id: string;
  name: string;
  isInitial: boolean;
  isFinal: boolean;
  description: string;
}

interface Transition {
  id: string;
  name: string;
  from: string | string[];         // 支持多起始状态
  to: string;
  trigger: 'manual' | 'automatic' | 'scheduled';
  description: string;
}

interface RuleModel {
  rules: Rule[];
}

interface Rule {
  id: string;
  name: string;
  type: 'field_validation' | 'cross_field_validation' | 
         'cross_entity_validation' | 'aggregate_validation' | 'temporal_rule';
  entityId: string;
  field?: string;
  condition: RuleCondition;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

interface ProcessModel {
  orchestrations: Orchestration[];
}

interface Orchestration {
  id: string;
  name: string;
  description: string;
  entryPoints: string[];
  strategy: {
    contextGathering?: string[];
    validationSteps?: string[];
    decisionPoints?: DecisionPoint[];
    completionActions?: CompletionAction[];
  };
}

// E1-E6: DDD增强的事件模型
interface EventModel {
  events: EventDefinition[];
  subscriptions: EventSubscription[];
}

interface EventDefinition {
  id: string;
  name: string;                    // 过去时命名
  nameEn: string;                  // ContractApprovedEvent
  entityId: string;
  entityIsAggregateRoot: boolean;  // E1: 聚合根校验
  
  // E2: 事务边界
  trigger: 'create' | 'update' | 'delete' | 'state_change' | 'custom';
  transactionPhase: 'AFTER_COMMIT' | 'BEFORE_COMMIT';
  
  // E3: 精简模式
  isDomainEvent: boolean;
  payloadFields: string[];         // 限制5个
  
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface EventSubscription {
  id: string;
  name: string;
  eventId: string;
  
  // E4: 幂等性
  handlerId: string;
  
  processingType: 'sync' | 'async';
  actionType: 'skill' | 'webhook' | 'notification' | 'script';
  actionRef: string;
  condition?: string;
  createdAt: string;
}

// ==================== 交付加载类型 ====================

interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;
  name: string;
  description: string;
  metamodels: {
    data: DataModel;
    behavior: BehaviorModel;
    rules: RuleModel;
    process: ProcessModel;
    events: EventModel;
  };
  createdAt: string;
  publishedAt?: string;
  status: 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';
  source?: 'manual' | 'excel_import';
  reviewComment?: string;
  parsedData?: ExcelParsedData;
}

// ==================== EPC全域关联类型 ====================

interface EpcChain {
  id: string;
  name: string;
  entityId: string;            // 关联的聚合根实体
  description?: string;
  nodes: EpcNode[];
  edges: EpcEdge[];
  createdAt: string;
  updatedAt: string;
}

interface EpcNode {
  id: string;
  type: 'event' | 'function' | 'connector' | 'infoObject' | 'orgUnit';
  label: string;
  refs: EpcModelRef[];         // 关联的模型元素引用
  position?: { x: number; y: number };
  style?: Record<string, unknown>;
}

interface EpcEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'normal' | 'conditional';
  condition?: string;
}

interface EpcModelRef {
  modelType: 'data' | 'behavior' | 'rule' | 'event' | 'process' | 'governance' | 'metric' | 'dataSource' | 'masterData' | 'metadata' | 'organization';
  elementId: string;
  elementName?: string;
  refRole: 'primary' | 'input' | 'output' | 'constraint' | 'metric' | 'source' | 'permission';
}

// ==================== 组织体系类型 ====================

interface Department {
  id: string;
  name: string;
  nameEn: string;
  code?: string;
  type: 'headquarters' | 'division' | 'department' | 'team' | 'group';
  parentId?: string;
  managerPositionId?: string;
  description?: string;
  status: 'active' | 'inactive';
}

interface Position {
  id: string;
  name: string;
  nameEn: string;
  code?: string;
  departmentId: string;
  parentPositionId?: string;
  level?: number;
  roleIds: string[];           // → GovernanceRole
  headcount?: number;
  responsibilities?: string;
  status: 'active' | 'inactive';
}

interface OrganizationModel {
  id: string;
  departments: Department[];
  positions: Position[];
}

// ==================== Excel导入类型 ====================

interface ExcelImportValidation {
  totalRows: number;
  validRows: number;
  errorCount: number;
  errors: ExcelImportError[];
}

interface ExcelImportError {
  sheet: string;
  row: number;
  column: string;
  value: string;
  errorType: 'missing_required' | 'invalid_enum' | 'invalid_type' | 'ref_not_found';
  message: string;
}

interface ExcelParsedData {
  entities: Record<string, unknown>[];
  attributes: Record<string, unknown>[];
  relations: Record<string, unknown>[];
  stateMachines: Record<string, unknown>[];
  rules: Record<string, unknown>[];
  eventDefinitions: Record<string, unknown>[];
}

// ==================== 双向校验类型 ====================

interface EpcValidationResult {
  ve: EpcValidationItem[];     // EPC→模型
  vm: EpcValidationItem[];     // 模型→EPC
  vx: EpcValidationItem[];     // 交叉一致性
  coverage: EpcCoverageReport;
}

interface EpcValidationItem {
  code: string;                // VE-01, VM-D01, VX-01 等
  level: 'error' | 'warning' | 'info';
  message: string;
  elementId?: string;
  elementName?: string;
  epcChainId?: string;
}

interface EpcCoverageReport {
  overall: number;             // 0-100%
  byModel: Record<string, { total: number; covered: number; rate: number }>;
}

interface AIAction {
  type: 'EXECUTE_QUERY' | 'CALL_SKILL' | 'OPEN_UI' | 
         'GENERATE_CHART' | 'RESPOND';
  // 根据type的具体参数
}

interface AIResponse {
  message: string;
  actions: AIAction[];
  contextUpdates?: {
    focusEntity?: EntityRef;
    currentView?: ViewType;
  };
  healingLog?: HealingLog[];       // 自愈过程记录
}

interface HealingLog {
  attempt: number;
  errorType: string;
  errorMessage: string;
  analysis: string;
  correction: object;
}

type ViewType = 
  | { type: 'list'; entityType: string }
  | { type: 'form'; entity: Entity; mode: 'create' | 'edit' | 'view' }
  | { type: 'flowchart'; stateMachine?: StateMachine }  // 默认
  | { type: 'erdiagram'; entities: Entity[]; relations: Relation[] }
  | { type: 'table'; data: any[]; columns: ColumnDef[] }
  | { type: 'chart'; chartConfig: EChartsConfig | MermaidConfig };
```

### 8.2 API接口清单

| 接口 | 方法 | 说明 |
|:---|:---|:---|
| **建模工具API** |||
| `/api/metadata/init` | GET | 获取标准元数据列表 |
| `/api/generate-model` | POST | AI生成模型建议 |
| `/api/versions` | GET/POST | 版本列表/创建版本 |
| `/api/publish` | POST | 发布版本生成代码包 |
| **交付加载API** |||
| `/api/delivery/versions` | GET | 获取可加载的版本列表 |
| `/api/delivery/load-version` | POST | 加载指定版本 |
| `/api/agent/execute` | POST | AI编排器执行 |
| `/api/entities/:type` | GET/POST/PUT/DELETE | 实体CRUD |
| `/api/state-machine/:entityId/transition` | POST | 状态流转 |
| `/api/rules/validate` | POST | 规则校验 |
| `/api/events/publish` | POST | 事件发布（内部） |
| `/api/events/subscriptions` | GET/POST | 订阅管理 |

### 8.3 文件命名建议

建议将此文档保存为：

```
ontology-ai-driven-system-specification-v2.0.md
```

或按模块拆分：

```
docs/
├── 00-overview.md                    # 本文档第1-2章
├── 01-modeling-tool-spec.md          # 本文档第3章
├── 02-delivery-framework-spec.md      # 本文档第4章
├── 03-ddd-event-design.md            # 本文档第5章
├── 04-ai-orchestrator-design.md      # 本文档第6章
├── 05-implementation-roadmap.md        # 本文档第7章
└── 06-appendix.md                    # 本文档第8章
```

---
补充：
字段设计
实体表/集合（Entity）

id: 实体唯一标识
name: 实体名称
businessScenarioId: 业务场景ID（必填，创建后不可更改）
...（其他原有字段）
业务场景表/集合（BusinessScenario）

id: 业务场景唯一标识
name: 业务场景名称
...（其他原有字段）
接口参数设计
新建实体接口

POST /api/entity/create
参数：
name: 实体名称
businessScenarioId: 业务场景ID（必填）
...（其他属性）
查询实体接口

GET /api/entity/list?businessScenarioId=xxx
参数：
businessScenarioId: 业务场景ID（必填）
...（分页、过滤等）
编辑实体接口

POST /api/entity/update
参数：
id: 实体ID
name: 实体名称
...（其他可编辑属性，不含businessScenarioId）
UI原型说明
业务场景选择区

左侧业务场景树/列表，点击后右侧展示该场景下的实体。
“新建实体”按钮仅在业务场景下可见。
实体列表区

仅显示当前业务场景下的实体。
支持实体的增删查改（不支持跨场景移动）。
实体详情页

显示实体基本信息及归属业务场景（只读）。
其他模型页签（数据模型、行为模型、规则模型、事件模型、EPC事件说明书）正常展示。


属性编辑功能支持主数据关联 —— 详细设计
1. 现状分析
当前属性编辑界面仅支持“关联元数据”，无法满足部分属性需引用主数据（如组织、物料、客户等）的业务需求。
缺少“是否关联主数据”开关及主数据类型选择，影响数据一致性和业务扩展性。
2. 设计目标
属性可灵活选择是否关联主数据，并指定主数据类型，实现与主数据管理模块的无缝集成。
确保属性与主数据的引用关系在前后端、数据结构、接口中均有明确表达。
3. UI与交互设计
属性编辑弹窗新增“是否关联主数据”开关（布尔型）。
当选择“是”时，显示主数据类型下拉框，选项来源于主数据管理模块（如：组织、物料、客户、供应商等）。
主数据类型选择后，可选“主数据字段”二级下拉（如需精细到主数据的某个字段）。
关闭“是否关联主数据”时，主数据类型与字段选择自动隐藏并清空。
示例UI结构
字段	类型	说明
属性名称	输入框	
数据类型	下拉框	
是否关联主数据	开关	是/否
主数据类型	下拉框	仅“是否关联主数据”为“是”时显示
主数据字段	下拉框	可选，选定主数据类型后加载
...	...	其他原有字段
4. 数据结构设计
属性定义结构（Attribute）
5. 接口设计
属性保存/更新接口
新增/编辑属性时，需支持传递 isMasterDataRef、masterDataType、masterDataField 字段。
查询属性详情时，返回上述字段，便于前端回显。
主数据类型与字段获取接口
前端通过接口获取主数据类型列表及对应字段列表，数据来源于主数据管理模块。
6. 前后端联动
前端：属性编辑弹窗联动主数据管理模块，动态加载主数据类型及字段。
后端：属性表/集合需存储主数据关联信息，接口需支持相关字段的读写。
7. 兼容性与校验
若“是否关联主数据”为“是”，则主数据类型为必填项。
若“是否关联主数据”为“否”，则主数据类型与字段应为空。
保存时需校验主数据类型的有效性，防止脏数据。
8. 示例
属性编辑弹窗交互流程
用户点击“编辑属性”。
选择“是否关联主数据”为“是”。
下拉选择主数据类型（如“物料”）。
可选：选择主数据字段（如“物料编号”）。
填写其他属性信息，保存。


**文档结束**

本规格说明书基于全部12个议题（6架构议题+6DDD议题）的确认决策编制，涵盖从建模工具到交付加载体系、从代码生成到AI编排、从基础CRUD到DDD事件驱动的完整技术规格。实施完成后，系统将具备"本体抽象→模型共识→AI生成底座+AI动态运行+DDD事件驱动"的完整企业级应用框架能力。
```

---

以上是完整的Markdown内容 

