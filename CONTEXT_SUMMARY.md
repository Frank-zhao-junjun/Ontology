# 项目压缩摘要

## 项目概述
Ontology 本体模型可视化建模工具，支持五大元模型（数据、行为、规则、流程、事件）的可视化建模，AI智能生成，并输出完整建模手册。

## 技术栈
- Next.js 16 (App Router) + React 19 + TypeScript 5
- shadcn/ui + Tailwind CSS 4
- Zustand (状态持久化)
- coze-coding-dev-sdk (AI集成、文件获取)

## 核心功能

### 1. 领域与项目管理
- 8大行业领域模板
- 实体按项目/模块分组
- JSON导出/导入

### 2. 五大元模型编辑
- 数据模型：属性定义、关系定义
- 行为模型：状态机、状态转换
- 规则模型：字段验证、跨字段校验
- 流程模型：业务流程编排
- 事件模型：事件定义、事件订阅

### 3. 元数据管理 ✅
- Excel初始化57条标准元数据（含领域字段）
- CRUD操作、搜索过滤
- AI生成时优先匹配元数据

### 4. AI智能生成
- 基于实体和领域生成五大模型建议
- 一键应用到当前实体
- ✅ 事件和订阅应用逻辑已修复

### 5. 建模手册导出
- Markdown/JSON格式

## 核心文件

| 文件 | 说明 |
|------|------|
| `src/types/ontology.ts` | 类型定义（含Metadata.domain字段）|
| `src/store/ontology-store.ts` | Zustand状态管理 |
| `src/app/api/metadata/init/route.ts` | Excel解析API |
| `src/app/api/generate-model/route.ts` | AI生成API |
| `src/components/ontology/modeling-workspace.tsx` | 建模工作台 |
| `src/components/ontology/metadata-manager.tsx` | 元数据管理 |
| `src/components/ontology/manual-generator.tsx` | AI生成/手册导出 |

## 最近修复
1. 元数据添加"领域"字段，自动检测旧数据重载
2. AI生成的事件/订阅应用逻辑已实现
3. 左侧列表选中状态颜色加深 (bg-primary/20)

## 访问地址
`https://l6r69sif2vkv49dh.dev.coze.site`

## API接口
- `GET /api/metadata/init` - 获取元数据列表（57条）
- `POST /api/generate-model` - AI生成模型建议
