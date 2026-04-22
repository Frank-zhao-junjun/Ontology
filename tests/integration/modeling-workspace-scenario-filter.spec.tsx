import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModelingWorkspace } from '@/components/ontology/modeling-workspace';
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

function getEntityCreateButton() {
  const buttons = screen.getAllByRole('button', { name: '+ 新建' });
  return buttons[buttons.length - 1];
}

function hasText(content: string) {
  return (_: string, element: Element | null) => {
    if (!element?.textContent?.includes(content)) {
      return false;
    }

    return Array.from(element.children).every(
      (child) => !child.textContent?.includes(content),
    );
  };
}

function createProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '合同管理本体',
    description: '测试项目',
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
        {
          id: 'entity-2',
          name: '收货单',
          nameEn: 'GoodsReceiptNote',
          projectId: 'module-1',
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

describe('US-2.3 / IT-BS-003: ModelingWorkspace 按业务场景过滤实体列表', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未选择业务场景时应禁用新建实体，并显示提示', () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    expect(getEntityCreateButton()).toBeDisabled();
    expect(screen.getByText(hasText('未选择业务场景'))).toBeInTheDocument();
    expect(screen.getByText(hasText('请先选择业务场景'))).toBeInTheDocument();
    expect(screen.getByText(hasText('实体必须在业务场景下创建'))).toBeInTheDocument();
  });

  it('切换业务场景后应只显示当前场景实体，并启用新建实体', () => {
    render(React.createElement(ModelingWorkspace, { project: createProject() }));

    fireEvent.click(screen.getByText('合同签订'));

    expect(getEntityCreateButton()).toBeEnabled();
    expect(screen.getByText(hasText('场景：合同签订'))).toBeInTheDocument();
    expect(screen.getByText('采购合同')).toBeInTheDocument();
    expect(screen.queryByText('收货单')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('到货登记'));

    expect(screen.getByText(hasText('场景：到货登记'))).toBeInTheDocument();
    expect(screen.getByText('收货单')).toBeInTheDocument();
    expect(screen.queryByText('采购合同')).not.toBeInTheDocument();
  });
});