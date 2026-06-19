import { describe, it, expect } from 'vitest';
import { computeCoverage, emptyCoverageReport } from '@/lib/epc-coverage';
import type {
  EpcProcess,
  MetaDimension,
  MetaElement,
  ModuleVersionRecord,
  Scenario,
} from '@/types/ontology';

const now = '2026-06-18T12:00:00.000Z';

function cr(
  kind: ModuleVersionRecord['moduleKind'],
  moduleId: string,
  snapshot: unknown,
  version = 'v1',
): ModuleVersionRecord {
  return {
    id: `rec-${kind}-${moduleId}`,
    moduleKind: kind,
    moduleId,
    status: 'confirmed',
    version,
    confirmedAt: now,
    createdAt: now,
    snapshot,
  };
}

function usageRef(epcId: string, stepId: string, scenarioId = 'c1'): NonNullable<MetaElement['usageRefs']>[number] {
  return { epcId, stepId, scenarioId, versionPin: 'latest_confirmed' };
}

function meta(
  id: string,
  name: string,
  dimension: MetaDimension,
  usageRefs: MetaElement['usageRefs'] = [],
): MetaElement {
  return { id, name, dimension, usageRefs };
}

function epc(id: string, name: string, parentId: string, steps: EpcProcess['steps'] = []): EpcProcess {
  return { id, name, parentId, steps };
}

function step(id: string, name: string, dimension: MetaDimension, elementId: string): EpcProcess['steps'][number] {
  return { id, name, elementRef: { dimension, elementId, versionPin: 'latest_confirmed' } };
}

describe('epc-coverage (US-S16)', () => {
  describe('emptyCoverageReport', () => {
    it('should return all-zero report', () => {
      const r = emptyCoverageReport('c1');
      expect(r.scenarioId).toBe('c1');
      expect(r.totalElements).toBe(0);
      expect(r.coveredElements).toBe(0);
      expect(r.coveragePercent).toBe(0);
      expect(Object.keys(r.byDimension)).toHaveLength(0);
    });
  });

  describe('computeCoverage', () => {
    // TC01: empty project
    it('TC01: empty project returns all-zero', () => {
      const r = computeCoverage({
        scenarioId: 'c1',
        scenarios: [{ id: 'c1', name: '场景', parentId: 'b1' }],
        epcProcesses: [],
        metaElements: [],
        moduleVersionRecords: [cr('C', 'c1', { id: 'c1' })],
      });
      expect(r.totalElements).toBe(0);
      expect(r.coveredElements).toBe(0);
      expect(r.coveragePercent).toBe(0);
    });

    // TC02: C not confirmed
    it('TC02: C not confirmed returns all-zero', () => {
      const r = computeCoverage({
        scenarioId: 'c1',
        scenarios: [{ id: 'c1', name: '场景', parentId: 'b1' }],
        epcProcesses: [],
        metaElements: [meta('e1', '数据', 'E1')],
        moduleVersionRecords: [], // no confirmed C
      });
      expect(r.totalElements).toBe(0);
    });

    // TC03: no EPC → all uncovered
    it('TC03: confirmed C without EPC → all uncovered', () => {
      const r = computeCoverage({
        scenarioId: 'c1',
        scenarios: [{ id: 'c1', name: '场景', parentId: 'b1' }],
        epcProcesses: [],
        metaElements: [meta('e1', '数据', 'E1'), meta('e2', '行为', 'E2')],
        moduleVersionRecords: [cr('C', 'c1', { id: 'c1' })],
      });
      // totalElements still counted
      expect(r.totalElements).toBe(2);
      expect(r.coveredElements).toBe(0);
      expect(r.coveragePercent).toBe(0);
      expect(r.byDimension['E1']?.totalElements).toBe(1);
      expect(r.byDimension['E1']?.coveredElements).toBe(0);
    });

    // TC04: EPC not confirmed → refs not counted
    it('TC04: unconfirmed EPC refs not counted', () => {
      const theEpc = epc('epc1', '流程', 'c1', [step('s1', '步', 'E1', 'e1')]);
      const r = computeCoverage({
        scenarioId: 'c1',
        scenarios: [{ id: 'c1', name: '场景', parentId: 'b1' }],
        epcProcesses: [theEpc],
        metaElements: [meta('e1', '数据', 'E1', [usageRef('epc1', 's1')])],
        moduleVersionRecords: [cr('C', 'c1', { id: 'c1' })], // EPC NOT confirmed
      });
      expect(r.totalElements).toBe(1);
      expect(r.coveredElements).toBe(0);
      expect(r.byDimension['E1']?.coveragePercent).toBe(0);
    });

    // TC05: full coverage
    it('TC05: full coverage → 100%', () => {
      const theEpc = epc('epc1', '流程', 'c1', [
        step('s1', '步1', 'E1', 'e1'),
        step('s2', '步2', 'E1', 'e2'),
      ]);
      const r = computeCoverage({
        scenarioId: 'c1',
        scenarios: [{ id: 'c1', name: '场景', parentId: 'b1' }],
        epcProcesses: [theEpc],
        metaElements: [
          meta('e1', '数据1', 'E1', [usageRef('epc1', 's1')]),
          meta('e2', '数据2', 'E1', [usageRef('epc1', 's2')]),
        ],
        moduleVersionRecords: [cr('C', 'c1', { id: 'c1' }), cr('EPC', 'epc1', theEpc)],
      });
      expect(r.totalElements).toBe(2);
      expect(r.coveredElements).toBe(2);
      expect(r.coveragePercent).toBe(100);
      expect(r.byDimension['E1']?.coveragePercent).toBe(100);
      expect(r.byDimension['E1']?.uncovered).toHaveLength(0);
    });

    // TC06: partial coverage — 4 E1 elements, 2 covered → 50%
    it('TC06: partial coverage → 50%', () => {
      const theEpc = epc('epc1', '流程', 'c1', [
        step('s1', '步1', 'E1', 'e1'),
        step('s2', '步2', 'E1', 'e2'),
      ]);
      const r = computeCoverage({
        scenarioId: 'c1',
        scenarios: [{ id: 'c1', name: '场景', parentId: 'b1' }],
        epcProcesses: [theEpc],
        metaElements: [
          meta('e1', '被引用1', 'E1', [usageRef('epc1', 's1')]),
          meta('e2', '被引用2', 'E1', [usageRef('epc1', 's2')]),
          meta('e3', '未覆盖1', 'E1', []),
          meta('e4', '未覆盖2', 'E1', []),
        ],
        moduleVersionRecords: [cr('C', 'c1', { id: 'c1' }), cr('EPC', 'epc1', theEpc)],
      });
      expect(r.totalElements).toBe(4);
      expect(r.coveredElements).toBe(2);
      expect(r.coveragePercent).toBe(50);
      const e1 = r.byDimension['E1']!;
      expect(e1.totalElements).toBe(4);
      expect(e1.coveredElements).toBe(2);
      expect(e1.coveragePercent).toBe(50);
      expect(e1.uncovered).toEqual([
        { elementId: 'e3', elementName: '未覆盖1' },
        { elementId: 'e4', elementName: '未覆盖2' },
      ]);
    });

    // TC07: cross-dimension — E1 50% / E2 100% / E3 0% / E4 100%
    it('TC07: cross-dimension mixed coverage', () => {
      const theEpc = epc('epc1', '流程', 'c1', [
        step('s1', '步1', 'E1', 'e1'),
        step('s2', '步2', 'E1', 'e2'),
        step('s3', '步3', 'E2', 'e5'),
        step('s4', '步4', 'E2', 'e6'),
        step('s5', '步5', 'E4', 'e10'),
      ]);
      const r = computeCoverage({
        scenarioId: 'c1',
        scenarios: [{ id: 'c1', name: '场景', parentId: 'b1' }],
        epcProcesses: [theEpc],
        metaElements: [
          meta('e1', 'E1-A', 'E1', [usageRef('epc1', 's1')]),
          meta('e2', 'E1-B', 'E1', [usageRef('epc1', 's2')]),
          meta('e3', 'E1-C', 'E1', []),
          meta('e4', 'E1-D', 'E1', []),
          meta('e5', 'E2-A', 'E2', [usageRef('epc1', 's3')]),
          meta('e6', 'E2-B', 'E2', [usageRef('epc1', 's4')]),
          meta('e7', 'E3-A', 'E3', []),
          meta('e8', 'E3-B', 'E3', []),
          meta('e9', 'E3-C', 'E3', []),
          meta('e10', 'E4-A', 'E4', [usageRef('epc1', 's5')]),
        ],
        moduleVersionRecords: [cr('C', 'c1', { id: 'c1' }), cr('EPC', 'epc1', theEpc)],
      });
      expect(r.totalElements).toBe(10);
      expect(r.coveredElements).toBe(5);
      expect(r.coveragePercent).toBe(50);
      expect(r.byDimension['E1']?.coveragePercent).toBe(50);
      expect(r.byDimension['E2']?.coveragePercent).toBe(100);
      expect(r.byDimension['E3']?.coveragePercent).toBe(0);
      expect(r.byDimension['E4']?.coveragePercent).toBe(100);
      expect(r.byDimension['E5']).toBeUndefined();
    });

    // TC08: isolation between scenarios
    it('TC08: scenario isolation — only target subtree counted', () => {
      const epc1 = epc('epc1', 'C1流程', 'c1', [step('s1', '步', 'E1', 'e1')]);
      const epc2 = epc('epc2', 'C2流程', 'c2', [step('s2', '步', 'E1', 'e2')]);
      const r = computeCoverage({
        scenarioId: 'c1',
        scenarios: [
          { id: 'c1', name: '场景1', parentId: 'b1' },
          { id: 'c2', name: '场景2', parentId: 'b1' },
        ],
        epcProcesses: [epc1, epc2],
        metaElements: [
          meta('e1', 'C1的数据', 'E1', [usageRef('epc1', 's1', 'c1')]),
          meta('e2', 'C2的数据', 'E1', [usageRef('epc2', 's2', 'c2')]),
        ],
        moduleVersionRecords: [
          cr('C', 'c1', { id: 'c1' }),
          cr('C', 'c2', { id: 'c2' }),
          cr('EPC', 'epc1', epc1),
          cr('EPC', 'epc2', epc2),
        ],
      });
      expect(r.totalElements).toBe(2);
      // Only e1 is covered by c1's confirmed EPC
      expect(r.coveredElements).toBe(1);
      expect(r.coveragePercent).toBe(50);
      const e1Cov = r.byDimension['E1']!;
      expect(e1Cov.coveredElements).toBe(1);
      expect(e1Cov.uncovered.map((u) => u.elementId)).toEqual(['e2']);
    });

    // Bonus: unknown scenarioId
    it('should return empty report for unknown scenarioId', () => {
      const r = computeCoverage({
        scenarioId: 'nonexistent',
        scenarios: [],
        epcProcesses: [],
        metaElements: [],
        moduleVersionRecords: [],
      });
      expect(r.scenarioId).toBe('nonexistent');
      expect(r.totalElements).toBe(0);
    });
  });
});
