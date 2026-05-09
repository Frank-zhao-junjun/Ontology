import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateProject } from '@/services/project-service';
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
});
