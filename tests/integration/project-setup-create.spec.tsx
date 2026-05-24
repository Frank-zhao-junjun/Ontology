import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProjectSetup } from '@/components/ontology/project-setup';
import { createProject } from '@/services/project-service';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';

vi.mock('@/components/ontology/project-list', () => ({
  ProjectList: () => React.createElement('div', { 'data-testid': 'project-list' }),
}));

vi.mock('@/services/project-service', () => ({
  createProject: vi.fn(),
}));

const mockedCreateProject = vi.mocked(createProject);

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

describe('ProjectSetup project creation persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockedCreateProject.mockResolvedValue(undefined);
  });

  it('keeps the local project id aligned with the project persisted to the API', async () => {
    let persistedProject: OntologyProject | undefined;
    mockedCreateProject.mockImplementation(async (project) => {
      persistedProject = project;
    });

    render(React.createElement(ProjectSetup));

    fireEvent.click(screen.getByText('合同管理'));
    fireEvent.click(screen.getByRole('button', { name: '开始建模' }));

    await waitFor(() => {
      expect(mockedCreateProject).toHaveBeenCalledTimes(1);
    });

    const localProject = useOntologyStore.getState().project;
    expect(localProject?.id).toBe(persistedProject?.id);
  });
});
