import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@copilotkit/react-core', () => ({
  CopilotKit: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useCopilotAction: vi.fn(),
  useCopilotAdditionalInstructions: vi.fn(),
}));

vi.mock('@copilotkit/react-ui', () => ({
  CopilotSidebar: () => React.createElement('div', { 'data-testid': 'copilot-sidebar-mock' }),
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

const now = '2026-06-27T12:00:00.000Z';

function createProject(): OntologyProject {
  return {
    id: 'proj-copilot-smoke',
    name: 'Copilot Smoke',
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
      projects: [],
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
    metaElements: [],
    moduleVersionRecords: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('Copilot smoke — TC-01 @smoke', () => {
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

  it('@smoke modeling workspace shows copilot panel', async () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    await waitFor(() => {
      expect(screen.getByTestId('modeling-copilot-panel')).toBeInTheDocument();
    });
  });
});

describe('Copilot EPC smoke — TC-07 @smoke', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('EPC Smoke', createProject().domain);
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划' });
    const c = store.addScenario(b.id, { name: '排产' });
    const epc = store.addEpcProcess(c.id, { name: '订单处理' });
    store.applyAiEpcDraft(epc.id, [
      { id: 'step-1', name: '接收订单' },
      { id: 'step-2', name: '审核' },
    ]);
  });

  it('@smoke applyAiEpcDraft writes steps to store', () => {
    const project = useOntologyStore.getState().project!;
    const epc = project.epcProcesses?.[0];
    expect(epc?.steps).toHaveLength(2);
    expect(epc?.steps[0].name).toBe('接收订单');
  });
});
