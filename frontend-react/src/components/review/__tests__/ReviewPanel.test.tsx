import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReviewPanel from '../ReviewPanel';

// Mock ResizeObserver for Ant Design components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as any;

// Mock matchMedia for Ant Design responsive observer
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

describe('ReviewPanel', () => {
  it('renders 5 dim blocks', () => {
    render(<ReviewPanel entityName="Lead" />);
    expect(screen.getByText('维1: 静态结构')).toBeInTheDocument();
    expect(screen.getByText('维2: 动态行为')).toBeInTheDocument();
    expect(screen.getByText('维3: 规则约束')).toBeInTheDocument();
    expect(screen.getByText('维4: 事件消息')).toBeInTheDocument();
    expect(screen.getByText('维5: 外部接口')).toBeInTheDocument();
  });
});
