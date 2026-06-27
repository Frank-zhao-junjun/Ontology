/**
 * 数据模型辅助函数单元测试
 *
 * 覆盖 src/lib/data-model/helpers.ts 中所有纯函数。
 */
import { describe, it, expect } from 'vitest';
import {
  parseMasterDataFields,
  mapMetadataTypeToAttributeType,
  getAttributeTypeLabel,
  getRelationTypeLabel,
  getCascadeLabel,
  getComputationTypeLabel,
  getAggregationFunctionLabel,
  getIndexTypeLabel,
  computeAttributeMode,
  validateAttribute,
  validateRelation,
  formatEntityDisplay,
  parseEntityAliases,
  buildAttributeFromDraft,
  buildRelationFromDraft,
  buildEntityFromDraft,
  parseIndexFieldList,
  validateIndexDraft,
  buildIndexFromDraft,
  getLinkableDomainEvents,
  applyMetadataTemplateToAttributeDraft,
  formatMetadataOptionLabel,
  upsertInList,
  removeFromListById,
  validateEntityCreateDraft,
  ATTRIBUTE_TYPES,
  DIRECT_ATTRIBUTE_TYPES,
  RELATION_TYPES,
  CASCADE_OPTIONS,
} from '@/lib/data-model/helpers';
import type { Attribute, Relation, Entity, EventDefinition, Metadata } from '@/types/ontology';

// ============================================================
// parseMasterDataFields
// ============================================================

describe('parseMasterDataFields', () => {
  it('TC-01: should return empty array for undefined input', () => {
    expect(parseMasterDataFields(undefined)).toEqual([]);
  });

  it('TC-02: should return empty array for empty string', () => {
    expect(parseMasterDataFields('')).toEqual([]);
  });

  it('TC-03: should split by comma (English)', () => {
    const result = parseMasterDataFields('字段A,字段B,字段C');
    expect(result).toEqual(['字段A', '字段B', '字段C']);
  });

  it('TC-04: should split by Chinese comma (，)', () => {
    const result = parseMasterDataFields('名称，描述，备注');
    expect(result).toEqual(['名称', '描述', '备注']);
  });

  it('TC-05: should split by newline', () => {
    const result = parseMasterDataFields('字段A\n字段B\n字段C');
    expect(result).toEqual(['字段A', '字段B', '字段C']);
  });

  it('TC-06: should trim whitespace from each field', () => {
    const result = parseMasterDataFields('  字段A ,  字段B  , 字段C  ');
    expect(result).toEqual(['字段A', '字段B', '字段C']);
  });

  it('TC-07: should filter out empty segments from consecutive delimiters', () => {
    const result = parseMasterDataFields('a,,b,,,c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('TC-08: should handle mixed delimiters (comma + Chinese comma + newline)', () => {
    const result = parseMasterDataFields('a，b,c\n,d');
    expect(result).toEqual(['a', 'b', 'c', 'd']);
  });

  it('TC-09: should return single element for input without delimiter', () => {
    const result = parseMasterDataFields('一个字段');
    expect(result).toEqual(['一个字段']);
  });
});

// ============================================================
// mapMetadataTypeToAttributeType
// ============================================================

describe('mapMetadataTypeToAttributeType', () => {
  it('TC-10: should map Chinese type names', () => {
    expect(mapMetadataTypeToAttributeType('字符串')).toBe('string');
    expect(mapMetadataTypeToAttributeType('文本')).toBe('text');
    expect(mapMetadataTypeToAttributeType('整数')).toBe('integer');
    expect(mapMetadataTypeToAttributeType('小数')).toBe('decimal');
    expect(mapMetadataTypeToAttributeType('布尔')).toBe('boolean');
    expect(mapMetadataTypeToAttributeType('日期')).toBe('date');
    expect(mapMetadataTypeToAttributeType('日期时间')).toBe('datetime');
    expect(mapMetadataTypeToAttributeType('枚举')).toBe('enum');
  });

  it('TC-11: should map English type names', () => {
    expect(mapMetadataTypeToAttributeType('string')).toBe('string');
    expect(mapMetadataTypeToAttributeType('integer')).toBe('integer');
    expect(mapMetadataTypeToAttributeType('boolean')).toBe('boolean');
  });

  it('TC-12: should return fallback for unknown type', () => {
    expect(mapMetadataTypeToAttributeType('unknown_type')).toBe('string');
    expect(mapMetadataTypeToAttributeType('图片')).toBe('string');
  });
});

// ============================================================
// getAttributeTypeLabel
// ============================================================

describe('getAttributeTypeLabel', () => {
  it('TC-13: should return label for valid type', () => {
    expect(getAttributeTypeLabel('string')).toBe('字符串 (String)');
    expect(getAttributeTypeLabel('integer')).toBe('整数 (Integer)');
    expect(getAttributeTypeLabel('reference')).toBe('引用 (Reference)');
  });

  it('TC-14: should return empty string for undefined', () => {
    expect(getAttributeTypeLabel(undefined)).toBe('');
  });

  it('TC-15: should return raw value if type not found', () => {
    expect(getAttributeTypeLabel('custom')).toBe('custom');
  });
});

// ============================================================
// getRelationTypeLabel
// ============================================================

describe('getRelationTypeLabel', () => {
  it('TC-16: should return label for valid type', () => {
    expect(getRelationTypeLabel('one_to_one')).toBe('一对一 (1:1)');
    expect(getRelationTypeLabel('one_to_many')).toBe('一对多 (1:N)');
    expect(getRelationTypeLabel('many_to_many')).toBe('多对多 (N:M)');
  });

  it('TC-17: should return empty string for undefined', () => {
    expect(getRelationTypeLabel(undefined)).toBe('');
  });
});

// ============================================================
// getCascadeLabel
// ============================================================

describe('getCascadeLabel', () => {
  it('TC-18: should return correct cascade labels', () => {
    expect(getCascadeLabel('none')).toBe('无级联');
    expect(getCascadeLabel('delete')).toBe('级联删除');
    expect(getCascadeLabel('all')).toBe('全部级联');
  });

  it('TC-19: should return empty string for undefined', () => {
    expect(getCascadeLabel(undefined)).toBe('');
  });
});

// ============================================================
// getComputationTypeLabel
// ============================================================

describe('getComputationTypeLabel', () => {
  it('TC-20: should return correct computation labels', () => {
    expect(getComputationTypeLabel('formula')).toBe('公式');
    expect(getComputationTypeLabel('aggregation')).toBe('聚合');
    expect(getComputationTypeLabel('lookup')).toBe('查找');
    expect(getComputationTypeLabel('ai-inference')).toBe('AI 推理');
  });

  it('TC-21: should return empty for undefined', () => {
    expect(getComputationTypeLabel(undefined)).toBe('');
  });

  it('TC-22: should return raw input for unknown type', () => {
    expect(getComputationTypeLabel('unknown')).toBe('unknown');
  });
});

// ============================================================
// getAggregationFunctionLabel
// ============================================================

describe('getAggregationFunctionLabel', () => {
  it('TC-23: should return correct aggregation labels', () => {
    expect(getAggregationFunctionLabel('sum')).toBe('求和 (Sum)');
    expect(getAggregationFunctionLabel('count')).toBe('计数 (Count)');
    expect(getAggregationFunctionLabel('avg')).toBe('平均值 (Avg)');
    expect(getAggregationFunctionLabel('min')).toBe('最小值 (Min)');
    expect(getAggregationFunctionLabel('max')).toBe('最大值 (Max)');
  });

  it('TC-24: should return empty for undefined', () => {
    expect(getAggregationFunctionLabel(undefined)).toBe('');
  });
});

// ============================================================
// getIndexTypeLabel
// ============================================================

describe('getIndexTypeLabel', () => {
  it('TC-25: should return correct index type labels', () => {
    expect(getIndexTypeLabel('btree')).toBe('B-Tree（默认）');
    expect(getIndexTypeLabel('hash')).toBe('Hash');
  });

  it('TC-26: should return empty string for undefined', () => {
    expect(getIndexTypeLabel(undefined)).toBe('');
  });
});

// ============================================================
// computeAttributeMode
// ============================================================

describe('computeAttributeMode', () => {
  it('TC-27: should return primitive for non-reference types', () => {
    expect(computeAttributeMode({ dataType: 'string' })).toBe('primitive');
    expect(computeAttributeMode({ dataType: 'integer' })).toBe('primitive');
    expect(computeAttributeMode({ dataType: 'boolean' })).toBe('primitive');
  });

  it('TC-28: should return entityRef for reference without masterDataRef', () => {
    expect(computeAttributeMode({ dataType: 'reference', isMasterDataRef: false })).toBe('entityRef');
    expect(computeAttributeMode({ dataType: 'reference' })).toBe('entityRef');
  });

  it('TC-29: should return masterDataRef for reference with isMasterDataRef', () => {
    expect(computeAttributeMode({ dataType: 'reference', isMasterDataRef: true })).toBe('masterDataRef');
  });
});

// ============================================================
// validateAttribute
// ============================================================

describe('validateAttribute', () => {
  it('TC-30: should validate empty name as error', () => {
    const result = validateAttribute({ name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('属性名称不能为空');
  });

  it('TC-31: should validate whitespace-only name as error', () => {
    const result = validateAttribute({ name: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('属性名称不能为空');
  });

  it('TC-32: should require masterDataType for masterDataRef', () => {
    const result = validateAttribute({
      name: 'test',
      dataType: 'reference',
      isMasterDataRef: true,
      masterDataType: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('关联主数据时必须选择主数据类型');
  });

  it('TC-33: should require referencedEntityId for entityRef', () => {
    const result = validateAttribute({
      name: 'test',
      dataType: 'reference',
      isMasterDataRef: false,
      referencedEntityId: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('引用实体时必须选择目标实体');
  });

  it('TC-34: should pass validation for valid primitive attribute', () => {
    const result = validateAttribute({
      name: '合同编号',
      dataType: 'string',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('TC-35: should pass validation for valid entityRef attribute', () => {
    const result = validateAttribute({
      name: '关联合同',
      dataType: 'reference',
      isMasterDataRef: false,
      referencedEntityId: 'entity-1',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('TC-36: should pass validation for valid masterDataRef attribute', () => {
    const result = validateAttribute({
      name: '客户编码',
      dataType: 'reference',
      isMasterDataRef: true,
      masterDataType: 'master-1',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================================
// validateRelation
// ============================================================

describe('validateRelation', () => {
  it('TC-37: should require target entity for non-recursive relation', () => {
    const result = validateRelation({
      type: 'one_to_many',
      targetEntity: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('关系必须选择目标实体');
  });

  it('TC-38: should accept recursive relation with target entity via second param', () => {
    const result = validateRelation(
      { type: 'one_to_many', isRecursive: true, targetEntity: '' },
      'self-entity-id',
    );
    expect(result.valid).toBe(true);
  });

  it('TC-39: should require viaEntity for many_to_many', () => {
    const result = validateRelation({
      type: 'many_to_many',
      targetEntity: 'entity-1',
      viaEntity: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('多对多关系必须填写中间实体');
  });

  it('TC-40: should pass validation for valid relation', () => {
    const result = validateRelation({
      type: 'one_to_many',
      targetEntity: 'entity-2',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('TC-41: should pass validation for many_to_many with viaEntity', () => {
    const result = validateRelation({
      type: 'many_to_many',
      targetEntity: 'entity-2',
      viaEntity: 'link_table',
    });
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// formatEntityDisplay
// ============================================================

describe('formatEntityDisplay', () => {
  it('TC-42: should format name and nameEn', () => {
    expect(formatEntityDisplay({ name: '合同', nameEn: 'Contract' })).toBe('合同 (Contract)');
  });

  it('TC-43: should return name only if no nameEn', () => {
    expect(formatEntityDisplay({ name: '合同' })).toBe('合同');
  });

  it('TC-44: should return empty string for null/undefined', () => {
    expect(formatEntityDisplay(null)).toBe('');
    expect(formatEntityDisplay(undefined)).toBe('');
  });

  it('TC-45: should return empty string for empty object', () => {
    expect(formatEntityDisplay({})).toBe('');
  });
});

// ============================================================
// parseEntityAliases
// ============================================================

describe('parseEntityAliases', () => {
  it('TC-46: should parse comma-separated aliases', () => {
    expect(parseEntityAliases('消费者, 散客, 买家')).toEqual(['消费者', '散客', '买家']);
  });

  it('TC-47: should return undefined for empty input', () => {
    expect(parseEntityAliases('')).toBeUndefined();
    expect(parseEntityAliases(undefined)).toBeUndefined();
  });

  it('TC-48: should handle Chinese comma delimiter', () => {
    expect(parseEntityAliases('甲方，乙方')).toEqual(['甲方', '乙方']);
  });
});

// ============================================================
// buildAttributeFromDraft
// ============================================================

describe('buildAttributeFromDraft', () => {
  it('TC-49: should build a primitive attribute from draft', () => {
    const result = buildAttributeFromDraft(
      { name: '合同编号', dataType: 'string', required: true },
      'attr-1',
      'entity-1',
    );
    expect(result.id).toBe('attr-1');
    expect(result.name).toBe('合同编号');
    expect(result.dataType).toBe('string');
    expect(result.required).toBe(true);
    expect(result.referenceKind).toBeUndefined();
  });

  it('TC-50: should build entityRef attribute', () => {
    const result = buildAttributeFromDraft(
      {
        name: '关联合同',
        dataType: 'reference',
        isMasterDataRef: false,
        referenceKind: 'entity',
        referencedEntityId: 'entity-2',
      },
      'attr-2',
      'entity-1',
    );
    expect(result.dataType).toBe('reference');
    expect(result.referenceKind).toBe('entity');
    expect(result.referencedEntityId).toBe('entity-2');
    expect(result.isMasterDataRef).toBe(false);
  });

  it('TC-51: should build masterDataRef attribute', () => {
    const result = buildAttributeFromDraft(
      {
        name: '客户编码',
        dataType: 'reference',
        isMasterDataRef: true,
        masterDataType: 'master-1',
        masterDataField: 'code',
      },
      null,
      'entity-1',
    );
    expect(result.id).toBe('new');
    expect(result.dataType).toBe('reference');
    expect(result.isMasterDataRef).toBe(true);
    expect(result.masterDataType).toBe('master-1');
    expect(result.masterDataField).toBe('code');
  });

  it('TC-52: should include enumRef only when dataType is enum', () => {
    const result = buildAttributeFromDraft(
      { name: '状态', dataType: 'enum', enumRef: 'sm1:s1' },
      'attr-3',
      'entity-1',
    );
    expect(result.enumRef).toBe('sm1:s1');
  });

  it('TC-53: should strip enumRef for non-enum types', () => {
    const result = buildAttributeFromDraft(
      { name: '名称', dataType: 'string', enumRef: 'sm1:s1' },
      'attr-4',
      'entity-1',
    );
    expect(result.enumRef).toBeUndefined();
  });
});

// ============================================================
// buildRelationFromDraft
// ============================================================

describe('buildRelationFromDraft', () => {
  it('TC-54: should build a one_to_many relation', () => {
    const result = buildRelationFromDraft(
      { name: '关联发票', type: 'one_to_many', targetEntity: 'entity-2' },
      'rel-1',
      'entity-1',
    );
    expect(result.id).toBe('rel-1');
    expect(result.name).toBe('关联发票');
    expect(result.type).toBe('one_to_many');
    expect(result.targetEntity).toBe('entity-2');
    expect(result.viaEntity).toBeUndefined();
  });

  it('TC-55: should handle recursive relations', () => {
    const result = buildRelationFromDraft(
      { name: '自引用', type: 'one_to_many', isRecursive: true },
      'rel-2',
      'entity-1',
    );
    expect(result.isRecursive).toBe(true);
    expect(result.targetEntity).toBe('entity-1');
  });

  it('TC-56: should include viaEntity for many_to_many', () => {
    const result = buildRelationFromDraft(
      { name: '多对多关系', type: 'many_to_many', targetEntity: 'entity-3', viaEntity: 'link' },
      'rel-3',
      'entity-1',
    );
    expect(result.viaEntity).toBe('link');
  });

  it('TC-57: should strip viaEntity for non-many_to_many', () => {
    const result = buildRelationFromDraft(
      { name: '一对一', type: 'one_to_one', targetEntity: 'entity-3', viaEntity: 'should-not-appear' },
      'rel-4',
      'entity-1',
    );
    expect(result.type).toBe('one_to_one');
    expect(result.viaEntity).toBeUndefined();
  });

  it('TC-58: should provide defaults for optional fields', () => {
    const result = buildRelationFromDraft({}, null, 'entity-1');
    expect(result.name).toBe('新关系');
    expect(result.type).toBe('one_to_many');
    expect(result.cascade).toBe('none');
    expect(result.directionality).toBe('directed');
  });
});

// ============================================================
// buildEntityFromDraft
// ============================================================

describe('buildEntityFromDraft', () => {
  it('TC-59: should build entity from draft', () => {
    const result = buildEntityFromDraft(
      { name: '合同', nameEn: 'Contract', projectId: 'proj-1', businessScenarioId: 'bs-1' },
      'entity-1',
      'aggregate_root',
    );
    expect(result.id).toBe('entity-1');
    expect(result.name).toBe('合同');
    expect(result.nameEn).toBe('Contract');
    expect(result.entityRole).toBe('aggregate_root');
    expect(result.parentAggregateId).toBeUndefined();
  });

  it('TC-60: should set parentAggregateId for child_entity', () => {
    const result = buildEntityFromDraft(
      { name: '行项目', parentAggregateId: 'agg-1' },
      'entity-2',
      'child_entity',
    );
    expect(result.entityRole).toBe('child_entity');
    expect(result.parentAggregateId).toBe('agg-1');
  });

  it('TC-61: should provide defaults for empty draft', () => {
    const result = buildEntityFromDraft({}, 'entity-3', undefined);
    expect(result.name).toBe('新实体');
    expect(result.nameEn).toBe('NewEntity');
    expect(result.attributes).toEqual([]);
    expect(result.relations).toEqual([]);
  });
});

// ============================================================
// 常量一致性
// ============================================================

describe('Constants consistency', () => {
  it('TC-62: DIRECT_ATTRIBUTE_TYPES should exclude reference', () => {
    expect(DIRECT_ATTRIBUTE_TYPES.every((t) => t.value !== 'reference')).toBe(true);
    expect(DIRECT_ATTRIBUTE_TYPES).toHaveLength(ATTRIBUTE_TYPES.length - 1);
  });

  it('TC-63: RELATION_TYPES should have three types', () => {
    expect(RELATION_TYPES.map((r) => r.value)).toEqual(['one_to_one', 'one_to_many', 'many_to_many']);
  });

  it('TC-64: CASCADE_OPTIONS should have three options', () => {
    expect(CASCADE_OPTIONS.map((c) => c.value)).toEqual(['none', 'delete', 'all']);
  });
});

// ============================================================
// parseIndexFieldList & validateIndexDraft & buildIndexFromDraft
// ============================================================

describe('parseIndexFieldList', () => {
  it('TC-65: should parse comma-separated fields', () => {
    expect(parseIndexFieldList('id, name , status')).toEqual(['id', 'name', 'status']);
  });

  it('TC-66: should return empty array for blank input', () => {
    expect(parseIndexFieldList('   ')).toEqual([]);
  });

  it('TC-67: should filter empty segments', () => {
    expect(parseIndexFieldList('a,,b,,')).toEqual(['a', 'b']);
  });
});

describe('validateIndexDraft', () => {
  it('TC-68: should reject empty field list', () => {
    expect(validateIndexDraft('')).toEqual({
      valid: false,
      error: '请输入至少一个索引字段',
    });
  });

  it('TC-69: should accept non-empty field list', () => {
    expect(validateIndexDraft('id, name')).toEqual({ valid: true });
  });
});

describe('buildIndexFromDraft', () => {
  it('TC-70: should build index object from draft strings', () => {
    expect(buildIndexFromDraft('a, b', 'hash', true)).toEqual({
      fields: ['a', 'b'],
      type: 'hash',
      unique: true,
    });
  });
});

// ============================================================
// getLinkableDomainEvents
// ============================================================

describe('getLinkableDomainEvents', () => {
  const events: EventDefinition[] = [
    { id: 'e1', name: 'Created', entity: 'Order', trigger: 'create', payload: [], isDomainEvent: true },
    { id: 'e2', name: 'Updated', entity: 'Order', trigger: 'update', payload: [], isDomainEvent: true },
    { id: 'e3', name: 'Plain', entity: 'Order', trigger: 'create', payload: [], isDomainEvent: false },
  ];

  it('TC-71: should return empty when entity is null', () => {
    expect(getLinkableDomainEvents(null, events)).toEqual([]);
  });

  it('TC-72: should filter non-domain events', () => {
    const entity = { domainEvents: [] as string[] };
    expect(getLinkableDomainEvents(entity, events).map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('TC-73: should exclude already linked events', () => {
    const entity = { domainEvents: ['e1'] };
    expect(getLinkableDomainEvents(entity, events).map((e) => e.id)).toEqual(['e2']);
  });

  it('TC-74: should return empty when all domain events are linked', () => {
    const entity = { domainEvents: ['e1', 'e2'] };
    expect(getLinkableDomainEvents(entity, events)).toEqual([]);
  });
});

// ============================================================
// applyMetadataTemplateToAttributeDraft & formatMetadataOptionLabel
// ============================================================

describe('applyMetadataTemplateToAttributeDraft', () => {
  const metadata: Metadata = {
    id: 'md-1',
    domain: '物料',
    name: '物料编码',
    nameEn: 'MATERIAL_CODE',
    description: '唯一编码',
    type: '字符串',
    createdAt: '2026-01-01',
  };

  it('TC-75: should fill empty draft from metadata', () => {
    const result = applyMetadataTemplateToAttributeDraft({}, metadata);
    expect(result.metadataTemplateId).toBe('md-1');
    expect(result.name).toBe('物料编码');
    expect(result.nameEn).toBe('MATERIAL_CODE');
    expect(result.dataType).toBe('string');
    expect(result.description).toBe('唯一编码');
  });

  it('TC-76: should preserve user-provided name over metadata', () => {
    const result = applyMetadataTemplateToAttributeDraft({ name: '自定义名' }, metadata);
    expect(result.name).toBe('自定义名');
    expect(result.nameEn).toBe('MATERIAL_CODE');
  });

  it('TC-77: should clear master data refs for non-reference types', () => {
    const result = applyMetadataTemplateToAttributeDraft(
      { isMasterDataRef: true, masterDataType: 'md-type' },
      metadata,
    );
    expect(result.isMasterDataRef).toBe(false);
    expect(result.masterDataType).toBeUndefined();
  });

  it('TC-78: should map enum metadata type', () => {
    const enumMeta = { ...metadata, type: '枚举' };
    const result = applyMetadataTemplateToAttributeDraft({}, enumMeta);
    expect(result.dataType).toBe('enum');
  });
});

describe('formatMetadataOptionLabel', () => {
  it('TC-79: should format label with domain', () => {
    const label = formatMetadataOptionLabel({
      id: '1',
      domain: '财务',
      name: '金额',
      nameEn: 'AMOUNT',
      description: '',
      type: 'decimal',
      createdAt: '',
    });
    expect(label).toBe('金额 (AMOUNT) - 财务');
  });
});

// ============================================================
// upsertInList & removeFromListById
// ============================================================

describe('upsertInList', () => {
  it('TC-80: should append when editId is null', () => {
    const list = [{ id: 'a', name: 'A' }];
    const result = upsertInList(list, { id: 'b', name: 'B' }, null);
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('b');
  });

  it('TC-81: should replace item when editId matches', () => {
    const list = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    const result = upsertInList(list, { id: 'b', name: 'B2' }, 'b');
    expect(result.find((x) => x.id === 'b')?.name).toBe('B2');
    expect(result).toHaveLength(2);
  });
});

describe('removeFromListById', () => {
  it('TC-82: should remove matching id', () => {
    const list = [{ id: 'a' }, { id: 'b' }];
    expect(removeFromListById(list, 'a')).toEqual([{ id: 'b' }]);
  });

  it('TC-83: should return same length when id not found', () => {
    const list = [{ id: 'a' }];
    expect(removeFromListById(list, 'missing')).toEqual([{ id: 'a' }]);
  });
});

// ============================================================
// validateEntityCreateDraft
// ============================================================

describe('validateEntityCreateDraft', () => {
  it('TC-84: should require project when projects exist', () => {
    const result = validateEntityCreateDraft({}, 'aggregate_root', { hasProjects: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('请选择项目');
  });

  it('TC-85: should require business scenario when project is set', () => {
    const result = validateEntityCreateDraft(
      { projectId: 'p1' },
      'aggregate_root',
      { hasProjects: true },
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('请选择业务场景');
  });

  it('TC-86: should require parent aggregate for child entity', () => {
    const result = validateEntityCreateDraft(
      { projectId: 'p1', businessScenarioId: 's1' },
      'child_entity',
      { hasProjects: true },
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('子实体必须选择父聚合根');
  });

  it('TC-87: should pass for complete aggregate root draft', () => {
    const result = validateEntityCreateDraft(
      { projectId: 'p1', businessScenarioId: 's1' },
      'aggregate_root',
      { hasProjects: true },
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('TC-88: should report no projects when hasProjects is false', () => {
    const result = validateEntityCreateDraft({}, 'aggregate_root', { hasProjects: false });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('无可用项目');
  });

  it('TC-89: should pass for complete child entity with parent', () => {
    const result = validateEntityCreateDraft(
      { projectId: 'p1', businessScenarioId: 's1', parentAggregateId: 'root-1' },
      'child_entity',
      { hasProjects: true },
    );
    expect(result.valid).toBe(true);
  });
});
