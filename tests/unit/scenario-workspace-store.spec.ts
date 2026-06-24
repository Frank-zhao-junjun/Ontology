import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('scenario-workspace store (US-S08-U02)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('C工作区', domain);
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '场景' });
    store.addEpcProcess(c.id, { name: 'EPC1' });
  });

  it('should expose child epcs and reference union via store', () => {
    const cId = useOntologyStore.getState().project?.scenarios?.[0]?.id;
    if (!cId) throw new Error('scenario missing');
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: (project.epcProcesses ?? []).map((epc) =>
          epc.name === 'EPC1'
            ? {
                ...epc,
                steps: [{
                  id: 's1',
                  name: '步',
                  elementRef: { dimension: 'E1', elementId: 'm1', versionPin: 'latest_confirmed' },
                }],
              }
            : epc,
        ),
        metaElements: [{ id: 'm1', name: '物料', dimension: 'E1' }],
      },
    });

    const children = useOntologyStore.getState().getScenarioChildEpcs(cId);
    expect(children).toHaveLength(1);

    const union = useOntologyStore.getState().getScenarioReferenceUnion(cId);
    expect(union).toHaveLength(1);
    expect(union[0].elementName).toBe('物料');
  });
});
