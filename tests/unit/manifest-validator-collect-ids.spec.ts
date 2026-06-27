import { describe, expect, it } from 'vitest';
import { collectManifestIds } from '@/lib/manifest-validator/collect-ids';
import type { OntologyManifest } from '@/lib/manifest-validator/types';

function minimalManifest(overrides?: Partial<OntologyManifest>): OntologyManifest {
  return {
    apiVersion: 'ontology.platform/v1',
    kind: 'OntologyManifest',
    metadata: {
      id: 'meta-1',
      version: '1.0.0',
      name: '测试',
      boundedContext: 'bc-test',
    },
    spec: {
      semantic: {
        objectTypes: [
          {
            id: 'ot-1',
            name: '物料',
            nameEn: 'Material',
            kind: 'aggregate_root',
            properties: [{ id: 'prop-1', name: '编码', nameEn: 'code', dataType: 'string' }],
            // @ts-expect-error -- relations type changed: name/targetType→sourceObjectTypeId/targetObjectTypeId
            relations: [{ id: 'rel-1', name: '供应商', nameEn: 'supplier', targetType: 'Partner' }],
          },
        ],
        stateMachines: [{ id: 'sm-1', name: '状态机', nameEn: 'SM', entityId: 'ot-1', states: [] }],
      },
      behavior: {
        // @ts-expect-error -- pre-existing: entityId not in updated ManifestAction
        actions: [{ id: 'act-1', name: '创建', nameEn: 'create', entityId: 'ot-1' }],
        rules: [{ id: 'rule-1', name: '校验', nameEn: 'validate', entityId: 'ot-1', type: 'field' }],
        metrics: [{ id: 'met-1', name: '产量', nameEn: 'output', entityId: 'ot-1' }],
        transactionBoundaries: [{ id: 'tx-1', name: '边界', nameEn: 'boundary' }],
      },
      events: {
        // @ts-expect-error -- pre-existing: entityId not in updated ManifestDomainEvent
        domainEvents: [{ id: 'evt-1', name: '创建', nameEn: 'Created', entityId: 'ot-1' }],
        routes: [{ id: 'route-1', name: '路由', nameEn: 'Route' }],
        handlers: [{ id: 'handler-1', name: '处理', nameEn: 'Handler' }],
      },
      governance: {
        // @ts-expect-error -- pre-existing: nameEn not in updated ManifestGovernanceRole
        roles: [{ id: 'role-1', name: '管理员', nameEn: 'Admin' }],
        agentPolicies: [{ id: 'pol-1', name: '策略', nameEn: 'Policy' }],
      },
      dataSources: [{ id: 'ds-1', name: 'ERP', nameEn: 'ERP', type: 'api' }],
      process: { orchestrations: [] },
    },
    ...overrides,
  };
}

describe('collectManifestIds', () => {
  it('collects metadata id', () => {
    const ids = collectManifestIds(minimalManifest());
    expect(ids.some((o) => o.id === 'meta-1' && o.elementType === 'metadata')).toBe(true);
  });

  it('collects object type, property and relation ids', () => {
    const ids = collectManifestIds(minimalManifest());
    expect(ids.some((o) => o.id === 'ot-1' && o.elementType === 'objectType')).toBe(true);
    expect(ids.some((o) => o.id === 'prop-1' && o.elementType === 'property')).toBe(true);
    expect(ids.some((o) => o.id === 'rel-1' && o.elementType === 'relation')).toBe(true);
  });

  it('collects behavior layer ids', () => {
    const ids = collectManifestIds(minimalManifest());
    expect(ids.some((o) => o.id === 'act-1')).toBe(true);
    expect(ids.some((o) => o.id === 'rule-1')).toBe(true);
    expect(ids.some((o) => o.id === 'met-1')).toBe(true);
    expect(ids.some((o) => o.id === 'tx-1')).toBe(true);
  });

  it('collects events and governance ids', () => {
    const ids = collectManifestIds(minimalManifest());
    expect(ids.some((o) => o.id === 'evt-1')).toBe(true);
    expect(ids.some((o) => o.id === 'route-1')).toBe(true);
    expect(ids.some((o) => o.id === 'handler-1')).toBe(true);
    expect(ids.some((o) => o.id === 'role-1')).toBe(true);
    expect(ids.some((o) => o.id === 'pol-1')).toBe(true);
  });

  it('collects data source ids', () => {
    const ids = collectManifestIds(minimalManifest());
    expect(ids.some((o) => o.id === 'ds-1' && o.elementType === 'dataSource')).toBe(true);
  });

  it('returns empty property ids when spec is sparse', () => {
    const sparse = minimalManifest({
      spec: {
        semantic: {},
        behavior: {},
        events: {},
        governance: {},
        dataSources: [],
        process: { orchestrations: [] },
      },
    });
    const ids = collectManifestIds(sparse);
    expect(ids).toHaveLength(1);
    expect(ids[0].id).toBe('meta-1');
  });
});
