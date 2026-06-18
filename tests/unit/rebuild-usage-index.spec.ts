import { describe, it, expect } from 'vitest';
import type { EpcProcess, MetaElement } from '@/types/ontology';
import { rebuildUsageIndex } from '@/lib/epc-pipeline/rebuild-usage-index';

describe('rebuildUsageIndex (US-S05-U02)', () => {
  const epcProcesses: EpcProcess[] = [{
    id: 'epc-1',
    name: '流程',
    parentId: 'c-1',
    steps: [
      {
        id: 'step-1',
        name: 'S1',
        elementRef: {
          dimension: 'E1',
          elementId: 'el-1',
          versionPin: 'latest_confirmed',
        },
      },
      {
        id: 'step-2',
        name: 'S2',
        elementRef: {
          dimension: 'E4',
          elementId: 'el-2',
          versionPin: { version: 'v1' },
        },
      },
    ],
  }];

  const metaElements: MetaElement[] = [
    { id: 'el-1', name: 'A', dimension: 'E1' },
    { id: 'el-2', name: 'B', dimension: 'E4' },
    { id: 'el-orphan', name: 'C', dimension: 'E1' },
  ];

  it('should rebuild usageRefs from all epc steps', () => {
    const result = rebuildUsageIndex({ epcProcesses, metaElements });

    const el1 = result.find((m) => m.id === 'el-1');
    expect(el1?.usageRefs).toEqual([{
      epcId: 'epc-1',
      stepId: 'step-1',
      scenarioId: 'c-1',
      versionPin: 'latest_confirmed',
    }]);

    const el2 = result.find((m) => m.id === 'el-2');
    expect(el2?.usageRefs?.[0].versionPin).toEqual({ version: 'v1' });

    expect(result.find((m) => m.id === 'el-orphan')?.usageRefs).toEqual([]);
  });

  it('should clear usage when step removed', () => {
    const emptyEpc: EpcProcess[] = [{
      id: 'epc-1',
      name: '空',
      parentId: 'c-1',
      steps: [],
    }];
    const result = rebuildUsageIndex({ epcProcesses: emptyEpc, metaElements });
    expect(result.every((m) => (m.usageRefs ?? []).length === 0)).toBe(true);
  });
});
