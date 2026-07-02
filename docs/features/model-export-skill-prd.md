# 模型导出为 Skill 包 — 产品需求文档（PRD）

> 对应 Spec：`docs/features/model-export-skill-spec.md`  
> 对应测试用例：`docs/features/model-export-skill-test-cases.md`  
> 状态：Spec 已确认，进入 PRD / 实现阶段  
> 版本：v1.0（2026-07-01）

---

## 1. 目标与范围

### 1.1 目标

在 Ontology 建模工具中新增第 5 种导出格式 **Skill 包（ZIP）**，将本体模型封装为 Agent 可直接消费的领域知识技能。同时统一 UI / CLI / MCP / Skill API 四种接入方式对 5 种格式（`json` / `yaml` / `excel` / `md` / `skill`）的支持。

### 1.2 范围

**In Scope**：
- 后端 `POST /api/export/skill`：生成 Skill ZIP
- UI `manifest-export-dialog.tsx`：新增 Markdown + Skill ZIP 选项 + 范围选择
- CLI `ontology export`：支持 `--format` / `--scope`
- MCP：新增 `ontology_project_export` 工具
- Skill API：`export_manifest` 操作扩展 5 种格式
- 文档更新：README.md / AGENTS.md / 测试用例文档

**Out of Scope**：
- Skill 市场上传
- Agent 运行时动态加载
- 版本差异比对
- 自动同步

---

## 2. 关键决策（来自 Spec 评审）

| # | 决策 | 结论 |
|---|------|------|
| 1 | UI 导出入口 | `src/components/ontology/manifest-export-dialog.tsx` |
| 2 | Skill 包文件名 | `ontology-model-skill-{projectName}-v{version}.zip` |
| 3 | Skill 名称/描述 | 取自项目名/项目描述，不自定义 |
| 4 | examples/ | 基于模型自动生成 |
| 5 | 5 种格式实现 | UI/CLI/MCP/Skill API 一起实现 |
| 6 | 缺失状态字段 | 默认 `unknown` |
| 7 | API 请求体 | 传完整 `project` 对象 |
| 8 | GET 接口 | 不实现 |
| 9 | MCP 导出工具 | 新建 `export-tools.ts` |
| 10 | Markdown 格式 | ontology.json 的人类可读渲染 |
| 11 | 状态字段类型 | `ProjectStatus` / `ObjectStatus` 统一 |
| 12 | 错误响应 | `{ success: false, error: code, message: text }` |

---

## 3. 数据流设计

### 3.1 UI 导出 Skill ZIP

```
User clicks "导出 OntologyManifest"
  └─ manifest-export-dialog.tsx opens
      └─ User selects "Skill 包（ZIP）"
          └─ Scope selector appears (all/data/behavior/rule/process/event)
              └─ User confirms
                  └─ POST /api/export/skill
                      body: { project, scope, includeExamples, includeSemanticLayer }
                  └─ Browser downloads ZIP
```

### 3.2 CLI 导出

```
ontology export <projectId> [outputPath] --format=skill --scope=data
  └─ GET /api/projects/<projectId> 获取 project
      └─ if not found → PROJECT_NOT_FOUND
      └─ POST /api/export/skill
          body: { project, scope }
      └─ Write ZIP to outputPath
```

### 3.3 MCP 导出

```
Client calls ontology_project_export
  └─ packages/ontology-mcp/src/tools/export-tools.ts
      └─ projectStore.get(projectId) 获取 project
          └─ if not found → PROJECT_NOT_FOUND
          └─ 根据 format：
              - json/yaml/md → 本地生成 content 返回
              - excel → POST /api/export/xlsx-from-manifest
              - skill → POST /api/export/skill
          └─ 返回 { content } 或 { endpoint, method, body }
```

### 3.4 Skill API 导出

```
POST /api/agent/skills/execute
  body: { operation: 'export_manifest', params: { projectId, format, scope, ... } }
    └─ GET /api/projects/<projectId> 获取 project
        └─ if not found → PROJECT_NOT_FOUND
        └─ 根据 format 调用对应内部 API
        └─ 返回 { content } 或 { endpoint, method, body }
```

---

## 4. 模块设计

### 4.1 后端 Skill 导出模块

位置：`src/lib/skill-export/`

```text
src/lib/skill-export/
├── index.ts              # 公开 API：buildSkillZip(project, options)
├── types.ts              # SkillExportOptions / SkillZipEntry
├── build-skill-json.ts   # 生成 skill.json
├── build-ontology-json.ts # scope 过滤 + 状态标注
├── build-intents-json.ts  # 自动生成 intents.json
├── build-skill-md.ts      # 生成 SKILL.md
├── build-readme.ts        # 生成 README.md
├── build-examples.ts      # 生成 query-examples.md / reasoning-examples.md
├── markdown-renderer.ts   # md 格式渲染
└── annotate-status.ts     # 状态标注逻辑
```

### 4.2 API Route

位置：`src/app/api/export/skill/route.ts`

职责：
1. 解析请求体
2. 校验 `project` 存在
3. 校验 `scope` 合法
4. 调用 `buildSkillZip()`
5. 返回 ZIP 二进制流

### 4.3 UI 组件修改

位置：`src/components/ontology/manifest-export-dialog.tsx`

变更：
1. `ManifestExportFormat` 类型扩展为 `'yaml' | 'json' | 'xlsx' | 'md' | 'skill'`
2. 按钮组增加 Markdown + Skill ZIP
3. 选择 Skill ZIP 后显示范围选择器（RadioGroup）
4. 根据项目状态显示提示文案
5. Skill ZIP 调用 `POST /api/export/skill` 并触发下载
6. Markdown 格式本地生成后触发下载

### 4.4 CLI 修改

位置：`src/cli/index.ts`

变更：
1. `cmdExport` 解析 `--format` 和 `--scope`
2. 默认 format 保持 `json`
3. skill 格式先 GET project 再 POST /api/export/skill
4. yaml/md/excel 格式按 spec 实现

### 4.5 MCP 新增

位置：`packages/ontology-mcp/src/tools/export-tools.ts`

变更：
1. 定义 `ontology_project_export` 工具 schema
2. 实现 handler：
   - 通过 projectStore 获取 project
   - 根据 format 分发到不同生成逻辑
   - skill 格式调用部署端 `/api/export/skill`

### 4.6 Skill API 修改

位置：`src/app/api/agent/skills/execute/route.ts`

变更：
1. `export_manifest` case 扩展：
   - 解析 `format` / `scope` / `includeExamples` / `includeSemanticLayer`
   - GET /api/projects/<projectId>
   - 根据 format 调用内部 API 或本地生成
   - 统一返回格式

---

## 5. 接口定义

### 5.1 `POST /api/export/skill`

**请求体**：

```typescript
interface ExportSkillRequest {
  project: OntologyProject;           // 完整项目对象
  scope?: 'all' | 'data' | 'behavior' | 'rule' | 'process' | 'event';
  includeExamples?: boolean;          // 默认 true
  includeSemanticLayer?: boolean;     // 默认 true
}
```

**成功响应**：

- Status: 200
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="ontology-model-skill-{projectName}-v{version}.zip"`
- Header: `X-Project-Status: {projectStatus}`

**失败响应**：

```typescript
{ success: false; error: 'MISSING_PROJECT' | 'INVALID_SCOPE' | 'EMPTY_SCOPE' | 'INTERNAL_ERROR'; message: string; }
```

### 5.2 `buildSkillZip(project, options)`

```typescript
interface SkillExportOptions {
  scope?: 'all' | 'data' | 'behavior' | 'rule' | 'process' | 'event';
  includeExamples?: boolean;
  includeSemanticLayer?: boolean;
}

interface SkillZipEntry {
  name: string;
  content: Buffer | string;
}

async function buildSkillZip(
  project: OntologyProject,
  options?: SkillExportOptions
): Promise<Buffer>;
```

### 5.3 MCP `ontology_project_export`

**输入**：

```json
{
  "projectId": "proj-xxx",
  "format": "skill",
  "scope": "all",
  "includeExamples": true,
  "includeSemanticLayer": true
}
```

**输出（skill）**：

```json
{
  "success": true,
  "format": "skill",
  "filename": "ontology-model-skill-生产管理-v1.0.0.zip",
  "sizeBytes": 15360,
  "endpoint": "/api/export/skill",
  "method": "POST",
  "body": { "project": {}, "scope": "all", "includeExamples": true, "includeSemanticLayer": true }
}
```

**输出（json/yaml/md）**：

```json
{
  "success": true,
  "format": "json",
  "content": "{...}",
  "filename": "ontology-proj-xxx.json",
  "projectStatus": "draft"
}
```

---

## 6. 实现顺序（推荐）

按依赖关系和 TDD 流程，建议按以下顺序实现：

### Phase 1：纯函数与后端 API（SE-01 ~ SE-15）

1. `src/lib/skill-export/types.ts`
2. `src/lib/skill-export/annotate-status.ts` + unit tests
3. `src/lib/skill-export/build-ontology-json.ts` + unit tests（scope 过滤）
4. `src/lib/skill-export/build-skill-json.ts`
5. `src/lib/skill-export/build-intents-json.ts`
6. `src/lib/skill-export/build-examples.ts`
7. `src/lib/skill-export/build-skill-md.ts`
8. `src/lib/skill-export/build-readme.ts`
9. `src/lib/skill-export/markdown-renderer.ts` + unit tests
10. `src/lib/skill-export/index.ts`（组装 ZIP）
11. `src/app/api/export/skill/route.ts` + integration tests

### Phase 2：UI 集成（SE-16 ~ SE-21）

12. 修改 `src/lib/manifest-export.ts`：扩展 `ManifestExportFormat` 类型
13. 修改 `src/components/ontology/manifest-export-dialog.tsx`
    - 增加 Markdown / Skill ZIP 按钮
    - 增加 scope 选择器
    - 增加状态提示
    - 实现 Skill ZIP 下载
    - 实现 Markdown 下载
14. UI integration tests

### Phase 3：Agent 能力扩展（SE-22 ~ SE-28）

15. 修改 `src/cli/index.ts`：扩展 `cmdExport`
16. 新增 `packages/ontology-mcp/src/tools/export-tools.ts`
17. 修改 `packages/ontology-mcp/src/index.ts`：注册 export 工具
18. 修改 `src/app/api/agent/skills/execute/route.ts`：扩展 `export_manifest`
19. CLI / MCP / Skill API unit + integration tests

### Phase 4：文档与回归（SE-29 ~ SE-31 + REG）

20. 更新 `README.md`
21. 更新 `AGENTS.md`
22. E2E 回归测试 REG-001
23. `pnpm run ci:check`

---

## 7. 依赖分析

| 依赖 | 用途 | 是否新增 |
|------|------|:--------:|
| JSZip | 服务端生成 ZIP | 是 |
| yaml | YAML 序列化 | 已有 |
| xlsx | Excel 导出 | 已有 |
| mammoth / pdf-parse | 文档解析 | 不相关 |
| `@ontology/core` | MCP 调用 core 函数 | 已有 |

**新增依赖**：`jszip`（仅服务端使用，不进入前端 bundle）

---

## 8. 测试策略

| 层级 | 文件 | 覆盖 |
|------|------|------|
| Unit | `tests/unit/api-export-skill-route.spec.ts` | SKILL-U-001~028 |
| Unit | `tests/unit/skill-export-markdown.spec.ts` | SKILL-U-041~042 |
| Unit | `tests/unit/cli-export-skill.spec.ts` | SKILL-U-029~032 |
| Unit | `tests/unit/mcp-export-project-skill.spec.ts` | SKILL-U-033~036 |
| Unit | `tests/unit/agent-skills-export-manifest.spec.ts` | SKILL-U-037~040 |
| Integration | `tests/integration/api-export-skill.spec.ts` | SKILL-I-001~004 |
| Integration | `tests/integration/ui-skill-export.spec.tsx` | SKILL-I-005~015 |
| E2E | `tests/e2e/skill-export.e2e.spec.ts` | SKILL-E-001~002, REG-001 |
| Fixture | `tests/fixtures/skill-export-fixtures.ts` | 通用测试数据 |

---

## 9. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| JSZip 增加服务端 bundle | 中 | 仅在 API route 使用；前端不依赖 |
| 项目数据大导致导出慢 | 中 | E2E 设置 timeout；后端流式响应 |
| MCP/Skill API 获取 project 失败 | 高 | 明确错误码 PROJECT_NOT_FOUND；文档说明需要服务端持久化 |
| UI 弹窗交互复杂 | 低 | 复用现有 Dialog + RadioGroup |
| 5 种格式响应不一致 | 中 | PRD 明确定义每种格式的返回结构 |

---

## 10. 验收标准

- [ ] `POST /api/export/skill` 返回合法 ZIP
- [ ] draft / confirmed / archived 项目均可导出
- [ ] ZIP 内 skill.json / ontology.json / intents.json / README.md / SKILL.md / examples/ 完整
- [ ] ontology.json 中每个对象有 status 字段
- [ ] UI 导出弹窗可见 Skill ZIP + Markdown 选项
- [ ] scope 选择正确过滤 ontology.json
- [ ] CLI `ontology export --format=skill --scope=data` 生成本地 ZIP
- [ ] MCP `ontology_project_export` 工具返回正确格式
- [ ] Skill API `export_manifest` 支持 5 种格式
- [ ] `pnpm run ci:check` 全绿

---

## 11. 下一步

PRD 确认后，进入 **Step 3 Coding**。建议从 Phase 1 纯函数开始：`src/lib/skill-export/annotate-status.ts` → `build-ontology-json.ts` → `index.ts` → `route.ts`。
