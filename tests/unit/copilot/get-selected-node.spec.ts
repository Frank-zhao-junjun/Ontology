import { describe, expect, it } from 'vitest';
import { runGetSelectedNode } from '@/lib/copilot/actions/get-selected-node';
import { createMockProject } from '../test-helpers';
import type { OntologyProject } from '@/types/ontology';

describe('runGetSelectedNode', () => {
  it('returns null when nothing is selected', () => {
    const project = createMockProject({ valueDomains: [] } as Partial<OntologyProject>);
    const result = JSON.parse(runGetSelectedNode(project, null));
    expect(result.selected).toBeNull();
  });

  it('returns selected node with path and status', () => {
    const project = createMockProject({
      valueDomains: [{ id: 'a1', name: '生产域' }],
      capabilities: [{ id: 'b1', name: '计划能力', parentId: 'a1' }],
      moduleVersionRecords: [
        {
          id: 'rec-b1',
          moduleKind: 'B',
          moduleId: 'b1',
          status: 'draft',
          createdAt: '2026-06-18T12:00:00.000Z',
          snapshot: { id: 'b1', name: '计划能力', parentId: 'a1' },
        },
      ],
    } as Partial<OntologyProject>);

    const result = JSON.parse(
      runGetSelectedNode(project, { kind: 'B', id: 'b1' }),
    );

    expect(result.selected).toEqual({ kind: 'B', id: 'b1' });
    expect(result.name).toBe('计划能力');
    expect(result.path).toBe('生产域/计划能力');
    expect(result.status).toBe('draft');
  });
});
