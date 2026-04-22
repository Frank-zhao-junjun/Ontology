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

function getBusinessScenarioCreateButton() {
  const buttons = screen.getAllByRole('button', { name: '+ 新建' });
  return buttons[1];
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

function createProject(scenarioCount = 1): OntologyProject {
  const businessScenarios = Array.from({ length: scenarioCount }, (_, index) => ({
    id: `scenario-${index + 1}`,
    name: `业务场景${index + 1}`,
    nameEn: `Scenario${index + 1}`,
    description: `业务场景${index + 1}描述`,
    projectId: 'module-1',
    color: '#3b82f6',
  }));

  return {
    id: 'proj-1',
    name: '合同管理本体',
    description: '业务场景项目边界测试',
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
      ],
      businessScenarios,
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

function createCrudProject(): OntologyProject {
  return {
    ...createProject(2),
    dataModel: {
      ...createProject(2).dataModel!,
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
          name: '到货登记',
          nameEn: 'GoodsReceipt',
          description: '到货登记业务场景',
          projectId: 'module-1',
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
      ],
    },
  };
}

describe('US-1.2 / IT-BS-004: business scenarios require an explicit project selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('未选具体项目时应禁用业务场景创建，选中项目后才允许创建', () => {
    renderWorkspace(createProject());

    expect(getBusinessScenarioCreateButton()).toBeDisabled();

    fireEvent.click(screen.getByText('合同中心'));

    expect(getBusinessScenarioCreateButton()).toBeEnabled();
  });

  it('选中项目且该项目已有 10 个业务场景时应禁用创建入口并显示上限提示', () => {
    renderWorkspace(createProject(10));

    fireEvent.click(screen.getByText('合同中心'));

    expect(getBusinessScenarioCreateButton()).toBeDisabled();
    expect(screen.getByText('每个项目最多创建 10 个业务场景。')).toBeInTheDocument();
  });

  it('应支持在工作台编辑业务场景名称', () => {
    renderWorkspace(createCrudProject());

    fireEvent.click(screen.getByRole('button', { name: '编辑业务场景 合同签订' }));
    fireEvent.change(screen.getByDisplayValue('合同签订'), { target: { value: '合同审批' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('合同审批')).toBeInTheDocument();
    expect(screen.queryByText('合同签订')).not.toBeInTheDocument();
  });

  it('删除业务场景时应拦截有关联实体的场景，并允许删除无关联场景', () => {
    const alertSpy = vi.fn();
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('alert', alertSpy);
    vi.stubGlobal('confirm', confirmSpy);

    renderWorkspace(createCrudProject());

    fireEvent.click(screen.getByRole('button', { name: '删除业务场景 合同签订' }));

    expect(alertSpy).toHaveBeenCalledWith('该业务场景下有 1 个实体，请先删除或移动这些实体后再删除业务场景');
    expect(screen.getByText('合同签订')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '删除业务场景 到货登记' }));

    expect(confirmSpy).toHaveBeenCalledWith('确定要删除业务场景 "到货登记" 吗？');
    expect(screen.queryByText('到货登记')).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});