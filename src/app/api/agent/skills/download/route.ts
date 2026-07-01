import { NextResponse } from 'next/server';
import JSZip from 'jszip';

/**
 * GET /api/agent/skills/download
 *
 * 生成并下载 Ontology 建模能力 Skill ZIP 包
 *
 * ZIP 结构:
 *  ontology-skill/
 *  ├── skill.json          # Skill 清单（12种操作定义）
 *  ├── README.md           # 使用说明（3种接入方式）
 *  ├── config/
 *  │   ├── mcp.json        # MCP 客户端配置
 *  │   └── cli.env         # CLI 环境变量
 *  ├── examples/
 *  │   ├── curl-examples.sh
 *  │   └── mcp-client-example.json
 *  └── openapi.yaml        # OpenAPI 3.0 规范
 */

const DOMAIN = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://Ontology1.coze.site';

function buildSkillJson() {
  return JSON.stringify({
    name: 'ontology-modeling-skill',
    version: '1.0.0',
    description: '本体模型可视化建模工具 — Agent 技能包，支持五大元模型（数据、行为、规则、流程、事件）的建模、AI智能生成、Excel导入导出',
    homepage: DOMAIN,
    capabilities: [
      { name: 'list_projects', desc: '列出所有项目', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'list_projects', params: {} } },
      { name: 'get_project', desc: '获取项目详情', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'get_project', params: { projectId: 'string' } } },
      { name: 'list_metadata', desc: '获取标准元数据列表', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'list_metadata', params: {} } },
      { name: 'ai_generate', desc: 'AI生成五大模型建议', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'ai_generate', params: { entity: 'object' } } },
      { name: 'ai_chat', desc: 'AI对话建模（SSE流式）', endpoint: '/api/chat', method: 'POST', params: { messages: 'array' } },
      { name: 'create_model', desc: '通过AI创建建模要素', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'create_model', params: { description: 'string' } } },
      { name: 'excel_template', desc: '获取Excel导入模板', endpoint: '/api/excel-template', method: 'GET', params: {} },
      { name: 'export_manifest', desc: '导出Manifest为Excel', endpoint: '/api/export/xlsx-from-manifest', method: 'POST', params: { manifest: 'object' } },
      { name: 'list_skills', desc: '列出Agent技能', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'list_skills', params: { type: 'string?' } } },
      { name: 'execute_skill', desc: '执行Agent技能', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'execute_skill', params: { skillType: 'string', action: 'string' } } },
      { name: 'hr_sync_status', desc: 'HR同步状态', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'hr_sync_status', params: {} } },
      { name: 'hr_sync_trigger', desc: '触发HR同步', endpoint: '/api/agent/skills/execute', method: 'POST', params: { operation: 'hr_sync_trigger', params: { source: 'string' } } },
    ],
    accessModes: {
      mcp: {
        transport: 'streamable-http',
        url: `${DOMAIN}/api/mcp`,
        tools: ['list_projects', 'get_project', 'create_project', 'export_project', 'add_value_domain', 'add_capability', 'add_scenario', 'add_epc_process'],
      },
      cli: {
        package: 'ontology-cli',
        usage: 'npx ontology-cli <command>',
        env: `ONTOLOGY_API_BASE=${DOMAIN}`,
        commands: ['projects', 'project <id>', 'metadata', 'generate <name>', 'export <id> [path]', 'import <file>', 'template', 'chat <msg>', 'skills', 'interactive'],
      },
      rest: {
        endpoint: `${DOMAIN}/api/agent/skills/execute`,
        method: 'POST',
        contentType: 'application/json',
      },
    },
    metadata: {
      models: ['Data Model', 'Behavior Model', 'Rule Model', 'Process Model', 'Event Model'],
      aiModel: 'doubao-seed-2-0-pro-260215',
      domainTemplates: ['离散制造', '流程制造', '供应链', '零售', '金融', '医疗', '能源', '通用'],
    },
  }, null, 2);
}

function buildReadme() {
  return `# Ontology Modeling Skill

本体模型可视化建模工具 — Agent 技能包

## 概述

本技能包提供本体模型建模能力，支持五大元模型（数据、行为、规则、流程、事件）的可视化建模、AI智能生成、Excel导入导出。

## 三种接入方式

### 1. MCP（推荐）

将 MCP 配置添加到你的 AI 客户端（Claude Desktop / Cursor 等）：

\`\`\`json
{
  "mcpServers": {
    "ontology-mcp": {
      "url": "${DOMAIN}/api/mcp"
    }
  }
}
\`\`\`

可用工具：list_projects, get_project, create_project, export_project, add_value_domain, add_capability, add_scenario, add_epc_process

### 2. CLI 命令行

\`\`\`bash
# 设置环境变量
export ONTOLOGY_API_BASE=${DOMAIN}

# 列出所有项目
npx ontology-cli projects

# AI 生成模型建议
npx ontology-cli generate 物料 Material

# AI 对话建模
npx ontology-cli chat "帮我创建一个生产管理价值域"

# 交互模式
npx ontology-cli interactive
\`\`\`

### 3. REST API

\`\`\`bash
# 列出可用操作
curl ${DOMAIN}/api/agent/skills/execute

# 列出项目
curl -X POST ${DOMAIN}/api/agent/skills/execute \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "list_projects", "params": {}}'

# AI 生成模型建议
curl -X POST ${DOMAIN}/api/agent/skills/execute \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "ai_generate", "params": {"entity": {"name": "物料", "nameEn": "Material"}}}'

# AI 对话建模（SSE 流式）
curl -X POST ${DOMAIN}/api/chat \\
  -H 'Content-Type: application/json' \\
  -d '{"messages": [{"role": "user", "content": "帮我创建一个生产管理价值域"}]}'
\`\`\`

## 12 种操作

| 操作 | 说明 |
|------|------|
| list_projects | 列出所有项目 |
| get_project | 获取项目详情 |
| list_metadata | 获取标准元数据列表 |
| ai_generate | AI生成五大模型建议 |
| ai_chat | AI对话建模（SSE流式） |
| create_model | 通过AI创建建模要素 |
| excel_template | 获取Excel导入模板 |
| export_manifest | 导出Manifest为Excel |
| list_skills | 列出Agent技能 |
| execute_skill | 执行Agent技能 |
| hr_sync_status | HR同步状态 |
| hr_sync_trigger | 触发HR同步 |

## 支持的元模型

- 数据模型 (Data Model) — 实体、属性、关系
- 行为模型 (Behavior Model) — 状态机、状态、转换
- 规则模型 (Rule Model) — 五类规则
- 流程模型 (Process Model) — 流程编排、步骤
- 事件模型 (Event Model) — 事件定义、订阅

## AI 模型

默认使用豆包 Seed 2.0 Pro (doubao-seed-2-0-pro-260215)，可通过 CHAT_MODEL 环境变量覆盖。

## 文件说明

- skill.json — 技能清单（12种操作定义、3种接入方式配置）
- config/mcp.json — MCP 客户端配置
- config/cli.env — CLI 环境变量
- examples/curl-examples.sh — curl 调用示例
- examples/mcp-client-example.json — MCP 客户端配置示例
- openapi.yaml — OpenAPI 3.0 规范
`;
}

function buildMcpConfig() {
  return JSON.stringify({
    mcpServers: {
      'ontology-mcp': {
        url: `${DOMAIN}/api/mcp`,
      },
    },
  }, null, 2);
}

function buildCliEnv() {
  return `# Ontology CLI 环境变量
ONTOLOGY_API_BASE=${DOMAIN}
`;
}

function buildCurlExamples() {
  return `#!/bin/bash
# Ontology Skill API 调用示例
# 基础地址
BASE="${DOMAIN}"

# 1. 列出可用操作
curl -s "$BASE/api/agent/skills/execute" | head -20

# 2. 列出所有项目
curl -s -X POST "$BASE/api/agent/skills/execute" \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "list_projects", "params": {}}'

# 3. 获取项目详情
curl -s -X POST "$BASE/api/agent/skills/execute" \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "get_project", "params": {"projectId": "YOUR_PROJECT_ID"}}'

# 4. 获取标准元数据
curl -s -X POST "$BASE/api/agent/skills/execute" \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "list_metadata", "params": {}}'

# 5. AI 生成模型建议
curl -s -X POST "$BASE/api/agent/skills/execute" \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "ai_generate", "params": {"entity": {"name": "物料", "nameEn": "Material", "description": "物料实体"}}}'

# 6. AI 对话建模（SSE 流式）
curl -s -N -X POST "$BASE/api/chat" \\
  -H 'Content-Type: application/json' \\
  -d '{"messages": [{"role": "user", "content": "帮我创建一个生产管理价值域"}]}'

# 7. 下载 Excel 模板
curl -s -o ontology-template.xlsx "$BASE/api/excel-template"
echo "模板已下载: ontology-template.xlsx"

# 8. HR 同步状态
curl -s -X POST "$BASE/api/agent/skills/execute" \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "hr_sync_status", "params": {}}'
`;
}

function buildMcpClientExample() {
  return JSON.stringify({
    // Claude Desktop 配置文件路径:
    //   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
    //   Windows: %APPDATA%\\Claude\\claude_desktop_config.json
    mcpServers: {
      'ontology-mcp': {
        url: `${DOMAIN}/api/mcp`,
      },
    },
  }, null, 2);
}

function buildOpenApiYaml() {
  return `openapi: 3.0.3
info:
  title: Ontology Modeling Skill API
  version: 1.0.0
  description: 本体模型可视化建模工具 Agent 技能 API
servers:
  - url: ${DOMAIN}
paths:
  /api/agent/skills/execute:
    get:
      summary: 列出所有可用操作
      responses:
        '200':
          description: 操作列表
    post:
      summary: 执行指定操作
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                operation:
                  type: string
                  enum: [list_projects, get_project, list_metadata, ai_generate, ai_chat, create_model, excel_template, export_manifest, list_skills, execute_skill, hr_sync_status, hr_sync_trigger]
                params:
                  type: object
      responses:
        '200':
          description: 操作结果
  /api/chat:
    post:
      summary: AI对话（SSE流式）
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                messages:
                  type: array
                  items:
                    type: object
                    properties:
                      role:
                        type: string
                      content:
                        type: string
      responses:
        '200':
          description: SSE流式响应
          content:
            text/event-stream:
              schema:
                type: string
  /api/excel-template:
    get:
      summary: 下载Excel导入模板
      responses:
        '200':
          description: Excel文件
          content:
            application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
              schema:
                type: string
                format: binary
  /api/mcp:
    post:
      summary: MCP协议端点（Streamable HTTP）
      description: 支持MCP协议的JSON-RPC 2.0通信
      responses:
        '200':
          description: MCP响应
  /api/projects:
    get:
      summary: 列出所有项目
      responses:
        '200':
          description: 项目列表
  /api/projects/{id}:
    get:
      summary: 获取项目详情
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 项目详情
  /api/metadata/init:
    get:
      summary: 获取标准元数据列表
      responses:
        '200':
          description: 元数据列表
  /api/generate-model:
    post:
      summary: AI生成五大模型建议
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                entity:
                  type: object
                domain:
                  type: object
      responses:
        '200':
          description: 模型建议
`;
}

export async function GET() {
  const zip = new JSZip();
  const folder = zip.folder('ontology-skill')!;

  folder.file('skill.json', buildSkillJson());
  folder.file('README.md', buildReadme());

  const config = folder.folder('config')!;
  config.file('mcp.json', buildMcpConfig());
  config.file('cli.env', buildCliEnv());

  const examples = folder.folder('examples')!;
  examples.file('curl-examples.sh', buildCurlExamples());
  examples.file('mcp-client-example.json', buildMcpClientExample());

  folder.file('openapi.yaml', buildOpenApiYaml());

  const buffer = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="ontology-skill.zip"',
      'Content-Length': buffer.length.toString(),
    },
  });
}
