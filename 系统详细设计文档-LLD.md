# 本体驱动 AI 原生应用框架系统详细设计文档（LLD）

版本：v1.0  
日期：2026-03-28  
上游文档：最终需求文档 v2.2；系统架构设计文档-最终稿 v2.0-final；实施计划 v1.0

## 1. 文档范围

本 LLD 聚焦第三步约定的三个核心模块：

1. 元模型管理模块。
2. AI 编排器模块。
3. 规则与状态机执行链路模块。

目标是将 HLD 约束转化为可实现、可测试、可验收的详细设计。

## 2. 统一约定

### 2.1 设计约束

1. 写操作必须经领域技能，禁止编排层直写数据库。
2. 流程模型必须来自已发布快照，不允许代码硬编码业务流程。
3. 规则执行采用发布快照 + 热加载或低中断刷新机制。
4. 事件处理为进程内发布订阅，失败可观测、不可静默丢弃。

### 2.2 命名与版本

1. 元模型版本采用语义化版本号。
2. 接口请求与响应统一包含 trace_id。
3. 动作协议与工具协议包含 version 字段。

### 2.3 错误码规范

| 错误码 | 含义 |
| --- | --- |
| M4001 | 模型结构校验失败 |
| M4002 | 模型一致性校验失败 |
| M4091 | 模型版本冲突 |
| A4001 | 意图解析失败 |
| A4002 | 工具参数校验失败 |
| A5001 | 工具执行失败且重试耗尽 |
| R4001 | 规则校验失败 |
| S4001 | 状态流转非法 |
| P4031 | 权限不足 |

## 3. 模块一：元模型管理模块

### 3.1 模块职责

1. 管理五类元模型定义与版本生命周期。
2. 提供模型校验、发布、回滚、查询能力。
3. 为生成器和运行时提供已发布快照。

### 3.2 子组件设计

1. model_repository：模型存储访问。
2. model_validator：结构校验与一致性校验。
3. publish_service：发布流程编排。
4. snapshot_provider：快照读取与缓存。
5. schema_registry：五类模型 Schema 注册。

### 3.3 数据结构设计

| 表名 | 关键字段 | 说明 |
| --- | --- | --- |
| meta_model_definition | id, model_type, name, version, content_json, status | 五类模型定义主表 |
| meta_model_release | id, release_no, status, released_by, released_at | 发布记录 |
| meta_model_release_item | release_id, model_definition_id, checksum | 发布项与快照映射 |
| meta_model_change_log | id, model_definition_id, change_type, diff_json, operator | 变更审计 |

状态建议：draft、validated、published、archived。

### 3.4 接口设计

1. POST /api/meta-models/validate
   1. 入参：model_type, content, expected_version
   2. 出参：is_valid, errors, warnings
2. POST /api/meta-models/publish
   1. 入参：release_no, model_ids
   2. 出参：release_id, status, snapshot_ref
3. GET /api/meta-models/snapshots/current
   1. 出参：release_no, models, checksum
4. POST /api/meta-models/rollback
   1. 入参：target_release_no
   2. 出参：new_release_id, status

### 3.5 发布时序

1. 接收发布请求。
2. 加载目标模型。
3. 执行结构校验。
4. 执行跨模型一致性校验。
5. 写入发布记录并标记 published。
6. 生成快照并刷新缓存。
7. 通知生成器与运行时。

### 3.6 关键校验规则

1. 数据模型引用的实体必须存在。
2. 行为模型状态字段必须对应数据模型字段。
3. 规则模型引用的实体与字段必须存在。
4. 流程模型引用规则和工具必须可解析。
5. 事件模型订阅目标必须可解析到技能或命名入口。

### 3.7 非功能设计

1. 快照缓存 TTL 可配置，发布后主动失效。
2. 发布流程支持幂等控制，防止重复发布。
3. 发布操作必须记录操作者与变更摘要。

### 3.8 测试点

1. 正常发布与回滚。
2. 并发发布冲突。
3. 跨模型引用断裂。
4. 快照缓存刷新与一致性。

## 4. 模块二：AI 编排器模块

### 4.1 模块职责

1. 解析用户意图并装配上下文。
2. 基于流程模型快照进行策略编排。
3. 路由工具调用并整合响应。
4. 执行自愈重试与失败降级。

### 4.2 子组件设计

1. context_manager：会话上下文装配。
2. intent_analyzer：意图与参数识别。
3. process_strategy_engine：流程策略解释执行。
4. tool_router：工具选择与调用编排。
5. self_healing_executor：错误修正重试。
6. response_builder：消息与动作输出构建。

### 4.3 运行输入输出

输入：session_id, user_id, message, ui_context。  
输出：message_text, actions, context_updates, debug_trace。

### 4.4 工具路由策略

1. 查询意图优先路由只读查询工具。
2. 写入意图强制路由技能工具。
3. 导航意图路由动作协议工具。
4. 分析意图可组合查询工具与图表工具。

### 4.5 自愈机制细则

1. 最大重试次数为 2。
2. 仅允许修复以下错误：参数格式错误、字段名错误、可替换工具参数错误。
3. 禁止修复并重试以下错误：权限拒绝、规则阻断、状态非法。
4. 重试过程写入完整错误链和修正链。

### 4.6 接口设计

1. POST /api/chat/execute
   1. 入参：session_id, message, ui_context
   2. 出参：assistant_message, actions, conversation_state
2. POST /api/chat/retry
   1. 入参：message_id, reason
   2. 出参：retry_result, attempts
3. GET /api/chat/session/{session_id}/context
   1. 出参：focus_entity, recent_actions, model_snapshot_ref

### 4.7 时序：查询场景

1. 接收用户问题。
2. 读取会话上下文与模型快照。
3. 意图识别并生成工具计划。
4. 调用只读查询工具。
5. 构建回复与动作协议输出。

### 4.8 时序：写入场景

1. 接收用户写操作意图。
2. 识别技能调用计划。
3. 调用技能工具。
4. 接收规则与状态机执行结果。
5. 返回操作结果与界面动作。

### 4.9 降级策略

1. LLM 不可用时，仅保留结构化 UI 路径。
2. 编排失败时返回可执行的手动操作建议。
3. 记录降级触发原因并上报告警。

### 4.10 测试点

1. 多轮会话上下文正确性。
2. 流程模型更新后策略生效。
3. 自愈边界验证。
4. LLM 故障降级可用性。

## 5. 模块三：规则与状态机执行链路

### 5.1 模块职责

1. 在受控写链路上执行规则校验。
2. 校验并执行状态流转。
3. 输出结构化执行结果与审计日志。

### 5.2 子组件设计

1. rule_loader：规则快照加载与刷新。
2. rule_evaluator：五类规则求值器。
3. transition_guard：流转合法性校验。
4. state_machine_executor：状态变更执行器。
5. execution_audit_logger：执行日志组件。

### 5.3 执行入口

1. 领域技能写操作入口调用 validate_and_transition。
2. 输入：entity_type, entity_id, action, payload, operator。
3. 输出：is_success, violations, old_state, new_state, event_list。

### 5.4 规则执行顺序建议

1. 字段级校验。
2. 跨字段校验。
3. 跨实体校验。
4. 聚合校验。
5. 时序规则。

若任一 blocking 级别规则失败，终止后续写操作。

### 5.5 状态机执行流程

1. 校验当前状态与目标流转是否合法。
2. 校验流转绑定规则是否通过。
3. 执行状态更新。
4. 记录状态变更日志。
5. 触发领域事件发布。

### 5.6 规则热加载设计

1. 默认加载已发布规则快照。
2. 支持低中断刷新：后台刷新新版本，前台无停机切换。
3. 刷新失败时回退到上一个可用快照。

### 5.7 数据结构设计

| 表名 | 关键字段 | 说明 |
| --- | --- | --- |
| rule_definition | id, rule_type, entity_type, content_json, version, is_active | 规则定义 |
| rule_execution_log | id, rule_id, entity_id, result, details_json, executed_at | 规则执行日志 |
| state_machine_definition | id, entity_type, states_json, transitions_json, version | 状态机定义 |
| state_transition_log | id, entity_id, from_state, to_state, transition_id, operator, created_at | 状态流转日志 |

### 5.8 失败处理

1. 规则失败返回 violations 列表并附错误码 R4001。
2. 状态非法返回错误码 S4001。
3. 权限失败返回错误码 P4031。
4. 所有失败都必须写入审计日志。

### 5.9 测试点

1. 五类规则执行正确性。
2. blocking 与 warning 语义差异。
3. 非法流转阻断。
4. 热加载切换一致性。

## 6. 横切设计

### 6.1 可观测性

1. 全链路 trace_id 贯通 API、编排、技能、规则、状态机、事件。
2. 关键指标：请求耗时、工具失败率、自愈成功率、规则拦截率、流转失败率。
3. 关键日志统一字段：trace_id, user_id, session_id, module, action, result, error_code。

### 6.2 安全性

1. 接口层执行认证与授权。
2. 工具层执行参数白名单和结构校验。
3. 查询工具执行只读保护。
4. 关键写操作支持二次确认开关。

### 6.3 可测试性

1. 对外部依赖采用依赖注入与替身对象。
2. 单元测试覆盖核心规则和状态机逻辑。
3. 集成测试覆盖三条关键链路：模型发布、查询执行、写入执行。

## 7. 开发任务分解建议

### 7.1 P0 任务

1. 元模型发布与快照服务。
2. 编排器主链路与工具路由。
3. 规则执行器与状态机执行器。
4. 写路径技能封装与权限校验。

### 7.2 P1 任务

1. 规则热加载低中断刷新。
2. 自愈链路细化与观测增强。
3. 事件处理异步派发能力。

### 7.3 P2 任务

1. 高级策略模板。
2. 复杂分析场景优化。
3. 运维面板增强。

## 8. 验收清单（LLD 级）

1. 三个模块的接口与数据结构已冻结。
2. 错误码、日志字段、追踪字段统一。
3. 每个模块都有明确失败处理路径。
4. 每个模块均有对应测试点与验收口径。
5. 与 HLD 关键约束一致，不出现越权写入路径。
