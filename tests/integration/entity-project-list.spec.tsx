import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModelingWorkspace } from '@/components/ontology/modeling-workspace';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';

vi.mock('@/hooks/use-project-sync', () => ({
  useProjectSync: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
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

const now = '2026-04-21T00:00:00.000Z';

function resetStore() {
  useOntologyStore.setState({
    project: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: null,
  });
}

function StoreBackedWorkspace() {
  const project = useOntologyStore((state) => state.project);

  if (!project) {
    return null;
  }

  return React.createElement(ModelingWorkspace, { project });
}

function renderWorkspace(project: OntologyProject) {
  resetStore();
  useOntologyStore.setState({
    project,
    versions: [],
    activeModelType: 'data',
  });

  return render(React.createElement(StoreBackedWorkspace));
}

function createProjectFixture(): OntologyProject {
  return {
    id: 'proj-1',
    name: '合同管理本体',
    description: '项目分组列表测试',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同领域',
    },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [
        {
          id: 'module-1',
          name: '合同中心',
          nameEn: 'ContractCenter',
          color: '#3b82f6',
        },
        {
          id: 'module-2',
          name: '供应商中心',
          nameEn: 'VendorCenter',
          color: '#22c55e',
        },
        {
          id: 'module-3',
          name: '档案中心',
          nameEn: 'ArchiveCenter',
          color: '#f59e0b',
        },
      ],
      businessScenarios: [
        {
          id: 'scenario-1',
          name: '合同签订',
          nameEn: 'ContractSigning',
          description: '合同签订业务场景',
          projectId: 'module-1',
          color: '#3b82f6',
        },
        {
          id: 'scenario-2',
          name: '供应商准入',
          nameEn: 'VendorOnboarding',
          description: '供应商准入场景',
          projectId: 'module-2',
          color: '#22c55e',
        },
      ],
      entities: [
        {
          id: 'entity-1',
          name: '采购合同',
          nameEn: 'PurchaseContract',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'aggregate_root',
          attributes: [],
          relations: [],
        },
        {
          id: 'entity-2',
          name: '供应商',
          nameEn: 'Vendor',
          projectId: 'module-2',
          businessScenarioId: 'scenario-2',
          entityRole: 'aggregate_root',
          attributes: [],
          relations: [],
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    epcModel: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe('US-1.1 / IT-PROJ-001: project list filters modeling context and respects delete strategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('选中项目后应只显示该项目下的业务场景与实体', () => {
    renderWorkspace(createProjectFixture());

    expect(screen.getByTestId('entity-project-module-1')).toHaveTextContent('1');
    expect(screen.getByTestId('entity-project-module-2')).toHaveTextContent('1');
    expect(screen.getByTestId('entity-project-module-3')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('供应商中心'));

    expect(screen.queryByTestId('business-scenario-scenario-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('business-scenario-scenario-2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('供应商准入'));

    expect(screen.getByText('供应商')).toBeInTheDocument();
    expect(screen.queryByText('采购合同')).not.toBeInTheDocument();
  });

  it('删除当前选中的空项目后应回退到全部项目', () => {
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmSpy);

    renderWorkspace(createProjectFixture());

    fireEvent.click(screen.getByText('档案中心'));
    fireEvent.click(screen.getByRole('button', { name: '删除项目分类 档案中心' }));

    expect(confirmSpy).toHaveBeenCalledWith('确定要删除项目分类 "档案中心" 吗？');
    expect(screen.queryByTestId('entity-project-module-3')).not.toBeInTheDocument();
    expect(screen.getByText(/全部项目 · 未选择业务场景 · 0 个实体/)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('删除有关联实体的项目时应提示错误并保留项目', () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);

    renderWorkspace(createProjectFixture());

    fireEvent.click(screen.getByRole('button', { name: '删除项目分类 合同中心' }));

    expect(alertSpy).toHaveBeenCalledWith('该项目下有 1 个实体，请先删除或移动这些实体后再删除项目');
    expect(screen.getByTestId('entity-project-module-1')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});