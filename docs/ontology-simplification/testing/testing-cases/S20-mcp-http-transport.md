# US-MCP-HTTP: Testing Cases — MCP Server HTTP Transport

> 日期: 2026-07-01
> 对应 Spec: [ralph-loop-mcp-http-transport.md](../ralph-loop-mcp-http-transport.md)
> 测试文件: `tests/unit/mcp-*.spec.ts` · `tests/integration/api-mcp-*.spec.ts` · `tests/e2e/mcp-*.e2e.spec.ts`

---

## 使用说明

- 每个 TC 使用 **Given / When / Then** 格式，先于 Coding 合入
- `实现状态`: `✅ 已实现` · `🟡 待实现` · `— N/A`
- 实现后更新本文档状态列

---

## Story-01: MCP HTTP Transport 端点

### TC-S01-01: MCP initialize 握手

**Given**:
- 部署服务运行在 `http://localhost:${DEPLOY_RUN_PORT}`
- `/api/mcp` 路由已注册

**When**: `POST /api/mcp` body:
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}
```

**Then**:
- HTTP 200
- 响应头包含 `Mcp-Session-Id`（非空字符串）
- 响应 body `result.protocolVersion` === `"2025-03-26"`
- 响应 body `result.serverInfo.name` === `"ontology-mcp"`

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-http.spec.ts` → `it('should initialize MCP session')`

---

### TC-S01-02: tools/list 返回 8 个工具

**Given**:
- 已通过 TC-S01-01 获得有效 `Mcp-Session-Id`

**When**: `POST /api/mcp` body:
```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

**Then**:
- HTTP 200
- `result.tools` 数组长度 === 8
- 工具名包含: `list_projects`, `get_project`, `create_project`, `export_project`, `add_value_domain`, `add_capability`, `add_scenario`, `add_epc_process`（或 `create_chain`）

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-http.spec.ts` → `it('should list 8 MCP tools')`

---

### TC-S01-03: resources/list 返回 4 个资源

**Given**:
- 已通过 TC-S01-01 获得有效 `Mcp-Session-Id`

**When**: `POST /api/mcp` body:
```json
{"jsonrpc":"2.0","id":3,"method":"resources/list","params":{}}
```

**Then**:
- HTTP 200
- `result.resources` 数组长度 === 4
- 资源 URI 前缀包含 `ontology://`

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-http.spec.ts` → `it('should list 4 MCP resources')`

---

### TC-S01-04: prompts/list 返回 2 个提示词

**Given**:
- 已通过 TC-S01-01 获得有效 `Mcp-Session-Id`

**When**: `POST /api/mcp` body:
```json
{"jsonrpc":"2.0","id":4,"method":"prompts/list","params":{}}
```

**Then**:
- HTTP 200
- `result.prompts` 数组长度 === 2
- 提示词名称包含已知定义（如 `copilot-domain-modeling`, `copilot-full-build`）

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-http.spec.ts` → `it('should list 2 MCP prompts')`

---

### TC-S01-05: 无效 session 返回错误

**Given**:
- `/api/mcp` 路由要求有效 `Mcp-Session-Id`

**When**: `POST /api/mcp` header `Mcp-Session-Id: invalid-session-id`，body:
```json
{"jsonrpc":"2.0","id":5,"method":"tools/list","params":{}}
```

**Then**:
- HTTP 400 或 406
- 响应 body 包含错误信息（session not found / invalid session）

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-http.spec.ts` → `it('should reject invalid session')`

---

### TC-S01-06: DELETE 关闭会话

**Given**:
- 已通过 TC-S01-01 获得有效 `Mcp-Session-Id`

**When**: `DELETE /api/mcp` header `Mcp-Session-Id: <valid-id>`

**Then**:
- HTTP 200
- 后续使用相同 session-id 的请求返回错误

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-http.spec.ts` → `it('should close session on DELETE')`

---

### TC-S01-07: CORS 头正确

**Given**:
- `/api/mcp` 路由配置了 CORS

**When**: `OPTIONS /api/mcp` header `Origin: https://example.com`

**Then**:
- HTTP 204 或 200
- 响应头包含 `Access-Control-Allow-Origin: *`
- 响应头包含 `Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS`
- 响应头包含 `Access-Control-Allow-Headers: Content-Type, Mcp-Session-Id`

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-http.spec.ts` → `it('should return CORS headers')`

---

## Story-02: 双 Transport 适配

### TC-S02-01: Stdio 模式正常运行

**Given**:
- 环境变量 `MCP_TRANSPORT` 未设置或为 `stdio`

**When**: 运行 `npx tsx packages/ontology-mcp/src/index.ts`

**Then**:
- 进程正常启动
- stdout 输出 `Ontology MCP Server running on stdio`
- 通过 stdin 发送 JSON-RPC `initialize` 可获得正常响应

**实现状态**: 🟡
**测试映射**: `tests/unit/mcp-transport.spec.ts` → `it('should run in stdio mode by default')`

---

### TC-S02-02: HTTP 模式正常启动

**Given**:
- 环境变量 `MCP_TRANSPORT=http`

**When**: 运行 `npx tsx packages/ontology-mcp/src/index.ts`

**Then**:
- 进程正常启动
- stdout 输出 `Ontology MCP Server running on HTTP at http://localhost:<port>/api/mcp`
- 监听端口可接收 HTTP 请求

**实现状态**: 🟡
**测试映射**: `tests/unit/mcp-transport.spec.ts` → `it('should run in http mode')`

---

### TC-S02-03: createMcpServer 返回有效 Server 实例

**Given**:
- `createMcpServer()` 函数已导出

**When**: 调用 `createMcpServer()`

**Then**:
- 返回对象包含 `server` 属性（MCP Server 实例）
- `server` 可注册任意 transport（stdio 或 HTTP）
- Server 注册了 8 Tools + 4 Resources + 2 Prompts

**实现状态**: 🟡
**测试映射**: `tests/unit/mcp-server.spec.ts` → `it('should create server with all tools/resources/prompts')`

---

## Story-03: Tools 数据层对接

### TC-S03-01: list_projects 返回服务端数据

**Given**:
- `ONTOLOGY_API_BASE` 指向部署服务
- 服务端 `/api/mcp/projects` 已有 1 个项目

**When**: 通过 MCP `tools/call`:
```json
{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"list_projects","arguments":{}}}
```

**Then**:
- HTTP 200
- `result.content[0].text` 是合法 JSON
- 解析后包含 1 个项目
- 项目数据与 `/api/mcp/projects` GET 返回一致

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-tools.spec.ts` → `it('should list projects from server')`

---

### TC-S03-02: create_project 写入服务端

**Given**:
- `ONTOLOGY_API_BASE` 指向部署服务
- 服务端当前无项目

**When**: 通过 MCP `tools/call`:
```json
{"jsonrpc":"2.0","id":11,"method":"tools/call","params":{"name":"create_project","arguments":{"name":"测试项目","domain":"离散制造","description":"MCP创建"}}}
```

**Then**:
- HTTP 200
- `result.content[0].text` 包含 `created` 或项目 ID
- 后续 `list_projects` 返回新项目
- 后续 `GET /api/mcp/projects/<id>` 返回完整项目数据

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-tools.spec.ts` → `it('should create project on server')`

---

### TC-S03-03: add_value_domain 写入服务端

**Given**:
- 服务端已有项目 `proj-1`
- 项目 `proj-1` 当前无价值域

**When**: 通过 MCP `tools/call`:
```json
{"jsonrpc":"2.0","id":12,"method":"tools/call","params":{"name":"add_value_domain","arguments":{"projectId":"proj-1","name":"生产管理","description":"生产管理价值域"}}}
```

**Then**:
- HTTP 200
- `GET /api/mcp/projects/proj-1` 返回项目数据中 `valueDomains` 长度 === 1
- 新价值域 `name` === `"生产管理"`

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-tools.spec.ts` → `it('should add value domain to server project')`

---

### TC-S03-04: get_project 返回完整数据

**Given**:
- 服务端已有项目 `proj-1`，含价值域和能力

**When**: 通过 MCP `tools/call`:
```json
{"jsonrpc":"2.0","id":13,"method":"tools/call","params":{"name":"get_project","arguments":{"projectId":"proj-1"}}}
```

**Then**:
- HTTP 200
- `result.content[0].text` 是合法 JSON
- 包含 `valueDomains`、`capabilities` 字段
- 数据与 `GET /api/mcp/projects/proj-1` 一致

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-tools.spec.ts` → `it('should get project details')`

---

### TC-S03-05: export_project 返回项目 JSON

**Given**:
- 服务端已有项目 `proj-1`

**When**: 通过 MCP `tools/call`:
```json
{"jsonrpc":"2.0","id":14,"method":"tools/call","params":{"name":"export_project","arguments":{"projectId":"proj-1"}}}
```

**Then**:
- HTTP 200
- `result.content[0].text` 是合法 JSON
- 包含 `name`、`domain`、`valueDomains` 等完整字段

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-tools.spec.ts` → `it('should export project')`

---

### TC-S03-06: ONTOLOGY_API_BASE 未设置时返回错误

**Given**:
- 环境变量 `ONTOLOGY_API_BASE` 未设置

**When**: 通过 MCP `tools/call`:
```json
{"jsonrpc":"2.0","id":15,"method":"tools/call","params":{"name":"list_projects","arguments":{}}}
```

**Then**:
- HTTP 200（MCP 协议层正常返回）
- `result.isError` === `true`
- `result.content[0].text` 包含 `ONTOLOGY_API_BASE` 错误信息

**实现状态**: 🟡
**测试映射**: `tests/unit/mcp-store.spec.ts` → `it('should error when ONTOLOGY_API_BASE not set')`

---

## Story-04: 文档与配置

### TC-S04-01: .mcp.json HTTP 模式配置

**Given**:
- 文档已更新

**When**: 读取 `.mcp.json`

**Then**:
- 包含 `"url"` 字段或 HTTP 配置示例
- 包含注释说明 `ONTOLOGY_API_BASE` 需替换为实际域名

**实现状态**: 🟡
**测试映射**: 手动验证

---

### TC-S04-02: 首页 ServiceEntry MCP 卡片更新

**Given**:
- 首页渲染了 4 张服务入口卡片

**When**: 查看 MCP Server 卡片

**Then**:
- 配置示例为 URL 方式（非 command 方式）
- 包含 `https://域名.coze.site/api/mcp` 示例

**实现状态**: 🟡
**测试映射**: 手动验证

---

## Story-05: 端到端验证

### TC-S05-01: 完整 MCP 协议流程

**Given**:
- 部署服务运行中
- `/api/mcp` HTTP transport 可用

**When**: 依次执行:
1. `initialize` → 获得 session-id
2. `tools/list` → 获得 8 工具
3. `tools/call` `create_project` → 创建项目
4. `tools/call` `list_projects` → 确认项目存在
5. `tools/call` `add_value_domain` → 添加价值域
6. `tools/call` `get_project` → 确认价值域存在
7. `resources/list` → 获得 4 资源
8. `prompts/list` → 获得 2 提示词

**Then**:
- 每步均返回 HTTP 200
- 步骤 3 创建的项目在步骤 4 可查
- 步骤 5 添加的价值域在步骤 6 可查
- 步骤 7 返回 4 个资源
- 步骤 8 返回 2 个提示词

**实现状态**: 🟡
**测试映射**: `tests/e2e/mcp-http-golden-path.e2e.spec.ts` → `it('should complete full MCP protocol flow')`

---

### TC-S05-02: 并发会话隔离

**Given**:
- `/api/mcp` 支持多会话

**When**: 同时创建 2 个 session（session-A, session-B），各自调用 `tools/list`

**Then**:
- 两个 session 独立工作
- 互不影响
- 各自返回完整的 8 工具列表

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-concurrent.spec.ts` → `it('should isolate concurrent sessions')`

---

### TC-S05-03: 互联网跨域访问

**Given**:
- 部署在 `coze.site` 域名
- CORS 已配置

**When**: 从不同 Origin（如 `https://cursor.com`）发送 `POST /api/mcp`

**Then**:
- 响应头 `Access-Control-Allow-Origin` 允许跨域
- MCP 协议响应正常

**实现状态**: 🟡
**测试映射**: `tests/integration/api-mcp-cors.spec.ts` → `it('should allow cross-origin access')`

---

## 汇总

| TC ID | Story | 场景 | 关键断言 | 状态 |
|-------|-------|------|----------|------|
| TC-S01-01 | S01 | initialize 握手 | protocolVersion + serverInfo | 🟡 |
| TC-S01-02 | S01 | tools/list | 8 个工具 | 🟡 |
| TC-S01-03 | S01 | resources/list | 4 个资源 | 🟡 |
| TC-S01-04 | S01 | prompts/list | 2 个提示词 | 🟡 |
| TC-S01-05 | S01 | 无效 session | 返回错误 | 🟡 |
| TC-S01-06 | S01 | DELETE 关闭会话 | 后续请求失败 | 🟡 |
| TC-S01-07 | S01 | CORS 头 | Allow-Origin * | 🟡 |
| TC-S02-01 | S02 | Stdio 模式 | 正常启动 | 🟡 |
| TC-S02-02 | S02 | HTTP 模式 | 监听端口 | 🟡 |
| TC-S02-03 | S02 | createMcpServer | 8T+4R+2P | 🟡 |
| TC-S03-01 | S03 | list_projects | 返回服务端数据 | 🟡 |
| TC-S03-02 | S03 | create_project | 写入服务端 | 🟡 |
| TC-S03-03 | S03 | add_value_domain | 写入服务端 | 🟡 |
| TC-S03-04 | S03 | get_project | 完整数据 | 🟡 |
| TC-S03-05 | S03 | export_project | 返回 JSON | 🟡 |
| TC-S03-06 | S03 | API_BASE 未设置 | 返回错误 | 🟡 |
| TC-S04-01 | S04 | .mcp.json 配置 | URL 方式 | 🟡 |
| TC-S04-02 | S04 | 首页卡片 | URL 示例 | 🟡 |
| TC-S05-01 | S05 | 完整流程 | 7 步全通过 | 🟡 |
| TC-S05-02 | S05 | 并发会话 | 互不影响 | 🟡 |
| TC-S05-03 | S05 | 跨域访问 | CORS 通过 | 🟡 |

**合计**: 21 个测试用例（7 + 3 + 6 + 2 + 3）

---

## 回归命令

```bash
# 单元测试
pnpm test:unit -- --grep "mcp"

# 集成测试
pnpm test:integration -- --grep "mcp"

# E2E
pnpm test:e2e:smoke -- --grep "mcp"
```
