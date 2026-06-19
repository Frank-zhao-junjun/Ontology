import { describe, it, expect } from 'vitest';
import type { ModuleVersionRecord } from '@/types/ontology';
import {
  confirmModule,
  forkConfirmedToDraft,
  getLatestConfirmed,
  getModuleDraft,
  getModuleVersions,
  resolveModuleRef,
  saveModuleDraft,
} from '@/lib/module-version';

const NOW = '2026-06-18T12:00:00.000Z';

function draftRecord(snapshot: unknown): ModuleVersionRecord[] {
  return saveModuleDraft([], {
    moduleKind: 'EPC',
    moduleId: 'epc-1',
    snapshot,
    now: NOW,
    recordId: 'rec-draft-1',
  });
}

describe('module-version lib (US-S03-U01)', () => {
  it('should upsert a single draft per module', () => {
    const r1 = saveModuleDraft([], {
      moduleKind: 'C',
      moduleId: 'c-1',
      snapshot: { name: 'v0' },
      now: NOW,
    });
    expect(getModuleDraft(r1, 'C', 'c-1')?.snapshot).toEqual({ name: 'v0' });

    const r2 = saveModuleDraft(r1, {
      moduleKind: 'C',
      moduleId: 'c-1',
      snapshot: { name: 'v1' },
      now: NOW,
    });
    expect(r2).toHaveLength(1);
    expect(getModuleDraft(r2, 'C', 'c-1')?.snapshot).toEqual({ name: 'v1' });
  });

  it('should confirm draft as v1 then v2 and archive prior confirmed', () => {
    let records = draftRecord({ steps: [] });
    records = confirmModule(records, 'EPC', 'epc-1', NOW);
    const v1 = getLatestConfirmed(records, 'EPC', 'epc-1');
    expect(v1?.version).toBe('v1');
    expect(v1?.status).toBe('confirmed');
    expect(getModuleDraft(records, 'EPC', 'epc-1')).toBeUndefined();

    records = forkConfirmedToDraft(records, {
      moduleKind: 'EPC',
      moduleId: 'epc-1',
      snapshot: { steps: [{ id: 's2' }] },
      now: NOW,
    });
    records = confirmModule(records, 'EPC', 'epc-1', NOW);
    const v2 = getLatestConfirmed(records, 'EPC', 'epc-1');
    expect(v2?.version).toBe('v2');
    const history = getModuleVersions(records, 'EPC', 'epc-1');
    expect(history.filter((h) => h.status === 'archived')).toHaveLength(1);
    expect(history.find((h) => h.version === 'v1')?.status).toBe('archived');
  });

  it('should resolve latest_confirmed and pinned version', () => {
    let records = draftRecord({ a: 1 });
    records = confirmModule(records, 'EPC', 'epc-1', NOW);
    records = forkConfirmedToDraft(records, {
      moduleKind: 'EPC',
      moduleId: 'epc-1',
      snapshot: { a: 2 },
      now: NOW,
    });
    records = confirmModule(records, 'EPC', 'epc-1', NOW);

    const latest = resolveModuleRef(records, {
      targetModuleKind: 'EPC',
      targetElementId: 'epc-1',
      pin: 'latest_confirmed',
    });
    expect(latest?.version).toBe('v2');

    const pinned = resolveModuleRef(records, {
      targetModuleKind: 'EPC',
      targetElementId: 'epc-1',
      pin: { version: 'v1' },
    });
    expect(pinned?.snapshot).toEqual({ a: 1 });
  });

  it('should not resolve draft as cross-module ref target', () => {
    const records = draftRecord({ only: 'draft' });
    const resolved = resolveModuleRef(records, {
      targetModuleKind: 'EPC',
      targetElementId: 'epc-1',
      pin: 'latest_confirmed',
    });
    expect(resolved).toBeNull();
  });

  it('confirmModule should throw when no draft exists', () => {
    expect(() => confirmModule([], 'A', 'a-1', NOW)).toThrow(/No draft/);
  });

  it('should resolve latest_confirmed to confirmed not draft when both exist', () => {
    let records = draftRecord({ a: 1 });
    records = confirmModule(records, 'EPC', 'epc-1', NOW);
    records = forkConfirmedToDraft(records, {
      moduleKind: 'EPC',
      moduleId: 'epc-1',
      snapshot: { a: 2 },
      now: NOW,
    });

    const latest = resolveModuleRef(records, {
      targetModuleKind: 'EPC',
      targetElementId: 'epc-1',
      pin: 'latest_confirmed',
    });
    expect(latest?.status).toBe('confirmed');
    expect(latest?.version).toBe('v1');
    expect(latest?.snapshot).toEqual({ a: 1 });
  });
});
