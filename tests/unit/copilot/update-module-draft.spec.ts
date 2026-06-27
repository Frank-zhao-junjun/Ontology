import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runUpdateModuleDraft } from '@/lib/copilot/actions/update-module-draft';
import { getLatestConfirmed, getModuleDraft } from '@/lib/module-version';
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

describe('runUpdateModuleDraft — TC-04', () => {
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
    useOntologyStore.getState().createProject('Copilot 更新测试', domain);
  });

  it('forks confirmed module before applying updates', () => {
    const store = useOntologyStore.getState();
    const b = store.addCapability(store.addValueDomain({ name: '生产域' }).id, {
      name: '计划管理',
    });
    store.confirmModuleValidated('B', b.id);

    const confirmedBefore = getLatestConfirmed(
      useOntologyStore.getState().project!.moduleVersionRecords ?? [],
      'B',
      b.id,
    );

    const result = runUpdateModuleDraft(useOntologyStore.getState(), {
      name: '计划管理',
      kind: 'B',
      userText: '把计划管理改成供应链计划',
      updates: { name: '供应链计划' },
    });

    const project = useOntologyStore.getState().project!;
    const records = project.moduleVersionRecords ?? [];
    const draft = getModuleDraft(records, 'B', b.id);
    const confirmedAfter = getLatestConfirmed(records, 'B', b.id);

    expect(result.mode).toBe('fork');
    expect(result.moduleId).toBe(b.id);
    expect(draft).toBeDefined();
    expect(confirmedAfter?.version).toBe(confirmedBefore?.version);
    expect(project.capabilities?.find((item) => item.id === b.id)?.name).toBe('供应链计划');
  });

  it('updates draft module without fork', () => {
    const store = useOntologyStore.getState();
    const b = store.addCapability(store.addValueDomain({ name: '生产域' }).id, {
      name: '计划管理',
    });

    const result = runUpdateModuleDraft(useOntologyStore.getState(), {
      name: '计划管理',
      kind: 'B',
      userText: '更新描述',
      updates: { description: '新描述' },
    });

    const project = useOntologyStore.getState().project!;
    expect(result.mode).toBe('update');
    expect(project.capabilities?.find((item) => item.id === b.id)?.description).toBe('新描述');
  });
});
