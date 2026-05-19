import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProjectSetup } from '@/components/ontology/project-setup';
import { useOntologyStore } from '@/store/ontology-store';
import { createProject } from '@/services/project-service';

vi.mock('@/components/ontology/project-list', () => ({
  ProjectList: () => React.createElement('div', { 'data-testid': 'project-list' }),
}));

vi.mock('@/services/project-service', () => ({
  createProject: vi.fn(),
}));

describe('ProjectSetup project creation', () => {
  beforeEach(() => {
    vi.mocked(createProject).mockReset();
    vi.mocked(createProject).mockResolvedValue(undefined);
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
    });
  });

  it('loads the persisted project id into the local store after creating a project', async () => {
    render(React.createElement(ProjectSetup));

    fireEvent.click(screen.getByText('合同管理'));
    fireEvent.click(screen.getByRole('button', { name: '开始建模' }));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledTimes(1);
    });

    const persistedProject = vi.mocked(createProject).mock.calls[0][0];
    const localProject = useOntologyStore.getState().project;

    expect(localProject?.id).toBe(persistedProject.id);
    expect(localProject?.name).toBe(persistedProject.name);
    expect(localProject?.domain.id).toBe(persistedProject.domain.id);
  });
});
