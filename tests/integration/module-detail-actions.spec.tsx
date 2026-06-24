import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModuleDetailActions } from '@/components/ontology/module-detail-actions';

describe('ModuleDetailActions (US-S14-U02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show confirm and cancel for draft node', () => {
    render(
      <ModuleDetailActions
        kind="A"
        status="draft"
        hasDraft
        hasConfirmed={false}
        nextVersionLabel="v1"
        validationErrors={[]}
        readOnly={false}
        onConfirm={vi.fn()}
        onCancelEdit={vi.fn()}
        onFork={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    expect(screen.getByTestId('module-action-confirm')).toBeEnabled();
    expect(screen.getByTestId('module-action-cancel')).toBeInTheDocument();
    expect(screen.queryByTestId('module-action-fork')).not.toBeInTheDocument();
  });

  it('should show fork button for confirmed without draft', () => {
    render(
      <ModuleDetailActions
        kind="A"
        status="confirmed"
        hasDraft={false}
        hasConfirmed
        nextVersionLabel="v2"
        validationErrors={[]}
        readOnly={false}
        onConfirm={vi.fn()}
        onCancelEdit={vi.fn()}
        onFork={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    expect(screen.getByTestId('module-action-fork')).toBeInTheDocument();
    expect(screen.queryByTestId('module-action-confirm')).not.toBeInTheDocument();
  });

  it('should disable confirm when validation fails', () => {
    render(
      <ModuleDetailActions
        kind="A"
        status="draft"
        hasDraft
        hasConfirmed={false}
        nextVersionLabel="v1"
        validationErrors={[{ field: 'name', message: '名称不能为空' }]}
        readOnly={false}
        onConfirm={vi.fn()}
        onCancelEdit={vi.fn()}
        onFork={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    expect(screen.getByTestId('module-action-confirm')).toBeDisabled();
  });

  it('should call onConfirm after dialog submit', () => {
    const onConfirm = vi.fn();
    render(
      <ModuleDetailActions
        kind="A"
        status="draft"
        hasDraft
        hasConfirmed={false}
        nextVersionLabel="v1"
        validationErrors={[]}
        readOnly={false}
        onConfirm={onConfirm}
        onCancelEdit={vi.fn()}
        onFork={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('module-action-confirm'));
    fireEvent.click(screen.getByTestId('module-action-confirm-submit'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
