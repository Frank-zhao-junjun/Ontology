# Ontology 本体模型建模工具

基于 Next.js 16、React 19、TypeScript 5 的本体模型可视化建模工具。当前主工作流围绕“项目 -> 业务场景 -> 实体 -> 数据/行为/规则/事件模型 -> EPC事件说明书”展开，支持 AI 辅助生成、主数据/元数据联动、配置导出与运行时验证。

## 当前能力

### 1. 业务场景驱动建模
- 实体必须绑定 `businessScenarioId` 才能创建。
- 工作台实体列表按当前选中的业务场景过滤。
- 实体创建后不允许跨业务场景移动。
- EPC 业务背景严格来源于 `BusinessScenario.description`。

### 2. 四大核心元模型
- 数据模型：实体、属性、关系、聚合根/子实体建模。
- 行为模型：状态机、状态流转、触发器与动作。
- 规则模型：字段校验、跨字段/跨实体校验、聚合校验、时序规则。
- 事件模型：事件定义、订阅、同步/异步处理策略。

说明：流程模型代码仍保留在仓库中用于兼容和后续扩展，但当前主界面焦点已切到四大核心元模型与 EPC 说明书链路。

### 3. EPC事件说明书
- 仅聚合根实体显示 “EPC事件说明书” 页签。
- 页签为只读生成视图，不支持手工补充对象、组织单元或系统。
- 支持重新生成、Markdown 导出、JSON 导出和整包导出。
- 页面预览与导出结果同源。

### 4. 属性编辑与主数据关联
- 属性主契约已切换为 `dataType`、`metadataTemplateId`、`referenceKind`、`referencedEntityId`、`isMasterDataRef`、`masterDataType`、`masterDataField`。
- 绑定元数据模板后，`dataType` 会按模板结果锁定。
- `reference` 类型下，实体引用和主数据引用互斥。
- 主数据引用支持“主数据类型 + 主数据字段”路径建模。

### 5. 元数据与主数据管理
- 元数据通过 `/api/metadata/init` 初始化并支持 CRUD。
- 主数据通过 `/api/masterdata/init` 初始化并支持定义、记录、动态表管理。
- 主数据初始化接口默认回落到内置示例数据，也支持用环境变量覆盖远端来源。

### 6. AI 与导出能力
- `/api/generate-model` 会结合实体、领域、元数据和主数据上下文生成模型建议。
- `/api/export` 支持配置导出和 EPC 产物导出。
- `/api/codegen` 支持按版本生成运行时代码包。

## 技术栈

- 框架：Next.js 16 (App Router)
- 核心：React 19
- 语言：TypeScript 5
- UI：shadcn/ui + Radix UI
- 样式：Tailwind CSS 4
- 状态管理：Zustand + persist
- AI 集成：coze-coding-dev-sdk
- 数据服务：Supabase
- 测试：Vitest + Testing Library + happy-dom

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
pnpm dev
```

### 构建与启动

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

`pnpm run ci:check` 当前执行顺序为：lint -> ts-check -> unit -> integration -> e2e smoke。

## 开发前必查

- 开发、评审、交接前请先过一遍检查清单：`docs/agentic-engineering-checklist.md`
- 发起 PR 时请按模板补齐证据（测试输出、手工验证、风险说明）

## 关键目录

```text
src/
├── app/
│   ├── api/
│   │   ├── export/              # 配置导出
│   │   ├── codegen/             # 代码生成
│   │   ├── generate-model/      # AI 模型建议
│   │   ├── metadata/init/       # 元数据初始化
│   │   ├── masterdata/init/     # 主数据初始化
│   │   └── projects/            # 项目持久化接口
├── components/ontology/         # 建模工作台与领域组件
├── lib/
│   ├── code-generator/          # 运行时代码生成
│   ├── configexporter/          # 配置导出器
│   ├── epc-generator/           # EPC 文档生成器
│   └── ontology-normalizer.ts   # 旧数据到新契约的归一化层
├── storage/database/            # Supabase / 数据库适配
├── store/ontology-store.ts      # 全局状态与状态迁移
└── types/ontology.ts            # 核心类型定义

tests/
├── unit/
├── integration/
└── e2e/
```

## 核心类型摘录

```ts
type AttributeDataType =
  | 'string'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'reference'
  | 'text';

type AttributeReferenceKind = 'entity' | 'masterData';

interface Entity {
  id: string;
  name: string;
  nameEn: string;
  projectId: string;
  businessScenarioId: string;
  attributes: Attribute[];
  relations: Relation[];
}

interface Attribute {
  id: string;
  name: string;
  dataType: AttributeDataType;
  metadataTemplateId?: string;
  metadataTemplateName?: string;
  referenceKind?: AttributeReferenceKind;
  referencedEntityId?: string;
  isMasterDataRef?: boolean;
  masterDataType?: string;
  masterDataField?: string;
}
```

## 主要接口

### 初始化接口

```text
GET /api/metadata/init
GET /api/masterdata/init
```

### AI 建模接口

```text
POST /api/generate-model
```

请求体包含 `entity`、`domain`、`project`、`existingModels`、`metadataList`、`masterDataList`。

### 导出与代码生成

```text
GET  /api/export
POST /api/export
GET  /api/codegen
POST /api/codegen
```

### 项目持久化

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
```

## 验证状态

本轮改动已补齐以下验证面：
- route handler 测试：`export`、`codegen`、`generate-model`、`masterdata/init`、`metadata/init`、`projects`
- store transition 测试：业务场景约束、版本快照、EPC 同步、主数据 CRUD、规则/事件 CRUD、删除类 action
- 前端交互测试：元数据模板锁定、自由数据类型、主数据引用、EPC 只读页签

当前仓库基线可通过：

```bash
pnpm run ci:check
```

## 相关文档

- `REQUIREMENT.md`
- `assets/ontology-ai-driven-system-specification-v2.0.md`
- `assets/系统架构设计文档.md`
- `TEST_CASES.md`

## 约束

- 必须使用 pnpm。
- 不要手工回退到旧字段 `scenarioId`、`type`、`metadataId`、`referenceTargetType`、`masterDataIds` 等旧契约。
- 新实现应以 `src/types/ontology.ts` 和 `src/lib/ontology-normalizer.ts` 为准。
