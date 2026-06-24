# Backlog Sprint B — 已完成

**日期**：2026-03-28（文档更新）  
**范围**：《开发Backlog》**B-005～B-009** + **AI-001～AI-004**（编排层模块化，非真实 LLM）。  
**状态**：**已完成**（实现 + 验收测试）。

---

## 交付对照

| ID | 内容 | 主要代码位置 |
| --- | --- | --- |
| **B-005** | 规则 / 状态机 / 事件注册与订阅运行时索引；发布后 `rebuild_runtime_indexes()` | `app/services/runtime_index.py` |
| **B-006** | 五类规则 kind 与求值顺序（`KIND_ORDER`）；blocking 阻断；`field_level` / `cross_field` 等 | `app/services/rule_evaluator.py` |
| **B-007** | `POST /api/domain/validate-and-transition` → `validate_and_transition`；无 SM 时规则+合并；有 SM 时流转 + `emit` | `app/api/domain.py`, `app/services/transition_service.py` |
| **B-008** | 进程内订阅派发；`echo_skill` 示例；**E4041**（技能未注册）、**E5001**（执行失败/异常）；`event_dispatch_log` | `app/services/event_dispatcher.py` |
| **B-009** | `audit_log` + `write_audit`；关键路径 `trace_id` / `user_id` / `session_id` / `error_code` | `app/services/audit_log_service.py`, `app/models/runtime.py` |
| **AI-001** | 会话上下文与快照引用 | `app/services/orchestration.py` → `get_session_context` |
| **AI-002** | 意图分析（查询/写入/导航/分析等） | `app/services/orchestration.py` → `analyze_intent` |
| **AI-003** | 基于快照的流程计划（流程模型步或默认步） | `app/services/orchestration.py` → `build_process_plan` |
| **AI-004** | 工具路由（query/skill/ui/chart/direct 等） | `app/services/orchestration.py` → `route_tools`；`app/services/tool_executor.py` |
| **AI-005** | `chat/execute` 响应拼装（与 Sprint C 扩展的 `tool_results`、动作等衔接） | `app/api/chat.py` |

---

## 验收测试

专项：`tests/test_sprint_b_acceptance.py`（B-006 顺序、B-008 E4041/E5001、B-009 审计字段、AI 编排字段等）。

全量：

```bash
cd D:\AI\Ontology\Cursor\backend
python -m pytest tests -q
```

**当前：`39 passed`**（以仓库为准；明细见 `D:\AI\Ontology\1933测试通过.md`）。

其它相关用例分散在：`tests/test_domain_and_indexes.py`、`tests/test_meta_models.py`、`tests/test_chat.py`、`tests/test_backlog_c.py` 等。

---

## 本 Sprint 明确不包含（后续迭代）

| ID | 说明 |
| --- | --- |
| B-010 | 规则热加载低中断（见 Sprint C / `BACKLOG-SPRINT-C.md`） |
| B-011 | 事件异步队列（见 Sprint C） |
| AI-006～008 | 自愈、LLM 降级等与工具链深度集成（部分已在后续 Sprint 实现） |
| FE / QA | 独立前端 Backlog、E2E 用例集（见 `BACKLOG-SPRINT-FE.md` 与 QA 清单） |

---

## 修订记录

| 日期 | 说明 |
| --- | --- |
| 2026-03-28 | 初稿：已实现清单 + 13 passed |
| 2026-03-28 | **结案**：补充代码路径、专项验收用例、全量 **38 passed**；Sprint B 标为已完成 |
