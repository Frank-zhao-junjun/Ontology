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

function createProject(): OntologyProject {
  return {
    id: 'proj-el-lib',
    name: '要素库 E2E',
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
    metaElements: [
      { id: 'used', name: '已引用要素', dimension: 'E1', usageRefs: [{ epcId: 'e1', stepId: 's1', scenarioId: 'c1', versionPin: 'latest_confirmed' }] },
      { id: 'orphan', name: '孤儿要素', dimension: 'E1' },
    ],
    moduleVersionRecords: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('E2E-ELEMENT-LIBRARY-001 @smoke', () => {
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

  it('@smoke 用户可打开要素库并筛选未引用要素', async () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    fireEvent.click(screen.getByRole('button', { name: /要素库/i }));

    await waitFor(() => {
      expect(screen.getByTestId('element-library')).toBeInTheDocument();
    });

    expect(screen.getByTestId('element-row-used')).toBeInTheDocument();
    expect(screen.getByTestId('element-row-orphan')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('element-library-unreferenced-toggle'));

    await waitFor(() => {
      expect(screen.queryByTestId('element-row-used')).not.toBeInTheDocument();
      expect(screen.getByTestId('element-row-orphan')).toBeInTheDocument();
    });
  });
});
