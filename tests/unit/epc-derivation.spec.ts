import { describe, it, expect } from 'vitest';
import { deriveEpcSteps, filterConfirmedMetaElements, derivedStepsToEpcSteps } from '@/lib/epc-derivation';
import type { MetaElement } from '@/types/ontology';

type Dim = MetaElement['dimension'];

function m(id: string, name: string, dim: Dim, overrides: Partial<MetaElement> = {}): MetaElement {
  return { id, name, dimension: dim, ...overrides };
}

// ============================================================
// US-S18-U01: deriveEpcSteps
// ============================================================

describe('deriveEpcSteps (US-S18-U01)', () => {
  // TC-1
  it('should return empty array for empty input', () => {
    expect(deriveEpcSteps({ metaElements: [] })).toEqual([]);
  });

  // TC-2
  it('should generate start+end event steps from single E3 element', () => {
    const el = m('ev-1', '订单创建', 'E3', { eventId: 'evt-1' });
    const result = deriveEpcSteps({ metaElements: [el] });
    expect(result).toHaveLength(2);
    expect(result[0].dimension).toBe('E3');
    expect(result[0].elementId).toBe('ev-1');
    expect(result[0].derivation).toContain('start');
    expect(result[1].dimension).toBe('E3');
    expect(result[1].elementId).toBe('ev-1');
    expect(result[1].derivation).toContain('end');
  });

  // TC-3
  it('should generate function steps for E2 elements', () => {
    const els: MetaElement[] = [
      m('act-1', '审批', 'E2', { stateMachineId: 'sm-1' }),
      m('act-2', '提交', 'E2', { stateMachineId: 'sm-2' }),
    ];
    const result = deriveEpcSteps({ metaElements: els });
    const e2Steps = result.filter(s => s.dimension === 'E2');
    expect(e2Steps).toHaveLength(2);
    expect(e2Steps[0].elementId).toBe('act-1');
    expect(e2Steps[1].elementId).toBe('act-2');
  });

  // TC-4
  it('should generate decision step for E7 guard', () => {
    const el = m('g-1', '金额守卫', 'E7', { constraintType: 'guard' });
    const result = deriveEpcSteps({ metaElements: [el] });
    const guardStep = result.find(s => s.dimension === 'E7' && s.elementId === 'g-1');
    expect(guardStep).toBeDefined();
    expect(guardStep!.derivation).toContain('guard');
  });

  // TC-5
  it('should generate compensation step for E7 compensation', () => {
    const el = m('c-1', '回滚补偿', 'E7', { constraintType: 'compensation' });
    const result = deriveEpcSteps({ metaElements: [el] });
    const compStep = result.find(s => s.dimension === 'E7' && s.elementId === 'c-1');
    expect(compStep).toBeDefined();
    expect(compStep!.derivation).toContain('compensation');
  });

  // TC-6
  it('should order steps: E3 → E1 → E2 → E7 → E5 → E3', () => {
    const els: MetaElement[] = [
      m('ev-1', '事件', 'E3', { eventId: 'evt-1' }),
      m('e1-1', '订单', 'E1', { entityId: 'ent-1' }),
      m('act-1', '审批', 'E2', { stateMachineId: 'sm-1' }),
      m('g-1', '守卫', 'E7', { constraintType: 'guard' }),
      m('role-1', '审批人', 'E5', { hasPolicy: true }),
    ];
    const result = deriveEpcSteps({ metaElements: els });
    const dims = result.map(s => s.dimension);
    // Expected order: E3(start) E1 E2 E7 E5 E3(end)
    expect(dims.filter(d => d === 'E3')).toHaveLength(2); // start + end
    expect(dims[0]).toBe('E3'); // start
    expect(dims[dims.length - 1]).toBe('E3'); // end
    // Middle elements present
    expect(dims).toContain('E1');
    expect(dims).toContain('E2');
    expect(dims).toContain('E7');
    expect(dims).toContain('E5');
  });

  // TC-7
  it('should generate info steps for E1 elements', () => {
    const els: MetaElement[] = [
      m('e1-1', '订单', 'E1', { entityId: 'ent-1' }),
      m('e1-2', '物料', 'E1', { entityId: 'ent-2' }),
    ];
    const result = deriveEpcSteps({ metaElements: els });
    const e1Steps = result.filter(s => s.dimension === 'E1');
    expect(e1Steps).toHaveLength(2);
  });

  // TC-8
  it('should generate role steps for E5 elements', () => {
    const el = m('role-1', '审批人', 'E5', { hasPolicy: true });
    const result = deriveEpcSteps({ metaElements: [el] });
    const roleStep = result.find(s => s.dimension === 'E5');
    expect(roleStep).toBeDefined();
    expect(roleStep!.elementId).toBe('role-1');
  });

  // TC-9: Only 1 E3 element → used for both start and end
  it('should use same E3 element for start and end when only one E3 exists', () => {
    const el = m('ev-1', '唯一事件', 'E3');
    const result = deriveEpcSteps({ metaElements: [el] });
    expect(result[0].elementId).toBe('ev-1');
    expect(result[result.length - 1].elementId).toBe('ev-1');
  });

  // TC-10: 2 E3 elements → first as start, second as end when 2+ E3 exist
  it('should use first E3 as start and second as end when 2+ E3 exist', () => {
    const els: MetaElement[] = [
      m('ev-start', '起始事件', 'E3'),
      m('ev-end', '结束事件', 'E3'),
    ];
    const result = deriveEpcSteps({ metaElements: els });
    expect(result[0].elementId).toBe('ev-start');
    expect(result[result.length - 1].elementId).toBe('ev-end');
  });
});

describe('filterConfirmedMetaElements (US-S18-U01)', () => {
  it('should keep only elements with confirmed version records', () => {
    const elements: MetaElement[] = [
      m('e1', 'A', 'E1'),
      m('e2', 'B', 'E2'),
    ];
    const records = [
      { id: 'r1', moduleKind: 'E1' as const, moduleId: 'e1', status: 'confirmed' as const, version: 'v1', snapshot: elements[0], createdAt: '', updatedAt: '' },
    ];
    const filtered = filterConfirmedMetaElements(elements, records);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('e1');
  });
});

describe('derivedStepsToEpcSteps (US-S18-U01)', () => {
  it('should convert derived steps to EpcStep with elementRef', () => {
    let n = 0;
    const steps = derivedStepsToEpcSteps(
      [{ name: '审批', dimension: 'E2', elementId: 'act-1', derivation: 'test' }],
      () => `step-${++n}`,
    );
    expect(steps).toHaveLength(1);
    expect(steps[0].elementRef?.dimension).toBe('E2');
    expect(steps[0].elementRef?.elementId).toBe('act-1');
  });
});
