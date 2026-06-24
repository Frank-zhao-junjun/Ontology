import type { BusinessScenario, Entity, OntologyProject } from '@/types/ontology';

export function mapBusinessScenarios(project: OntologyProject): Array<{
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  applicableObjectTypeIds?: string[];
}> {
  const scenarios = project.dataModel?.businessScenarios ?? [];
  const entities = project.dataModel?.entities ?? [];

  return scenarios.map((scenario: BusinessScenario) => ({
    id: scenario.id,
    name: scenario.name,
    nameEn: scenario.nameEn,
    description: scenario.description,
    applicableObjectTypeIds: entities
      .filter((e: Entity) => e.businessScenarioId === scenario.id)
      .map((e) => e.id),
  }));
}
