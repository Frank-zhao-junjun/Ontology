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
- **AI集成**: coze-coding-dev-sdk (豆包 Seed 2.0 Pro)
- **文件解析**: xlsx
- **MCP协议**: @modelcontextprotocol/sdk
- **落地页动画**: GSAP

## 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 落地页（含4类服务入口卡片）
│   ├── tool/page.tsx            # 建模工作台页面
│   ├── layout.tsx               # 根布局
│   ├── globals.css              # 全局样式
│   ├── cli/index.ts             # CLI 入口（pnpm ontology）
│   └── api/                     # API 路由
│       ├── chat/                # AI对话（SSE流式，豆包Seed 2.0 Pro）
│       ├── generate-model/      # AI模型生成接口
│       ├── generate-element-draft/ # AI要素草稿生成
│       ├── metadata/init/       # 元数据初始化接口
│       ├── excel-template/      # Excel模板下载接口
│       ├── excel-import/        # Excel文件导入接口
│       ├── export/              # Excel导出（xlsx-from-manifest）
│       ├── entity-lifecycle/    # 实体生命周期导出
│       ├── agent-semantic-layer/ # Agent语义层导出
│       ├── agent/skills/        # Agent技能元数据 + 执行入口
│       │   └── execute/         # Skill统一执行API（12种操作）
│       └── reference-documents/ # 参考文档上传/解析
├── components/
│   ├── landing/                 # 落地页组件
│   │   ├── Hero.tsx             # Hero区（GSAP动画 + CTA）
│   │   └── ServiceEntry.tsx     # 4类服务入口卡片
│   └── ontology/                # 本体建模组件
│       ├── domain-selector.tsx  # 领域选择器
│       ├── project-creator.tsx  # 项目创建器
│       ├── modeling-workspace.tsx # 建模工作台
│       ├── copilot/             # AI Copilot 子系统
│       │   ├── modeling-copilot-panel.tsx # AI对话面板（SSE流式 + ACTION执行）
│       │   └── copilot-system-prompt.ts   # 系统提示词（含ACTION块定义）
│       ├── epc-steps-editor.tsx # EPC步骤编辑器（表格布局）
│       ├── business-chain-detail.tsx # 业务链详情
│       └── ...                  # 其他建模编辑器
├── store/
│   └── ontology-store.ts        # Zustand 状态管理（4214行，内联实现）
├── types/
│   └── ontology.ts              # TypeScript 类型定义
└── lib/
    ├── utils.ts                 # 工具函数
    ├── copilot/
    │   └── chat-actions.ts      # ACTION块解析 + Store执行（5种动作）
    ├── action-executor.ts       # 纯函数版ACTION执行器
    ├── excel/
    │   ├── export-excel.ts      # Excel导出（中文表头）
    │   ├── import-excel.ts      # Excel导入（中文表头归一化）
    │   └── excel-schema.ts      # Sheet定义（字母前缀+中文）
    └── business-chain/
        └── business-chain.ts    # 业务链纯函数（addValueDomain等）

packages/
└── ontology-mcp/                # MCP Server 包
    └── src/
        ├── index.ts             # MCP Server入口（Stdio transport）
        ├── tools/               # MCP工具定义
        │   ├── project-tools.ts
        │   ├── business-chain-tools.ts
        │   └── analysis-tools.ts
        ├── resources/           # MCP资源
        │   └── project-resources.ts
        ├── prompts/             # MCP提示词
        │   └── copilot-prompts.ts
        ├── store/               # MCP项目存储
        │   └── project-store.ts
        └── utils/
            └── helpers.ts
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

### 8.5. AI Copilot 对话建模
- **模型**：豆包 Seed 2.0 Pro（`doubao-seed-2-0-pro-260215`），可通过 `CHAT_MODEL` 环境变量覆盖
- **流式输出**：SSE 协议，前端 `fetch` + `getReader()` 打字机式渲染
- **ACTION 机制**：AI 在回复中嵌入 `<<<ACTION>>>{json}<<<END_ACTION>>>` 块，流结束后批量解析并执行
- **5 种动作**：`create_value_domain` / `create_capability` / `create_scenario` / `create_epc_process` / `create_chain`
- **执行层**：`src/lib/copilot/chat-actions.ts` — 解析 ACTION 块，调用 Zustand store 方法执行建模
- **参考文档**：支持上传 Word/PDF/Excel/TXT/Markdown/CSV，解析后注入 AI Prompt
- **面板边界**：`h-screen overflow-hidden`，超出部分滚动查看

### 9. 建模手册生成
- Markdown 格式输出
- JSON 格式导出
- 实体维度/项目维度手册

### 9.5. 组织体系与岗位模型 (Organization & Position)
- **部门树**：Department 5种类型(集团/事业部/部门/团队/班组)，parentId 构建组织树
- **岗位定义**：Position 归属部门、关联治理角色、汇报线、编制、任职要求
- **结构化职责**：PositionResponsibility 定义职责项(scope+actions+decisionAuthority+delegateToPositionIds)
- **职责重叠检测**：自动检测两个岗位的职责冲突
- **HR系统同步**：支持飞书/钉钉/企微/SAP/Workday/自定义API定时同步
- **同步配置**：HRSyncConfig(source/interval/fieldMapping/conflictStrategy/syncScope)
- **冲突策略**：HR优先/本地优先/合并/人工审核
- **EPC集成**：EpcOrganizationalUnit 通过 refType/refId 引用 Department/Position
- **校验规则**：VM-O(8条)+VM-HR(4条)+VE-O(2条)+VX-O(4条)

### 10. Entity Lifecycle（实体生命周期）
- **State 增强**：entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility
- **Transition 增强**：guardCondition/compensationAction/sideEffects/publishEventId/notifyRoleIds/requiresApproval/auditLog
- **Action 增强**：aliases/triggerPhrases/successMessage/failureMessage/fallbackActionId/requiresConfirmation/idempotencyKeyTemplate
- **聚合视图**：EntityLifecycle 一站式聚合 StateMachine + Action + Rule + Event 中的生命周期信息
- **审计追溯**：LifecycleAuditEntry 记录每次状态变更的完整上下文
- **校验规则**：V-LC-01~15 生命周期完整性与一致性校验

### 11. Agent Semantic Layer（Agent 语义层）
- **意图映射**：Intent 将自然语言短语映射到 Action，含 triggerPhrases/slotFilling/contextConstraints
- **槽位填充**：SlotFillingStrategy 定义参数追问顺序、校验规则、默认值、上下文推断
- **对话上下文**：DialogContext 维护聚焦实体、最近操作、指代消解
- **语义关系**：SemanticRelation 定义 is-a/part-of/synonym-of/causes/depends-on 等 10 种语义关系
- **业务术语词典**：BusinessTerm 统一术语定义、同义词、歧义说明、模型引用
- **错误恢复**：ErrorRecovery 定义操作失败后的重试/回退/升级/补偿策略
- **时效性标记**：TemporalValidity 为模型元素添加生效/失效时间
- **字段映射**：SemanticFieldMapping 自动推断跨实体字段等价关系
- **Agent 策略**：AgentPolicy 定义 Agent 行为边界（允许/拒绝/确认/升级）
- **完备性仪表盘**：可视化语义层覆盖度（意图覆盖率/术语数/关系数/缺失提醒）

### 12. Excel 导入 (Excel Import)
- **模板下载**：GET /api/excel-template 生成含8个Sheet（填写说明+7数据Sheet，含部门+岗位）的 .xlsx 模板
- **文件上传**：POST /api/excel-import 仅接受 .xlsx，5MB上限，Sheet结构校验
- **数据校验**：必填字段、枚举值、布尔类型、跨Sheet引用完整性校验
- **数据解析**：校验通过后解析为 Entity/Attribute/Relation/StateMachine/Rule/Event 对象（parsedData）
- **版本生成**：基于 parsedData 生成 pending_review 状态版本（非工作区快照）
- **版本审核**：审核通过将 parsedData 应用到工作区（替换当前数据），驳回需填写原因
- **Store 方法**：`createVersionFromParsedData({ parsedData })` 创建版本，`approveVersion` 应用解析数据

### 13. 参考文档上传辅助 AI 建模 (Reference Document Upload)
- **文档上传**：支持 Word(.docx)/PDF(.xlsx)/Excel(.xlsx)/TXT/Markdown/CSV 格式，10MB/文件
- **文档解析**：mammoth(docx)/pdf-parse(pdf)/xlsx(excel) 自动提取纯文本+表格
- **AI 注入**：generate-model API 自动将参考文档内容注入 Prompt，AI 基于文档生成更精准建议
- **实体提取**：AI 从文档中自动提取实体候选（含属性、置信度、来源定位）
- **项目级管理**：ReferenceDocument 存储于项目数据，最多 10 份/项目
- **文本截断**：智能截断策略，AI 注入文本 ≤ 10000 字符/次
- **API**：POST /api/reference-documents/upload + DELETE + POST extract-entities
- **安全**：文档仅存浏览器 localStorage，不上传云端

### 14. 四类服务接入方式 (Service Access Modes)

本体建模工具提供 4 种接入方式，入口卡片位于首页落地页：

#### 14.1 Web UI
- **入口**：`/tool`（建模工作台）
- **组件**：`src/components/ontology/modeling-workspace.tsx`
- **能力**：完整的图形化建模界面，含 AI Copilot 对话面板、EPC 步骤表格、业务链树

#### 14.2 MCP Server
- **HTTP 端点**：`POST /api/mcp`（Streamable HTTP transport，互联网可达）
- **本地入口**：`packages/ontology-mcp/src/index.ts`（Stdio transport，本地开发）
- **服务工厂**：`src/lib/mcp/server.ts`（createMcpServer，tools + resources + prompts）
- **配置**：`.mcp.json` — HTTP URL 模式（`https://Ontology1.coze.site/api/mcp`）
- **启动（本地）**：`pnpm tsx packages/ontology-mcp/src/index.ts`
- **工具**：8 个（list_projects, get_project, create_project, export_project, add_value_domain, add_capability, add_scenario, add_epc_process）
- **资源**：4 个只读项目资源
- **提示词**：2 个建模 Copilot 提示词模板
- **依赖**：`@modelcontextprotocol/sdk`
- **数据层**：通过 `ONTOLOGY_API_BASE` 环境变量调用 `/api/mcp/projects` 端点持久化
- **会话管理**：每个会话独立 Server 实例，通过 `Mcp-Session-Id` 头维护
- **CORS**：`access-control-allow-origin: *`，支持互联网跨域接入

#### 14.3 CLI
- **入口**：`src/cli/index.ts`（`pnpm ontology <command>`）
- **依赖**：零外部依赖，纯 Node.js `fetch`
- **命令**：
  - `ontology projects` — 列出所有项目
  - `ontology project <id>` — 查看项目详情
  - `ontology metadata` — 获取元数据列表
  - `ontology generate` — AI 生成模型建议
  - `ontology template` — 下载 Excel 模板
  - `ontology skills` — 列出 Agent 技能
  - `ontology sync` — HR 同步状态
  - `ontology help` — 帮助信息

#### 14.4 Agent Skill API
- **入口**：`POST /api/agent/skills/execute`
- **GET**：返回所有可用操作列表（12 种）
- **操作**：`list_projects` / `get_project` / `list_metadata` / `ai_generate` / `ai_chat` / `create_model` / `excel_template` / `export_manifest` / `list_skills` / `execute_skill` / `hr_sync_status` / `hr_sync_trigger`
- **统一后端**：Skill / MCP / CLI 三种方式最终都通过此 API 或直接调用 Web API 路由

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

# CLI 工具
pnpm ontology help          # 帮助
pnpm ontology projects      # 列出项目
pnpm ontology metadata      # 元数据列表

# MCP Server
pnpm tsx packages/ontology-mcp/src/index.ts
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

// 业务链操作（AI Copilot ACTION 执行的目标方法）
addValueDomain({ name, nameEn, description });
addCapability(parentId, { name, nameEn, description });
addScenario(parentId, { name, nameEn, description });
addEpcProcess(parentId, { name, nameEn, description });

// 项目导出
exportProject();

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

### Excel模板下载
```
GET /api/excel-template
```
生成含填写说明+8个数据Sheet的 .xlsx 导入模板。

**返回**: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet 二进制文件

### Excel文件导入
```
POST /api/excel-import
```
上传 .xlsx 文件，校验并解析为项目数据。

**请求**: multipart/form-data, field: `file`

**返回格式**:
```json
{
  "success": true,
  "validation": { "totalRows": 8, "validRows": 8, "errorCount": 0, "errors": [] },
  "versionId": "v-xxx",
  "versionName": "v2026-06-13",
  "parsedData": {
    "entities": [{ "name": "物料", "nameEn": "Material", "role": "aggregate_root", ... }],
    "attributes": [{ "entityNameEn": "Material", "name": "编码", "dataType": "string", ... }],
    "relations": [...],
    "stateMachines": [...],
    "rules": [...],
    "eventDefinitions": [...],
    "departments": [{ "name": "生产管理部", "nameEn": "ProductionMgmt", "type": "department", ... }],
    "positions": [{ "name": "生产主管", "nameEn": "ProductionSupervisor", "responsibilities": [...], ... }]
  }
}
```

**校验规则**:
- 文件格式: 仅 .xlsx，最大5MB
- Sheet结构: 至少包含实体/属性/关系/状态机/规则/事件/部门/岗位中1个Sheet
- 必填字段: 各Sheet的(必填)标记字段
- 枚举值: 实体角色、数据类型、关系类型、规则类型、触发时机等
- 跨Sheet引用: 属性/关系/状态机/规则/事件中的实体英文名必须在实体Sheet中存在；岗位.所属部门编码必须在部门Sheet中存在
- 组织校验: 部门树环检测、职责列对齐、角色引用完整性等 23 条规则 (V-XL-O01~O23)
- 描述行/示例行: 以 `#DESC#`/`#EXAMPLE#` 开头的行自动跳过

### Entity Lifecycle 导出
```
GET /api/entity-lifecycle?entityId=xxx
```
返回 EntityLifecycle 聚合视图（actionsByState/rulesByState/eventsByState/rolesByState/auditTrail/stats）。

### Agent 语义层导出
```
GET /api/agent-semantic-layer
```
返回完整 AgentSemanticLayer JSON（intents/terms/relations/recoveries/policies/mappings + metadata.coverage 统计）。

### AI 对话（SSE 流式）
```
POST /api/chat
```
SSE 流式对话，使用豆包 Seed 2.0 Pro 模型。AI 回复中嵌入 `<<<ACTION>>>` 块，前端解析后执行建模操作。

**请求体**:
```json
{
  "messages": [{ "role": "user", "content": "创建一个生产管理价值域" }],
  "projectContext": { ... },
  "referenceDocuments": [{ "name": "需求文档.docx", "content": "..." }]
}
```

**返回**: `text/event-stream`，每行 `data: {"content":"..."}`

### Agent Skill 执行
```
GET  /api/agent/skills/execute          # 返回12种可用操作列表
POST /api/agent/skills/execute          # 执行指定操作
```

**请求体**:
```json
{
  "operation": "list_projects",
  "params": {}
}
```

**支持的操作**: list_projects / get_project / list_metadata / ai_generate / ai_chat / create_model / excel_template / export_manifest / list_skills / execute_skill / hr_sync_status / hr_sync_trigger

### Excel 导出
```
POST /api/export/xlsx-from-manifest
```
基于 manifest 导出 Excel，所有 Sheet 表头为中文名称，Sheet 名含字母前缀+中文（如 `A-业务价值域`、`E1-实体`）。

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
- `Intent` - Agent 意图定义
- `IntentSlot` / `SlotFillingStrategy` - 槽位填充
- `DialogContext` - 对话上下文
- `SemanticRelation` - 语义关系
- `BusinessTerm` - 业务术语
- `ErrorRecovery` - 错误恢复策略
- `TemporalValidity` - 时效性标记
- `SemanticFieldMapping` - 跨实体字段映射
- `AgentPolicy` - Agent 行为策略
- `AgentSemanticLayer` - Agent 语义层聚合
- `EntityLifecycle` - 实体生命周期聚合
- `LifecycleAuditEntry` - 生命周期审计记录
- `StateTimeout` / `StateDataVisibility` - 状态增强

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

1. 端口固定为 5000（通过 `DEPLOY_RUN_PORT` 环境变量读取），不可修改
2. 使用 pnpm 作为包管理器，禁止使用 npm 或 yarn
3. 所有状态数据自动保存在浏览器 localStorage
4. 导出的 JSON 可用于导入恢复项目
5. AI 模型默认为豆包 Seed 2.0 Pro，可通过 `CHAT_MODEL` 环境变量覆盖
6. Excel 导入/导出 Sheet 名格式：字母前缀+中文（如 `E1-实体`），导入时自动去除前缀
7. Excel 导出表头为中文，导入时自动归一化中文表头到英文 key
8. MCP Server 配置在 `.mcp.json`，CLI 入口在 `package.json` 的 `bin` 字段
9. ontology-store.ts 为内联实现（4214行），不依赖外部 store-adapter

## 相关文档

参考项目 assets 目录下的需求文档：
- `assets/Ontology.txt` - 完整需求规格说明书
- `assets/系统架构设计文档.md` - 系统架构设计
- `assets/2100测试通过.md` - 功能验收清单

### Subagent 测试团队

多 Unit 测试阶段可启用 **6 角色 Subagent 测试团队**（Spec 六步 ③→⑥）：

- 编排索引：`.claude/skills/testing-team/README.md`
- 角色：Test Lead · Test Designer · Unit/Store · Integration/UI · E2E Smoke · Domain Rule
- 门禁：`docs/ontology-simplification/UNIT_VALIDATION_CHECKLIST.md`
- **进展看板**：`docs/ontology-simplification/testing/Progress.md`
- **测试 TODO**：`docs/ontology-simplification/testing/TODO.md`

#### Phase 回归命令

按精简架构 Phase 1–4 跑 scoped 回归（见 `scripts/test-phase.sh`）：

```bash
pnpm run test:phase1      # S03–S05 模块版本 + 业务链 + saveEpc
pnpm run test:phase1.5    # S14 模块确认/归档 UI
pnpm run test:phase2      # S06–S08 要素选择器 + 库 + C 工作区
pnpm run test:phase3      # S09–S11 linter + Excel + AI draft
pnpm run test:phase4      # S12–S13 遗留清理 + compiler golden
pnpm run test:phase:all   # 以上全部
```

---

## 开发规范 (Development Standards)

### 提交前必查

每次提交代码前，**必须**执行完整 CI 检查：

```bash
pnpm run ci:check
```

包含：lint、ts-check、unit tests、integration tests、e2e smoke tests。

### 分支策略

- **main**：受保护分支，禁止直接推送
- **feature/***：功能开发分支
- **fix/***：缺陷修复分支
- **docs/***：文档更新分支

### 提交规范

遵循 Conventional Commits：
- `feat:` 新功能
- `fix:` 缺陷修复
- `docs:` 文档更新
- `refactor:` 重构
- `test:` 测试相关

### 进度外置

- 每次迭代结束更新 `docs/progress.md`
- PR 必须填写 Checklist 并提供验证证据
- 详细规范见 [CONTRIBUTING.md](CONTRIBUTING.md)

### 质量门禁

| 检查项 | 命令 | 状态 |
|--------|------|------|
| 代码风格 | `pnpm lint` | 必须 0 error |
| 类型检查 | `pnpm ts-check` | 必须 0 error |
| 单元测试 | `pnpm test:unit` | 必须 100% pass |
| 集成测试 | `pnpm test:integration` | 必须 100% pass |
| E2E 冒烟 | `pnpm test:e2e:smoke` | 必须 100% pass |

## graphify


## 技能优先搜索路径

> 技能文件优先在以下路径查找：
> 
> **🔝 优先搜索：`D:\AI\00 - SKILL\`**
> - 索引文件：`D:\AI\00 - SKILL\skill-index.md`（**87 个技能** — 73 个独立 + 14 个 Superpowers 内置）
> - 分类涵盖：前端/UI、测试、开发方法论、项目管理、搜索检索、视频媒体、工具集成、文档生成、元技能等
>
> **📦 补充搜索：`C:\Users\admin\.codex\skills\`**
> - 系统内置技能（imagegen, openai-docs, plugin-creator, skill-creator, skill-installer, kimi-webbridge 等）
>
> 在任何项目中，当需要调用技能时，先到 `D:\AI\00 - SKILL\` 查找匹配。

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).