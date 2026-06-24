import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ManualGenerator } from '@/components/ontology/manual-generator';
import { useOntologyStore } from '@/store/ontology-store';
import { createFrozenProject } from '../unit/test-helpers';

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

describe('US-11.2 / AI suggestion apply and rollback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetStore();
  });

  it('应展示 AI 预览建议，并支持应用后回滚', async () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({
      project,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
    });

    const entity = project.dataModel!.entities.find((item) => item.id === 'contract-1')!;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          dataModel: {
            suggestedAttributes: [
              { name: 'AI建议字段', nameEn: 'aiField', type: 'string', required: true, description: 'AI 推荐' },
            ],
          },
          behaviorModel: { suggestedStates: [], suggestedTransitions: [] },
          ruleModel: { suggestedRules: [] },
          eventModel: { suggestedEvents: [], suggestedSubscriptions: [] },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(React.createElement(ManualGenerator, {
      onBack: () => undefined,
      selectedEntityId: entity.id,
      relatedModels: {
        entity,
        stateMachines: [],
        rules: [],
        events: [],
        subscriptions: [],
      },
    }));

    await waitFor(() => {
      expect(screen.getByText('AI建议字段')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '应用' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '应用' }));
    await waitFor(() => {
      const saved = useOntologyStore.getState().project?.dataModel?.entities.find((item) => item.id === entity.id);
      expect(saved?.attributes.some((attr) => attr.name === 'AI建议字段')).toBe(true);
      expect(screen.getByRole('button', { name: '回滚' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '回滚' }));
    await waitFor(() => {
      const saved = useOntologyStore.getState().project?.dataModel?.entities.find((item) => item.id === entity.id);
      expect(saved?.attributes.some((attr) => attr.name === 'AI建议字段')).toBe(false);
      expect(screen.getByRole('button', { name: '应用' })).toBeInTheDocument();
    });
  });
});
