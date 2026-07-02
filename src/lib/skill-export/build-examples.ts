import type { Entity, Relation, Rule, StateMachine } from '@/types/ontology';
import type { OntologyJson } from './types';

export interface ExamplesBundle {
  queryExamples: string;
  reasoningExamples: string;
}

function generateQueryExamples(ontologyJson: OntologyJson): string {
  const lines: string[] = ['# 查询类示例', ''];

  const dataModel = ontologyJson.dataModel as
    | { entities?: Entity[]; relations?: Relation[] }
    | undefined;

  if (dataModel?.entities?.length) {
    lines.push('## 实体查询');
    for (const entity of dataModel.entities.slice(0, 10)) {
      lines.push(`- ${entity.name}有哪些属性？`);
      lines.push(`- ${entity.name}的业务含义是什么？`);
    }
    lines.push('');
  }

  if (dataModel?.relations?.length) {
    lines.push('## 关系查询');
    for (const relation of dataModel.relations.slice(0, 10)) {
      lines.push(`- ${relation.name}是什么关系？`);
    }
    lines.push('');
  }

  const ruleModel = ontologyJson.ruleModel as { rules?: Rule[] } | undefined;
  if (ruleModel?.rules?.length) {
    lines.push('## 规则查询');
    for (const rule of ruleModel.rules.slice(0, 10)) {
      lines.push(`- ${rule.name}的触发条件是什么？`);
    }
    lines.push('');
  }

  const behaviorModel = ontologyJson.behaviorModel as { stateMachines?: StateMachine[] } | undefined;
  if (behaviorModel?.stateMachines?.length) {
    lines.push('## 状态机查询');
    for (const sm of behaviorModel.stateMachines.slice(0, 10)) {
      lines.push(`- ${sm.name}有哪些状态？`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateReasoningExamples(ontologyJson: OntologyJson): string {
  const lines: string[] = ['# 推理类示例', ''];

  const dataModel = ontologyJson.dataModel as
    | { entities?: Entity[]; relations?: Relation[] }
    | undefined;

  if (dataModel?.relations?.length) {
    lines.push('## 跨实体推理');
    for (const relation of dataModel.relations.slice(0, 5)) {
      lines.push(`- 已知一个${relation.name}关系，如何推断相关实体的状态变化？`);
    }
    lines.push('');
  }

  const behaviorModel = ontologyJson.behaviorModel as { stateMachines?: StateMachine[] } | undefined;
  if (behaviorModel?.stateMachines?.length) {
    lines.push('## 状态转换推理');
    for (const sm of behaviorModel.stateMachines.slice(0, 5)) {
      lines.push(`- ${sm.name}中，从初始状态到终止状态需要经过哪些步骤？`);
    }
    lines.push('');
  }

  const ruleModel = ontologyJson.ruleModel as { rules?: Rule[] } | undefined;
  if (ruleModel?.rules?.length) {
    lines.push('## 规则触发推理');
    for (const rule of ruleModel.rules.slice(0, 5)) {
      lines.push(`- 当${rule.name}被触发时，会对哪些实体产生影响？`);
    }
    lines.push('');
  }

  lines.push('## 综合推理');
  lines.push('- 当某个实体的关键属性发生变化时，哪些规则和事件会被触发？');
  lines.push('');

  return lines.join('\n');
}

export function buildExamples(ontologyJson: OntologyJson): ExamplesBundle {
  return {
    queryExamples: generateQueryExamples(ontologyJson),
    reasoningExamples: generateReasoningExamples(ontologyJson),
  };
}
