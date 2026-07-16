import type { OntologyProject } from '@/types/ontology';
import { resolveProjectStatus } from './annotate-status';

export function buildReadme(
  project: OntologyProject,
  options: { exportedAt: string; version: string }
): string {
  const { exportedAt, version } = options;
  const domainName = typeof project.domain === 'string' ? project.domain : project.domain?.name || '';
  const projectStatus = resolveProjectStatus(project);

  const statusText: Record<string, string> = {
    confirmed: '已确认',
    draft: '草稿',
    review: '审核中',
    archived: '已归档',
  };

  return `# ${project.name} 本体模型 Skill

## 简介

本 Skill 包含 **${domainName}** 领域的本体模型，可被 Agent 加载后用于回答关于该领域模型的问题。

- **Skill 版本**：${version}
- **导出时间**：${exportedAt}
- **源项目**：${project.name}
- **项目状态**：${statusText[projectStatus] || projectStatus}

## 适用场景

- 回答关于领域实体、属性、关系的结构化问题
- 辅助业务人员理解领域模型
- 作为 RAG 知识库补充

## 文件说明

- \`skill.json\` — Skill 元数据与能力清单
- \`ontology.json\` — 完整或部分本体模型数据
- \`intents.json\` — 自然语言意图映射
- \`README.md\` — 本文档（面向最终用户）
- \`SKILL.md\` — 面向 Agent 框架的能力说明
- \`examples/query-examples.md\` — 查询类示例
- \`examples/reasoning-examples.md\` — 推理类示例

## 状态标注说明

本 Skill 从 **${statusText[projectStatus] || projectStatus}** 状态的项目导出。

每个本体对象上均标注了 \`status\` 字段：

- \`confirmed\`：已确认对象，可放心使用
- \`draft\` / \`review\`：未最终确认，使用时需谨慎
- \`unknown\`：源数据中未记录状态，已按默认处理
- \`archived\`：已归档对象，仅作历史参考

## 快速开始

### 在 Coze 中使用

1. 解压 ZIP 文件
2. 将 \`ontology.json\` 作为知识库导入
3. 将 \`intents.json\` 作为意图示例

### 在自定义 Agent 中使用

1. 读取 \`skill.json\` 获取元数据
2. 读取 \`ontology.json\` 获取模型数据
3. 根据 \`intents.json\` 中的 \`triggerPhrases\` 匹配用户查询

## 限制与免责声明

- 仅回答模型中已定义的实体、属性、关系、规则
- 不涉及模型外的业务判断
- 不执行写操作
`;
}
