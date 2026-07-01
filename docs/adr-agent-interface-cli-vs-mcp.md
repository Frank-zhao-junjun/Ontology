# ADR：Agent 接口选择 — MCP Server vs CLI

| 字段 | 值 |
|------|-----|
| **状态** | 提议 |
| **日期** | 2026-06-30 |
| **范围** | 架构/生态决策，面向各种 Agent Runtime 提供建模接口 |
| **触发** | 项目当前建模操作已半形式化（chat-actions 执行器、校验器、compiler、Excel 导入导出），状态在浏览器（Zustand + localStorage） |

---

## Context

Project 1 (Ontology) 是一个本体建模工具（Next.js/React/TypeScript），核心架构 A→B→C→EPC 业务树 + E1-E8 八维要素库。当前状态：

- 建模操作已半形式化 — chat-actions 执行器、校验器、compiler、Excel 导入导出、80+ API 路由
- 状态全在浏览器（Zustand + localStorage），无服务端持久化
- 已配置 30+ Agent Runtime（.cursor, .claude, .codex, .hermes, .continue, .windsurf, .roo, .junie 等）
- 已有 MCP 交互设计文档（`docs/mcp-agent-ontology-interaction.md`，11 类场景 + 9+ Tool 草案）
- PRD 明确定位：「平台通过 **MCP Server** 向 Agent 暴露本体能力」
- 尚无 MCP Server 实现或 CLI 工具

**核心问题**：下一步向 Agent 生态暴露建模能力，应优先建设 **MCP Server** 还是 **CLI 工具**？

---

## Decision

### 结论：主攻 MCP Server，CLI 为辅助（Phase 2+）

**MCP 是战略主方向 — 在 Phase 1 立即建设。**

CLI 是有价值的辅助工具，但应在 Phase 2 之后再做，且其核心逻辑应与 MCP Server 共享同一 lib 层。

---

## 依据

### 1. 架构定位：PRD 已明确 MCP 是第一公民

PRD §1 产品定位原文：「平台通过 **MCP Server** 向 Agent 暴露本体能力，使 LLM 在理解业务、制定计划、执行动作、解释结论和沉淀经验时，**必须以本体作为语义标准**。」

这意味着 MCP 不是可选增值功能，而是产品架构的核心契约。在 PRD 已经定义了这个方向之后再转向 CLI，属于架构后退。

### 2. Agent Runtime 生态：MCP 是公认标准，CLI 不是

**MCP 支持矩阵：**

| Runtime | MCP 原生支持 | CLI 调用能力 | 备注 |
|---------|:---:|:---:|------|
| Claude Desktop | ✅ 内建 | ❌ 不支持 | Anthropic 官方 MCP Host |
| Cursor | ✅ Agent 模式 | ❌ Cursor 内部不会拉 CLI | MCP 直接在 Cursor 内展示结果 |
| Cline | ✅ tools | ❌ | MCP tool 调用，CLI 需要 custom_tool |
| Codex | ✅ 内建 | ❌ 不支持 | Codex 原生 MCP |
| Windsurf | ✅ 内建 | ❌ | |
| Continue.dev | ✅ | ✅ 有限 | 支持 custom command，但语义差 |
| Goose | ✅ | ✅ 有限 | |
| Claude Code | ✅ | ✅ 但需 pty | MCP 直接返回结构化 JSON |
| 自定义 Agent | ✅ 普遍 | ✅ 但有成本 | MCP 一个 adapter 搞定，CLI 需 parse stdout |

**关键对比：CLI 的 stdout/stderr 无法保证结构化**。Agent 需要从自由文本中抽取结果（高风险、不稳定），而 MCP 返回原生 JSON。对于本体建模这种需要精确结构化交互（概念 ID、实体属性、规则条件）的场景，CLI 的文本解析管道是脆弱点。

### 3. 有状态 vs 无状态：建模工作流天然需要状态

本体建模是**多轮迭代过程**：

- 创建概念 → 检查关联 → 调整属性 → 校验规则 → 确认版本
- 多次引用同一个实体（指代消解、上下文继承）
- draft/confirmed/archived 状态管理

**MCP 的优势：**
- 会话级别的 `conversationId` 上下文
- Resources 直接暴露实体 ID（可引用、无冗余）
- Tools 调用结果可被下轮对话引用
- Agent 无需在 prompt 中传递完整状态快照

**CLI 的劣势：**
- 每次调用是独立进程，状态需通过文件或环境变量传递
- 建模检查点需要手动 `save` / `export` / `load`
- 多步 Agent 流程需要维护外部状态文件，推理复杂度大增

状态在浏览器是一个**独立性约束** — MCP Server 和 CLI 都面临这个问题：
- MCP 方案：MCP Server 作为 Next.js 的 sidecar/同一进程，可访问 in-memory Zustand 快照；或操作 `OntologyProject` JSON 对象
- CLI 方案：必须从文件读取完整状态，写回文件，更多磁盘 IO 和解析错误面

MCP 的 sidecar 模式更优雅地解决了这个问题。

### 4. 治理和安全：MCP 的 tool-level guardrails 是原生优势

PRD §5.7 定义了五层治理检查点，直接对应 MCP 能力：

| 治理检查点 | MCP 映射 | CLI 映射 |
|------------|----------|----------|
| Object Visibility Check | Resource 裁剪 | 输出过滤（无标准机制） |
| Action Executability Check | Tool 白名单 | 命令权限（容易绕过） |
| Field Visibility Check | Schema 字段过滤 | 输出脱敏（必须在 CLI 侧做，难统一） |
| Tool Manifest Pruning | 按 Agent 身份生成专属 tools | 不支持（CLI 权限是操作系统的） |
| Request Boundary Validation | MCP transport 层拦截 | 需要通过 CLI wrapper 做 |

**MCP 可以在传输层做前置治理**：
- 在 MCP server 中根据 `agentId` 查询其角色权限
- 动态裁剪暴露的 tools 和 resources
- 所有调用统一通过 `mcp.callTool` 接口，治理逻辑集中在一点

**CLI 的治理难题**：
- Agent 运行在用户本地，权限等于用户权限
- 无法做 agent-level 的 tool 裁剪
- 无法做调用审计（stdout/stderr 没有标准调用链追踪）
- 需要在每个 CLI 子命令中嵌入治理检查 — 分散且容易遗漏

### 5. 现有代码资产的可复用性

项目已有：
- **80+ API 路由** 实现了大部分本体操作（projects CRUD, Excel, chat, agent skills, manifest compiler）
- **lib 层纯函数** 覆盖校验、编译、推导、一致性检查
- **完整的 Interaction Design**（docs/mcp-agent-ontology-interaction.md，11 场景 + 9 Tool）

**MCP Server 的核心工作**是一个轻量适配层：
```
MCP Tool → 调用 Next.js API Route → 返回结构化 JSON
```
或更直接：
```
MCP Tool → 调用 lib 层纯函数 → 返回结构化 JSON
```

这条路径增量成本低。现有 API 路由的设计意图已经假设了 MCP 客户端调用。

**CLI 的核心工作**：
- 需要独立 CLI 框架（commander/yargs）
- 需要从文件或 stdin 读取状态（额外序列化开销）
- CLI 子命令和 API 路由之间产生维护两份接口的开销

### 6. Agent 配合度生态

项目根目录有 **30+ Agent Runtime 配置目录**（.claude, .cursor, .codex, .continue, .windsurf, .roo, .hermes 等）。这些配置的核心模式是什么？

- 大部分配置了 `.mcp.json` 或等效的 MCP 服务发现
- 大部分有 skills / custom commands 机制
- **但只有 MCP 是跨 Runtime 的标准协议**

这意味着写一个 MCP Server，30 个 Runtime 都可以用。写一个 CLI，需要在每个 Runtime 中单独配置 custom command + stdout parser。

---

## 反面论点与反驳

### 论点 A：「CLI 更简单，MCP 太重了」

**反驳**：对于单机脚本（`build`, `test`, `lint`），CLI 确实更简单。但这些是 **开发工具**，不是 **Agent 接口**。Agent 需要的本体建模接口是结构化的（概念 ID、实体属性、规则条件、版本约束）—— 不是简单的 yes/no 输出。

把「建一个 CLI 子命令」和「建一个 MCP tool」做对比：
- CLI 子命令：需要参数解析、stdout format、错误码 + stderr
- MCP tool：JSON Schema 定义参数 → 填充逻辑 → 返回 JSON

MCP tool 在参数校验和返回结构上更有保障。

### 论点 B：「CLI 可以 pipeline 化」

**反驳**：pipeline（`ontology validate | ontology compile | ontology export`）对 CI/CD 有用。但这是 Phase 2+ 场景。Phase 1 的核心是让 AI Agent 能在建模过程中做查询、校验和增量编辑——这是一个交互式场景，不是批处理场景。

### 论点 C：「MCP 协议还在演进，可能不稳定」

**反驳**：MCP 已经是 Claude Desktop、Cursor、Cline、Codex 等主流 Runtime 的标准协议，2025-2026 生态爆发式增长。等待「协议稳定」等于等待市场成熟，但市场已经成熟。当前 MCP 2025-03-26 draft 已经稳定可生产。

---

## 分阶段落地建议

### Phase 1（立即 — 高价值低风险，估 1-2 sprints）

**目标**：MCP Server MVP 上线，支持 Claude Desktop / Cursor / Cline 直接调用。

| 交付 | 说明 | 工作量 |
|------|------|--------|
| MCP Server 基础设施 | 基于 `@modelcontextprotocol/sdk` or 自建 HTTP transport；在 Next.js 中作为 sidecar 或独立进程运行 | ~2-3天 |
| 核心 Tools（5-8 个） | `ontology_query`（概念查询）、`ontology_validate`（计划/规则验证）、`ontology_export`（Manifest 生成）、`ontology_semantic_check`（语义查询）、`ontology_explain_trace`（路径回溯）、`ontology_reason`（规则推理） | ~3-5天 |
| 适配层 | 复用现成 lib 纯函数 + API 路由，不重复造轮子 | ~1天 |
| Claude Desktop 验证 | 配置 `claude_desktop_config.json`，测试 5 个典型场景 | ~0.5天 |
| Cursor/Cline 验证 | 测试 Agent 模式下调用 | ~0.5天 |
| **小计** | | **~7-10天** |

### Phase 2（短期 — 有状态 + 治理，估 2-3 sprints）

**目标**：MCP Server 生产化，支持身份认证、治理裁剪、有状态会话。

| 交付 | 说明 |
|------|------|
| 会话管理 | `conversationId` → 维护对话上下文、实体绑定、指代消解 |
| 身份认证 API Key | MCP Server 请求头校验 `x-api-key` |
| Agent Manifest 生成 | 根据权限策略动态裁剪 tools/resources |
| 审计日志 | 每次 tool 调用的 requestId/Agent/tool/params/timestamp 持久化 |
| 写入类 Tool 审批流 | `ontology_learn_case` `ontology_concept_evolve` 的审批机制 |
| Resources 暴露 | 将本体实体/概念作为 `ontology://concept/{id}` Resource 暴露 |

### Phase 3（中期 — CLI 辅助工具，估 1 sprint）

**目标**：CI/CD 场景的 CLI 工具，核心逻辑与 MCP Server 共享 lib 层。

| 交付 | 说明 |
|------|------|
| CLI 框架 | 基于 `commander` + `tsup` 构建 |
| `ontology validate` | 校验本体 JSON 文件的完整性 |
| `ontology compile` | 编译本体 → Manifest |
| `ontology lint` | 运行 W-EPC 规则集合 |
| `ontology export` | 导出本体为 Excel / JSON / Markdown |
| `ontology import` | Excel → 本体 JSON |
| shared-core | 以上所有命令调用与 MCP Server 相同的 `src/lib/*` 纯函数 |

### Phase 4（长期 — 平台化）

**目标**：ontology-platform（Project 2）服务端持久化，MCP Server 成为主要 API 面。

| 交付 | 说明 |
|------|------|
| 服务端状态 | PostgreSQL 替代 localStorage |
| MCP Server 独立部署 | 不再依赖 Next.js，作为独立 Node.js 进程 |
| 多 Agent 会话管理 | 同一本体被多个 Agent 并发访问 |
| CLI 升级 | 支持远程调用平台 API（而不仅是本地 JSON 文件） |

---

## 分阶段交付路线图

```
Phase 1 (1-2 sprints)            Phase 2 (2-3 sprints)         Phase 3 (1 sprint)            Phase 4
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐      ┌────────────────────┐
│ MCP Server MVP      │    │ MCP Server 生产化    │    │ CLI 辅助工具     │      │ 平台化              │
│                     │    │                     │    │                 │      │                    │
│ 5-8 Tools           │───▶│ 会话管理 + 审计      │───▶│ validate/compile │───▶ │ 服务端持久化         │
│ Claude/Cursor/Cline │    │ 认证 + 治理裁剪      │    │ lint/export     │      │ 独立 MCP 部署       │
│ 共享 lib 纯函数     │    │ 资源暴露(新)        │    │ shared-core     │      │ 多 Agent 并发       │
│                     │    │ 审批流               │    │                 │      │                    │
└─────────────────────┘    └─────────────────────┘    └─────────────────┘      └────────────────────┘
        ─ ─ ─ ─ ─ ─ ─ ─ ─     ─ ─ ─ ─ ─ ─ ─ ─ ─     ─ ─ ─ ─ ─ ─ ─ ─        ─ ─ ─ ─ ─ ─ ─ ─ ─
        价值核心：Agent 直接    价值核心：企业级治理    价值核心：CI/CD         价值核心：平台级 SLA
        调用本体建模            可追溯、可管控        自动化
```

---

## Consequences

### 正面

1. **与 PRD 架构一致** — MCP 方向已在产品设计中明确，这是执行而不是 pivot
2. **30+ Agent Runtime 一次接入** — MCP 是跨 Runtime 标准协议
3. **结构化交互** — JSON Schema 参数校验 + JSON 返回，Agent 推理稳定可靠
4. **治理原生支持** — tool-level guardrails、动态权限裁剪、审计日志
5. **增量成本低** — 复用现有 lib 层纯函数，MCP Server 是轻量适配层
6. **为平台化铺路** — MCP Server 是 Project 2 (ontology-platform) 的自然的前置

### 负面 / 风险

1. **浏览器状态隔离** — 当前 Zustand 在浏览器内存中，MCP Server 无法直接读取。需要在 MCP Server 侧维护一份状态副本或要求用户在 MCP 操作前先 export/import
2. **Protocol 依赖** — MCP 协议仍在演进，2025-03-26 版本向后兼容但可能有变更
3. **学习成本** — 团队需要学习 MCP SDK（但很薄，一层 adapter）
4. **CLI 延迟** — 纯 CI/CD 场景（无 Agent 参与）要等到 Phase 3

### 浏览器状态问题的缓解方案

该风险可通过以下方式管理：

| 方案 | 说明 | 优先级 |
|------|------|--------|
| ① 内存同步 | MCP Server 作为 Next.js 进程的 sidecar，通过 IPC/共享内存读取 Zustand 快照 | Phase 1 |
| ② HTTP Proxy | MCP Tool 内部调用 `http://localhost:5000/api/*` 同步状态 | Phase 1（推荐） |
| ③ JSON 操作 | MCP Tool 直接操作 `OntologyProject` JSON（export/import 格式） | Phase 2 |
| ④ 服务端状态 | Project 2 引入 PostgreSQL 后消除此问题 | Phase 4 |

推荐方案 **②** — MCP Server 作为 API 路由的代理层，增量成本最小，且与现有 API 路由体系一致。

---

## Alternatives Considered

| 方案 | 放弃原因 |
|------|----------|
| 只做 CLI | 无法满足 30+ Agent Runtime 的交互需求；治理和安全难以落地；与 PRD 方向冲突 |
| 先 CLI 后 MCP | CLI 核心逻辑与 MCP 不共享（CLI 需要文件 IO + stdout 解析，MCP 需要 JSON Schema + HTTP），先做 CLI 反而拖慢 MCP 的上线速度 |
| MCP 和 CLI 同时建设 | Phase 1 资源有限，需要聚焦。MCP 覆盖核心场景后，CLI 复用同一 lib 层，反而更快 |
| 只暴露 HTTP API（不做 MCP）| Agent Runtime 普遍要求 MCP 协议，HTTP API 需要每个 Runtime 写定制 adapter，等于自己造 MCP |

---

## 参考

- [docs/mcp-agent-ontology-interaction.md](./mcp-agent-ontology-interaction.md) — MCP 交互设计（11 场景 + 9 Tool 草案）
- [docs/PRD-本体模型语义行为事件平台-v1.0.md](./PRD-本体模型语义行为事件平台-v1.0.md) — PRD 明确定义 MCP 作为第一接口
- [AGENTS.md](../AGENTS.md) — Agent 配置清单（30+ Runtime）
- [docs/adr-simplified-ontology-model.md](./adr-simplified-ontology-model.md) — 简化架构 ADR
- Model Context Protocol Spec (2025-03-26) — https://spec.modelcontextprotocol.io
