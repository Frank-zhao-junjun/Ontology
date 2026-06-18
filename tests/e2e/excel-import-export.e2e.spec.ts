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
vi.mock('@/components/ontology/manifest-export-dialog', () => ({
  ManifestExportDialog: () => React.createElement('div', { 'data-testid': 'manifest-export-dialog' }),
}));
vi.mock('@/components/ontology/publish-dialog', () => ({
  PublishDialog: () => React.createElement('div', { 'data-testid': 'publish-dialog' }),
}));
vi.mock('@/components/ontology/business-chain-tree', () => ({
  BusinessChainTree: () => React.createElement('div', { 'data-testid': 'business-chain-tree' }),
}));
vi.mock('@/components/ontology/business-chain-detail', () => ({
  BusinessChainDetail: () => React.createElement('div', { 'data-testid': 'business-chain-detail' }),
}));
vi.mock('@/components/ontology/element-library', () => ({
  ElementLibrary: () => React.createElement('div', { 'data-testid': 'element-library' }),
}));
vi.mock('@/components/ontology/warning-center', () => ({
  WarningCenter: () => React.createElement('div', { 'data-testid': 'warning-center' }),
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

function makeProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '测试项目',
    description: '测试',
    domain: { id: 'domain-1', name: '测试域', nameEn: 'Test', description: '' },
    dataModel: {
      id: 'dm-1', name: '数据模型', version: '1.0', domain: 'test',
      entities: [], relations: [], projects: [], businessScenarios: [],
      createdAt: '', updatedAt: '',
    } as OntologyProject['dataModel'],
    behaviorModel: null, ruleModel: null, processModel: null, eventModel: null,
    governanceModel: null, dataSourcesModel: null, metricsModel: null,
    valueDomains: [{ id: 'VD-001', name: '生产制造' }],
    capabilities: [{ id: 'CAP-001', name: '计划能力', parentId: 'VD-001' }],
    scenarios: [{ id: 'SC-001', name: 'MTS场景', parentId: 'CAP-001' }],
    epcProcesses: [],
    metaElements: [{ id: 'ACT-001', name: '生产订单下达', dimension: 'E2', confirmedVersion: 'v1' }],
    moduleVersionRecords: [{
      id: 'mvr-A-VD-001-v1', moduleKind: 'A', moduleId: 'VD-001',
      status: 'confirmed', version: 'v1',
      confirmedAt: '2026-06-18T00:00:00.000Z', createdAt: '2026-06-18T00:00:00.000Z',
      snapshot: { id: 'VD-001', name: '生产制造' },
    }],
    createdAt: '2026-06-18T00:00:00.000Z',
    updatedAt: '2026-06-18T00:00:00.000Z',
  };
}

describe('Excel import/export E2E smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOntologyStore.setState({ project: makeProject() });
  });

  function renderWorkspace(project: OntologyProject) {
    return render(React.createElement(ModelingWorkspace, { project }));
  }

  it('AC-1: should show import/export button in toolbar', () => {
    renderWorkspace(makeProject());
    expect(screen.getByTestId('excel-dialog-trigger')).toBeDefined();
  });

  it('AC-1: should open dialog and show export tab', async () => {
    renderWorkspace(makeProject());
    fireEvent.click(screen.getByTestId('excel-dialog-trigger'));
    await waitFor(() => {
      expect(screen.getByText('Excel 分模块导入/导出')).toBeDefined();
    });
    expect(screen.getByTestId('tab-export')).toBeDefined();
    expect(screen.getByTestId('tab-import')).toBeDefined();
  });

  it('AC-2: should show export button in export tab', async () => {
    renderWorkspace(makeProject());
    fireEvent.click(screen.getByTestId('excel-dialog-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('export-btn')).toBeDefined();
    });
  });

  it('AC-2: import tab exists in dialog', async () => {
    renderWorkspace(makeProject());
    fireEvent.click(screen.getByTestId('excel-dialog-trigger'));
    await waitFor(() => {
      // Import tab trigger should be visible
      expect(screen.getByTestId('tab-import')).toBeDefined();
    });
  });

  it('AC-5: store has saveModuleDraft and rebuildUsageIndex', () => {
    renderWorkspace(makeProject());
    const state = useOntologyStore.getState();
    expect(state.saveModuleDraft).toBeDefined();
    expect(state.rebuildUsageIndex).toBeDefined();
  });
});
