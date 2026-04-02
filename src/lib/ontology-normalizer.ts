import { normalizeEntityRoleFields, normalizeOntologyProjectEntityRoles } from '@/lib/entity-role';
import type { Attribute, AttributeDataType, AttributeReferenceKind, BusinessScenario, Entity, OntologyProject } from '@/types/ontology';

type LegacyAttribute = Partial<Attribute> & {
  type?: AttributeDataType;
  metadataId?: string;
  metadataName?: string;
  refEntity?: string;
  referenceTargetType?: 'entity' | 'masterdata';
  refDisplayField?: string;
  masterDataId?: string;
  masterDataName?: string;
  masterDataIds?: string[];
  masterDataNames?: string[];
};

type LegacyEntity = Partial<Entity> & {
  scenarioId?: string;
  attributes?: LegacyAttribute[];
};

function resolveBusinessScenarioId(entity: LegacyEntity, scenarios: BusinessScenario[]): string {
  if (entity.businessScenarioId) {
    return entity.businessScenarioId;
  }

  if (entity.scenarioId) {
    return entity.scenarioId;
  }

  if (scenarios.length === 1) {
    return scenarios[0].id;
  }

  return '';
}

function resolveReferenceKind(attribute: LegacyAttribute, dataType: AttributeDataType): AttributeReferenceKind | undefined {
  if (dataType !== 'reference') {
    return undefined;
  }

  if (attribute.referenceKind) {
    return attribute.referenceKind;
  }

  if (attribute.referenceTargetType === 'masterdata') {
    return 'masterData';
  }

  if (attribute.referenceTargetType === 'entity' || attribute.refEntity || attribute.referencedEntityId) {
    return 'entity';
  }

  if (attribute.isMasterDataRef || attribute.masterDataType || attribute.masterDataId || attribute.masterDataIds?.length) {
    return 'masterData';
  }

  return undefined;
}

export function normalizeAttribute(attribute: LegacyAttribute): Attribute {
  const dataType = attribute.dataType ?? attribute.type ?? 'string';
  const referenceKind = resolveReferenceKind(attribute, dataType);
  const masterDataType = attribute.masterDataType ?? attribute.masterDataId ?? attribute.masterDataIds?.[0];
  const isMasterDataRef = dataType === 'reference' && (attribute.isMasterDataRef ?? (referenceKind === 'masterData' || Boolean(masterDataType)));

  return {
    id: attribute.id || Math.random().toString(36).substring(2, 10),
    name: attribute.name || '未命名属性',
    nameEn: attribute.nameEn,
    dataType,
    length: attribute.length,
    precision: attribute.precision,
    scale: attribute.scale,
    required: attribute.required,
    unique: attribute.unique,
    default: attribute.default,
    enumRef: attribute.enumRef,
    referenceKind: dataType === 'reference' ? referenceKind : undefined,
    referencedEntityId: dataType === 'reference' && referenceKind === 'entity'
      ? (attribute.referencedEntityId ?? attribute.refEntity)
      : undefined,
    referenceDisplayField: attribute.referenceDisplayField ?? attribute.refDisplayField,
    isMasterDataRef: dataType === 'reference' ? isMasterDataRef : false,
    masterDataType: dataType === 'reference' && isMasterDataRef ? masterDataType : undefined,
    masterDataField: dataType === 'reference' && isMasterDataRef ? attribute.masterDataField : undefined,
    autoFill: attribute.autoFill,
    description: attribute.description,
    metadataTemplateId: attribute.metadataTemplateId ?? attribute.metadataId,
    metadataTemplateName: attribute.metadataTemplateName ?? attribute.metadataName,
  };
}

export function normalizeEntity(entity: LegacyEntity, scenarios: BusinessScenario[]): Entity {
  return normalizeEntityRoleFields({
    ...entity,
    businessScenarioId: resolveBusinessScenarioId(entity, scenarios),
    attributes: (entity.attributes || []).map((attribute) => normalizeAttribute(attribute)),
    relations: entity.relations || [],
  }) as Entity;
}

export function normalizeOntologyProject(project: OntologyProject): OntologyProject {
  const roleNormalized = normalizeOntologyProjectEntityRoles(project);

  if (!roleNormalized.dataModel) {
    return roleNormalized;
  }

  const scenarios = roleNormalized.dataModel.businessScenarios || [];

  return {
    ...roleNormalized,
    dataModel: {
      ...roleNormalized.dataModel,
      entities: roleNormalized.dataModel.entities.map((entity) => normalizeEntity(entity, scenarios)),
    },
  };
}