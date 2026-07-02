import type { Entity, Relation, Rule, StateMachine } from '@/types/ontology';
import type { OntologyJson } from './types';

export interface IntentDefinition {
  id: string;
  name: string;
  triggerPhrases: string[];
  action: string;
  targetEntity?: string;
  targetRelation?: string;
  targetRule?: string;
  targetStateMachine?: string;
  slots: { name: string; required: boolean; type: string }[];
}

export interface IntentsJson {
  intents: IntentDefinition[];
}

function entityIntents(entity: Entity): IntentDefinition[] {
  const name = entity.name;
  const nameEn = entity.nameEn || entity.name;
  return [
    {
      id: `intent-query-entity-${nameEn}`,
      name: `查询${name}`,
      triggerPhrases: [`${name}是什么`, `查询${name}`, `${name}有哪些属性`],
      action: 'query_entity',
      targetEntity: nameEn,
      slots: [{ name: 'entityName', required: false, type: 'string' }],
    },
    {
      id: `intent-explain-entity-${nameEn}`,
      name: `解释${name}`,
      triggerPhrases: [`解释${name}`, `${name}的业务含义`, `${name}有什么用`],
      action: 'explain_entity',
      targetEntity: nameEn,
      slots: [],
    },
  ];
}

function relationIntents(relation: Relation): IntentDefinition[] {
  const name = relation.name;
  return [
    {
      id: `intent-relation-${relation.id}`,
      name: `${name}关系查询`,
      triggerPhrases: [`${name}是什么关系`, `解释${name}`, `${name}如何关联`],
      action: 'query_relation',
      targetRelation: relation.id,
      slots: [],
    },
  ];
}

function ruleIntents(rule: Rule): IntentDefinition[] {
  return [
    {
      id: `intent-rule-${rule.id}`,
      name: `${rule.name}规则解释`,
      triggerPhrases: [`${rule.name}是什么`, `解释${rule.name}`, `${rule.name}的触发条件`],
      action: 'explain_rule',
      targetRule: rule.id,
      slots: [],
    },
  ];
}

function stateMachineIntents(sm: StateMachine): IntentDefinition[] {
  return [
    {
      id: `intent-statemachine-${sm.id}`,
      name: `${sm.name}状态分析`,
      triggerPhrases: [`${sm.name}有哪些状态`, `${sm.name}如何流转`, `分析${sm.name}`],
      action: 'analyze_state_machine',
      targetStateMachine: sm.id,
      slots: [],
    },
  ];
}

export function buildIntentsJson(ontologyJson: OntologyJson): IntentsJson {
  const intents: IntentDefinition[] = [];

  const dataModel = ontologyJson.dataModel as
    | { entities?: Entity[]; relations?: Relation[] }
    | undefined;
  if (dataModel) {
    for (const entity of dataModel.entities || []) {
      intents.push(...entityIntents(entity));
    }
    for (const relation of dataModel.relations || []) {
      intents.push(...relationIntents(relation));
    }
  }

  const ruleModel = ontologyJson.ruleModel as { rules?: Rule[] } | undefined;
  if (ruleModel) {
    for (const rule of ruleModel.rules || []) {
      intents.push(...ruleIntents(rule));
    }
  }

  const behaviorModel = ontologyJson.behaviorModel as { stateMachines?: StateMachine[] } | undefined;
  if (behaviorModel) {
    for (const sm of behaviorModel.stateMachines || []) {
      intents.push(...stateMachineIntents(sm));
    }
  }

  return { intents };
}
