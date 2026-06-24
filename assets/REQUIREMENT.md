快速实现MVP版本的本体模型建模工具，聚焦核心功能，确保业务价值的同时降低实现复杂度。
本体模型工具 MVP 实现路线图
Ontology Modeling Tool - MVP Implementation Roadmap
版本：基于实际业务场景优化
日期：2026-03-30
状态：聚焦核心功能，快速交付
一、架构演进总览
1.1 核心架构
┌─────────────────────────────────────────────────────────────────────────┐
│                           核心架构全景图                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────┐      ┌─────────────────────────────┐  │
│  │      建模工具                │      │      交付加载系统              │  │
│  │   (Ontology Modeling Tool)  │ ────→│   (Delivery System)           │  │
│  │                             │ 导出   │                             │  │
│  │  • 部署：Coze Studio        │──────→│  • 部署：本地运行            │  │
│  │  • 技术：Next.js 16         │ 配置   │  • 技术：简化版前端 + 后端   │  │
│  │  • 功能：四大元模型可视化编辑 │      │  • 功能：基础数据操作         │  │
│  │  • AI：设计时辅助生成        │      │  • AI：基础自然语言查询       │  │
│  │                             │      │                             │  │
│  │  用户：业务架构师/系统设计师  │      │  用户：交付工程师/验证人员      │  │
│  └─────────────────────────────┘      └─────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         桥接机制：配置导出                           │ │
│  │  建模工具"导出"按钮 → 生成配置文件 → 交付加载配置                   │ │
│  │  版本管理：建模工具保存版本 → 交付加载选择版本                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
1.2 数据流转架构
建模期（设计时）                    导出                    交付期（加载）
┌─────────────────┐            ┌─────────────┐            ┌─────────────────┐
│   可视化编辑器    │───────────→│  配置文件    │───────────→│   交付加载系统      │
│                 │   生成     │             │   加载      │                 │
│ • 数据模型定义   │            │ • 模型配置   │            │ • 数据存储       │
│ • 行为模型定义   │            │ • 业务规则   │            │ • 基础API        │
│ • 规则模型定义   │            │ • 状态机配置  │            │ • 前端界面       │
│ • 事件模型定义   │            │ • 版本信息   │            │ • 基础查询       │
└─────────────────┘            └─────────────┘            └─────────────────┘
         │                                                        │
         ↓                                                        ↓
┌─────────────────┐                                        ┌─────────────────┐
│   Zustand状态    │                                        │   配置缓存       │
│   localStorage   │                                        │   交付加载状态     │
└─────────────────┘                                        └─────────────────┘

1.3 术语与命名规范（简化版）

为确保建模工具与交付加载系统语义一致，以下术语作为规范命名。

| 中文术语 | 统一英文标识 |
|------|------|
| 合同头 | `Contract` |
| 合同条款 | `ContractClause` |
| 审批实例 | `ApprovalInstance` |
| 审批任务 | `ApprovalTask` |
| 收付款计划 | `PaymentSchedule` |
| 合同附件 | `ContractAttachment` |
| 变更单/补充协议 | `ContractAmendment` |
| 主数据 | `MasterData` |
| 元数据模板 | `MetadataTemplate` |

执行约束：
1. 新增对象命名使用“统一英文标识”。
2. 对外 API、数据库表名以统一标识为准。

1.4 业务主审结论（合同管理落地版）

本节为“是否可在组织内真实执行”的审查结论，按 `通过 / 需修改 / 待澄清` 输出，并标注风险级别。

| 结论 | 级别 | 主题 | 主审意见 | 最关键的一句话 |
|------|------|------|------|------|
| 通过 | 中 | 四大元模型边界 | 数据/行为/规则/事件作为一级建模边界符合合同管理实践，可作为团队统一建模语言。 | 四大元模型可以用，但必须增加“跨实体流程”执行约束。 |
| 需修改 | 高 | 四大元模型落地方式 | 行为模型当前仍偏单实体状态机，需要明确流程级对象（跨实体协同、事务边界、规则挂载点）。 | 不补流程级建模，审批和收付款联动一定落到代码里临时拼接。 |
| 通过 | 中 | 概念一致性（业务场景/主数据/元数据/聚合根） | 主数据与元数据模板区分已基本清晰，聚合根概念可用。 | 主数据是业务记录，元数据模板是字段标准，这条边界必须长期坚持。 |
| 需修改 | 中 | 聚合根治理策略 | 需明确合同域默认聚合根白名单（如 `Contract`）与例外审批机制，避免团队各自定义。 | 聚合根不统一，后续事件、权限、审计全部会分叉。 |
| 通过 | 中 | 双系统链路（建模 -> 导出/发布 -> 交付加载） | 双系统分工符合组织协作：架构/治理在建模侧，运营操作在交付加载侧。 | 这条链路是可交付的，但要以“版本快照可追溯”为前提。 |
| 需修改 | 高 | 可交付性（版本演进） | 必须补充模型演进与数据迁移策略（兼容变更、破坏性变更、回滚方式），否则只适合演示。 | 没有迁移策略，版本管理只是展示功能，不是生产能力。 |
| 需修改 | 高 | 合规与审计 | AI 写操作、状态变更、规则拦截、自愈重试需强制审计留痕并可追责。 | 合同系统里“能改”不重要，“谁改了什么并可追责”才重要。 |
| 待澄清 | 中 | 交付加载技术栈口径 | 文档中存在“最小MVP交付加载”和“生成完整前后端包”两种叙述，需要统一一期范围。 | 一期到底是“配置加载型方案”还是“代码生成型方案”，必须二选一。 |
| 待澄清 | 中 | AI能力边界 | 需明确一期 AI 是“只读查询优先”还是“可写操作默认开启”，并给出开关策略。 | AI写操作默认开启会放大合规风险，建议默认只读、按场景放开。 |

执行要求：
1. 标记为“需修改（高）”项，未关闭前不得进入“生产可用”验收。
2. 标记为“待澄清”项，必须在 M1 结束前形成书面决议并更新本文件。
3. 所有主审结论必须映射到可验收条目（接口、日志、迁移脚本或发布流程）。
二、系统A：建模工具（核心功能）
2.1 核心功能
| 模块      | 功能             | 状态   |
| ------- | -------------- | ---- |
| 领域建模    | 8大行业领域选择       | ✅ 保持 |
| 项目管理    | 创建/编辑/删除项目分组   | ✅ 保持 |
| 业务场景管理    | 创建/编辑/删除+分组（用于实体分类管理，明确业务边界）   | 新增 |
| 实体管理    | CRUD+分组 + 聚合角色标记（聚合根 / 聚合内子实体）+ 父聚合关联 | ✅ 增强 |
| 四大元模型编辑 | 数据/行为/规则/事件 | ✅ 保持 |
| 主数据管理   | 核心业务实体记录（按领域分类）+CRUD+状态管理（确保业务数据的唯一性和稳定性）   | 新增 |
| 元数据管理   | 字段模板定义+CRUD（定义标准字段属性，确保数据结构一致性）   | ✅ 保持 |
| AI辅助生成  | 豆包大模型生成建议（优先匹配元数据模板确保数据标准一致性，参考主数据记录确保业务相关性）      | ✅ 保持 |
| Excel导入   | 模板下载+文件上传+数据校验+解析为模型对象+生成待审核版本+审核流程 | 新增 |
| EPC全域关联   | 链路建模+模型关联+流程图渲染+双向校验(71条规则: VE×17+VM×39+VX×15) | 新增 |
| 组织体系建模   | 部门树+结构化岗位职责+HR系统定时同步+EPC引用 | 新增 |
| Entity Lifecycle | State/Transition/Action增强+聚合视图+审计追溯+15条校验规则 | 新增 |
| Agent Semantic Layer | 意图映射+槽位填充+对话上下文+语义关系+术语词典+错误恢复+Agent策略 | 新增 |
| 参考文档上传 | Word/PDF/Excel/TXT/MD/CSV上传+自动解析+AI注入+实体提取 | 新增 |
| 手册导出    | Markdown格式     | ✅ 保持 |

2.1.1 实体聚合角色建模规范

为统一各领域、各项目下的实体建模边界，所有实体在创建时必须明确其在聚合中的角色。实体角色分为 `aggregate_root`（聚合根）与 `child_entity`（聚合内子实体）。

字段定义建议如下：

```typescript
interface EntityRoleConfig {
  entityRole: 'aggregate_root' | 'child_entity';
  parentAggregateId?: string;
  isAggregateRoot?: boolean; // 兼容已有实现，派生规则：entityRole === 'aggregate_root'
}
```

执行约束：
1. `aggregate_root` 表示独立的一致性边界和业务主对象，可独立维护生命周期。
2. `child_entity` 必须隶属于某个聚合根，不能脱离父聚合长期独立存在。
3. 只有聚合根可以发布领域事件；聚合内子实体不得直接发布领域事件。
4. 当 `entityRole = 'child_entity'` 时，必须填写 `parentAggregateId`；当 `entityRole = 'aggregate_root'` 时，不应填写该字段。
5. 订单头 / 合同头等主业务对象通常建模为聚合根，订单行 / 合同条款等附属对象通常建模为聚合内子实体。

2.2 版本管理功能
2.2.1 版本管理数据结构
// 核心类型定义
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
    events: EventModel;
  };
  createdAt: string;
  status: 'draft' | 'published' | 'pending_review' | 'rejected';
}

interface ExportConfig {
  includeData: boolean;        // 是否包含示例数据
}
2.2.2 导出流程UI
建模工作台新增"导出"按钮：
┌─────────────────────────────────────────────────────────┐
│  [项目: 合同管理] [保存] [导出▼] [导出手册] [设置]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  点击[导出▼]下拉菜单：                                   │
│  ├── 📦 导出新版本...                                    │
│  ├── 📋 版本历史                                         │
│  └── ⚙️ 导出设置                                         │
│                                                         │
│  点击"导出新版本..."弹出对话框：                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │  导出新版本                                        │  │
│  │  ─────────────────────────────────────────────────│  │
│  │  版本号：  [1.0.0          ]                      │  │
│  │  版本名称：[合同管理系统初始版本]                   │  │
│  │  说明：    [基于离散制造领域...                    │  │
│  │            ]                                       │  │
│  │                                                    │
│  │  导出选项：                                         │
│  │  ☑ 包含示例数据                                     │
│  │                                                    │
│  │        [  取消  ]        [  生成并导出  ]           │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
2.3 配置导出器
2.3.1 生成物结构
生成的配置文件包（zip或目录）：
```text
contract-management-v1.0.0/
├── config.json                 # 模型配置
├── README.md                   # 使用说明
├── data/                       # 数据文件
│   ├── entities.json           # 实体定义
│   ├── state_machines.json     # 状态机配置
│   ├── rules.json              # 业务规则
│   ├── events.json             # 事件定义
│   └── seed_data.json          # 示例数据（可选）
```
2.3.2 核心导出逻辑

采用“元模型标准化 -> 配置文件生成 -> 打包导出”的流水线，确保导出结果稳定、可测试。

```typescript
interface ExportContext {
  projectVersion: ProjectVersion;
  metamodels: Metamodels;
  entities: NormalizedEntity[];
  exportConfig: ExportConfig;
}

interface ExportedFile {
  path: string;
  content: string;
}

interface ConfigPackage {
  files: ExportedFile[];
  manifest: {
    projectId: string;
    version: string;
    generatedAt: string;
    entityCount: number;
  };
}

class ConfigExporter {
  export(projectVersion: ProjectVersion, exportConfig: ExportConfig): ConfigPackage {
    this.validateVersion(projectVersion);

    const context = this.buildContext(projectVersion, exportConfig);
    const files: ExportedFile[] = [
      ...this.generateRootFiles(context),
      ...this.generateDataFiles(context)
    ];

    return {
      files,
      manifest: {
        projectId: projectVersion.projectId,
        version: projectVersion.version,
        generatedAt: new Date().toISOString(),
        entityCount: context.entities.length
      }
    };
  }

  private buildContext(
    projectVersion: ProjectVersion,
    exportConfig: ExportConfig
  ): ExportContext {
    const metamodels = this.normalizeMetamodels(projectVersion.metamodels);
    const entities = metamodels.data.entities.map(entity => this.normalizeEntity(entity, metamodels));

    return {
      projectVersion,
      metamodels,
      entities,
      exportConfig
    };
  }

  private generateRootFiles(context: ExportContext): ExportedFile[] {
    return [
      {
        path: 'config.json',
        content: JSON.stringify({
          project: context.projectVersion.name,
          version: context.projectVersion.version,
          description: context.projectVersion.description,
          generatedAt: new Date().toISOString()
        }, null, 2)
      },
      {
        path: 'README.md',
        content: `# ${context.projectVersion.name} - v${context.projectVersion.version}\n\n${context.projectVersion.description}\n\n## 使用说明\n1. 解压配置包\n2. 在交付加载系统中加载配置\n3. 开始使用`
      }
    ];
  }

  private generateDataFiles(context: ExportContext): ExportedFile[] {
    const files = [
      {
        path: 'data/entities.json',
        content: JSON.stringify(context.entities, null, 2)
      },
      {
        path: 'data/state_machines.json',
        content: JSON.stringify(context.metamodels.behavior.stateMachines, null, 2)
      },
      {
        path: 'data/rules.json',
        content: JSON.stringify(context.metamodels.rules.rules, null, 2)
      },
      {
        path: 'data/events.json',
        content: JSON.stringify(context.metamodels.events.events, null, 2)
      }
    ];

    if (context.exportConfig.includeData) {
      files.push({
        path: 'data/seed_data.json',
        content: JSON.stringify(this.generateSeedData(context.entities), null, 2)
      });
    }

    return files;
  }

  private validateVersion(projectVersion: ProjectVersion): void {
    if (!projectVersion.version) {
      throw new Error('导出失败：缺少版本号');
    }

    if (!projectVersion.metamodels?.data?.entities?.length) {
      throw new Error('导出失败：数据模型为空，无法生成配置包');
    }
  }
}
```

关键约束如下：

1. 导出器输入必须是已冻结的 ProjectVersion，确保导出结果可追溯。
2. 导出前必须先做元模型标准化，包括实体名、字段名、类型映射、关系方向等校验。
3. 导出结果必须带 manifest 信息，用于版本切换、交付加载和问题追踪。
4. 示例数据是否生成由 includeData 控制。

推荐导出顺序：

1. 校验版本快照完整性。
2. 标准化四大元模型并建立实体索引。
3. 生成根目录配置文件。
4. 生成数据文件。
5. 打包为 zip 或目录，并写入导出记录。

2.4 流程建模（简化版）

在MVP版本中，我们聚焦于单实体状态机建模，通过实体间的关系和事件来表达基本的业务流程：

- 利用实体关系表达流程关联：通过实体间的关系（如合同头与审批实例的关系）来表达流程中的数据关联
- 利用事件模型表达流程触发：通过事件模型来表达状态变更时的通知和触发
- 利用规则模型表达流程约束：通过规则模型来表达流程中的业务约束

这种简化的方式能够满足基本的业务流程需求，同时降低实现复杂度。
三、系统B：交付加载系统（简化版）
3.1 技术栈确认
| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端 | React | 18+ | 轻量构建 |
| 前端UI | 基础组件库 | - | 简化版界面 |
| 后端 | 轻量后端 | - | 基础API服务 |
| 数据库 | 本地存储 | - | 简化数据存储 |
| AI | 基础查询 | - | 简单自然语言查询 |
3.2 基础布局实现
```typescript
// BasicLayout.tsx
const BasicLayout: React.FC = () => {
  const { currentView } = useDeliveryStore();

  return (
    <div className="delivery-layout">
      {/* 顶部导航 */}
      <Header>
        <h1>交付加载系统</h1>
        <VersionSelector />
      </Header>

      {/* 主内容区 */}
      <Main>
        {/* 数据视图 */}
        <DataView view={currentView} />
        {/* 当前视图：list/form/flowchart/... */}
      </Main>

      {/* 底部信息 */}
      <Footer>
        <p>版本：{currentVersion}</p>
      </Footer>
    </div>
  );
};
```
3.3 基础自然语言查询实现
```python
# ai/basic_query.py
class BasicQueryService:
    def __init__(self, metamodels: Metamodels):
        self.metamodels = metamodels
        
    async def execute(self, user_input: str) -> QueryResponse:
        # 1. 简单意图识别
        intent = self._analyze_intent(user_input)
        
        # 2. 生成基础查询
        query = self._generate_query(intent)
        
        # 3. 执行查询
        try:
            results = await self._execute_query(query)
            return QueryResponse(
                message="查询成功",
                results=results,
                query=query
            )
        except Exception as e:
            return QueryResponse(
                message=f"查询失败：{str(e)}",
                results=[],
                query=query
            )
    
    def _analyze_intent(self, user_input: str) -> str:
        # 简单意图识别
        if "列表" in user_input or "查询" in user_input:
            return "list"
        elif "统计" in user_input or "分析" in user_input:
            return "analyze"
        else:
            return "unknown"
    
    def _generate_query(self, intent: str) -> str:
        # 根据意图生成基础查询
        if intent == "list":
            return "SELECT * FROM entities LIMIT 10"
        elif intent == "analyze":
            return "SELECT COUNT(*) FROM entities"
        else:
            return "SELECT * FROM entities LIMIT 5"
    
    async def _execute_query(self, query: str) -> list:
        # 执行查询并返回结果
        # 这里使用简化的查询执行逻辑
        return ["示例结果"]
```
3.4 基础数据视图实现
    ```typescript
// DataView.tsx - 支持基础视图
const DataView: React.FC<{ view: ViewType }> = ({ view }) => {
  switch (view.type) {
    case 'list':
      return <EntityList entityType={view.entityType} />;
    case 'form':
      return <EntityForm entity={view.entity} mode={view.mode} />;
    case 'flowchart':
      // 默认视图：行为模型状态流转图
      return <FlowchartView stateMachine={view.stateMachine} />;
    default:
      return <EntityList entityType="default" />;
  }
};
```
四、版本管理与导出机制
4.1 版本管理流程
```text
建模工具（Coze Studio）                    交付加载系统
┌─────────────────┐                        ┌─────────────────┐
│   设计时编辑     │                        │   交付加载操作     │
│                 │                        │                 │
│  v1.0.0（草稿）  │─────[导出]────────────→│  加载配置运行   │
│    ↓ 修改       │   生成配置包            │    v1.0.0      │
│  v1.0.1（草稿）  │                        │                 │
│    ↓ 导出       │─────[导出]────────────→│  加载新版本     │
│  v1.0.1（已导出）│                        │    v1.0.1      │
└─────────────────┘                        └─────────────────┘
```
4.2 交付加载版本选择
```text
交付加载系统顶部版本选择：
┌─────────────────────────────────────────────────────────┐
│  [系统名称]  [当前实体: 合同]    版本: [v1.0.1 ▼]        │
│                                         ↑              │
│                              点击选择版本：              │
│                              ├── v1.0.1 (当前) ✓        │
│                              └── v1.0.0                 │
└─────────────────────────────────────────────────────────┘
```
4.3 模型演进策略

在MVP版本中，我们采用简化的模型演进策略：

- 版本与配置的对应关系
  - 每一个导出版本对应一个独立的配置包
  - 交付加载通过不同的配置包来切换版本
  - 数据存储采用简化方式，确保基本的数据隔离

- 支持的模型变更类型
  - 支持的变更包括：
    - 在实体上新增字段
    - 新增实体和关系
  - 对于破坏性变更，建议：
    - 通过新版本导出获得全新的配置
    - 手动处理数据迁移

- 合同域特别提醒
  - 对于合同、收/付款计划、审批记录等关键实体，建议减少高频变更
  - 当确需进行结构性调整时，应单独规划数据迁移策略
五、实施里程碑
5.1 里程碑规划（8-12周）
| 阶段 | 周期 | 目标 | 交付物 |
|------|------|------|--------|
| M1 | Week 1-3 | 建模工具核心功能 | 四大元模型编辑、版本管理、导出功能 |
| M2 | Week 4-6 | 配置导出器 | 配置文件生成、打包导出 |
| M3 | Week 7-9 | 交付加载系统 | 基础界面、数据操作、简单查询 |
| M4 | Week 10-12 | 集成测试 | 端到端测试、文档、部署优化 |
5.2 验收标准
| 场景 | 验收标准 |
|------|----------|
| 配置导出 | 建模工具点击“导出”后生成配置包，交付加载可加载配置并启动 |
| 基础数据操作 | 交付加载可进行基本的实体增删改查操作 |
| 简单自然语言查询 | 在交付加载中输入“查询合同列表”后，返回基本的合同数据 |
| 版本切换 | 交付加载可选择不同版本的配置并加载 |
5.3 里程碑 Exit Criteria（可验收口径）
| 里程碑 | Entry Criteria（进入条件） | Exit Criteria（退出条件） | 验收方式 |
|------|------|------|------|
| M1 建模工具核心功能 | 领域、项目、实体基础页面可访问 | 至少完成 1 个合同域项目建模，包含 5 类核心实体（Contract/ContractClause/ApprovalInstance/PaymentSchedule/ContractAttachment）；四大元模型可保存并回读一致 | 功能验收 + 数据回读比对 |
| M2 配置导出器 | M1 通过且 `ProjectVersion` 可冻结 | `POST /api/export` 成功返回；导出包包含 `config.json`、`manifest.json`、`data/*.json`；`includeData=false` 时不生成 `seed_data.json` | 接口测试 + 文件结构校验 + Schema 校验 |
| M3 交付加载系统 | M2 导出包可生成并可解压 | 交付加载可加载导出包并完成 1 次 CRUD + 1 次自然语言查询；查询 P95 响应时间 <= 2s（本地单用户） | E2E 测试 + 性能采样 |
| M4 集成测试 | M1-M3 全部通过 | 关键场景测试通过率 >= 95%；阻断级缺陷为 0；输出测试报告和回归清单 | 自动化回归 + 人工抽检 |

5.4 关键场景测试用例（Gherkin）

```gherkin
Feature: 配置导出
  Scenario: 导出成功并生成完整配置包
    Given 已冻结的项目版本 "v1.0.0" 且包含至少一个实体
    When 调用 POST /api/export 且 includeData=true
    Then 返回 200 且包含 downloadUrl
    And 配置包中包含 config.json、manifest.json、data/entities.json、data/state_machines.json、data/rules.json、data/events.json、data/seed_data.json
```

```gherkin
Feature: 自然语言查询
  Scenario: 查询合同列表成功
    Given 交付加载已加载版本 "v1.0.0" 且存在 Contract 数据
    When 提交查询 "查询合同列表"
    Then 返回 message="查询成功"
    And results 为数组且长度 > 0
    And 返回结果中的实体类型包含 "Contract"
```

```gherkin
Feature: 版本切换
  Scenario: 在交付加载切换版本
    Given 交付加载已加载版本 "v1.0.0" 且可用版本包含 "v1.0.1"
    When 用户切换到 "v1.0.1"
    Then 当前版本显示为 "v1.0.1"
    And 数据视图按 v1.0.1 的实体结构渲染
```

```gherkin
Feature: 自愈机制（待二期）
  Scenario: 查询失败后自动修正
    Given 交付加载启用自愈开关 selfHealingEnabled=true
    When 查询因字段名错误失败
    Then 系统最多重试 2 次
    And 记录 healingLog（错误信息、修正动作、最终结果）
```

说明：
- 自愈机制在当前 MVP 为“待二期实现”，该用例先作为预置验收模板，不计入 M1-M4 阻断项。
- 若一期要提前启用自愈机制，需先补充 API 返回结构中的 `healingLog` 字段定义与错误码规范。
六、技术风险与缓解
| 风险 | 可能性 | 影响 | 缓解策略 |
|------|--------|------|----------|
| 配置文件大小限制 | 低 | 中 | 分模块导出，按需加载 |
| 交付加载响应延迟 | 低 | 中 | 优化配置加载，简化数据处理 |
| 数据存储性能 | 低 | 中 | 文档明确用户限制，后续可扩展 |
| 版本兼容性 | 中 | 中 | 版本号语义化，重大变更升级主版本 |
七、基础审计功能

在MVP版本中，我们提供基础的审计功能，满足基本的合规要求：

- 操作记录
  - 记录基本的操作信息：
    - 操作时间
    - 操作类型
    - 操作对象

- 技术实现
  - 简化的审计日志记录
  - 重点操作的基本留痕

- 合同域重点对象
  - 对关键实体的变更进行基本记录：
    - Contract（合同头）
    - PaymentSchedule（收付款计划）

这种简化的审计功能能够满足基本的合规要求，同时降低实现复杂度。

八、附录：核心接口定义
8.1 建模工具→交付加载API
```typescript
// 导出接口
POST /api/export
Body: {
  projectId: string;
  version: string;
  name: string;
  description: string;
  metamodels: Metamodels;
  config: ExportConfig;
}
Response: {
  downloadUrl: string;  // 配置包下载链接
}

// 版本列表
GET /api/versions?projectId=xxx
Response: ProjectVersion[]
```
8.2 交付加载查询API
```typescript
// 基础查询接口
POST /api/query
Body: {
  userInput: string;
}
Response: {
  message: string;
  results: any[];
}
```

九、附录：开发启动建议

本节作为实施附录，提供开发启动时的环境准备、建议目录以及第一周的落地顺序。其目的在于帮助实现团队从规格文档平滑进入编码阶段，不作为业务需求本体的一部分。

9.1 环境准备

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Node.js 18+ | ☐ | Next.js 16 运行所需 |
| pnpm | ☐ | 建模工具统一包管理器 |
| Coze CLI | ☐ | 建模工具本地调试需要 |
| Docker Desktop | ☐ | 交付加载容器测试需要 |
| Python 3.11+ | ☐ | Flask 交付加载需要 |

9.2 建议仓库结构

```text
ontology-project/
├── ontology-modeling/          # 系统A：建模工具
│   ├── src/
│   ├── package.json
│   └── README.md
├── ontology-delivery/           # 系统B：交付加载
│   ├── backend/
│   ├── frontend/
│   └── docker-compose.yml
├── docs/
│   ├── 术语映射对照表.md
│   └── 规格说明书.md
└── README.md
```

9.3 第一周开发任务（M1 Week 1）

### Day 1-2：基础设置

1. 验证建模工具本地可运行。
2. 创建交付加载体系目录。
3. 初始化 Flask 后端基础骨架。
4. 初始化 React + Vite 前端基础骨架。

建议命令如下：

```bash
# 验证建模工具
cd ontology-modeling
pnpm install
coze dev

# 初始化交付加载目录
mkdir -p ontology-delivery
cd ontology-delivery
mkdir -p backend frontend database
```

### Day 3-4：核心类型定义

1. 在建模工具侧补充 `ProjectVersion` 与 `PublishConfig`。
2. 明确实体需标记聚合角色（`aggregate_root` / `child_entity`），并确保只有聚合根可以发布领域事件。
3. 在交付加载侧建立 `Metamodels`、`AIRequest`、`AIResponse` 等基础类型。

建模工具侧的关键类型方向如下：

```typescript
export interface Entity {
  id: string;
  projectId?: string;
  name: string;
  nameEn: string;
  description: string;
  entityRole: 'aggregate_root' | 'child_entity';
  parentAggregateId?: string;
  isAggregateRoot?: boolean; // 兼容字段，建议由 entityRole 派生
  attributes: Attribute[];
  relations: Relation[];
  dataModel?: DataModel;
  behaviorModel?: BehaviorModel;
  ruleModel?: RuleModel;
  eventModel?: EventModel; // 仅允许聚合根配置领域事件
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;
  name: string;
  description: string;
  metamodels: {
    data: DataModel;
    behavior: BehaviorModel;
    rules: RuleModel;
    events: EventModel;
  };
  createdAt: string;
  publishedAt?: string;
  status: 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';
}
```

### Day 5：版本管理 UI

1. 增加 `version-manager.tsx` 组件。
2. 支持创建版本、查看版本列表、触发发布。
3. 允许“发布”先接占位逻辑，再逐步对接代码生成器。

9.4 已确认技术决策

| 决策项 | 确认结果 | 说明 |
|--------|----------|------|
| 交付加载数据库 | SQLite | 单文件、零配置，适合作为 MVP 默认方案，并预留迁移 PostgreSQL 的路径 |
| 交付加载 AI SDK | 豆包（Coze） | 与建模工具保持一致，减少模型接入差异 |
| 前端状态管理 | Zustand | 与建模工具技术栈一致，轻量且易维护 |
| 实施节奏 | 按 M1-M6 里程碑推进 | 先完成版本发布与代码生成基础，再逐步补足交付加载能力 |

9.5 Week 1 验收标准

| 任务 | 验收标准 |
|------|----------|
| 环境搭建 | `coze dev` 可启动建模工具，`docker-compose up` 可启动交付加载空壳 |
| 类型更新 | 实体创建时必须标记 `entityRole`（`aggregate_root` / `child_entity`）；当选择子实体时必须指定 `parentAggregateId`；仅聚合根可发布领域事件 |
| 版本管理UI | 可创建版本、查看列表、打开发布对话框 |
| 项目结构 | 前后端目录清晰，类型定义完整 |
| 数据库 | SQLite 目录和配置正确 |

9.6 M1 必须关闭项清单（Owner / 验收证据 / 测试方法）

本节列出在 M1 结束前必须关闭的高优先级问题，对应 1.4 业务主审结论中的“需修改（高）”与关键“待澄清”项。

| 序号 | 项目 | Owner（角色） | 验收证据 | 测试方法 |
|------|------|---------------|----------|----------|
| M1-01 | 流程级建模方案（跨实体业务流程） | 业务架构师 + 领域专家 | `ProcessDefinition` 元模型设计文档（含示例：合同签订流程、收款执行流程），并在建模工具中至少完成 1 个合同域流程建模样例 | 在建模工具中配置“采购合同签订流程”，验证可生成包含跨实体联动（Contract + PaymentSchedule + ApprovalInstance）的配置，并由交付加载正确解释执行一条端到端流程（拟定->审批->生成计划） |
| M1-02 | 模型演进与数据迁移策略（MVP） | 业务架构师 + 数据架构师 | 更新后的 4.3 小节内容，以及一份针对“新增字段 / 删除字段 / 实体拆分”的迁移示例说明 | 为同一合同模型创建 v1.0.0 与 v1.1.0 两个版本，模拟“新增字段”和“删除字段”场景，验证：新增字段场景无须手工脚本即可平滑运行；破坏性变更场景至少有明确迁移脚本模板或“新库 + 迁移”的操作指引 |
| M1-03 | 交付加载审计与操作留痕设计 | 业务架构师 + 技术负责人 | `audit` 模块设计说明（字段列表、触发点、存储方式）以及在生成代码骨架中出现的统一审计调用接口 | 启动交付加载 Demo，执行 1 次自然语言查询（只读）和 1 次状态变更（写操作），验证审计表或日志中至少记录：用户、时间、原始输入、执行动作摘要、自愈重试信息（如有） |
| M1-04 | 一期交付加载范围决议（配置加载 vs 代码生成） | 产品负责人 + 技术负责人 | 一页内的书面决议，明确：MVP 一期选择“配置加载型方案”或“代码生成型方案”，并在“一、架构演进总览”中同步更新表述 | 按决议方式实际启动一次交付加载环境（配置加载或代码包生成），在评审会中逐步走通“从建模到运行”的完整路径，确认各干系人对启动路径、变更流程及责任边界无歧义（以会议纪要为准） |
| M1-05 | AI 能力边界与默认策略 | 产品负责人 + 合规负责人 | 《AI 能力使用策略》简表：列出“查询类 / 写操作类 / 管理类”三类场景，并给出“默认开启 / 默认关闭 / 需审批开启”的策略，同时在交付加载代码或配置中体现对应开关 | 在交付加载中模拟三类场景：1）查询合同列表；2）修改合同状态；3）批量调整收付款计划，验证：查询类请求不会修改数据且仅记录访问日志；写操作类请求只有在配置明确开启时才允许执行并写全量审计；被策略禁止的场景返回明确的“策略限制”提示 |

9.7 下一步

完成 Week 1 后，进入 Week 2，优先实现代码生成器基础能力，包括 SQLite DDL 生成与 Flask 模型生成。

六、Excel 导入与版本审核

6.1 功能概述

支持通过 Excel 文件批量导入本体模型数据，生成待审核版本，审核通过后应用到工作区。适用于项目初始化、跨团队协作和批量数据迁移场景。

6.2 User Stories

US-1: 下载 Excel 导入模板

- 角色：业务架构师 / 系统设计师
- 需求：下载标准 .xlsx 模板，包含 8 个数据 Sheet（实体/属性/关系/状态机/规则/事件/部门/岗位）和 1 个填写说明 Sheet
- 验收标准：
  - GET /api/excel-template 返回 application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - 每个 Sheet 包含表头行（含"(必填)"标记）、描述行和示例行
  - 描述行和示例行在校验时自动跳过（以 #DESC# / #EXAMPLE# 开头或与描述/示例关键词匹配）

US-2: 上传 Excel 文件与格式校验

- 角色：业务架构师 / 系统设计师
- 需求：上传 .xlsx 文件，系统自动校验格式、大小和 Sheet 结构
- 验收标准：
  - POST /api/excel-import 仅接受 .xlsx 格式，5MB 上限
  - 缺少必需 Sheet（实体/属性/关系/状态机/规则/事件）时返回具体错误
  - 非 .xlsx 文件或超限文件返回 400 错误

US-3: Excel 数据解析与校验

- 角色：业务架构师 / 系统设计师
- 需求：逐行校验和解析 Excel 数据，返回行级校验结果和解析后的模型对象
- 验收标准：
  - 必填字段缺失 → missing_required 错误
  - 枚举值不在允许范围 → invalid_enum 错误
  - 布尔字段非 true/false → invalid_type 错误
  - 跨 Sheet 引用不存在（如属性引用的实体不存在）→ ref_not_found 错误
  - 校验通过的数据行被解析为 Entity/Attribute/Relation/StateMachine/Rule/EventDefinition 模型对象
  - 返回 parsedData 包含 6 种模型数组

US-4: 生成待审核版本

- 角色：业务架构师 / 系统设计师
- 需求：基于解析数据生成 pending_review 状态版本，版本号自动递增
- 验收标准：
  - 版本状态为 pending_review
  - 版本内容来自 parsedData（非当前工作区快照）
  - 版本号格式为 vYYYY-MM-DD，同日自动追加序号
  - 返回 versionId 和 versionName

US-5: 版本审核流程

- 角色：技术负责人 / 交付工程师
- 需求：审核待审核版本，通过则应用到工作区，驳回需填写原因
- 验收标准：
  - approveVersion：将版本 parsedData 替换当前工作区数据，版本状态变为 published
  - rejectVersion：填写驳回原因，版本状态变为 rejected
  - 发布对话框中 pending_review 版本显示审核按钮
  - rejected 版本显示驳回原因

6.3 Excel 模板 Sheet 结构

| Sheet | 必填字段 | 说明 |
|-------|---------|------|
| 实体 | 实体名称、英文名称 | 支持聚合根/子实体角色 |
| 属性 | 实体英文名称、属性名称、英文名称、数据类型 | 9 种数据类型，支持引用和枚举 |
| 关系 | 源实体英文名称、关系名称、关系类型、目标实体英文名称 | one_to_one/one_to_many/many_to_many |
| 状态机 | 实体英文名称、状态机名称、状态名称 | 支持初始/终止状态和转换定义 |
| 规则 | 实体英文名称、规则名称、规则类型、错误消息 | 5 种规则类型 |
| 事件 | 实体英文名称、事件名称、触发时机 | 支持 create/update/delete/status_change/custom |

6.4 版本状态流转

```text
draft → published → archived
              ↑
pending_review → published (审核通过)
pending_review → rejected  (审核驳回)
```

七、EPC 全域关联层

7.1 功能概述

EPC 从只读文档升级为全域关联层，是串联 10 大模型+组织模型的复合关联视图。详见 `docs/EPC-Upgrade-Spec.md` v3.0。

7.2 核心数据结构

- EpcChain：链路（节点+边），关联聚合根实体
- EpcNode：5 种类型(event/function/connector/infoObject/orgUnit)，每节点通过 refs 引用多模型元素
- EpcEdge：节点间连线，支持条件分支
- EpcModelRef：统一关联接口，modelType×refRole 标明引用的模型和角色

7.3 全域关联矩阵

| EPC 节点 | 可关联的模型 |
|---------|----------|
| Event | 事件定义+触发实体+状态转换+触发规则+订阅+权限角色+指标+数据源+主数据+元数据+处理岗位 |
| Function | 动作/转换+输入输出实体+前后置规则+产生事件+流程步骤+执行角色+指标+数据源+主数据+元数据+责任岗位 |
| Connector | 分支规则+角色权限 |
| InfoObject | 实体/属性+校验规则+变更事件+字段权限+质量指标+数据源+主数据+元数据 |
| OrgUnit | 治理角色+权限+行为约束+部门+岗位 |

7.4 双向校验体系（40+规则）

| 方向 | 编号前缀 | 规则数 | 核心问题 |
|------|---------|--------|---------|
| EPC → 模型 | VE | 14 | EPC 引用的模型元素是否真实有效、一致、合法？ |
| 模型 → EPC | VM | 25 | 模型定义的元素是否被 EPC 覆盖？(8 大模型+组织) |
| 交叉一致性 | VX | 10 | EPC 关联声明与模型内部定义是否矛盾？ |

7.5 User Stories

US-EPC-1: 创建/编辑 EPC 链路
- 角色：业务架构师
- 需求：在聚合根实体下创建链路，添加节点和边
- 验收：EpcChain CRUD 完整，节点可拖拽排列

US-EPC-2: 全域关联选择器
- 角色：业务架构师
- 需求：节点关联时展示所有模型可选元素，按 modelType 分组
- 验收：选择器展示 10 大模型+组织的可选元素列表

US-EPC-3: 推导生成
- 角色：业务架构师
- 需求：从已有模型自动推导 EPC 链路骨架
- 验收：10 步推导算法执行后生成包含 Event/Function/Connector/InfoObject/OrgUnit 的链路

US-EPC-4: 全域关联视图
- 角色：业务架构师
- 需求：以节点为中心展示所有关联的模型元素
- 验收：点击节点显示关联面板，按模型类型分组展示

US-EPC-5: 反向引用
- 角色：业务架构师
- 需求：各模型编辑器显示"出现在哪些 EPC 中"
- 验收：Action/Event/Rule 等编辑器中显示 EPC 覆盖 Badge

US-EPC-6: 流程图渲染
- 角色：业务架构师
- 需求：@xyflow/react 自定义 5 种节点形状渲染流程图
- 验收：Event(六边形)、Function(圆角矩形)、Connector(菱形)、InfoObject(矩形)、OrgUnit(椭圆)

US-EPC-7: 关联图谱
- 角色：业务架构师
- 需求：全局视图展示所有 EPC 链路的关联网络
- 验收：可视化展示链路间共享的模型元素

US-EPC-8: EPC→模型校验
- 角色：交付工程师
- 需求：VE-01~14 规则校验 EPC 引用的模型元素
- 验收：引用不存在/不一致/非法均报错

US-EPC-9: 模型→EPC 校验
- 角色：交付工程师
- 需求：VM-D/B/R/E/P/G/M/S/O 规则(25 条)校验模型覆盖率
- 验收：未被 EPC 覆盖的模型元素报 warning

US-EPC-10: 交叉一致性校验
- 角色：交付工程师
- 需求：VX-01~10 规则校验 EPC 关联与模型定义一致性
- 验收：EPC 声明与模型内部定义矛盾时报 error

7.6 技术选型

@xyflow/react — 流程图渲染，自定义节点组件

八、组织体系与岗位模型

8.1 功能概述

新增 OrganizationModel 为一级模型，包含 Department(树形部门结构) + Position(岗位定义) + HR同步能力。详见 `docs/Organization-Position-Spec.md`。

8.2 核心数据结构

- Department：5 种类型(集团/事业部/部门/团队/班组)，parentId 构建组织树，含 HR 同步字段(syncSource/syncExternalId/syncUpdatedAt)
- Position：归属部门(departmentId)，关联治理角色(roleIds → GovernanceRole)，含汇报线/编制/任职要求
- PositionResponsibility：结构化职责(scope+actions+decisionAuthority+delegateToPositionIds)
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

8.4 HR 系统同步

- 支持 6 种 HR 数据源：飞书/钉钉/企微/SAP/Workday/自定义API
- 同步频率：实时(Webhook)/每小时/每天/每周/手动
- 字段映射：HRFieldMapping 定义 HR 字段 → 本体模型字段路径
- 冲突策略：HR优先/本地优先/合并/人工审核
- 差异比对：3-way diff，自动识别新增/更新/停用
- 安全：API凭证存后端环境变量，同步日志脱敏

8.5 User Stories

US-ORG-1: 创建/编辑部门树
- 角色：业务架构师
- 需求：树形结构 CRUD，支持 5 种部门类型
- 验收：部门树渲染正确，支持展开/折叠/拖拽排序

US-ORG-2: 创建/编辑岗位
- 角色：业务架构师
- 需求：归属部门+关联角色+汇报线+编制+结构化职责
- 验收：岗位 CRUD 完整，responsibilities 可结构化编辑

US-ORG-3: 职责重叠检测
- 角色：业务架构师
- 需求：自动检测两个岗位的职责冲突
- 验收：scopeRefs+actions 交集非空时告警

US-ORG-4: HR系统同步
- 角色：管理员
- 需求：配置数据源后一键同步部门和岗位
- 验收：同步结果含变更统计+冲突列表

US-ORG-5: 定时同步
- 角色：管理员
- 需求：配置同步频率后系统自动按计划同步
- 验收：按配置频率自动执行，生成同步历史

US-ORG-6: 同步冲突处理
- 角色：管理员
- 需求：冲突列表可逐条或批量处理
- 验收：4种冲突策略可选，处理后更新本地数据

US-ORG-7: 岗位职责委托
- 角色：业务架构师
- 需求：支持请假/离职场景的职责委托链
- 验收：delegateToPositionIds 无环路，委托链可追溯

8.6 双向校验(新增)

| 编号 | 规则 | 级别 |
|------|------|------|
| VM-O01 | 聚合根实体关联部门至少 1 个 | warning |
| VM-O02 | 部门树无环路 | error |
| VM-O03 | 活跃岗位必须有部门归属 | error |
| VM-O04 | 岗位引用的 Role 必须存在 | error |
| VM-O05 | 组织变更需 EPC 确认 | warning |
| VM-O06 | 岗位职责无重叠冲突 | warning |
| VM-O07 | 职责中的 actions 必须存在 | warning |
| VM-O08 | 委托链无环路 | info |
| VM-HR01 | syncExternalId 引用 HR 侧记录存在 | error |
| VM-HR02 | 同步时效告警 | warning |
| VM-HR03 | 孤儿记录标记停用 | warning |
| VM-HR04 | 同步配置完整性 | info |

九、Entity Lifecycle（实体生命周期）

9.1 功能概述

将 State 从"标签"升级为"一等公民"，让 Agent 无需跨模型拼凑即可完整理解 Entity 的生命周期。详见 `docs/Entity-Lifecycle-Spec.md`。

9.2 核心增强

- State 增强 7 个字段：entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility
- Transition 增强 4 个字段：guardCondition/compensationAction/sideEffects/auditLog
- Action 增强：aliases/triggerPhrases/successMessage/failureMessage/fallbackActionId/requiresConfirmation
- 新增 EntityLifecycle 聚合视图：actionsByState/rulesByState/eventsByState/rolesByState/auditTrail/stats
- 新增 LifecycleAuditEntry：记录每次状态变更的完整上下文

9.3 User Stories

US-LC-1: State 生命周期增强 — 配置 entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility
US-LC-2: Transition 生命周期增强 — 配置 guardCondition/compensationAction/sideEffects/publishEventId/notifyRoleIds/requiresApproval/auditLog
US-LC-3: Action 语义增强 — 配置 aliases/triggerPhrases/successMessage/failureMessage/fallbackActionId/requiresConfirmation
US-LC-4: EntityLifecycle 聚合视图 — 以 Entity 为中心展示完整生命周期（状态流转图+状态详情+审计记录）
US-LC-5: 生命周期校验 — V-LC-01~15 完整性与一致性校验
US-LC-6: 生命周期审计 — 查看 Entity 的生命周期变更历史
US-LC-7: Agent 语义层导出 — GET /api/entity-lifecycle 返回完整 EntityLifecycle JSON

9.4 校验规则（15 条）

| 编号 | 规则 | 级别 |
|------|------|------|
| V-LC-01 | 非终止状态必须有 outgoing transition | warning |
| V-LC-02 | 非初始状态必须有 incoming transition | warning |
| V-LC-03 | availableActions 引用完整性 | error |
| V-LC-04 | constraints 引用完整性 | error |
| V-LC-05 | allowedRoles 引用完整性 | error |
| V-LC-06 | timeout.targetStateId 有效性 | error |
| V-LC-07 | guardCondition 语法校验 | error |
| V-LC-08 | compensationAction 引用完整性 | error |
| V-LC-09 | dataVisibility 字段有效性 | error |
| V-LC-10 | 孤立状态检测 | warning |
| V-LC-11 | entryActions 引用完整性 | error |
| V-LC-12 | exitActions 引用完整性 | error |
| V-LC-13 | triggerableEvents 引用完整性 | error |
| V-LC-14 | fallbackActionId 引用完整性 | error |
| V-LC-15 | 终止状态不应有 outgoing transition | warning |

十、Agent Semantic Layer（Agent 语义层）

10.1 功能概述

本体模型之上的第 11 个模型，专门解决"AI Agent 如何精准理解企业语义并正确执行任务"的问题。详见 `docs/Agent-Semantic-Layer-Spec.md`。

10.2 核心能力

- Intent（意图映射）：将自然语言短语映射到 Action，含 triggerPhrases/slotFilling/contextConstraints
- SlotFillingStrategy（槽位填充）：定义参数追问顺序、校验规则、默认值、上下文推断
- DialogContext（对话上下文）：维护聚焦实体、最近操作、指代消解
- SemanticRelation（语义关系）：定义 is-a/part-of/synonym-of/causes/depends-on 等 10 种语义关系
- BusinessTerm（业务术语词典）：统一术语定义、同义词、歧义说明、模型引用
- ErrorRecovery（错误恢复）：定义操作失败后的重试/回退/升级/补偿策略
- TemporalValidity（时效性标记）：为模型元素添加生效/失效时间
- SemanticFieldMapping（字段映射）：自动推断跨实体字段等价关系
- AgentPolicy（Agent 策略）：定义 Agent 行为边界（允许/拒绝/确认/升级）

10.3 User Stories

US-AS-1: 意图管理 — 创建和管理 Intent，将自然语言短语映射到 Action
US-AS-2: 槽位填充配置 — 为每个 Intent 配置参数槽位的填充策略
US-AS-3: 语义关系管理 — 定义实体间的语义关系（is-a/part-of/synonym-of 等）
US-AS-4: 业务术语词典 — 维护统一的业务术语词典
US-AS-5: 错误恢复配置 — 为 Action 配置错误恢复策略
US-AS-6: Agent 策略配置 — 定义 Agent 的行为边界
US-AS-7: 跨实体字段映射 — 定义跨实体的字段等价关系
US-AS-8: Agent 语义层导出 — GET /api/agent-semantic-layer 返回完整 JSON
US-AS-9: 语义完备性仪表盘 — 可视化查看语义层的覆盖度

10.4 校验规则（15 条）

| 编号 | 规则 | 级别 |
|------|------|------|
| V-AS-01 | Intent.actionId 引用完整性 | error |
| V-AS-02 | Intent.targetEntityId 引用完整性 | error |
| V-AS-03 | Intent.slotFilling.slots[].paramName 必须在 Action.parameters 中 | error |
| V-AS-04 | Intent.requiredSlots 必须是 slots 的子集 | error |
| V-AS-05 | SemanticRelation 两端实体必须存在 | error |
| V-AS-06 | BusinessTerm.modelRefs 引用完整性 | error |
| V-AS-07 | ErrorRecovery.actionId 引用完整性 | error |
| V-AS-08 | ErrorRecovery.recoveryActionId 引用完整性 | error |
| V-AS-09 | AgentPolicy.roleId 引用完整性 | error |
| V-AS-10 | SemanticFieldMapping 两端字段必须存在 | error |
| V-AS-11 | TemporalValidity.targetId 引用完整性 | error |
| V-AS-12 | TemporalValidity 时间范围合法性 | error |
| V-AS-13 | Intent.triggerPhrases 非空 | warning |
| V-AS-14 | 同一 Action 无 ErrorRecovery | warning |
| V-AS-15 | 同一 Role 无 AgentPolicy | warning |

10.5 Agent 完备性评估

| 维度 | 实施前 | 实施后 | 提升 |
|------|:---:|:---:|:---:|
| 身份识别 | 8 | 9 | +1 |
| 可操作性 | 6 | 9 | +3 |
| 时机判断 | 7 | 9 | +2 |
| 约束感知 | 7 | 8 | +1 |
| 后果预知 | 6 | 8 | +2 |
| 归属认知 | 6 | 8 | +2 |
| 数据溯源 | 5 | 7 | +2 |
| 度量感知 | 5 | 5 | — |
| 关联理解 | 5 | 9 | +4 |
| 意图映射 | 0 | 9 | +9 |
| **总分** | **55** | **81** | **+26** |
