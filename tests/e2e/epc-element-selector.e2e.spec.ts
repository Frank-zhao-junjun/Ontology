import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function createEmptyProject(): OntologyProject {
  return {
    id: 'proj-epc-sel',
    name: '要素选择器 E2E',
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
    metaElements: [],
    moduleVersionRecords: [],
    createdAt: now,
    updatedAt: now,
  };
}

function seedBusinessChainAndSelectEpc() {
  const store = useOntologyStore.getState();
  const a = store.addValueDomain({ name: '生产域' });
  const b = store.addCapability(a.id, { name: '计划能力' });
  const c = store.addScenario(b.id, { name: 'MTS场景' });
  const epc = store.addEpcProcess(c.id, { name: '订单下达' });
  store.setSelectedBusinessChainNode({ kind: 'EPC', id: epc.id });
  return epc.id;
}

describe('E2E-EPC-ELEMENT-SELECTOR-001 @smoke', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createEmptyProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
      selectedBusinessChainNode: null,
    });
  });

  it('@smoke 用户可在 EPC 步骤内联新建要素并保存', async () => {
    const project = useOntologyStore.getState().project!;
    render(React.createElement(ModelingWorkspace, { project }));

    fireEvent.click(screen.getByRole('tab', { name: /业务链/i }));
    seedBusinessChainAndSelectEpc();

    await waitFor(() => {
      expect(screen.getByTestId('epc-steps-editor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /添加步骤/i }));
    fireEvent.change(screen.getByLabelText(/步骤名称/i), { target: { value: '挂接步骤' } });

    fireEvent.click(screen.getByTestId('element-selector-trigger'));
    fireEvent.click(screen.getByTestId('element-selector-inline-new'));
    fireEvent.click(screen.getByTestId('inline-dimension-E1'));
    fireEvent.change(screen.getByLabelText(/要素名称/i), { target: { value: '订单实体' } });
    fireEvent.click(screen.getByRole('button', { name: /确认新建/i }));

    fireEvent.click(screen.getByRole('button', { name: /保存 EPC/i }));

    await waitFor(() => {
      const meta = useOntologyStore.getState().project?.metaElements ?? [];
      expect(meta.some((m) => m.name === '订单实体' && m.dimension === 'E1')).toBe(true);
    });
  });
});
