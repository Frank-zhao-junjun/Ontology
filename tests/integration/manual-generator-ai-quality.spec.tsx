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

describe('US-11.1 / AI suggestion quality & personalization UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetStore();
  });

  it('应展示建议质量评分并传递个性化偏好', async () => {
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
        qualitySummary: {
          isValid: true,
          score: 90,
          issues: [],
          validatedAt: '2026-04-21T00:00:00.000Z',
          suggestionCounts: {
            attributes: 1,
            relations: 0,
            states: 0,
            transitions: 0,
            rules: 0,
            events: 0,
            subscriptions: 0,
          },
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
      expect(screen.getByText('建议质量评分')).toBeInTheDocument();
      expect(screen.getByText('90 / 100')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/业务关键词/), {
      target: { value: '合同审批,供应链' },
    });
    fireEvent.click(screen.getByRole('button', { name: '重新生成建议' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const lastCall = fetchMock.mock.calls.at(-1);
    const body = JSON.parse((lastCall?.[1] as RequestInit).body as string);
    expect(body.personalization.industryKeywords).toEqual(['合同审批', '供应链']);
    expect(body.personalization.preferMetadataMatch).toBe(true);
  });
});
