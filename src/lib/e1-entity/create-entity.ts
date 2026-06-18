import type { Entity, OntologyProject } from '@/types/ontology';
import { normalizeEntityRoleFields, resolveEntityRole } from '@/lib/entity-role';
import {
  resolveDefaultBusinessScenarioId,
  resolveDefaultProjectId,
} from '@/lib/e1-entity';

export type CreateE1EntityInput = {
  name?: string;
  nameEn?: string;
  description?: string;
  entityRole?: Entity['entityRole'];
  parentAggregateId?: string;
  projectId?: string;
};

export function buildE1Entity(
  project: OntologyProject,
  input: CreateE1EntityInput,
  id: string,
): Entity {
  if (!input.name?.trim()) {
    throw new Error('实体名称不能为空');
  }
  const entityRole: Entity['entityRole'] = input.entityRole ?? 'aggregate_root';
  if (entityRole === 'child_entity' && !input.parentAggregateId) {
    throw new Error('子实体必须指定所属聚合根');
  }

  const projectId = input.projectId
    ?? resolveDefaultProjectId(project.dataModel?.projects, project.id);
  const businessScenarioId = resolveDefaultBusinessScenarioId(
    project.scenarios,
    project.dataModel?.businessScenarios,
  );

  return normalizeEntityRoleFields({
    id,
    name: input.name.trim(),
    nameEn: input.nameEn?.trim() || input.name.trim(),
    description: input.description,
    projectId,
    businessScenarioId,
    entityRole,
    parentAggregateId: entityRole === 'child_entity' ? input.parentAggregateId : undefined,
    attributes: [],
    relations: [],
  });
}
