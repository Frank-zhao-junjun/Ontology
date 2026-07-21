import { normalizeEntity } from '@/lib/ontology-normalizer';
import { resolveEntityRole } from '@/lib/entity-role';
import type { Entity, OntologyProject } from '@/types/ontology';

export function ensureEntityScenario(entity: Entity, stateProject: OntologyProject | null): Entity {
  const scenarios = stateProject?.dataModel?.businessScenarios || [];
  const normalizedEntity = normalizeEntity(entity, scenarios);

  if (!normalizedEntity.businessScenarioId) {
    throw new Error('实体必须归属一个业务场景');
  }

  return normalizedEntity;
}

export function ensureEntityAggregateBoundary(entity: Entity, stateProject: OntologyProject | null): Entity {
  if (entity.entityRole === 'aggregate_root' && entity.parentAggregateId) {
    throw new Error('聚合根不能指定所属聚合根');
  }

  const normalizedEntity = ensureEntityScenario(entity, stateProject);
  const entities = stateProject?.dataModel?.entities || [];

  if (normalizedEntity.entityRole === 'aggregate_root') {
    return normalizedEntity;
  }

  if (!normalizedEntity.parentAggregateId) {
    throw new Error('子实体必须指定所属聚合根');
  }

  if (normalizedEntity.parentAggregateId === normalizedEntity.id) {
    throw new Error('子实体不能将自己作为所属聚合根');
  }

  const parentAggregate = entities.find((item) => item.id === normalizedEntity.parentAggregateId);
  if (!parentAggregate) {
    throw new Error('父聚合根不存在');
  }

  if (parentAggregate.entityRole !== 'aggregate_root') {
    throw new Error('父聚合根不存在');
  }

  return normalizedEntity;
}

export function collectCascadeEntityIds(entities: Entity[], rootId: string): Set<string> {
  const idsToDelete = new Set<string>([rootId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const entity of entities) {
      if (!idsToDelete.has(entity.id) && entity.parentAggregateId && idsToDelete.has(entity.parentAggregateId)) {
        idsToDelete.add(entity.id);
        changed = true;
      }
    }
  }

  return idsToDelete;
}

export function ensureAggregateRootRoleChangeSafety(
  existingEntity: Entity,
  nextEntity: Entity,
  stateProject: OntologyProject | null,
): void {
  if (resolveEntityRole(existingEntity) !== 'aggregate_root' || resolveEntityRole(nextEntity) === 'aggregate_root') {
    return;
  }

  const entities = stateProject?.dataModel?.entities || [];
  const hasChildEntities = entities.some(
    (entity) => entity.id !== existingEntity.id && entity.parentAggregateId === existingEntity.id,
  );

  if (hasChildEntities) {
    throw new Error('存在归属到当前聚合根的子实体，不能直接降级');
  }
}
