import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock xlsx ====================
// Route uses: import * as XLSX from 'xlsx'; then XLSX.utils.* and XLSX.write()

const xlsxState = vi.hoisted(() => ({
  bookNewCallCount: 0,
  appendSheetCallCount: 0,
  writeCallCount: 0,
  lastWriteOpts: null as Record<string, unknown> | null,
  jsonToSheetCallCount: 0,
  aoaToSheetCallCount: 0,
}));

vi.mock('xlsx', () => ({
  write: vi.fn((_wb: unknown, opts: unknown) => {
    xlsxState.writeCallCount++;
    xlsxState.lastWriteOpts = opts as Record<string, unknown>;
    return Buffer.from('mock-xlsx-from-manifest');
  }),
  utils: {
    book_new: vi.fn(() => {
      xlsxState.bookNewCallCount++;
      return {};
    }),
    book_append_sheet: vi.fn(() => {
      xlsxState.appendSheetCallCount++;
    }),
    json_to_sheet: vi.fn(() => {
      xlsxState.jsonToSheetCallCount++;
      return {};
    }),
    aoa_to_sheet: vi.fn(() => {
      xlsxState.aoaToSheetCallCount++;
      return {};
    }),
  },
}));

import { POST } from './route';

describe('XLSX From Manifest Route (POST /api/export/xlsx-from-manifest)', () => {
  beforeEach(() => {
    xlsxState.bookNewCallCount = 0;
    xlsxState.appendSheetCallCount = 0;
    xlsxState.writeCallCount = 0;
    xlsxState.jsonToSheetCallCount = 0;
    xlsxState.aoaToSheetCallCount = 0;
    xlsxState.lastWriteOpts = null;
  });

  it('请求体不是有效 JSON 时应返回 500', async () => {
    const request = new NextRequest('http://localhost/api/export/xlsx-from-manifest', {
      method: 'POST',
      body: 'not-valid-json',
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toBeDefined();
  });

  it('有效 manifest 应返回 xlsx 响应', async () => {
    const manifest = {
      apiVersion: 'ontology.platform/v1',
      kind: 'OntologyManifest',
      metadata: {
        id: 'manifest-1',
        version: '1.0.0',
        name: '合同管理',
        displayName: '合同管理 Manifest',
        description: '合同管理系统导出',
        boundedContext: '合同管理',
        domainTags: ['合同', '采购'],
        compiledAt: '2026-06-26T00:00:00.000Z',
        compiledBy: 'admin',
        source: 'ontology-designer',
        status: 'draft',
      },
      spec: {
        semantic: {
          objectTypes: [
            {
              id: 'obj-contract',
              name: '合同',
              nameEn: 'Contract',
              kind: 'aggregate_root',
              properties: [
                { id: 'prop-1', nameEn: 'contractNo', dataType: 'string', required: true },
              ],
              relations: [],
            },
          ],
          stateMachines: [
            {
              id: 'sm-1',
              name: '合同状态机',
              objectTypeId: 'obj-contract',
              states: [
                { name: '草稿', code: 'draft', isInitial: true },
                { name: '已生效', code: 'active', isFinal: true },
              ],
            },
          ],
        },
        behavior: {
          actions: [
            {
              id: 'act-1',
              name: '创建合同',
              nameEn: 'CreateContract',
              aggregateRootId: 'obj-contract',
            },
          ],
          rules: [
            {
              id: 'rule-1',
              name: '合同金额校验',
              type: 'field_validation',
              errorMessage: '金额必须大于0',
              enabled: true,
            },
          ],
          metrics: [
            {
              id: 'metric-1',
              nameEn: 'ContractCount',
              formula: 'count()',
              unit: '个',
              boundActionId: 'act-1',
              measurementType: 'automatic',
            },
          ],
          transactionBoundaries: [
            {
              id: 'tb-1',
              nameEn: 'ContractCreateBoundary',
              actionIds: ['act-1'],
              aggregateRootIds: ['obj-contract'],
              isolation: 'read_committed',
            },
          ],
        },
        events: {
          domainEvents: [
            {
              id: 'evt-1',
              nameEn: 'ContractCreated',
              aggregateRootId: 'obj-contract',
            },
          ],
        },
        governance: {
          roles: [
            {
              id: 'role-admin',
              name: '管理员',
            },
          ],
        },
        process: {
          orchestrations: [
            {
              id: 'proc-1',
              name: '合同创建流程',
              entryPoint: 'CreateContract',
              steps: [],
            },
          ],
        },
        dataSources: [
          {
            id: 'ds-1',
            name: 'ERP',
            type: 'api',
          },
        ],
      },
    };

    const request = new NextRequest('http://localhost/api/export/xlsx-from-manifest', {
      method: 'POST',
      body: JSON.stringify(manifest),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(response.headers.get('Content-Disposition')).toContain('1.0.0');
    expect(xlsxState.bookNewCallCount).toBe(1);
    expect(xlsxState.writeCallCount).toBe(1);
  });

  it('应生成 13 个 Sheet', async () => {
    const manifest = {
      apiVersion: 'ontology.platform/v1',
      kind: 'OntologyManifest',
      metadata: {
        id: 'manifest-1',
        version: '1.0.0',
        name: '空模型',
        boundedContext: 'test',
      },
      spec: {},
    };

    const request = new NextRequest('http://localhost/api/export/xlsx-from-manifest', {
      method: 'POST',
      body: JSON.stringify(manifest),
      headers: { 'content-type': 'application/json' },
    });

    await POST(request);

    // 13 sheets: Metadata, E1-Entities, E1-Properties, E1-Relations, E2-StateMachines,
    // E2-Actions, E3-Rules, E4-Events, E5-Roles, E6-Metrics, E7-Boundaries,
    // E8-DataSources, Process-Orchestrations
    expect(xlsxState.appendSheetCallCount).toBe(13);
  });

  it('空的 manifest（无 spec 字段）也应正常工作', async () => {
    const manifest = {
      apiVersion: 'ontology.platform/v1',
      kind: 'OntologyManifest',
      metadata: {
        id: 'minimal',
        version: '0.0.1',
        name: '最小化',
        boundedContext: 'test',
      },
    };

    const request = new NextRequest('http://localhost/api/export/xlsx-from-manifest', {
      method: 'POST',
      body: JSON.stringify(manifest),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(xlsxState.writeCallCount).toBe(1);
  });

  it('应使用 buffer 类型写入 workbook', async () => {
    const manifest = {
      apiVersion: 'ontology.platform/v1',
      kind: 'OntologyManifest',
      metadata: {
        id: 'test',
        version: '1.0.0',
        name: '测试',
        boundedContext: 'test',
      },
      spec: {},
    };

    const request = new NextRequest('http://localhost/api/export/xlsx-from-manifest', {
      method: 'POST',
      body: JSON.stringify(manifest),
      headers: { 'content-type': 'application/json' },
    });

    await POST(request);

    expect(xlsxState.lastWriteOpts).toEqual(
      expect.objectContaining({ type: 'buffer', bookType: 'xlsx' }),
    );
  });
});
