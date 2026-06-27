import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  runCreateCapability,
  runCreateEpcProcess,
  runCreateScenario,
} from '@/lib/copilot/actions/create-chain-nodes';
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

describe('create chain node actions — TC-02', () => {
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
    useOntologyStore.getState().createProject('Copilot 链测试', domain);
  });

  it('runCreateCapability adds capability under A', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });

    const result = runCreateCapability(store, a.id, { name: '计划管理' });
    const project = useOntologyStore.getState().project!;

    expect(project.capabilities).toHaveLength(1);
    expect(result.id).toBe(project.capabilities![0].id);
    expect(result.name).toBe('计划管理');
  });

  it('runCreateScenario adds scenario under B', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });

    const result = runCreateScenario(store, b.id, { name: 'MTS排产' });
    const project = useOntologyStore.getState().project!;

    expect(project.scenarios).toHaveLength(1);
    expect(result.name).toBe('MTS排产');
  });

  it('runCreateEpcProcess adds empty EPC shell under C', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });
    const c = store.addScenario(b.id, { name: 'MTS排产' });

    const result = runCreateEpcProcess(store, c.id, { name: '订单处理' });
    const project = useOntologyStore.getState().project!;

    expect(project.epcProcesses).toHaveLength(1);
    expect(result.name).toBe('订单处理');
    expect(project.epcProcesses![0].steps).toEqual([]);
  });
});
