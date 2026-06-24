import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, MetaElement } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

function confirmMetaElements(elements: MetaElement[]) {
  const store = useOntologyStore.getState();
  for (const el of elements) {
    store.saveModuleDraft(el.dimension, el.id, el);
    store.confirmModule(el.dimension, el.id);
  }
}

function setupConfirmedScenario(elements: MetaElement[] = []) {
  const store = useOntologyStore.getState();
  const a = store.addValueDomain({ name: '域' });
  const b = store.addCapability(a.id, { name: '能力' });
  const scenario = store.addScenario(b.id, { name: '推导场景' });
  store.confirmModule('C', scenario.id);

  if (elements.length > 0) {
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: { ...project, metaElements: elements },
    });
    confirmMetaElements(elements);
  }

  return scenario.id;
}

describe('epc-derivation store (US-S18-U02)', () => {
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
    useOntologyStore.getState().createProject('Derivation测试', domain);
  });

  it('should return empty array when project has no metaElements', () => {
    const scenarioId = setupConfirmedScenario();
    const result = useOntologyStore.getState().deriveEpcStepsFromScenario(scenarioId);
    expect(result).toEqual([]);
  });

  it('should return empty when scenario is not confirmed', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '域' });
    const b = store.addCapability(a.id, { name: '能力' });
    const c = store.addScenario(b.id, { name: '未确认' });
    const elements: MetaElement[] = [
      { id: 'ev-1', name: '订单创建', dimension: 'E3' },
    ];
    useOntologyStore.setState({
      project: { ...store.project!, metaElements: elements },
    });
    confirmMetaElements(elements);
    expect(useOntologyStore.getState().deriveEpcStepsFromScenario(c.id)).toEqual([]);
  });

  it('should derive steps from confirmed metaElements', () => {
    const elements: MetaElement[] = [
      { id: 'ev-1', name: '订单创建', dimension: 'E3' },
      { id: 'act-1', name: '审批', dimension: 'E2', stateMachineId: 'sm-1' },
    ];
    const scenarioId = setupConfirmedScenario(elements);

    const result = useOntologyStore.getState().deriveEpcStepsFromScenario(scenarioId);
    expect(result.length).toBeGreaterThan(0);
    expect(result.filter((s) => s.dimension === 'E3')).toHaveLength(2);
    expect(result.some((s) => s.dimension === 'E2')).toBe(true);
  });

  it('should derive steps from scenario with E1+E2+E5 elements', () => {
    const elements: MetaElement[] = [
      { id: 'ev-1', name: '事件', dimension: 'E3' },
      { id: 'e1-1', name: '订单', dimension: 'E1', entityId: 'ent-1' },
      { id: 'act-1', name: '提交', dimension: 'E2', stateMachineId: 'sm-1' },
      { id: 'role-1', name: '审批人', dimension: 'E5', hasPolicy: true },
    ];
    const scenarioId = setupConfirmedScenario(elements);

    const result = useOntologyStore.getState().deriveEpcStepsFromScenario(scenarioId);
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result[0].dimension).toBe('E3');
    expect(result[result.length - 1].dimension).toBe('E3');
  });

  it('should apply derived steps to new EPC when none exists', () => {
    const elements: MetaElement[] = [
      { id: 'ev-1', name: '事件', dimension: 'E3' },
      { id: 'act-1', name: '提交', dimension: 'E2', stateMachineId: 'sm-1' },
    ];
    const scenarioId = setupConfirmedScenario(elements);

    const result = useOntologyStore.getState().applyDerivedStepsToScenarioEpc(scenarioId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stepCount).toBeGreaterThan(0);
      const epc = useOntologyStore.getState().project?.epcProcesses?.find((e) => e.id === result.epcId);
      expect(epc?.steps.length).toBe(result.stepCount);
    }
  });

  it('should preserve existing EPC steps when applying derived steps', () => {
    const elements: MetaElement[] = [
      { id: 'ev-1', name: '事件', dimension: 'E3' },
      { id: 'act-1', name: '提交', dimension: 'E2', stateMachineId: 'sm-1' },
    ];
    const scenarioId = setupConfirmedScenario(elements);
    const epc = useOntologyStore.getState().addEpcProcess(scenarioId, { name: '手工流程' });
    useOntologyStore.getState().saveEpc(epc.id, {
      ...epc,
      steps: [{ id: 'manual-step', name: '人工审核' }],
    });

    const result = useOntologyStore.getState().applyDerivedStepsToScenarioEpc(scenarioId, epc.id);

    expect(result.ok).toBe(true);
    const updated = useOntologyStore.getState().project?.epcProcesses?.find((item) => item.id === epc.id);
    expect(updated?.steps.map((step) => step.id)).toContain('manual-step');
    expect(updated?.steps.length).toBeGreaterThan(1);
  });
});
