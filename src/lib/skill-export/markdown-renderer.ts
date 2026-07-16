import type { OntologyJson, SkillExportScope } from './types';

function scopeLabel(scope: SkillExportScope): string {
  const labels: Record<SkillExportScope, string> = {
    all: '全部模型',
    data: '仅数据模型',
    behavior: '仅行为模型',
    rule: '仅规则模型',
    process: '仅流程模型',
    event: '仅事件模型',
  };
  return labels[scope];
}

function renderObject(obj: Record<string, unknown>, indent = ''): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'status' && typeof value === 'string') {
      lines.push(`${indent}- **状态**：${value}`);
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        lines.push(`${indent}- **${key}**：${value.length} 项`);
      }
    } else if (value && typeof value === 'object') {
      // skip nested objects for readability
    } else if (value !== undefined && value !== null && value !== '') {
      lines.push(`${indent}- **${key}**：${String(value)}`);
    }
  }
  return lines.join('\n');
}

export function renderOntologyMarkdown(ontologyJson: OntologyJson): string {
  const { metadata } = ontologyJson;
  const lines: string[] = [
    `# ${metadata.projectName} 本体模型`,
    '',
    `> 导出状态：${metadata.projectStatus}`,
    `> 导出范围：${scopeLabel(metadata.scope)}`,
    `> 导出时间：${metadata.exportedAt}`,
    `> 版本：${metadata.version}`,
    '',
    metadata.description || '',
    '',
  ];

  if (ontologyJson.dataModel) {
    const dataModel = ontologyJson.dataModel as {
      entities?: Record<string, unknown>[];
      attributes?: Record<string, unknown>[];
      relations?: Record<string, unknown>[];
    };
    lines.push('## 数据模型', '');
    if (dataModel.entities?.length) {
      lines.push('### 实体');
      for (const entity of dataModel.entities) {
        lines.push(`#### ${entity.name || entity.id}`);
        lines.push(renderObject(entity, ''));
        lines.push('');
      }
    }
    if (dataModel.attributes?.length) {
      lines.push(`**属性**：${dataModel.attributes.length} 项`, '');
    }
    if (dataModel.relations?.length) {
      lines.push(`**关系**：${dataModel.relations.length} 项`, '');
    }
  }

  if (ontologyJson.behaviorModel) {
    const behaviorModel = ontologyJson.behaviorModel as { stateMachines?: Record<string, unknown>[] };
    lines.push('## 行为模型', '');
    if (behaviorModel.stateMachines?.length) {
      for (const sm of behaviorModel.stateMachines) {
        lines.push(`### ${sm.name || sm.id}`);
        lines.push(renderObject(sm, ''));
        lines.push('');
      }
    }
  }

  if (ontologyJson.ruleModel) {
    const ruleModel = ontologyJson.ruleModel as { rules?: Record<string, unknown>[] };
    lines.push('## 规则模型', '');
    if (ruleModel.rules?.length) {
      for (const rule of ruleModel.rules) {
        lines.push(`### ${rule.name || rule.id}`);
        lines.push(renderObject(rule, ''));
        lines.push('');
      }
    }
  }

  if (ontologyJson.processModel) {
    const processModel = ontologyJson.processModel as { orchestrations?: Record<string, unknown>[] };
    lines.push('## 流程模型', '');
    if (processModel.orchestrations?.length) {
      lines.push(`**流程编排**：${processModel.orchestrations.length} 项`, '');
    }
  }

  if (ontologyJson.eventModel) {
    const eventModel = ontologyJson.eventModel as {
      events?: Record<string, unknown>[];
      subscriptions?: Record<string, unknown>[];
    };
    lines.push('## 事件模型', '');
    if (eventModel.events?.length) {
      lines.push(`**事件定义**：${eventModel.events.length} 项`, '');
    }
    if (eventModel.subscriptions?.length) {
      lines.push(`**订阅**：${eventModel.subscriptions.length} 项`, '');
    }
  }

  if (ontologyJson.organization) {
    const org = ontologyJson.organization as {
      departments?: Record<string, unknown>[];
      positions?: Record<string, unknown>[];
    };
    lines.push('## 组织体系', '');
    if (org.departments?.length) {
      lines.push(`**部门**：${org.departments.length} 项`, '');
    }
    if (org.positions?.length) {
      lines.push(`**岗位**：${org.positions.length} 项`, '');
    }
  }

  if (ontologyJson.agentSemanticLayer) {
    lines.push('## Agent 语义层', '');
    lines.push('本 Skill 包含 Agent 语义层定义，用于自然语言意图映射。', '');
  }

  return lines.join('\n');
}
