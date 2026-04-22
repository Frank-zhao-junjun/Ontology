import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import { createFrozenProject } from './test-helpers';

describe('US-10.3 / version history management in store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T00:00:00.000Z'));
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
    });
  });

  it('应按项目返回版本历史，并能标记发布/归档状态', () => {
    const store = useOntologyStore.getState();
    const v100 = store.createVersion({ version: '1.0.0', name: '初始版本' });
    const v101 = store.createVersion({ version: '1.0.1', name: '修订版本' });

    store.publishVersion(v100.id);
    store.archiveVersion(v100.id);

    const history = store.getVersionsByProject(useOntologyStore.getState().project!.id);
    expect(history).toHaveLength(2);
    expect(history.map((item) => item.version)).toEqual(['1.0.0', '1.0.1']);

    const publishedArchived = history.find((item) => item.id === v100.id);
    expect(publishedArchived?.publishedAt).toBeDefined();
    expect(publishedArchived?.status).toBe('archived');

    const stillDraft = history.find((item) => item.id === v101.id);
    expect(stillDraft?.status).toBe('draft');
  });

  it('应返回创建时间最近的版本作为 latest version', () => {
    const store = useOntologyStore.getState();
    store.createVersion({ version: '1.0.0', name: '初始版本' });

    vi.setSystemTime(new Date('2026-04-21T00:01:00.000Z'));
    store.createVersion({ version: '1.1.0', name: '主线增强' });

    const latest = useOntologyStore.getState().getLatestVersion();
    expect(latest?.version).toBe('1.1.0');
    expect(latest?.name).toBe('主线增强');
  });
});
