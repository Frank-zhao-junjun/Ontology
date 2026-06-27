/**
 * 数据模型编辑器纯辅助函数
 *
 * 从 data-model-editor.tsx 提取，便于独立测试。
 */

import type {
  Attribute,
  AttributeDataType,
  Entity,
  EntityRole,
  EventDefinition,
  Metadata,
  Relation,
} from '@/types/ontology';

// ============================================================
// 常量
// ============================================================

export const ATTRIBUTE_TYPES: { value: string; label: string }[] = [
  { value: 'string', label: '字符串 (String)' },
  { value: 'text', label: '长文本 (Text)' },
  { value: 'integer', label: '整数 (Integer)' },
  { value: 'decimal', label: '小数 (Decimal)' },
  { value: 'boolean', label: '布尔 (Boolean)' },
  { value: 'date', label: '日期 (Date)' },
  { value: 'datetime', label: '日期时间 (DateTime)' },
  { value: 'enum', label: '枚举 (Enum)' },
  { value: 'reference', label: '引用 (Reference)' },
];

export const DIRECT_ATTRIBUTE_TYPES = ATTRIBUTE_TYPES.filter((type) => type.value !== 'reference');

export const RELATION_TYPES: { value: string; label: string }[] = [
  { value: 'one_to_one', label: '一对一 (1:1)' },
  { value: 'one_to_many', label: '一对多 (1:N)' },
  { value: 'many_to_many', label: '多对多 (N:M)' },
];

export const CASCADE_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: '无级联' },
  { value: 'delete', label: '级联删除' },
  { value: 'all', label: '全部级联' },
];

export const AUTO_FILL_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: '不自动填充' },
  { value: 'uuid', label: 'UUID' },
  { value: 'current_user', label: '当前用户' },
  { value: 'current_time', label: '当前时间' },
  { value: 'current_date', label: '当前日期' },
  { value: 'sequence', label: '序列号' },
];

export const COMPUTATION_TYPE_LABELS: Record<string, string> = {
  formula: '公式',
  aggregation: '聚合',
  lookup: '查找',
  'ai-inference': 'AI 推理',
};

export const AGGREGATION_FUNCTION_LABELS: Record<string, string> = {
  sum: '求和 (Sum)',
  count: '计数 (Count)',
  avg: '平均值 (Avg)',
  min: '最小值 (Min)',
  max: '最大值 (Max)',
};

export const DIRECTIONALITY_OPTIONS = [
  { value: 'directed', label: '单向 (Directed)' },
  { value: 'undirected', label: '双向 (Undirected)' },
];

// ============================================================
// 数据字段解析
// ============================================================

/**
 * 将主数据字段名字符串解析为字段名数组。
 * 支持中英文逗号、顿号、换行作为分隔符。
 *
 * @example parseMasterDataFields('字段A,字段B,字段C') // ['字段A', '字段B', '字段C']
 * @example parseMasterDataFields(undefined) // []
 */
export function parseMasterDataFields(fieldNames?: string): string[] {
  if (!fieldNames) {
    return [];
  }

  return fieldNames
    .split(/[，,、\n]/)
    .map((field) => field.trim())
    .filter(Boolean);
}

// ============================================================
// 类型映射 & 标签
// ============================================================

/**
 * 将元数据类型（中文或英文）映射到 AttributeDataType。
 */
export function mapMetadataTypeToAttributeType(
  metadataType: string,
  fallback: AttributeDataType = 'string',
): AttributeDataType {
  const typeMap: Record<string, AttributeDataType> = {
    '字符串': 'string',
    '文本': 'text',
    '整数': 'integer',
    '小数': 'decimal',
    '布尔': 'boolean',
    '日期': 'date',
    '日期时间': 'datetime',
    '枚举': 'enum',
    'string': 'string',
    'text': 'text',
    'integer': 'integer',
    'decimal': 'decimal',
    'boolean': 'boolean',
    'date': 'date',
    'datetime': 'datetime',
    'enum': 'enum',
  };
  return typeMap[metadataType] || fallback;
}

/**
 * 根据 dataType 值获取属性类型标签。
 */
export function getAttributeTypeLabel(dataType?: string): string {
  if (!dataType) return '';
  const found = ATTRIBUTE_TYPES.find((t) => t.value === dataType);
  return found?.label || dataType;
}

/**
 * 根据关系类型值获取关系类型标签。
 */
export function getRelationTypeLabel(type?: string): string {
  if (!type) return '';
  const found = RELATION_TYPES.find((t) => t.value === type);
  return found?.label || type;
}

/**
 * 获取级联操作标签。
 */
export function getCascadeLabel(cascade?: string): string {
  if (!cascade) return '';
  const found = CASCADE_OPTIONS.find((o) => o.value === cascade);
  return found?.label || cascade;
}

/**
 * 获取计算类型的中文标签。
 */
export function getComputationTypeLabel(computationType?: string): string {
  if (!computationType) return '';
  return COMPUTATION_TYPE_LABELS[computationType] || computationType;
}

/**
 * 获取聚合函数的中文标签。
 */
export function getAggregationFunctionLabel(fn?: string): string {
  if (!fn) return '';
  return AGGREGATION_FUNCTION_LABELS[fn] || fn;
}

/**
 * 索引类型标签。
 */
export function getIndexTypeLabel(type?: string): string {
  if (type === 'btree') return 'B-Tree（默认）';
  if (type === 'hash') return 'Hash';
  return type || '';
}

// ============================================================
// 属性维护模式
// ============================================================

/**
 * 推断属性的维护模式。
 * - primitive: 直接维护字段
 * - entityRef: 引用另一个实体
 * - masterDataRef: 引用主数据
 */
export type AttributeMode = 'primitive' | 'entityRef' | 'masterDataRef';

export function computeAttributeMode(attr: Partial<Attribute>): AttributeMode {
  if (attr.dataType !== 'reference') return 'primitive';
  if (attr.isMasterDataRef) return 'masterDataRef';
  return 'entityRef';
}

// ============================================================
// 验证
// ============================================================

export interface AttributeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RelationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 验证属性草稿是否可保存。
 */
export function validateAttribute(
  attr: Partial<Attribute>,
  options?: {
    isNew?: boolean;
    metadataLocked?: boolean;
  },
): AttributeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!attr.name || !attr.name.trim()) {
    errors.push('属性名称不能为空');
  }

  if (attr.dataType === 'reference') {
    if (attr.isMasterDataRef) {
      if (!attr.masterDataType) {
        errors.push('关联主数据时必须选择主数据类型');
      }
    } else {
      if (!attr.referencedEntityId) {
        errors.push('引用实体时必须选择目标实体');
      }
    }
  }

  if (options?.metadataLocked && attr.dataType === 'reference' && !attr.metadataTemplateId) {
    warnings.push('模板绑定后，属性维护方式会随模板一起锁定');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * 验证关系草稿是否可保存。
 */
export function validateRelation(
  relation: Partial<Relation>,
  recursiveTarget?: string,
): RelationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const targetEntity = relation.isRecursive ? recursiveTarget : relation.targetEntity;
  if (!targetEntity) {
    errors.push('关系必须选择目标实体');
  }

  if (relation.type === 'many_to_many' && !relation.viaEntity?.trim()) {
    errors.push('多对多关系必须填写中间实体');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================
// 实体显示
// ============================================================

/**
 * 格式化实体的显示字符串。
 */
export function formatEntityDisplay(entity?: Partial<Entity> | null): string {
  if (!entity) return '';
  const parts: string[] = [];
  if (entity.name) parts.push(entity.name);
  if (entity.nameEn) parts.push(`(${entity.nameEn})`);
  return parts.join(' ');
}

/**
 * 从逗号分隔的字符串解析实体同义词列表。
 */
export function parseEntityAliases(input?: string): string[] | undefined {
  if (!input || !input.trim()) return undefined;
  const strs = input
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return strs.length > 0 ? strs : undefined;
}

// ============================================================
// 构建数据对象
// ============================================================

/**
 * 构建属性数据对象（用于保存）。
 */
export function buildAttributeFromDraft(
  draft: Partial<Attribute>,
  id: string | null,
  entityId: string,
): Attribute {
  const dataType = draft.dataType || 'string';
  const isReference = dataType === 'reference';
  const referenceKind = isReference
    ? (draft.isMasterDataRef ? 'masterData' : (draft.referenceKind || 'entity'))
    : undefined;
  const isMasterDataRef = isReference && referenceKind === 'masterData';

  return {
    id: id || 'new',
    name: draft.name || '新属性',
    nameEn: draft.nameEn,
    businessMeaning: draft.businessMeaning,
    dataType,
    required: draft.required || false,
    unique: draft.unique || false,
    description: draft.description,
    length: draft.length,
    precision: draft.precision,
    scale: draft.scale,
    enumRef: dataType === 'enum' ? draft.enumRef : undefined,
    referenceKind,
    referencedEntityId: isReference && referenceKind === 'entity' ? draft.referencedEntityId : undefined,
    referenceDisplayField: isReference && referenceKind === 'entity' ? draft.referenceDisplayField : undefined,
    isMasterDataRef,
    masterDataType: isMasterDataRef ? draft.masterDataType : undefined,
    masterDataField: isMasterDataRef ? draft.masterDataField : undefined,
    autoFill: draft.autoFill,
    default: draft.default,
    metadataTemplateId: draft.metadataTemplateId,
    metadataTemplateName: draft.metadataTemplateName,
  };
}

/**
 * 构建关系数据对象（用于保存）。
 */
export function buildRelationFromDraft(
  draft: Partial<Relation>,
  id: string | null,
  entityId: string,
): Relation {
  const targetEntity = draft.isRecursive ? entityId : (draft.targetEntity || '');

  return {
    id: id || 'new',
    name: draft.name || '新关系',
    type: draft.type || 'one_to_many',
    targetEntity,
    foreignKey: draft.foreignKey || undefined,
    cascade: draft.cascade || 'none',
    description: draft.description,
    directionality: draft.directionality || 'directed',
    isRecursive: draft.isRecursive || false,
    viaEntity: draft.type === 'many_to_many' ? draft.viaEntity?.trim() : undefined,
    attributes: draft.attributes || [],
  };
}

/**
 * 构建实体数据对象（用于创建）。
 */
export function buildEntityFromDraft(
  draft: Partial<Entity>,
  id: string,
  entityRole: Entity['entityRole'] | undefined,
): Entity {
  return {
    id,
    name: draft.name || '新实体',
    nameEn: draft.nameEn || 'NewEntity',
    description: draft.description,
    businessMeaning: draft.businessMeaning,
    aliases: draft.aliases,
    projectId: draft.projectId || '',
    businessScenarioId: draft.businessScenarioId || '',
    entityRole,
    parentAggregateId: entityRole === 'child_entity' ? draft.parentAggregateId : undefined,
    attributes: draft.attributes || [],
    relations: draft.relations || [],
  };
}

// ============================================================
// 索引 & 领域事件
// ============================================================

/**
 * 解析索引字段列表（逗号分隔）。
 */
export function parseIndexFieldList(fields: string): string[] {
  return fields.split(',').map((field) => field.trim()).filter(Boolean);
}

export interface IndexDraftValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 校验索引草稿是否可保存。
 */
export function validateIndexDraft(fields: string): IndexDraftValidationResult {
  if (parseIndexFieldList(fields).length === 0) {
    return { valid: false, error: '请输入至少一个索引字段' };
  }
  return { valid: true };
}

/**
 * 从索引草稿构建索引对象。
 */
export function buildIndexFromDraft(
  fields: string,
  type: 'btree' | 'hash',
  unique: boolean,
): { fields: string[]; type: 'btree' | 'hash'; unique: boolean } {
  return { fields: parseIndexFieldList(fields), type, unique };
}

/**
 * 获取实体尚未关联、可链接的领域事件列表。
 */
export function getLinkableDomainEvents(
  entity: Pick<Entity, 'domainEvents'> | null | undefined,
  eventDefinitions: EventDefinition[],
): EventDefinition[] {
  if (!entity) return [];
  const linked = entity.domainEvents || [];
  return eventDefinitions.filter(
    (event) => event.isDomainEvent && !linked.includes(event.id),
  );
}

// ============================================================
// 元数据模板 & 列表操作
// ============================================================

/**
 * 将元数据模板字段合并到属性编辑草稿（不改变已有名称等已填项）。
 */
export function applyMetadataTemplateToAttributeDraft(
  draft: Partial<Attribute>,
  metadata: Metadata,
): Partial<Attribute> {
  const dataType = mapMetadataTypeToAttributeType(metadata.type);
  return {
    ...draft,
    metadataTemplateId: metadata.id,
    metadataTemplateName: metadata.name,
    name: draft.name || metadata.name,
    nameEn: draft.nameEn || metadata.nameEn,
    dataType,
    referenceKind: dataType === 'reference' ? draft.referenceKind || 'entity' : undefined,
    referencedEntityId: dataType === 'reference' ? draft.referencedEntityId : undefined,
    isMasterDataRef: dataType === 'reference' ? Boolean(draft.isMasterDataRef) : false,
    masterDataType: dataType === 'reference' && draft.isMasterDataRef ? draft.masterDataType : undefined,
    masterDataField: dataType === 'reference' && draft.isMasterDataRef ? draft.masterDataField : undefined,
    description: draft.description || metadata.description,
  };
}

/**
 * 格式化元数据下拉选项展示文本。
 */
export function formatMetadataOptionLabel(metadata: Metadata): string {
  return `${metadata.name} (${metadata.nameEn}) - ${metadata.domain}`;
}

/**
 * 在列表中新增或更新带 id 的项。
 */
export function upsertInList<T extends { id: string }>(
  list: T[],
  item: T,
  editId: string | null,
): T[] {
  if (editId) {
    return list.map((entry) => (entry.id === editId ? item : entry));
  }
  return [...list, item];
}

/**
 * 按 id 从列表中移除项。
 */
export function removeFromListById<T extends { id: string }>(
  list: T[],
  id: string,
): T[] {
  return list.filter((entry) => entry.id !== id);
}

// ============================================================
// 实体创建校验
// ============================================================

export interface EntityCreateValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 校验实体创建草稿是否满足必填条件。
 */
export function validateEntityCreateDraft(
  draft: Partial<Entity>,
  entityRole: EntityRole | undefined,
  options?: { hasProjects?: boolean },
): EntityCreateValidationResult {
  const errors: string[] = [];
  const hasProjects = options?.hasProjects ?? true;

  if (!draft.projectId) {
    if (!hasProjects) {
      errors.push('无可用项目');
    } else {
      errors.push('请选择项目');
    }
  }
  if (draft.projectId && !draft.businessScenarioId) {
    errors.push('请选择业务场景');
  }
  if (entityRole === 'child_entity' && !draft.parentAggregateId) {
    errors.push('子实体必须选择父聚合根');
  }
  return { valid: errors.length === 0, errors };
}
