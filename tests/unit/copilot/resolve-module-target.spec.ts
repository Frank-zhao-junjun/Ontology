import { describe, expect, it } from 'vitest';
import {
  isModifyIntent,
  isNewIntent,
  resolveModuleTarget,
  type ModuleCandidate,
} from '@/lib/copilot/resolve-module-target';
import type { ModuleVersionRecord } from '@/types/ontology';

const modules: ModuleCandidate[] = [
  { id: 'b-1', name: '计划管理', nameEn: 'Planning' },
];

function confirmedRecord(moduleId: string): ModuleVersionRecord {
  return {
    id: 'rec-confirmed',
    moduleKind: 'B',
    moduleId,
    status: 'confirmed',
    version: 'v1',
    confirmedAt: '2026-06-18T00:00:00.000Z',
    createdAt: '2026-06-18T00:00:00.000Z',
    snapshot: { name: '计划管理' },
  };
}

function draftRecord(moduleId: string): ModuleVersionRecord {
  return {
    id: 'rec-draft',
    moduleKind: 'B',
    moduleId,
    status: 'draft',
    createdAt: '2026-06-18T00:00:00.000Z',
    snapshot: { name: '计划管理' },
  };
}

describe('resolveModuleTarget — TC-04', () => {
  it('confirmed + modify intent → fork', () => {
    const result = resolveModuleTarget({
      name: '计划管理',
      kind: 'B',
      userText: '把计划管理改成供应链',
      modules,
      records: [confirmedRecord('b-1')],
    });
    expect(result).toEqual({ mode: 'fork', moduleId: 'b-1', match: modules[0] });
    expect(isModifyIntent('把计划管理改成供应链')).toBe(true);
  });

  it('confirmed + new intent → create', () => {
    const result = resolveModuleTarget({
      name: '计划管理',
      kind: 'B',
      userText: '加一个供应链能力',
      modules,
      records: [confirmedRecord('b-1')],
    });
    expect(result).toEqual({ mode: 'create' });
    expect(isNewIntent('加一个供应链能力')).toBe(true);
  });

  it('draft only → update', () => {
    const result = resolveModuleTarget({
      name: '计划管理',
      kind: 'B',
      userText: '更新描述',
      modules,
      records: [draftRecord('b-1')],
    });
    expect(result).toEqual({ mode: 'update', moduleId: 'b-1', match: modules[0] });
  });

  it('no match → create', () => {
    const result = resolveModuleTarget({
      name: '不存在',
      kind: 'B',
      userText: '新建模块',
      modules,
      records: [],
    });
    expect(result).toEqual({ mode: 'create' });
  });
});
