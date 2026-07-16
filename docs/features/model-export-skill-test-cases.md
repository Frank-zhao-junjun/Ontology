# 模型导出为 Skill 包 — 测试用例设计

> 对应规格：`docs/features/model-export-skill-spec.md`  
> 对应待办：`docs/TODO.md` §七（SE-01 ~ SE-31）  
> 说明：TODO 中实际为 **31 个 SE mini tasks**，本文档补充 **1 个端到端回归用例（REG-01）** 和 **2 个 Markdown 格式测试用例**，共 **34 个测试条目**。

---

## 1. 测试范围与目标

| 目标 | 说明 |
|------|------|
| 覆盖范围 | Skill 包导出全链路：后端 API → UI 集成 → CLI/MCP/Skill API → 文档更新 |
| 核心约束 | 任何状态均可导出，产物中必须标注项目状态与对象级状态 |
| 不覆盖 | Skill 市场上传、Agent 运行时动态加载、版本差异比对 |

---

## 1.5 已确认边界（来自 spec §12）

> 确认时间：2026-07-01

| # | 确认项 | 结论 |
|---|--------|------|
| 1 | UI 导出入口 | `src/components/ontology/manifest-export-dialog.tsx` |
| 2 | Skill 包文件名 | `ontology-model-skill-{projectName}-v{version}.zip` |
| 3 | Skill 名称/描述 | 不自定义，直接取自项目名/项目描述 |
| 4 | examples/ 内容 | 基于模型自动生成 |
| 5 | Agent 导出 5 种格式 | **A 方案一起实现**：UI/CLI/MCP/Skill API 统一支持 `json` / `yaml` / `excel` / `md` / `skill` |
| 6 | 缺失状态字段 | 默认标记为 `unknown` |
| 7 | CLI `--scope` 非 skill 格式 | **A 方案**：自动忽略，`--scope` 仅对 `--format=skill` 生效 |
| 8 | `/api/export/skill` 请求体 | 传完整 `project` 对象，服务端不通过 projectId 查询 |
| 9 | GET `/api/export/skill` | 不实现，仅保留 POST |
| 10 | MCP 导出工具 | 新建 `packages/ontology-mcp/src/tools/export-tools.ts` |
| 11 | Markdown 格式 | `ontology.json` 的人类可读 Markdown 渲染 |
| 12 | 错误响应格式 | `{ success: false, error: code, message: text }` |

---

## 2. 测试分层与命名约定

| 分层 | 目录 | 文件命名 | 工具 |
|------|------|----------|------|
| Unit | `tests/unit/` | `*.spec.ts` | Vitest |
| Integration | `tests/integration/` | `*.spec.ts` / `*.spec.tsx` | Vitest + Testing Library |
| E2E Smoke | `tests/e2e/` | `*.e2e.spec.ts` | Vitest + happy-dom |

**测试 ID 规则**：
- `SKILL-U-{NNN}`：Unit 测试
- `SKILL-I-{NNN}`：Integration 测试
- `SKILL-E-{NNN}`：E2E 测试
- `SKILL-REG-{NNN}`：端到端回归测试

---

## 3. 通用测试数据（Fixtures）

建议新增 `tests/fixtures/skill-export-fixtures.ts`，提供：

```typescript
// 1. 包含全模型 + draft 状态的项目
export const projectDraftFull = { ... };

// 2. 包含全模型 + confirmed 状态的项目
export const projectConfirmedFull = { ... };

// 3. 仅含 dataModel 的项目
export const projectDataOnly = { ... };

// 4. 空项目（无实体）
export const projectEmpty = { ... };

// 5. 缺失 status 字段的对象集合
export const projectMissingStatus = { ... };
```

---

## 4. Phase 1：后端 API（SE-01 ~ SE-15）

### 4.1 路由与参数

#### SKILL-U-001 / SE-01：路由文件存在并导出 POST handler
- **优先级**：P0
- **分层**：Unit
- **前置条件**：`src/app/api/export/skill/route.ts` 已创建
- **步骤**：
  1. `import { POST } from '@/app/api/export/skill/route'`
  2. 断言 `POST` 为 async function
- **预期结果**：导入成功，POST handler 类型为 `Function`

#### SKILL-U-002 / SE-01：POST 接收完整 project 对象
- **优先级**：P0
- **分层**：Unit
- **前置条件**：使用 `projectConfirmedFull` fixture
- **步骤**：
  1. 构造 `Request`：`new Request('/api/export/skill', { method: 'POST', body: JSON.stringify({ project: projectConfirmedFull, scope: 'all' }) })`
  2. 调用 `POST(request)`
- **预期结果**：返回 `Response`，status 200，Content-Type 为 `application/zip`

---

### 4.2 状态校验改为状态标注（SE-02）

#### SKILL-U-004 / SE-02：draft 状态项目允许导出
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectDraftFull fixture
- **步骤**：
  1. POST /api/export/skill，projectStatus 为 `draft`
- **预期结果**：返回 200，不返回任何状态相关错误

#### SKILL-U-005 / SE-02：confirmed 状态项目允许导出
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull fixture
- **步骤**：
  1. POST /api/export/skill，projectStatus 为 `confirmed`
- **预期结果**：返回 200

#### SKILL-U-006 / SE-02：ZIP 内 ontology.json metadata.projectStatus 正确
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectDraftFull
- **步骤**：
  1. 调用 POST 并解压返回 buffer
  2. 读取 `ontology.json` 中 `metadata.projectStatus`
- **预期结果**：`metadata.projectStatus === 'draft'`，且存在 `statusAnnotation` 说明文字

#### SKILL-U-007 / SE-02：对象缺失 status 时默认标记为 unknown
- **优先级**：P1
- **分层**：Unit
- **前置条件**：projectMissingStatus fixture
- **步骤**：
  1. 导出并解析 ontology.json
  2. 检查 dataModel.entities[0].status
- **预期结果**：缺失 status 的对象被标注为 `unknown`

---

### 4.3 Scope 过滤（SE-03）

#### SKILL-U-008 / SE-03：scope=all 包含全部模型
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST scope=all
  2. 解析 ontology.json
- **预期结果**：dataModel、behaviorModel、ruleModel、processModel、eventModel、organization、agentSemanticLayer 均存在

#### SKILL-U-009 / SE-03：scope=data 仅包含数据模型
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST scope=data
  2. 解析 ontology.json
- **预期结果**：仅 dataModel.entities/attributes/relations 非空；behaviorModel、ruleModel、processModel、eventModel 不存在或为空对象

#### SKILL-U-010 / SE-03：scope=behavior 仅包含状态机
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST scope=behavior
- **预期结果**：仅 behaviorModel.stateMachines 非空

#### SKILL-U-011 / SE-03：scope=rule 仅包含规则
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST scope=rule
- **预期结果**：仅 ruleModel.rules 非空

#### SKILL-U-012 / SE-03：scope=process 仅包含流程编排
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST scope=process
- **预期结果**：仅 processModel.orchestrations 非空

#### SKILL-U-013 / SE-03：scope=event 仅包含事件
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST scope=event
- **预期结果**：仅 eventModel.eventDefinitions/subscriptions 非空

---

### 4.4 ZIP 生成与文件内容（SE-04 ~ SE-10）

#### SKILL-U-014 / SE-04：ZIP 可正常解压并包含全部文件
- **优先级**：P0
- **分层**：Unit
- **前置条件**：JSZip 已集成
- **步骤**：
  1. POST scope=all&includeExamples=true
  2. 用 JSZip 加载返回 buffer
- **预期结果**：ZIP 包含 `skill.json`、`SKILL.md`、`README.md`、`ontology.json`、`intents.json`、`examples/query-examples.md`、`examples/reasoning-examples.md`

#### SKILL-U-015 / SE-05：skill.json 字段完整且合法
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. 导出并读取 skill.json
- **预期结果**：包含 `name`、`nameEn`、`version`、`description`、`domain`、`exportedAt`、`source`、`format`、`files`、`capabilities`；`format.type === 'ontology-model-skill'`

#### SKILL-U-016 / SE-06：SKILL.md 包含关键章节
- **优先级**：P1
- **分层**：Unit
- **前置条件**：projectDraftFull
- **步骤**：
  1. 读取 ZIP 中 SKILL.md
- **预期结果**：文本包含「能力概述」、「适用场景」、「加载方式」、「能力边界」、「状态说明」章节，且 `{projectStatus}` 已替换为实际状态

#### SKILL-U-017 / SE-07：README.md 包含状态说明与快速开始
- **优先级**：P1
- **分层**：Unit
- **前置条件**：projectDraftFull
- **步骤**：
  1. 读取 ZIP 中 README.md
- **预期结果**：包含「对象状态标注说明」、「快速开始」、「限制与免责声明」章节

#### SKILL-U-018 / SE-08：ontology.json metadata 字段完整
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. 读取 ontology.json
- **预期结果**：`metadata` 包含 projectId、projectName、domain、description、exportedAt、scope、projectStatus、version、statusAnnotation

#### SKILL-U-019 / SE-09：intents.json 自动生成有效意图
- **优先级**：P1
- **分层**：Unit
- **前置条件**：projectConfirmedFull 包含至少 1 个 Entity
- **步骤**：
  1. 读取 intents.json
- **预期结果**：`intents` 数组非空，每个 intent 包含 id、name、triggerPhrases、action、targetEntity、slots

#### SKILL-U-020 / SE-10：examples/ 目录包含 query 和 reasoning 示例
- **优先级**：P1
- **分层**：Unit
- **前置条件**：includeExamples=true
- **步骤**：
  1. 读取 examples/query-examples.md 和 examples/reasoning-examples.md
- **预期结果**：query-examples.md 包含 ≥10 条示例；reasoning-examples.md 包含 ≥5 条示例

#### SKILL-U-021 / SE-10：includeExamples=false 时不包含 examples 目录
- **优先级**：P1
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST includeExamples=false
- **预期结果**：ZIP 中不存在 `examples/` 目录

---

### 4.5 响应头与错误处理（SE-11 ~ SE-12）

#### SKILL-U-022 / SE-11：响应头 X-Project-Status 正确
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectDraftFull
- **步骤**：
  1. POST /api/export/skill
  2. 读取 response.headers.get('X-Project-Status')
- **预期结果**：值为 `draft`

#### SKILL-U-023 / SE-12：缺少 project 对象返回 400 MISSING_PROJECT
- **优先级**：P0
- **分层**：Unit
- **前置条件**：请求体不包含 `project`
- **步骤**：
  1. POST `{ scope: 'all' }`
- **预期结果**：status 400，body `{ success: false, error: 'MISSING_PROJECT', message: '请求体中缺少 project 对象' }`

#### SKILL-U-024 / SE-12：无效 scope 返回 400 INVALID_SCOPE
- **优先级**：P0
- **分层**：Unit
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST `{ project: projectConfirmedFull, scope: 'invalid' }`
- **预期结果**：status 400，body `{ success: false, error: 'INVALID_SCOPE', message: '导出范围无效' }`

#### SKILL-U-025 / SE-12：空项目导出返回 400 EMPTY_SCOPE
- **优先级**：P1
- **分层**：Unit
- **前置条件**：projectEmpty
- **步骤**：
  1. POST `{ project: projectEmpty, scope: 'all' }`
- **预期结果**：status 400，body `{ success: false, error: 'EMPTY_SCOPE', message: '导出范围为空' }`

---

### 4.6 测试覆盖（SE-13 ~ SE-15）

#### SKILL-U-026 / SE-13：状态标注逻辑单元测试覆盖
- **优先级**：P0
- **分层**：Unit
- **前置条件**：提取 `annotateStatus(project, elements)` 纯函数
- **步骤**：
  1. 输入 draft 项目 → 期望 projectStatus=draft
  2. 输入 confirmed 项目 → 期望 projectStatus=confirmed
  3. 输入缺失 status 的对象 → 期望 unknown
- **预期结果**：3 个断言全部通过

#### SKILL-U-027 / SE-13：scope 过滤逻辑单元测试覆盖
- **优先级**：P0
- **分层**：Unit
- **前置条件**：提取 `filterByScope(project, scope)` 纯函数
- **步骤**：
  1. 测试 all/data/behavior/rule/process/event/invalid 七种输入
- **预期结果**：all 返回全模型；data/behavior/rule/process/event 返回对应子集；invalid 返回 null 或抛出

#### SKILL-U-028 / SE-13：ZIP 内容完整性单元测试覆盖
- **优先级**：P0
- **分层**：Unit
- **前置条件**：`generateSkillZip(...)` 纯函数可测试
- **步骤**：
  1. 调用 generateSkillZip 并遍历 ZIP entries
- **预期结果**：entries 名称与 skill.json files 描述一致

#### SKILL-U-041：Markdown 格式渲染包含项目标题与状态
- **优先级**：P1
- **分层**：Unit
- **前置条件**：`renderOntologyMarkdown(project, scope)` 纯函数可测试
- **步骤**：
  1. 输入 projectDraftFull，scope='all'
- **预期结果**：返回 Markdown 字符串包含一级标题 `# 项目名称`、状态块 `> 导出状态：draft`、以及「数据模型」「行为模型」等二级标题

#### SKILL-U-042：Markdown 格式按 scope 过滤后渲染
- **优先级**：P1
- **分层**：Unit
- **前置条件**：同上
- **步骤**：
  1. 输入 projectConfirmedFull，scope='data'
- **预期结果**：Markdown 只包含「数据模型」章节；不包含「行为模型」「规则模型」等章节

#### SKILL-I-001 / SE-14：POST /api/export/skill draft 状态端到端
- **优先级**：P0
- **分层**：Integration
- **前置条件**：使用 projectDraftFull fixture
- **步骤**：
  1. POST /api/export/skill { project: projectDraftFull, scope: 'all' }
- **预期结果**：status 200，Content-Type application/zip，Content-Disposition 包含 `.zip`

#### SKILL-I-002 / SE-14：POST /api/export/skill confirmed 状态端到端
- **优先级**：P0
- **分层**：Integration
- **前置条件**：使用 projectConfirmedFull fixture
- **步骤**：
  1. POST /api/export/skill { project: projectConfirmedFull, scope: 'all' }
- **预期结果**：status 200，ontology.json metadata.projectStatus === 'confirmed'

#### SKILL-I-003 / SE-14：无效 scope 返回 400 INVALID_SCOPE
- **优先级**：P0
- **分层**：Integration
- **前置条件**：projectConfirmedFull
- **步骤**：
  1. POST { project: projectConfirmedFull, scope: 'unknown' }
- **预期结果**：status 400，body `{ success: false, error: 'INVALID_SCOPE', message: '导出范围无效' }`

#### SKILL-I-004 / SE-15：ci:check 全绿
- **优先级**：P0
- **分层**：CI
- **前置条件**：所有新增代码提交
- **步骤**：
  1. `pnpm run ci:check`
- **预期结果**：lint 0 error · ts-check pass · unit/integration/e2e 全部通过

---

## 5. Phase 2：UI 集成（SE-16 ~ SE-21）

### 5.1 导出入口定位（SE-16）

#### SKILL-I-005 / SE-16：导出按钮存在并可打开选择弹窗
- **优先级**：P0
- **分层**：Integration
- **前置条件**：渲染 `ModelingWorkspace` 或导出入口组件
- **步骤**：
  1. 找到「导出」按钮并点击
- **预期结果**：弹出导出方式选择弹窗，包含 JSON/YAML/Excel/Markdown/Skill 包（ZIP）选项

#### SKILL-I-006 / SE-16：Skill 包选项使用 Package 图标
- **优先级**：P1
- **分层**：Integration
- **前置条件**：导出弹窗已打开
- **步骤**：
  1. 检查 Skill 包选项的 Lucide 图标 data-testid 或 aria-label
- **预期结果**：图标为 `Package`（aria-label 或 testid 包含 package）

---

### 5.2 Skill 选项与范围选择（SE-17 ~ SE-18）

#### SKILL-I-007 / SE-17：点击 Skill 包后弹出范围选择
- **优先级**：P0
- **分层**：Integration
- **前置条件**：导出弹窗已打开
- **步骤**：
  1. 点击「Skill 包（ZIP）」
- **预期结果**：弹出范围选择弹窗/下拉，包含全部/仅数据模型/仅行为模型/仅规则模型/仅流程模型/仅事件模型

#### SKILL-I-008 / SE-18：范围选择正确传递 scope 参数
- **优先级**：P0
- **分层**：Integration
- **前置条件**：mock `fetch` 或 MSW 捕获 /api/export/skill 请求
- **步骤**：
  1. 选择「仅数据模型」
  2. 点击确认
- **预期结果**：请求 body 中 `scope === 'data'`

#### SKILL-I-009 / SE-18：默认 scope 为 all
- **优先级**：P1
- **分层**：Integration
- **前置条件**：范围选择弹窗打开
- **步骤**：
  1. 不修改默认选择，直接确认
- **预期结果**：请求 body 中 `scope === 'all'`

---

### 5.3 状态提示与下载（SE-19 ~ SE-20）

#### SKILL-I-010 / SE-19：导出前显示项目状态提示
- **优先级**：P0
- **分层**：Integration
- **前置条件**：当前项目为 draft 状态
- **步骤**：
  1. 打开导出弹窗 → 选择 Skill 包
- **预期结果**：提示文案包含「当前项目为 draft 状态，导出的 Skill 将包含未确认对象」

#### SKILL-I-011 / SE-19：confirmed 项目提示文案变化
- **优先级**：P1
- **分层**：Integration
- **前置条件**：当前项目为 confirmed 状态
- **步骤**：
  1. 打开导出弹窗 → 选择 Skill 包
- **预期结果**：提示文案显示 confirmed 状态或不再提示包含未确认对象

#### SKILL-I-012 / SE-20：确认后触发 ZIP 下载
- **优先级**：P0
- **分层**：Integration
- **前置条件**：mock `URL.createObjectURL` 和 `a.click`
- **步骤**：
  1. 选择 scope=all
  2. 点击确认导出
- **预期结果**：创建 Blob URL，触发 `<a download>` 点击，文件名符合 `ontology-model-skill-{projectName}-v{version}.zip`

---

### 5.4 UI 测试（SE-21）

#### SKILL-I-013 / SE-21：Skill 选项始终可用
- **优先级**：P0
- **分层**：Integration
- **前置条件**：项目为 draft 状态
- **步骤**：
  1. 打开导出弹窗
- **预期结果**：Skill 包选项不禁用、可点击

#### SKILL-E-001 / SE-21：E2E 完整导出链路
- **优先级**：P0
- **分层**：E2E
- **前置条件**： happy-dom 中加载 `/tool`，存在 draft 项目
- **步骤**：
  1. 点击导出按钮
  2. 选择 Skill 包（ZIP）
  3. 选择仅数据模型
  4. 确认导出
- **预期结果**：浏览器下载 ZIP 文件；ZIP 内 ontology.json scope 为 `data`

---

## 6. Phase 3：Agent 导出能力扩展（SE-22 ~ SE-28）

### 6.1 CLI（SE-22 ~ SE-23）

#### SKILL-U-029 / SE-22：CLI export 默认格式仍为 json
- **优先级**：P0
- **分层**：Unit
- **前置条件**：CLI 入口 `src/cli/index.ts`
- **步骤**：
  1. 解析 `ontology export proj-1 ./out`
- **预期结果**：format 默认值为 `json`，保持向后兼容

#### SKILL-U-030 / SE-22：CLI export --format=skill 先查项目再调 /api/export/skill
- **优先级**：P0
- **分层**：Unit
- **前置条件**：mock fetch（GET /api/projects/proj-1 返回 projectConfirmedFull）
- **步骤**：
  1. 解析 `ontology export proj-1 ./skill.zip --format=skill`
- **预期结果**：
  - 第一步 fetch `GET /api/projects/proj-1`
  - 第二步 fetch `POST /api/export/skill`，body 包含完整 `project` 对象与 `scope`

#### SKILL-U-031 / SE-23：CLI export --scope=data 正确传递
- **优先级**：P0
- **分层**：Unit
- **前置条件**：mock fetch
- **步骤**：
  1. 解析 `ontology export proj-1 ./skill.zip --format=skill --scope=data`
- **预期结果**：第二步 POST body 中 `scope === 'data'`

#### SKILL-U-032 / SE-23：CLI --scope 在 skill 格式外自动忽略
- **优先级**：P1
- **分层**：Unit
- **前置条件**：mock fetch
- **步骤**：
  1. 解析 `ontology export proj-1 ./out.json --format=json --scope=data`
- **预期结果**：请求 body 中不包含 `scope`；CLI 不输出警告、不报错、退出码为 0

#### SKILL-I-014 / SE-22：CLI skill 导出下载 ZIP 文件
- **优先级**：P0
- **分层**：Integration
- **前置条件**：MSW 返回 application/zip
- **步骤**：
  1. 运行 `ontology export proj-1 ./test-skill.zip --format=skill --scope=all`
- **预期结果**：本地生成 `test-skill.zip`，文件大小 > 0

---

### 6.2 MCP（SE-24 ~ SE-25）

#### SKILL-U-033 / SE-24：MCP ontology_project_export 工具 schema 包含 format/scope
- **优先级**：P0
- **分层**：Unit
- **前置条件**：`packages/ontology-mcp/src/tools/export-tools.ts`
- **步骤**：
  1. 读取 `ontology_project_export` 工具定义
- **预期结果**：参数 schema 包含 `projectId`、`format`（enum: json/yaml/excel/md/skill）、`scope`、`includeExamples`、`includeSemanticLayer`

#### SKILL-U-034 / SE-24：MCP ontology_project_export skill 格式返回 endpoint+body
- **优先级**：P0
- **分层**：Unit
- **前置条件**：mock projectStore.get 返回 projectConfirmedFull；mock POST /api/export/skill
- **步骤**：
  1. 调用 tool { projectId, format: 'skill', scope: 'all' }
- **预期结果**：返回 `{ success: true, format: 'skill', filename, sizeBytes, endpoint: '/api/export/skill', method: 'POST', body: { project, scope, includeExamples, includeSemanticLayer } }`，不包含 content

#### SKILL-U-035 / SE-25：MCP json/yaml/md 格式返回 content
- **优先级**：P0
- **分层**：Unit
- **前置条件**：mock projectStore.get 返回 projectConfirmedFull
- **步骤**：
  1. 调用 tool { projectId, format: 'json' }
- **预期结果**：返回 `{ success: true, format: 'json', content, filename, projectStatus }`

#### SKILL-U-036 / SE-25：MCP excel 格式返回 endpoint+body
- **优先级**：P0
- **分层**：Unit
- **前置条件**：mock projectStore.get 返回 projectConfirmedFull
- **步骤**：
  1. 调用 tool { projectId, format: 'excel' }
- **预期结果**：返回 `{ success: true, format: 'excel', filename, sizeBytes, endpoint: '/api/export/xlsx-from-manifest', method: 'POST', body: manifest }`

---

### 6.3 Skill API（SE-26 ~ SE-27）

#### SKILL-U-037 / SE-26：Skill API export_manifest 支持 format=skill
- **优先级**：P0
- **分层**：Unit
- **前置条件**：`src/app/api/agent/skills/execute/route.ts`，mock GET /api/projects/:id
- **步骤**：
  1. POST { operation: 'export_manifest', params: { projectId, format: 'skill', scope: 'all' } }
- **预期结果**：返回 `{ success: true, format: 'skill', filename, sizeBytes, endpoint: '/api/export/skill', method: 'POST', body: { project, scope, includeExamples, includeSemanticLayer } }`

#### SKILL-U-038 / SE-26：Skill API format=json 返回 content
- **优先级**：P0
- **分层**：Unit
- **前置条件**：同上
- **步骤**：
  1. POST { operation: 'export_manifest', params: { projectId, format: 'json' } }
- **预期结果**：返回 `{ success: true, format: 'json', content, filename, projectStatus }`

#### SKILL-U-039 / SE-27：Skill API 错误码 PROJECT_NOT_FOUND
- **优先级**：P0
- **分层**：Unit
- **前置条件**：同上，mock GET /api/projects/:id 返回 null 或 404
- **步骤**：
  1. POST { operation: 'export_manifest', params: { projectId: 'not-exist', format: 'skill' } }
- **预期结果**：返回 `{ success: false, error: 'PROJECT_NOT_FOUND', message: '项目不存在' }`

#### SKILL-U-040 / SE-27：Skill API 错误码 EMPTY_SCOPE
- **优先级**：P0
- **分层**：Unit
- **前置条件**：同上
- **步骤**：
  1. POST { operation: 'export_manifest', params: { projectId, format: 'skill', scope: 'invalid' } }
- **预期结果**：返回 `{ success: false, error: 'INVALID_SCOPE' 或 'EMPTY_SCOPE', message: '导出范围无效或为空' }`

---

### 6.4 统一规范与链路测试（SE-28）

#### SKILL-I-015 / SE-28：UI/MCP/CLI/Skill API 导出同项目产物一致
- **优先级**：P0
- **分层**：Integration
- **前置条件**：同一 projectConfirmedFull
- **步骤**：
  1. 通过四种方式导出 skill 包（UI 模拟、MCP tool、CLI、Skill API）
  2. 对比 ontology.json metadata.projectStatus 与 scope
- **预期结果**：四种方式产物 metadata 一致

#### SKILL-E-002 / SE-28：Agent 导出 Skill 端到端链路
- **优先级**：P1
- **分层**：E2E
- **前置条件**：MCP Server 或 CLI 可运行
- **步骤**：
  1. 调用 MCP export_project format=skill
  2. 通过 downloadUrl 下载 ZIP
  3. 解压并验证 skill.json
- **预期结果**：ZIP 完整且 skill.json format.type 正确

---

## 7. Phase 4：文档更新（SE-29 ~ SE-31）

文档更新类任务以 **审查清单（Checklist）** 方式测试，不编写自动化单测。

#### SKILL-DOC-001 / SE-29：README.md 导出说明包含 Skill 包
- **优先级**：P1
- **分层**：文档审查
- **检查项**：
  1. README.md「导出与迁移」或「Agent 接入方式」章节提到 Skill ZIP 下载
  2. 列出 `POST /api/export/skill` 接口
  3. 说明任何状态均可导出

#### SKILL-DOC-002 / SE-30：AGENTS.md API 列表和 CLI/MCP 定义已更新
- **优先级**：P1
- **分层**：文档审查
- **检查项**：
  1. AGENTS.md API 接口表格新增 `POST /api/export/skill`
  2. CLI 命令列表新增 `--format` / `--scope` 示例
  3. MCP 工具定义新增 format/scope/includeExamples/includeSemanticLayer 参数

#### SKILL-DOC-003 / SE-31：测试用例文档已补充
- **优先级**：P1
- **分层**：文档审查
- **检查项**：
  1. 本文档 `docs/features/model-export-skill-test-cases.md` 存在且与实现对齐
  2. 新增测试文件在 AGENTS.md 或 CONTRIBUTING.md 中有索引（可选）

---

## 8. Traceability Matrix

| SE Task | 测试用例 | 分层 | 优先级 |
|---------|----------|------|--------|
| SE-01 | SKILL-U-001 ~ SKILL-U-002 | Unit | P0 |
| SE-02 | SKILL-U-004 ~ SKILL-U-007 | Unit | P0/P1 |
| SE-03 | SKILL-U-008 ~ SKILL-U-013 | Unit | P0 |
| SE-04 | SKILL-U-014 | Unit | P0 |
| SE-05 | SKILL-U-015 | Unit | P0 |
| SE-06 | SKILL-U-016 | Unit | P1 |
| SE-07 | SKILL-U-017 | Unit | P1 |
| SE-08 | SKILL-U-018 | Unit | P0 |
| SE-09 | SKILL-U-019 | Unit | P1 |
| SE-10 | SKILL-U-020 ~ SKILL-U-021 | Unit | P1 |
| SE-11 | SKILL-U-022 | Unit | P0 |
| SE-12 | SKILL-U-023 ~ SKILL-U-025 | Unit | P0/P1 |
| SE-13 | SKILL-U-026 ~ SKILL-U-028 | Unit | P0 |
| Markdown 导出 | SKILL-U-041 ~ SKILL-U-042 | Unit | P1 |
| SE-14 | SKILL-I-001 ~ SKILL-I-003 | Integration | P0 |
| SE-15 | SKILL-I-004 | CI | P0 |
| SE-16 | SKILL-I-005 ~ SKILL-I-006 | Integration | P0/P1 |
| SE-17 | SKILL-I-007 | Integration | P0 |
| SE-18 | SKILL-I-008 ~ SKILL-I-009 | Integration | P0/P1 |
| SE-19 | SKILL-I-010 ~ SKILL-I-011 | Integration | P0/P1 |
| SE-20 | SKILL-I-012 | Integration | P0 |
| SE-21 | SKILL-I-013 ~ SKILL-I-014, SKILL-E-001 | Integration/E2E | P0 |
| SE-22 | SKILL-U-029 ~ SKILL-U-030 | Unit | P0 |
| SE-23 | SKILL-U-031 ~ SKILL-U-032 | Unit | P0/P1 |
| SE-24 | SKILL-U-033 ~ SKILL-U-034 | Unit | P0 |
| SE-25 | SKILL-U-035 ~ SKILL-U-036 | Unit | P0 |
| SE-26 | SKILL-U-037 ~ SKILL-U-038 | Unit | P0 |
| SE-27 | SKILL-U-039 ~ SKILL-U-040 | Unit | P0 |
| SE-28 | SKILL-I-015, SKILL-E-002 | Integration/E2E | P0/P1 |
| SE-29 | SKILL-DOC-001 | 文档审查 | P1 |
| SE-30 | SKILL-DOC-002 | 文档审查 | P1 |
| SE-31 | SKILL-DOC-003 | 文档审查 | P1 |
| 回归 | REG-001 | E2E | P0 |

---

## 9. 端到端回归用例（REG-001）

#### REG-001：Skill 包导出完整端到端回归
- **优先级**：P0
- **分层**：E2E
- **目标**：覆盖「业务树创建 → EPC 编辑 → 导出 Skill → 解压验证」完整链路
- **前置条件**：
  1. 项目 `proj-e2e-skill` 存在
  2. 已创建 A（价值域）→ B（能力）→ C（场景）→ EPC，且 EPC 引用 E1/E2 要素
  3. 项目状态为 draft
- **步骤**：
  1. 登录工作台 `/tool`
  2. 选择项目 `proj-e2e-skill`
  3. 进入 C 场景工作区
  4. 点击「导出」按钮
  5. 选择「Skill 包（ZIP）」
  6. 选择「全部模型」
  7. 确认导出并下载 ZIP
  8. 用 JSZip 解压并读取 ontology.json
- **预期结果**：
  - ZIP 下载成功，文件名符合规范
  - ontology.json.metadata.projectStatus === 'draft'
  - ontology.json.dataModel.entities 非空
  - ontology.json.behaviorModel.stateMachines 非空
  - skill.json.capabilities 包含 entity-query / relation-query
  - README.md 和 SKILL.md 均包含状态说明
  - examples/ 下 query-examples.md 和 reasoning-examples.md 存在且非空

---

## 10. 建议的测试文件结构

```text
tests/
├── unit/
│   ├── api-export-skill-route.spec.ts          # SKILL-U-001~028
│   ├── skill-export-markdown.spec.ts           # SKILL-U-041~042
│   ├── cli-export-skill.spec.ts                # SKILL-U-029~032
│   ├── mcp-export-project-skill.spec.ts        # SKILL-U-033~036
│   └── agent-skills-export-manifest.spec.ts    # SKILL-U-037~040
├── integration/
│   ├── api-export-skill.spec.ts                # SKILL-I-001~004
│   └── ui-skill-export.spec.tsx                # SKILL-I-005~015
├── e2e/
│   └── skill-export.e2e.spec.ts                # SKILL-E-001~002, REG-001
└── fixtures/
    └── skill-export-fixtures.ts                # 通用测试数据
```

---

## 11. 执行命令

```bash
# Unit + Integration + E2E 分阶段执行
pnpm exec vitest run tests/unit/api-export-skill-route.spec.ts
pnpm exec vitest run tests/unit/skill-export-markdown.spec.ts
pnpm exec vitest run tests/unit/cli-export-skill.spec.ts
pnpm exec vitest run tests/unit/mcp-export-project-skill.spec.ts
pnpm exec vitest run tests/unit/agent-skills-export-manifest.spec.ts

pnpm exec vitest run tests/integration/api-export-skill.spec.ts
pnpm exec vitest run tests/integration/ui-skill-export.spec.tsx

pnpm exec vitest run tests/e2e/skill-export.e2e.spec.ts

# 全量 CI 回归
pnpm run ci:check
```

---

## 12. 风险与假设

| 风险 | 缓解措施 |
|------|----------|
| JSZip 增加 bundle 体积 | 仅在服务端 API route 使用，不进入前端 bundle |
| 状态字段命名不一致 | 测试 fixture 覆盖 draft/confirmed/missing 三种情况 |
| 大模型导出超时 | E2E 设置 timeout ≥ 10s；后端设置 stream 响应 |
| 现有 export 路由冲突 | 新路由为 `/api/export/skill`，与 `/api/export` 不冲突 |

---

## 13. 已确认问题

所有 spec §12 问题、Spec Review 决策及实现细节均已确认，见 §1.5「已确认边界」。

### CLI `--scope` 非 skill 格式时的行为（已确认）

场景：`ontology export proj-1 ./out.json --format=json --scope=data`

- **确认方案 A**：`--scope` 仅在 `--format=skill` 时生效，其他格式自动忽略，不报错、不警告。

对应测试用例：SKILL-U-032。

### 测试用例变更摘要

| 变更 | 说明 |
|------|------|
| 删除 SKILL-U-003 | GET `/api/export/skill` 不再实现 |
| 调整 SKILL-U-002/I-001/I-002 | 请求体改为传完整 `project` 对象 |
| 调整 SKILL-U-023~025/I-003 | 错误响应改为 `{ success: false, error: code, message: text }` |
| 调整 SKILL-U-030~032 | CLI 先 `GET /api/projects/:id` 再 `POST /api/export/skill` |
| 调整 SKILL-U-033~036 | MCP 目标文件改为 `export-tools.ts`，返回 `endpoint+body` |
| 调整 SKILL-U-037~040 | Skill API 返回 `endpoint+body` 或 `content+projectStatus` |
| 新增 SKILL-U-041~042 | Markdown 格式渲染测试 |
