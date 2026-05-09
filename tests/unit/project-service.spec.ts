import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteProject, updateProject } from '@/services/project-service';
import { createMockProject } from './test-helpers';

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function successResponse(): Response {
  return {
    json: async () => ({ success: true }),
  } as Response;
}

function failureResponse(error: string): Response {
  return {
    json: async () => ({ success: false, error }),
  } as Response;
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('project-service', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('serializes full-project updates for the same project', async () => {
    const firstResponse = deferred<Response>();
    vi.mocked(fetch)
      .mockReturnValueOnce(firstResponse.promise)
      .mockResolvedValueOnce(successResponse());

    const originalProject = createMockProject({
      id: 'project-service-race',
      name: 'Original project',
      updatedAt: '2026-05-09T11:00:00.000Z',
    });
    const editedProject = {
      ...originalProject,
      name: 'Edited project',
      updatedAt: '2026-05-09T11:00:05.000Z',
    };

    const firstSave = updateProject(originalProject);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-service-race', expect.objectContaining({
      body: JSON.stringify({ project: originalProject }),
      method: 'PUT',
    }));

    const secondSave = updateProject(editedProject);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);

    firstResponse.resolve(successResponse());
    await firstSave;
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-service-race', expect.objectContaining({
      body: JSON.stringify({ project: editedProject }),
      method: 'PUT',
    }));
    await secondSave;
  });

  it('orders project deletion after an in-flight project update', async () => {
    const firstResponse = deferred<Response>();
    vi.mocked(fetch)
      .mockReturnValueOnce(firstResponse.promise)
      .mockResolvedValueOnce(successResponse());

    const project = createMockProject({
      id: 'project-delete-race',
      name: 'Project before delete',
    });

    const updateSave = updateProject(project);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-delete-race', expect.objectContaining({
      method: 'PUT',
    }));

    const deleteSave = deleteProject(project.id);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);

    firstResponse.resolve(successResponse());
    await updateSave;
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-delete-race', expect.objectContaining({
      method: 'DELETE',
    }));
    await deleteSave;
  });

  it('ignores stale project updates once deletion has been requested', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(successResponse());

    const project = createMockProject({
      id: 'project-delete-tombstone',
      name: 'Project to delete',
    });

    const deleteSave = deleteProject(project.id);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-delete-tombstone', expect.objectContaining({
      method: 'DELETE',
    }));

    const staleUpdate = updateProject({
      ...project,
      name: 'Stale autosave after delete',
    });
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);
    await deleteSave;
    await staleUpdate;
  });

  it('preserves updates that were already queued before deletion was requested', async () => {
    const firstResponse = deferred<Response>();
    vi.mocked(fetch)
      .mockReturnValueOnce(firstResponse.promise)
      .mockResolvedValueOnce(successResponse())
      .mockResolvedValueOnce(failureResponse('delete failed'));

    const originalProject = createMockProject({
      id: 'project-delete-queued-update',
      name: 'Original project',
      updatedAt: '2026-05-09T11:00:00.000Z',
    });
    const editedProject = {
      ...originalProject,
      name: 'Queued edit before delete',
      updatedAt: '2026-05-09T11:00:05.000Z',
    };

    const firstSave = updateProject(originalProject);
    await flushPromises();
    const secondSave = updateProject(editedProject);
    await flushPromises();
    const deleteSave = deleteProject(originalProject.id);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);

    firstResponse.resolve(successResponse());
    await firstSave;
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-delete-queued-update', expect.objectContaining({
      body: JSON.stringify({ project: editedProject }),
      method: 'PUT',
    }));

    await secondSave;
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-delete-queued-update', expect.objectContaining({
      method: 'DELETE',
    }));
    await expect(deleteSave).rejects.toThrow('delete failed');
  });

  it('replays updates requested during deletion if the deletion fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(failureResponse('delete failed'))
      .mockResolvedValueOnce(successResponse());

    const project = createMockProject({
      id: 'project-delete-failed-autosave',
      name: 'Project to delete',
    });

    const deleteSave = deleteProject(project.id);
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-delete-failed-autosave', expect.objectContaining({
      method: 'DELETE',
    }));

    const replayedUpdate = updateProject({
      ...project,
      name: 'Autosave after failed delete',
    });
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(1);
    await expect(deleteSave).rejects.toThrow('delete failed');
    await flushPromises();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/api/projects/project-delete-failed-autosave', expect.objectContaining({
      method: 'PUT',
    }));
    await replayedUpdate;
  });
});
