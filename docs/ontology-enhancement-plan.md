# Ontology AI驱动增强规划 (基于 Palantir 架构理念)

## 一、 背景与目标

当前系统的 `Entity -> Attribute -> Relation` 架构主要解决的是静态数据字典和建模问题。然而，要真正实现 AI 驱动的业务系统并达到**"0幻觉"**标准，大模型面临三个核心难题：
1. **理解难题**：大模型无法理解底层业务系统（如 ERP/CRM）中晦涩的表名和字段含义。
2. **混淆难题**：多系统间存在同名异义或异名同义的数据实体（如 ERP 的 Inventory组织与 WMS 的 Inventory仓库）。
3. **边界控制难题**：大模型不能直接操作物理世界的数据或接口，否则极易产生破坏性修改或编造不存在的业务流。

本规划旨在引入 **Palantir 本体论** 核心理念（静态世界特征 + 动态业务规则 + 模拟推演沙箱），将系统从“静态模型”升级为“AI 业务引擎”。

---

## 二、 核心架构增强 (Meta-Model Updates)

### 2.1 语义底座与主数据映射 (Semantic & Mapping Layer)
**目标：解决“理解与混淆难题”，为大模型提供唯一准确的业务描述语言。**

- **Object (升级自 Entity)**: 
  - 新增 `businessMeaning` (业务含义说明)、`aliases` (同义词库)。
- **Property (升级自 Attribute)**: 
  - 新增 `businessMeaning`、`dataType`。
- **SourceMapping (全新引入)**: 
  - 建立 Ontology 与源系统 (ERP/MES/WMS等) 的映射字段与转换规则。大模型只对接 Ontology，底层系统脏数据由映射层做防腐处理。

### 2.2 动态行为与规则边界 (Action & Rule Layer)
**目标：解决“边界控制难题”，严格约束大模型只能申请合法的业务动作。**

- **Action (动作建模)**: 
  - 定义对象可执行的业务操作（如“发货”、“调整优先级”），明确输入参数体系。大模型只能“申请”调用预定义的 Action。
- **Rule Binding (规则防线)**: 
  - 动作必须绑定前置条件（Pre-Condition）。例如：“仅开放状态的工单可修改”。当大模型违规调用时，规则引擎抛出具体业务错误供其学习纠正。
- **Function (函数集成)**: 
  - 包装物理世界的 API 调用。Action 通过 Function 实际控制底层业务系统。

### 2.3 关系与派生网络 (Link & Computation Layer)
**目标：提供洞察力，连接多维业务。**

- **Link (升级自 Relation)**: 
  - 关系升维，支持自身的“关系属性”（例如航班与飞机对应关系中的“调度时间”）。
- **Computed Property (派生属性)**: 
  - 在运行时通过公式或聚合逻辑（如总消费额）计算得到的数据，丰富 Agent 的决策上下文。

### 2.4 时间轴与演练场 (Memory & Simulation Layer)
**目标：打造智能预测决策引擎。**

- **Execution History (记忆流)**:
  - 沉淀每一次 Action 的上下文和执行结果。通过 RAG 供给大模型，让大模型“记住”之前的操作结论并自我进化。
- **Simulation Sandbox (沙盒推演)**:
  - 大模型的高阶应用不在于修改数据，在于“假设与模拟”。系统支持基于快照创建隔离的 Simulation Context，执行多个假设性 Action。
- **Predictive Model (算法预估)**:
  - 结合 Simulation，预测“如果航班延误 100 分钟，赔偿成本是多少”。选出最优路径后再执行真实回写。

---

## 三、 用户故事 (User Stories) 增强版

### 【基础语义篇】
- **US-0. 语义层基座 (Core Semantic)**: 作为建模工程师，为对象和属性定义 `businessMeaning`，避免大模型语境混淆。
- **US-1. 主数据消除歧义 (Source Mapping)**: 作为数据架构师，打通属性与多个异构底层系统的字段路由映射。

### 【关系与衍生篇】
- **US-10. 深度 Link 定义**: 支持一对一、多对多、自引用，并允许为关联关系本身添加属性和方向性。
- **US-12. 派生属性 (Computed Properties)**: 作为数据工程师，通过聚合/流计算公式定义派生属性，减少物理存储并保障一致性。

### 【行为与控制篇】
- **US-11. 业务动作池 (Action Schemas)**: 为对象配置创建、修改、状态流转等标准化 Action，并带有完整的参数签名。
- **US-13. 规则栅栏 (Rule Engine)**: 为 Action 加上前置拦截 Rules。
- **US-20. 0 幻觉工具链自动生成 (Tool Calling)**: 系统自动将 Action/Function 导出为 OpenAPI 规范或直接供给 LLM 调用的 Function Tools。

### 【推演与智能篇】
- **US-14. 动作流审计与记忆**: 完整记录历史操作并持久化供 AI 反思 RAG 复用。
- **US-19. 沙盘推演环境 (Simulations)**: 提供独立于主数据的虚拟修改上下文机制，支撑同时推演多种假设决策。

---

## 四、 敏捷迭代计划 (Phased Roadmap)

### Phase 1: 语义与连接基石 (Semantic & Link Foundations)
**目标:** 建立静态数据的大模型认知底座。
- 完成元模型中 Object/Property 的 `businessMeaning` 改造。
- 实现 Link 属性增强与 Computed Property。
- 落地基础的 Source Mapping 映射表管理模块。

### Phase 2: 动作防波堤 (AI Action Boundaries)
**目标:** 取消 AI 裸写 DB 的权限，实现 API 级“沙箱申请”和“规则拦截”。
- 落地 Action 与 Function 模型。
- 实现 Rule Binding 执行前置条件验证。
- **核心中间件**: 完成 Ontology -> LLM Agent Tools 的动态转化服务（导出 Prompt Context 和 Function Calling Schemas）。

### Phase 3: 智能演播室 (Simulation & Memory)
**目标:** 实现 Palantir 级别的高阶战略推演与评估。
- 实现数据分支克隆能力（Simulation Context）。
- RAG 记忆流：对接 Execution History 数据源。
- 对接 Predictive Model，为业务节点提供成本/风险/时效三维预测算法。