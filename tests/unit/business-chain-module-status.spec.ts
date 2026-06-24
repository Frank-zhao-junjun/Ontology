import { describe, it, expect } from 'vitest';
import type { ModuleVersionRecord } from '@/types/ontology';
import { resolveBusinessChainModuleStatus } from '@/lib/business-chain/module-status';

const NOW = '2026-06-18T12:00:00.000Z';

describe('resolveBusinessChainModuleStatus (US-P01-U01)', () => {
  it('should prefer draft over confirmed and archived', () => {
    const records: ModuleVersionRecord[] = [
      { id: '1', moduleKind: 'A', moduleId: 'a1', status: 'archived', version: 'v1', createdAt: NOW, snapshot: {} },
      { id: '2', moduleKind: 'A', moduleId: 'a1', status: 'confirmed', version: 'v2', createdAt: NOW, snapshot: {} },
      { id: '3', moduleKind: 'A', moduleId: 'a1', status: 'draft', createdAt: NOW, snapshot: {} },
    ];
    expect(resolveBusinessChainModuleStatus(records, 'A', 'a1')).toBe('draft');
  });

  it('should return confirmed when no draft', () => {
    const records: ModuleVersionRecord[] = [
      { id: '1', moduleKind: 'C', moduleId: 'c1', status: 'archived', version: 'v1', createdAt: NOW, snapshot: {} },
      { id: '2', moduleKind: 'C', moduleId: 'c1', status: 'confirmed', version: 'v2', createdAt: NOW, snapshot: {} },
    ];
    expect(resolveBusinessChainModuleStatus(records, 'C', 'c1')).toBe('confirmed');
  });

  it('should return archived when only archived history exists', () => {
    const records: ModuleVersionRecord[] = [
      { id: '1', moduleKind: 'EPC', moduleId: 'e1', status: 'archived', version: 'v1', createdAt: NOW, snapshot: {} },
    ];
    expect(resolveBusinessChainModuleStatus(records, 'EPC', 'e1')).toBe('archived');
  });

  it('should default to draft when no version records', () => {
    expect(resolveBusinessChainModuleStatus([], 'A', 'missing')).toBe('draft');
  });
});
