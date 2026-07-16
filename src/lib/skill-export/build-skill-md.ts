import type { OntologyProject } from '@/types/ontology';
import { resolveProjectStatus } from './annotate-status';

export function buildSkillMd(
  project: OntologyProject,
  options: { exportedAt: string; version: string }
): string {
  const { exportedAt, version } = options;
  const domainName = typeof project.domain === 'string' ? project.domain : project.domain?.name || '';
  const projectStatus = resolveProjectStatus(project);

  return `# ${project.name} 本体模型 Skill

## 能力概述

该 Skill 包含 **${domainName}** 领域的核心本体模型，Agent 可基于它进行：

- 实体属性查询
- 实体关系推理
- 业务规则解释
- 状态机分析
- 事件影响分析

## 适用场景

- 回答关于领域实体的结构化问题
- 辅助业务人员理解领域模型
- 作为 RAG 知识库补充

## 加载方式

### Coze

将 \`ontology.json\` 作为知识库导入，\`intents.json\` 作为意图示例。

### 自定义 Agent

读取 \`skill.json\` 和 \`ontology.json\`，根据 \`intents.json\` 的 \`triggerPhrases\` 匹配用户查询。

## 文件说明

- \`skill.json\` — Skill 元数据
- \`ontology.json\` — 本体模型数据
- \`intents.json\` — 自然语言意图映射
- \`README.md\` — 面向最终用户的使用说明
- \`examples/query-examples.md\` — 查询类示例
- \`examples/reasoning-examples.md\` — 推理类示例

## 能力边界

- 仅回答模型中已定义的实体、属性、关系、规则
- 不涉及模型外的业务判断
- 不执行写操作

## 状态说明

本 Skill 从 **${projectStatus}** 状态的项目导出。对象级状态含义如下：

- \`confirmed\`：已确认对象，可放心使用
- \`draft\` / \`review\`：未最终确认，使用时需谨慎
- \`unknown\`：源数据中未记录状态，已按默认处理
- \`archived\`：已归档对象，仅作历史参考

## 示例查询

见 \`examples/query-examples.md\`

## 技术信息

- Skill 版本：${version}
- 导出时间：${exportedAt}
- 源工具：Ontology 本体模型建模工具
`;
}
