/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import {
  createEmptyGovernanceModel, createEmptyDataSourcesModel,
  ensureGovernanceModel, ensureDataSourcesModel,
} from '@/lib/ontology-layer-defaults';

describe('createEmptyGovernanceModel', () => {
  it('returns object with roles, fieldPermissions, agentPolicies arrays', () => {
    const m = createEmptyGovernanceModel();
    expect(Array.isArray(m.roles)).toBe(true);
    expect(Array.isArray(m.fieldPermissions)).toBe(true);
    expect(Array.isArray(m.agentPolicies)).toBe(true);
  });

  it('returns object with id and timestamps', () => {
    const m = createEmptyGovernanceModel();
    expect(m.id).toBeTruthy();
    expect(typeof m.id).toBe('string');
    expect(m.createdAt).toBeTruthy();
    expect(m.updatedAt).toBeTruthy();
  });
});

describe('createEmptyDataSourcesModel', () => {
  it('returns object with empty sources array', () => {
    const m = createEmptyDataSourcesModel();
    expect(Array.isArray(m.sources)).toBe(true);
    expect(m.sources).toHaveLength(0);
  });

  it('returns object with id set', () => {
    const m = createEmptyDataSourcesModel();
    expect(m.id).toBeTruthy();
  });
});

describe('ensureGovernanceModel', () => {
  it('returns the model when provided', () => {
    const existing = { roles: [{ id: 'r1', name: 'Admin' }] } as any;
    expect(ensureGovernanceModel(existing)).toBe(existing);
  });

  it('returns a new governance model when given null', () => {
    const m = ensureGovernanceModel(null as any);
    expect(Array.isArray(m.roles)).toBe(true);
  });
});

describe('ensureDataSourcesModel', () => {
  it('returns the model when provided', () => {
    const existing = { sources: [{ id: 'ds1' }] } as any;
    expect(ensureDataSourcesModel(existing)).toBe(existing);
  });

  it('returns a new data sources model when given undefined', () => {
    const m = ensureDataSourcesModel(undefined as any);
    expect(Array.isArray(m.sources)).toBe(true);
  });
});
