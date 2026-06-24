import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeAll } from 'vitest';
import EntityTree from '../EntityTree';

// Ant Design's Tree component relies on ResizeObserver, which
// is not available in happy-dom test environment. Must use
// a real constructor function (not vi.fn() wrapping) so it
// works with `new ResizeObserver(...)`.
beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

const sample = [{ key: 'd1', title: '销售', children: [
  { key: 's1', title: 'M2L', children: [
    { key: 'e1', title: 'Lead', data: { dimsConfirmed: 3 } }]}]}];

describe('EntityTree', () => {
  it('renders nodes', () => {
    render(<EntityTree data={sample} onSelect={() => {}} />);
    expect(screen.getByText('销售')).toBeInTheDocument();
  });

  it('shows badge 3/5', () => {
    render(<EntityTree data={sample} onSelect={() => {}} />);
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('fires onSelect', () => {
    const fn = vi.fn();
    render(<EntityTree data={sample} onSelect={fn} />);
    fireEvent.click(screen.getByText('Lead'));
    expect(fn).toHaveBeenCalledWith('e1');
  });
});
