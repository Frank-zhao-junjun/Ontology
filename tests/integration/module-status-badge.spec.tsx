import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleStatusBadge } from '@/components/ontology/module-status-badge';

describe('ModuleStatusBadge — Integration', () => {
  it('renders the correct badge label for each ModuleStatus', () => {
    const { rerender, unmount } = render(
      <ModuleStatusBadge status="draft" />
    );
    expect(screen.getByText('draft')).toBeInTheDocument();
    unmount();

    const { rerender: r2, unmount: u2 } = render(
      <ModuleStatusBadge status="confirmed" />
    );
    expect(screen.getByText('confirmed')).toBeInTheDocument();
    u2();

    const { rerender: r3 } = render(
      <ModuleStatusBadge status="archived" />
    );
    expect(screen.getByText('archived')).toBeInTheDocument();
  });

  it('renders the correct title attribute (tooltip) for each status', () => {
    const { unmount } = render(<ModuleStatusBadge status="draft" />);
    expect(screen.getByTitle('草稿：尚未确认的版本')).toBeInTheDocument();
    unmount();

    render(<ModuleStatusBadge status="confirmed" />);
    expect(screen.getByTitle('已确认：存在可用的已确认版本')).toBeInTheDocument();
  });
});
