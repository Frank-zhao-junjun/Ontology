# Ontology 本体模型建模工具

## 项目概述

这是一个基于 Next.js 16 + React 19 + TypeScript 的本体模型可视化建模工具，支持五大元模型（数据、行为、规则、流程、事件）的可视化建模、AI智能生成，并能输出完整的建模手册。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **核心**: React 19
- **语言**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand (持久化存储)
- **AI集成**: coze-coding-dev-sdk (豆包大模型)
- **文件解析**: xlsx

## 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 主页面入口（领域选择）
│   ├── layout.tsx               # 根布局
│   ├── globals.css              # 全局样式
│   └── api/                     # API 路由
│       ├── metadata/init/       # 元数据初始化接口
│       └── generate-model/      # AI模型生成接口
├── components/
│   └── ontology/                # 本体建模组件
│       ├── domain-selector.tsx  # 领域选择器
│       ├── project-creator.tsx  # 项目创建器
│       ├── modeling-workspace.tsx # 建模工作台
│       ├── data-model-editor.tsx # 数据模型编辑器
│       ├── behavior-model-editor.tsx # 行为模型编辑器
│       ├── rule-model-editor.tsx # 规则模型编辑器
│       ├── process-model-editor.tsx # 流程模型编辑器
│       ├── event-model-editor.tsx # 事件模型编辑器
│       ├── metadata-manager.tsx # 元数据管理器
│       └── manual-generator.tsx # 建模手册生成器
├── store/
│   └── ontology-store.ts        # Zustand 状态管理
├── types/
│   └── ontology.ts              # TypeScript 类型定义
└── lib/
    └── utils.ts                 # 工具函数
```

## 核心功能

### 1. 领域与项目管理
- **领域选择**：内置8大行业领域模板
- **项目分组**：支持实体按项目/模块分组
- **项目导出**：JSON格式项目数据导出

### 2. 数据模型 (Data Model)
- 实体定义：支持中英文名称、描述
- 属性定义：支持 9 种数据类型（string, text, integer, decimal, boolean, date, datetime, enum, reference）
- 关系定义：支持一对一、一对多、多对多关系

### 3. 行为模型 (Behavior Model)
- 状态机定义：绑定实体、状态字段
- 状态定义：支持初始状态、终止状态标记
- 状态转换：支持手动、自动、定时触发

### 4. 规则模型 (Rule Model)
- 五类规则：字段级校验、跨字段校验、跨实体校验、聚合校验、时序规则
- 条件类型：正则、范围、表达式、引用检查等
- 严重程度：错误、警告、提示

### 5. 流程模型 (Process Model)
- 流程编排：定义业务流程入口点
- 步骤定义：支持 10 种步骤类型
- 流程预览：可视化流程步骤

### 6. 事件模型 (Event Model)
- 事件定义：支持创建、更新、删除、状态变更等触发时机
- 订阅管理：支持同步/异步处理、技能调用、Webhook、通知等

### 7. 元数据管理 (Metadata Management)
- **Excel初始化**：从预置Excel导入57条标准元数据字段
- **CRUD操作**：支持元数据的增删改查
- **AI优先匹配**：AI生成属性时优先从元数据列表匹配
- **全局复用**：元数据不属于任何项目，可在所有实体间复用

### 8. AI智能生成
- **模型建议**：基于实体和领域信息，AI自动生成五大模型建议
- **一键应用**：可将AI建议一键应用到当前实体
- **元数据匹配**：生成属性时优先使用预定义元数据

### 9. 建模手册生成
- Markdown 格式输出
- JSON 格式导出
- 实体维度/项目维度手册

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（端口 5000）
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务
pnpm start

# 类型检查
npx tsc --noEmit
```

## 状态管理

使用 Zustand 进行状态管理，数据自动持久化到 localStorage：

```typescript
// 访问项目状态
const { project, metadataList, activeModelType } = useOntologyStore();

// 创建项目
createProject(name, domain, description);

// 数据模型操作
addEntity(entity);
updateEntity(entityId, entity);
deleteEntity(entityId);

// 项目分组操作
addEntityProject(project);
updateEntityProject(projectId, project);
deleteEntityProject(projectId);

// 元数据操作
setMetadataList(metadataList);
addMetadata(metadata);
updateMetadata(metadataId, metadata);
deleteMetadata(metadataId);

// 行为模型操作
addStateMachine(stateMachine);
updateStateMachine(smId, stateMachine);
deleteStateMachine(smId);

// ... 其他模型操作类似
```

## API 接口

### 元数据初始化
```
GET /api/metadata/init
```
从预置Excel解析并返回标准元数据列表（57条字段）。

**返回格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "xxx",
      "name": "物料唯一编码",
      "nameEn": "MATERIAL_ID",
      "description": "全局唯一标识每一种物料",
      "type": "string",
      "valueRange": "自定义编码规则",
      "standard": "GB/T 44063",
      "source": "PLM/ERP"
    }
  ]
}
```

### AI模型生成
```
POST /api/generate-model
```
基于实体信息调用大模型生成五大模型建议。

**请求体**:
```json
{
  "entity": { "name": "物料", "nameEn": "Material", ... },
  "domain": { "name": "离散制造", ... },
  "project": { "name": "生产管理", ... },
  "existingModels": { ... },
  "metadataList": [ ... ]
}
```

**返回格式**:
```json
{
  "success": true,
  "data": {
    "dataModel": {
      "suggestedAttributes": [...],
      "suggestedRelations": [...]
    },
    "behaviorModel": { ... },
    "ruleModel": { ... },
    "processModel": { ... },
    "eventModel": { ... }
  }
}
```

## 类型定义

所有类型定义位于 `src/types/ontology.ts`，主要包括：

- `Domain` - 领域定义
- `EntityProject` - 实体项目分组
- `Entity` - 实体定义
- `Attribute` - 属性定义
- `Relation` - 关系定义
- `StateMachine` - 状态机
- `Rule` - 规则定义
- `Orchestration` - 流程编排
- `EventDefinition` - 事件定义
- `Subscription` - 事件订阅
- `Metadata` - 元数据定义
- `OntologyProject` - 完整项目结构

## 构建与部署

项目使用 Coze CLI 进行构建和部署：

```bash
# 开发环境
coze dev

# 构建生产版本
coze build

# 启动生产服务
coze start
```

## 注意事项

1. 端口固定为 5000，不可修改
2. 使用 pnpm 作为包管理器，禁止使用 npm 或 yarn
3. 所有状态数据自动保存在浏览器 localStorage
4. 导出的 JSON 可用于导入恢复项目

## 相关文档

参考项目 assets 目录下的需求文档：
- `assets/Ontology.txt` - 完整需求规格说明书
- `assets/系统架构设计文档.md` - 系统架构设计
- `assets/2100测试通过.md` - 功能验收清单
