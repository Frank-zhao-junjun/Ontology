import type { Entity, EntityRole, OntologyProject } from '@/types/ontology';

export function resolveEntityRole(entity?: Partial<Entity> | null): EntityRole {
  if (entity?.entityRole === 'aggregate_root' || entity?.entityRole === 'child_entity') {
    return entity.entityRole;
  }

  return entity?.isAggregateRoot ? 'aggregate_root' : 'child_entity';
}

export function isEntityAggregateRoot(entity?: Partial<Entity> | null): boolean {
  return resolveEntityRole(entity) === 'aggregate_root';
}

export function normalizeEntityRoleFields<T extends Partial<Entity>>(entity: T): T & {
  entityRole: EntityRole;
  isAggregateRoot: boolean;
  parentAggregateId?: string;
} {
  const entityRole = resolveEntityRole(entity);

  return {
    ...entity,
    entityRole,
    isAggregateRoot: entityRole === 'aggregate_root',
    parentAggregateId: entityRole === 'child_entity' ? entity.parentAggregateId : undefined,
  };
}

export function getAggregateRootEntities(entities: Entity[]): Entity[] {
  return entities.filter((entity) => isEntityAggregateRoot(entity));
}

export function getEntityRoleLabel(role?: EntityRole): string {
  switch (role) {
    case 'aggregate_root':
      return '聚合根';
    case 'child_entity':
    default:
      return '聚合内子实体';
  }
}

export function normalizeOntologyProjectEntityRoles(project: OntologyProject): OntologyProject {
  if (!project.dataModel) {
    return project;
  }

  return {
    ...project,
    dataModel: {
      ...project.dataModel,
      entities: project.dataModel.entities.map((entity) => normalizeEntityRoleFields(entity)),
    },
  };
}
