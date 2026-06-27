import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCreateScenario } from '@/lib/copilot/actions/create-scenario';
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

describe('runCreateScenario (separate entry) — TC-02', () => {
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

  it('adds scenario under a capability', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });

    const result = runCreateScenario(store, b.id, { name: 'MTS排产' });
    const project = useOntologyStore.getState().project!;

    expect(project.scenarios).toHaveLength(1);
    expect(result.name).toBe('MTS排产');
    expect(result.message).toMatch(/draft/);
  });
});
