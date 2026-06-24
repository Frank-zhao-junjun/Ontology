import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { BusinessChainTree } from '@/components/ontology/business-chain-tree';
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

function ChainPanel() {
  return (
    <div>
      <BusinessChainTree />
      <BusinessChainDetail />
    </div>
  );
}

describe('business-chain confirm flow (US-S14-U04)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('链测试', domain);
  });

  it('should confirm draft A node to v1 and refresh badge', () => {
    render(<ChainPanel />);
    fireEvent.click(screen.getByRole('button', { name: /新建价值域/i }));

    fireEvent.change(screen.getByLabelText(/名称/i), { target: { value: '生产域' } });
    fireEvent.click(screen.getByRole('button', { name: /^创建$/i }));

    const aId = useOntologyStore.getState().project?.valueDomains?.[0]?.id;
    expect(aId).toBeTruthy();

    fireEvent.click(screen.getByTestId('module-action-confirm'));
    fireEvent.click(screen.getByTestId('module-action-confirm-submit'));

    expect(useOntologyStore.getState().getBusinessChainModuleStatus('A', aId!)).toBe('confirmed');
    expect(
      within(screen.getByTestId(`business-chain-node-A-${aId}`)).getByTestId('module-status-badge-confirmed'),
    ).toBeInTheDocument();
  });

  it('should list child capability as incoming reference for value domain', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    store.addCapability(a.id, { name: '计划能力' });
    store.setSelectedBusinessChainNode({ kind: 'A', id: a.id });

    render(<BusinessChainDetail />);

    expect(screen.getByTestId('module-reference-list')).toBeInTheDocument();
    const bId = useOntologyStore.getState().project?.capabilities?.[0]?.id;
    expect(screen.getByTestId(`module-ref-in-B-${bId}`)).toHaveTextContent('计划能力');
  });
});
