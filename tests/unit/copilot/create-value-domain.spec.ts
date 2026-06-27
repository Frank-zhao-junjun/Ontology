import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCreateValueDomain } from '@/lib/copilot/actions/create-value-domain';
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

describe('runCreateValueDomain — TC-02', () => {
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

  it('adds value domain to store as draft', () => {
    const store = useOntologyStore.getState();
    const before = store.project?.valueDomains?.length ?? 0;

    const result = runCreateValueDomain(store, {
      name: '生产制造',
      nameEn: 'Manufacturing',
      description: '生产相关价值域',
    });

    const project = useOntologyStore.getState().project!;
    expect(project.valueDomains).toHaveLength(before + 1);
    expect(result.id).toBeTruthy();
    expect(result.name).toBe('生产制造');
    expect(result.message).toMatch(/draft/);
    expect(
      project.moduleVersionRecords?.some(
        (r) => r.moduleKind === 'A' && r.moduleId === result.id && r.status === 'draft',
      ),
    ).toBe(true);
  });
});
