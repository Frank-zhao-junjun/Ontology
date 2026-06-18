import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('business-chain store (US-S04-U02)', () => {
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
    useOntologyStore.getState().createProject('业务链测试', domain);
  });

  it('should add value domain and persist module draft', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const project = useOntologyStore.getState().project!;

    expect(project.valueDomains).toHaveLength(1);
    expect(project.valueDomains![0].id).toBe(a.id);
    expect(project.moduleVersionRecords?.some((r) => r.moduleKind === 'A' && r.moduleId === a.id && r.status === 'draft')).toBe(true);
  });

  it('should build A→B→C→EPC chain via store APIs', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });
    const c = store.addScenario(b.id, { name: '排产场景' });
    const epc = store.addEpcProcess(c.id, { name: '主流程' });

    const project = useOntologyStore.getState().project!;
    expect(project.epcProcesses).toHaveLength(1);
    expect(project.epcProcesses![0].id).toBe(epc.id);
    expect(project.epcProcesses![0].steps).toEqual([]);
  });

  it('should block delete when children exist and allow empty C delete', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });
    const c = store.addScenario(b.id, { name: '空场景' });

    expect(() => store.deleteValueDomain(a.id)).toThrow();
    expect(() => store.deleteCapability(b.id)).toThrow();

    store.deleteScenario(c.id);
    expect(useOntologyStore.getState().project?.scenarios).toHaveLength(0);
  });

  it('should report draft module status for new nodes', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    expect(store.getBusinessChainModuleStatus('A', a.id)).toBe('draft');
  });

  it('should update selection state', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    store.setSelectedBusinessChainNode({ kind: 'A', id: a.id });
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'A', id: a.id });
  });
});
