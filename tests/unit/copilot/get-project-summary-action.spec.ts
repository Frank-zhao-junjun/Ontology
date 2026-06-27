import { describe, expect, it } from 'vitest';
import { runGetProjectSummary } from '@/lib/copilot/actions/get-project-summary';
import { createMockProject } from '../test-helpers';
import type { OntologyProject } from '@/types/ontology';

describe('runGetProjectSummary', () => {
  it('TC-P0-04 returns JSON string summary', () => {
    const project = createMockProject({ valueDomains: [] } as Partial<OntologyProject>);
    const result = runGetProjectSummary(project);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('valueDomainCount');
  });
});
