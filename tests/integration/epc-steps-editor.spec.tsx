import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EpcStepsEditor } from '@/components/ontology/epc-steps-editor';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, EpcProcess } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

function buildEpc(): EpcProcess {
  const store = useOntologyStore.getState();
  const a = store.addValueDomain({ name: '域' });
  const b = store.addCapability(a.id, { name: '能力' });
  const c = store.addScenario(b.id, { name: '场景' });
  return store.addEpcProcess(c.id, { name: '主流程' });
}

describe('EpcStepsEditor (US-S06-U03)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('EPC测试', domain);
  });

  it('should add step and save via saveEpc pipeline', () => {
    const epc = buildEpc();
    const metaElements = [{ id: 'ex-1', name: '已有要素', dimension: 'E1' as const }];
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: { ...project, metaElements },
    });

    render(
      <EpcStepsEditor
        epc={epc}
        metaElements={metaElements}
        onSave={(next) => useOntologyStore.getState().saveEpc(epc.id, next)}
        generateId={() => 'step-1'}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /添加步骤/i }));
    fireEvent.change(screen.getByLabelText(/步骤名称/i), { target: { value: '下达' } });

    fireEvent.click(screen.getByTestId('element-selector-trigger'));
    fireEvent.click(screen.getByTestId('element-option-ex-1'));

    fireEvent.click(screen.getByRole('button', { name: /保存 EPC/i }));

    const savedProject = useOntologyStore.getState().project!;
    const saved = savedProject.epcProcesses?.find((p) => p.id === epc.id);
    expect(saved?.steps).toHaveLength(1);
    expect(saved?.steps[0].elementRef?.elementId).toBe('ex-1');
    expect(savedProject.metaElements?.find((m) => m.id === 'ex-1')?.usageRefs?.length).toBeGreaterThan(0);
  });

  it('should upsert inline element on save', () => {
    const epc = buildEpc();

    render(
      <EpcStepsEditor
        epc={epc}
        metaElements={[]}
        onSave={(next) => useOntologyStore.getState().saveEpc(epc.id, next)}
        generateId={() => 'inline-el'}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /添加步骤/i }));
    fireEvent.change(screen.getByLabelText(/步骤名称/i), { target: { value: '新建挂接' } });

    fireEvent.click(screen.getByTestId('element-selector-trigger'));
    fireEvent.click(screen.getByTestId('element-selector-inline-new'));
    fireEvent.click(screen.getByTestId('inline-dimension-E3'));
    fireEvent.change(screen.getByLabelText(/要素名称/i), { target: { value: '创建事件' } });
    fireEvent.click(screen.getByRole('button', { name: /确认新建/i }));

    fireEvent.click(screen.getByRole('button', { name: /保存 EPC/i }));

    const project = useOntologyStore.getState().project!;
    expect(project.metaElements?.some((m) => m.id === 'inline-el' && m.name === '创建事件')).toBe(true);
  });
});
