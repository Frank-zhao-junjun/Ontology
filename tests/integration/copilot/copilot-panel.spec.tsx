import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelingCopilotPanel } from '@/components/ontology/copilot/modeling-copilot-panel';

vi.mock('@copilotkit/react-ui', () => ({
  CopilotSidebar: () => <div data-testid="copilot-sidebar-mock" />,
}));

describe('ModelingCopilotPanel', () => {
  it('TC-P0-01 renders copilot panel test id', () => {
    render(<ModelingCopilotPanel projectName="测试项目" defaultWidth={360} />);
    expect(screen.getByTestId('modeling-copilot-panel')).toBeInTheDocument();
  });

  it('TC-P0-02 shows footer draft hint', () => {
    render(<ModelingCopilotPanel projectName="测试项目" defaultWidth={360} />);
    expect(screen.getByText(/所有写入均为草稿/)).toBeInTheDocument();
  });
});
