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
4. [系统B：运行时框架规格](#4-系统b运行时框架规格)
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
- **运行期（Runtime）**：AI动态编排的自然语言操作界面

### 1.2 核心设计哲学

```
业务本体抽象 → 模型共识 → AI生成底座 + AI动态运行
```

### 1.3 关键决策汇总

| 类别 | 议题 | 确认决策 |
|:---|:---|:---|
| **架构** | 系统定位 | 双系统：建模工具（Coze Studio）+ 运行时框架（Docker） |
| **技术栈** | 建模工具 | Next.js 16 + Coze平台 |
| | 运行时前端 | React + Vite + Ant Design |
| | 运行时后端 | Flask + SQLite + SQLAlchemy |
| | AI集成 | 单一模型（DeepSeek/豆包）+ Function Calling |
| **元模型** | 数据模型 | 全动态，支持运行时定义新实体 |
| | 行为模型 | 简单状态机，用户手动触发 |
| | 规则模型 | 全部五类，配置期热加载 |
| | 流程模型 | AI原生编排，无预设BPMN |
| | 事件模型 | DDD领域事件，聚合根发布 |
| **AI能力** | 语义注入 | 按需注入，混合格式，仅直接关联 |
| | 运行时入口 | 独立对话界面（左栏） |
| | 自愈机制 | 最多2次重试，详细展示，返回原始错误 |
| **交互** | 布局 | 三栏式（对话/数据/上下文） |
| | 数据视图 | 6种模式，Flowchart默认 |
| | 可视化 | ECharts静态展示，Table为P0 |
| **部署** | 发布机制 | 版本发布：建模工具保存版本→运行时选择切换 |

---

## 2. 架构总览

### 2.1 双系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           双系统架构全景图                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────┐      ┌─────────────────────────────┐  │
│  │      系统A：建模工具         │      │      系统B：运行时框架        │  │
│  │   (Ontology Modeling Tool)  │ ────→│   (Ontology Runtime Engine)   │  │
│  │                             │ 发布   │                             │  │
│  │  • 部署：Coze Studio        │──────→│  • 部署：Docker Compose       │  │
│  │  • 技术：Next.js 16         │ 版本   │  • 技术：React+Vite+Flask    │  │
│  │  • 功能：五大元模型可视化编辑 │      │  • 功能：自然语言操作业务数据   │  │
│  │  • AI：设计时辅助生成        │      │  • AI：运行时动态编排执行       │  │
│  │                             │      │                             │  │
│  │  用户：业务架构师/系统设计师  │      │  用户：业务操作员/最终用户      │  │
│  └─────────────────────────────┘      └─────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         桥接机制：版本发布                           │ │
│  │  建模工具"发布"按钮 → 生成代码包（React+Flask+SQLite）→ Docker启动   │ │
│  │  版本管理：建模工具保存多版本 → 运行时选择版本切换                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流转架构

```
建模期（设计时）                    发布                    运行期（运行时）
┌─────────────────┐            ┌─────────────┐            ┌─────────────────┐
│   可视化编辑器    │───────────→│  版本化代码包  │───────────→│   运行时引擎      │
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
| 五大元模型编辑 | 数据/行为/规则/流程/事件 | ✅ 保持 |
| 元数据管理 | 57条标准字段+CRUD | ✅ 保持 |
| AI辅助生成 | 豆包大模型生成建议 | ✅ 保持 |
| 手册导出 | Markdown格式 | ✅ 保持 |

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
  status: 'draft' | 'published' | 'archived';
}

interface PublishConfig {
  target: 'local' | 'remote';
  includeData: boolean;        // 是否包含示例数据
  aiAgentEnabled: boolean;     // 是否启用AI运行时
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
│  │  ☑ 启用AI运行时助手                                  │  │
│  │  ☑ 生成Docker Compose配置                           │  │
│  │                                                    │  │
│  │  目标： ○ 本地Docker  ○ 下载代码包                   │  │
│  │                                                    │  │
│  │        [  取消  ]        [  生成并发布  ]           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

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
│   ├── ai/                     # AI运行时
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
│           └── runtimeStore.ts
└── database/
    ├── init.sql                # 初始化脚本
    └── seed.sql                # 示例数据
```

---

## 4. 系统B：运行时框架规格

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
| 部署 | Docker Compose | - |

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
    <Layout className="runtime-layout">
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

### 4.4 AI运行时API

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
| E4 幂等性 | **事件ID去重** | 运行时生成唯一事件ID，订阅者记录已处理ID |
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

### 5.4 运行时事件处理

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
| **M4** | Week 13-16 | 运行时框架 | 三栏式布局、6种数据视图、对话界面、版本切换 | 运行时系统可加载版本、自然语言操作 |
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

#### M4: 运行时框架（Week 13-16）

```
Week 13-14: 基础布局
├── ThreeColumnLayout实现
├── LeftSidebar：对话历史+输入
├── CenterPanel：视图切换框架
└── RightSidebar：实体上下文

Week 15-16: 数据视图+版本切换
├── 6种视图实现（list/form/flowchart/erdiagram/table/chart）
├── 版本API：/api/runtime/version
├── 版本切换UI
└── 端到端：建模→发布→运行时加载
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
| **版本发布** | 建模工具点击"发布"→生成代码包→`docker-compose up`→浏览器访问`localhost:3000`→看到运行时登录页 |
| **聚合根约束** | 非聚合根实体尝试定义事件→系统警告"仅聚合根可发布领域事件" |
| **事务边界** | 状态流转事件默认AFTER_COMMIT→数据库事务提交后才触发订阅者 |
| **事件精简** | 开启"领域事件模式"→字段选择器限制5个→强制包含ID字段 |
| **自然语言查询** | 运行时输入"列出张三的合同"→AI生成SQL→返回表格→右栏自动显示"张三"上下文 |
| **自然语言分析** | 运行时输入"按部门统计合同金额"→AI生成饼图→中栏显示ECharts（静态） |
| **自然语言操作** | 运行时输入"将合同2025-001状态改为生效"→AI调用`contract_service.transition`→状态变更成功 |
| **自愈机制** | 运行时输入"查寻合同"（错别字）→AI首次SQL失败→自动修正"查询"→成功执行→对话显示完整修正过程 |
| **版本切换** | 运行时界面切换至v1.0.0→数据模型回退→操作旧版本数据 |
| **事件订阅幂等** | 同一事件被订阅者处理两次→第二次检测到已处理ID→跳过不重复执行 |

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

// ==================== 运行时类型 ====================

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
  status: 'draft' | 'published' | 'archived';
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
| **运行时API** |||
| `/api/runtime/versions` | GET | 获取可加载的版本列表 |
| `/api/runtime/load-version` | POST | 加载指定版本 |
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
├── 02-runtime-framework-spec.md      # 本文档第4章
├── 03-ddd-event-design.md            # 本文档第5章
├── 04-ai-orchestrator-design.md      # 本文档第6章
├── 05-implementation-roadmap.md        # 本文档第7章
└── 06-appendix.md                    # 本文档第8章
```

---

**文档结束**

本规格说明书基于全部12个议题（6架构议题+6DDD议题）的确认决策编制，涵盖从建模工具到运行时框架、从代码生成到AI编排、从基础CRUD到DDD事件驱动的完整技术规格。实施完成后，系统将具备"本体抽象→模型共识→AI生成底座+AI动态运行+DDD事件驱动"的完整企业级应用框架能力。
```

---

以上是完整的Markdown内容 