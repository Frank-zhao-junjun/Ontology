# 本体框架后端（MVP 壳）

## 已实现（自主交付范围）

- Flask 应用工厂、`/health`
- 元模型表：`meta_model_definition`、`meta_model_release`、`meta_model_release_item`、`meta_model_change_log`
- 运行时表（B-005～009）：`rule_runtime_index`、`state_machine_runtime_index`、`domain_entity_state`、`event_*`、`audit_log`、`rule_execution_log`、`state_transition_log` 等
- API：`POST /api/meta-models/validate`、`POST /api/meta-models/definitions`（草稿）、`POST /api/meta-models/publish`、`GET /api/meta-models/snapshots/current`、`POST /api/meta-models/rollback`
- **`POST /api/domain/validate-and-transition`**：统一写路径（规则 → 状态机 → 领域事件派发）
- 结构校验 + 跨模型一致性；**发布后重建运行时索引**
- 进程内快照缓存；发布幂等
- 编排（AI-001～004 桩）：`POST /api/chat/execute` 返回 `intent` / `process_plan` / `routed_tools`；`POST /api/chat/retry`、`GET /api/chat/session/<id>/context`
- 全链路 `X-Trace-Id` 响应头

## 运行测试

```bash
cd D:\AI\Ontology\Cursor\backend
python -m pip install -r requirements.txt
python -m pytest tests -v
```

## 本地启动

```bash
python run.py
```

默认 SQLite 内存库（每次进程新建）。生产可设环境变量 `DATABASE_URL`（如 MySQL）。

### 登录与角色（JWT）

- 首次启动会在库中种子 **4 个账号**（若 `app_user` 表为空）：
  - `admin` / `Admin!dev1`（**admin**）
  - `modeler` / `Modeler!dev1`（**modeler**：发布元模型、运行时管理）
  - `operator` / `Operator!dev1`（**operator**：领域写、对话）
  - `viewer` / `Viewer!dev1`（**viewer**：只读 + 对话，无领域写）
- `POST /api/auth/login` 返回 `access_token`；其它 `/api/*`（除 login）需头：`Authorization: Bearer <token>`。
- **自动化测试**使用 `TestConfig.AUTH_DISABLED=True`，等价管理员，无需 Bearer。
- 仅本地调试想跳过登录时：`set AUTH_DISABLED=1` 后再启动（**勿用于生产**）。

与前端联调时，优先在 **`D:\AI\Ontology\Cursor`** 根目录执行 **`npm run dev`**（同时起本服务 `:5000` 与 Vite `:5173`），见上级 `README.md`。

## Sprint C（B-010 / B-011 + AI-005～008）

- `POST /api/runtime/rules/refresh`：规则索引热刷新（失败回滚）
- `POST /api/runtime/events/dispatch-async`：进程内异步派发（202）
- `tool_executor` + `self_healing`；`X-LLM-Available: false` 降级
- 详见 `../docs/BACKLOG-SPRINT-C.md`

## 非目标（后续迭代）

- 真实 LLM、真实领域技能、API 网关限流（验证阶段不追求生产级能力）
