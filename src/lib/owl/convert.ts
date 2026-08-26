import type {
  Entity,
  OntologyProject,
  OwlClass,
  OwlDatatypeProperty,
  OwlObjectProperty,
  OwlOntology,
} from '@/types/ontology';

// AttributeDataType → xsd 类型映射（reference 单独映射为 ObjectProperty，不在此表）
const DATATYPE_TO_XSD: Record<string, string> = {
  string: 'xsd:string',
  text: 'xsd:string',
  integer: 'xsd:integer',
  decimal: 'xsd:decimal',
  boolean: 'xsd:boolean',
  date: 'xsd:date',
  datetime: 'xsd:dateTime',
  enum: 'xsd:string',
};

/** 生成合法的 URI 片段（仅保留字母数字、下划线、连字符） */
function toUriFragment(raw: string): string {
  const safe = raw
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return safe || 'unnamed';
}

export interface ProjectToOwlOptions {
  baseUri?: string;
}

/**
 * OntologyProject → OwlOntology 转换。
 *
 * 映射范围（本期）：E1 实体/属性/关系、E4 事件、E5 部门/岗位、
 * Agent 语义层中 is_a / equivalent_to 语义关系。
 * 范围外（不映射）：E2 状态机、E6 指标、E7 约束、E8 接口。
 *
 * 容错策略：引用无法解析到 OwlClass 时跳过该条并 console.warn 计数，不生成悬空 URI。
 */
export function projectToOwlOntology(
  project: OntologyProject,
  options?: ProjectToOwlOptions,
): OwlOntology {
  const baseUri =
    options?.baseUri ?? `http://ontology.local/${toUriFragment(project.id || 'project')}/`;

  const classes: OwlClass[] = [];
  const objectProperties: OwlObjectProperty[] = [];
  const datatypeProperties: OwlDatatypeProperty[] = [];

  // metaElement/元素 ID → OwlClass.id 解析表（SemanticRelation、reference 属性解析用）
  const classIdByRef = new Map<string, string>();
  let skippedCount = 0;
  const warnSkip = (reason: string) => {
    skippedCount += 1;
    console.warn(`[owl-convert] 跳过（${skippedCount}）: ${reason}`);
  };

  const registerClass = (cls: OwlClass, refIds: string[]) => {
    classes.push(cls);
    for (const refId of refIds) {
      if (refId && !classIdByRef.has(refId)) classIdByRef.set(refId, cls.id);
    }
  };

  // ---- E1 实体 → owl:Class ----
  const entities = project.dataModel?.entities ?? [];
  const entityClassId = (e: Entity) => toUriFragment(e.nameEn || e.id);

  for (const e of entities) {
    registerClass(
      {
        id: entityClassId(e),
        label: e.name,
        labelEn: e.nameEn,
        description: e.description,
        sourceMetaElementId: e.id,
      },
      [e.id],
    );
  }

  // metaElement 引用补充登记（SemanticRelation 的 source/target 引用 metaElement ID）
  for (const me of project.metaElements ?? []) {
    if (classIdByRef.has(me.id)) continue;
    if (me.dimension === 'E1') {
      const matched = entities.find((e) => e.name === me.name || e.nameEn === me.nameEn);
      if (matched) classIdByRef.set(me.id, entityClassId(matched));
    }
  }

  // 子实体 → rdfs:subClassOf 父聚合根
  for (const e of entities) {
    if (e.entityRole !== 'child_entity' || !e.parentAggregateId) continue;
    const childId = classIdByRef.get(e.id);
    const parentId = classIdByRef.get(e.parentAggregateId);
    if (!childId || !parentId) {
      warnSkip(`子实体 ${e.name} 的父聚合 ${e.parentAggregateId} 无法解析`);
      continue;
    }
    const childCls = classes.find((c) => c.id === childId);
    if (childCls) {
      const existing = childCls.subClassOf ?? [];
      if (!existing.includes(parentId)) childCls.subClassOf = [...existing, parentId];
    }
  }

  // ---- 属性/关系 → DatatypeProperty / ObjectProperty ----
  for (const e of entities) {
    const domainId = classIdByRef.get(e.id);
    if (!domainId) continue;

    for (const attr of e.attributes ?? []) {
      const propId = toUriFragment(`${e.nameEn || e.id}_${attr.nameEn || attr.name}`);
      if (attr.dataType === 'reference') {
        // reference → ObjectProperty，range 由 referencedEntityId 解析目标实体
        // （enumRef / isMasterDataRef 本期不映射，为已知限制）
        const rangeId = attr.referencedEntityId
          ? classIdByRef.get(attr.referencedEntityId)
          : undefined;
        if (!rangeId) {
          warnSkip(`reference 属性 ${e.name}.${attr.name} 无法解析目标实体`);
          continue;
        }
        objectProperties.push({
          id: propId,
          label: attr.name,
          domain: domainId,
          range: rangeId,
          functional: attr.unique ?? false,
          description: attr.description,
        });
        continue;
      }
      const xsdRange = DATATYPE_TO_XSD[attr.dataType];
      if (!xsdRange) {
        warnSkip(`属性 ${e.name}.${attr.name} 的数据类型 ${attr.dataType} 不支持映射`);
        continue;
      }
      datatypeProperties.push({
        id: propId,
        label: attr.name,
        domain: domainId,
        range: xsdRange,
        functional: attr.unique ?? false,
        description: attr.description,
      });
    }

    for (const rel of e.relations ?? []) {
      const rangeId = classIdByRef.get(rel.targetEntity);
      if (!rangeId) {
        warnSkip(`关系 ${e.name}.${rel.name} 无法解析目标实体 ${rel.targetEntity}`);
        continue;
      }
      objectProperties.push({
        id: toUriFragment(`${e.nameEn || e.id}_${rel.name}`),
        label: rel.name,
        domain: domainId,
        range: rangeId,
        description: rel.description,
      });
    }
  }

  // ---- E4 事件 → owl:Class ----
  const events = project.eventModel?.events ?? [];
  for (const ev of events) {
    registerClass(
      {
        id: toUriFragment(`Event_${ev.nameEn || ev.name || ev.id}`),
        label: ev.name,
        labelEn: ev.nameEn,
        description: ev.description,
        sourceMetaElementId: ev.id,
      },
      [ev.id],
    );
  }

  // ---- E5 部门/岗位 → owl:Class ----
  const departments = project.organizationModel?.departments ?? [];
  for (const dept of departments) {
    registerClass(
      {
        id: toUriFragment(`Department_${dept.nameEn || dept.id}`),
        label: dept.name,
        labelEn: dept.nameEn,
        description: dept.description,
        sourceMetaElementId: dept.id,
      },
      [dept.id],
    );
  }
  const positions = project.organizationModel?.positions ?? [];
  for (const pos of positions) {
    registerClass(
      {
        id: toUriFragment(`Position_${pos.nameEn || pos.id}`),
        label: pos.name,
        labelEn: pos.nameEn,
        sourceMetaElementId: pos.id,
      },
      [pos.id],
    );
  }

  // metaElement 引用补充登记（E4/E5）
  for (const me of project.metaElements ?? []) {
    if (classIdByRef.has(me.id)) continue;
    if (me.dimension === 'E4') {
      const matched = events.find((ev) => ev.name === me.name || ev.nameEn === me.nameEn);
      if (matched) classIdByRef.set(me.id, toUriFragment(`Event_${matched.nameEn || matched.name || matched.id}`));
    } else if (me.dimension === 'E5') {
      const matchedDept = departments.find((d) => d.name === me.name || d.nameEn === me.nameEn);
      const matchedPos = positions.find((p) => p.name === me.name || p.nameEn === me.nameEn);
      if (matchedDept) classIdByRef.set(me.id, toUriFragment(`Department_${matchedDept.nameEn || matchedDept.id}`));
      else if (matchedPos) classIdByRef.set(me.id, toUriFragment(`Position_${matchedPos.nameEn || matchedPos.id}`));
    }
  }

  // ---- Agent 语义层 is_a / equivalent_to → subClassOf / equivalentClass ----
  for (const sr of project.agentSemanticLayer?.semanticRelations ?? []) {
    if (sr.type !== 'is_a' && sr.type !== 'equivalent_to') continue;
    const sourceId = classIdByRef.get(sr.sourceEntityId);
    const targetId = classIdByRef.get(sr.targetEntityId);
    if (!sourceId || !targetId) {
      warnSkip(`语义关系 ${sr.name}(${sr.type}) 的 source/target 无法解析到 OWL 类`);
      continue;
    }
    const sourceCls = classes.find((c) => c.id === sourceId);
    if (!sourceCls) continue;
    if (sr.type === 'is_a') {
      const existing = sourceCls.subClassOf ?? [];
      if (!existing.includes(targetId)) sourceCls.subClassOf = [...existing, targetId];
    } else {
      const existing = sourceCls.equivalentTo ?? [];
      if (!existing.includes(targetId)) sourceCls.equivalentTo = [...existing, targetId];
    }
  }

  return {
    baseUri,
    ontologyIri: baseUri,
    versionInfo: project.version,
    label: project.name,
    classes,
    objectProperties,
    datatypeProperties,
  };
}
