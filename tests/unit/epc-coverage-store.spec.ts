import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, EpcProcess, MetaElement } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

const NOW = '2026-06-18T12:00:00.000Z';

function usageRef(epcId: string, stepId: string, scenarioId: string) {
  return { epcId, stepId, scenarioId, versionPin: 'latest_confirmed' as const };
}

describe('epc-coverage store (US-S16-U02)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('覆盖率测试', domain);
  });

  it('should return all-zero when project is null', () => {
    useOntologyStore.setState({ project: null });
    const report = useOntologyStore.getState().getEpcCoverage('c1');
    expect(report).toEqual({
      scenarioId: 'c1',
      totalElements: 0,
      coveredElements: 0,
      coveragePercent: 0,
      byDimension: {},
    });
  });

  it('should return all-zero when C is not confirmed', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '未确认场景' });

    const report = store.getEpcCoverage(c.id);
    expect(report.totalElements).toBe(0);
    expect(report.coveredElements).toBe(0);
    expect(report.coveragePercent).toBe(0);
  });

  it('should compute 50% coverage when C and EPC are confirmed', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '场景' });
    const epcProcess = store.addEpcProcess(c.id, { name: '主流程' });

    store.confirmModule('C', c.id);
    store.confirmModule('EPC', epcProcess.id);

    const epcWithSteps: EpcProcess = {
      ...epcProcess,
      steps: [
        { id: 's1', name: '步1', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } },
        { id: 's2', name: '步2', elementRef: { dimension: 'E1', elementId: 'e2', versionPin: 'latest_confirmed' } },
      ],
    };

    const metaElements: MetaElement[] = [
      { id: 'e1', name: '被引用1', dimension: 'E1', usageRefs: [usageRef(epcProcess.id, 's1', c.id)] },
      { id: 'e2', name: '被引用2', dimension: 'E1', usageRefs: [usageRef(epcProcess.id, 's2', c.id)] },
      { id: 'e3', name: '未覆盖1', dimension: 'E1', usageRefs: [] },
      { id: 'e4', name: '未覆盖2', dimension: 'E1', usageRefs: [] },
    ];

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: [epcWithSteps],
        metaElements,
      },
    });

    const report = useOntologyStore.getState().getEpcCoverage(c.id);
    expect(report.totalElements).toBe(4);
    expect(report.coveredElements).toBe(2);
    expect(report.coveragePercent).toBe(50);
    expect(report.byDimension.E1?.uncovered.map((u) => u.elementId)).toEqual(['e3', 'e4']);
  });

  it('should not count refs from unconfirmed EPC', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '场景' });
    const epcProcess = store.addEpcProcess(c.id, { name: '未确认流程' });

    store.confirmModule('C', c.id);

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: [{
          ...epcProcess,
          steps: [{
            id: 's1',
            name: '步',
            elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' },
          }],
        }],
        metaElements: [{
          id: 'e1',
          name: '要素',
          dimension: 'E1',
          usageRefs: [usageRef(epcProcess.id, 's1', c.id)],
        }],
      },
    });

    const report = useOntologyStore.getState().getEpcCoverage(c.id);
    expect(report.totalElements).toBe(1);
    expect(report.coveredElements).toBe(0);
  });
});
