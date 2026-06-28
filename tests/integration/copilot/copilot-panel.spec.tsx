import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelingCopilotPanel } from '@/components/ontology/copilot/modeling-copilot-panel';

// Mock store for buildProjectContext
vi.mock('@/store/ontology-store', () => ({
  useOntologyStore: vi.fn((sel) => {
    const state = {
      project: null,
      addReferenceDocument: vi.fn(),
    };
    return typeof sel === 'function' ? sel(state) : state;
  }),
}));

describe('ModelingCopilotPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-P0-01 renders copilot panel', () => {
    render(<ModelingCopilotPanel projectName="测试项目" defaultWidth={360} />);
    expect(screen.getByTestId('modeling-copilot-panel')).toBeInTheDocument();
  });

  it('TC-P0-02 shows header', () => {
    render(<ModelingCopilotPanel projectName="测试项目" defaultWidth={360} />);
    const headers = screen.getAllByText('AI建模', { exact: false });
    expect(headers.length).toBeGreaterThanOrEqual(1);
  });

  it('TC-P0-03 shows suggestion buttons when no messages', () => {
    render(<ModelingCopilotPanel projectName="测试项目" defaultWidth={360} />);
    expect(screen.getByText('创建价值域')).toBeInTheDocument();
    expect(screen.getByText('生成要素')).toBeInTheDocument();
    expect(screen.getByText('项目摘要')).toBeInTheDocument();
  });

  it('TC-P0-04 shows upload button', () => {
    render(<ModelingCopilotPanel projectName="测试项目" defaultWidth={360} />);
    expect(screen.getByText('上传文档')).toBeInTheDocument();
  });
});
