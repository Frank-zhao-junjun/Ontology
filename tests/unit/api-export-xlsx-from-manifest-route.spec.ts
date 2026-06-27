import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import type { OntologyManifest } from '@/lib/manifest-validator/types';
import { POST } from '@/app/api/export/xlsx-from-manifest/route';

const minimalManifest: OntologyManifest = {
  apiVersion: 'ontology.platform/v1',
  kind: 'OntologyManifest',
  metadata: {
    id: 'manifest-xlsx-1',
    version: '2.1.0',
    name: '导出测试',
    displayName: 'Export Test',
    boundedContext: 'manufacturing',
    domainTags: ['mfg'],
  },
  spec: {
    semantic: {
      objectTypes: [
        {
          id: 'ot-export-1',
          name: '物料',
          nameEn: 'Material',
          kind: 'aggregate_root',
          properties: [
            { id: 'prop-1', name: '编码', nameEn: 'materialCode', dataType: 'string', required: true },
          ],
          relations: [
            {
              id: 'rel-1',
              name: '供应商',
              nameEn: 'supplier',
              targetType: 'Partner',
              cardinality: 'many_to_one',
            },
          ],
        },
      ],
      stateMachines: [{ id: 'sm-1', name: '状态', nameEn: 'State', entityId: 'ot-export-1', states: [] }],
    },
    behavior: {
      actions: [
        {
          id: 'act-1',
          name: '创建',
          nameEn: 'create',
          entityId: 'ot-export-1',
          preRuleIds: ['rule-1'],
          publishesEventIds: ['evt-1'],
        },
      ],
      rules: [
        {
          id: 'rule-1',
          name: '校验',
          nameEn: 'validate',
          entityId: 'ot-export-1',
          type: 'field',
          expression: { field: 'materialCode', op: 'required' },
        },
      ],
      metrics: [
        {
          id: 'met-1',
          name: '产量',
          nameEn: 'output',
          entityId: 'ot-export-1',
          dimensions: { plant: '1010' },
        },
      ],
      transactionBoundaries: [{ id: 'tx-1', name: '边界', nameEn: 'Boundary' }],
    },
    events: {
      domainEvents: [
        {
          id: 'evt-1',
          name: '创建',
          nameEn: 'MaterialCreated',
          entityId: 'ot-export-1',
          payloadSchema: { materialCode: 'string' },
        },
      ],
      routes: [],
      handlers: [],
    },
    governance: {
      roles: [{ id: 'role-1', name: '计划员', nameEn: 'Planner' }],
      agentPolicies: [],
    },
    dataSources: [
      {
        id: 'ds-1',
        name: 'ERP',
        nameEn: 'ERP',
        type: 'api',
        schema: { entity: 'Material' },
        config: { baseUrl: 'https://erp.example' },
      },
    ],
    process: {
      orchestrations: [{ id: 'orch-1', name: '流程', nameEn: 'Flow', steps: [] }],
    },
  },
};

function manifestRequest(manifest: unknown) {
  return new NextRequest('http://localhost/api/export/xlsx-from-manifest', {
    method: 'POST',
    body: JSON.stringify(manifest),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/export/xlsx-from-manifest (GS-04)', () => {
  it('returns xlsx attachment for valid manifest', async () => {
    const response = await POST(manifestRequest(minimalManifest));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('spreadsheetml');
    expect(response.headers.get('Content-Disposition')).toContain('manifest-2.1.0.xlsx');

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.byteLength).toBeGreaterThan(500);
  });

  it('includes PK zip signature (xlsx is zip)', async () => {
    const response = await POST(manifestRequest(minimalManifest));
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('returns 500 for invalid JSON body', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/export/xlsx-from-manifest', {
        method: 'POST',
        body: 'not-json',
        headers: { 'content-type': 'application/json' },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toBeTruthy();
  });

  it('handles sparse manifest with metadata only sheets', async () => {
    const sparse: OntologyManifest = {
      ...minimalManifest,
      spec: {
        semantic: {},
        behavior: {},
        events: {},
        governance: {},
        dataSources: [],
        process: {},
      },
    };
    const response = await POST(manifestRequest(sparse));
    expect(response.status).toBe(200);
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.byteLength).toBeGreaterThan(200);
  });
});
