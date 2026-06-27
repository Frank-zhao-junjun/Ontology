/**
 * 场景工作区（ScenarioWorkspace）组件渲染测试
 *
 * 使用 @testing-library/react 做最小渲染验证。
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScenarioWorkspace } from '@/components/ontology/scenario-workspace';
import type { Scenario, EpcProcess } from '@/types/ontology';

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'scenario-1',
    name: '采购流程',
    nameEn: 'Procurement',
    semantics: {
      terms: ['采购', '审批'],
      triggerPhrases: [],
      synonyms: [],
    },
    ...overrides,
  } as Scenario;
}

function makeEpc(id: string, name: string): EpcProcess {
  return {
    id,
    name,
    parentId: 'scenario-1',
    steps: [],
  } as EpcProcess;
}

describe('ScenarioWorkspace', () => {
  it('R1: renders scenario name in child EPC list', () => {
    const childEpcs = [makeEpc('epc-1', '采购申请审批')];
    render(
      <ScenarioWorkspace
        scenario={makeScenario()}
        childEpcs={childEpcs}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scenario-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('scenario-child-epc-list')).toBeInTheDocument();
    expect(screen.getByText('采购申请审批')).toBeInTheDocument();
  });

  it('R2: shows empty message when no child EPCs', () => {
    render(
      <ScenarioWorkspace
        scenario={makeScenario()}
        childEpcs={[]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
      />,
    );
    expect(screen.getByText(/暂无子流程/)).toBeInTheDocument();
    expect(screen.queryByTestId('scenario-child-epc-list')).not.toBeInTheDocument();
  });

  it('R3: renders semantics section when scenario has terms', () => {
    render(
      <ScenarioWorkspace
        scenario={makeScenario()}
        childEpcs={[makeEpc('epc-1', 'EPC-1')]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scenario-semantics')).toBeInTheDocument();
    expect(screen.getByText('采购')).toBeInTheDocument();
    expect(screen.getByText('审批')).toBeInTheDocument();
  });

  it('R4: hides semantics section when empty', () => {
    render(
      <ScenarioWorkspace
        scenario={makeScenario({ semantics: { terms: [], triggerPhrases: [], synonyms: [] } })}
        childEpcs={[makeEpc('epc-1', 'EPC-1')]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('scenario-semantics')).not.toBeInTheDocument();
  });

  it('R5: renders derivation section when onDeriveSteps provided', () => {
    render(
      <ScenarioWorkspace
        scenario={makeScenario()}
        childEpcs={[makeEpc('epc-1', 'EPC-1')]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={vi.fn()}
      />,
    );
    expect(screen.getByTestId('derive-epc-steps-section')).toBeInTheDocument();
    expect(screen.getByTestId('derive-epc-steps-btn')).toBeInTheDocument();
    expect(screen.getByTestId('derive-epc-steps-empty')).toBeInTheDocument();
  });

  it('R6: shows apply button when derivedSteps present and onApplyDerivedSteps provided', () => {
    render(
      <ScenarioWorkspace
        scenario={makeScenario()}
        childEpcs={[makeEpc('epc-1', 'EPC-1')]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={vi.fn()}
        onApplyDerivedSteps={vi.fn()}
        derivedSteps={[{ elementId: 'el-1', name: '测试', dimension: 'E1', derivation: 'auto' }]}
        canApplyDerivedSteps={true}
      />,
    );
    expect(screen.getByTestId('apply-derived-steps-btn')).toBeInTheDocument();
    expect(screen.getByTestId('apply-derived-steps-btn')).not.toBeDisabled();
  });

  it('R7: disables apply button when canApplyDerivedSteps=false', () => {
    render(
      <ScenarioWorkspace
        scenario={makeScenario()}
        childEpcs={[makeEpc('epc-1', 'EPC-1')]}
        referenceUnion={[]}
        onSelectEpc={vi.fn()}
        onDeriveSteps={vi.fn()}
        onApplyDerivedSteps={vi.fn()}
        derivedSteps={[{ elementId: 'el-1', name: '测试', dimension: 'E1', derivation: 'auto' }]}
        canApplyDerivedSteps={false}
      />,
    );
    expect(screen.getByTestId('apply-derived-steps-btn')).toBeDisabled();
  });

  it('R8: renders reference union section', () => {
    const referenceUnion = [
      {
        elementId: 'el-1',
        dimension: 'E1' as const,
        elementName: '合同数据',
        sources: [{ epcId: 'epc-1', epcName: 'EPC', stepId: 's-1', stepName: '查看' }],
      },
    ];
    render(
      <ScenarioWorkspace
        scenario={makeScenario()}
        childEpcs={[makeEpc('epc-1', 'EPC-1')]}
        referenceUnion={referenceUnion}
        onSelectEpc={vi.fn()}
      />,
    );
    expect(screen.getByTestId('scenario-ref-union')).toBeInTheDocument();
    expect(screen.getByTestId('scenario-ref-union-el-1')).toBeInTheDocument();
    expect(screen.getByText('合同数据')).toBeInTheDocument();
  });

  it('R9: EPC link button triggers onSelectEpc', () => {
    const onSelectEpc = vi.fn();
    render(
      <ScenarioWorkspace
        scenario={makeScenario()}
        childEpcs={[makeEpc('epc-1', '采购审批')]}
        referenceUnion={[]}
        onSelectEpc={onSelectEpc}
      />,
    );
    screen.getByTestId('scenario-epc-link-epc-1').click();
    expect(onSelectEpc).toHaveBeenCalledWith('epc-1');
  });
});
