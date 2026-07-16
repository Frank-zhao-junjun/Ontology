# Ontology 导出格式统一规范

> 版本: 1.0 | 最后更新: 2026-07-01

## 概述

Ontology 支持 **5 种导出格式**，通过 **4 种接入方式** 均可访问：

| 格式 | 输出形式 | Content-Type | 适用场景 |
|------|----------|-------------|----------|
| `json` | 文本内容 | `application/json` | 程序化处理、二次开发 |
| `yaml` | 文本内容 | `application/x-yaml` | 人工阅读、Git 版本管理 |
| `md` | 文本内容 | `text/markdown` | Agent 知识注入、文档生成 |
| `excel` | 下载 URL | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | 业务人员查看、批量导入 |
| `skill` | 下载 URL | `application/zip` | Agent 领域知识技能包 |

## 各接入方式行为

### 1. Web UI (`/tool`)

导出入口：建模工作台 → 导出按钮 → 选择格式

| 格式 | UI 行为 |
|------|--------|
| JSON / YAML | 客户端 Blob 下载，通过 `ManifestExportDialog` |
| Markdown | 客户端生成 Blob，直接下载 `.md` 文件 |
| Excel | POST `/api/export/xlsx-from-manifest`，服务端生成 XLSX |
| Skill ZIP | POST `/api/export/skill`，服务端生成 ZIP |

### 2. CLI (`pnpm ontology export`)

```bash
# JSON（默认）
pnpm ontology export <projectId>

# 显式指定格式
pnpm ontology export <projectId> --format=yaml
pnpm ontology export <projectId> --format=md
pnpm ontology export <projectId> --format=excel
pnpm ontology export <projectId> --format=skill --scope=data
```

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--format` | json / yaml / md / excel / skill | `json` |
| `--scope` | all / data / behavior / rule / process / event（仅 skill） | `all` |

### 3. MCP Server (`export_project`)

```json
{
  "name": "export_project",
  "arguments": {
    "projectId": "proj-xxx",
    "format": "skill",
    "scope": "all",
    "includeExamples": true,
    "includeSemanticLayer": true
  }
}
```

**响应规范**：
- 小文件（json / yaml / md）：直接在 `content[0].text` 中返回
- 大文件（excel / skill）：返回 `downloadUrl`，客户端自行下载

### 4. Skill API (`POST /api/agent/skills/execute`)

```json
{
  "operation": "export_manifest",
  "params": {
    "manifest": { ... },
    "format": "skill",
    "scope": "all",
    "project": { ... }
  }
}
```

## Skill ZIP 内容结构

```
ontology-model-skill-{name}-v{version}.zip
├── skill.json              # Skill 元数据清单
├── SKILL.md                # Agent 框架核心说明
├── README.md               # 最终用户使用说明
├── ontology.json           # 本体模型数据（按 scope 过滤）
├── intents.json            # 自然语言意图映射
└── examples/
    ├── query-examples.md   # 查询类示例
    └── reasoning-examples.md  # 推理类示例
```

## 状态标注

所有导出格式均**不强制项目/对象状态**，但会在产物中标注：

- `X-Project-Status` 响应头：项目级状态
- `ontology.json` metadata：`projectStatus` + `statusAnnotation`
- 每个模型对象：`status` 字段（confirmed / draft / review / archived / unknown）
- SKILL.md / README.md：状态说明章节
