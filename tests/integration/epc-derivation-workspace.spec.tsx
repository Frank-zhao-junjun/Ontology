import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ScenarioWorkspace } from '@/components/ontology/scenario-workspace';
import type { Scenario } from '@/types/ontology';
import type { DerivedEpcStep } from '@/lib/epc-derivation';

const scenario: Scenario = {
  id: 'sc-1', name: '测试场景', nameEn: 'TestScenario', parentId: 'cap-1',
};

const mockSteps: DerivedEpcStep[] = [
  { name: '起始事件', dimension: 'E3', elementId: 'ev-1', derivation: 'E3 start' },
  { name: '审批', dimension: 'E2', elementId: 'act-1', derivation: 'E2 action' },
  { name: '结束事件', dimension: 'E3', elementId: 'ev-1', derivation: 'E3 end' },
];

describe('ScenarioWorkspace derivation (US-S18-U03)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
  });

  it('should render derivation button when onDeriveSteps is provided', () => {
    const onDerive = vi.fn();
    render(
      <ScenarioWorkspace
        scenario={scenario}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={onDerive}
        derivedSteps={[]}
      />,
    );
    expect(screen.getByTestId('derive-epc-steps-btn')).toBeDefined();
  });

  it('should NOT render derivation button when onDeriveSteps is not provided', () => {
    render(
      <ScenarioWorkspace
        scenario={scenario}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('derive-epc-steps-btn')).toBeNull();
  });

  it('should call onDeriveSteps when button is clicked', () => {
    const onDerive = vi.fn();
    render(
      <ScenarioWorkspace
        scenario={scenario}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={onDerive}
        derivedSteps={[]}
      />,
    );
    fireEvent.click(screen.getByTestId('derive-epc-steps-btn'));
    expect(onDerive).toHaveBeenCalledTimes(1);
  });

  it('should display derived steps when provided', () => {
    render(
      <ScenarioWorkspace
        scenario={scenario}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={vi.fn()}
        derivedSteps={mockSteps}
      />,
    );
    expect(screen.getByTestId('derive-epc-steps-list')).toBeDefined();
    expect(screen.getByText('审批')).toBeDefined();
  });

  it('should show empty message when derivation returned no steps', () => {
    render(
      <ScenarioWorkspace
        scenario={scenario}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={vi.fn()}
        derivedSteps={[]}
      />,
    );
    expect(screen.getByTestId('derive-epc-steps-empty')).toBeDefined();
  });

  it('should render apply button when derived steps exist', () => {
    render(
      <ScenarioWorkspace
        scenario={scenario}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={vi.fn()}
        onApplyDerivedSteps={vi.fn()}
        derivedSteps={mockSteps}
      />,
    );
    expect(screen.getByTestId('apply-derived-steps-btn')).toBeDefined();
  });

  it('should disable apply button when scenario is not confirmed', () => {
    render(
      <ScenarioWorkspace
        scenario={scenario}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={vi.fn()}
        onApplyDerivedSteps={vi.fn()}
        derivedSteps={mockSteps}
        canApplyDerivedSteps={false}
      />,
    );
    expect(screen.getByTestId('apply-derived-steps-btn')).toBeDisabled();
    expect(screen.getByTestId('apply-derived-steps-btn')).toHaveAttribute(
      'title',
      expect.stringContaining('确认场景'),
    );
  });
});
