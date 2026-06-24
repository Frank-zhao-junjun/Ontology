import { describe, it, expect } from 'vitest';
import { isElementEpcCovered } from '@/lib/epc-coverage';
import type { MetaElement, ModuleVersionRecord } from '@/types/ontology';

describe('isElementEpcCovered (US-S18-U04)', () => {
  it('should return false when element has no usageRefs', () => {
    const el: MetaElement = { id: 'e1', name: '订单', dimension: 'E1' };
    expect(isElementEpcCovered(el, [], [])).toBe(false);
  });

  it('should return true when referenced by confirmed EPC', () => {
    const el: MetaElement = {
      id: 'e1',
      name: '订单',
      dimension: 'E1',
      usageRefs: [{ epcId: 'epc-1', stepId: 's1', scenarioId: 'c-1', versionPin: 'latest_confirmed' }],
    };
    const records: ModuleVersionRecord[] = [
      { id: 'r1', moduleKind: 'EPC', moduleId: 'epc-1', status: 'confirmed', version: 'v1', snapshot: {}, createdAt: '' },
    ];
    const epcProcesses = [{ id: 'epc-1', name: '主流程', parentId: 'c-1', steps: [] }];
    expect(isElementEpcCovered(el, epcProcesses, records)).toBe(true);
  });

  it('should return false when EPC is not confirmed', () => {
    const el: MetaElement = {
      id: 'e1',
      name: '订单',
      dimension: 'E1',
      usageRefs: [{ epcId: 'epc-1', stepId: 's1', scenarioId: 'c-1', versionPin: 'latest_confirmed' }],
    };
    expect(isElementEpcCovered(el, [{ id: 'epc-1', name: '主流程', parentId: 'c-1', steps: [] }], [])).toBe(false);
  });
});
