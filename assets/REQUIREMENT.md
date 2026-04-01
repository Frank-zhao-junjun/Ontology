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
│  │      建模工具                │      │      运行时系统              │  │
│  │   (Ontology Modeling Tool)  │ ────→│   (Runtime System)           │  │
│  │                             │ 导出   │                             │  │
│  │  • 部署：Coze Studio        │──────→│  • 部署：本地运行            │  │
│  │  • 技术：Next.js 16         │ 配置   │  • 技术：简化版前端 + 后端   │  │
│  │  • 功能：四大元模型可视化编辑 │      │  • 功能：基础数据操作         │  │
│  │  • AI：设计时辅助生成        │      │  • AI：基础自然语言查询       │  │
│  │                             │      │                             │  │
│  │  用户：业务架构师/系统设计师  │      │  用户：业务操作员/最终用户      │  │
│  └─────────────────────────────┘      └─────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         桥接机制：配置导出                           │ │
│  │  建模工具"导出"按钮 → 生成配置文件 → 运行时加载配置                   │ │
│  │  版本管理：建模工具保存版本 → 运行时选择版本加载                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
1.2 数据流转架构
建模期（设计时）                    导出                    运行期（运行时）
┌─────────────────┐            ┌─────────────┐            ┌─────────────────┐
│   可视化编辑器    │───────────→│  配置文件    │───────────→│   运行时系统      │
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
│   localStorage   │                                        │   运行时状态     │
└─────────────────┘                                        └─────────────────┘

1.3 术语与命名规范（简化版）

为确保建模工具与运行时系统语义一致，以下术语作为规范命名。

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
| 通过 | 中 | 双系统链路（建模 -> 导出/发布 -> 运行时） | 双系统分工符合组织协作：架构/治理在建模侧，运营操作在运行时侧。 | 这条链路是可交付的，但要以“版本快照可追溯”为前提。 |
| 需修改 | 高 | 可交付性（版本演进） | 必须补充模型演进与数据迁移策略（兼容变更、破坏性变更、回滚方式），否则只适合演示。 | 没有迁移策略，版本管理只是展示功能，不是生产能力。 |
| 需修改 | 高 | 合规与审计 | AI 写操作、状态变更、规则拦截、自愈重试需强制审计留痕并可追责。 | 合同系统里“能改”不重要，“谁改了什么并可追责”才重要。 |
| 待澄清 | 中 | 运行时技术栈口径 | 文档中存在“最小MVP运行时”和“生成完整前后端包”两种叙述，需要统一一期范围。 | 一期到底是“配置加载型运行时”还是“代码生成型运行时”，必须二选一。 |
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
  status: 'draft' | 'published';
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
        content: `# ${context.projectVersion.name} - v${context.projectVersion.version}\n\n${context.projectVersion.description}\n\n## 使用说明\n1. 解压配置包\n2. 在运行时系统中加载配置\n3. 开始使用`
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
3. 导出结果必须带 manifest 信息，用于版本切换、运行时加载和问题追踪。
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
三、系统B：运行时系统（简化版）
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
  const { currentView } = useRuntimeStore();

  return (
    <div className="runtime-layout">
      {/* 顶部导航 */}
      <Header>
        <h1>运行时系统</h1>
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
建模工具（Coze Studio）                    运行时系统
┌─────────────────┐                        ┌─────────────────┐
│   设计时编辑     │                        │   运行时操作     │
│                 │                        │                 │
│  v1.0.0（草稿）  │─────[导出]────────────→│  加载配置运行   │
│    ↓ 修改       │   生成配置包            │    v1.0.0      │
│  v1.0.1（草稿）  │                        │                 │
│    ↓ 导出       │─────[导出]────────────→│  加载新版本     │
│  v1.0.1（已导出）│                        │    v1.0.1      │
└─────────────────┘                        └─────────────────┘
```
4.2 运行时版本选择
```text
运行时系统顶部版本选择：
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
  - 运行时通过加载不同的配置包来切换版本
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
| M3 | Week 7-9 | 运行时系统 | 基础界面、数据操作、简单查询 |
| M4 | Week 10-12 | 集成测试 | 端到端测试、文档、部署优化 |
5.2 验收标准
| 场景 | 验收标准 |
|------|----------|
| 配置导出 | 建模工具点击“导出”后生成配置包，运行时可加载配置并启动 |
| 基础数据操作 | 运行时可进行基本的实体增删改查操作 |
| 简单自然语言查询 | 运行时输入“查询合同列表”后，返回基本的合同数据 |
| 版本切换 | 运行时可选择不同版本的配置并加载 |
5.3 里程碑 Exit Criteria（可验收口径）
| 里程碑 | Entry Criteria（进入条件） | Exit Criteria（退出条件） | 验收方式 |
|------|------|------|------|
| M1 建模工具核心功能 | 领域、项目、实体基础页面可访问 | 至少完成 1 个合同域项目建模，包含 5 类核心实体（Contract/ContractClause/ApprovalInstance/PaymentSchedule/ContractAttachment）；四大元模型可保存并回读一致 | 功能验收 + 数据回读比对 |
| M2 配置导出器 | M1 通过且 `ProjectVersion` 可冻结 | `POST /api/export` 成功返回；导出包包含 `config.json`、`manifest.json`、`data/*.json`；`includeData=false` 时不生成 `seed_data.json` | 接口测试 + 文件结构校验 + Schema 校验 |
| M3 运行时系统 | M2 导出包可生成并可解压 | 运行时可加载导出包并完成 1 次 CRUD + 1 次自然语言查询；查询 P95 响应时间 <= 2s（本地单用户） | E2E 测试 + 性能采样 |
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
    Given 运行时已加载版本 "v1.0.0" 且存在 Contract 数据
    When 提交查询 "查询合同列表"
    Then 返回 message="查询成功"
    And results 为数组且长度 > 0
    And 返回结果中的实体类型包含 "Contract"
```

```gherkin
Feature: 版本切换
  Scenario: 在运行时切换版本
    Given 运行时已加载版本 "v1.0.0" 且可用版本包含 "v1.0.1"
    When 用户切换到 "v1.0.1"
    Then 当前版本显示为 "v1.0.1"
    And 数据视图按 v1.0.1 的实体结构渲染
```

```gherkin
Feature: 自愈机制（待二期）
  Scenario: 查询失败后自动修正
    Given 运行时启用自愈开关 selfHealingEnabled=true
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
| 运行时响应延迟 | 低 | 中 | 优化配置加载，简化数据处理 |
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
8.1 建模工具→运行时API
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
8.2 运行时查询API
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
| Docker Desktop | ☐ | 运行时容器测试需要 |
| Python 3.11+ | ☐ | Flask 运行时需要 |

9.2 建议仓库结构

```text
ontology-project/
├── ontology-modeling/          # 系统A：建模工具
│   ├── src/
│   ├── package.json
│   └── README.md
├── ontology-runtime/           # 系统B：运行时框架
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
2. 创建运行时框架目录。
3. 初始化 Flask 后端基础骨架。
4. 初始化 React + Vite 前端基础骨架。

建议命令如下：

```bash
# 验证建模工具
cd ontology-modeling
pnpm install
coze dev

# 初始化运行时目录
mkdir -p ontology-runtime
cd ontology-runtime
mkdir -p backend frontend database
```

### Day 3-4：核心类型定义

1. 在建模工具侧补充 `ProjectVersion` 与 `PublishConfig`。
2. 明确实体需标记聚合角色（`aggregate_root` / `child_entity`），并确保只有聚合根可以发布领域事件。
3. 在运行时侧建立 `Metamodels`、`AIRequest`、`AIResponse` 等基础类型。

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
  status: 'draft' | 'published' | 'archived';
}
```

### Day 5：版本管理 UI

1. 增加 `version-manager.tsx` 组件。
2. 支持创建版本、查看版本列表、触发发布。
3. 允许“发布”先接占位逻辑，再逐步对接代码生成器。

9.4 已确认技术决策

| 决策项 | 确认结果 | 说明 |
|--------|----------|------|
| 运行时数据库 | SQLite | 单文件、零配置，适合作为 MVP 默认方案，并预留迁移 PostgreSQL 的路径 |
| 运行时 AI SDK | 豆包（Coze） | 与建模工具保持一致，减少模型接入差异 |
| 前端状态管理 | Zustand | 与建模工具技术栈一致，轻量且易维护 |
| 实施节奏 | 按 M1-M6 里程碑推进 | 先完成版本发布与代码生成基础，再逐步补足运行时能力 |

9.5 Week 1 验收标准

| 任务 | 验收标准 |
|------|----------|
| 环境搭建 | `coze dev` 可启动建模工具，`docker-compose up` 可启动运行时空壳 |
| 类型更新 | 实体创建时必须标记 `entityRole`（`aggregate_root` / `child_entity`）；当选择子实体时必须指定 `parentAggregateId`；仅聚合根可发布领域事件 |
| 版本管理UI | 可创建版本、查看列表、打开发布对话框 |
| 项目结构 | 前后端目录清晰，类型定义完整 |
| 数据库 | SQLite 目录和配置正确 |

9.6 M1 必须关闭项清单（Owner / 验收证据 / 测试方法）

本节列出在 M1 结束前必须关闭的高优先级问题，对应 1.4 业务主审结论中的“需修改（高）”与关键“待澄清”项。

| 序号 | 项目 | Owner（角色） | 验收证据 | 测试方法 |
|------|------|---------------|----------|----------|
| M1-01 | 流程级建模方案（跨实体业务流程） | 业务架构师 + 领域专家 | `ProcessDefinition` 元模型设计文档（含示例：合同签订流程、收款执行流程），并在建模工具中至少完成 1 个合同域流程建模样例 | 在建模工具中配置“采购合同签订流程”，验证可生成包含跨实体联动（Contract + PaymentSchedule + ApprovalInstance）的配置，并由运行时正确解释执行一条端到端流程（拟定->审批->生成计划） |
| M1-02 | 模型演进与数据迁移策略（MVP） | 业务架构师 + 数据架构师 | 更新后的 4.3 小节内容，以及一份针对“新增字段 / 删除字段 / 实体拆分”的迁移示例说明 | 为同一合同模型创建 v1.0.0 与 v1.1.0 两个版本，模拟“新增字段”和“删除字段”场景，验证：新增字段场景无须手工脚本即可平滑运行；破坏性变更场景至少有明确迁移脚本模板或“新库 + 迁移”的操作指引 |
| M1-03 | 运行时审计与操作留痕设计 | 业务架构师 + 技术负责人 | `audit` 模块设计说明（字段列表、触发点、存储方式）以及在生成代码骨架中出现的统一审计调用接口 | 启动运行时 Demo，执行 1 次自然语言查询（只读）和 1 次状态变更（写操作），验证审计表或日志中至少记录：用户、时间、原始输入、执行动作摘要、自愈重试信息（如有） |
| M1-04 | 一期运行时范围决议（配置加载 vs 代码生成） | 产品负责人 + 技术负责人 | 一页内的书面决议，明确：MVP 一期选择“配置加载型运行时”或“代码生成型运行时”，并在“一、架构演进总览”中同步更新表述 | 按决议方式实际启动一次运行时环境（配置加载或代码包生成），在评审会中逐步走通“从建模到运行”的完整路径，确认各干系人对启动路径、变更流程及责任边界无歧义（以会议纪要为准） |
| M1-05 | AI 能力边界与默认策略 | 产品负责人 + 合规负责人 | 《AI 能力使用策略》简表：列出“查询类 / 写操作类 / 管理类”三类场景，并给出“默认开启 / 默认关闭 / 需审批开启”的策略，同时在运行时代码或配置中体现对应开关 | 在运行时中模拟三类场景：1）查询合同列表；2）修改合同状态；3）批量调整收付款计划，验证：查询类请求不会修改数据且仅记录访问日志；写操作类请求只有在配置明确开启时才允许执行并写全量审计；被策略禁止的场景返回明确的“策略限制”提示 |

9.7 下一步

完成 Week 1 后，进入 Week 2，优先实现代码生成器基础能力，包括 SQLite DDL 生成与 Flask 模型生成。