import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModelingWorkspace } from '@/components/ontology/modeling-workspace';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, OntologyProject } from '@/types/ontology';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), message: vi.fn() },
}));

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn(), refresh: vi.fn() }),
}));

// Mock use-confirm
const mockConfirmFn = vi.fn();
vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => ({
    confirm: mockConfirmFn,
    ConfirmDialog: <div data-testid="confirm-dialog" />,
  }),
}));

// Mock project-service
vi.mock('@/services/project-service', () => ({
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

// Mock child components
vi.mock('@/components/ontology/business-chain-tree', () => ({
  BusinessChainTree: () => <div data-testid="business-chain-tree" />,
}));

vi.mock('@/components/ontology/business-chain-detail', () => ({
  BusinessChainDetail: ({ onNavigateToElement }: { onNavigateToElement?: (id: string, dim: string) => void }) =>
    <div data-testid="business-chain-detail" />,
}));

vi.mock('@/components/ontology/element-library', () => ({
  ElementLibrary: (props: Record<string, unknown>) => <div data-testid="element-library" />,
}));

vi.mock('@/components/ontology/warning-center', () => ({
  WarningCenter: () => <div data-testid="warning-center" />,
}));

vi.mock('@/components/ontology/metrics-editor', () => ({
  MetricsEditor: () => <div data-testid="metrics-editor" />,
}));

vi.mock('@/components/ontology/governance-editor', () => ({
  GovernanceEditor: () => <div data-testid="governance-editor" />,
}));

vi.mock('@/components/ontology/data-source-editor', () => ({
  DataSourceEditor: () => <div data-testid="data-source-editor" />,
}));

vi.mock('@/components/ontology/hr-sync-manager', () => ({
  HRSyncManager: () => <div data-testid="hr-sync-manager" />,
}));

vi.mock('@/components/ontology/agent-skills-manager', () => ({
  AgentSkillsManager: () => <div data-testid="agent-skills-manager" />,
}));

vi.mock('@/components/ontology/publish-dialog', () => ({
  PublishDialog: () => <div data-testid="publish-dialog" />,
}));

vi.mock('@/components/ontology/manifest-export-dialog', () => ({
  ManifestExportDialog: () => <div data-testid="manifest-export-dialog" />,
}));

vi.mock('@/components/ontology/excel-import-export-dialog', () => ({
  ExcelImportExportDialog: () => <div data-testid="excel-import-export-dialog" />,
}));

vi.mock('@/components/ontology/metadata-manager', () => ({
  MetadataManager: () => <div data-testid="metadata-manager" />,
}));

vi.mock('@/components/ontology/masterdata-manager', () => ({
  MasterDataManager: () => <div data-testid="masterdata-manager" />,
}));

vi.mock('@/components/ontology/manual-generator', () => ({
  ManualGenerator: ({ onBack }: { onBack: () => void }) =>
    <div data-testid="manual-generator">
      <button onClick={onBack} data-testid="manual-back-btn">返回</button>
    </div>,
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

function createTestProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '制造本体项目',
    description: '制造领域本体建模',
    domain,
    dataModel: {
      id: 'dm1',
      name: 'dm',
      version: '1.0.0',
      domain: 'd1',
      projects: [{ id: 'mod1', name: '模块', nameEn: 'Mod', color: '#000' }],
      businessScenarios: [],
      entities: [
        { id: 'e1', name: '物料', nameEn: 'Material', projectId: 'mod1', businessScenarioId: 'global', entityRole: 'aggregate_root', attributes: [], relations: [] },
        { id: 'e2', name: '订单', nameEn: 'Order', projectId: 'mod1', businessScenarioId: 'global', entityRole: 'aggregate_root', attributes: [], relations: [] },
      ],
      createdAt: '2026-06-18T12:00:00.000Z',
      updatedAt: '2026-06-18T12:00:00.000Z',
    },
    behaviorModel: {
      id: 'bm1',
      name: '行为模型',
      version: '1.0.0',
      domain: 'd1',
      stateMachines: [{ id: 'sm1', name: '订单状态机', entity: 'e2', statusField: 'status', states: [], transitions: [] }],
      createdAt: '2026-06-18T12:00:00.000Z',
      updatedAt: '2026-06-18T12:00:00.000Z',
    },
    ruleModel: {
      id: 'rm1',
      name: '规则模型',
      version: '1.0.0',
      domain: 'd1',
      rules: [{
        id: 'r1',
        name: '金额校验',
        type: 'field_validation',
        entity: 'e1',
        condition: { type: 'expression', expression: 'amount > 0' },
        errorMessage: '金额必须大于 0',
      }],
      createdAt: '2026-06-18T12:00:00.000Z',
      updatedAt: '2026-06-18T12:00:00.000Z',
    },
    eventModel: {
      id: 'em1',
      name: '事件模型',
      version: '1.0.0',
      domain: 'd1',
      events: [],
      subscriptions: [],
      createdAt: '2026-06-18T12:00:00.000Z',
      updatedAt: '2026-06-18T12:00:00.000Z',
    },
    processModel: null,
    createdAt: '2026-06-18T12:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z',
  };
}

describe('ModelingWorkspace — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
  });

  it('renders project name and domain badge in header', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    expect(screen.getByText('制造本体项目')).toBeInTheDocument();
    expect(screen.getByText('离散制造')).toBeInTheDocument();
  });

  it('renders the export dropdown button', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    expect(screen.getByTestId('header-export-dropdown')).toBeInTheDocument();
  });

  it('renders all workspace tabs', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    expect(screen.getByText('业务链')).toBeInTheDocument();
    expect(screen.getByText('要素库')).toBeInTheDocument();
    expect(screen.getByText('警示')).toBeInTheDocument();
    expect(screen.getByText('指标')).toBeInTheDocument();
    expect(screen.getByText('治理')).toBeInTheDocument();
    expect(screen.getByText('数据源')).toBeInTheDocument();
    expect(screen.getByText('HR同步')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  it('shows business chain view by default with tree and detail', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    expect(screen.getByTestId('business-chain-tree')).toBeInTheDocument();
    expect(screen.getByTestId('business-chain-detail')).toBeInTheDocument();
  });

  it('switches to element library tab on click', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    fireEvent.click(screen.getByText('要素库'));
    expect(screen.getByTestId('element-library')).toBeInTheDocument();
  });

  it('switches to warnings tab on click', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    fireEvent.click(screen.getByText('警示'));
    expect(screen.getByTestId('warning-center')).toBeInTheDocument();
  });

  it('switches to metrics tab on click', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    fireEvent.click(screen.getByText('指标'));
    expect(screen.getByTestId('metrics-editor')).toBeInTheDocument();
  });

  it('switches to governance tab on click', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    fireEvent.click(screen.getByText('治理'));
    expect(screen.getByTestId('governance-editor')).toBeInTheDocument();
  });

  it('switches to data sources tab on click', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    fireEvent.click(screen.getByText('数据源'));
    expect(screen.getByTestId('data-source-editor')).toBeInTheDocument();
  });

  it('switches to HR sync tab on click', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    fireEvent.click(screen.getByText('HR同步'));
    expect(screen.getByTestId('hr-sync-manager')).toBeInTheDocument();
  });

  it('switches to Agent tab on click', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    fireEvent.click(screen.getByText('Agent'));
    expect(screen.getByTestId('agent-skills-manager')).toBeInTheDocument();
  });

  it('shows status bar with entity and state machine counts', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    expect(screen.getByTestId('workspace-status-bar')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 entities
    expect(screen.getByText('实体')).toBeInTheDocument();
    expect(screen.getByText('状态机')).toBeInTheDocument();
    expect(screen.getByText('规则')).toBeInTheDocument();
    expect(screen.getByText('事件')).toBeInTheDocument();
  });

  it('shows export dropdown in header', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    expect(screen.getByTestId('header-export-dropdown')).toBeInTheDocument();
  });

  it('has theme toggle in header', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders with testid', () => {
    render(<ModelingWorkspace project={createTestProject()} />);
    expect(screen.getByTestId('modeling-workspace')).toBeInTheDocument();
  });
});
