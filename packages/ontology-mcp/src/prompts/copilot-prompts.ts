/**
 * MCP Prompts: modeling_copilot, validator_expert
 *
 * System prompts for ontology modeling assistance and validation expertise.
 */

import type { PromptDefinition, PromptHandler } from '../index.js';

// ----- Prompt definitions -----

export const promptDefinitions: PromptDefinition[] = [
  {
    name: 'modeling_copilot',
    description: '获取建模助手系统提示，引导 AI 逐步完成 Ontology 建模',
    arguments: [
      {
        name: 'projectId',
        description: '项目 ID（可选），加载项目上下文',
        required: false,
      },
    ],
  },
  {
    name: 'validator_expert',
    description: '获取校验专家提示，指导 EPC/Manifest 校验流程',
    arguments: [
      {
        name: 'projectId',
        description: '项目 ID（可选），加载项目上下文',
        required: false,
      },
    ],
  },
];

// ----- Prompt handlers -----

export const promptHandlers: Record<string, PromptHandler> = {
  modeling_copilot: async (args: Record<string, string | undefined>) => {
    const { projectId } = args;
    let contextNote = '';
    let projectSummary = '';

    if (projectId) {
      try {
        const { projectStore } = await import('../store/project-store.js');
        const stored = await projectStore.get(projectId);
        if (stored) {
          const p = stored.data;
          contextNote = `\n当前项目: **${p.name}** (${p.id})`;
          projectSummary = `\n- 价值域: ${(p.valueDomains ?? []).length}个
- 能力: ${(p.capabilities ?? []).length}个
- 场景: ${(p.scenarios ?? []).length}个
- EPC流程: ${(p.epcProcesses ?? []).length}个`;
        } else {
          contextNote = `\n⚠️ 项目 ${projectId} 不存在。请先创建或加载项目。`;
        }
      } catch {
        contextNote = `\n⚠️ 无法加载项目 ${projectId}。`;
      }
    }

    const messages = [
      {
        role: 'system' as const,
        content: {
          type: 'text' as const,
          text: `# Ontology 建模助手

你是一位资深的 Ontology 模型架构师，精通领域驱动设计（DDD）和 Event Storming 方法论。
你的任务是通过对话引导用户逐步完成业务链建模。

## 核心方法论

Ontology 业务链遵循 A → B → C → EPC 四层递进结构：

| 层级 | 名称 | 说明 |
|------|------|------|
| **A** | 业务价值域 (ValueDomain) | 业务领域顶层划分，如"财务"、"供应链" |
| **B** | 业务能力 (Capability) | 该价值域下具备的业务能力，如"账务处理" |
| **C** | 业务场景 (Scenario) | 具体业务场景，如"发起报销" |
| **EPC** | 业务流程 (EpcProcess) | 流程步骤，可对接 E1~E8 元元素 |

## 建模步骤

1. 先定义业务价值域（A）
2. 在每个价值域下定义业务能力（B）
3. 在每个能力下定义业务场景（C）
4. 在每个场景下设计 EPC 流程步骤

## 可用工具

- \`ontology_project_create\` — 创建新项目
- \`ontology_business_chain_add\` — 添加节点 (A/B/C/EPC)
- \`ontology_business_chain_update\` — 更新节点
- \`ontology_business_chain_delete\` — 删除节点
- \`ontology_manifest_compile\` — 编译 Manifest
- \`ontology_lint_epc\` — EPC Lint 检查
- \`ontology_coverage_report\` — 覆盖率报告

## 约束

- 每个节点必须有中文名称
- B 必须挂载在 A 下，C 必须挂载在 B 下，EPC 必须挂载在 C 下
- 有子节点的节点不能删除
- 所有修改通过 MCP 工具执行，不要伪造数据
${contextNote}${projectSummary}`,
        },
      },
    ];

    return { messages };
  },

  validator_expert: async (args: Record<string, string | undefined>) => {
    const { projectId } = args;
    let contextNote = '';

    if (projectId) {
      try {
        const { projectStore } = await import('../store/project-store.js');
        const stored = await projectStore.get(projectId);
        if (stored) {
          contextNote = `\n正在检查项目: **${stored.data.name}** (${stored.data.id})`;
        } else {
          contextNote = `\n⚠️ 项目 ${projectId} 不存在。`;
        }
      } catch {
        contextNote = `\n⚠️ 无法加载项目 ${projectId}。`;
      }
    }

    const messages = [
      {
        role: 'system' as const,
        content: {
          type: 'text' as const,
          text: `# Ontology 校验专家

你是 Ontology 模型校验专家。你的职责是使用 MCP 工具检查模型质量并生成报告。

## 校验流程

1. **Lint 检查**: 使用 \`ontology_lint_epc\` 检查所有 EPC 流程的合规性
2. **覆盖率分析**: 使用 \`ontology_coverage_report\` 查看场景的 EPC 覆盖情况
3. **Manifest 编译**: 使用 \`ontology_manifest_compile\` 编译完整 Manifest
4. **一致性检查**: 通过 resource \`ontology://project/{id}/consistency\` 获取交叉一致性

## 常见问题

| 问题类型 | 严重等级 | 说明 |
|---------|---------|------|
| 命名不一致 | WARNING | 中英文命名不匹配 |
| 元素未引用 | WARNING | 元元素未在任何 EPC 步骤中使用 |
| 父节点缺失 | ERROR | B/C/EPC 节点父级不存在 |
| 循环引用 | ERROR | 节点间存在循环依赖 |
| 覆盖率不足 | WARNING | 场景缺少 EPC 流程覆盖 |
${contextNote}`,
        },
      },
    ];

    return { messages };
  },
};
