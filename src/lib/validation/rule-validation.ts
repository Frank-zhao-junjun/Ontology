import type { Rule, OntologyProject } from '@/types/ontology';

export function ensureRuleDefinitionRules(
  rule: Rule,
  stateProject: OntologyProject | null,
): Rule {
  const normalizedName = rule.name.trim();
  if (!normalizedName) {
    throw new Error('规则名称不能为空');
  }

  const entities = stateProject?.dataModel?.entities || [];
  const targetEntity = entities.find((entity) => entity.id === rule.entity);
  if (!targetEntity) {
    throw new Error('规则必须绑定到有效实体');
  }

  if (rule.type === 'field_validation') {
    const normalizedField = rule.field?.trim();
    if (!normalizedField) {
      throw new Error('字段级校验必须绑定字段');
    }
  }

  let normalizedConditionFields = rule.condition.fields;
  if (rule.type === 'cross_field_validation') {
    const fields = (rule.condition.fields || [])
      .map((field) => field.trim())
      .filter(Boolean);
    const uniqueFields = Array.from(new Set(fields));
    if (uniqueFields.length < 2) {
      throw new Error('跨字段校验至少需要两个字段');
    }
    if (!rule.condition.expression?.trim()) {
      throw new Error('跨字段校验必须提供表达式');
    }
    normalizedConditionFields = uniqueFields;
  }

  if (rule.type === 'cross_entity_validation') {
    const checkEntity = rule.condition.checkEntity?.trim();
    if (!checkEntity) {
      throw new Error('业务约束规则必须配置检查实体');
    }
    if (!entities.some((entity) => entity.id === checkEntity)) {
      throw new Error('业务约束规则必须引用已定义实体');
    }
    if (!rule.condition.checkCondition?.trim()) {
      throw new Error('业务约束规则必须配置检查条件');
    }
  }

  const conditionType = rule.condition.type;
  if (conditionType === 'regex' && !rule.condition.pattern?.trim()) {
    throw new Error('正则校验必须提供 pattern');
  }

  if (conditionType === 'range') {
    if (typeof rule.condition.min !== 'number' || typeof rule.condition.max !== 'number') {
      throw new Error('范围校验必须提供 min 和 max');
    }
    if (rule.condition.min > rule.condition.max) {
      throw new Error('范围校验的 min 不能大于 max');
    }
  }

  if (
    conditionType === 'expression' &&
    rule.type !== 'cross_entity_validation' &&
    !rule.condition.expression?.trim()
  ) {
    throw new Error('表达式校验必须提供 expression');
  }

  const normalizedPriority = Number.isFinite(rule.priority)
    ? Math.max(1, Math.floor(rule.priority as number))
    : 100;

  return {
    ...rule,
    name: normalizedName,
    field: rule.field?.trim() || undefined,
    priority: normalizedPriority,
    errorMessage: rule.errorMessage.trim() || '校验失败',
    enabled: rule.enabled !== false,
    description: rule.description?.trim() || undefined,
    condition: {
      ...rule.condition,
      pattern: rule.condition.pattern?.trim() || undefined,
      expression: rule.condition.expression?.trim() || undefined,
      fields: normalizedConditionFields,
      checkEntity: rule.condition.checkEntity?.trim() || undefined,
      checkCondition: rule.condition.checkCondition?.trim() || undefined,
    },
  };
}
