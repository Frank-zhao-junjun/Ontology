import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import { lintBusinessEpc } from '@/lib/business-epc-linter';
import { validateCrossConsistency } from '@/lib/epc-cross-consistency';
import { deriveEpcSteps } from '@/lib/epc-derivation';
import type { Domain, MetaElement, EpcProcess } from '@/types/ontology';

const domain: Domain = {
  id: 'd1', name: '离散制造', nameEn: 'Mfg', description: '',
  icon: 'factory', color: '#000',
};

describe('Golden Path E2E (T-REG-03)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [],
      masterDataRecords: {}, versions: [], activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('GoldenPath', domain);
  });

  it('should complete golden path: A->B->C->EPC with zero linter errors', () => {
    const store = useOntologyStore.getState();

    // Step 1: Build chain A → B → C
    const vdId = store.addValueDomain({ name: '价值域', nameEn: 'VD' }).id;
    const capId = store.addCapability(vdId, { name: '能力', nameEn: 'Cap' }).id;
    const scenario = store.addScenario(capId, { name: '场景', nameEn: 'Scenario' });

    // Step 2: Confirm scenario
    store.confirmModuleValidated('C', scenario.id);

    // Step 3: Add metaElements and EPC steps
    const elements: MetaElement[] = [
      { id: 'ev-start', name: '订单创建', dimension: 'E3', eventId: 'evt-1' },
      { id: 'act-1', name: '审批', dimension: 'E2', stateMachineId: 'sm-1' },
      { id: 'ev-end', name: '订单完成', dimension: 'E3', eventId: 'evt-2' },
    ];
    const epc: EpcProcess = {
      id: 'epc-1', name: '订单流程', parentId: scenario.id,
      steps: [
        { id: 's1', name: '开始', elementRef: { dimension: 'E3', elementId: 'ev-start', versionPin: 'latest_confirmed' } },
        { id: 's2', name: '审批', elementRef: { dimension: 'E2', elementId: 'act-1', versionPin: 'latest_confirmed' } },
        { id: 's3', name: '结束', elementRef: { dimension: 'E3', elementId: 'ev-end', versionPin: 'latest_confirmed' } },
      ],
    };

    const project = { ...useOntologyStore.getState().project!, metaElements: elements, epcProcesses: [epc] };
    useOntologyStore.setState({ project });

    // Step 4: Confirm all elements and EPC
    store.confirmModuleValidated('E3', 'ev-start');
    store.confirmModuleValidated('E2', 'act-1');
    store.confirmModuleValidated('E3', 'ev-end');
    store.confirmModuleValidated('EPC', 'epc-1');

    // Step 5: Linter check — should be clean (all elements confirmed + properly referenced)
    const finalProject = useOntologyStore.getState().project!;
    const warnings = lintBusinessEpc({
      moduleVersionRecords: finalProject.moduleVersionRecords ?? [],
      scenarios: finalProject.scenarios ?? [],
      epcProcesses: finalProject.epcProcesses ?? [],
      metaElements: finalProject.metaElements ?? [],
    });
    // Golden path: no W-EPC errors (all elements confirmed, all references valid)
    const errors = warnings.filter(w => w.ruleId !== 'W-EPC-08' && w.ruleId !== 'W-EPC-09'); // exclude density warnings
    expect(errors.filter(w => w.ruleId.startsWith('W-EPC-0'))).toHaveLength(0);

    // Step 6: Derivation should produce steps
    const derived = deriveEpcSteps({ metaElements: finalProject.metaElements ?? [] });
    expect(derived.length).toBeGreaterThan(0);
    expect(derived[0].dimension).toBe('E3'); // start

    // Step 7: Cross-consistency should run without throwing
    const vxIssues = validateCrossConsistency({
      scenarioId: scenario.id,
      scenarios: finalProject.scenarios ?? [],
      capabilities: finalProject.capabilities ?? [],
      valueDomains: finalProject.valueDomains ?? [],
      epcProcesses: finalProject.epcProcesses ?? [],
      metaElements: finalProject.metaElements ?? [],
      moduleVersionRecords: finalProject.moduleVersionRecords ?? [],
    });
    expect(Array.isArray(vxIssues)).toBe(true);
  });
});
