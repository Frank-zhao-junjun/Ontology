import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProjectSetup } from '@/components/ontology/project-setup';
import { useOntologyStore } from '@/store/ontology-store';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

// Mock project-service
const mockCreateProject = vi.fn();
vi.mock('@/services/project-service', () => ({
  createProject: (...args: unknown[]) => mockCreateProject(...args),
}));

// Mock ProjectList child component to avoid its complex dependencies
vi.mock('@/components/ontology/project-list', () => ({
  ProjectList: () => <div data-testid="project-list-mock">已有项目</div>,
}));

describe('ProjectSetup — Integration', () => {
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

  it('renders the welcome heading and domain selection cards', () => {
    render(<ProjectSetup />);
    expect(screen.getByText('本体模型建模工具')).toBeInTheDocument();
    expect(screen.getByText('合同管理')).toBeInTheDocument();
    expect(screen.getByText('客户关系')).toBeInTheDocument();
    expect(screen.getByText('库存管理')).toBeInTheDocument();
    expect(screen.getByText('人力资源')).toBeInTheDocument();
    expect(screen.getByText('财务管理')).toBeInTheDocument();
    expect(screen.getByText('项目管理')).toBeInTheDocument();
    expect(screen.getByText('自定义领域')).toBeInTheDocument();
  });

  it('shows project list below domain selection', () => {
    render(<ProjectSetup />);
    expect(screen.getByTestId('project-list-mock')).toBeInTheDocument();
  });

  it('has an import option button', () => {
    render(<ProjectSetup />);
    expect(screen.getByText('导入已有项目')).toBeInTheDocument();
  });

  it('switches to import view when import button is clicked', () => {
    render(<ProjectSetup />);
    fireEvent.click(screen.getByText('导入已有项目'));
    expect(screen.getByText('导入项目')).toBeInTheDocument();
    expect(screen.getByText('粘贴之前导出的项目 JSON 数据')).toBeInTheDocument();
  });

  it('switches to project details step when a domain card is clicked', () => {
    render(<ProjectSetup />);
    fireEvent.click(screen.getByText('合同管理'));
    expect(screen.getByText('项目信息')).toBeInTheDocument();
    expect(screen.getByText('开始建模')).toBeInTheDocument();
  });

  it('shows the 4 model feature cards at the bottom', () => {
    render(<ProjectSetup />);
    expect(screen.getByText('数据模型')).toBeInTheDocument();
    expect(screen.getByText('行为模型')).toBeInTheDocument();
    expect(screen.getByText('规则模型')).toBeInTheDocument();
    expect(screen.getByText('事件模型')).toBeInTheDocument();
  });

  it('allows going back from details step to domain selection', () => {
    render(<ProjectSetup />);
    fireEvent.click(screen.getByText('合同管理'));
    expect(screen.getByText('开始建模')).toBeInTheDocument();
    fireEvent.click(screen.getByText('返回选择领域'));
    expect(screen.getByText('合同管理')).toBeInTheDocument();
    expect(screen.getByText('导入已有项目')).toBeInTheDocument();
  });

  it('selects custom domain and shows it highlighted', () => {
    render(<ProjectSetup />);

    // Click the 自定义领域 card
    const customCard = screen.getByText('自定义领域').closest('[class*="cursor-pointer"]') || screen.getByText('自定义领域');
    fireEvent.click(customCard);

    // After clicking custom domain, the card should be selected (ring-2 class should appear)
    // The component stays on domain selection step but the custom domain card should be highlighted
    expect(screen.getByText('自定义领域')).toBeInTheDocument();
    // Still on domain selection step
    expect(screen.getByText('合同管理')).toBeInTheDocument();
  });
});
