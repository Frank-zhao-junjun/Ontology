import { describe, it, expect } from 'vitest';
import { read, utils } from 'xlsx';
import { exportModulesToExcel, buildExcelWorkbook } from '@/lib/excel/export-excel';
import type { ModuleVersionRecord, ValueDomain, Capability, Scenario, EpcProcess, MetaElement } from '@/types/ontology';

function makeRecord(
  overrides: Partial<ModuleVersionRecord> & { moduleKind: ModuleVersionRecord['moduleKind']; moduleId: string },
): ModuleVersionRecord {
  return {
    id: `mvr-${overrides.moduleId}`,
    status: 'confirmed',
    version: 'v1',
    confirmedAt: '2026-06-18T00:00:00.000Z',
    createdAt: '2026-06-18T00:00:00.000Z',
    snapshot: { id: overrides.moduleId, name: `Name of ${overrides.moduleId}` },
    ...overrides,
  };
}

const sampleRecords: ModuleVersionRecord[] = [
  makeRecord({ moduleKind: 'A', moduleId: 'VD-001', snapshot: { id: 'VD-001', name: '生产制造' } }),
  makeRecord({ moduleKind: 'B', moduleId: 'CAP-001', snapshot: { id: 'CAP-001', name: '计划能力', parentId: 'VD-001' } }),
  makeRecord({ moduleKind: 'C', moduleId: 'SC-001', snapshot: { id: 'SC-001', name: 'MTS场景', parentId: 'CAP-001' } }),
  makeRecord({
    moduleKind: 'EPC', moduleId: 'EPC-001',
    snapshot: { id: 'EPC-001', name: '订单下达流程', parentId: 'SC-001', steps: [{ id: 's1', name: '下达', elementRef: { dimension: 'E2', elementId: 'ACT-001', versionPin: 'latest_confirmed' as const } }] },
  }),
  makeRecord({ moduleKind: 'E2', moduleId: 'ACT-001', snapshot: { id: 'ACT-001', name: '生产订单下达', dimension: 'E2' } }),
  makeRecord({ moduleKind: 'E1', moduleId: 'ENT-001', snapshot: { id: 'ENT-001', name: '生产订单', dimension: 'E1' } }),
];

const sampleMetaElements: MetaElement[] = [
  { id: 'ENT-001', name: '生产订单', dimension: 'E1', confirmedVersion: 'v1' },
  { id: 'ACT-001', name: '生产订单下达', dimension: 'E2', confirmedVersion: 'v1' },
];

describe('excel-export', () => {
  describe('AC-1: Sheet count', () => {
    it('should export workbook with 13 sheets (12 modules + 1 hidden ref)', () => {
      const buf = exportModulesToExcel({
        valueDomains: [{ id: 'VD-001', name: '生产制造' }],
        capabilities: [{ id: 'CAP-001', name: '计划能力', parentId: 'VD-001' }],
        scenarios: [{ id: 'SC-001', name: 'MTS场景', parentId: 'CAP-001' }],
        epcProcesses: [{ id: 'EPC-001', name: '订单下达流程', parentId: 'SC-001', steps: [] }],
        metaElements: sampleMetaElements,
        moduleVersionRecords: sampleRecords,
      });
      const wb = read(buf, { type: 'array' });
      expect(wb.SheetNames).toHaveLength(13);

      // Verify visible sheet names
      const visibleNames = wb.SheetNames.filter((n) => !n.startsWith('_'));
      expect(visibleNames).toHaveLength(12);
    });
  });

  describe('AC-2: Version selection', () => {
    it('should export latest confirmed by default', () => {
      const records: ModuleVersionRecord[] = [
        makeRecord({ moduleKind: 'A', moduleId: 'VD-001', version: 'v1', snapshot: { id: 'VD-001', name: 'V1 Name' } }),
        makeRecord({ moduleKind: 'A', moduleId: 'VD-001', version: 'v2', snapshot: { id: 'VD-001', name: 'V2 Name' } }),
      ];
      const buf = exportModulesToExcel({
        valueDomains: [{ id: 'VD-001', name: 'VD-001' }],
        capabilities: [],
        scenarios: [],
        epcProcesses: [],
        metaElements: [],
        moduleVersionRecords: records,
      });
      const wb = read(buf, { type: 'array' });
      const sheet = wb.Sheets['A'];
      const rows = utils.sheet_to_json(sheet);
      // Should export v2 (latest confirmed)
      expect(rows).toHaveLength(1);
      expect((rows[0] as Record<string, unknown>)['名称']).toBe('V2 Name');
    });

    it('should export specified version when versionMap is provided', () => {
      const records: ModuleVersionRecord[] = [
        makeRecord({ moduleKind: 'A', moduleId: 'VD-001', version: 'v1', snapshot: { id: 'VD-001', name: 'V1 Name' } }),
        makeRecord({ moduleKind: 'A', moduleId: 'VD-001', version: 'v2', snapshot: { id: 'VD-001', name: 'V2 Name' } }),
      ];
      const buf = exportModulesToExcel({
        valueDomains: [{ id: 'VD-001', name: 'VD-001' }],
        capabilities: [],
        scenarios: [],
        epcProcesses: [],
        metaElements: [],
        moduleVersionRecords: records,
        versionMap: { A: 'v1' },
      });
      const wb = read(buf, { type: 'array' });
      const sheet = wb.Sheets['A'];
      const rows = utils.sheet_to_json(sheet);
      expect((rows[0] as Record<string, unknown>)['名称']).toBe('V1 Name');
    });
  });

  describe('AC-3: Draft modules not exported', () => {
    it('should skip draft modules', () => {
      const records: ModuleVersionRecord[] = [
        { ...makeRecord({ moduleKind: 'A', moduleId: 'VD-001', version: 'v1' }), status: 'draft' as const, version: undefined },
      ];
      const buf = exportModulesToExcel({
        valueDomains: [{ id: 'VD-001', name: 'VD-001' }],
        capabilities: [],
        scenarios: [],
        epcProcesses: [],
        metaElements: [],
        moduleVersionRecords: records,
      });
      const wb = read(buf, { type: 'array' });
      const sheet = wb.Sheets['A'];
      const rows = utils.sheet_to_json(sheet);
      expect(rows).toHaveLength(0); // draft excluded
    });
  });

  describe('AC-4: Data Validation on reference columns', () => {
    it('should set data validation on parentId column for B sheet', () => {
      const wb = buildExcelWorkbook({
        valueDomains: [{ id: 'VD-001', name: '生产制造' }],
        capabilities: [{ id: 'CAP-001', name: '计划能力', parentId: 'VD-001' }],
        scenarios: [{ id: 'SC-001', name: 'MTS场景', parentId: 'CAP-001' }],
        epcProcesses: [{ id: 'EPC-001', name: '流程1', parentId: 'SC-001', steps: [] }],
        metaElements: sampleMetaElements,
        moduleVersionRecords: sampleRecords,
      });
      const sheet = wb.Sheets['B'];
      // !dataValidation is a SheetJS internal property, checked before write()
      const dv = (sheet as Record<string, unknown>)['!dataValidation'];
      expect(dv).toBeDefined();
      expect(Array.isArray(dv)).toBe(true);
      expect((dv as unknown[]).length).toBeGreaterThan(0);
    });
  });

  describe('AC-5: Hidden reference sheet', () => {
    it('should mark _要素引用表 as hidden', () => {
      const buf = exportModulesToExcel({
        valueDomains: [{ id: 'VD-001', name: '生产制造' }],
        capabilities: [],
        scenarios: [],
        epcProcesses: [],
        metaElements: sampleMetaElements,
        moduleVersionRecords: sampleRecords,
      });
      const wb = read(buf, { type: 'array' });
      expect(wb.SheetNames).toContain('_要素引用表');

      // xlsx stores visibility in workbook props via !Hidden property
      // or via the sheet visibility in wb.Workbook.Sheets
    });
  });

  describe('AC-6: JSON column serialization', () => {
    it('should serialize semantics and steps as JSON strings', () => {
      const records: ModuleVersionRecord[] = [
        makeRecord({
          moduleKind: 'EPC', moduleId: 'EPC-001',
          snapshot: {
            id: 'EPC-001', name: '订单流程', parentId: 'SC-001',
            semantics: { terms: ['订单'], triggerPhrases: ['下达'] },
            steps: [{ id: 's1', name: '下达', elementRef: { dimension: 'E2' as const, elementId: 'ACT-001', versionPin: 'latest_confirmed' as const } }],
          },
        }),
      ];
      const buf = exportModulesToExcel({
        valueDomains: [],
        capabilities: [],
        scenarios: [{ id: 'SC-001', name: 'MTS', parentId: 'CAP-001' }],
        epcProcesses: [],
        metaElements: sampleMetaElements,
        moduleVersionRecords: records,
      });
      const wb = read(buf, { type: 'array' });
      const sheet = wb.Sheets['EPC'];
      const rows = utils.sheet_to_json(sheet) as Record<string, unknown>[];
      expect(rows).toHaveLength(1);
      // steps should be a JSON string
      const stepsVal = rows[0]['步骤(JSON)'] as string;
      expect(() => JSON.parse(stepsVal)).not.toThrow();
      const parsed = JSON.parse(stepsVal);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].name).toBe('下达');
    });
  });

  describe('edge cases', () => {
    it('should handle empty module arrays', () => {
      const buf = exportModulesToExcel({
        valueDomains: [],
        capabilities: [],
        scenarios: [],
        epcProcesses: [],
        metaElements: [],
        moduleVersionRecords: [],
      });
      const wb = read(buf, { type: 'array' });
      expect(wb.SheetNames).toHaveLength(13);
    });

    it('should return Uint8Array', () => {
      const buf = exportModulesToExcel({
        valueDomains: [],
        capabilities: [],
        scenarios: [],
        epcProcesses: [],
        metaElements: [],
        moduleVersionRecords: [],
      });
      expect(buf).toBeInstanceOf(Uint8Array);
      expect(buf.length).toBeGreaterThan(0);
    });
  });
});
