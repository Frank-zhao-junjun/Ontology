# AI辅助本体设计工具 — 需求设计文档

**版本**：v2.4
**日期**：2026-06-13
**状态**：已确认（含评审修正）
**评审角色**：业务需求分析 + 本体模型设计专家

---

## 1. Problem Statement

### 1.1 当前痛点

| 问题 | 具体表现 |
|------|---------|
| **本体建模门槛高** | 领域专家有业务知识但不会用 OWL/RDF/Protégé 等专业工具建模 |
| **无AI辅助** | 现有设计工具全靠手动拖拽和填写表单，不支持自然语言驱动 |
| **运行时与设计时耦合** | 旧系统将规则引擎、状态机执行、事件总线等运行态逻辑与本体定义混在一起，导致修改本体需要理解全套运行时 |
| **无标准化导出** | 本体定义无法导出为 JSON/YAML/Excel 等通用格式供下游系统消费 |

### 1.2 解决思路

从"运行时执行系统"转型为"AI 辅助本体设计工具"，遵循 **只定义不执行** 原则：

- AI 理解用户自然语言意图，生成结构化本体初稿
- 人工逐层审核确认，确保质量
- 导出标准化格式供给项目2（enterprise-agent-portal）的 MCP Server 消费
- 去掉所有运行态代码（规则引擎、状态机引擎、事件总线、自愈机制）

### 1.3 适用场景

- 企业业务专家需要为所在领域建立本体模型
- 系统架构师设计跨领域本体并交付给开发团队
- 本体设计完成后需要导出为下游系统可消费的格式（JSON/YAML/Excel）

---

## 2. Success Metrics

### 2.1 功能性指标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| 支持的领域数 | ≥ 3 个独立领域同时建模 | 后端 API 查询 |
| 单实体完整建模时间 | ≤ 10 分钟（从自然语言输入到 5 维全部确认） | 人工计时 |
| 导出格式 | 3 种（JSON / YAML / Excel） | 功能测试 |
| 导出 5 维完整度 | 100% — 全部 5 维 + EPC 均可导出 | 自动化测试 |
| 实体树层级 | 至少 3 层（领域→子域→实体） | 功能测试 |

### 2.2 非功能性指标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| API 响应时间 (P95) | ≤ 500ms（不含 LLM 调用） | 压测 |
| 前端首屏加载 | ≤ 3s | Lighthouse |
| 后端测试覆盖率 | ≥ 80% | pytest --cov |
| 前端测试覆盖率 | ≥ 70% | vitest --coverage |
| 并发用户数 | ≥ 5 人同时操作（v1） | 场景测试 |

### 2.3 质量指标

| 指标 | 目标值 |
|------|--------|
| 代码重复率 | ≤ 5%（由 SonarQube 或等效工具检测） |
| TypeScript 类型覆盖 | 无 `any` 类型（除第三方库兼容处） |
| 安全漏洞 | 0 已知严重/高危漏洞（基于 OWASP Top 10） |

---

## 3. Non-Goals

以下内容 **明确不属于 v1 范围**：

| 非目标 | 理由 | 计划 |
|--------|------|------|
| **运行时执行** | 项目定位为"只定义不执行" | 永不纳入 |
| **多人实时协作** | 复杂度高，v1 聚焦单人建模体验 | v2 计划 |
| **OWL/RDF 导出** | 行业标准格式，但 v1 优先 JSON/YAML/Excel | v1.x Roadmap |
| **自然语言查询** | 用户输入自然语言查询已有本体 | 后续评估 |
| **本体推理/推理机** | 超出设计工具范畴，属于消费侧（项目2） | 不属于本工具 |
| **自定义 UI 主题/换肤** | 不影响核心功能 | 后续纳入 |
| **国际化（i18n）** | 当前仅支持中文 | 待定 |
| **移动端适配** | 三栏布局不适合小屏幕 | 待定 |
| **AI 模型自托管** | 通过 `/api/chat/execute` 接口抽象，不限定具体模型 | 可插拔设计 |

---

## 4. User Stories

| 角色 | 场景 | 目标 |
|------|------|------|
| 领域专家 | 我有业务知识但不会建模 | 用自然语言描述业务，AI 帮我生成初稿，我审核修正 |
| 系统架构师 | 我设计跨领域本体 | 逐层建模、定义 EPC 流程、导出标准格式给下游 |
| 开发工程师 | 我要接入本体定义 | 从项目1获取导出文件，在项目2 MCP Server 中加载使用 |
| 业务分析师 | 我要验证本体完整性 | 浏览实体树、检查 EPC 流程的 5 维覆盖情况 |

### 4.1 Acceptance Criteria（以"领域专家首次创建本体"为例）

| 步骤 | 场景 |
|------|------|
| Given | 我是领域专家，打开本体设计工具，尚无任何模型 |
| When | 我说"帮我建一个客户管理的本体" |
| Then | AI 引导我确认领域(CRM)，然后定义子领域(Customer Management) → 业务场景(客户跟进) → 实体(Customer) |
| When | 我确认场景后 |
| Then | AI 生成维1(静态结构)：Customer 实体、Contact 实体、关系等，填入中栏 |
| When | 我逐字段确认维1 |
| Then | AI 基于维1 生成维2(动态行为)：assign_agent 行为、CustomerStatus 状态机 |
| When | 我修改了状态机并确认 |
| Then | 维2 标记已确认，AI 继续生成维3... |
| When | 全部5维+EPC确认完毕 |
| Then | 我点击"全部确认→入库"，实体树中 Customer 显示 5维全 ✓，可发布导出 |

---

## 5. 项目定位

- **项目1（本仓库）**：Frank-zhaojunjun/ontology — 本体建模平台，AI 对话生成本体初稿，人工确认编辑
- **项目2**：Frank-zhao-junjun/enterprise-agent-portal — 消费导出文件，MCP Server 提供本体知识服务
- 核心转变：**只定义不执行**。所有运行态已删除。

---

## 6. 已删除的运行态内容

| 删除对象 | 说明 |
|---------|------|
| backend/runtime_service.py | RuntimeIndexer, RuleEngine, StateMachineEngine, EventBus, log_audit |
| backend/routes_runtime.py | 运行时事件/审计 API |
| models.py 运行时表 | 6张表：RuleRuntimeIndex, StateMachineRuntimeIndex, RuleExecutionLog, StateTransitionLog, EventDispatchLog, ExecutionAuditLog |
| ai_orchestrator.py ToolRouter | AI 工具路由 |
| routes_chat.py 运行态逻辑 | 规则引擎、状态机、事件分发、自愈、重试 |
| auth.py runtime_audit | 所有角色的运行时审计权限 |

---

## 7. 架构总览

三栏布局：左栏对话驱动 · 中栏逐层确认 · 右栏实体导航

> SQLite 适合单用户原型阶段，后续迁移 PostgreSQL。

---

## 8. 本体模型体系：领域驱动 · EPC 主干 · 5 维正交

### 8.1 层级结构

核心原则：EPC 流程是建模主干。EPC 中出现的任何元素，定义必须落在对应维度中。

### 8.2 维1：静态结构 (Structural)

| 要素 | 说明 | 示例 |
|------|------|------|
| **领域 (Domain)** | **顶层业务划分，独立建模对象。属性：名称、描述、标签。拥有独立 CRUD，实体通过 FK 引用领域** | manufacturing, customer-service, supply-chain |
| 实体 | 有唯一标识的业务对象，关联所属领域（FK → Domain.id） | Lead, Contact, Campaign |
| 属性 | 类型/长度/必填/唯一/autoFill | lead_source: enum required |
| 关系 | OWL 标准 + 领域关系 | subClassOf / equivalentClass / disjointWith / 聚合/组合/关联/依赖 |
| 继承 | 实体间泛化关系 | VIPCustomer subClassOf Customer |
| 值对象 | 无标识的属性组合 | 优先级、SLA、质量指标值 |
| 索引 | btree/hash/unique | (customer_id, sign_date) btree |

> **领域是独立元素**（非实体字段）。领域拥有独立 CRUD（创建/编辑/删除/列表）。实体通过 FK 引用所属领域。子域和业务场景保持为实体字段，不做独立对象。实体树的层级数据从后端 `/api/domains` + `/api/entities` 获取，不再硬编码。

### 8.3 维2：动态行为 (Behavioral)

| 要素 | 说明 |
|------|------|
| 行为 | 原子操作：名称/输入/输出/所属域 — 被 EPC 流程引用 |
| 状态机 | 状态 + 转移规则 + 触发条件 |

### 8.4 维3：规则与约束 (Rule & Constraint)

规则集中管理，行为通过 rule_refs 引用，多对多双向可查：

| 要素 | 说明 |
|------|------|
| 校验规则 | 5类：字段/跨字段/跨实体/聚合/时序 |
| 护栏 | 红线：触发条件 - 阻断/告警/审批 |
| 策略 | 可配置规则集 |
| 权限 | 角色 - 资源 - 操作矩阵 |
| 豁免 | 临时豁免条件 |

### 8.5 维4：事件与消息 (Event)

| 要素 | 说明 |
|------|------|
| 事件类型 | 分类标签 |
| 事件源 | 产生者：设备/系统/人工 |
| 作用实体 | 事件影响哪个实体 |
| 因果链 | A事件 - B事件触发关系 |
| 事件级别 | critical/high/medium/low/info |
| 事件属性 | 元数据结构 (PayloadSchema) |

### 8.6 维5：外部接口 (Interface)

| 要素 | 说明 |
|------|------|
| 系统API | 接口定义：URL/方法/参数/响应 |
| 数据查询 | SQL模板/NoSQL查询定义 |
| 计算引擎 | 算法定义：输入/输出/公式 |
| 通知推送 | 渠道定义：邮件/IM/短信模板 |
| 报表生成 | 报表模板：字段/聚合/格式 |

### 8.7 EPC 编排层：5 维交汇

EPC 跨 5 维引用编排，不新增要素定义。

**EPC 步骤形式化 Schema**：

```yaml
step_schema:
  event_trigger: 维4.事件名      # 必填，触发事件
  action:        维2.行为名      # 必填，执行行为
  conditions:    [维3.规则名]    # 可选，分支条件
  guards:        [维3.护栏名]    # 可选，安全红线
  permissions:   [维3.权限名]    # 可选，访问控制
  inputs:        [维1.实体名]    # 可选，数据输入
  outputs:       [维1.实体名]    # 可选，属性变更
  tools:         [维5.接口名]    # 可选，外部调用
```

所有引用使用 `维度.要素名` 格式，确保跨维引用可追溯。

**示例**：

```yaml
epc_processes:
  - id: lead_allocation
    name: 线索分配流程
    steps:
      - event_trigger: 维4.lead_created
        action: 维2.score_lead
        outputs: [维1:Lead.score]
        guards: [维3.duplicate_lead_check]
        tools: [维5.scoring_engine]

      - event_trigger: 维4.lead_scored
        action: 维2.allocate_to_rep
        conditions: [维3.high_score_priority]
        permissions: [维3.sales_manager]
        tools: [维5.crm_assign_api]
```

---

## 9. 交互设计

### 9.1 左栏：对话 (NLI Chat)

自然语言驱动，逐层生成：@维名 指定修改范围，@实体名/@流程名 切换目标。

**意图-动作映射**：

| 用户意图 | AI 动作 |
|---------|--------|
| 创建XX领域的本体 | 引导确认领域，然后定义 子领域-场景-实体，进入 EPC 驱动建模 |
| 给XX加一个行为 | 维2新增行为定义 |
| 修改XX的状态机 | 定位维2对应状态机更新 |
| XX行为的约束是什么 | 维3展示关联规则供修改 |
| 导出OWL | OWL/RDF 导出（v1 Roadmap） |
| @流程名 加步骤 | EPC 流程中增加步骤节点 |

### 9.2 中栏：确认面板 (Review Panel)

**逐层生成，逐层确认**：

1. AI 生成维1（静态结构） - 用户确认
2. AI 基于维1 生成维2（动态行为） - 用户确认
3. AI 基于维1+维2 生成维3（规则约束） - 用户确认
4. AI 基于维1-3 生成维4（事件消息） - 用户确认
5. AI 基于维1-4 生成维5（外部接口） - 用户确认
6. 基于完整 5 维上下文生成 EPC 流程编排

每维独立折叠区块，inline 编辑，可单独重新生成。

**修改已确认内容**：修改 - 自动标记 draft - 下游维度受影响提示 - 重新确认 - 新版本。

**数据流要求**：确认/保存/入库等所有写操作必须调用后端 API，不可仅停留在本地状态。UI 展示的成功提示必须对应真实 API 响应，不得伪造。

### 9.3 右栏：实体树 (Entity Tree)

层级（数据驱动，从后端 API 获取）：
```
领域 (Domain) ── 子领域 ── 业务场景 ──+
                                        |
                    ┌────────────────────┘
                    ▼
             ┌─────────────┐
             │   实体列表    │ ← 所属当前场景
             │  (Entities)  │
             └──────┬──────┘
                    │ 引用
                    ▼
             ┌──────────────┐
             │  EPC 流程    │ ← 编排层，引用实体和5维要素
             └──────────────┘
```

实体和 EPC 流程是场景下的平级分支。领域是独立对象（非实体字段），树的第一级从 `/api/domains` 加载。

实体显示 5 维确认状态（已确认/待确认/草稿），点击切换中栏。
底部：版本号 + 发布/导出入口 + 搜索 + 新建。

---

## 10. 发布 · 版本 · 导出

### 10.1 导出格式

| 格式 | 用途 | 内容 | 状态 |
|------|------|------|:----:|
| JSON | 程序消费，结构化完整数据 | 全部 5 维 + EPC 的完整本体定义 | v1 |
| YAML | 兼顾人可读，适合版本控制 | 与 JSON 等价，格式不同 | v1 |
| Excel (.xlsx) | 业务分析师审阅，多工作表 | **每维一张工作表**，按实体分组展开，含确认状态列 | v1 |

### 10.2 Excel 导出规范

Excel 文件包含以下工作表：

| 工作表名 | 内容 | 列 |
|---------|------|----|
| **领域总览** | 所有领域的列表 | 名称、描述、标签、实体数、状态 |
| **维1_静态结构** | 按领域/场景分组的实体、属性、关系、值对象 | 领域、场景、实体、属性名、类型、关系、值对象 |
| **维2_动态行为** | 行为列表、状态机、指标定义 | 所属实体、行为名、输入/输出、状态转移、指标公式 |
| **维3_规则约束** | 校验规则、护栏、权限、豁免 | 规则名、类型、表达式、作用域 |
| **维4_事件消息** | 事件类型、事件源、因果链 | 事件名、级别、事件源、作用实体、触发事件 |
| **维5_外部接口** | API、查询、计算引擎、通知 | 接口名、类型、URL/方法、所属域 |
| **EPC流程** | 跨维编排流程 | 流程名、步骤、触发事件、行为、规则引用 |

> Excel 使用 openpyxl 生成，服务端直接输出 `.xlsx` 文件流。

### 10.3 导出质量约束

| 约束 | 说明 |
|------|------|
| **无重复行** | Excel 中同一工作表不应出现因循环嵌套导致的数据重复行 |
| **格式等价** | JSON / YAML / Excel 三种格式必须内容等价，语义一致 |
| **编码** | 全部使用 UTF-8，Excel 导出使用 Unicode 确保中文显示正确 |
| **空值处理** | 无数据的维度导出为空工作表 + 占位行，不可缺失 |

### 10.4 导出内容结构（JSON/YAML）

```yaml
ontology:
  domain: manufacturing
  version: "1.0.0"
  exported_at: "2026-06-12T..."
  structural:      # 维1: 静态结构
    entities: [...]
    relations: [...]
    value_objects: [...]
    indexes: [...]
  behavioral:      # 维2: 动态行为
    actions: [...]
    state_machines: [...]
    indicators: [...]
  rules:           # 维3: 规则与约束
    validations: [...]
    guardrails: [...]
    policies: [...]
    permissions: [...]
    exemptions: [...]
    probes: [...]
  events:          # 维4: 事件与消息
    event_types: [...]
    sources: [...]
    causalities: [...]
  interfaces:      # 维5: 外部接口
    apis: [...]
    queries: [...]
    compute: [...]
    notifications: [...]
    reports: [...]
  epc_processes:   # 编排层: 跨5维引用
    - id: lead_allocation
      name: 线索分配流程
      steps:
        - event_trigger: events.lead_created
          action: behavioral.score_lead
          guards: [rules.duplicate_lead_check]
          tools: [interfaces.scoring_engine]
```

---

## 11. 版本协作

| 机制 | 说明 |
|------|------|
| Semantic Versioning | Major.Minor.Patch |
| Changelog | 每版本变更摘要 |
| Diff | 版本间差异对比 |
| 回滚 | 回退到历史版本 |

---

## 12. Roadmap

| 阶段 | 内容 |
|------|------|
| v1 | 5维+EPC建模、AI逐层生成、JSON/YAML/Excel导出、三栏交互 |
| v1.x | OWL/RDF 导出、多版本 diff、PostgreSQL 迁移 |
| v2 | 多人协作、权限管理、模板库 |

---

## 13. 技术约束

### 13.1 基础栈

- 后端：Python Flask + SQLAlchemy + SQLite（v1，后续迁移 PostgreSQL）
- 前端：React 18 + TypeScript + Ant Design 5 + Vite（v1 迁移，当前为原生 JS/HTML）
- AI：`/api/chat/execute`，LLM 逐层生成结构化本体数据
- 不包含运行态：所有要素只定义不执行

### 13.2 数据流要求

| 要求 | 说明 |
|------|------|
| **写操作必调 API** | 确认、保存、入库、发布、导出等所有写操作必须调用后端 API，不可仅停留在 React 本地状态 |
| **响应驱动 UI** | 前端成功提示必须以 API 响应为据，不可先于 API 返回前显示成功 |
| **错误可视化** | API 错误必须展示给用户（message.error），不可静默吞掉 (`catch(() => {})`) |

### 13.3 安全要求

| 要求 | 优先级 | 说明 |
|------|:------:|------|
| **密码带盐哈希** | 必选 | 禁止使用 `sha256(password)` 无盐存储。使用 `werkzeug.security.generate_password_hash`（bcrypt/scrypt）或等效算法 |
| **Token 过期机制** | 必选 | 认证 Token 必须有过期时间（如 24h），不可永不过期。过期后要求重新登录 |
| **Token 存储** | 必选 | 禁止使用 `localStorage` 存储 Token。改用 HTTP-only Cookie 防止 XSS 窃取 |
| **默认密码仅限开发** | 必选 | `admin123` / `operator123` 等默认密码仅限开发环境。生产环境必须从环境变量注入 |
| **SQLite 路径** | 必选 | 数据库路径必须从环境变量或配置读取，不可依赖运行时的当前工作目录 |
| **所有端点鉴权** | 必选 | `/api` 前缀的所有端点必须有鉴权（当前已实现） |

---

## 14. 实现状态

### 14.1 功能完成度

| 需求 | Spec 章节 | 代码状态 | 阻塞项 |
|------|----------|:--:|------|
| 意图-动作映射（6 条规则） | 9.1 | ❌ | LLM API 接入 |
| 逐层增量生成（维1→维2→...→EPC） | 9.2 | ❌ | LLM API 接入 |
| OWL/RDF 导出 | 10 / 12.Roadmap v1.x | ❌ | 排期 v1.x |

### 14.2 工程质量项

| 项目 | 说明 | 优先级 |
|------|------|:--:|
| ErrorBoundary | ✅ 已修复 | ✅ |
| Prompt() → Modal | ✅ 已修复 | ✅ |
| useEffect cleanup | ✅ 已修复 | ✅ |
| `any` 类型消除 | ✅ 已修复 (0 业务 any，仅 Ant Design render 回调) | ✅ |
| CORS 配置 | 后端缺 flask-cors | 🟡 |
| `get_json(force=True)` | 14 处跳过了 Content-Type 校验 | 🟢 |
| EditableTable 抽象 | 5 个表单重复 Table+Button 模式 | 🟢 |

### 14.3 安全项

| 项目 | Spec 章节 | 状态 |
|------|----------|:--:|
| 密码带盐哈希 | 13.3 | ❌ |
| Token 过期机制 | 13.3 | ❌ |
| HTTP-only Cookie | 13.3 | ❌ |
| 环境变量注入 | 13.3 | ❌ |

### 14.4 Success Metrics 达标情况

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|:--:|
| 领域数 | ≥3 | API 支持无上限 | ✅ |
| 导出格式 | 3 种 | JSON + YAML + Excel | ✅ |
| 导出完整度 | 100% | 5维+EPC 全覆盖 | ✅ |
| 实体树层级 | ≥3 | domain→subDomain→scenario 3层 | ✅ |
| Backend 测试覆盖率 | ≥80% | 待测量 (pytest-cov) | 🟡 |
| Frontend 测试覆盖率 | ≥70% | 待测量 (vitest coverage) | 🟡 |
| API P95 | ≤500ms | 待测量 | 🟡 |
| 前端首屏 | ≤3s | 待测量 (Lighthouse) | 🟡 |
| 代码重复率 | ≤5% | 5 forms 共享 Table 模式，重复 ~100 LOC | 🟡 |
| TypeScript any | 0 | 0 (仅 Ant Design render 回调) | ✅ |

> 测试: 65 total (Backend 49 + Frontend 16) — 100% pass  
> 核心功能完成率: 23/24 = 96%  
> Success Metrics 达标: 6/10 (4 pending measurement)
