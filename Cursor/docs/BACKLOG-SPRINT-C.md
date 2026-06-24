# Backlog Sprint C（下一批）交付说明

**日期**：2026-03-28  
**范围**：**B-010、B-011**，**AI-005～AI-008**（与 LLD / Backlog 对齐的可测实现）。

## 已实现

| ID | 内容 |
| --- | --- |
| **B-010** | `rule_hot_reload.py`：`hot_reload_rules_from_current_snapshot()` 仅重建 `RuleRuntimeIndex`；失败时从内存备份恢复；`POST /api/runtime/rules/refresh` |
| **B-011** | `event_async.py`：进程内 `Queue` + 守护线程 worker 调用 `execute_event_dispatch`；失败写 `audit_log`（`module=event_async`, `action=compensation_needed`）；`POST /api/runtime/events/dispatch-async`（202 + `job_id`） |
| **AI-005** | `tool_executor.py`：`execute_tools` 执行 `query_tool` / `skill_tool` / `ui_action_tool` / `chart_tool` / `direct_response_tool` 桩 |
| **AI-006** | `self_healing.py`：`run_with_self_healing`，默认可重试 2 次（共 3 次尝试）；消息含 **`flaky_tool`** 时模拟两次 `RetriableError` 后成功；失败 **A5001** |
| **AI-007** | 与自动自愈分离：`/api/chat/retry` 仍为手动重放（**A4092**），逻辑未合并入自动重试计数 |
| **AI-008** | 请求头 **`X-LLM-Available: false`** 时返回降级：`degraded: true`，`actions` 含 `SHOW_UI_ONLY` |

## 其它调整

- `runtime_index.rebuild_rule_indexes_only` + `rebuild_runtime_indexes` 复用 `_insert_rule_rows_from_models`。
- **测试环境** `TestConfig` 使用**临时目录下文件 SQLite**（非 `:memory:`），以便与异步事件 worker **共享同一库**。

## 验证

```bash
cd D:\AI\Ontology\Cursor\backend
python -m pytest tests -v
```

当前：**18 passed**。

## 未纳入

- **AI-009** 修正链指标、**B-012** 生成器编排、**FE/QA** 泳道。
