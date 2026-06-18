import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BusinessChainDetail } from '@/components/ontology/business-chain-detail';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}));

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('AiDraftFill integration (US-S11-U04)', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('AI 集成', domain);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { suggestion: { description: 'AI 集成描述' } },
            }),
        }),
      ),
    );
  });

  it('should apply AI suggestion to draft value domain', async () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    store.setSelectedBusinessChainNode({ kind: 'A', id: a.id });

    render(<BusinessChainDetail />);

    fireEvent.click(screen.getByTestId('module-action-ai-draft'));
    fireEvent.click(screen.getByTestId('ai-draft-submit'));

    await waitFor(() => {
      expect(useOntologyStore.getState().project?.valueDomains?.[0].description).toBe('AI 集成描述');
    });
  });
});
