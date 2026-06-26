import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PublishDialog } from '@/components/ontology/publish-dialog';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, OntologyProject } from '@/types/ontology';

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

const domain: Domain = {
  id: 'd1',
  name: '测试',
  nameEn: 'Test',
  description: '',
  icon: 'factory',
  color: '#000',
};

function createTestProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '测试项目',
    description: '测试项目描述',
    domain,
    dataModel: { id: 'dm1', name: 'dm', version: '1.0.0', domain: 'd1', projects: [], businessScenarios: [], entities: [], createdAt: '', updatedAt: '' },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  };
}

describe('PublishDialog — Integration', () => {
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
    useOntologyStore.getState().createProject('测试项目', domain);
    useOntologyStore.setState({ project: createTestProject() });
  });

  it('renders the dropdown trigger button with label', () => {
    render(<PublishDialog />);
    expect(screen.getByText('快照与历史')).toBeInTheDocument();
  });

  it('renders snapshot dialog content when openSnap is controlled', () => {
    render(<PublishDialog openSnap={true} hideTrigger />);
    expect(screen.getByText('保存草稿快照')).toBeInTheDocument();
    expect(screen.getByText('将当前建模项目保存为本地版本快照，并可选生成代码包')).toBeInTheDocument();
  });

  it('shows version number and name inputs in snapshot dialog', () => {
    render(<PublishDialog openSnap={true} hideTrigger />);
    const versionInput = screen.getByDisplayValue('1.0.0');
    expect(versionInput).toBeInTheDocument();
  });

  it('shows code package options in snapshot dialog', () => {
    render(<PublishDialog openSnap={true} hideTrigger />);
    expect(screen.getByText('代码包选项')).toBeInTheDocument();
    expect(screen.getByText('包含示例数据')).toBeInTheDocument();
    expect(screen.getByText('启用AI运行时助手')).toBeInTheDocument();
    expect(screen.getByText('生成Docker配置')).toBeInTheDocument();
  });

  it('shows model statistics in snapshot dialog', () => {
    render(<PublishDialog openSnap={true} hideTrigger />);
    expect(screen.getByText('当前模型快照')).toBeInTheDocument();
    expect(screen.getByText('实体')).toBeInTheDocument();
    expect(screen.getByText('状态机')).toBeInTheDocument();
    expect(screen.getByText('规则')).toBeInTheDocument();
    expect(screen.getByText('事件')).toBeInTheDocument();
  });

  it('shows history dialog with empty state when controlled', () => {
    render(<PublishDialog openHistory={true} hideTrigger />);
    expect(screen.getByText('快照历史')).toBeInTheDocument();
    expect(screen.getByText('暂无快照记录')).toBeInTheDocument();
  });

  it('shows save and cancel buttons in snapshot dialog', () => {
    render(<PublishDialog openSnap={true} hideTrigger />);
    expect(screen.getByText('保存快照')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });
});
