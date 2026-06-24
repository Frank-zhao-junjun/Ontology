import type { Attribute, OntologyProject } from '@/types/ontology';
import type { ManifestObjectType, ManifestProperty } from '@/lib/manifest-validator';
import { mapEntityRoleToObjectTypeKind, mapRelationCardinality } from './enums';

function mapAttribute(entityId: string, attr: Attribute): ManifestProperty {
  const prop: ManifestProperty = {
    id: attr.id,
    name: attr.name,
    nameEn: attr.nameEn ?? attr.name,
    dataType: attr.dataType,
    required: attr.required,
  };

  if (attr.dataType === 'reference') {
    const reference: Record<string, unknown> = {
      kind: attr.referenceKind ?? 'entity',
    };
    if (attr.referencedEntityId) {
      reference.targetObjectTypeId = attr.referencedEntityId;
    }
    if (attr.masterDataType) {
      reference.masterDataType = attr.masterDataType;
    }
    if (attr.masterDataField) {
      reference.masterDataField = attr.masterDataField;
    }
    prop.reference = reference;
  }

  if (attr.metadataTemplateId) {
    (prop as ManifestProperty & { metadataTemplateId?: string }).metadataTemplateId =
      attr.metadataTemplateId;
  }

  // 避免跨实体属性 id 冲突（V11）
  if (!prop.id.includes(entityId)) {
    prop.id = `${entityId}--${attr.id}`;
  }

  return prop;
}

export function mapObjectTypes(project: OntologyProject): ManifestObjectType[] {
  const entities = project.dataModel?.entities ?? [];

  return entities.map((entity) => {
    const kind = mapEntityRoleToObjectTypeKind(entity);
    const ot: ManifestObjectType = {
      id: entity.id,
      name: entity.name,
      nameEn: entity.nameEn,
      kind,
      properties: (entity.attributes ?? []).map((a) => mapAttribute(entity.id, a)),
      relations: (entity.relations ?? []).map((rel) => ({
        id: rel.id,
        name: rel.name,
        sourceObjectTypeId: entity.id,
        targetObjectTypeId: rel.targetEntity,
        cardinality: mapRelationCardinality(rel.type),
        relationKind: 'reference' as const,
        viaObjectTypeId: rel.viaEntity,
        description: rel.description,
      })),
    };

    if (kind === 'entity' && entity.parentAggregateId) {
      ot.aggregateRootId = entity.parentAggregateId;
    }

    if (entity.businessScenarioId) {
      (ot as ManifestObjectType & { businessScenarioIds?: string[] }).businessScenarioIds = [
        entity.businessScenarioId,
      ];
    }

    return ot;
  });
}
