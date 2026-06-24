import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ElementSelector } from '@/components/ontology/element-selector';
import type { MetaElement } from '@/types/ontology';

const metaElements: MetaElement[] = [
  { id: 'el-1', name: '订单实体', nameEn: 'Order', dimension: 'E1' },
  { id: 'el-4', name: '库存规则', dimension: 'E4' },
];

describe('ElementSelector (US-S06-U02)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should show grouped elements and select existing', () => {
    const onChange = vi.fn();
    render(
      <ElementSelector
        metaElements={metaElements}
        onChange={onChange}
        generateId={() => 'new-id'}
      />,
    );

    fireEvent.click(screen.getByTestId('element-selector-trigger'));
    expect(screen.getByText('E1 数据')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('element-option-el-1'));

    expect(onChange).toHaveBeenCalledWith({
      dimension: 'E1',
      elementId: 'el-1',
      versionPin: 'latest_confirmed',
    });
  });

  it('should filter by search query', () => {
    render(
      <ElementSelector
        metaElements={metaElements}
        onChange={vi.fn()}
        generateId={() => 'new-id'}
      />,
    );

    fireEvent.click(screen.getByTestId('element-selector-trigger'));
    fireEvent.change(screen.getByTestId('element-selector-search'), { target: { value: '库存' } });
    expect(screen.getByTestId('element-option-el-4')).toBeInTheDocument();
    expect(screen.queryByTestId('element-option-el-1')).not.toBeInTheDocument();
  });

  it('should create inline element via dialog', () => {
    const onChange = vi.fn();
    render(
      <ElementSelector
        metaElements={metaElements}
        onChange={onChange}
        generateId={() => 'inline-99'}
      />,
    );

    fireEvent.click(screen.getByTestId('element-selector-trigger'));
    fireEvent.click(screen.getByTestId('element-selector-inline-new'));
    fireEvent.click(screen.getByTestId('inline-dimension-E2'));
    fireEvent.change(screen.getByLabelText(/要素名称/i), { target: { value: '新行为' } });
    fireEvent.click(screen.getByRole('button', { name: /确认新建/i }));

    expect(onChange).toHaveBeenCalledWith({
      dimension: 'E2',
      elementId: 'inline-99',
      versionPin: 'latest_confirmed',
      inlineNew: true,
      inlinePayload: { name: '新行为' },
    });
  });

  it('should display selected element name', () => {
    render(
      <ElementSelector
        metaElements={metaElements}
        value={{
          dimension: 'E1',
          elementId: 'el-1',
          versionPin: 'latest_confirmed',
        }}
        onChange={vi.fn()}
        generateId={() => 'x'}
      />,
    );

    expect(screen.getByTestId('element-selector-trigger')).toHaveTextContent('订单实体');
  });
});
