import { describe, expect, it } from 'vitest';
import {
  resolveEntityRole, isEntityAggregateRoot, normalizeEntityRoleFields,
  getAggregateRootEntities, getEntityRoleLabel, normalizeOntologyProjectEntityRoles
} from '@/lib/entity-role';
import type { OntologyProject } from '@/lib/ontology';

describe('resolveEntityRole', () => {
  it('returns aggregate_root when entityRole is set', () => {
    expect(resolveEntityRole({ entityRole: 'aggregate_root' })).toBe('aggregate_root');
  });

  it('returns child_entity when entityRole is set', () => {
    expect(resolveEntityRole({ entityRole: 'child_entity' })).toBe('child_entity');
  });

  it('returns aggregate_root when isAggregateRoot=true and entityRole is absent', () => {
    expect(resolveEntityRole({ isAggregateRoot: true })).toBe('aggregate_root');
  });

  it('returns child_entity when isAggregateRoot=false and entityRole is absent', () => {
    expect(resolveEntityRole({ isAggregateRoot: false })).toBe('child_entity');
  });

  it('returns child_entity for null/undefined input', () => {
    expect(resolveEntityRole(null as any)).toBe('child_entity');
    expect(resolveEntityRole(undefined as any)).toBe('child_entity');
  });
});

describe('isEntityAggregateRoot', () => {
  it('returns true for aggregate_root entity', () => {
    expect(isEntityAggregateRoot({ entityRole: 'aggregate_root' } as any)).toBe(true);
  });

  it('returns false for child_entity entity', () => {
    expect(isEntityAggregateRoot({ entityRole: 'child_entity' } as any)).toBe(false);
  });
});

describe('normalizeEntityRoleFields', () => {
  it('sets isAggregateRoot=true for aggregate_root', () => {
    const result = normalizeEntityRoleFields({ entityRole: 'aggregate_root', parentAggregateId: 'p1' } as any);
    expect(result.isAggregateRoot).toBe(true);
    expect(result.parentAggregateId).toBeUndefined();
  });

  it('preserves parentAggregateId for child_entity', () => {
    const result = normalizeEntityRoleFields({ entityRole: 'child_entity', parentAggregateId: 'root-1' } as any);
    expect(result.isAggregateRoot).toBe(false);
    expect(result.parentAggregateId).toBe('root-1');
  });

  it('resolves from isAggregateRoot when entityRole is absent', () => {
    const result = normalizeEntityRoleFields({ isAggregateRoot: true } as any);
    expect(result.isAggregateRoot).toBe(true);
  });
});

describe('getAggregateRootEntities', () => {
  it('filters out child_entity items', () => {
    const entities = [
      { entityRole: 'aggregate_root', id: 'r1' },
      { entityRole: 'child_entity', id: 'c1' },
      { entityRole: 'aggregate_root', id: 'r2' },
    ] as any;
    expect(getAggregateRootEntities(entities)).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(getAggregateRootEntities([])).toEqual([]);
  });
});

describe('getEntityRoleLabel', () => {
  it('returns 聚合根 for aggregate_root', () => {
    expect(getEntityRoleLabel('aggregate_root')).toBe('聚合根');
  });

  it('returns 聚合内子实体 for child_entity', () => {
    expect(getEntityRoleLabel('child_entity')).toBe('聚合内子实体');
  });
});

describe('normalizeOntologyProjectEntityRoles', () => {
  it('normalizes all entities in project.dataModel.entities', () => {
    const project = {
      dataModel: {
        entities: [
          { entityRole: 'aggregate_root', id: 'r1', parentAggregateId: 'x' },
          { entityRole: 'child_entity', id: 'c1', parentAggregateId: 'r1' },
        ],
      },
    };
    const result = normalizeOntologyProjectEntityRoles(project as any);
    expect(result.dataModel.entities[0].isAggregateRoot).toBe(true);
    expect(result.dataModel.entities[1].isAggregateRoot).toBe(false);
  });
});
