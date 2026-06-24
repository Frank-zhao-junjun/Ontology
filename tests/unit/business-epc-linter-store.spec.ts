import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, MetaElement } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('business-epc-linter store (US-S09-U02)', () => {
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
    useOntologyStore.getState().createProject('Linter测试', domain);
  });

  it('should return warnings from project state', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '空场景' });
    store.confirmModule('C', c.id);

    const warnings = useOntologyStore.getState().getBusinessEpcWarnings();
    expect(warnings.some((w) => w.ruleId === 'W-EPC-04')).toBe(true);
  });

  it('should detect W-EPC-02 for confirmed orphan element', () => {
    const el: MetaElement = { id: 'orphan', name: '孤儿', dimension: 'E1' };
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        metaElements: [el],
        moduleVersionRecords: [
          ...(project.moduleVersionRecords ?? []),
          {
            id: 'c-el',
            moduleKind: 'E1',
            moduleId: 'orphan',
            status: 'confirmed',
            version: 'v1',
            confirmedAt: '2026-06-18T12:00:00.000Z',
            createdAt: '2026-06-18T12:00:00.000Z',
            snapshot: el,
          },
        ],
      },
    });

    const warnings = useOntologyStore.getState().getBusinessEpcWarnings();
    expect(warnings.some((w) => w.ruleId === 'W-EPC-02')).toBe(true);
  });
});
