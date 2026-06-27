/**
 * DataModelEditor 组件最小渲染测试
 *
 * 测试 `button-only` 模式（不依赖 store）和默认渲染行为。
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataModelEditor } from '@/components/ontology/data-model-editor';

// Mock the store
vi.mock('@/store/ontology-store', () => ({
  useOntologyStore: vi.fn(() => ({
    project: null,
    addEntity: vi.fn(),
    updateEntity: vi.fn(),
    deleteEntity: vi.fn(),
    metadataList: [],
    masterDataList: [],
  })),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('DataModelEditor (button-only mode)', () => {
  it('R1: renders add entity button in button-only mode', () => {
    render(<DataModelEditor mode="button-only" />);
    expect(screen.getByText('+ 新建实体')).toBeInTheDocument();
  });

  it('R2: renders DialogTrigger with correct aria attributes', () => {
    render(<DataModelEditor mode="button-only" />);
    const btn = screen.getByText('+ 新建实体');
    // Radix Dialog wraps the button as a trigger
    expect(btn).toHaveAttribute('data-slot', 'dialog-trigger');
    expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
  });
});

describe('DataModelEditor (entity-detail mode)', () => {
  it('R3: shows empty state when no entity selected', () => {
    render(<DataModelEditor mode="entity-detail" />);
    expect(screen.getByText(/请从左侧选择一个实体/)).toBeInTheDocument();
  });
});

describe('DataModelEditor (default full mode)', () => {
  it('R4: renders entity list header in full mode', () => {
    render(<DataModelEditor />);
    expect(screen.getByText('实体列表')).toBeInTheDocument();
  });

  it('R5: renders new entity button in full mode', () => {
    render(<DataModelEditor />);
    expect(screen.getByText('+ 新建')).toBeInTheDocument();
  });
});
