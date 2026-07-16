# Ralph Loop：MCP Server 从 Stdio 升级为 HTTP Transport

> 流程：Ralph Loop — 一次一件事，小提交，真实验证，上下文外置。
> 创建日期：2026-07-01
> 关联 ADR：`docs/adr-agent-interface-cli-vs-mcp.md`

## 背景

当前 MCP Server 使用 **Stdio transport**，只能在本地以子进程方式运行。部署在 `coze.site` 域名后，互联网上的 Agent 无法直接接入 MCP Server — 它需要本地安装项目源码并启动 Node.js 子进程。

目标：将 MCP Server 升级为 **Streamable HTTP transport**，作为部署服务的 HTTP 端点暴露出去，互联网上任一 Agent 配置 URL 即可接入。

## 交互模式对比

```
[当前 — Stdio]
Agent (本地) → stdin/stdout → MCP Server (本地子进程)
                                ↓ HTTP fetch
                              Web API (coze.site)

[目标 — HTTP]
Agent (互联网任一位置) → HTTP+SSE → MCP Endpoint (coze.site/api/mcp)
                                   ↓ 内部调用
                                 Web API / Store
```

## 用户故事列表

### Story-01：MCP HTTP Transport 端点

**描述**：在 Next.js 中新增 `/api/mcp` 路由，使用 `@modelcontextprotocol/sdk` 的 `StreamableHTTPServerTransport` 承载 MCP 协议通信。

**验收标准**：
- [ ] `POST /api/mcp` 接受 MCP JSON-RPC 请求（`initialize`、`tools/list`、`tools/call`、`resources/list`、`resources/read`、`prompts/list`、`prompts/get`）
- [ ] `GET /api/mcp` 返回 SSE 流（用于服务端推送）
- [ ] `DELETE /api/mcp` 关闭会话
- [ ] 响应头包含 `Mcp-Session-Id`，支持有状态会话
- [ ] 复用现有 8 Tools + 4 Resources + 2 Prompts 定义
- [ ] 不影响现有 `/api/mcp/projects` CRUD 端点

**优先级**：high
**预估改动文件**：
- 新增 `src/app/api/mcp/route.ts`（HTTP transport 入口）
- 修改 `packages/ontology-mcp/src/index.ts`（抽取 server 创建逻辑为可复用函数）

---

### Story-02：MCP Server 适配双 Transport

**描述**：MCP Server 支持两种 transport 模式 — Stdio（本地开发）和 HTTP（部署），通过环境变量 `MCP_TRANSPORT` 切换。

**验收标准**：
- [ ] `MCP_TRANSPORT=stdio`（默认）→ Stdio 模式，行为不变
- [ ] `MCP_TRANSPORT=http` → 输出 HTTP 端点地址，监听 `DEPLOY_RUN_PORT`
- [ ] `createMcpServer()` 函数返回 Server 实例，transport 由调用方注入
- [ ] `index.ts` 保留 Stdio 入口，新增 HTTP 入口分支

**优先级**：high
**预估改动文件**：
- 修改 `packages/ontology-mcp/src/index.ts`（拆分 `createMcpServer` + `createTransport`）

---

### Story-03：MCP Tools 数据层对接

**描述**：确保 HTTP transport 模式下，8 个 Tools 的数据读写通过 `ONTOLOGY_API_BASE` 调用部署后的 `/api/mcp/projects` 端点，而非本地文件。

**验收标准**：
- [ ] `list_projects` 工具返回服务端项目列表
- [ ] `create_project` 工具创建项目后可通过 `get_project` 查到
- [ ] `add_value_domain` / `add_capability` / `add_scenario` / `add_epc_process` / `create_chain` 工具写入服务端
- [ ] `export_project` 工具从服务端读取项目数据
- [ ] `analyze_completeness` / `analyze_conflicts` 工具从服务端读取数据后分析
- [ ] 所有工具在 `ONTOLOGY_API_BASE` 未设置时返回明确错误

**优先级**：high
**依赖**：Story-01

---

### Story-04：Agent 接入文档与配置示例

**描述**：更新文档，说明部署后互联网 Agent 如何通过 HTTP 接入 MCP Server。

**验收标准**：
- [ ] `.mcp.json` 更新为 HTTP 模式配置示例
- [ ] 首页 ServiceEntry 卡片 MCP 部分更新为 URL 配置方式
- [ ] `docs/mcp-agent-ontology-interaction.md` 补充 HTTP 接入章节
- [ ] `README.md` MCP 章节更新
- [ ] `AGENTS.md` 四类服务章节更新

**优先级**：medium
**依赖**：Story-01, Story-02

---

### Story-05：端到端验证

**描述**：验证 HTTP transport 模式下，外部 Agent 可以通过 URL 接入并执行建模操作。

**验收标准**：
- [ ] `curl -X POST /api/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"initialize",...}'` 返回成功
- [ ] `curl -X POST /api/mcp -d '{"method":"tools/list",...}'` 返回 8 个工具
- [ ] `curl -X POST /api/mcp -d '{"method":"tools/call","params":{"name":"list_projects",...}}'` 返回项目列表
- [ ] `curl -X POST /api/mcp -d '{"method":"resources/list",...}'` 返回 4 个资源
- [ ] `curl -X POST /api/mcp -d '{"method":"prompts/list",...}'` 返回 2 个提示词
- [ ] Lint + TS-check 全部通过

**优先级**：high
**依赖**：Story-01, Story-02, Story-03

## 执行计划

```
Story-01 (MCP HTTP 端点)
    │
    ├──▶ Story-02 (双 Transport 适配)
    │
    ├──▶ Story-03 (Tools 数据层对接)
    │
    ├──▶ Story-04 (文档更新)
    │
    └──▶ Story-05 (端到端验证)
```

每个 Story 对应一次 Ralph Loop 迭代：
1. 取下一个 pending story
2. 标记 in_progress
3. 执行（写代码 + 测试）
4. 验证通过 → completed
5. 验证失败 → failed（允许重试，最多 3 次）

## 进度跟踪

| Story | 状态 | 迭代次数 | 开始时间 | 完成时间 | 备注 |
|-------|------|---------|---------|---------|------|
|| Story-01 | ✅ completed | 1 | 2026-07-01 | 2026-07-01 | MCP HTTP 端点已实现（src/app/api/mcp/route.ts） |
|| Story-02 | ✅ completed | 1 | 2026-07-01 | 2026-07-01 | 双 Transport 适配（stdio via packages + HTTP via api route） |
|| Story-03 | ✅ completed | 1 | 2026-07-01 | 2026-07-01 | Tools 数据层对接（src/lib/mcp/tools.ts 504行） |
|| Story-04 | ✅ completed | 1 | 2026-07-01 | 2026-07-01 | 文档更新已在 Phase 4 完成 |
|| Story-05 | ✅ completed | 1 | 2026-07-01 | 2026-07-01 | 端到端验证通过 |

## 技术参考

- MCP SDK `StreamableHTTPServerTransport`: `@modelcontextprotocol/sdk/server/streamableHttp.js`
- MCP 协议规范: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
- 现有 ADR: `docs/adr-agent-interface-cli-vs-mcp.md`
- 现有 MCP 交互设计: `docs/mcp-agent-ontology-interaction.md`

## 约束

1. 不破坏现有 Stdio transport（本地开发仍可用）
2. 不影响现有 `/api/mcp/projects` CRUD 端点
3. HTTP transport 需处理 CORS（互联网 Agent 跨域访问）
4. 会话管理用 `Mcp-Session-Id` header，服务端用内存 Map 存储
5. 生产环境下 `/tmp/ontology-mcp-store/` 数据可能被清理，需在文档中警示
