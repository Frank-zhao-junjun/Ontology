import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCreateEpcProcess } from '@/lib/copilot/actions/create-epc-process';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Manufacturing',
  description: 'test',
  icon: 'factory',
  color: '#000',
};

describe('runCreateEpcProcess (separate entry) — TC-02', () => {
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
    useOntologyStore.getState().createProject('Copilot 测试', domain);
  });

  it('adds empty EPC shell under a scenario', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });
    const c = store.addScenario(b.id, { name: 'MTS排产' });

    const result = runCreateEpcProcess(store, c.id, { name: '订单处理' });
    const project = useOntologyStore.getState().project!;

    expect(project.epcProcesses).toHaveLength(1);
    expect(result.name).toBe('订单处理');
    expect(project.epcProcesses![0].steps).toEqual([]);
    expect(result.message).toMatch(/draft/);
  });
});
