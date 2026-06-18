import { describe, it, expect } from 'vitest';
import type { EpcProcess, MetaElement } from '@/types/ontology';
import {
  getChildEpcProcesses,
  buildScenarioReferenceUnion,
} from '@/lib/scenario-workspace';

const epcProcesses: EpcProcess[] = [
  {
    id: 'epc1',
    name: '流程A',
    parentId: 'c1',
    steps: [
      { id: 's1', name: '步骤1', elementRef: { dimension: 'E1', elementId: 'el-1', versionPin: 'latest_confirmed' } },
    ],
  },
  {
    id: 'epc2',
    name: '流程B',
    parentId: 'c1',
    steps: [
      { id: 's2', name: '步骤2', elementRef: { dimension: 'E1', elementId: 'el-1', versionPin: 'latest_confirmed' } },
      { id: 's3', name: '步骤3', elementRef: { dimension: 'E4', elementId: 'el-4', versionPin: 'latest_confirmed' } },
    ],
  },
  { id: 'epc-other', name: '其他', parentId: 'c2', steps: [] },
];

const metaElements: MetaElement[] = [
  { id: 'el-1', name: '订单', dimension: 'E1' },
  { id: 'el-4', name: '规则', dimension: 'E4' },
];

describe('scenario-workspace lib (US-S08-U01)', () => {
  it('should list child EPC processes for scenario', () => {
    const children = getChildEpcProcesses('c1', epcProcesses);
    expect(children).toHaveLength(2);
    expect(children.map((e) => e.id)).toEqual(['epc1', 'epc2']);
  });

  it('should build reference union aggregated by elementId', () => {
    const union = buildScenarioReferenceUnion('c1', epcProcesses, metaElements);
    expect(union).toHaveLength(2);

    const order = union.find((u) => u.elementId === 'el-1');
    expect(order?.elementName).toBe('订单');
    expect(order?.sources).toHaveLength(2);
    expect(order?.sources.map((s) => s.epcId).sort()).toEqual(['epc1', 'epc2']);

    const rule = union.find((u) => u.elementId === 'el-4');
    expect(rule?.sources).toHaveLength(1);
    expect(rule?.sources[0].stepName).toBe('步骤3');
  });

  it('should skip steps without elementRef', () => {
    const sparse: EpcProcess[] = [{
      id: 'e',
      name: '空',
      parentId: 'c1',
      steps: [{ id: 'x', name: '无挂接' }],
    }];
    expect(buildScenarioReferenceUnion('c1', sparse, [])).toHaveLength(0);
  });
});
