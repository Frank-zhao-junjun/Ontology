import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DimensionBlock from '../DimensionBlock';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as any;

describe('DimensionBlock', () => {
  it('renders title and status', () => {
    render(<DimensionBlock title="维1" status="pending" onConfirm={vi.fn()} onRegenerate={vi.fn()}><p>x</p></DimensionBlock>);
    expect(screen.getByText('维1')).toBeInTheDocument();
    expect(screen.getByText('待确认')).toBeInTheDocument();
  });
  it('calls onConfirm', () => {
    const fn = vi.fn();
    render(<DimensionBlock title="X" status="pending" onConfirm={fn} onRegenerate={vi.fn()}><p>x</p></DimensionBlock>);
    fireEvent.click(screen.getByText('确认'));
    expect(fn).toHaveBeenCalled();
  });
});
