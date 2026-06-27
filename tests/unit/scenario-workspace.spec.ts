import { describe, it, expect } from 'vitest';
import {
  getChildEpcProcesses,
  buildScenarioReferenceUnion,
} from '@/lib/scenario-workspace';
import type { EpcProcess, EpcStep, MetaElement } from '@/types/ontology';

function step(id: string, name: string, overrides: Partial<EpcStep> = {}): EpcStep {
  return { id, name, ...overrides };
}

function epc(id: string, parentId: string, steps: EpcStep[], overrides: Partial<EpcProcess> = {}): EpcProcess {
  return { id, name: `EPC-${id}`, parentId, steps, ...overrides };
}

function meta(id: string, name: string, dimension: MetaElement['dimension']): MetaElement {
  return { id, name, dimension } as MetaElement;
}

// ============================================================
// getChildEpcProcesses
// ============================================================

describe('getChildEpcProcesses', () => {
  // TC-1
  it('should return empty array for empty epcProcesses', () => {
    expect(getChildEpcProcesses('scenario-1', undefined)).toEqual([]);
    expect(getChildEpcProcesses('scenario-1', [])).toEqual([]);
  });

  // TC-2
  it('should filter EPCs by parentId', () => {
    const epcs: EpcProcess[] = [
      epc('epc-1', 'scenario-1', []),
      epc('epc-2', 'scenario-1', []),
      epc('epc-3', 'scenario-2', []),
    ];
    const result = getChildEpcProcesses('scenario-1', epcs);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['epc-1', 'epc-2']);
  });

  // TC-3
  it('should return empty array when no EPC matches the parentId', () => {
    const epcs: EpcProcess[] = [
      epc('epc-1', 'scenario-a', []),
    ];
    const result = getChildEpcProcesses('scenario-b', epcs);
    expect(result).toEqual([]);
  });
});

// ============================================================
// buildScenarioReferenceUnion
// ============================================================

describe('buildScenarioReferenceUnion', () => {
  // TC-4
  it('should return empty array when scenario has no child EPCs', () => {
    const result = buildScenarioReferenceUnion('scenario-1', [], []);
    expect(result).toEqual([]);
  });

  // TC-5
  it('should collect element references from child EPC steps', () => {
    const epcs: EpcProcess[] = [
      epc('epc-1', 'scenario-1', [
        step('s-1', '查看合同', {
          elementRef: { dimension: 'E1', elementId: 'el-1', versionPin: 'latest_confirmed' },
        }),
        step('s-2', '审批合同', {
          elementRef: { dimension: 'E2', elementId: 'el-2', versionPin: 'latest_confirmed' },
        }),
      ]),
    ];
    const metaElements: MetaElement[] = [
      meta('el-1', '合同数据', 'E1'),
      meta('el-2', '审批行为', 'E2'),
    ];
    const result = buildScenarioReferenceUnion('scenario-1', epcs, metaElements);
    expect(result).toHaveLength(2);

    const ref1 = result.find((r) => r.elementId === 'el-1');
    expect(ref1).toBeDefined();
    expect(ref1!.dimension).toBe('E1');
    expect(ref1!.elementName).toBe('合同数据');
    expect(ref1!.sources).toHaveLength(1);

    const ref2 = result.find((r) => r.elementId === 'el-2');
    expect(ref2).toBeDefined();
    expect(ref2!.dimension).toBe('E2');
    expect(ref2!.elementName).toBe('审批行为');
  });

  // TC-6
  it('should aggregate sources when same element is referenced in multiple steps', () => {
    const epcs: EpcProcess[] = [
      epc('epc-1', 'scenario-1', [
        step('s-1', '第一步', {
          elementRef: { dimension: 'E3', elementId: 'evt-1', versionPin: 'latest_confirmed' },
        }),
        step('s-2', '第二步', {
          elementRef: { dimension: 'E3', elementId: 'evt-1', versionPin: 'latest_confirmed' },
        }),
      ]),
    ];
    const result = buildScenarioReferenceUnion('scenario-1', epcs, [meta('evt-1', '事件', 'E3')]);
    expect(result).toHaveLength(1);
    expect(result[0].sources).toHaveLength(2);
    expect(result[0].sources[0].stepId).toBe('s-1');
    expect(result[0].sources[1].stepId).toBe('s-2');
  });

  // TC-7
  it('should skip steps without elementRef', () => {
    const epcs: EpcProcess[] = [
      epc('epc-1', 'scenario-1', [
        step('s-1', '无引用的步骤'),
        step('s-2', '有引用的步骤', {
          elementRef: { dimension: 'E2', elementId: 'act-1', versionPin: 'latest_confirmed' },
        }),
      ]),
    ];
    const result = buildScenarioReferenceUnion('scenario-1', epcs, [meta('act-1', '动作', 'E2')]);
    expect(result).toHaveLength(1);
    expect(result[0].elementId).toBe('act-1');
  });

  // TC-8
  it('should skip steps with empty elementId', () => {
    const epcs: EpcProcess[] = [
      epc('epc-1', 'scenario-1', [
        step('s-1', '空引用', {
          elementRef: { dimension: 'E2', elementId: '  ', versionPin: 'latest_confirmed' },
        }),
      ]),
    ];
    const result = buildScenarioReferenceUnion('scenario-1', epcs, []);
    expect(result).toEqual([]);
  });

  // TC-9
  it('should resolve unknown element names as fallback text', () => {
    const epcs: EpcProcess[] = [
      epc('epc-1', 'scenario-1', [
        step('s-1', '测试', {
          elementRef: { dimension: 'E1', elementId: 'missing-el', versionPin: 'latest_confirmed' },
        }),
      ]),
    ];
    const result = buildScenarioReferenceUnion('scenario-1', epcs, []);
    expect(result).toHaveLength(1);
    expect(result[0].elementName).toBe('(未知要素)');
  });

  // TC-10
  it('should sort results by element name (localeCompare zh-CN)', () => {
    const epcs: EpcProcess[] = [
      epc('epc-1', 'scenario-1', [
        step('s-1', '步骤', {
          elementRef: { dimension: 'E2', elementId: 'b-el', versionPin: 'latest_confirmed' },
        }),
        step('s-2', '步骤', {
          elementRef: { dimension: 'E1', elementId: 'a-el', versionPin: 'latest_confirmed' },
        }),
      ]),
    ];
    const metaElements: MetaElement[] = [
      meta('a-el', 'A要素', 'E1'),
      meta('b-el', 'B要素', 'E2'),
    ];
    const result = buildScenarioReferenceUnion('scenario-1', epcs, metaElements);
    expect(result).toHaveLength(2);
    expect(result[0].elementId).toBe('a-el');
    expect(result[1].elementId).toBe('b-el');
  });
});
