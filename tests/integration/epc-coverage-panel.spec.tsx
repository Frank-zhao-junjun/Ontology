import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ScenarioWorkspace } from '@/components/ontology/scenario-workspace';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, EpcProcess, MetaElement, Scenario } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

const NOW = '2026-06-18T12:00:00.000Z';

function usageRef(epcId: string, stepId: string, scenarioId: string) {
  return { epcId, stepId, scenarioId, versionPin: 'latest_confirmed' as const };
}

describe('EpcCoveragePanel integration (US-S16-U03)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('覆盖率 UI', domain);
  });

  it('should render dashboard with 50% overall and dimension breakdown', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const scenario = store.addScenario(b.id, { name: 'MTS场景' });
    const epcProcess = store.addEpcProcess(scenario.id, { name: '主流程' });

    store.confirmModule('C', scenario.id);
    store.confirmModule('EPC', epcProcess.id);

    const epcWithSteps: EpcProcess = {
      ...epcProcess,
      steps: [
        { id: 's1', name: '步1', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } },
        { id: 's2', name: '步2', elementRef: { dimension: 'E1', elementId: 'e2', versionPin: 'latest_confirmed' } },
      ],
    };

    const metaElements: MetaElement[] = [
      { id: 'e1', name: '被引用1', dimension: 'E1', usageRefs: [usageRef(epcProcess.id, 's1', scenario.id)] },
      { id: 'e2', name: '被引用2', dimension: 'E1', usageRefs: [usageRef(epcProcess.id, 's2', scenario.id)] },
      { id: 'e3', name: '未覆盖1', dimension: 'E1', usageRefs: [] },
      { id: 'e4', name: '未覆盖2', dimension: 'E1', usageRefs: [] },
    ];

    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: { ...project, epcProcesses: [epcWithSteps], metaElements },
    });

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={() => {}}
      />,
    );

    expect(screen.getByTestId('epc-validation-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('vp-tab-vm'));
    expect(screen.getByTestId('epc-coverage-panel')).toBeInTheDocument();
    expect(screen.getByTestId('epc-coverage-overall-percent')).toHaveTextContent('50%');
    expect(screen.getByTestId('epc-coverage-overall-count')).toHaveTextContent('2/4');
    expect(screen.getByTestId('coverage-dim-E1')).toHaveTextContent('50%');

    fireEvent.click(screen.getByTestId('coverage-dim-E1'));
    expect(screen.getByText('未覆盖1')).toBeInTheDocument();
    expect(screen.getByText('未覆盖2')).toBeInTheDocument();
  });
});
