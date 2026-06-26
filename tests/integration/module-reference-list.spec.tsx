import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleReferenceList } from '@/components/ontology/module-reference-list';
import type { ModuleReferenceLink } from '@/lib/module-version/module-references';

describe('ModuleReferenceList — Integration', () => {
  // -----------------------------------------------------------------------
  // Test data
  // -----------------------------------------------------------------------
  const incomingRefs: ModuleReferenceLink[] = [
    { kind: 'B', id: 'b1', name: '业务对象-订单', relation: '关联' },
    { kind: 'C', id: 'c1', name: '事件-下单', relation: '触发' },
  ];

  const outgoingRefs: ModuleReferenceLink[] = [
    { kind: 'E1', id: 'e1', name: '系统-ERP', relation: '实现' },
  ];

  // -----------------------------------------------------------------------
  it('renders both incoming and outgoing reference lists', () => {
    render(<ModuleReferenceList incoming={incomingRefs} outgoing={outgoingRefs} />);

    // Section headers
    expect(screen.getByText('引用本节点')).toBeInTheDocument();
    expect(screen.getByText('本节点引用')).toBeInTheDocument();

    // Incoming items
    expect(screen.getByText('[B] 业务对象-订单 · 关联')).toBeInTheDocument();
    expect(screen.getByText('[C] 事件-下单 · 触发')).toBeInTheDocument();

    // Outgoing items
    expect(screen.getByText('[E1] 系统-ERP · 实现')).toBeInTheDocument();

    // Container testid
    expect(screen.getByTestId('module-reference-list')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('shows empty placeholder text when both arrays are empty', () => {
    render(<ModuleReferenceList incoming={[]} outgoing={[]} />);

    // Both sections should show "无"
    const emptyPlaceholders = screen.getAllByText('无');
    expect(emptyPlaceholders).toHaveLength(2);
  });

  // -----------------------------------------------------------------------
  it('handles mixed state — incoming present, outgoing empty', () => {
    render(<ModuleReferenceList incoming={incomingRefs} outgoing={[]} />);

    // Incoming items should render
    expect(screen.getByText('[B] 业务对象-订单 · 关联')).toBeInTheDocument();
    expect(screen.getByText('[C] 事件-下单 · 触发')).toBeInTheDocument();

    // Outgoing section should show "无"
    const emptyItems = screen.getAllByText('无');
    expect(emptyItems).toHaveLength(1);
  });

  // -----------------------------------------------------------------------
  it('renders correct data-testid on each list item', () => {
    render(<ModuleReferenceList incoming={incomingRefs} outgoing={outgoingRefs} />);

    expect(screen.getByTestId('module-ref-in-B-b1')).toBeInTheDocument();
    expect(screen.getByTestId('module-ref-in-C-c1')).toBeInTheDocument();
    expect(screen.getByTestId('module-ref-out-E1-e1')).toBeInTheDocument();
  });
});
