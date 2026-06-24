import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ModelingWorkspace } from '@/components/ontology/modeling-workspace';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';

vi.mock('@/hooks/use-project-sync', () => ({
  useProjectSync: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/services/project-service', () => ({
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('@/components/ontology/data-model-editor', () => ({
  DataModelEditor: () => React.createElement('div', { 'data-testid': 'data-model-editor' }),
}));
vi.mock('@/components/ontology/behavior-model-editor', () => ({
  BehaviorModelEditor: () => React.createElement('div', { 'data-testid': 'behavior-model-editor' }),
}));
vi.mock('@/components/ontology/rule-model-editor', () => ({
  RuleModelEditor: () => React.createElement('div', { 'data-testid': 'rule-model-editor' }),
}));
vi.mock('@/components/ontology/event-model-editor', () => ({
  EventModelEditor: () => React.createElement('div', { 'data-testid': 'event-model-editor' }),
}));
vi.mock('@/components/ontology/epc-tab', () => ({
  EpcTab: () => React.createElement('div', { 'data-testid': 'epc-tab' }),
}));
vi.mock('@/components/ontology/manual-generator', () => ({
  ManualGenerator: () => React.createElement('div', { 'data-testid': 'manual-generator' }),
}));
vi.mock('@/components/ontology/metadata-manager', () => ({
  MetadataManager: () => React.createElement('div', { 'data-testid': 'metadata-manager' }),
}));
vi.mock('@/components/ontology/masterdata-manager', () => ({
  MasterDataManager: () => React.createElement('div', { 'data-testid': 'masterdata-manager' }),
}));
vi.mock('@/components/ontology/publish-dialog', () => ({
  PublishDialog: () => React.createElement('div', { 'data-testid': 'publish-dialog' }),
}));
vi.mock('@/components/ontology/manifest-export-dialog', () => ({
  ManifestExportDialog: () => React.createElement('div', { 'data-testid': 'manifest-export-dialog' }),
}));
vi.mock('@/components/ontology/governance-editor', () => ({
  GovernanceEditor: () => React.createElement('div', { 'data-testid': 'governance-editor' }),
}));
vi.mock('@/components/ontology/data-source-editor', () => ({
  DataSourceEditor: () => React.createElement('div', { 'data-testid': 'data-source-editor' }),
}));
vi.mock('@/components/ontology/metrics-editor', () => ({
  MetricsEditor: () => React.createElement('div', { 'data-testid': 'metrics-editor' }),
}));

const now = '2026-06-18T12:00:00.000Z';

function createProject(): OntologyProject {
  return {
    id: 'proj-bc',
    name: '业务链 E2E 项目',
    description: '',
    domain: {
      id: 'domain-1',
      name: '离散制造',
      nameEn: 'Mfg',
      description: '',
      icon: 'factory',
      color: '#3b82f6',
    },
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1',
      domain: 'domain-1',
      projects: [{ id: 'ep-1', name: '默认项目', nameEn: 'Default', color: '#3b82f6', createdAt: now, updatedAt: now }],
      businessScenarios: [],
      entities: [],
      createdAt: now,
      updatedAt: now,
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    valueDomains: [],
    capabilities: [],
    scenarios: [],
    epcProcesses: [],
    moduleVersionRecords: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('E2E-BUSINESS-CHAIN-001: 业务链树导航 @smoke', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
      selectedBusinessChainNode: null,
    });
  });

  it('@smoke 用户可从业务链 Tab 创建首个价值域', async () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    fireEvent.click(screen.getByRole('button', { name: /业务链/i }));
    fireEvent.click(screen.getByRole('button', { name: /新建价值域/i }));

    fireEvent.change(screen.getByLabelText(/名称/i), { target: { value: '生产域' } });
    fireEvent.click(screen.getByRole('button', { name: /^创建$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('business-chain-path')).toHaveTextContent('生产域');
    });

    const aId = useOntologyStore.getState().project?.valueDomains?.[0]?.id;
    expect(aId).toBeTruthy();
    expect(screen.getByTestId(`business-chain-node-A-${aId}`)).toBeInTheDocument();
  });

  it('@smoke 用户可展开深层树并保持选中态', async () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    fireEvent.click(screen.getByRole('button', { name: /业务链/i }));

    fireEvent.click(screen.getByRole('button', { name: /新建价值域/i }));
    fireEvent.change(screen.getByLabelText(/名称/i), { target: { value: '生产域' } });
    fireEvent.click(screen.getByRole('button', { name: /^创建$/i }));

    const aId = useOntologyStore.getState().project?.valueDomains?.[0]?.id as string;

    fireEvent.click(screen.getByRole('button', { name: /新建能力/i }));
    const createDialog = screen.getByRole('dialog');
    fireEvent.change(within(createDialog).getByLabelText(/名称/), { target: { value: '计划能力' } });
    fireEvent.click(within(createDialog).getByRole('button', { name: /^创建$/i }));

    const bId = useOntologyStore.getState().project?.capabilities?.[0]?.id as string;
    await waitFor(() => {
      expect(screen.getByTestId(`business-chain-node-B-${bId}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(`business-chain-node-B-${bId}`));

    await waitFor(() => {
      expect(screen.getByTestId('business-chain-path')).toHaveTextContent('生产域/计划能力');
      expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'B', id: bId });
    });
  });

  it('should hide delete when value domain has child capability', async () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    fireEvent.click(screen.getByRole('button', { name: /业务链/i }));
    fireEvent.click(screen.getByRole('button', { name: /新建价值域/i }));
    fireEvent.change(screen.getByLabelText(/名称/i), { target: { value: '生产域' } });
    fireEvent.click(screen.getByRole('button', { name: /^创建$/i }));

    const aId = useOntologyStore.getState().project?.valueDomains?.[0]?.id as string;

    fireEvent.click(screen.getByRole('button', { name: /新建能力/i }));
    const createDialog = screen.getByRole('dialog');
    fireEvent.change(within(createDialog).getByLabelText(/名称/), { target: { value: '计划能力' } });
    fireEvent.click(within(createDialog).getByRole('button', { name: /^创建$/i }));

    fireEvent.click(screen.getByTestId(`business-chain-node-A-${aId}`));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /删除/i })).not.toBeInTheDocument();
    });
  });
});
