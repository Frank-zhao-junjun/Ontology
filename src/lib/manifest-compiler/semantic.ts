import type { OntologyManifestMetadata, OntologyManifestSemantic } from '@/lib/manifest-validator';
import type { OntologyProject } from '@/types/ontology';
import { mapBusinessScenarios } from './mappers/business-scenarios';
import { mapObjectTypes } from './mappers/object-types';
import { mapStateMachines } from './mappers/state-machines';
import { toStableId } from './mappers/utils';

/**
 * S09: Extract value objects from entities whose entityRole === 'value_object'.
 * Each value object keeps its attributes mapped as ManifestProperty.
 */
function mapValueObjects(project: OntologyProject) {
  const entities = project.dataModel?.entities ?? [];
  return entities
    .filter((e) => e.entityRole === 'value_object')
    .map((e) => ({
      id: e.id,
      name: e.name,
      nameEn: e.nameEn,
      properties: (e.attributes ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        nameEn: a.nameEn ?? a.name,
        dataType: a.dataType,
        required: a.required,
      })),
    }));
}

/**
 * S10: Map OntologyEnumDef → ManifestEnumDef
 */
function mapEnumDefs(project: OntologyProject) {
  const enumDefs = project.dataModel?.enumDefs ?? [];
  return enumDefs.map((ed) => ({
    id: ed.id,
    name: ed.name,
    nameEn: ed.nameEn,
    combinationPolicy: ed.combinationPolicy,
    values: (ed.values ?? []).map((v, idx) => ({
      id: v.code || `ev-${idx}`,
      name: v.label,
      nameEn: v.labelEn || v.code,
      description: v.description,
    })),
    description: ed.description,
  }));
}

export function compileSemantic(
  project: OntologyProject,
  metadata: OntologyManifestMetadata
): OntologyManifestSemantic {
  const domain = project.domain;

  const valueObjects = mapValueObjects(project);
  const enumDefs = mapEnumDefs(project);

  // S09: Value objects should not also appear in objectTypes
  const voIds = new Set(valueObjects.map((vo) => vo.id));
  const allObjectTypes = mapObjectTypes(project).filter((ot) => !voIds.has(ot.id));

  return {
    boundedContext: {
      id: `bc-${toStableId(domain.id)}`,
      name: domain.name,
      nameEn: domain.nameEn,
      description: domain.description,
      ontologyId: metadata.id,
    },
    businessScenarios: mapBusinessScenarios(project),
    valueObjects,
    objectTypes: allObjectTypes,
    enumDefs,
    stateMachines: mapStateMachines(project.behaviorModel),
  };
}
