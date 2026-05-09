import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectSync } from '@/hooks/use-project-sync';
import { updateProject } from '@/services/project-service';
import { useOntologyStore } from '@/store/ontology-store';
import { createMockProject } from './test-helpers';

vi.mock('@/services/project-service', () => ({
  updateProject: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useProjectSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(updateProject).mockReset();
    useOntologyStore.setState({ project: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serializes autosaves so an older in-flight snapshot cannot overwrite newer edits', async () => {
    const firstSave = deferred<void>();
    vi.mocked(updateProject)
      .mockReturnValueOnce(firstSave.promise)
      .mockResolvedValueOnce(undefined);

    renderHook(() => useProjectSync());

    const originalProject = createMockProject({
      id: 'project-sync-race',
      name: 'Original project',
      updatedAt: '2026-05-09T11:00:00.000Z',
    });
    const editedProject = {
      ...originalProject,
      name: 'Edited project',
      updatedAt: '2026-05-09T11:00:05.000Z',
    };

    act(() => {
      useOntologyStore.setState({ project: originalProject });
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(updateProject).toHaveBeenLastCalledWith(originalProject);

    act(() => {
      useOntologyStore.setState({ project: editedProject });
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(updateProject).toHaveBeenCalledTimes(1);

    firstSave.resolve();
    await flushPromises();

    expect(updateProject).toHaveBeenCalledTimes(2);
    expect(updateProject).toHaveBeenLastCalledWith(editedProject);
  });
});
