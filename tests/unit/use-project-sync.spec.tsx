import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectSync } from '@/hooks/use-project-sync';
import { updateProject } from '@/services/project-service';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';

vi.mock('@/services/project-service', () => ({
  updateProject: vi.fn(),
}));

const updateProjectMock = vi.mocked(updateProject);

function createProject(name: string): OntologyProject {
  return {
    id: 'project-1',
    name,
    description: '测试项目',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同领域',
    },
    dataModel: null,
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    epcModel: null,
    createdAt: '2026-05-22T00:00:00.000Z',
    updatedAt: '2026-05-22T00:00:00.000Z',
  };
}

function resetStore() {
  useOntologyStore.setState({
    project: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: null,
  });
}

function SyncProbe() {
  useProjectSync();
  return null;
}

describe('useProjectSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    updateProjectMock.mockReset();
    resetStore();
  });

  it('queues the latest project while a save is in flight to avoid stale overwrites', async () => {
    const pendingSaves: Array<() => void> = [];
    updateProjectMock.mockImplementation(() => new Promise<void>((resolve) => {
      pendingSaves.push(resolve);
    }));

    render(<SyncProbe />);

    act(() => {
      useOntologyStore.setState({ project: createProject('第一版') });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(updateProjectMock).toHaveBeenCalledTimes(1);
    expect(updateProjectMock.mock.calls[0][0].name).toBe('第一版');

    act(() => {
      useOntologyStore.setState({ project: createProject('第二版') });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(updateProjectMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      pendingSaves[0]();
      await Promise.resolve();
    });

    expect(updateProjectMock).toHaveBeenCalledTimes(2);
    expect(updateProjectMock.mock.calls[1][0].name).toBe('第二版');
  });
});
