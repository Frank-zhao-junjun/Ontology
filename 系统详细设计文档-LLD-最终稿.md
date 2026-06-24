# 本体驱动 AI 原生应用框架系统详细设计文档（LLD）最终稿

版本：v2.0-final  
日期：2026-03-28  
上游文档：最终需求文档 v2.2；系统架构设计文档-最终稿 v2.0-final；实施计划（见 实施计划.md）

## 1. 文档范围与覆盖边界

本期 LLD 冻结以下三个核心模块：

1. 元模型管理模块。
2. AI 编排器模块。
3. 规则与状态机执行链路模块。

本期不冻结（后续卷二或专题 LLD）：

1. 交互前端（三栏状态机、组件级契约）。
2. API 网关层（限流、路由策略、审计拦截细节）。
3. 工具执行器独立资源边界与并发池管理。
4. 领域技能注册中心与跨域技能治理。
5. 事件运行时完整专题（复杂重试、死信、跨进程总线）。
6. 生成器产物格式规范与触发编排细节。

### 1.1 与 HLD 组件映射

| HLD 组件 | 本期 LLD 覆盖状态 | 说明 |
| --- | --- | --- |
| 元模型管理与发布服务 | 已覆盖 | 见第 3 章 |
| AI 编排器 | 已覆盖 | 见第 4 章 |
| 规则引擎与状态机 | 已覆盖 | 见第 5 章 |
| 事件运行时 | 部分覆盖 | 见 5.10，完整细节后续专题 |
| API 网关层 | 未覆盖 | 后续卷二 |
| 交互前端 | 未覆盖 | 后续卷二 |
| 生成器服务 | 部分覆盖 | 元模型发布触发关系已定义 |

## 2. 统一约定

### 2.1 设计约束

1. 写操作必须经领域技能，禁止编排层直写数据库。
2. 流程模型必须来自已发布快照，不允许代码硬编码流程。
3. 规则执行采用发布快照 + 热加载或等价低中断刷新机制。
4. 事件处理为进程内发布订阅，失败可观测，禁止静默丢弃。

### 2.2 命名、版本与追踪

1. 元模型版本采用语义化版本。
2. 接口请求与响应统一包含 trace_id。
3. 动作协议与工具协议包含 version 字段。
4. 关键日志统一字段：trace_id, user_id, session_id, module, action, result, error_code。

### 2.3 错误码规范

| 错误码 | 含义 |
| --- | --- |
| M4001 | 模型结构校验失败 |
| M4002 | 模型一致性校验失败 |
| M4091 | 模型版本冲突 |
| A4001 | 意图解析失败 |
| A4002 | 工具参数校验失败 |
| A4092 | 用户手动重试超出允许次数 |
| A5001 | 工具执行失败且自动重试耗尽 |
| R4001 | 规则校验失败 |
| S4001 | 状态流转非法 |
| E4041 | 事件订阅目标不可解析 |
| E5001 | 事件订阅执行失败 |
| P4031 | 权限不足 |

## 3. 模块一：元模型管理

### 3.1 模块职责

1. 管理五类元模型定义、版本、发布与回滚。
2. 提供结构校验与跨模型一致性校验。
3. 为生成器与运行时提供已发布快照。

### 3.2 子组件

1. model_repository：模型读写。
2. model_validator：结构和一致性校验。
3. publish_service：发布编排。
4. snapshot_provider：快照读取和缓存。
5. schema_registry：五类模型 Schema 注册。

### 3.3 数据结构

| 表名 | 关键字段 | 说明 |
| --- | --- | --- |
| meta_model_definition | id, model_type, name, version, content_json, status | 五类模型定义主表 |
| meta_model_release | id, release_no, status, released_by, released_at | 发布记录 |
| meta_model_release_item | release_id, model_definition_id, checksum | 发布项映射 |
| meta_model_change_log | id, model_definition_id, change_type, diff_json, operator | 审计变更 |

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
2. 执行结构校验。
3. 执行跨模型一致性校验。
4. 生成快照并写发布记录。
5. 刷新缓存并通知下游。

### 3.6 跨模型关键校验

1. 数据模型引用实体必须存在。
2. 行为模型状态字段必须可映射到数据模型。
3. 规则模型引用实体和字段必须可解析。
4. 流程模型中的规则与工具必须可解析。
5. 事件模型订阅目标必须可解析到技能或命名处理入口。

### 3.7 非功能设计

1. 发布流程需幂等。
2. 发布后快照缓存强制失效并重建。
3. 发布、回滚必须审计。

### 3.8 测试点

1. 正常发布与回滚。
2. 并发发布冲突。
3. 跨模型引用断裂。
4. 快照缓存一致性。

## 4. 模块二：AI 编排器

### 4.1 模块职责

1. 意图解析与上下文装配。
2. 基于流程模型快照编排工具链路。
3. 输出消息和动作协议。
4. 自动自愈与故障降级。

### 4.2 子组件

1. context_manager：会话上下文。
2. intent_analyzer：意图与参数识别。
3. process_strategy_engine：流程策略执行。
4. tool_router：工具路由。
5. self_healing_executor：自动重试。
6. response_builder：响应构建。

### 4.3 输入输出

输入：session_id, user_id, message, ui_context。  
输出：assistant_message, actions, context_updates, conversation_state。

### 4.4 工具路由策略

1. 查询意图 -> 只读查询工具。
2. 写入意图 -> 技能工具。
3. 导航意图 -> UI 动作工具。
4. 分析意图 -> 查询工具 + 图表工具组合。

### 4.5 自动自愈规则

1. 自动重试上限为 2 次。
2. 仅修复参数格式、字段映射、可替换参数错误。
3. 权限、规则阻断、状态非法不进入自动重试。
4. 记录修正链与失败链。

### 4.6 /api/chat/retry 语义澄清

1. POST /api/chat/retry 是用户手动重放接口，不计入单次自动自愈上限。
2. 手动重放默认创建新的执行 attempt_id，继承原消息上下文。
3. 为防循环，单消息手动重放次数可配置，超限返回 A4092。
4. GET /api/chat/session/{session_id}/context 用于查询重试历史和当前上下文。

### 4.7 接口设计

1. POST /api/chat/execute
   1. 入参：session_id, message, ui_context
   2. 出参：assistant_message, actions, conversation_state
2. POST /api/chat/retry
   1. 入参：message_id, reason
   2. 出参：retry_result, attempts, attempt_id
3. GET /api/chat/session/{session_id}/context
   1. 出参：focus_entity, recent_actions, model_snapshot_ref, retries

### 4.8 时序：查询

1. 读取上下文和快照。
2. 识别意图并产出工具计划。
3. 路由只读查询工具并执行。
4. 构建消息和动作。

### 4.9 时序：写入

1. 识别技能调用计划。
2. 调用技能。
3. 获取规则和状态机执行结果。
4. 输出用户结果与动作。

### 4.10 降级与测试

1. LLM 不可用时降级到纯 UI 路径。
2. 编排失败时返回人工可执行建议。
3. 测试点：多轮上下文、流程快照更新、自愈边界、降级可用性。

## 5. 模块三：规则与状态机执行链路

### 5.1 模块职责

1. 在写链路执行规则校验。
2. 执行状态流转和审计记录。
3. 返回结构化执行结果并触发事件发布。

### 5.2 子组件

1. rule_loader：规则快照加载与刷新。
2. rule_evaluator：五类规则求值器。
3. transition_guard：流转合法性校验。
4. state_machine_executor：状态变更执行。
5. execution_audit_logger：执行日志。

### 5.3 执行入口统一

统一入口为 validate_and_transition，适用于：

1. 仅字段持久化（无状态变更）。
2. 仅状态变更（无字段变更）。
3. 字段和状态同时变更。

这样避免双写入口与权限、规则分叉。

### 5.4 规则执行顺序

1. 字段级。
2. 跨字段。
3. 跨实体。
4. 聚合。
5. 时序。

blocking 失败则终止写操作。

### 5.5 状态机流程

1. 校验当前状态与目标流转。
2. 校验流转绑定规则。
3. 执行状态更新。
4. 记录状态变更。
5. 触发领域事件发布。

### 5.6 规则热加载

1. 默认使用发布快照。
2. 后台刷新、前台无停机切换。
3. 刷新失败回退上一个可用快照。

### 5.7 数据结构与单一事实来源说明

| 表名 | 关键字段 | 说明 |
| --- | --- | --- |
| rule_runtime_index | rule_id, model_def_id, entity_type, is_active, checksum | 规则运行时索引表 |
| state_machine_runtime_index | sm_id, model_def_id, entity_type, checksum | 状态机运行时索引表 |
| rule_execution_log | id, rule_id, entity_id, result, details_json, executed_at | 规则执行日志 |
| state_transition_log | id, entity_id, from_state, to_state, transition_id, operator, created_at | 状态日志 |

说明：

1. 规则与状态机定义的单一事实来源是 meta_model_definition。
2. rule_runtime_index 和 state_machine_runtime_index 仅用于运行时查询优化，不承载业务语义主数据。
3. 严禁将运行时索引表作为独立真相源回写模型语义。

### 5.8 失败处理

1. 规则失败返回 R4001。
2. 流转非法返回 S4001。
3. 权限失败返回 P4031。
4. 所有失败必须写审计日志。

### 5.9 测试点

1. 五类规则正确性。
2. blocking 与 warning 区分。
3. 非法流转阻断。
4. 热加载切换一致性。

### 5.10 与事件运行时衔接

本节补充事件模型的数据面与控制面衔接，满足本期 P0 评论项。

事件相关表：

| 表名 | 关键字段 | 说明 |
| --- | --- | --- |
| event_type_registry | event_type, model_def_id, payload_schema, version | 事件类型注册 |
| event_subscription_registry | id, event_type, target_type, target_ref, is_active | 订阅注册 |
| event_dispatch_log | id, event_type, event_id, target_ref, result, error_code, created_at | 派发日志 |

运行时流程：

1. 状态机或技能发布领域事件。
2. 按 event_type 在 event_subscription_registry 解析订阅目标。
3. 若目标不可解析，记录 E4041 并阻断该订阅执行。
4. 对每个订阅执行处理并写 event_dispatch_log。
5. 订阅执行失败返回 E5001；不允许静默丢弃。

事务关系：

1. 主事务与订阅处理关系在实现中可配置为同步或事务后异步。
2. 若异步，必须提供补偿与告警。

## 6. 横切设计

### 6.1 可观测性

1. trace_id 贯通 API、编排、技能、规则、状态机、事件。
2. 指标：请求耗时、工具失败率、自愈成功率、规则拦截率、流转失败率、订阅失败率。

### 6.2 安全性

1. API 与技能路径均执行认证授权。
2. 工具参数执行白名单和结构校验。
3. 查询工具只读保护。
4. 关键写操作二次确认可配置。

说明：前端 Token 存储、CSRF 策略、对话接口认证细节在前端/网关 LLD 定义。

### 6.3 可测试性

1. 依赖注入与替身对象支持单测。
2. 单元测试覆盖规则、状态机、事件派发关键逻辑。
3. 集成测试覆盖模型发布、查询执行、写入执行三条链路。

## 7. 与实施计划 M3 对齐

M3 核心闭环映射：

1. 编排器主链路：第 4 章。
2. 规则与状态机执行：第 5 章。
3. 事件运行时最小闭环：第 5.10 节。
4. M3 验收测试映射：4.10、5.9、6.3。

## 8. 技术栈实现画像（非需求强制）

本节属于实现画像，不回写为需求强制条款：

1. 后端可采用 Flask Blueprint 模块化。
2. 可使用依赖注入组件提升可测试性。
3. 数据库采用 MySQL 画像并加强索引和事务边界控制。
4. 前端可采用 Vue3 + 状态管理实现动作协议消费。

## 9. 开发任务建议

### 9.1 P0

1. 元模型发布和快照服务。
2. 编排器主链路。
3. 规则和状态机执行器。
4. 事件注册、订阅解析、派发日志最小闭环。

### 9.2 P1

1. 规则热加载低中断刷新。
2. 自愈链路观测增强。
3. 事件异步派发和补偿策略。

### 9.3 P2

1. 高级策略模板。
2. 运维可视化增强。
3. 专题 LLD 卷二补齐未覆盖模块。

## 10. 验收清单（LLD 级）

1. 已覆盖与未覆盖模块边界明确。
2. 三个核心模块接口、数据结构、错误码冻结。
3. /api/chat/retry 与自动自愈计数语义明确。
4. 规则与状态机与元模型单一事实来源关系明确。
5. 事件注册、订阅解析、失败路径可实现且可观测。
6. 与 HLD 关键约束一致，无越权写入路径。

## 11. 审阅意见采纳结果

### 11.1 已采纳（P0/P1）

1. 增加 HLD 组件覆盖映射与未覆盖清单。
2. 增加事件运行时衔接小节。
3. 增加事件错误码与运行时失败路径。
4. 澄清 /api/chat/retry 与自动自愈关系。
5. 澄清规则和状态机与元模型单一事实来源关系。
6. 增加安全章节中前端/网关细节的外部引用。
7. 将实施计划引用改为文件引用形式，避免版本歧义。

### 11.2 后续处理（P2）

1. API 网关、工具执行器、前端交互层、生成器专题 LLD。
2. 复杂事件重试、死信与跨进程总线。
