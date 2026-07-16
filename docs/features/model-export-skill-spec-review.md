# 模型导出为 Skill 包 — Spec Review 报告

> 评审对象：`docs/features/model-export-skill-spec.md`  
> 关联测试用例：`docs/features/model-export-skill-test-cases.md`  
> 评审时间：2026-07-01  
> 评审结论：**Spec 主体可用，但存在 2 个阻塞级问题 + 6 个必须细化项 + 6 个建议项，需在 PRD 前解决。**

---

## 1. 评审结论

| 维度 | 评分 | 说明 |
|------|:----:|------|
| 功能范围 | ✅ | 5 种格式、4 种接入方式覆盖完整 |
| 数据结构 | 🟡 | Skill 包文件结构清晰，但 ontology.json 生成来源和过滤逻辑待细化 |
| API 设计 | 🟡 | POST 接口基本清晰，但 GET 支持、错误码、请求体来源存在歧义 |
| UI/UX | 🟡 | 入口和流程有描述，但具体布局、弹窗形态、提示文案未定格 |
| Agent 集成 | 🔴 | CLI/MCP/Skill API 与现有代码差异较大，需对齐当前实现 |
| 可测试性 | 🟡 | 32 个测试条目已覆盖，但部分用例依赖未明确的算法 |

**阻塞级问题（PRD 前必须解决）**：
1. **项目数据存储在浏览器 localStorage，服务端 API 无法通过 projectId 获取项目**（当前 `/api/projects/[id]` 无 Supabase 时返回 null）。
2. **MCP 当前没有 `export_project` 工具**，AGENTS.md 描述与实际代码不一致。

---

## 2. 阻塞级问题（🔴）

### 🔴 BP-01：服务端 API 无法获取 localStorage 中的项目数据

**现状**：
- `src/app/api/projects/[id]/route.ts` 在无 Supabase 配置时返回 `{ success: true, data: null }`
- 当前项目数据主要存储在浏览器 `localStorage`（见 AGENTS.md §注意事项第 3 条）
- Spec §6.1 设计的 `POST /api/export/skill` 只传 `projectId`，服务端无法据此拿到完整 `OntologyProject`

**影响**：
- SE-01 新建 `route.ts` 后，如果按 spec 只接收 `projectId`，在没有 Supabase 的环境下会导出失败或空数据
- 现有 `/api/export/xlsx-from-manifest` 之所以可行，是因为它直接接收 `manifest` 数据（请求体），不需要查项目

**建议方案（3 选 1）**：

| 方案 | 做法 | 优点 | 缺点 |
|------|------|------|------|
| **A. 请求体传完整 project（推荐）** | `POST /api/export/skill` 接收 `{ project, scope, includeExamples, includeSemanticLayer }` | 与现有 xlsx-from-manifest 接口一致；不依赖服务端持久化；任何环境可用 | 请求体较大 |
| **B. 服务端持久化 + projectId** | 保持 spec 设计，但要求项目必须先持久化到 Supabase | 与 REST 语义一致 | 与当前 localStorage 架构冲突；需要先做持久化改造 |
| **C. 双模式** | 优先用 project 请求体；若只有 projectId 则尝试服务端查询 | 兼容两种场景 | 实现复杂 |

**评审建议**：**选 A**。Skill 包导出应和 `/api/export/xlsx-from-manifest` 保持一致：前端把完整 project 传给服务端，服务端只做打包，不做数据查询。

**对应测试用例影响**：
- SKILL-U-002 需要改为请求体传 `project` 对象
- SKILL-I-001/002 的「MSW 或真实 store」前提可简化为直接传 fixture project

---

### 🔴 BP-02：MCP 当前没有 `export_project` 工具

**现状**：
- `packages/ontology-mcp/src/tools/project-tools.ts` 只有 3 个工具：`ontology_project_create` / `ontology_project_load` / `ontology_project_list`
- AGENTS.md 描述的 8 个工具（含 `export_project`）与实际代码不一致
- Spec §6.5.2 假设 MCP 已有 `export_project`，实际不存在

**影响**：
- SE-24/SE-25 没有可扩展的基线工具
- 需要新增 `export_project` tool，而不是扩展已有工具

**建议**：
1. 在 `packages/ontology-mcp/src/tools/` 新增 `export-tools.ts`
2. 注册 `ontology_project_export` 工具
3. 处理 5 种格式统一逻辑
4. 同步更新 AGENTS.md §14.2 和 §6.5.2

**对应测试用例影响**：
- SKILL-U-033/034 的目标文件应从 `project-tools.ts` 改为 `export-tools.ts`（或新增）

---

## 3. 必须细化项（🟠）

### 🟠 MP-01：是否支持 GET /api/export/skill？

**现状**：
- Spec §3.1 写「下载接口：`POST /api/export/skill` 或 `GET /api/export/skill?projectId=xxx&scope=all`」
- Spec §6.1 只定义了 POST
- 测试用例 SKILL-U-003 假设 GET 已实现

**问题**：如果选 A 方案（请求体传 project），GET 无法携带大体积 project 数据，GET 支持失去意义。

**建议**：
- 若采用 BP-01 方案 A：**删除 GET 支持**，只保留 POST
- 若坚持 projectId 模式：保留 GET，但需解决 localStorage 问题

---

### 🟠 MP-02：Markdown 格式如何生成？

**现状**：
- 5 种格式中的 `md` 仅在 §6.5.4 表格出现
- 没有说明 md 格式导出的是 Markdown 渲染的 ontology 文档，还是 Manifest Markdown，还是其他

**问题**：
- 当前 `manifest-export-dialog.tsx` 没有 md 选项
- 当前 `src/lib/manifest-export.ts` 只生成 yaml/json
- 没有现成的 md 导出库

**建议**：
- 明确 `md` 格式 = 将 `ontology.json`（按 scope 过滤后）渲染为人类可读的 Markdown 文档
- 新增 `src/lib/skill-export/markdown-renderer.ts` 或复用现有 markdown 工具
- UI 按钮顺序建议：YAML / JSON / XLSX / Markdown / Skill ZIP

---

### 🟠 MP-03：状态字段命名与取值范围不统一

**现状**：
- §7.1 `OntologyProject.status`：`'draft' | 'review' | 'confirmed' | 'archived'`
- §7.1 `Entity.status`：`'draft' | 'confirmed'`
- 其他对象（attribute/relation/stateMachine/rule/event）的 status 类型未定义
- Spec 核心约束是「任何状态均可导出」，但状态值不统一

**问题**：
- `ontology.json` 中不同模型对象的状态字段可能不一致
- 测试中难以判断哪些值合法

**建议**：
- 统一对象级状态类型：`'draft' | 'confirmed' | 'archived' | 'unknown'`
- 项目级状态类型：`'draft' | 'review' | 'confirmed' | 'archived'`
- 在 `src/types/ontology.ts` 中新增 `ObjectStatus` / `ProjectStatus` 类型别名
- 缺失时统一标注为 `'unknown'`

---

### 🟠 MP-04：scope=all 与 includeSemanticLayer=false 的交互关系

**现状**：
- §7.2 scope=all 包含「全部模型 + 组织 + 语义层」
- §6.3 有 `includeSemanticLayer` 参数，默认 true

**问题**：
- 当 `scope=all` 且 `includeSemanticLayer=false` 时，agentSemanticLayer 是否应被排除？
- 同理，`includeExamples=false` 是否影响 examples/ 目录？（这个较明确）
- `includeExamples` 是否也影响 README.md / SKILL.md 中的示例引用？

**建议**：
- `scope` 决定 ontology.json 中五大模型（data/behavior/rule/process/event）的包含范围
- `includeSemanticLayer` 决定 ontology.json 中 `agentSemanticLayer` 是否包含
- `scope=all` + `includeSemanticLayer=false` = 包含五大模型 + organization，但不含语义层
- `includeExamples=false` = ZIP 中不含 `examples/` 目录，README.md / SKILL.md 中仍可文字提及「见 examples/」（因为文件清单里有说明）

---

### 🟠 MP-05：错误响应格式与 HTTP 状态码未统一

**现状**：
- §6.4 失败示例：`{ "success": false, "error": "项目不存在或导出范围为空" }`
- §6.5.3 提到错误码 `PROJECT_NOT_FOUND` / `EMPTY_SCOPE`
- 没有明确 HTTP 状态码映射

**问题**：
- 同一个语义有两种表达：字符串错误 vs 错误码
- 测试中 SKILL-U-023/024/025 期望的状态码和 error 字段不一致

**建议**：统一错误响应格式

```json
{
  "success": false,
  "error": "PROJECT_NOT_FOUND",
  "message": "项目不存在"
}
```

HTTP 状态码映射：

| 场景 | status | error |
|------|--------|-------|
| 项目不存在 | 404 | PROJECT_NOT_FOUND |
| scope 无效 | 400 | INVALID_SCOPE |
| scope 过滤后为空 | 400 | EMPTY_SCOPE |
| 缺少 project 请求体 | 400 | MISSING_PROJECT |
| 服务端内部错误 | 500 | INTERNAL_ERROR |

---

### 🟠 MP-06：intents.json 与 examples/ 的生成算法未定义

**现状**：
- §4.3 描述了 intents.json 结构
- §4.6 描述了 examples/ 目录结构
- 两者都说「基于模型自动生成」，但没有算法

**问题**：
- 不同实现可能生成完全不同的 intents，导致测试不稳定
- 无法判断 AI 消费效果

**建议**：在 spec 中补充生成规则

**intents.json 生成规则（建议）**：
1. 为每个 `Entity` 生成 2 个意图：
   - `query_entity_{nameEn}`：查询实体信息（triggerPhrases: `{name}是什么`、`查询{name}`、`{name}有哪些属性`）
   - `explain_entity_{nameEn}`：解释实体业务含义
2. 为每个 `Relation` 生成 1 个意图：
   - `relation_{sourceEn}_{targetEn}`：`{source}和{target}有什么关系`
3. 为每个 `Rule` 生成 1 个意图：
   - `rule_{id}`：`{name}的规则是什么`
4. 为每个 `StateMachine` 生成 1 个意图：
   - `state_machine_{nameEn}`：`{name}有哪些状态`

**examples/ 生成规则（建议）**：
- query-examples.md：每个 Entity 2 条、每个 Relation 1 条、每个 Rule 1 条
- reasoning-examples.md：每个 StateMachine 1 条、每个 Relation 1 条、交叉规则 1 条

---

## 4. 建议细化项（🟡）

### 🟡 SP-01：UI 弹窗具体形态

**现状**：
- §5.2 流程图说明先选格式 → 再选范围
- 没有明确是「两个弹窗」还是「一个弹窗两步」还是「下拉选择」

**建议**：
- 复用现有 `manifest-export-dialog.tsx` 的按钮组，先扩展为 5 个格式按钮
- 点击 Skill ZIP 后，在当前弹窗底部展开范围选择（RadioGroup 或 Select）
- 确认导出按钮根据当前选择触发不同下载逻辑

---

### 🟡 SP-02：状态提示文案

**现状**：
- §5.3 提示文案示例：「当前项目为 {status} 状态，导出的 Skill 将包含未确认对象」
- 没有 confirmed 状态的文案

**建议**：
- draft/review：「当前项目为 {status} 状态，导出的 Skill 将包含未确认对象，请谨慎使用。」
- confirmed：「当前项目已确认，导出的 Skill 可直接使用。」
- archived：「当前项目已归档，导出的 Skill 仅作历史参考。」

---

### 🟡 SP-03：CLI 导出 skill 的默认输出路径

**现状**：
- Spec §6.5.1 示例：`ontology export <projectId> ./my-skill.zip --format=skill --scope=data`
- 没有说明未提供 outputPath 时的默认文件名

**建议**：
- 默认输出文件名：`ontology-model-skill-{projectName}-v{version}.zip`
- 若无法获取 projectName/version：`project-{projectId}-skill.zip`

---

### 🟡 SP-04：MCP downloadUrl 的生成与有效期

**现状**：
- §6.5.2 返回示例包含 `downloadUrl` 和 `token=xxx`
- 没有说明 token 机制、URL 有效期、路由实现

**建议**：
- 简单方案：downloadUrl 直接为 `POST /api/export/skill` 的公开 URL，调用方再发一次 POST（传 project）下载
- 复杂方案：服务端生成短时效 token，提供 `/api/export/skill/download?token=xxx`
- **推荐简单方案**：MCP 返回 `{ endpoint: '/api/export/skill', method: 'POST', body: {...} }` 或一个一次性下载 URL（无 token，通过 projectId+nonce 简单校验）

---

### 🟡 SP-05：Skill ZIP 下载的文件名响应头

**现状**：
- §6.4 写 `Content-Disposition: attachment; filename="ontology-model-skill-{projectName}-{version}.zip"`
- 与 Q2 确认的命名规则 `ontology-model-skill-{projectName}-v{version}.zip` 不一致（缺少 `v` 前缀）

**建议**：统一为 `ontology-model-skill-{projectName}-v{version}.zip`

---

### 🟡 SP-06：性能验收标准

**现状**：
- US-1 写「导出过程在 3 秒内完成」
- 测试用例中没有对应的性能测试

**建议**：
- 明确测试基准：项目规模（如 50 个实体、200 个属性）
- 在 E2E 或 integration 中增加耗时断言（如 `< 3000ms`）
- 或改为手动验收标准，不写入自动化测试

---

## 5. 代码基线差异

### 5.1 当前已有 vs Spec 要求

| 能力 | 当前实现 | Spec 要求 | 差距 |
|------|---------|----------|------|
| UI 导出 YAML/JSON/XLSX | ✅ `manifest-export-dialog.tsx` | 增加 Markdown + Skill ZIP | 需扩展 |
| 服务端 Excel 导出 | ✅ `/api/export/xlsx-from-manifest` | 增加 `/api/export/skill` | 新增 |
| CLI export json | ✅ `src/cli/index.ts` | 支持 5 种格式 + scope | 扩展 |
| MCP export_project | ❌ 不存在 | 支持 5 种格式 | 新增 |
| Skill API export_manifest | ✅ 仅 xlsx | 支持 5 种格式 | 扩展 |
| Markdown 导出 | ❌ 不存在 | 支持 md 格式 | 新增 |

### 5.2 需要新增/修改的文件清单

```text
新增：
- src/app/api/export/skill/route.ts
- src/lib/skill-export/
  - index.ts              # 主入口
  - build-skill-json.ts   # skill.json 生成
  - build-ontology-json.ts # ontology.json 生成 + scope 过滤
  - build-intents-json.ts  # intents.json 生成
  - build-readme.ts        # README.md 生成
  - build-skill-md.ts      # SKILL.md 生成
  - build-examples.ts      # examples/ 生成
  - annotate-status.ts     # 状态标注
- src/lib/skill-export/markdown-renderer.ts  # md 格式导出（如需）
- packages/ontology-mcp/src/tools/export-tools.ts

修改：
- src/components/ontology/manifest-export-dialog.tsx
- src/cli/index.ts
- src/app/api/agent/skills/execute/route.ts
- packages/ontology-mcp/src/index.ts（注册 export 工具）
- src/lib/manifest-export.ts（如需支持 md）
- README.md / AGENTS.md（文档更新）
```

---

## 6. Spec 修改建议清单

按优先级排序，建议在 PRD 前完成的 spec 修改：

1. **BP-01**：明确 `/api/export/skill` 请求体传完整 `project` 对象（方案 A）
2. **BP-02**：在 spec 中说明 MCP `export_project` 工具需要新建
3. **MP-01**：删除或明确 GET `/api/export/skill`
4. **MP-02**：补充 Markdown 格式生成规则
5. **MP-03**：统一状态字段类型定义
6. **MP-04**：明确 scope / includeSemanticLayer / includeExamples 的交互
7. **MP-05**：统一错误响应格式和 HTTP 状态码
8. **MP-06**：补充 intents.json 和 examples/ 的生成算法
9. **SP-05**：修正 Content-Disposition 文件名（加 `v` 前缀）
10. **SP-06**：明确性能验收方式

---

## 7. 测试用例调整建议

基于本 review，建议对 `model-export-skill-test-cases.md` 做以下调整：

| 测试用例 | 当前假设 | 建议调整 |
|----------|---------|----------|
| SKILL-U-002 | POST body 只有 projectId | 改为传完整 project 对象 |
| SKILL-U-003 | GET /api/export/skill 支持 | 若删除 GET，则删除此用例 |
| SKILL-I-001/002 | MSW/store 查项目 | 改为直接传 project fixture |
| SKILL-U-023/024/025 | error 字段为字符串 | 改为 error code + message 结构 |
| SKILL-U-033~036 | 目标文件为 project-tools.ts | 改为 export-tools.ts |
| 新增 | Markdown 导出 | 增加 SKILL-U-041：md 格式生成测试 |
| 新增 | 状态类型统一 | 增加类型定义测试 |

---

## 8. 评审决策点

请确认以下关键决策，确认后我更新 spec 并进入 PRD：

1. **是否采用 BP-01 方案 A**：`POST /api/export/skill` 请求体传完整 `project` 对象？
2. **是否删除 GET /api/export/skill 支持？**
3. **MCP `export_project` 工具是否新建 `export-tools.ts`？**
4. **Markdown 格式是否按「ontology.json 的人类可读渲染」定义？**
5. **状态字段是否统一为 `ObjectStatus = 'draft' | 'confirmed' | 'archived' | 'unknown'`？**
6. **错误响应是否统一为 `{ success: false, error: code, message: text }` 结构？**

以上 6 点确认后，spec 即可进入 PRD 阶段。
