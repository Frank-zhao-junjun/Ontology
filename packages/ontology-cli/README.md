# ontology-cli

本体模型建模命令行工具 — 通过 CLI 与 Ontology 建模平台交互。

## 安装

```bash
# 直接使用（无需安装）
npx ontology-cli <command>

# 全局安装
npm install -g ontology-cli
ontology-cli <command>
```

## 命令

| 命令 | 说明 |
|------|------|
| `projects` | 列出所有项目 |
| `project <id>` | 查看项目详情 |
| `metadata` | 列出标准元数据字段 |
| `generate <名称> [英文名]` | AI 生成模型建议 |
| `export <id> [path]` | 导出项目 JSON |
| `import <file>` | 导入 Excel 文件 |
| `template` | 下载 Excel 导入模板 |
| `chat <消息>` | AI 对话（SSE 流式） |
| `skills [type]` | 列出 Agent 技能 |
| `sync <source>` | 触发 HR 系统同步 |
| `interactive` | 交互式菜单模式 |
| `help` | 显示帮助 |

## 环境变量

- `ONTOLOGY_API_BASE` — API 基础地址（默认: `https://Ontology1.coze.site`）

## 示例

```bash
# 列出所有项目
npx ontology-cli projects

# AI 生成物料实体的模型建议
npx ontology-cli generate 物料 Material

# 导出项目 JSON
npx ontology-cli export proj-123 ./my-project.json

# 导入 Excel
npx ontology-cli import ./ontology-template.xlsx

# AI 对话
npx ontology-cli chat "帮我创建一个生产管理价值域"

# 交互模式
npx ontology-cli interactive
```

## 许可证

MIT
