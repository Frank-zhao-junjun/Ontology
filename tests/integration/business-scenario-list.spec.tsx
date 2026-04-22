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

function createProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '合同管理本体',
    description: '业务场景列表测试',
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
      ],
      businessScenarios: [
        {
          id: 'scenario-1',
          name: '合同签订',
          nameEn: 'ContractSigning',
          description: '合同签订流程',
          projectId: 'module-1',
          color: '#3b82f6',
        },
        {
          id: 'scenario-2',
          name: '到货登记',
          nameEn: 'GoodsReceipt',
          description: '到货验收流程',
          projectId: 'module-1',
          color: '#f59e0b',
        },
        {
          id: 'scenario-3',
          name: '供应商准入',
          nameEn: 'VendorOnboarding',
          description: '供应商引入审批',
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
          name: '合同条款',
          nameEn: 'ContractClause',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'child_entity',
          parentAggregateId: 'entity-1',
          attributes: [],
          relations: [],
        },
        {
          id: 'entity-3',
          name: '收货单',
          nameEn: 'GoodsReceiptNote',
          projectId: 'module-1',
          businessScenarioId: 'scenario-2',
          entityRole: 'aggregate_root',
          attributes: [],
          relations: [],
        },
        {
          id: 'entity-4',
          name: '供应商',
          nameEn: 'Vendor',
          projectId: 'module-2',
          businessScenarioId: 'scenario-3',
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

describe('US-1.3 / IT-BS-LIST-001: business scenario list supports project filtering, counts, and search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('按项目切换时应只显示当前项目下的业务场景', () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    expect(screen.getByTestId('business-scenario-scenario-1')).toBeInTheDocument();
    expect(screen.getByTestId('business-scenario-scenario-2')).toBeInTheDocument();
    expect(screen.getByTestId('business-scenario-scenario-3')).toBeInTheDocument();

    fireEvent.click(screen.getByText('合同中心'));

    expect(screen.getByTestId('business-scenario-scenario-1')).toBeInTheDocument();
    expect(screen.getByTestId('business-scenario-scenario-2')).toBeInTheDocument();
    expect(screen.queryByTestId('business-scenario-scenario-3')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('供应商中心'));

    expect(screen.queryByTestId('business-scenario-scenario-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('business-scenario-scenario-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('business-scenario-scenario-3')).toBeInTheDocument();
  });

  it('应显示每个业务场景下的实体数量', () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    expect(screen.getByTestId('business-scenario-count-scenario-1')).toHaveTextContent('2');
    expect(screen.getByTestId('business-scenario-count-scenario-2')).toHaveTextContent('1');
    expect(screen.getByTestId('business-scenario-count-scenario-3')).toHaveTextContent('1');
  });

  it('应支持按名称、英文名或描述搜索业务场景', () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    fireEvent.change(screen.getByRole('textbox', { name: '搜索业务场景' }), { target: { value: '到货' } });

    expect(screen.queryByTestId('business-scenario-scenario-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('business-scenario-scenario-2')).toBeInTheDocument();
    expect(screen.queryByTestId('business-scenario-scenario-3')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: '搜索业务场景' }), { target: { value: 'VendorOnboarding' } });

    expect(screen.queryByTestId('business-scenario-scenario-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('business-scenario-scenario-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('business-scenario-scenario-3')).toBeInTheDocument();
  });
});