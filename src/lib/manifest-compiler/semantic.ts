import type { OntologyManifestMetadata, OntologyManifestSemantic } from '@/lib/manifest-validator';
import type { OntologyProject } from '@/types/ontology';
import { mapBusinessScenarios } from './mappers/business-scenarios';
import { mapObjectTypes } from './mappers/object-types';
import { mapStateMachines } from './mappers/state-machines';
import { toStableId } from './mappers/utils';

export function compileSemantic(
  project: OntologyProject,
  metadata: OntologyManifestMetadata
): OntologyManifestSemantic {
  const domain = project.domain;

  return {
    boundedContext: {
      id: `bc-${toStableId(domain.id)}`,
      name: domain.name,
      nameEn: domain.nameEn,
      description: domain.description,
      ontologyId: metadata.id,
    },
    businessScenarios: mapBusinessScenarios(project),
    valueObjects: [],
    objectTypes: mapObjectTypes(project),
    stateMachines: mapStateMachines(project.behaviorModel),
  };
}
