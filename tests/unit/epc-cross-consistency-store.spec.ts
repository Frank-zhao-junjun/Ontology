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

describe('cross-consistency store (US-S17-U03)', () => {
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
    useOntologyStore.getState().createProject('VX测试', domain);
  });

  it('should return empty array when project is null', () => {
    useOntologyStore.setState({ project: null });
    expect(useOntologyStore.getState().getCrossConsistency('c1')).toEqual([]);
  });

  it('should return empty when scenario is not confirmed', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '未确认场景' });
    store.addEpcProcess(c.id, { name: '流程' });

    expect(store.getCrossConsistency(c.id)).toEqual([]);
  });

  it('should surface VX-09 when trigger phrase has no matching action', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, {
      name: '场景',
      semantics: { triggerPhrases: ['未知动作'] },
    });
    const epcProcess = store.addEpcProcess(c.id, { name: '主流程' });
    store.confirmModule('C', c.id);
    store.confirmModule('EPC', epcProcess.id);

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
        metaElements: [{ id: 'e1', name: '订单', nameEn: 'Order', dimension: 'E1' }],
        behaviorModel: {
          id: 'bm-1',
          name: '行为',
          version: '1',
          domain: 'd1',
          stateMachines: [{
            id: 'sm-1',
            name: 'SM',
            entity: 'Order',
            statusField: 'status',
            states: [],
            transitions: [],
            actions: [{ id: 'act-1', name: '提交', actionType: 'update' }],
          }],
          createdAt: NOW,
          updatedAt: NOW,
        },
      },
    });

    const issues = useOntologyStore.getState().getCrossConsistency(c.id);
    expect(issues.some((i) => i.code === 'VX-09')).toBe(true);
    expect(issues.find((i) => i.code === 'VX-09')?.severity).toBe('error');
  });

  it('should surface VX-01 for orphan E2 element without state machine', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '场景' });
    const epcProcess = store.addEpcProcess(c.id, { name: '主流程' });
    store.confirmModule('C', c.id);
    store.confirmModule('EPC', epcProcess.id);

    const epcWithSteps: EpcProcess = {
      ...epcProcess,
      steps: [{
        id: 's1',
        name: '提交',
        elementRef: { dimension: 'E2', elementId: 'act-1', versionPin: 'latest_confirmed' },
      }],
    };
    const metaElements: MetaElement[] = [
      { id: 'act-1', name: '提交动作', dimension: 'E2' },
    ];

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: [epcWithSteps],
        metaElements,
        behaviorModel: {
          id: 'bm-1',
          name: '行为',
          version: '1',
          domain: 'd1',
          stateMachines: [],
          createdAt: NOW,
          updatedAt: NOW,
        },
      },
    });

    const issues = useOntologyStore.getState().getCrossConsistency(c.id);
    expect(issues.filter((i) => i.code === 'VX-01')).toHaveLength(1);
  });
});
