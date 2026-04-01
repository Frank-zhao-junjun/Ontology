# Ontology 本体模型建模工具

基于 Next.js 16 的本体模型可视化建模工具，支持任意领域及其五大元模型（数据、行为、规则、流程、事件）的可视化建模，并输出完整的建模手册。

## 功能特性

### 1. 领域建模
- **领域选择**：内置8大行业领域（离散制造、流程制造、零售电商、金融服务、医疗健康、教育培训、物流供应链、能源环保）
- **项目创建**：基于领域创建建模项目，支持项目描述和自定义配置
- **实体分组**：支持将实体按项目/模块分组管理

### 2. 五大元模型编辑
- **数据模型**：实体属性定义、关系定义（一对一、一对多、多对多）
- **行为模型**：状态机设计，支持状态定义、转换规则、触发器配置
- **规则模型**：字段验证、跨字段验证、业务约束规则
- **流程模型**：业务流程编排，支持多种步骤类型（意图澄清、数据检索、技能执行等）
- **事件模型**：事件定义、事件订阅、触发器配置

### 3. 元数据管理
- **Excel初始化**：从预置Excel导入57条标准元数据字段
- **CRUD操作**：支持元数据的增删改查
- **AI优先匹配**：AI生成属性时优先从元数据列表匹配，保持命名一致性
- **全局管理**：元数据不属于任何项目，可在所有实体间复用

### 4. AI智能生成
- **模型建议**：基于实体和领域信息，AI自动生成五大模型建议
- **一键应用**：可将AI建议一键应用到当前实体
- **元数据匹配**：生成属性时优先使用预定义元数据，确保数据标准一致

### 5. 建模手册导出
- **Markdown格式**：导出完整的建模手册
- **实体维度**：支持单实体详细手册
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
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页（领域选择）
│   └── api/                     # API 路由
│       ├── metadata/init/       # 元数据初始化接口
│       └── generate-model/      # AI模型生成接口
├── components/
│   ├── ontology/                # 业务组件
│   │   ├── domain-selector.tsx  # 领域选择器
│   │   ├── project-creator.tsx  # 项目创建器
│   │   ├── modeling-workspace.tsx # 建模工作台
│   │   ├── data-model-editor.tsx # 数据模型编辑器
│   │   ├── behavior-model-editor.tsx # 行为模型编辑器
│   │   ├── rule-model-editor.tsx # 规则模型编辑器
│   │   ├── process-model-editor.tsx # 流程模型编辑器
│   │   ├── event-model-editor.tsx # 事件模型编辑器
│   │   ├── metadata-manager.tsx # 元数据管理器
│   │   └── manual-generator.tsx # 手册生成器
│   └── ui/                      # shadcn/ui 基础组件
├── store/
│   └── ontology-store.ts        # Zustand 状态管理
├── types/
│   └── ontology.ts              # TypeScript 类型定义
└── lib/
    └── utils.ts                 # 工具函数
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

// 实体定义
interface Entity {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  projectId?: string;
  attributes: Attribute[];
  relations: Relation[];
}

// 元数据定义
interface Metadata {
  id: string;
  domain: string;         // 领域（如：财务、物料、生产等）
  name: string;
  nameEn: string;
  description: string;
  type: string;
  valueRange?: string;
  standard?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// 五大元模型：Attribute, StateMachine, Rule, Orchestration, EventDefinition
```

## 使用流程

1. **选择领域**：在首页选择建模所属的业务领域
2. **创建项目**：填写项目名称和描述，进入建模工作台
3. **管理元数据**：点击"元数据管理"查看/编辑标准字段
4. **创建实体**：在左侧面板添加实体，可按项目分组
5. **编辑模型**：在右侧页签编辑五大元模型
   - 数据模型：添加属性和关系
   - 行为模型：设计状态机和转换规则
   - 规则模型：定义业务验证规则
   - 流程模型：编排业务流程
   - 事件模型：定义事件和订阅
6. **AI生成**：选中实体后点击"AI生成实体模型"
7. **导出手册**：生成完整的建模手册文档

## API 接口

### 元数据初始化
```
GET /api/metadata/init
```
从预置Excel解析并返回标准元数据列表。

### AI模型生成
```
POST /api/generate-model
Body: { entity, domain, project, existingModels, metadataList }
```
基于实体信息调用大模型生成五大模型建议。

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
