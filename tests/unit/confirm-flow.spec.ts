import { describe, expect, it } from 'vitest';
import type { ModuleVersionRecord, OntologyProject } from '@/types/ontology';
import {
  runConfirmFlow,
  validateConfirm,
  type ConfirmFlowProject,
} from '@/lib/module-version/confirm-flow';
import { cancelModuleDraft, getLatestConfirmed, getModuleDraft, saveModuleDraft } from '@/lib/module-version';

const NOW = '2026-06-18T12:00:00.000Z';

function baseProject(overrides: Partial<OntologyProject> = {}): ConfirmFlowProject {
  return {
    valueDomains: [{ id: 'a1', name: '生产域' }],
    capabilities: [{ id: 'b1', name: '计划能力', parentId: 'a1' }],
    scenarios: [{ id: 'c1', name: '排产场景', parentId: 'b1' }],
    epcProcesses: [],
    metaElements: [{ id: 'el1', name: '订单', dimension: 'E1' }],
    moduleVersionRecords: [],
    ...overrides,
  };
}

describe('confirm-flow (US-S14-U01)', () => {
  it('should reject confirm when name is empty', () => {
    const errors = validateConfirm('A', { id: 'a2', name: '  ' }, baseProject());
    expect(errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('should reject B when parentId missing from valueDomains', () => {
    const errors = validateConfirm(
      'B',
      { id: 'b2', name: '能力', parentId: 'missing' },
      baseProject(),
    );
    expect(errors.some((e) => e.field === 'parentId')).toBe(true);
  });

  it('should reject EPC when parentId not in scenarios', () => {
    const errors = validateConfirm(
      'EPC',
      { id: 'e1', name: '流程', parentId: 'missing', steps: [] },
      baseProject(),
    );
    expect(errors.some((e) => e.field === 'parentId')).toBe(true);
  });

  it('should reject E1 when dimension invalid', () => {
    const errors = validateConfirm(
      'E1',
      { id: 'el2', name: '要素', dimension: 'E9' },
      baseProject(),
    );
    expect(errors.some((e) => e.field === 'dimension')).toBe(true);
  });

  it('runConfirmFlow should confirm draft as v1', () => {
    const snapshot = { id: 'a2', name: '新域' };
    const records: ModuleVersionRecord[] = saveModuleDraft([], {
      moduleKind: 'A',
      moduleId: 'a2',
      snapshot,
      now: NOW,
    });
    const project = baseProject({ moduleVersionRecords: records });

    const result = runConfirmFlow(project, 'A', 'a2', NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.confirmed.version).toBe('v1');
    expect(result.confirmed.status).toBe('confirmed');
    expect(getModuleDraft(result.moduleVersionRecords, 'A', 'a2')).toBeUndefined();
  });

  it('runConfirmFlow should archive prior confirmed on second confirm', () => {
    let records: ModuleVersionRecord[] = saveModuleDraft([], {
      moduleKind: 'A',
      moduleId: 'a2',
      snapshot: { id: 'a2', name: 'v1' },
      now: NOW,
    });
    const first = runConfirmFlow(baseProject({ moduleVersionRecords: records }), 'A', 'a2', NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    records = first.moduleVersionRecords;

    records = saveModuleDraft(records, {
      moduleKind: 'A',
      moduleId: 'a2',
      snapshot: { id: 'a2', name: 'v2 draft' },
      now: NOW,
      recordId: 'rec-draft-2',
    });
    const second = runConfirmFlow(baseProject({ moduleVersionRecords: records }), 'A', 'a2', NOW);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.confirmed.version).toBe('v2');
    expect(second.archived?.version).toBe('v1');
    expect(getLatestConfirmed(second.moduleVersionRecords, 'A', 'a2')?.version).toBe('v2');
  });

  it('runConfirmFlow should return errors when no draft', () => {
    const result = runConfirmFlow(baseProject(), 'A', 'a-missing', NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.field === 'draft')).toBe(true);
  });

  it('cancelModuleDraft should remove draft record', () => {
    const records = saveModuleDraft([], {
      moduleKind: 'C',
      moduleId: 'c1',
      snapshot: { id: 'c1', name: '场景' },
      now: NOW,
    });
    const next = cancelModuleDraft(records, 'C', 'c1');
    expect(getModuleDraft(next, 'C', 'c1')).toBeUndefined();
  });
});
