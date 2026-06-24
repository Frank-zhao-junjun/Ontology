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
  it('should expose seventeen warning rules', () => {
    expect(EPC_WARNING_RULES).toHaveLength(17);
  });

  it('should include W-EPC-06 in warning rules', () => {
    expect(EPC_WARNING_RULES).toContain('W-EPC-06');
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

  // ==================== US-S15-U02: W-EPC-06/07/08 ====================

  describe('W-EPC-06: name consistency', () => {
    it('should warn when elementName differs from meta.name', () => {
      const el: MetaElement = { id: 'e1', name: '最新名', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{
          id: 's1', name: '步',
          elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed', elementName: '旧名' },
        }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-06' && w.elementId === 'e1')).toBe(true);
    });

    it('should NOT warn when elementName matches meta.name', () => {
      const el: MetaElement = { id: 'e1', name: '同名', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{
          id: 's1', name: '步',
          elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed', elementName: '同名' },
        }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-06')).toBe(false);
    });

    it('should NOT warn when elementName is absent', () => {
      const el: MetaElement = { id: 'e1', name: '要素', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{
          id: 's1', name: '步',
          elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' },
        }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-06')).toBe(false);
    });
  });

  describe('W-EPC-07: dimension consistency', () => {
    it('should warn when step dimension differs from meta dimension', () => {
      const el: MetaElement = { id: 'e1', name: '要素', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{
          id: 's1', name: '步',
          elementRef: { dimension: 'E2', elementId: 'e1', versionPin: 'latest_confirmed' },
        }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-07' && w.elementId === 'e1')).toBe(true);
    });

    it('should NOT warn when step dimension matches meta dimension', () => {
      const el: MetaElement = { id: 'e1', name: '要素', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{
          id: 's1', name: '步',
          elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' },
        }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-07')).toBe(false);
    });
  });

  describe('W-EPC-08: behavior density', () => {
    it('should warn when confirmed EPC has no E2 step', () => {
      const epc: EpcProcess = {
        id: 'epc1', name: '无行为流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '步1', elementRef: { dimension: 'E1', elementId: 'd1', versionPin: 'latest_confirmed' } },
          { id: 's2', name: '步2', elementRef: { dimension: 'E3', elementId: 'ev1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-08' && w.epcId === 'epc1')).toBe(true);
    });

    it('should NOT warn when confirmed EPC has at least one E2 step', () => {
      const epc: EpcProcess = {
        id: 'epc1', name: '有行为流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '步1', elementRef: { dimension: 'E1', elementId: 'd1', versionPin: 'latest_confirmed' } },
          { id: 's2', name: '行为步', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-08')).toBe(false);
    });
  });

  // ==================== US-S15-U03: W-EPC-09/10/11 ====================

  describe('W-EPC-09: E1 data binding', () => {
    it('should warn when E1 step references element without entityId', () => {
      const el: MetaElement = { id: 'e1', name: '无绑定数据', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-09' && w.elementId === 'e1')).toBe(true);
    });

    it('should NOT warn when E1 step references element with entityId', () => {
      const el: MetaElement = { id: 'e1', name: '有绑定数据', dimension: 'E1', entityId: 'ent-1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-09')).toBe(false);
    });

    it('should NOT warn for non-E1 steps', () => {
      const el: MetaElement = { id: 'e2', name: '行为要素', dimension: 'E2' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E2', elementId: 'e2', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E2', 'e2', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-09')).toBe(false);
    });
  });

  describe('W-EPC-10: entity binding', () => {
    it('should warn when non-E1 step references element without entityId', () => {
      const el: MetaElement = { id: 'e2', name: '无实体绑定', dimension: 'E2' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E2', elementId: 'e2', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E2', 'e2', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-10' && w.elementId === 'e2')).toBe(true);
    });

    it('should NOT warn when non-E1 step references element with entityId', () => {
      const el: MetaElement = { id: 'e2', name: '有实体绑定', dimension: 'E2', entityId: 'ent-2' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E2', elementId: 'e2', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E2', 'e2', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-10')).toBe(false);
    });

    it('should NOT trigger W-EPC-10 for E1 steps (covered by W-EPC-09)', () => {
      const el: MetaElement = { id: 'e1', name: '数据要素', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-10')).toBe(false);
    });
  });

  describe('W-EPC-11: role/policy binding', () => {
    it('should warn when E5 step references element without hasPolicy', () => {
      const el: MetaElement = { id: 'e5', name: '无策略角色', dimension: 'E5' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E5', elementId: 'e5', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E5', 'e5', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-11' && w.elementId === 'e5')).toBe(true);
    });

    it('should NOT warn when E5 step references element with hasPolicy', () => {
      const el: MetaElement = { id: 'e5', name: '有策略角色', dimension: 'E5', hasPolicy: true };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E5', elementId: 'e5', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E5', 'e5', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-11')).toBe(false);
    });

    it('should NOT warn for non-E5 steps', () => {
      const el: MetaElement = { id: 'e1', name: '数据要素', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-11')).toBe(false);
    });
  });

  // ==================== US-S15-U04: W-EPC-12/13/14 ====================

  describe('W-EPC-12: event start/end', () => {
    it('should warn when EPC has no E3 step at first or last position', () => {
      const epc: EpcProcess = {
        id: 'epc1', name: '无事件流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '步1', elementRef: { dimension: 'E1', elementId: 'd1', versionPin: 'latest_confirmed' } },
          { id: 's2', name: '步2', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-12' && w.epcId === 'epc1')).toBe(true);
    });

    it('should NOT warn when first step is E3', () => {
      const epc: EpcProcess = {
        id: 'epc1', name: '事件起流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '起始事件', elementRef: { dimension: 'E3', elementId: 'ev1', versionPin: 'latest_confirmed' } },
          { id: 's2', name: '步2', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-12')).toBe(false);
    });

    it('should NOT warn when last step is E3', () => {
      const epc: EpcProcess = {
        id: 'epc1', name: '事件止流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '步1', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
          { id: 's2', name: '结束事件', elementRef: { dimension: 'E3', elementId: 'ev1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-12')).toBe(false);
    });
  });

  describe('W-EPC-13: E2 state machine binding', () => {
    it('should warn when E2 step references element without stateMachineId', () => {
      const el: MetaElement = { id: 'e2', name: '无状态机行为', dimension: 'E2' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E2', elementId: 'e2', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E2', 'e2', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-13' && w.elementId === 'e2')).toBe(true);
    });

    it('should NOT warn when E2 step references element with stateMachineId', () => {
      const el: MetaElement = { id: 'e2', name: '有状态机行为', dimension: 'E2', stateMachineId: 'sm-1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E2', elementId: 'e2', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E2', 'e2', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-13')).toBe(false);
    });

    it('should NOT warn for non-E2 steps', () => {
      const el: MetaElement = { id: 'e1', name: '数据要素', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-13')).toBe(false);
    });
  });

  describe('W-EPC-14: E3 event binding', () => {
    it('should warn when E3 step references element without eventId', () => {
      const el: MetaElement = { id: 'e3', name: '无绑定事件', dimension: 'E3' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E3', elementId: 'e3', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E3', 'e3', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-14' && w.elementId === 'e3')).toBe(true);
    });

    it('should NOT warn when E3 step references element with eventId', () => {
      const el: MetaElement = { id: 'e3', name: '有绑定事件', dimension: 'E3', eventId: 'ev-1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E3', elementId: 'e3', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E3', 'e3', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-14')).toBe(false);
    });

    it('should NOT warn for non-E3 steps', () => {
      const el: MetaElement = { id: 'e1', name: '数据要素', dimension: 'E1' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E1', 'e1', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-14')).toBe(false);
    });
  });

  // ==================== US-S15-U05: W-EPC-15/16/17 ====================

  describe('W-EPC-15: E7 constraint type', () => {
    it('should warn when E7 step references element without constraintType', () => {
      const el: MetaElement = { id: 'e7', name: '无类型约束', dimension: 'E7' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E7', elementId: 'e7', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E7', 'e7', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-15' && w.elementId === 'e7')).toBe(true);
    });

    it('should NOT warn when E7 step references element with constraintType', () => {
      const el: MetaElement = { id: 'e7', name: '守卫约束', dimension: 'E7', constraintType: 'guard' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E7', elementId: 'e7', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E7', 'e7', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-15')).toBe(false);
    });

    it('should NOT warn for non-E7 steps', () => {
      const el: MetaElement = { id: 'e2', name: '行为要素', dimension: 'E2' };
      const epc: EpcProcess = {
        id: 'epc1', name: '流程', parentId: 'c1',
        steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E2', elementId: 'e2', versionPin: 'latest_confirmed' } }],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E2', 'e2', el)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-15')).toBe(false);
    });
  });

  describe('W-EPC-16: transition-event pairing', () => {
    it('should warn when EPC has E2 steps but no E3 steps', () => {
      const epc: EpcProcess = {
        id: 'epc1', name: '无事件流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '行为步', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-16' && w.epcId === 'epc1')).toBe(true);
    });

    it('should NOT warn when EPC has both E2 and E3 steps', () => {
      const epc: EpcProcess = {
        id: 'epc1', name: '完整流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '事件步', elementRef: { dimension: 'E3', elementId: 'ev1', versionPin: 'latest_confirmed' } },
          { id: 's2', name: '行为步', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-16')).toBe(false);
    });

    it('should NOT warn when EPC has no E2 steps', () => {
      const epc: EpcProcess = {
        id: 'epc1', name: '仅事件流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '事件步', elementRef: { dimension: 'E3', elementId: 'ev1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-16')).toBe(false);
    });
  });

  describe('W-EPC-17: guard-action binding', () => {
    it('should warn when EPC has E7 guard steps but no E2 step with stateMachineId', () => {
      const el2: MetaElement = { id: 'b1', name: '无状态机行为', dimension: 'E2' };
      const el7: MetaElement = { id: 'g1', name: '守卫', dimension: 'E7', constraintType: 'guard' };
      const epc: EpcProcess = {
        id: 'epc1', name: '无绑定流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '守卫步', elementRef: { dimension: 'E7', elementId: 'g1', versionPin: 'latest_confirmed' } },
          { id: 's2', name: '行为步', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E7', 'g1', el7), confirmedRecord('E2', 'b1', el2)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el2, el7] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-17' && w.epcId === 'epc1')).toBe(true);
    });

    it('should NOT warn when EPC has E7 guard + E2 with stateMachineId', () => {
      const el2: MetaElement = { id: 'b1', name: '有状态机行为', dimension: 'E2', stateMachineId: 'sm-1' };
      const el7: MetaElement = { id: 'g1', name: '守卫', dimension: 'E7', constraintType: 'guard' };
      const epc: EpcProcess = {
        id: 'epc1', name: '完整流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '守卫步', elementRef: { dimension: 'E7', elementId: 'g1', versionPin: 'latest_confirmed' } },
          { id: 's2', name: '行为步', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E7', 'g1', el7), confirmedRecord('E2', 'b1', el2)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el2, el7] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-17')).toBe(false);
    });

    it('should NOT warn when EPC has no E7 guard steps', () => {
      const el2: MetaElement = { id: 'b1', name: '行为', dimension: 'E2' };
      const epc: EpcProcess = {
        id: 'epc1', name: '无守卫流程', parentId: 'c1',
        steps: [
          { id: 's1', name: '行为步', elementRef: { dimension: 'E2', elementId: 'b1', versionPin: 'latest_confirmed' } },
        ],
      };
      const records = [confirmedRecord('EPC', 'epc1', epc), confirmedRecord('E2', 'b1', el2)];
      const warnings = lintBusinessEpc({ moduleVersionRecords: records, epcProcesses: [epc], metaElements: [el2] });
      expect(warnings.some((w) => w.ruleId === 'W-EPC-17')).toBe(false);
    });
  });
});

