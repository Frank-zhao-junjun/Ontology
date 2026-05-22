import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateProject } from '@/services/project-service';
import type { OntologyProject } from '@/types/ontology';

function createProject(name: string, id = 'project-1'): OntologyProject {
  return {
    id,
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

function successfulResponse() {
  return {
    json: async () => ({ success: true }),
  } as Response;
}

describe('project-service updateProject', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('serializes overlapping saves and persists only the latest queued project', async () => {
    const pendingResponses: Array<() => void> = [];
    const fetchMock = vi.fn<typeof fetch>(() => new Promise<Response>((resolve) => {
      pendingResponses.push(() => resolve(successfulResponse()));
    }));
    vi.stubGlobal('fetch', fetchMock);

    const firstSave = updateProject(createProject('第一版'));
    const secondSave = updateProject(createProject('第二版'));
    const thirdSave = updateProject(createProject('第三版'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string).project.name).toBe('第一版');

    pendingResponses[0]();

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string).project.name).toBe('第三版');

    pendingResponses[1]();
    await expect(Promise.all([firstSave, secondSave, thirdSave])).resolves.toEqual([undefined, undefined, undefined]);
  });

  it('does not coalesce queued saves for different projects', async () => {
    const pendingResponses: Array<() => void> = [];
    const fetchMock = vi.fn<typeof fetch>(() => new Promise<Response>((resolve) => {
      pendingResponses.push(() => resolve(successfulResponse()));
    }));
    vi.stubGlobal('fetch', fetchMock);

    const firstProjectSave = updateProject(createProject('项目一第一版', 'project-1'));
    const queuedFirstProjectSave = updateProject(createProject('项目一第二版', 'project-1'));
    const secondProjectSave = updateProject(createProject('项目二第一版', 'project-2'));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string).project.id).toBe('project-1');
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string).project.id).toBe('project-2');

    pendingResponses[0]();
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
    expect(JSON.parse(fetchMock.mock.calls[2][1]?.body as string).project.name).toBe('项目一第二版');

    pendingResponses[1]();
    pendingResponses[2]();
    await expect(Promise.all([firstProjectSave, queuedFirstProjectSave, secondProjectSave])).resolves.toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });
});
