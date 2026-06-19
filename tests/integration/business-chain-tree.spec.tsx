import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { BusinessChainTree } from '@/components/ontology/business-chain-tree';
import { BusinessChainDetail } from '@/components/ontology/business-chain-detail';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

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

describe('business-chain tree UI (US-S04-U03)', () => {
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

  it('should create value domain and show draft badge', () => {
    render(<ChainPanel />);
    fireEvent.click(screen.getByRole('button', { name: /新建价值域/i }));

    const nameInput = screen.getByLabelText(/名称/i);
    fireEvent.change(nameInput, { target: { value: '生产域' } });
    fireEvent.click(screen.getByRole('button', { name: /^创建$/i }));

    const aId = useOntologyStore.getState().project?.valueDomains?.[0]?.id;
    expect(aId).toBeTruthy();
    expect(screen.getByTestId(`business-chain-node-A-${aId}`)).toBeInTheDocument();
    expect(within(screen.getByTestId(`business-chain-node-A-${aId}`)).getByTestId('module-status-badge-draft')).toBeInTheDocument();
  });

  it('should show archived badge when only archived history exists', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '归档域' });
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        moduleVersionRecords: (project.moduleVersionRecords ?? []).filter(
          (r) => !(r.moduleKind === 'A' && r.moduleId === a.id && r.status === 'draft'),
        ).concat([{
          id: 'arch-only',
          moduleKind: 'A',
          moduleId: a.id,
          status: 'archived',
          version: 'v1',
          createdAt: '2026-06-18T12:00:00.000Z',
          snapshot: a,
        }]),
      },
    });
    store.setSelectedBusinessChainNode({ kind: 'A', id: a.id });

    render(<BusinessChainDetail />);

    expect(screen.getByTestId('module-status-badge-archived')).toBeInTheDocument();
    expect(screen.getByTitle(/已归档/)).toBeInTheDocument();
  });

  it('should show display path when node selected', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });
    store.setSelectedBusinessChainNode({ kind: 'B', id: b.id });

    render(<ChainPanel />);

    expect(screen.getByTestId('business-chain-path')).toHaveTextContent('生产域/计划能力');
  });

  it('should sync tree selection with detail panel badge and path', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });
    store.confirmModuleValidated('B', b.id);

    render(<ChainPanel />);

    const aNode = screen.getByTestId(`business-chain-node-A-${a.id}`);
    fireEvent.click(within(aNode).getByRole('button', { name: '展开' }));
    fireEvent.click(screen.getByTestId(`business-chain-node-B-${b.id}`));

    expect(screen.getByTestId('business-chain-path')).toHaveTextContent('生产域/计划能力');
    expect(
      within(screen.getByTestId(`business-chain-node-B-${b.id}`)).getByTestId(
        'module-status-badge-confirmed',
      ),
    ).toBeInTheDocument();
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({
      kind: 'B',
      id: b.id,
    });
  });
});
