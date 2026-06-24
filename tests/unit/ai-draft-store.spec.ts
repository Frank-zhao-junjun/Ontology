import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import { getLatestConfirmed, getModuleDraft } from '@/lib/module-version';
import type { Domain } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('ai-draft store (US-S11-U03)', () => {
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
    useOntologyStore.getState().createProject('AI 测试', domain);
  });

  it('should apply AI suggestion to draft without confirming', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域', description: '旧描述' });

    store.applyAiModuleDraft('A', a.id, {
      description: 'AI 新描述',
      semantics: { terms: ['制造'] },
    });

    const project = useOntologyStore.getState().project!;
    expect(project.valueDomains?.[0].description).toBe('AI 新描述');
    expect(getModuleDraft(project.moduleVersionRecords ?? [], 'A', a.id)).toBeTruthy();
    expect(getLatestConfirmed(project.moduleVersionRecords ?? [], 'A', a.id)).toBeUndefined();
  });
});
