import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BusinessChainDetail } from '@/components/ontology/business-chain-detail';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), message: vi.fn() },
}));

// Mock child components to avoid complexity
vi.mock('@/components/ontology/module-status-badge', () => ({
  ModuleStatusBadge: ({ status }: { status: string }) => <span data-testid="module-status-badge">{status}</span>,
}));

vi.mock('@/components/ontology/module-detail-actions', () => ({
  ModuleDetailActions: ({ kind, status }: { kind: string; status: string }) =>
    <div data-testid="module-detail-actions">{kind}-{status}</div>,
}));

vi.mock('@/components/ontology/version-history-panel', () => ({
  VersionHistoryPanel: () => <div data-testid="version-history-panel" />,
}));

vi.mock('@/components/ontology/module-reference-list', () => ({
  ModuleReferenceList: () => <div data-testid="module-reference-list" />,
}));

vi.mock('@/components/ontology/ai-draft-fill-dialog', () => ({
  AiDraftFillTrigger: () => <div data-testid="ai-draft-fill-trigger" />,
}));

vi.mock('@/components/ontology/epc-steps-editor', () => ({
  EpcStepsEditor: (props: Record<string, unknown>) => <div data-testid="epc-steps-editor" data-epc-id={String(props.epc ? (props.epc as Record<string, string>).id : '')} />,
}));

vi.mock('@/components/ontology/scenario-workspace', () => ({
  ScenarioWorkspace: () => <div data-testid="scenario-workspace" />,
}));

const domain: Domain = { id: 'd1', name: '测试', nameEn: 'Test', description: '', icon: 'factory', color: '#000' };

describe('BusinessChainDetail — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('测试项目', domain);
  });

  it('shows placeholder when no node is selected', () => {
    render(<BusinessChainDetail />);
    expect(screen.getByText('请在左侧选择业务链节点')).toBeInTheDocument();
  });

  it('shows node detail when a value domain (A) is selected', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '采购域' });
    useOntologyStore.setState({ selectedBusinessChainNode: { kind: 'A', id: a.id } });

    render(<BusinessChainDetail />);
    expect(screen.getByTestId('business-chain-path')).toBeInTheDocument();
    expect(screen.getByDisplayValue('采购域')).toBeInTheDocument();
    expect(screen.getByTestId('module-status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('module-detail-actions')).toBeInTheDocument();
    expect(screen.getByTestId('module-reference-list')).toBeInTheDocument();
  });

  it('shows node detail when a capability (B) is selected', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '采购能力' });
    useOntologyStore.setState({ selectedBusinessChainNode: { kind: 'B', id: b.id } });

    render(<BusinessChainDetail />);
    expect(screen.getByDisplayValue('采购能力')).toBeInTheDocument();
  });

  it('allows editing the name of a selected node', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '测试域' });
    useOntologyStore.setState({ selectedBusinessChainNode: { kind: 'A', id: a.id } });

    render(<BusinessChainDetail />);
    const nameInput = screen.getByDisplayValue('测试域');
    fireEvent.change(nameInput, { target: { value: '更新域名' } });

    const updatedProject = useOntologyStore.getState().project;
    const updated = updatedProject?.valueDomains?.find((n) => n.id === a.id);
    expect(updated?.name).toBe('更新域名');
  });

  it('allows editing the description of a selected node', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '测试域' });
    useOntologyStore.setState({ selectedBusinessChainNode: { kind: 'A', id: a.id } });

    render(<BusinessChainDetail />);
    const descInput = screen.getByPlaceholderText('节点描述');
    fireEvent.change(descInput, { target: { value: '更新描述' } });

    const updatedProject = useOntologyStore.getState().project;
    const updated = updatedProject?.valueDomains?.find((n) => n.id === a.id);
    expect(updated?.description).toBe('更新描述');
  });

  it('shows ScenarioWorkspace when scenario (C) is selected', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '采购场景' });
    useOntologyStore.setState({ selectedBusinessChainNode: { kind: 'C', id: c.id } });

    render(<BusinessChainDetail />);
    expect(screen.getByTestId('scenario-workspace')).toBeInTheDocument();
  });

  it('shows EpcStepsEditor when EPC is selected', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '场景' });
    const epc = store.addEpcProcess(c.id, { name: '主流程' });
    useOntologyStore.setState({ selectedBusinessChainNode: { kind: 'EPC', id: epc.id } });

    render(<BusinessChainDetail />);
    expect(screen.getByTestId('epc-steps-editor')).toBeInTheDocument();
  });

  it('shows path display for selected node', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '采购域' });
    useOntologyStore.setState({ selectedBusinessChainNode: { kind: 'A', id: a.id } });

    render(<BusinessChainDetail />);
    expect(screen.getByText('路径')).toBeInTheDocument();
    // The path should contain the node name
    expect(screen.getByTestId('business-chain-path')).toHaveTextContent('采购域');
  });
});
