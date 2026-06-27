import { describe, expect, it } from 'vitest';
import { runGetModuleDetail } from '@/lib/copilot/actions/get-module-detail';
import { createMockProject } from '../test-helpers';
import type { OntologyProject } from '@/types/ontology';

describe('runGetModuleDetail', () => {
  it('returns draft snapshot and status for a value domain', () => {
    const project = createMockProject({
      valueDomains: [{ id: 'a1', name: '生产域' }],
      moduleVersionRecords: [
        {
          id: 'rec-1',
          moduleKind: 'A',
          moduleId: 'a1',
          status: 'draft',
          createdAt: '2026-06-18T12:00:00.000Z',
          snapshot: { id: 'a1', name: '生产域' },
        },
      ],
    } as Partial<OntologyProject>);

    const result = JSON.parse(runGetModuleDetail(project, { kind: 'A', id: 'a1' }));

    expect(result.kind).toBe('A');
    expect(result.id).toBe('a1');
    expect(result.name).toBe('生产域');
    expect(result.status).toBe('draft');
    expect(result.draftSnapshot).toEqual({ id: 'a1', name: '生产域' });
  });
});
