涵盖从建模工具到运行时框架的完整演进路径。实施完成后，系统将具备"本体抽象→模型共识→AI生成底座+AI动态运行"的完整闭环能力
本体模型+AI驱动系统 演进路线图
Ontology-Driven Metamodeling & Hybrid AI Execution Framework
Implementation Roadmap v1.0
版本：基于6议题确认决策
日期：2026-03-30
状态：从建模工具演进为运行时框架
一、架构演进总览
1.1 双系统架构
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
1.2 数据流转架构
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
二、系统A：建模工具（当前→增强）
2.1 当前功能保持
| 模块      | 功能             | 状态   |
| ------- | -------------- | ---- |
| 领域建模    | 8大行业领域选择       | ✅ 保持 |
| 项目管理    | 创建/编辑/删除项目分组   | ✅ 保持 |
| 实体管理    | CRUD+分组        | ✅ 保持 |
| 五大元模型编辑 | 数据/行为/规则/流程/事件 | ✅ 保持 |
| 元数据管理   | 57条标准字段+CRUD   | ✅ 保持 |
| AI辅助生成  | 豆包大模型生成建议      | ✅ 保持 |
| 手册导出    | Markdown格式     | ✅ 保持 |
2.1.1 补充约束：业务场景归属
- 实体创建必须绑定 `businessScenarioId`，形成“项目 → 业务场景 → 实体 → 四大元模型”的固定归属链路。
- 实体一旦创建，不允许跨业务场景移动；编辑实体时仅允许展示归属业务场景，不允许修改。
- 工作台实体列表必须按当前选中的业务场景过滤；未选业务场景时不得创建实体。
- EPC 说明书中的“业务背景/场景说明”只能引用当前实体所属 `BusinessScenario.description`，不得由页面手工编辑或模型自行虚构。

2.1.2 补充约束：EPC事件说明书
- EPC 页签名称固定为“EPC事件说明书”，仅聚合根实体显示。
- EPC 页签为只读生成视图，不提供“新建、编辑、保存补充信息、手工添加信息对象/组织单元/系统”等入口。
- EPC 内容由数据模型、行为模型、规则模型、事件模型和业务场景说明联合生成；当模型变更后，用户可手动点击“重新生成”。
- 页签导出与页面预览必须保持同源，支持 Markdown、JSON 和整包导出。

2.1.3 补充约束：属性编辑与主数据关联
- 属性主字段切换为：`dataType`、`metadataTemplateId`、`metadataTemplateName`、`referenceKind`、`referencedEntityId`、`isMasterDataRef`、`masterDataType`、`masterDataField`。
- 当属性绑定元数据模板时，`dataType` 以模板解析结果为准，页面不得允许用户输入与模板冲突的类型。
- 当 `dataType = 'reference'` 且引用实体时，必须填写 `referencedEntityId`。
- 当 `isMasterDataRef = true` 时，系统必须同时满足：`dataType = 'reference'`、`referenceKind = 'masterData'`、`masterDataType` 必填，`masterDataField` 可选。
- `referencedEntityId` 与 `masterDataType` 互斥，同一属性不允许同时有效绑定实体引用和主数据引用。

2.2 新增功能：版本发布
2.2.1 版本管理功能
// 新增类型定义
interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;  // 语义化版本，如"1.0.0"
  name: string;     // 版本名称，如"初始版本"
  description: string;
  metamodels: {
    data: DataModel;
    behavior: BehaviorModel;
    rules: RuleModel;
    process: ProcessModel;
    events: EventModel;
  };
  createdAt: string;
  publishedAt?: string;  // 发布时间
  status: 'draft' | 'published' | 'archived';
}

interface PublishConfig {
  target: 'local' | 'remote';  // 本地Docker或远程服务器
  includeData: boolean;        // 是否包含示例数据
  aiAgentEnabled: boolean;   // 是否启用AI运行时
}
2.2.2 发布流程UI
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
2.3 发布代码生成器
2.3.1 生成物结构
plain
复制
生成的代码包（zip或目录）：
contract-management-v1.0.0/
├── docker-compose.yml          # Docker编排
├── README.md                   # 部署说明
├── backend/                    # Flask后端
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py                  # 主应用
│   ├── config.py
│   ├── models/                 # SQLAlchemy动态模型
│   │   ├── dynamic_entity.py
│   │   └── generated/          # 生成的实体类
│   ├── api/                    # REST API
│   │   ├── entities.py         # CRUD接口
│   │   ├── state_machine.py    # 状态机接口
│   │   ├── rules.py            # 规则校验接口
│   │   └── agent.py            # AI编排器接口
│   ├── ai/                     # AI运行时
│   │   ├── orchestrator.py     # 编排器
│   │   ├── intent_analyzer.py  # 意图识别
│   │   ├── tool_executor.py    # 工具执行
│   │   ├── self_healing.py     # 自愈机制
│   │   └── prompts/            # Prompt模板
│   ├── services/               # 领域技能
│   │   └── generated/          # 生成的Skill类
│   ├── rules/                  # 规则引擎
│   │   └── evaluator.py
│   ├── state_machine/          # 状态机引擎
│   │   └── engine.py
│   └── utils/
│       └── sql_sanitizer.py    # SQL安全过滤
├── frontend/                   # React前端
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx            # 入口
│   │   ├── App.tsx             # 三栏式布局
│   │   ├── components/
│   │   │   ├── layout/         # 布局组件
│   │   │   │   ├── ThreeColumnLayout.tsx
│   │   │   │   ├── LeftSidebar.tsx      # 左栏：对话
│   │   │   │   ├── CenterPanel.tsx      # 中栏：数据视图
│   │   │   │   └── RightSidebar.tsx     # 右栏：上下文
│   │   │   ├── chat/           # 对话组件
│   │   │   │   ├── ChatHistory.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── MessageBubble.tsx    # 支持Markdown/图表
│   │   │   ├── data/           # 数据视图
│   │   │   │   ├── EntityList.tsx       # 列表视图（默认）
│   │   │   │   ├── EntityForm.tsx       # 表单视图
│   │   │   │   ├── FlowchartView.tsx    # 流程视图（默认）
│   │   │   │   ├── ERDiagramView.tsx    # ER图视图
│   │   │   │   └── TableView.tsx        # 表格视图
│   │   │   ├── visualization/  # 可视化
│   │   │   │   ├── EChartsRenderer.tsx  # ECharts渲染
│   │   │   │   └── MermaidRenderer.tsx  # Mermaid渲染
│   │   │   └── context/        # 上下文组件
│   │   │       └── EntityContext.tsx    # 右栏上下文
│   │   ├── services/           # API服务
│   │   │   ├── entityApi.ts
│   │   │   ├── agentApi.ts     # AI编排器API
│   │   │   └── versionApi.ts   # 版本管理
│   │   └── store/              # 状态管理
│   │       └── runtimeStore.ts # 运行时状态
│   └── public/
└── database/                   # 数据库
    ├── init.sql                # 初始化脚本
    └── seed.sql                # 示例数据（可选）
2.3.2 核心生成逻辑
TypeScript
复制
// 代码生成器伪代码
class CodeGenerator {
  generate(projectVersion: ProjectVersion): CodePackage {
    return {
      dockerCompose: this.generateDockerCompose(projectVersion),
      backend: {
        models: this.generateSQLAlchemyModels(projectVersion.metamodels.data),
        api: this.generateFlaskAPI(projectVersion.metamodels),
        ai: this.generateAIAgent(projectVersion.metamodels),
        services: this.generateSkills(projectVersion.metamodels.data),
        rules: this.generateRuleEngine(projectVersion.metamodels.rules),
        stateMachine: this.generateStateMachine(projectVersion.metamodels.behavior),
      },
      frontend: {
        components: this.generateReactComponents(projectVersion.metamodels.data),
        views: this.generateDataViews(projectVersion.metamodels),
        chat: this.generateChatInterface(),
      },
      database: {
        init: this.generateDDL(projectVersion.metamodels.data),
        seed: this.generateSeedData(projectVersion),
      }
    };
  }

  // 生成SQLAlchemy动态模型
  generateSQLAlchemyModels(dataModel: DataModel): string {
    return dataModel.entities.map(entity => `
class ${entity.nameEn}(Base):
    __tablename__ = '${entity.id}'
    
    ${entity.attributes.map(attr => `
    ${attr.nameEn} = Column(${this.mapType(attr.type)}, 
        ${attr.required ? 'nullable=False' : 'nullable=True'},
        ${attr.unique ? 'unique=True' : ''})
    `).join('\n    ')}
    
    ${entity.relations.map(rel => `
    ${rel.id} = relationship('${rel.target_entity}', 
        ${rel.type === 'one_to_many' ? "lazy='dynamic'" : ''})
    `).join('\n    ')}
`).join('\n\n');
  }

  // 生成AI编排器Prompt模板
  generateAIAgent(metamodels: Metamodels): string {
    return `
# 系统Prompt模板（运行时）
你是一个${metamodels.data.domain}领域的业务助手。

【数据模型】（按需注入）
{{ injected_entities }}

【行为模型】
{{ state_machines }}

【规则模型】
{{ rules }}

【可用工具】
{{ tools }}

用户输入：{{ user_input }}
请分析意图并选择合适工具。
`.trim();
  }
}
三、系统B：运行时框架（新增）
3.1 技术栈确认
表格
层级	技术	版本	说明
前端	React	18+	Vite构建，轻量无SSR
前端UI	Ant Design	5.x	企业级组件库
前端图表	ECharts	5.x	统计图表
前端流程	Mermaid	10.x	流程图/ER图
后端	Flask	2.3+	Python轻量框架
ORM	SQLAlchemy	2.0+	动态模型映射
数据库	SQLite	3.x	单文件，零配置
AI SDK	OpenAI/DeepSeek	-	Function Calling
部署	Docker Compose	-	一键启动
3.2 三栏式布局实现
TypeScript
复制
// ThreeColumnLayout.tsx
const ThreeColumnLayout: React.FC = () => {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const { currentView, focusEntity } = useRuntimeStore();

  return (
    <Layout className="runtime-layout">
      {/* 左栏：对话 */}
      <Sider 
        width={280} 
        collapsed={leftCollapsed}
        collapsible
        trigger={null}
      >
        <ChatInterface />
      </Sider>

      {/* 中栏：数据视图 */}
      <Content>
        <CenterPanel view={currentView} />
        {/* 当前视图：list/form/flowchart/erdiagram/table/... */}
      </Content>

      {/* 右栏：上下文 */}
      <Sider 
        width={300} 
        collapsed={rightCollapsed}
        collapsible
        trigger={null}
      >
        <EntityContext entity={focusEntity} />
      </Sider>
    </Layout>
  );
};
3.3 AI编排器实现
Python
复制
# ai/orchestrator.py
class AIOrchestrator:
    def __init__(self, metamodels: Metamodels):
        self.metamodels = metamodels
        self.intent_analyzer = IntentAnalyzer()
        self.tool_executor = ToolExecutor()
        self.self_healing = SelfHealingExecutor()
        self.cache = MetamodelCache()  # 文件监听热载
        
    async def execute(self, user_input: str, context: ConversationContext) -> AIResponse:
        # 1. 意图识别（本地）
        intent = self.intent_analyzer.analyze(user_input)
        
        # 2. 按需注入（仅直接关联实体）
        injected_entities = self._get_injected_entities(intent)
        
        # 3. 构造混合格式Prompt
        system_prompt = self._build_prompt(injected_entities)
        
        # 4. LLM推理（远程）
        try:
            response = await self.llm.chat_completion(
                system_prompt=system_prompt,
                user_input=user_input,
                tools=AVAILABLE_TOOLS,
                function_calling=True
            )
        except Exception as e:
            # 5. 自愈机制（最多2次重试，详细展示）
            response = await self.self_healing.heal(
                error=e,
                original_input=user_input,
                system_prompt=system_prompt,
                max_retries=2,
                verbose=True  # 详细展示修正过程
            )
        
        # 6. 执行工具调用
        results = []
        for tool_call in response.tool_calls:
            result = await self.tool_executor.execute(tool_call)
            results.append(result)
        
        return AIResponse(
            message=response.message,
            actions=results,
            context_updates=self._extract_context(results)
        )
    
    def _get_injected_entities(self, intent: Intent) -> List[Entity]:
        """按需注入：仅直接关联实体（Q3.3确认）"""
        primary_entity = self.metamodels.data.get_entity(intent.target_entity)
        related_entities = [
            self.metamodels.data.get_entity(rel.target_entity)
            for rel in primary_entity.relations
        ]
        return [primary_entity] + related_entities
    
    def _build_prompt(self, entities: List[Entity]) -> str:
        """混合格式：JSON + 自然语言注释（Q3.2确认）"""
        return f"""
你是一个{self.metamodels.data.domain}领域的业务助手。

【数据模型】
以下是你可操作的实体定义（JSON格式）：

```json
{json.dumps([e.to_dict() for e in entities], ensure_ascii=False, indent=2)}
关键字段说明：
{self._generate_field_descriptions(entities)}
【行为模型】
状态机定义：{self.metamodels.behavior.to_summary()}
【规则模型】
业务约束：{self.metamodels.rules.to_summary()}
【可用工具】
execute_query: 执行只读SQL查询（安全过滤）
call_skill: 调用业务技能（写操作）
open_ui: 打开UI页面
generate_chart: 生成图表配置
请根据用户输入，选择合适的工具并生成参数。
"""
plain
复制

### 3.4 自愈机制实现

```python
# ai/self_healing.py
class SelfHealingExecutor:
    MAX_RETRIES = 2  # Q6.2确认：最多2次
    
    async def heal(self, error: Exception, original_input: str, 
                   system_prompt: str, max_retries: int, verbose: bool) -> LLMResponse:
        """自愈执行（详细展示模式）"""
        attempt = 0
        last_error = error
        healing_log = []  # 详细展示用
        
        while attempt < max_retries:
            attempt += 1
            
            # 构建修正Prompt（包含错误信息）
            healing_prompt = f"""
执行时发生错误，请分析并修正：

原始用户输入：{original_input}

错误信息：{str(last_error)}
错误类型：{type(last_error).__name__}

之前的系统Prompt：{system_prompt[:500]}...

请分析错误原因并生成修正方案。如果是SQL错误，检查字段名是否正确。
"""
            
            # 请求LLM生成修正
            correction = await self.llm.generate_correction(healing_prompt)
            healing_log.append({
                "attempt": attempt,
                "error": str(last_error),
                "analysis": correction.analysis,
                "corrected_action": correction.action
            })
            
            # 尝试执行修正后的操作
            try:
                result = await self._execute_corrected(correction)
                if verbose:
                    # 详细展示：返回完整修正过程
                    return LLMResponse(
                        message=f"查询优化完成（经过{attempt}次修正）：\n" +
                                "\n".join([f"第{h['attempt']}次：{h['analysis']}" for h in healing_log]) +
                                f"\n最终结果：{result}",
                        tool_calls=result.tools
                    )
                return result
                
            except Exception as new_error:
                last_error = new_error
                continue
        
        # 重试耗尽，返回原始错误（Q6.3确认）
        raise SelfHealingExhaustedError(
            message=f"经过{max_retries}次尝试仍无法修正",
            healing_log=healing_log,
            original_error=last_error
        )
3.5 数据视图实现
TypeScript
复制
// CenterPanel.tsx - 支持6种视图，Flowchart默认
const CenterPanel: React.FC<{ view: ViewType }> = ({ view }) => {
  switch (view.type) {
    case 'list':
      return <EntityList entityType={view.entityType} />;
    case 'form':
      return <EntityForm entity={view.entity} mode={view.mode} />;
    case 'flowchart':
      // 默认视图：行为模型状态流转图
      return <FlowchartView stateMachine={view.stateMachine} />;
    case 'erdiagram':
      return <ERDiagramView entities={view.entities} relations={view.relations} />;
    case 'table':
      return <TableView data={view.data} columns={view.columns} />;
    case 'chart':
      return <EChartsRenderer config={view.chartConfig} />;
    default:
      return <FlowchartView stateMachine={getDefaultStateMachine()} />;
  }
};
四、版本发布机制
4.1 版本管理流程
plain
复制
建模工具（Coze Studio）                    运行时（本地Docker）
┌─────────────────┐                        ┌─────────────────┐
│   设计时编辑     │                        │   运行时操作     │
│                 │                        │                 │
│  v1.0.0（草稿）  │─────[发布]────────────→│  选择版本运行   │
│    ↓ 修改       │   生成代码包            │    v1.0.0      │
│  v1.0.1（草稿）  │                        │                 │
│    ↓ 发布       │─────[发布]────────────→│  切换至v1.0.1   │
│  v1.0.1（已发布）│                        │                 │
│    ↓ 重大修改   │                        │                 │
│  v1.1.0（草稿）  │─────[发布]────────────→│  并存多版本     │
│                 │                        │  v1.0.1 & v1.1.0│
└─────────────────┘                        └─────────────────┘
4.2 运行时版本切换UI
plain
复制
运行时系统Header新增版本选择：
┌─────────────────────────────────────────────────────────┐
│  [系统名称]  [当前实体: 合同]    版本: [v1.0.1 ▼]  [用户] │
│                                         ↑              │
│                              点击展开版本列表：          │
│                              ├── v1.1.0 (最新)          │
│                              ├── v1.0.1 (当前) ✓        │
│                              └── v1.0.0                 │
│                                                         │
│                              [版本管理] [发布新版本]     │
└─────────────────────────────────────────────────────────┘
五、实施里程碑
5.1 里程碑规划（16-24周）
表格
阶段	周期	目标	交付物
M1	Week 1-4	建模工具增强	版本管理功能、发布对话框
M2	Week 5-8	代码生成器	后端生成器（Flask模型/API）、前端生成器（React组件）
M3	Week 9-12	AI编排器	意图识别、按需注入、混合格式Prompt、工具执行
M4	Week 13-16	运行时框架	三栏式布局、6种数据视图、对话界面
M5	Week 17-20	自愈机制	错误捕获、修正循环、详细展示、日志记录
M6	Week 21-24	集成测试	端到端测试、文档、部署优化
5.2 验收标准
表格
场景	验收标准
版本发布	建模工具点击"发布"→生成代码包→Docker Compose启动→浏览器访问运行时
自然语言查询	运行时输入"列出张三的合同"→AI生成SQL→返回表格数据→右栏自动显示"张三"上下文
自然语言分析	运行时输入"按部门统计合同金额"→AI生成饼图配置→中栏显示ECharts饼图（静态展示）
自然语言操作	运行时输入"将合同2025-001状态改为生效"→AI调用Skill→状态变更成功
自愈机制	运行时输入错误字段名→AI首次SQL失败→自动修正→成功执行→详细展示修正过程
版本切换	运行时界面切换至v1.0.0→数据模型回退→操作旧版本数据
六、技术风险与缓解
表格
风险	可能性	影响	缓解策略
Coze Studio生成代码包大小限制	中	高	分模块生成，按需下载
运行时AI响应延迟（>5秒）	中	中	本地缓存元模型，优化Prompt长度
SQLite并发性能瓶颈（>5用户）	低	中	文档明确1-5用户限制，后续迁移PostgreSQL
自愈机制循环修正失败	中	低	最多2次限制，详细展示后人工介入
版本兼容性（模型变更）	中	高	版本号语义化，重大变更升主版本
七、附录：核心接口定义
7.1 建模工具→运行时API
TypeScript
复制
// 发布接口
POST /api/publish
Body: {
  projectId: string;
  version: string;
  name: string;
  description: string;
  metamodels: Metamodels;
  config: PublishConfig;
}
Response: {
  downloadUrl: string;  // 代码包下载链接
  dockerCompose: string; // 或直接在Coze环境启动
}

// 版本列表
GET /api/versions?projectId=xxx
Response: ProjectVersion[]
7.2 运行时AI编排API
TypeScript
复制
// AI执行接口
POST /api/agent/execute
Body: {
  sessionId: string;
  userInput: string;
  context: {
    currentView: ViewType;
    focusEntity?: EntityRef;
  }
}
Response: {
  message: string;
  actions: AIAction[];
  contextUpdates: ContextUpdate;
  healingLog?: HealingLog[];  // 如有自愈过程
}
