import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ModelingWorkspace } from '@/components/ontology/modeling-workspace';
import { useOntologyStore } from '@/store/ontology-store';
import type { EpcProcess, MetaElement, OntologyProject } from '@/types/ontology';

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
    id: 'proj-validation',
    name: '校验 E2E',
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
      projects: [{ id: 'ep-1', name: '默认', nameEn: 'Default', color: '#3b82f6', createdAt: now, updatedAt: now }],
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

describe('E2E-EPC-VALIDATION-001 @smoke', () => {
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

  it('@smoke 用户选中已确认场景可查看三栏校验面板并切换 VX 问题列表', async () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });
    const c = store.addScenario(b.id, {
      name: 'MTS场景',
      semantics: { triggerPhrases: ['未知动作'] },
    });
    const epcProcess = store.addEpcProcess(c.id, { name: '主流程' });

    store.confirmModule('C', c.id);
    store.confirmModule('EPC', epcProcess.id);

    const epcWithSteps: EpcProcess = {
      ...epcProcess,
      steps: [{
        id: 's1',
        name: '步1',
        elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' },
      }],
    };

    const metaElements: MetaElement[] = [
      { id: 'e1', name: '订单', nameEn: 'Order', dimension: 'E1' },
    ];

    useOntologyStore.setState({
      project: {
        ...useOntologyStore.getState().project!,
        epcProcesses: [epcWithSteps],
        metaElements,
        behaviorModel: {
          id: 'bm-1',
          name: '行为',
          version: '1',
          domain: 'domain-1',
          stateMachines: [{
            id: 'sm-1',
            name: 'SM',
            entity: 'Order',
            statusField: 'status',
            states: [],
            transitions: [],
            actions: [{ id: 'act-1', name: '提交', actionType: 'update' }],
          }],
          createdAt: now,
          updatedAt: now,
        },
      },
      selectedBusinessChainNode: { kind: 'C', id: c.id },
    });

    render(React.createElement(ModelingWorkspace, { project: useOntologyStore.getState().project! }));
    fireEvent.click(screen.getByRole('button', { name: /业务链/i }));

    await waitFor(() => {
      expect(screen.getByTestId('epc-validation-panel')).toBeInTheDocument();
    });

    expect(screen.getByTestId('vp-tab-ve')).toBeInTheDocument();
    expect(screen.getByTestId('vp-tab-vm')).toBeInTheDocument();
    expect(screen.getByTestId('vp-tab-vx')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('vp-tab-vx'));
    await waitFor(() => {
      expect(screen.getByTestId('vp-vx-0')).toBeInTheDocument();
    });
    expect(screen.getByTestId('vp-vx-0')).toHaveTextContent('VX-09');

    fireEvent.click(screen.getByTestId('vp-tab-vm'));
    expect(screen.getByTestId('epc-coverage-panel')).toBeInTheDocument();
  });
});
