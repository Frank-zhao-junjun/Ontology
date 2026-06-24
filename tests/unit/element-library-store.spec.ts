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

describe('element-library store (US-S07-U02)', () => {
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
    useOntologyStore.getState().createProject('要素库测试', domain);
  });

  it('should return elements with no usage refs', () => {
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        metaElements: [
          { id: 'u1', name: '孤儿', dimension: 'E1' },
          { id: 'u2', name: '已用', dimension: 'E2', usageRefs: [{ epcId: 'e', stepId: 's', scenarioId: 'c', versionPin: 'latest_confirmed' }] },
        ],
      },
    });

    const unref = useOntologyStore.getState().getUnreferencedElements();
    expect(unref).toHaveLength(1);
    expect(unref[0].id).toBe('u1');
  });
});
