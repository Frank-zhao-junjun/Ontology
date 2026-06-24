涵盖从建模工具到交付加载体系的完整演进路径。实施完成后，系统将具备"本体抽象→模型共识→AI生成底座+AI动态运行"的完整闭环能力
本体模型+AI驱动系统 演进路线图
Ontology-Driven Metamodeling & Hybrid AI Execution Framework
Implementation Roadmap v1.1
版本：基于6议题确认决策 + AI代理框架集成
日期：2026-04-19
状态：从建模工具演进为交付加载体系 + AI代理能力增强
一、架构演进总览
1.1 双系统架构
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
1.2 数据流转架构
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
## 二、系统A：建模工具（当前→增强）

### 2.1 当前功能保持
| 模块      | 功能             | 状态   |
| ------- | -------------- | ---- |
| 领域建模    | 8大行业领域选择       | ✅ 保持 |
| 项目管理    | 创建/编辑/删除项目分组   | ✅ 保持 |
| 实体管理    | CRUD+分组        | ✅ 保持 |
| 五大元模型编辑 | 数据/行为/规则/流程/事件 | ✅ 保持 |
| 元数据管理   | 57条标准字段+CRUD   | ✅ 保持 |
| AI辅助生成  | 豆包大模型生成建议      | ✅ 保持 |
| 手册导出    | Markdown格式     | ✅ 保持 |
| **Excel导入** | **模板下载+文件上传+数据校验+解析为模型对象+生成待审核版本+审核流程** | **✅ 新增** |
| **EPC全域关联** | **链路建模+模型关联+流程图渲染+双向校验(71条规则: VE×17+VM×39+VX×15)** | **✅ 新增** |
| **组织体系建模** | **部门树+结构化岗位职责+HR系统定时同步+EPC引用** | **✅ 新增** |
| **Entity Lifecycle** | **State/Transition/Action增强+聚合视图+审计追溯+15条校验规则** | **✅ 新增** |
| **Agent Semantic Layer** | **意图映射+槽位填充+对话上下文+语义关系+术语词典+错误恢复+Agent策略** | **✅ 新增** |
| **参考文档上传** | **Word/PDF/Excel/TXT/MD/CSV上传+自动解析+AI注入+实体提取** | **✅ 新增** |
| **AI代理框架** | **Superpowers + Gstack + Ralph Loop** | **✅ 新增** |
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
2.1.4 补充约束：组织体系与岗位模型
- 新增 OrganizationModel 为一级模型，包含 Department(树形) + Position(岗位)。
- Department 支持5种类型(集团/事业部/部门/团队/班组)，通过 parentId 构建组织树。
- Position 归属部门(departmentId)，关联治理角色(roleIds → GovernanceRole)，含汇报线/编制/任职要求。
- **结构化职责**：PositionResponsibility 定义职责项(scope/actions/decisionAuthority/delegateToPositionIds)，替代原有 responsibilities:string。
- **HR 系统同步**：支持飞书/钉钉/企微/SAP/Workday/自定义API定时同步，含字段映射(HRFieldMapping)、冲突策略(4种)、同步范围、同步历史。
- EPC 的 EpcOrganizationalUnit 通过 refType/refId 引用 Department 或 Position。
- 双向校验新增 VM-O(8条)+VM-HR(4条)+VE-O(2条)+VX-O(4条)。
- 建模工作台新增「组织」Tab，含 HR 同步配置面板。
- Excel导入扩展：模板新增「部门」和「岗位」2个Sheet。

2.1.5 补充约束：Entity Lifecycle（实体生命周期）
- State 增强 7 个字段：entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility。
- Transition 增强 4 个字段：guardCondition/compensationAction/sideEffects/auditLog。
- Action 增强：aliases/triggerPhrases/successMessage/failureMessage/fallbackActionId/requiresConfirmation。
- 新增 EntityLifecycle 聚合视图：actionsByState/rulesByState/eventsByState/rolesByState/auditTrail/stats。
- 新增 LifecycleAuditEntry：记录每次状态变更的时间戳/事件类型/状态变更/操作/执行者/结果。
- 新增校验规则 V-LC-01~15：状态可达性、引用完整性、guardCondition 语法、孤立状态检测等。
- 建模工作台新增「生命周期」Tab：状态流转图 + 状态详情 + 审计记录。

2.1.6 补充约束：Agent Semantic Layer（Agent 语义层）
- 新增 Intent 类型：将自然语言短语映射到 Action，含 triggerPhrases/slotFilling/contextConstraints。
- 新增 SlotFillingStrategy：定义参数追问顺序、校验规则、默认值、上下文推断。
- 新增 DialogContext：维护聚焦实体、最近操作、指代消解、pendingIntent。
- 新增 SemanticRelation：定义 is-a/part-of/synonym-of/causes/depends-on 等 10 种语义关系。
- 新增 BusinessTerm：统一术语定义、同义词、歧义说明、模型引用、时效性。
- 新增 ErrorRecovery：定义操作失败后的重试/回退/升级/补偿/询问用户策略。
- 新增 TemporalValidity：为模型元素添加生效/失效时间、版本号、变更说明。
- 新增 SemanticFieldMapping：自动推断跨实体字段等价关系（exact_match/derived/composed/renamed）。
- 新增 AgentPolicy：定义 Agent 行为边界（allow/deny/confirm/escalate），支持全局/意图/实体/操作/领域多级范围。
- 新增 API：GET /api/agent-semantic-layer 导出完整 AgentSemanticLayer JSON。
- 新增「语义层」管理入口：意图管理/术语词典/语义关系/错误恢复/Agent策略/字段映射/时效管理/完备性仪表盘。



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
  status: 'draft' | 'published' | 'archived' | 'pending_review' | 'rejected';
}

interface PublishConfig {
  target: 'local' | 'remote';  // 本地Docker或远程服务器
  includeData: boolean;        // 是否包含示例数据
  aiAgentEnabled: boolean;   // 是否启用AI交付加载
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
│  │  ☑ 启用AI交付加载助手                                  │  │
│  │  ☑ 生成版本化代码包配置                           │  │
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
│   ├── ai/                     # AI交付加载
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
│   │       └── deliveryStore.ts # 交付加载状态
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
# 系统Prompt模板（交付加载）
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
三、系统B：交付加载（新增）
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
部署	版本化代码包	-	一键启动
3.2 三栏式布局实现
TypeScript
复制
// ThreeColumnLayout.tsx
const ThreeColumnLayout: React.FC = () => {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const { currentView, focusEntity } = useDeliveryStore();

  return (
    <Layout className="delivery-layout">
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
建模工具（Coze Studio）                    交付加载（本地Docker）
┌─────────────────┐                        ┌─────────────────┐
│   设计时编辑     │                        │   交付加载操作     │
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
4.2 交付加载版本切换UI
plain
复制
交付加载系统Header新增版本选择：
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
M4	Week 13-16	交付加载体系	三栏式布局、6种数据视图、对话界面
M5	Week 17-20	自愈机制	错误捕获、修正循环、详细展示、日志记录
M6	Week 21-24	集成测试	端到端测试、文档、部署优化
5.2 验收标准
表格
场景	验收标准
版本发布	建模工具点击"发布"→生成代码包→版本化代码包启动→浏览器访问交付加载
自然语言查询	在交付加载中输入"列出张三的合同"→AI生成SQL→返回表格数据→右栏自动显示"张三"上下文
自然语言分析	在交付加载中输入"按部门统计合同金额"→AI生成饼图配置→中栏显示ECharts饼图（静态展示）
自然语言操作	在交付加载中输入"将合同2025-001状态改为生效"→AI调用Skill→状态变更成功
自愈机制	在交付加载中输入错误字段名→AI首次SQL失败→自动修正→成功执行→详细展示修正过程
版本切换	交付加载界面切换至v1.0.0→数据模型回退→操作旧版本数据
六、技术风险与缓解
表格
风险	可能性	影响	缓解策略
Coze Studio生成代码包大小限制	中	高	分模块生成，按需下载
交付加载AI响应延迟（>5秒）	中	中	本地缓存元模型，优化Prompt长度
SQLite并发性能瓶颈（>5用户）	低	中	文档明确1-5用户限制，后续迁移PostgreSQL
自愈机制循环修正失败	中	低	最多2次限制，详细展示后人工介入
版本兼容性（模型变更）	中	高	版本号语义化，重大变更升主版本
七、附录：核心接口定义
7.1 建模工具→交付加载API
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
7.2 交付加载AI编排API
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

六、Excel 导入与版本审核

6.1 功能概述

支持通过 Excel 文件批量导入本体模型数据，生成待审核版本，审核通过后应用到工作区。适用于项目初始化、跨团队协作和批量数据迁移场景。

6.2 API 接口

6.2.1 模板下载

GET /api/excel-template

返回含 7 个 Sheet（填写说明 + 实体/属性/关系/状态机/规则/事件）的 .xlsx 导入模板。

Response: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet 二进制文件

6.2.2 文件上传与解析

POST /api/excel-import

Request: multipart/form-data, field: file（仅 .xlsx，最大 5MB）

Response:
```json
{
  "success": true,
  "validation": {
    "totalRows": 8,
    "validRows": 8,
    "errorCount": 0,
    "errors": []
  },
  "versionId": "v-xxx",
  "versionName": "v2026-06-13",
  "parsedData": {
    "entities": [{ "name": "物料", "nameEn": "Material", "role": "aggregate_root", ... }],
    "attributes": [{ "entityNameEn": "Material", "name": "编码", "dataType": "string", ... }],
    "relations": [...],
    "stateMachines": [...],
    "rules": [...],
    "eventDefinitions": [...]
  }
}
```

校验规则：
- 文件格式：仅 .xlsx，最大 5MB
- Sheet 结构：必须包含实体/属性/关系/状态机/规则/事件 6 个 Sheet
- 必填字段：各 Sheet 的(必填)标记字段
- 枚举值：实体角色、数据类型、关系类型、规则类型、触发时机等
- 跨 Sheet 引用：属性/关系/状态机/规则/事件中的实体英文名必须在实体 Sheet 中存在
- 描述行/示例行：以 #DESC# / #EXAMPLE# 开头的行自动跳过

6.3 User Stories

US-1: 下载 Excel 导入模板 — 生成含 8 个数据 Sheet (实体/属性/关系/状态机/规则/事件/部门/岗位) + 填写说明的 .xlsx 模板
US-2: 上传 Excel 文件 — 仅接受 .xlsx，5MB 上限，Sheet 结构校验
US-3: 数据解析与校验 — 逐行校验+解析，返回校验结果和 parsedData
US-4: 生成待审核版本 — status=pending_review，版本号按日期自动递增
US-5: 版本审核流程 — approveVersion(应用到工作区) / rejectVersion(驳回+原因)

6.4 版本状态流转

```text
draft → published → archived
              ↑
pending_review → published (审核通过)
pending_review → rejected  (审核驳回)
```

6.5 Store 方法

- createVersionFromParsedData({ parsedData }) — 从 Excel 解析数据创建 pending_review 版本
- approveVersion(versionId) — 审核通过，将 parsedData 应用到工作区
- rejectVersion(versionId, reason) — 审核驳回

七、EPC 全域关联层

7.1 功能概述

EPC 从只读文档升级为全域关联层，是串联 12 大模型（含 Lifecycle + Semantic Layer）的复合关联视图。详见 `docs/EPC-Upgrade-Spec.md` v3.1。

7.2 核心数据结构

- EpcChain：链路（节点+边），关联聚合根实体
- EpcNode：5 种类型(event/function/connector/infoObject/orgUnit)，每节点通过 refs 引用多模型元素
- EpcEdge：节点间连线，支持条件分支
- EpcModelRef：统一关联接口，modelType×refRole 标明引用的模型和角色

7.3 全域关联矩阵

| EPC 节点 | 可关联的模型 |
|---------|----------|
| Event | 事件定义+触发实体+状态转换+触发规则+订阅+权限角色+指标+数据源+主数据+元数据+处理岗位+State.entry/exitActions+Intent(触发类)+BusinessTerm+TemporalValidity |
| Function | 动作/转换+输入输出实体+前后置规则+产生事件+流程步骤+执行角色+指标+数据源+主数据+元数据+责任岗位+State.availableActions+guardCondition+compensationAction+Intent(操作类)+SlotFillingStrategy+ErrorRecovery+AgentPolicy |
| Connector | 分支规则+角色权限+Transition.guardCondition+Intent.contextConstraints |
| InfoObject | 实体/属性+校验规则+变更事件+字段权限+质量指标+数据源+主数据+元数据+State.dataVisibility+SemanticFieldMapping+BusinessTerm+TemporalValidity |
| OrgUnit | 治理角色+权限+行为约束+部门+岗位+State.allowedRoles+notifyRoleIds+approvalRoleIds+AgentPolicy |

7.4 双向校验体系（71 条规则）

| 方向 | 编号前缀 | 规则数 | 核心问题 |
|------|---------|--------|---------|
| EPC → 模型 | VE | 17 | EPC 引用的模型元素是否真实有效、一致、合法？ |
| 模型 → EPC | VM | 39 | 模型定义的元素是否被 EPC 覆盖？(10 大模型+组织+Lifecycle+Semantic) |
| 交叉一致性 | VX | 15 | EPC 关联声明与模型内部定义是否矛盾？ |

7.5 User Stories

US-EPC-1: 创建/编辑 EPC 链路 — 聚合根实体下创建链路，添加节点和边
US-EPC-2: 全域关联选择器 — 节点关联时展示所有模型可选元素
US-EPC-3: 推导生成 — 从已有模型自动推导 EPC 链路骨架
US-EPC-4: 全域关联视图 — 以节点为中心展示所有关联的模型元素
US-EPC-5: 反向引用 — 各模型编辑器显示"出现在哪些 EPC 中"
US-EPC-6: 流程图渲染 — @xyflow/react 自定义 5 种节点形状
US-EPC-7: 关联图谱 — 全局视图展示所有 EPC 链路的关联网络
US-EPC-8: EPC→模型校验 — VE-01~17 规则
US-EPC-9: 模型→EPC 校验 — VM-D/B/R/E/P/G/M/S/O/LC/AS 规则(39 条)
US-EPC-10: 交叉一致性校验 — VX-01~15 规则

7.6 技术选型

@xyflow/react — 流程图渲染，自定义节点组件

八、组织体系与岗位模型

8.1 功能概述

新增 OrganizationModel 为一级模型，包含 Department(树形部门结构) + Position(岗位定义) + HR同步能力。详见 `docs/Organization-Position-Spec.md`。

8.2 核心数据结构

- Department：5 种类型(集团/事业部/部门/团队/班组)，parentId 构建组织树，含 HR 同步字段(syncSource/syncExternalId/syncUpdatedAt)
- Position：归属部门(departmentId)，关联治理角色(roleIds → GovernanceRole)，含汇报线/编制/任职要求
- PositionResponsibility：结构化职责(scope+actions+decisionAuthority+delegateToPositionIds)，替代原 responsibilities:string
- HRSyncConfig：同步配置(source/interval/fieldMapping/conflictStrategy/syncScope)
- HRSyncResult：同步结果(变更统计+冲突列表+错误列表)

8.3 关联链路

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

8.4 EPC 关联

EpcOrganizationalUnit 通过 refType/refId 引用 Department 或 Position。

8.5 HR 系统同步

- 支持 6 种 HR 数据源：飞书/钉钉/企微/SAP/Workday/自定义API
- 同步频率：实时(Webhook)/每小时/每天/每周/手动
- 字段映射：HRFieldMapping 定义 HR 字段 → 本体模型字段路径
- 冲突策略：HR优先/本地优先/合并/人工审核
- 差异比对：3-way diff，自动识别新增/更新/停用
- 安全：API凭证存后端环境变量，同步日志脱敏

8.6 双向校验

- VM-O(8条)：部门覆盖、岗位覆盖、角色关联、组织树环路、岗位归属、职责冲突、职责覆盖、委托链环路
- VM-HR(4条)：同步引用完整性、同步时效、孤儿记录、配置完整性
- VE-O(2条)：组织引用存在性、组织引用类型匹配
- VX-O(4条)：岗位角色一致性、指标对齐、职责-Lifecycle一致、职责-EPC覆盖

8.7 User Stories

US-ORG-1: 创建/编辑部门树 — 树形结构 CRUD，支持 5 种部门类型
US-ORG-2: 创建/编辑岗位 — 归属部门+关联角色+汇报线+编制+结构化职责
US-ORG-3: 职责重叠检测 — 自动检测两个岗位的职责冲突
US-ORG-4: HR系统同步 — 配置数据源后一键同步部门和岗位
US-ORG-5: 定时同步 — 配置同步频率后系统自动按计划同步
US-ORG-6: 同步冲突处理 — 冲突列表可逐条或批量处理
US-ORG-7: 岗位职责委托 — 支持请假/离职场景的职责委托链
US-ORG-3: 岗位角色关联 — Position.roleIds 多选 GovernanceRole
US-ORG-4: EPC 引用组织 — OrgUnit 节点引用 Department/Position
US-ORG-5: Excel 批量导入 — 模板新增「部门」和「岗位」Sheet

8.6 双向校验(新增)

| 编号 | 规则 | 级别 |
|------|------|------|
| VM-O01 | 聚合根实体关联部门至少 1 个 | warning |
| VM-O02 | 部门树无环路 | error |
| VM-O03 | 活跃岗位必须有部门归属 | error |
| VM-O04 | 岗位引用的 Role 必须存在 | error |
| VM-O05 | 组织变更需 EPC 确认 | warning |
