# 本体模型+AI驱动系统 项目路线图 v2.0

## 基于 DDD术语映射 + AI驱动系统规格说明书

**版本**: v2.0  
**日期**: 2024年  
**状态**: 整合规划  

---

## 一、项目架构总览

### 1.1 双系统架构

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
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Ontology-DDD 术语映射（核心对齐）

| Ontology术语 | DDD术语 | 映射规则 | 强制约束 |
|:---|:---|:---|:---|
| **领域** | **限界上下文** | 1:1对应 | 8大行业领域 = 8个限界上下文 |
| **项目** | **模块** | 上下文内子分组 | 项目内按业务模块划分 |
| **实体** | **聚合** | 实体即聚合 | `isAggregateRoot = true`（强制） |
| **属性** | **值对象** | 属性即值对象 | 无标识，依附于聚合 |
| **关系** | **聚合引用** | 关系即聚合间关联 | 外键关联，跨聚合边界 |

### 1.3 五大模型 → DDD映射

| Ontology模型 | DDD概念 | 实现位置 | 说明 |
|:---|:---|:---|:---|
| **数据模型** | 聚合结构 | 聚合边界内 | 属性+关系定义 |
| **行为模型** | 状态模式 | 聚合根方法 | 聚合内状态流转 |
| **规则模型** | 不变量 | 聚合根/值对象 | 聚合边界内校验 |
| **流程模型** | 领域服务 | 领域服务层 | 跨聚合编排 |
| **事件模型** | 领域事件 | 事件总线 | 聚合根发布 |

---

## 二、里程碑规划（24周）

### 里程碑概览

| 阶段 | 周期 | 目标 | 关键交付物 |
|:---|:---|:---|:---|
| **M1** | Week 1-4 | 建模工具增强 | 版本管理、聚合根标记、发布对话框 |
| **M2** | Week 5-8 | 代码生成器 | Flask后端、React前端、Docker配置 |
| **M3** | Week 9-12 | AI编排器核心 | 意图识别、按需注入、工具执行 |
| **M4** | Week 13-16 | 运行时框架 | 三栏布局、6种视图、版本切换 |
| **M5** | Week 17-20 | 自愈+可视化 | 错误修正、ECharts/Mermaid渲染 |
| **M6** | Week 21-24 | DDD事件增强 | 事务边界、精简模式、幂等性 |

---

## 三、M1: 建模工具增强（Week 1-4）

### 3.1 版本管理功能

**类型定义**：
```typescript
interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;        // 语义化版本，如"1.0.0"
  name: string;           // 版本名称
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
```

**实现任务**：
- [ ] 数据模型：ProjectVersion类型定义
- [ ] Store：版本CRUD状态管理
- [ ] API：/api/versions CRUD接口
- [ ] UI：版本列表组件
- [ ] UI：创建版本对话框
- [ ] 存储：Zustand状态 + localStorage持久化

### 3.2 聚合根标记（E1约束）

**核心约束**：
- 实体 = DDD聚合（强制聚合根）
- 仅聚合根可发布领域事件
- 非聚合根实体发布事件时警告

**实现任务**：
- [ ] Entity类型添加 `isAggregateRoot` 字段
- [ ] 实体编辑器添加聚合根复选框
- [ ] 事件定义校验：非聚合根实体不能定义事件
- [ ] UI提示：非聚合根发布事件时显示警告

### 3.3 发布对话框与配置

**发布配置**：
```typescript
interface PublishConfig {
  target: 'local' | 'remote' | 'download';
  includeData: boolean;        // 是否包含示例数据
  aiAgentEnabled: boolean;     // 是否启用AI运行时
  dockerCompose: boolean;      // 是否生成Docker配置
}
```

**UI设计**：
```
┌─────────────────────────────────────────────────────────┐
│  发布新版本                                              │
│  ─────────────────────────────────────────────────────  │
│  版本号：  [1.0.0          ]                            │
│  版本名称：[合同管理系统初始版本]                         │
│  说明：    [基于离散制造领域...                    ]      │
│                                                         │
│  发布选项：                                              │
│  ☑ 包含示例数据                                          │
│  ☑ 启用AI运行时助手                                       │
│  ☑ 生成Docker Compose配置                                │
│                                                         │
│  目标： ○ 本地Docker  ○ 下载代码包                        │
│                                                         │
│        [  取消  ]        [  生成并发布  ]                 │
└─────────────────────────────────────────────────────────┘
```

**实现任务**：
- [ ] 发布对话框组件
- [ ] 版本号输入与校验
- [ ] 发布选项配置表单
- [ ] 发布按钮触发代码生成
- [ ] 版本历史查看

---

## 四、M2: 代码生成器（Week 5-8）

### 4.1 生成物结构

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
│   └── state_machine/
│       └── engine.py
├── frontend/                   # React前端
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # 三栏式布局
│       ├── components/
│       │   ├── layout/
│       │   ├── chat/
│       │   ├── data/
│       │   ├── visualization/
│       │   └── context/
│       ├── services/
│       └── store/
└── database/
    ├── init.sql                # 初始化脚本
    └── seed.sql                # 示例数据
```

### 4.2 后端生成器任务

- [ ] SQLAlchemy动态实体基类
- [ ] 实体类生成器（根据数据模型）
- [ ] CRUD API路由生成
- [ ] 状态机接口生成（根据行为模型）
- [ ] 规则校验接口生成（根据规则模型）
- [ ] 事件发布接口生成（根据事件模型）

### 4.3 前端生成器任务

- [ ] React组件模板
- [ ] 列表视图组件生成
- [ ] 表单视图组件生成
- [ ] 详情页组件生成
- [ ] 三栏式布局模板

### 4.4 Docker配置任务

- [ ] docker-compose.yml模板
- [ ] backend/Dockerfile
- [ ] frontend/Dockerfile
- [ ] 环境变量配置
- [ ] 构建脚本

---

## 五、M3: AI编排器核心（Week 9-12）

### 5.1 架构组件

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
│     ├── 按需注入：仅直接关联实体                          │
│     ├── 混合格式：JSON Schema + 自然语言注释              │
│     └── 缓存：元模型文件监听热载                          │
├─────────────────────────────────────────────────────────┤
│  4. LLM策略引擎 (LLM Strategy) - 远程调用                │
│     ├── 单模型：DeepSeek-V3/豆包                         │
│     ├── Function Calling：结构化工具调用                  │
│     └── 温度：0.3（低随机性）                             │
├─────────────────────────────────────────────────────────┤
│  5. 工具执行器 (Tool Executor)                            │
│     ├── execute_query: 只读SQL                           │
│     ├── call_skill: 领域技能（写操作）                    │
│     ├── open_ui: 路由跳转                                │
│     └── generate_chart: ECharts/Mermaid配置生成          │
├─────────────────────────────────────────────────────────┤
│  6. 自愈机制 (Self-Healing) - 最多2次重试                │
│     ├── 错误捕获：SQL/工具执行异常                        │
│     ├── 修正Prompt：错误信息+元模型+原始调用               │
│     └── 详细展示：完整修正过程                            │
└─────────────────────────────────────────────────────────┘
```

### 5.2 意图分析器任务

- [ ] 意图分类器（query/analyze/operate/navigate）
- [ ] 实体链接模块
- [ ] 操作提取模块
- [ ] 本地关键词匹配

### 5.3 语义注入器任务

- [ ] 按需注入逻辑（仅直接关联实体）
- [ ] 混合格式Prompt生成
- [ ] JSON Schema生成
- [ ] 元模型缓存与热加载

### 5.4 工具执行器任务

- [ ] execute_query工具（SQL安全过滤）
- [ ] call_skill工具（领域技能调用）
- [ ] open_ui工具（路由指令）
- [ ] generate_chart工具（图表配置）

---

## 六、M4: 运行时框架（Week 13-16）

### 6.1 三栏式布局

```
┌──────────────────────────────────────────────────────────────────┐
│  [左栏: 对话]  │        [中栏: 数据视图]          │  [右栏: 上下文] │
│  280px固定    │         自适应宽度               │   300px固定    │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ │  ┌────────────────────────────┐  │  ┌───────────┐ │
│  │ 会话历史  │ │  │                            │  │  │ 聚焦实体   │ │
│  │          │ │  │    当前视图内容              │  │  │ 详情      │ │
│  │          │ │  │                            │  │  │           │ │
│  │          │ │  │                            │  │  │ 属性列表   │ │
│  │          │ │  │                            │  │  │           │ │
│  ├──────────┤ │  │                            │  │  │ 关联实体   │ │
│  │ 输入框   │ │  │                            │  │  │           │ │
│  └──────────┘ │  └────────────────────────────┘  │  └───────────┘ │
│               │  [视图切换: 列表|表单|流程|ER图|表格|图表]         │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 六种数据视图

| 视图 | 标识 | 默认 | 说明 |
|:---|:---|:---|:---|
| 列表视图 | `list` | - | 实体表格，筛选/分页/排序 |
| 表单视图 | `form` | - | 单实体详情/编辑 |
| **流程视图** | `flowchart` | ✅ **默认** | Mermaid状态流转图 |
| ER图视图 | `erdiagram` | - | Mermaid实体关系图 |
| 表格视图 | `table` | P0 | 明细数据表格 |
| 图表视图 | `chart` | - | ECharts统计图表 |

### 6.3 运行时任务

- [ ] ThreeColumnLayout组件
- [ ] LeftSidebar（对话界面）
- [ ] CenterPanel（视图切换框架）
- [ ] RightSidebar（实体上下文）
- [ ] 6种视图组件实现
- [ ] 版本切换API
- [ ] 元模型热加载

---

## 七、M5: 自愈机制+可视化（Week 17-20）

### 7.1 自愈机制流程

```python
class SelfHealingExecutor:
    MAX_RETRIES = 2  # 最多2次重试
    
    async def execute_with_healing(self, tool_call: dict, context: dict):
        attempt = 0
        healing_log = []
        
        while attempt <= self.MAX_RETRIES:
            try:
                result = await self.tool_executor.execute(tool_call)
                return Success(result, healing_log=healing_log)
                
            except ExecutionError as e:
                attempt += 1
                if attempt > self.MAX_RETRIES:
                    break
                
                # 构建修正Prompt并请求LLM分析
                correction = await self.llm.generate_correction(healing_prompt)
                healing_log.append(correction)
                tool_call = self._apply_correction(tool_call, correction)
        
        # 重试耗尽，返回原始错误
        raise SelfHealingExhaustedError(healing_log=healing_log)
```

### 7.2 自愈任务

- [ ] 错误捕获与分类
- [ ] 修正Prompt构建
- [ ] 重试循环（最多2次）
- [ ] 详细展示组件
- [ ] 原始错误降级返回

### 7.3 可视化任务

- [ ] EChartsRenderer组件
- [ ] MermaidRenderer组件
- [ ] 静态展示配置
- [ ] AI自动识别图表类型

---

## 八、M6: DDD事件增强（Week 21-24）

### 8.1 事件设计决策汇总

| 议题 | 决策 | 说明 |
|:---|:---|:---|
| E1 聚合根约束 | 标记聚合根 | 仅聚合根可发布事件 |
| E2 事务边界 | 默认AFTER_COMMIT | 事务提交后发布 |
| E3 事件内容 | 强制精简模式 | 限制5个字段 |
| E4 幂等性 | 事件ID去重 | 订阅者记录已处理ID |
| E5 跨上下文 | 保持现状 | webhook作为跨系统方式 |
| E6 事件溯源 | 不支持 | 事件仅作为通知 |

### 8.2 事件模型定义

```typescript
interface EventDefinition {
  id: string;
  name: string;                    // 过去时命名
  entityId: string;
  entityIsAggregateRoot: boolean;  // E1: 校验必须为true
  
  trigger: 'create' | 'update' | 'delete' | 'state_change' | 'custom';
  transactionPhase: 'AFTER_COMMIT' | 'BEFORE_COMMIT';  // E2: 默认AFTER_COMMIT
  
  isDomainEvent: boolean;          // E3: 领域事件模式开关
  payloadFields: string[];        // E3: isDomainEvent=true时最多5个
  
  description: string;
}
```

### 8.3 DDD事件任务

- [ ] E1: 聚合根约束校验
- [ ] E2: 事务阶段配置UI
- [ ] E3: 精简模式实现（5字段限制）
- [ ] E4: 事件ID生成与幂等检查
- [ ] 事件存储表设计
- [ ] 订阅处理器框架

---

## 九、验收标准

| 场景 | 验收标准 |
|:---|:---|
| **版本发布** | 建模工具点击"发布"→生成代码包→`docker-compose up`→浏览器访问→看到运行时登录页 |
| **聚合根约束** | 非聚合根实体尝试定义事件→系统警告"仅聚合根可发布领域事件" |
| **事务边界** | 状态流转事件默认AFTER_COMMIT→数据库事务提交后才触发订阅者 |
| **事件精简** | 开启"领域事件模式"→字段选择器限制5个→强制包含ID字段 |
| **自然语言查询** | 运行时输入"列出张三的合同"→AI生成SQL→返回表格→右栏自动显示"张三"上下文 |
| **自然语言分析** | 运行时输入"按部门统计合同金额"→AI生成饼图→中栏显示ECharts |
| **自然语言操作** | 运行时输入"将合同2025-001状态改为生效"→AI调用技能→状态变更成功 |
| **自愈机制** | SQL错误→AI首次失败→自动修正→成功执行→对话显示完整修正过程 |
| **版本切换** | 运行时界面切换至v1.0.0→数据模型回退→操作旧版本数据 |
| **事件订阅幂等** | 同一事件被订阅者处理两次→第二次检测到已处理ID→跳过不重复执行 |

---

## 十、技术栈

| 层级 | 技术 | 版本 |
|:---|:---|:---|
| **系统A** | | |
| 前端框架 | Next.js | 16 (App Router) |
| UI组件 | shadcn/ui | - |
| 状态管理 | Zustand | - |
| 样式 | Tailwind CSS | 4 |
| **系统B** | | |
| 前端框架 | React | 18+ |
| 构建工具 | Vite | 4+ |
| UI组件 | Ant Design | 5.x |
| 图表 | ECharts | 5.x |
| 流程图 | Mermaid | 10.x |
| 后端框架 | Flask | 2.3+ |
| ORM | SQLAlchemy | 2.0+ |
| 数据库 | SQLite | 3.x |
| AI SDK | DeepSeek/豆包 | - |
| 部署 | Docker Compose | - |

---

## 十一、依赖关系

```
M1: 建模工具增强
  │
  ├──→ M2: 代码生成器（依赖M1的版本数据和聚合根标记）
  │       │
  │       ├──→ M3: AI编排器（依赖M2生成的API结构）
  │       │       │
  │       └──→ M4: 运行时框架（依赖M2的前后端代码）
  │               │
  ├──→ M5: 自愈+可视化（依赖M3的工具执行器和M4的布局）
  │
  └──→ M6: DDD事件增强（依赖M1的聚合根标记和M2的事件接口）
```

---

## 十二、风险与缓解

| 风险 | 影响 | 缓解措施 |
|:---|:---|:---|
| AI模型API不稳定 | 高 | 支持多模型切换，本地缓存降级 |
| 代码生成质量 | 中 | 模板化生成 + 后期可手动修改 |
| DDD概念理解偏差 | 中 | 术语映射文档 + 代码评审 |
| Docker部署复杂度 | 中 | 提供详细部署文档 + 一键脚本 |
| 运行时性能 | 中 | SQLite优化 + 查询缓存 |

---

**文档结束**

本路线图整合了DDD术语映射和AI驱动系统规格，确保Ontology建模与DDD实现的无缝对接。
