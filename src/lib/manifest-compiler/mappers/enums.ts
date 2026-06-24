import type { Relation } from '@/types/ontology';
import type { RuleType } from '@/types/ontology';
import { resolveEntityRole } from '@/lib/entity-role';
import type { Entity } from '@/types/ontology';
import type { ObjectTypeKind } from '@/lib/manifest-validator';

export function mapEntityRoleToObjectTypeKind(entity: Entity): ObjectTypeKind {
  return resolveEntityRole(entity) === 'aggregate_root' ? 'aggregate_root' : 'entity';
}

export function mapRelationCardinality(
  type: Relation['type']
): '1:1' | '1:N' | 'N:M' {
  switch (type) {
    case 'one_to_one':
      return '1:1';
    case 'one_to_many':
      return '1:N';
    case 'many_to_many':
      return 'N:M';
    default:
      return '1:N';
  }
}

/** 设计台 Rule.type → Manifest rule.type */
export function mapRuleType(type: RuleType): string {
  switch (type) {
    case 'field_validation':
      return 'field_validation';
    case 'cross_field_validation':
      return 'cross_field';
    case 'cross_entity_validation':
      return 'cross_entity';
    case 'aggregation_validation':
      return 'cross_entity';
    case 'temporal_rule':
      return 'precondition';
    default:
      return 'field_validation';
  }
}
