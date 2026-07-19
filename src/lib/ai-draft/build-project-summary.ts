import type { OntologyProject } from '@/types/ontology';

/** 注入 LLM prompt 的项目摘要最大长度（字符） */
export const PROJECT_SUMMARY_MAX_LENGTH = 2000;

/**
 * 将项目中所有要素以紧凑文本格式输出，供 NL 语义查询的 LLM prompt 使用。
 *
 * 覆盖：E1 实体+属性+关系（每行一条）、E2 状态机、E3 规则、E4 事件、
 * E5 部门/岗位，以及其余维度要素的名称列表。
 * 超过 2000 字符时截断并追加标注。
 */
export function buildProjectOntologySummary(project: OntologyProject): string {
  const lines: string[] = [];

  // E1 数据模型：实体 + 属性 + 关系
  const entities = project.dataModel?.entities ?? [];
  const entityNameById = new Map(entities.map((e) => [e.id, e.name]));
  if (entities.length > 0) {
    lines.push('## E1 数据模型');
    for (const e of entities) {
      lines.push(
        `实体 | ${e.id} | ${e.name}${e.nameEn ? ` (${e.nameEn})` : ''}${e.description ? ` | ${e.description}` : ''}`,
      );
      for (const attr of e.attributes ?? []) {
        lines.push(`属性 | ${e.id} | ${attr.id} | ${e.name}.${attr.name} | ${attr.dataType}`);
      }
      for (const rel of e.relations ?? []) {
        const targetName = entityNameById.get(rel.targetEntity) ?? rel.targetEntity;
        lines.push(`关系 | ${rel.id} | ${e.name} -> ${targetName} | ${rel.type} | ${rel.name}`);
      }
    }
  }

  // E2 行为模型：状态机 + 状态
  const stateMachines = project.behaviorModel?.stateMachines ?? [];
  if (stateMachines.length > 0) {
    lines.push('## E2 行为模型');
    for (const sm of stateMachines) {
      const stateNames = (sm.states ?? []).map((s) => s.name).join('/');
      lines.push(`状态机 | ${sm.id} | ${sm.name}${stateNames ? ` | 状态: ${stateNames}` : ''}`);
    }
  }

  // E3 规则模型
  const rules = project.ruleModel?.rules ?? [];
  if (rules.length > 0) {
    lines.push('## E3 规则模型');
    for (const rule of rules) {
      lines.push(`规则 | ${rule.id} | ${rule.name} | ${rule.type}`);
    }
  }

  // E4 事件模型
  const events = project.eventModel?.events ?? [];
  if (events.length > 0) {
    lines.push('## E4 事件模型');
    for (const ev of events) {
      lines.push(`事件 | ${ev.id} | ${ev.name} | ${ev.trigger}`);
    }
  }

  // E5 组织模型
  const departments = project.organizationModel?.departments ?? [];
  const positions = project.organizationModel?.positions ?? [];
  if (departments.length > 0 || positions.length > 0) {
    lines.push('## E5 组织模型');
    for (const dept of departments) {
      lines.push(`部门 | ${dept.id} | ${dept.name}`);
    }
    for (const pos of positions) {
      lines.push(`岗位 | ${pos.id} | ${pos.name}`);
    }
  }

  // 其余维度要素名称列表（E6 指标 / E7 约束 / E8 接口等）
  const metrics = project.metricsModel?.metrics ?? [];
  if (metrics.length > 0) {
    lines.push(`## E6 指标: ${metrics.map((m) => m.name).join('、')}`);
  }
  const constraints = project.constraints ?? [];
  if (constraints.length > 0) {
    lines.push(`## E7 约束: ${constraints.map((c) => c.name).join('、')}`);
  }
  const interfaces = project.interfaces ?? [];
  if (interfaces.length > 0) {
    lines.push(`## E8 接口: ${interfaces.map((i) => i.name).join('、')}`);
  }

  const full = lines.join('\n');
  if (full.length <= PROJECT_SUMMARY_MAX_LENGTH) return full;
  return `${full.slice(0, PROJECT_SUMMARY_MAX_LENGTH)}\n...（摘要已截断，原始长度 ${full.length} 字符）`;
}
