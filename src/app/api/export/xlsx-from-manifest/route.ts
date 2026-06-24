import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { OntologyManifest } from '@/lib/manifest-validator/types';

function toRows<T>(items: T[] | undefined): Record<string, unknown>[] {
  return (items || []).map((item) => (item ? (item as unknown as Record<string, unknown>) : {}));
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

export async function POST(request: NextRequest) {
  try {
    const manifest: OntologyManifest = await request.json();
    const { metadata, spec } = manifest;

    const wb = XLSX.utils.book_new();

    // Metadata sheet
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
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
      ]),
      'Metadata',
    );

    // E1 Semantic - Object Types
    const objectTypes = (spec?.semantic?.objectTypes || []).map((item) =>
      flattenObjectType(item as unknown as Record<string, unknown>),
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(objectTypes)), 'E1-Entities');

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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(propertiesRows), 'E1-Properties');

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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(relationsRows), 'E1-Relations');

    // E2 State machines
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(toRows(spec?.semantic?.stateMachines as unknown as Record<string, unknown>[])),
      'E2-StateMachines',
    );

    // E2 Actions
    const actions = (spec?.behavior?.actions || []).map((item) =>
      flattenAction(item as unknown as Record<string, unknown>),
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(actions)), 'E2-Actions');

    // E3 Rules
    const rules = (spec?.behavior?.rules || []).map((item) => flattenRule(item as unknown as Record<string, unknown>));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(rules)), 'E3-Rules');

    // E4 Domain Events
    const events = (spec?.events?.domainEvents || []).map((item) =>
      flattenEvent(item as unknown as Record<string, unknown>),
    );
    XLSX.utils.json_to_sheet(toRows(events));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(events)), 'E4-Events');

    // E5 Governance roles
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(toRows(spec?.governance?.roles as unknown as Record<string, unknown>[])),
      'E5-Roles',
    );

    // E6 Metrics
    const metrics = (spec?.behavior?.metrics || []).map((item) =>
      flattenMetric(item as unknown as Record<string, unknown>),
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(metrics)), 'E6-Metrics');

    // E7 Transaction boundaries / constraints
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(toRows(spec?.behavior?.transactionBoundaries as unknown as Record<string, unknown>[])),
      'E7-Boundaries',
    );

    // E8 Data sources
    const dataSources = (spec?.dataSources || []).map((item) => flattenDataSource(item));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(dataSources)), 'E8-DataSources');

    // Process orchestrations
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(toRows(spec?.process?.orchestrations as unknown as Record<string, unknown>[])),
      'Process-Orchestrations',
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
