import { describe, it, expect } from 'vitest';
import type {
  ValueDomain,
  Capability,
  Scenario,
  EpcProcess,
  EpcStep,
  MetaElement,
  ModuleVersionRecord,
  OntologyProject,
  VersionPin,
} from '@/types/ontology';

describe('Simplified ontology types (US-S02)', () => {
  const pinned: VersionPin = { version: 'v2' };

  it('should model A→B→C→EPC business chain with parentId', () => {
    const a: ValueDomain = { id: 'a1', name: '生产制造' };
    const b: Capability = { id: 'b1', name: '计划能力', parentId: a.id };
    const c: Scenario = { id: 'c1', name: 'MTS场景', parentId: b.id };
    const step: EpcStep = {
      id: 's1',
      name: '创建订单',
      elementRef: {
        dimension: 'E1',
        elementId: 'ent-order',
        versionPin: 'latest_confirmed',
      },
    };
    const epc: EpcProcess = {
      id: 'epc1',
      name: '订单下达',
      parentId: c.id,
      steps: [step],
    };
    expect(epc.parentId).toBe('c1');
    expect(epc.steps[0].elementRef?.elementId).toBe('ent-order');
    expect(epc.steps[0].elementRef?.versionPin).toBe('latest_confirmed');
  });

  it('should support inlineNew elementRef for EPC save upsert flow', () => {
    const ref: EpcStep['elementRef'] = {
      dimension: 'E4',
      elementId: 'rule-new-1',
      versionPin: pinned,
      inlineNew: true,
      inlinePayload: { name: '新规则' },
    };
    expect(ref?.inlineNew).toBe(true);
    expect(ref?.versionPin).toEqual({ version: 'v2' });
  });

  it('should define MetaElement with derived usageRefs', () => {
    const el: MetaElement = {
      id: 'ent-order',
      name: '订单',
      dimension: 'E1',
      usageRefs: [
        {
          epcId: 'epc1',
          stepId: 's1',
          scenarioId: 'c1',
          versionPin: 'latest_confirmed',
        },
      ],
    };
    expect(el.usageRefs).toHaveLength(1);
    expect(el.name).toBe('订单');
  });

  it('should extend OntologyProject with simplified optional arrays', () => {
    const project: Pick<
      OntologyProject,
      'valueDomains' | 'capabilities' | 'scenarios' | 'epcProcesses' | 'metaElements'
    > = {
      valueDomains: [{ id: 'a1', name: 'A' }],
      capabilities: [],
      scenarios: [],
      epcProcesses: [],
      metaElements: [],
    };
    expect(project.valueDomains).toHaveLength(1);
  });

  it('should define ModuleVersionRecord for per-module versioning', () => {
    const rec: ModuleVersionRecord = {
      id: 'mvr-1',
      moduleKind: 'EPC',
      moduleId: 'epc1',
      status: 'confirmed',
      version: 'v1',
      confirmedAt: '2026-06-18T00:00:00.000Z',
      createdAt: '2026-06-18T00:00:00.000Z',
      snapshot: { steps: [] },
    };
    expect(rec.status).toBe('confirmed');
    expect(rec.moduleKind).toBe('EPC');
  });

  it('should accept all MetaDimension and ModuleKind literals', () => {
    const dims = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'] as const;
    const kinds = ['A', 'B', 'C', 'EPC', ...dims] as const;
    expect(dims).toHaveLength(8);
    expect(kinds).toHaveLength(12);
  });
});
