import { describe, it, expect } from 'vitest';
import type {
  EpcProcess,
  MetaElement,
  ModuleVersionRecord,
  Scenario,
} from '@/types/ontology';
import { lintBusinessEpc, EPC_WARNING_RULES } from '@/lib/business-epc-linter';

const now = '2026-06-18T12:00:00.000Z';

function confirmedRecord(
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

describe('business-epc-linter (US-S09-U01)', () => {
  it('should expose five warning rules', () => {
    expect(EPC_WARNING_RULES).toHaveLength(5);
  });

  it('W-EPC-04: confirmed scenario without EPC child', () => {
    const scenarios: Scenario[] = [{ id: 'c1', name: '空场景', parentId: 'b1' }];
    const records = [confirmedRecord('C', 'c1', scenarios[0])];
    const warnings = lintBusinessEpc({
      moduleVersionRecords: records,
      scenarios,
      epcProcesses: [],
      metaElements: [],
    });
    expect(warnings.some((w) => w.ruleId === 'W-EPC-04')).toBe(true);
  });

  it('W-EPC-05: confirmed EPC references missing element', () => {
    const epc: EpcProcess = {
      id: 'epc1',
      name: '流程',
      parentId: 'c1',
      steps: [{
        id: 's1',
        name: '步',
        elementRef: { dimension: 'E1', elementId: 'missing', versionPin: 'latest_confirmed' },
      }],
    };
    const records = [confirmedRecord('EPC', 'epc1', epc)];
    const warnings = lintBusinessEpc({
      moduleVersionRecords: records,
      epcProcesses: [epc],
      metaElements: [],
    });
    expect(warnings.find((w) => w.ruleId === 'W-EPC-05')?.elementId).toBe('missing');
  });

  it('W-EPC-02: confirmed element with empty usageRefs', () => {
    const el: MetaElement = { id: 'el-1', name: '孤儿', dimension: 'E1', usageRefs: [] };
    const records = [confirmedRecord('E1', 'el-1', el)];
    const warnings = lintBusinessEpc({
      moduleVersionRecords: records,
      metaElements: [el],
    });
    expect(warnings.some((w) => w.ruleId === 'W-EPC-02' && w.elementId === 'el-1')).toBe(true);
  });

  it('W-EPC-03: confirmed EPC references draft-only element', () => {
    const el: MetaElement = { id: 'el-d', name: '草稿要素', dimension: 'E2' };
    const epc: EpcProcess = {
      id: 'epc1',
      name: '流程',
      parentId: 'c1',
      steps: [{
        id: 's1',
        name: '步',
        elementRef: { dimension: 'E2', elementId: 'el-d', versionPin: 'latest_confirmed' },
      }],
    };
    const records: ModuleVersionRecord[] = [
      confirmedRecord('EPC', 'epc1', epc),
      {
        id: 'draft-el',
        moduleKind: 'E2',
        moduleId: 'el-d',
        status: 'draft',
        createdAt: now,
        snapshot: el,
      },
    ];
    const warnings = lintBusinessEpc({
      moduleVersionRecords: records,
      epcProcesses: [epc],
      metaElements: [el],
    });
    expect(warnings.some((w) => w.ruleId === 'W-EPC-03')).toBe(true);
  });

  it('W-EPC-01: confirmed EPC references unconfirmed element', () => {
    const el: MetaElement = { id: 'el-u', name: '未确认', dimension: 'E1' };
    const epc: EpcProcess = {
      id: 'epc1',
      name: '流程',
      parentId: 'c1',
      steps: [{
        id: 's1',
        name: '步',
        elementRef: { dimension: 'E1', elementId: 'el-u', versionPin: 'latest_confirmed' },
      }],
    };
    const records = [confirmedRecord('EPC', 'epc1', epc)];
    const warnings = lintBusinessEpc({
      moduleVersionRecords: records,
      epcProcesses: [epc],
      metaElements: [el],
    });
    expect(warnings.some((w) => w.ruleId === 'W-EPC-01')).toBe(true);
  });

  it('should skip draft-only modules for W-EPC-04/02 scope', () => {
    const scenarios: Scenario[] = [{ id: 'c1', name: '草稿场景', parentId: 'b1' }];
    const records: ModuleVersionRecord[] = [{
      id: 'd1',
      moduleKind: 'C',
      moduleId: 'c1',
      status: 'draft',
      createdAt: now,
      snapshot: scenarios[0],
    }];
    const warnings = lintBusinessEpc({
      moduleVersionRecords: records,
      scenarios,
      epcProcesses: [],
    });
    expect(warnings.filter((w) => w.ruleId === 'W-EPC-04')).toHaveLength(0);
  });
});
