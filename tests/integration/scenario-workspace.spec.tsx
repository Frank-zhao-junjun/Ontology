import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ScenarioWorkspace } from '@/components/ontology/scenario-workspace';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, Scenario } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('ScenarioWorkspace (US-S08-U03)', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('场景测试', domain);
  });

  it('should show semantics, child epcs and reference union', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const scenario = store.addScenario(b.id, {
      name: 'MTS场景',
      description: '按单生产',
      semantics: { terms: ['MTS'], triggerPhrases: ['按单'] },
    });
    const epc = store.addEpcProcess(scenario.id, { name: '主流程' });
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        epcProcesses: [{
          ...epc,
          steps: [{
            id: 's1',
            name: '下达',
            elementRef: { dimension: 'E1', elementId: 'el-1', versionPin: 'latest_confirmed' },
          }],
        }],
        metaElements: [{ id: 'el-1', name: '订单', dimension: 'E1' }],
      },
    });

    render(
      <ScenarioWorkspace
        scenario={scenario as Scenario}
        childEpcs={useOntologyStore.getState().getScenarioChildEpcs(scenario.id)}
        referenceUnion={useOntologyStore.getState().getScenarioReferenceUnion(scenario.id)}
        onSelectEpc={(id) => store.setSelectedBusinessChainNode({ kind: 'EPC', id })}
      />,
    );

    expect(screen.getByTestId('scenario-workspace')).toBeInTheDocument();
    expect(screen.getByText('MTS')).toBeInTheDocument();
    expect(screen.getByTestId('scenario-child-epc-list')).toHaveTextContent('主流程');
    expect(screen.getByTestId('scenario-ref-union-el-1')).toHaveTextContent('订单');

    fireEvent.click(screen.getByTestId(`scenario-epc-link-${epc.id}`));
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'EPC', id: epc.id });
  });
});
