import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SideEffectSection } from '@/components/ontology/side-effect-section';

const sampleSideEffects = [
  { id: 'se-1', type: 'notification', description: '发送邮件通知', async: true },
  { id: 'se-2', type: 'sync', description: '同步到 ERP', async: false },
  { id: 'se-3', type: 'log', description: '', async: true },
];

describe('SideEffectSection — Integration', () => {
  it('renders a list of side effects with type badges', () => {
    render(<SideEffectSection sideEffects={sampleSideEffects} onChange={vi.fn()} />);
    expect(screen.getByText('副作用 (Side Effects)')).toBeInTheDocument();
    expect(screen.getByText('notification')).toBeInTheDocument();
    expect(screen.getByText('sync')).toBeInTheDocument();
    expect(screen.getByText('log')).toBeInTheDocument();
  });

  it('shows (无描述) placeholder for empty description', () => {
    render(<SideEffectSection sideEffects={sampleSideEffects} onChange={vi.fn()} />);
    expect(screen.getByText('(无描述)')).toBeInTheDocument();
  });

  it('shows async badge for async side effects', () => {
    render(<SideEffectSection sideEffects={sampleSideEffects} onChange={vi.fn()} />);
    const asyncBadges = screen.getAllByText('异步');
    expect(asyncBadges).toHaveLength(2);
  });

  it('renders add button and opens form', () => {
    render(<SideEffectSection sideEffects={sampleSideEffects} onChange={vi.fn()} />);
    const addBtn = screen.getByText('添加');
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(screen.getByText('类型')).toBeInTheDocument();
  });
});
