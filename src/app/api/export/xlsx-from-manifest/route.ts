import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { OntologyManifest } from '@/lib/manifest-validator/types';

function toRows<T>(items: T[] | undefined): Record<string, unknown>[] {
  return (items || []).map((item) => (item ? (item as unknown as Record<string, unknown>) : {}));
}

/**
 * Build a worksheet from rows + a Chinese header mapping.
 * The first row of the sheet will be the Chinese headers.
 *
 * Column order is determined by the insertion order of `headerMap` keys
 * (ES2015+ guarantees insertion-order iteration for string-keyed plain objects).
 * This ensures the Excel columns always appear in the same order as the header
 * definition, regardless of row data shape or engine internals.
 */
function buildSheet(
  rows: Record<string, unknown>[],
  headerMap: Record<string, string>,
): XLSX.WorkSheet {
  // Canonical column order from headerMap definition
  const orderedKeys = Object.keys(headerMap);

  if (rows.length === 0) {
    const headers = orderedKeys.map((k) => headerMap[k]);
    return XLSX.utils.aoa_to_sheet([headers]);
  }

  const headerRow = orderedKeys.map((k) => headerMap[k]);
  const dataRows = rows.map((row) => orderedKeys.map((k) => row[k] ?? ''));

  return XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
}

function flattenObjectType(obj: Record<string, unknown>): Record<string, unknown> {
  const { properties, relations, ...rest } = obj;
  return {
    ...rest,
    properties: Array.isArray(properties)
      ? properties.map((p) => (p && typeof p === 'object' ? JSON.stringify(p) : p)).join('\n')
      : '',
    relations: Array.isArray(relations)
      ? relations.map((r) => (r && typeof r === 'object' ? JSON.stringify(r) : r)).join('\n')
      : '',
  };
}

function flattenAction(action: Record<string, unknown>): Record<string, unknown> {
  const { preRuleIds, publishesEventIds, aliases, triggerPhrases, ...rest } = action;
  return {
    ...rest,
    preRuleIds: Array.isArray(preRuleIds) ? preRuleIds.join(',') : '',
    publishesEventIds: Array.isArray(publishesEventIds) ? publishesEventIds.join(',') : '',
    aliases: Array.isArray(aliases) ? aliases.join(',') : aliases || '',
    triggerPhrases: Array.isArray(triggerPhrases) ? triggerPhrases.join(',') : triggerPhrases || '',
  };
}

function flattenRule(rule: Record<string, unknown>): Record<string, unknown> {
  const { expression, grayscale, ...rest } = rule;
  return {
    ...rest,
    expression: expression && typeof expression === 'object' ? JSON.stringify(expression) : expression || '',
    grayscale: grayscale && typeof grayscale === 'object' ? JSON.stringify(grayscale) : grayscale || '',
  };
}

function flattenEvent(event: Record<string, unknown>): Record<string, unknown> {
  const { payloadSchema, semantics, ...rest } = event;
  return {
    ...rest,
    payloadSchema: payloadSchema && typeof payloadSchema === 'object' ? JSON.stringify(payloadSchema) : payloadSchema || '',
    semantics: semantics && typeof semantics === 'object' ? JSON.stringify(semantics) : semantics || '',
  };
}

function flattenMetric(metric: Record<string, unknown>): Record<string, unknown> {
  const { dimensions, ...rest } = metric;
  return {
    ...rest,
    dimensions: dimensions && typeof dimensions === 'object' ? JSON.stringify(dimensions) : dimensions || '',
  };
}

function flattenDataSource(ds: Record<string, unknown>): Record<string, unknown> {
  const { schema, config, ...rest } = ds;
  return {
    ...rest,
    schema: schema && typeof schema === 'object' ? JSON.stringify(schema) : schema || '',
    config: config && typeof config === 'object' ? JSON.stringify(config) : config || '',
  };
}

// ── 中文表头映射 ──

const METADATA_HEADERS: Record<string, string> = {
  id: '标识',
  version: '版本',
  name: '名称',
  displayName: '显示名称',
  description: '描述',
  boundedContext: '限界上下文',
  domainTags: '领域标签',
  compiledAt: '编译时间',
  compiledBy: '编译者',
  source: '来源',
  status: '状态',
};

const OBJECT_TYPE_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  nameEn: '英文名',
  kind: '类型',
  aggregateRootId: '聚合根ID',
  properties: '属性(JSON)',
  relations: '关系(JSON)',
};

const PROPERTIES_HEADERS: Record<string, string> = {
  entityId: '实体ID',
  entityName: '实体名称',
  entityNameEn: '实体英文名',
  id: '标识',
  name: '名称',
  nameEn: '英文名',
  dataType: '数据类型',
  required: '必填',
  reference: '引用(JSON)',
  valueObjectRef: '值对象引用',
  sensitive: '敏感字段',
};

const RELATIONS_HEADERS: Record<string, string> = {
  entityId: '实体ID',
  entityName: '实体名称',
  id: '标识',
  sourceObjectTypeId: '源实体ID',
  targetObjectTypeId: '目标实体ID',
};

const STATE_MACHINE_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  objectTypeId: '实体ID',
  states: '状态列表(JSON)',
};

const ACTION_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  nameEn: '英文名',
  aggregateRootId: '聚合根ID',
  preRuleIds: '前置规则',
  publishesEventIds: '发布事件',
  aliases: '别名',
  triggerPhrases: '触发短语',
};

const RULE_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  type: '规则类型',
  version: '版本',
  status: '状态',
  grayscale: '灰度(JSON)',
  effectiveFrom: '生效开始',
  effectiveUntil: '生效结束',
  expression: '表达式(JSON)',
  errorMessage: '错误消息',
  enabled: '启用',
};

const EVENT_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  nameEn: '英文名',
  aggregateRootId: '聚合根ID',
  triggerActionId: '触发动作ID',
  payloadSchema: '载荷结构(JSON)',
  semantics: '语义(JSON)',
};

const ROLE_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  permissions: '权限(JSON)',
};

const METRIC_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  nameEn: '英文名',
  formula: '公式',
  unit: '单位',
  boundActionId: '绑定动作ID',
  measurementType: '测量方式',
  targetValue: '目标值',
  dataSourceRef: '数据源引用',
  dimensions: '维度(JSON)',
};

const BOUNDARY_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  nameEn: '英文名',
  actionIds: '涉及动作',
  aggregateRootIds: '涉及聚合根',
  isolation: '隔离级别',
  compensationActionId: '补偿动作ID',
  description: '描述',
};

const DATA_SOURCE_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  nameEn: '英文名',
  type: '类型',
  boundObjectTypeId: '绑定对象ID',
  baseUrl: '基础URL',
  entitySet: '实体集',
  authSecretRef: '认证密钥引用',
  schema: '结构(JSON)',
  config: '配置(JSON)',
};

const ORCHESTRATION_HEADERS: Record<string, string> = {
  id: '标识',
  name: '名称',
  entryPoint: '入口点',
  steps: '步骤(JSON)',
  description: '描述',
};

export async function POST(request: NextRequest) {
  try {
    const manifest: OntologyManifest = await request.json();
    const { metadata, spec } = manifest;

    const wb = XLSX.utils.book_new();

    // Metadata sheet
    XLSX.utils.book_append_sheet(
      wb,
      buildSheet([
        {
          id: metadata.id,
          version: metadata.version,
          name: metadata.name,
          displayName: metadata.displayName || '',
          description: metadata.description || '',
          boundedContext: metadata.boundedContext,
          domainTags: (metadata.domainTags || []).join(', '),
          compiledAt: metadata.compiledAt || '',
          compiledBy: metadata.compiledBy || '',
          source: metadata.source || '',
          status: metadata.status || '',
        },
      ], METADATA_HEADERS),
      'Metadata-元数据',
    );

    // E1 Semantic - Object Types
    const objectTypes = (spec?.semantic?.objectTypes || []).map((item) =>
      flattenObjectType(item as unknown as Record<string, unknown>),
    );
    XLSX.utils.book_append_sheet(wb, buildSheet(toRows(objectTypes), OBJECT_TYPE_HEADERS), 'E1-实体要素');

    // Flatten all properties into E1-Properties sheet
    const propertiesRows: Record<string, unknown>[] = [];
    (spec?.semantic?.objectTypes || []).forEach((obj) => {
      (obj.properties || []).forEach((prop) => {
        propertiesRows.push({
          entityId: obj.id,
          entityName: obj.name || '',
          entityNameEn: obj.nameEn || '',
          ...prop,
        } as unknown as Record<string, unknown>);
      });
    });
    XLSX.utils.book_append_sheet(wb, buildSheet(propertiesRows, PROPERTIES_HEADERS), 'E1-属性');

    // Flatten all relations into E1-Relations sheet
    const relationsRows: Record<string, unknown>[] = [];
    (spec?.semantic?.objectTypes || []).forEach((obj) => {
      (obj.relations || []).forEach((rel) => {
        relationsRows.push({
          entityId: obj.id,
          entityName: obj.name || '',
          ...rel,
        } as unknown as Record<string, unknown>);
      });
    });
    XLSX.utils.book_append_sheet(wb, buildSheet(relationsRows, RELATIONS_HEADERS), 'E1-关系');

    // E2 State machines
    XLSX.utils.book_append_sheet(
      wb,
      buildSheet(toRows(spec?.semantic?.stateMachines as unknown as Record<string, unknown>[]), STATE_MACHINE_HEADERS),
      'E2-状态机',
    );

    // E2 Actions
    const actions = (spec?.behavior?.actions || []).map((item) =>
      flattenAction(item as unknown as Record<string, unknown>),
    );
    XLSX.utils.book_append_sheet(wb, buildSheet(toRows(actions), ACTION_HEADERS), 'E2-行为要素');

    // E3 Rules
    const rules = (spec?.behavior?.rules || []).map((item) => flattenRule(item as unknown as Record<string, unknown>));
    XLSX.utils.book_append_sheet(wb, buildSheet(toRows(rules), RULE_HEADERS), 'E3-规则要素');

    // E4 Domain Events
    const events = (spec?.events?.domainEvents || []).map((item) =>
      flattenEvent(item as unknown as Record<string, unknown>),
    );
    XLSX.utils.book_append_sheet(wb, buildSheet(toRows(events), EVENT_HEADERS), 'E4-事件要素');

    // E5 Governance roles
    XLSX.utils.book_append_sheet(
      wb,
      buildSheet(toRows(spec?.governance?.roles as unknown as Record<string, unknown>[]), ROLE_HEADERS),
      'E5-角色要素',
    );

    // E6 Metrics
    const metrics = (spec?.behavior?.metrics || []).map((item) =>
      flattenMetric(item as unknown as Record<string, unknown>),
    );
    XLSX.utils.book_append_sheet(wb, buildSheet(toRows(metrics), METRIC_HEADERS), 'E6-指标要素');

    // E7 Transaction boundaries / constraints
    XLSX.utils.book_append_sheet(
      wb,
      buildSheet(toRows(spec?.behavior?.transactionBoundaries as unknown as Record<string, unknown>[]), BOUNDARY_HEADERS),
      'E7-边界约束',
    );

    // E8 Data sources
    const dataSources = (spec?.dataSources || []).map((item) => flattenDataSource(item));
    XLSX.utils.book_append_sheet(wb, buildSheet(toRows(dataSources), DATA_SOURCE_HEADERS), 'E8-数据源');

    // Process orchestrations
    XLSX.utils.book_append_sheet(
      wb,
      buildSheet(toRows(spec?.process?.orchestrations as unknown as Record<string, unknown>[]), ORCHESTRATION_HEADERS),
      'Process-流程编排',
    );

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="manifest-${metadata.version || 'export'}.xlsx"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
