import { describe, expect, it } from 'vitest';
import { runGetElementLibrarySummary } from '@/lib/copilot/actions/get-element-library-summary';
import { createMockProject } from '../test-helpers';
import type { OntologyProject } from '@/types/ontology';

describe('runGetElementLibrarySummary', () => {
  it('returns dimension counts and recent element names', () => {
    const project = createMockProject({
      metaElements: [
        { id: 'e1', name: '订单', dimension: 'E1' },
        { id: 'e2', name: '创建订单', dimension: 'E2' },
        { id: 'e3', name: '订单创建', dimension: 'E3' },
      ],
    } as Partial<OntologyProject>);

    const result = JSON.parse(runGetElementLibrarySummary(project));

    expect(result.totalCount).toBe(3);
    expect(result.byDimension.E1).toBe(1);
    expect(result.byDimension.E2).toBe(1);
    expect(result.recentElements[0].name).toBe('订单创建');
  });
});
