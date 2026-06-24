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

describe('module-version store (US-S03-U02)', () => {
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
    });
    useOntologyStore.getState().createProject('简化测试', domain);
  });

  it('should persist module drafts on project.moduleVersionRecords', () => {
    const store = useOntologyStore.getState();
    store.saveModuleDraft('EPC', 'epc-1', { steps: [] });
    const records = useOntologyStore.getState().project?.moduleVersionRecords ?? [];
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe('draft');
  });

  it('should confirm module and resolve latest_confirmed via store', () => {
    const store = useOntologyStore.getState();
    store.saveModuleDraft('E1', 'el-1', { name: '订单' });
    const confirmed = store.confirmModule('E1', 'el-1');
    expect(confirmed.version).toBe('v1');

    const resolved = store.resolveModuleRef({
      targetModuleKind: 'E1',
      targetElementId: 'el-1',
      pin: 'latest_confirmed',
    });
    expect(resolved?.snapshot).toEqual({ name: '订单' });
  });

  it('should list module version history after second confirm', () => {
    const store = useOntologyStore.getState();
    store.saveModuleDraft('C', 'c-1', { n: 1 });
    store.confirmModule('C', 'c-1');
    store.forkModuleToDraft('C', 'c-1', { n: 2 });
    store.confirmModule('C', 'c-1');

    const history = store.getModuleVersions('C', 'c-1');
    expect(history.some((h) => h.version === 'v1' && h.status === 'archived')).toBe(true);
    expect(history.some((h) => h.version === 'v2' && h.status === 'confirmed')).toBe(true);
  });

  it('should throw when confirming module without draft', () => {
    const store = useOntologyStore.getState();
    expect(() => store.confirmModule('C', 'missing-c')).toThrow(/No draft/);
  });
});
