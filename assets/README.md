# Ontology 本体模型建模工具

基于 Next.js 16 的本体模型可视化建模工具，面向任意业务领域提供数据、行为、规则、事件四大元模型的可视化建模能力，并支持版本管理、配置导出与建模手册导出，快速实现MVP版本。

## 功能特性

### 1. 领域建模
- **领域选择**：内置8大行业领域（离散制造、流程制造、零售电商、金融服务、医疗健康、教育培训、物流供应链、能源环保）
- **项目创建**：基于领域创建建模项目，支持项目描述和自定义配置
- **业务场景**：支持将建模项目按不同的业务场景进行分组
- **实体分组**：支持将实体按项目 + 业务场景分组管理
- **实体分类**：实体创建时必须标记聚合角色：`aggregate_root`（聚合根）或 `child_entity`（聚合内子实体）。当标记为子实体时必须指定 `parentAggregateId`；DDD 约束为仅聚合根可发布领域事件，聚合内子实体不直接生成事件模型。

### 2. 四大元模型编辑
- **数据模型**：实体属性定义、关系定义（一对一、一对多、多对多）
- **行为模型**：状态机设计，支持状态定义、转换规则、触发器配置
- **规则模型**：字段验证、跨字段验证、业务约束规则
- **事件模型**：事件定义、事件订阅、触发器配置，参考 EVENT.md

### 3. 主数据管理
- **定义**：主数据是业务领域中具有唯一性、稳定性和共享性的核心业务实体数据，如客户、产品、供应商等，是业务操作的基础数据
- **分类**：按领域可分为研发管理、采购管理、销售管理、财务管理、生产管理、设备管理、人力资源管理等
- **示例**：
  - 研发管理：物料主数据
  - 采购管理：供应商主数据、采购信息记录、货源清单、采购配额、客户物料信息
  - 销售管理：客户主数据、价格主数据、客户信用主数据
  - 财务管理：会计科目主数据、成本中心、利润中心、资产主数据
  - 生产管理：物料清单(BOM)、工作中心、工艺路线
  - 设备管理：设备台账主数据、功能位置主数据、维修班组主数据、设备BOM主数据
  - 人力资源管理：部门主数据、员工主数据
- **核心属性**：
  - 基本信息：领域、主数据中文名称、主数据英文名称(SAP/通用术语)
  - 业务信息：核心主数据、备注/说明
  - 技术信息：字段名、来源系统、API URL
- **表格管理**：每一类主数据对应一个独立表格，表格字段根据该主数据的字段名建立
- **Excel初始化**：从预置Excel导入标准主数据记录
- **CRUD操作**：支持每个主数据表格的增删改查，生效/失效状态管理
- **引用方式**：实体可通过引用主数据记录来关联核心业务数据，确保数据一致性
- **全局管理**：主数据不属于任何项目，可在所有实体间复用

### 4. 元数据管理
- **定义**：元数据是描述数据的数据，包括字段类型、长度、约束、标准等属性定义，是数据标准的核心组成部分
- **Excel初始化**：从预置Excel导入标准元数据字段模板
- **CRUD操作**：支持元数据的增删改查
- **标准字段**：元数据定义了标准字段的属性，确保数据结构的一致性和规范性
- **全局管理**：元数据不属于任何项目，可在所有实体间复用

### 5. AI智能生成
- **模型建议**：基于实体和领域信息，AI自动生成四大模型建议
- **一键应用**：可将AI建议一键应用到当前实体
- **智能匹配**：生成属性时，AI会优先匹配元数据模板来确保数据标准一致性，同时参考主数据记录来确保业务数据相关性
- **命名一致性**：通过匹配预定义的元数据和主数据，确保生成的属性命名符合企业标准

### 6. 版本管理与导出
- **版本管理**：支持创建草稿版本、导出版本、查看版本历史
- **配置导出**：导出时生成配置包，包含模型配置、实体定义、状态机配置、业务规则和事件定义
- **运行时加载**：运行时系统可加载配置包并启动

### 7. 建模手册导出
- **Markdown格式**：导出完整的建模手册
- **实体维度**：支持单实体详细手册
- **业务场景维度**：支持按照项目 + 业务场景导出详细手册
- **项目维度**：支持全项目概览手册

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand (持久化到 localStorage)
- **AI集成**: coze-coding-dev-sdk (豆包大模型)
- **文件解析**: xlsx (Excel解析)
- **类型安全**: TypeScript 5

## 快速开始

### 启动开发服务器

```bash
coze dev
```

启动后，在浏览器中打开 [http://localhost:5000](http://localhost:5000) 查看应用。

### 构建生产版本

```bash
coze build
```

### 启动生产服务器

```bash
coze start
```

## 项目结构

```
src/
├── app/                               # Next.js App Router
│   ├── layout.tsx                     # 根布局
│   ├── page.tsx                       # 首页（领域选择）
│   └── api/                           # API 路由
│       ├── masterdata/init/           # 主数据初始化接口
│       ├── metadata/init/             # 元数据初始化接口
│       ├── generate-model/            # AI模型生成接口
│       └── export/                    # 版本导出接口
├── components/
│   ├── ontology/                      # 业务组件
│   │   ├── domain-selector.tsx        # 领域选择器
│   │   ├── project-creator.tsx        # 项目创建器
│   │   ├── business-scenario-creator.tsx # 业务场景创建器
│   │   ├── modeling-workspace.tsx     # 建模工作台
│   │   ├── version-manager.tsx        # 版本管理器
│   │   ├── data-model-editor.tsx      # 数据模型编辑器
│   │   ├── behavior-model-editor.tsx  # 行为模型编辑器
│   │   ├── rule-model-editor.tsx      # 规则模型编辑器
│   │   ├── event-model-editor.tsx     # 事件模型编辑器
│   │   ├── metadata-manager.tsx       # 元数据管理器
│   │   ├── masterdata-manager.tsx     # 主数据管理器
│   │   └── manual-generator.tsx       # 手册生成器
│   └── ui/                            # shadcn/ui 基础组件
├── store/
│   ├── ontology-store.ts              # 建模状态管理
│   └── version-store.ts               # 版本状态管理
├── types/
│   └── ontology.ts                    # TypeScript 类型定义
└── lib/
    └── utils.ts                       # 工具函数
```

## 核心类型定义

```typescript
// 领域定义
interface Domain {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
}

// 业务场景定义
interface Scenario {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  projectId: string;
}

// 实体定义
interface Entity {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  projectId?: string;
  scenarioId?: string;
  entityRole: 'aggregate_root' | 'child_entity';
  parentAggregateId?: string;
  isAggregateRoot?: boolean; // 兼容字段，建议由 entityRole 派生
  attributes: Attribute[];
  relations: Relation[];
}

// 主数据定义
interface MasterData {
  id: string;
  domain: string;       // 所属业务领域
  name: string;         // 主数据中文名称
  nameEn: string;       // 主数据英文名称(SAP/通用术语)
  code: string;         // 主数据编码
  description: string;  // 备注/说明
  coreData: string;     // 核心主数据
  fieldNames: string;   // 字段名
  sourceSystem: string; // 来源系统
  apiUrl?: string;      // API URL
  status: '00' | '99';  // 状态：00-生效，99-失效
  source?: string;      // 数据来源
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}

// 元数据定义
interface Metadata {
  id: string;
  domain: string;       // 所属业务领域
  name: string;         // 字段名称
  nameEn: string;       // 字段英文名称
  description: string;  // 字段描述
  type: string;         // 字段类型
  valueRange?: string;  // 值范围
  standard?: string;    // 标准规范
  source?: string;      // 数据来源
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}

// 版本定义
interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  publishedAt?: string;
}

// 其余核心类型：Attribute, Relation, StateMachine, Rule, EventDefinition
```

## 术语与命名规范（执行版）

为避免不同团队在建模和发布阶段出现语义偏差，本文档采用以下统一术语。开发、测试、手册导出与接口字段命名均应遵循本节。

| 中文术语 | 统一英文标识 | 备注 |
|---|---|---|
| 合同头 | `Contract` | 聚合根默认对象 |
| 合同条款 | `ContractClause` | 兼容历史命名：`Clause` / `ContractItem` |
| 审批实例 | `ApprovalInstance` | 审批流程实例头 |
| 审批任务 | `ApprovalTask` | 审批节点任务明细 |
| 收付款计划 | `PaymentSchedule` | 兼容历史命名：`PaymentPlan` / `ReceivablePlan` |
| 合同附件 | `ContractAttachment` | 兼容历史命名：`Attachment` |
| 变更单/补充协议 | `ContractAmendment` | 兼容历史命名：`ChangeOrder` / `Amendment` |
| 主数据 | `MasterData` | 业务主记录，不等同字段模板 |
| 元数据模板 | `MetadataTemplate` | 字段标准模板，不等同业务记录 |
| 业务技能 | `BusinessSkill` | 运行时写操作能力，兼容历史命名：`Skill` |

统一规则：
- 对外 API、生成代码、手册章节默认使用“统一英文标识”。
- 文档首次出现采用“中文（英文）”格式，后续保持一致，不混用同义词。
- 涉及历史兼容时，仅在“备注”中保留旧称，不作为新开发命名。

## 业务可执行性结论（主审摘要）

以下结论用于判断方案是“组织内可执行”而非“概念完整”：

| 结论 | 级别 | 主题 | 最关键的一句话 |
|---|---|---|---|
| 通过 | 中 | 四大元模型边界 | 四大元模型可作为统一建模语言，但需叠加跨实体流程约束。 |
| 需修改 | 高 | 版本演进与迁移 | 没有迁移策略，版本管理只能演示，不能生产。 |
| 需修改 | 高 | 合规审计 | 合同系统必须可追溯“谁在何时改了什么”。 |
| 待澄清 | 中 | 一期运行时范围 | 一期是配置加载型运行时还是代码生成型运行时，必须统一口径。 |
| 待澄清 | 中 | AI写操作默认策略 | 建议默认只读，写操作按场景开关启用。 |

## 使用流程

1. **选择领域**：在首页选择建模所属的业务领域
2. **创建项目**：填写项目名称和描述，进入建模工作台
3. **创建业务场景**：基于某一项目定义具体业务场景，用于对实体进行分类管理，明确业务边界
4. **管理元数据**：点击"元数据管理"查看/编辑标准字段模板，定义字段类型、长度、约束等属性标准，确保数据结构一致性
5. **管理主数据**：点击"主数据管理"查看/编辑核心业务实体记录，如客户、产品等，并可切换生效/失效状态，确保业务数据的唯一性和稳定性
6. **创建实体**：在左侧面板添加实体，可按项目 + 业务场景分组，实体是业务模型的基本构建单元
7. **编辑模型**：在右侧页签编辑四大元模型
  - 数据模型：添加属性和关系，选择适用业务场景（可多选）。属性可基于元数据模板创建标准字段，也可引用主数据记录作为引用字段，确保数据标准和业务一致性。
  - 行为模型：设计状态机和转换规则，选择适用业务场景（可多选）。
  - 规则模型：定义业务验证规则，选择适用业务场景（可多选）。
  - 事件模型：定义事件和订阅，选择适用业务场景（可多选）。
8. **AI生成**：选中实体后点击"AI生成实体模型"，AI会优先匹配元数据模板来确保数据标准一致性，同时参考主数据记录来确保业务数据相关性
9. **版本导出**：创建版本并生成配置包
10. **导出手册**：生成完整的建模手册文档

## 合同领域建模示例（推荐实践）

在“合同管理”领域，建议采用以下实体划分与聚合边界，作为本体建模的默认实践：

- **合同头（Contract）**
  - **角色**：聚合根（`isAggregateRoot = true`）
  - **典型字段**：合同编号、名称、对方主体、签订日期、生效日期、到期日期、币种、金额、合同类型、状态等
  - **说明**：所有与该合同相关的条款、收付款计划、附件、审批实例、变更记录等，均应通过关系关联到该合同头实体

- **合同条款（ContractClause）**
  - **角色**：合同聚合内子实体（从属 `Contract`，非聚合根）
  - **典型字段**：条款序号、条款类别（价格、交付、违约责任等）、条款正文、是否关键条款、是否标准条款等
  - **说明**：条款的生命周期由合同头驱动，一般不单独暴露为独立业务对象

- **审批实例与任务（ApprovalInstance / ApprovalTask）**
  - **角色**：独立实体，但逻辑上从属于合同头
  - **典型字段**：审批实例号、流程模板、当前节点、发起人、处理人、审批结果、意见、时间戳等
  - **说明**：
    - 合同的“状态机”在行为模型中建模（例如：拟定 -> 审批中 -> 已生效 -> 已终止）
    - 具体每一次审批流转明细，应建模为数据实体（实例与任务），以满足审计要求
    - 推荐通过事件模型在“合同状态变更”与“审批实例/任务”之间建立联动关系

- **收/付款计划（PaymentSchedule）**
  - **角色**：合同聚合内子实体（从属 `Contract`，非聚合根）
  - **典型字段**：期次、里程碑名称、计划金额、币种、计划日期、实际日期、状态、关联发票/单据号等
  - **说明**：
    - 收/付款计划是合同履约管理的核心数据对象
    - 建模时应通过规则模型表达“计划金额合计约束”等规则
    - 在行为模型中，可通过合同事件（如“合同生效”）驱动计划自动生成

- **附件（ContractAttachment）**
  - **角色**：合同聚合内子实体（从属 `Contract`，非聚合根）
  - **典型字段**：附件类型（合同文本、证照、报价单等）、文件名、存储位置、版本号、可见范围等
  - **说明**：附件与合同版本强相关，建议在模型中明确 `versionId` 或等价字段，以支持按版本追溯

- **变更单 / 补充协议（ContractAmendment）**
  - **角色**：可作为独立聚合根，或作为合同聚合内的强关联实体
  - **典型字段**：变更编号、变更原因、变更内容摘要、生效日期、状态、关联条款/收付款计划等
  - **说明**：
    - 大多数场景下，建议将变更记录建模为独立实体，并与原合同建立明确的“变更自 / 被变更对象”关系
    - 在规则模型中，应约束变更对原合同金额、期限、收付款计划的影响，并通过事件模型驱动相关实体同步更新

以上实体划分并非硬性限制，而是针对“合同管理”领域的一组推荐建模边界。用户在具体项目中可以基于四大元模型扩展或收缩实体粒度，但建议尽量保持“合同头为聚合根 + 周边关键对象为子实体或强关联实体”的整体结构，以便后续版本演进和运行时集成。

## API 接口

### 元数据初始化
```
GET /api/metadata/init
```
从预置Excel解析并返回标准元数据列表。

### 主数据初始化
```
GET /api/masterdata/init
```
从预置Excel解析并返回标准主数据列表。

### AI模型生成
```
POST /api/generate-model
Body: { entity, domain, project, existingModels, metadataList, masterdataList }
```
基于实体信息调用大模型生成四大模型建议。

### 版本导出
```
POST /api/export
Body: { projectId, version, name, description, metamodels, config }
```
根据当前项目元模型生成配置包并返回导出结果。

## 测试基线（MVP）

- 导出链路统一以 `POST /api/export` 为准，不再使用 `publish` 口径。
- 每次导出必须产出 `manifest.json`，并包含 `projectId`、`version`、`generatedAt`、`entityCount`。
- 运行时验收默认使用固定测试输入：`查询合同列表`，输出需包含可判定字段（如记录总数、实体类型、版本号）。

## 开发规范

### 包管理
**必须使用 pnpm** 作为包管理器：
```bash
pnpm install      # 安装依赖
pnpm add <pkg>    # 添加依赖
pnpm add -D <pkg> # 添加开发依赖
```

### 组件开发
优先使用 `src/components/ui/` 中的 shadcn/ui 组件。

### 状态管理
使用 Zustand 进行全局状态管理，支持 localStorage 持久化。

### 样式开发
使用 Tailwind CSS 4，支持亮色/暗色主题。

## 参考文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 组件文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Zustand 状态管理](https://github.com/pmndrs/zustand)

## 许可证

MIT License
