import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProjectSetup } from '@/components/ontology/project-setup';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';
import { createProject } from '@/services/project-service';

vi.mock('@/components/ontology/project-list', () => ({
  ProjectList: () => React.createElement('div', { 'data-testid': 'project-list' }),
}));

vi.mock('@/services/project-service', () => ({
  createProject: vi.fn(() => Promise.resolve()),
}));

const createProjectMock = vi.mocked(createProject);

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

describe('ProjectSetup creation flow', () => {
  beforeEach(() => {
    resetStore();
    createProjectMock.mockClear();
  });

  it('hydrates the exact persisted project into the local store', async () => {
    render(React.createElement(ProjectSetup));

    fireEvent.click(screen.getByText('企业合同全生命周期管理'));
    fireEvent.click(screen.getByRole('button', { name: '开始建模' }));

    await waitFor(() => expect(createProjectMock).toHaveBeenCalledTimes(1));

    const persistedProject = createProjectMock.mock.calls[0][0] as OntologyProject;
    const storedProject = useOntologyStore.getState().project;

    expect(storedProject?.id).toBe(persistedProject.id);
    expect(storedProject).toEqual(persistedProject);
  });
});
