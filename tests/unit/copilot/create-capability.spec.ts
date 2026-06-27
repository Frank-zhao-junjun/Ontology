import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCreateCapability } from '@/lib/copilot/actions/create-capability';
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

describe('runCreateCapability (separate entry) — TC-02', () => {
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

  it('adds capability under a value domain', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });

    const result = runCreateCapability(store, a.id, { name: '计划管理' });
    const project = useOntologyStore.getState().project!;

    expect(project.capabilities).toHaveLength(1);
    expect(result.id).toBe(project.capabilities![0].id);
    expect(result.name).toBe('计划管理');
    expect(result.message).toMatch(/draft/);
  });
});
