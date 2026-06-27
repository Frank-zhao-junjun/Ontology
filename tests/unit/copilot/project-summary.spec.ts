import { describe, expect, it } from 'vitest';
import { buildProjectSummary } from '@/lib/copilot/project-summary';
import { createMockProject } from '../test-helpers';
import type { OntologyProject } from '@/types/ontology';

describe('buildProjectSummary', () => {
  it('TC-P0-04 returns valueDomains count', () => {
    const project = createMockProject({
      valueDomains: [{ id: 'a1', name: '生产', nameEn: 'Mfg', description: '' }],
    } as Partial<OntologyProject>);
    const summary = buildProjectSummary(project);
    expect(summary.valueDomainCount).toBe(1);
    expect(summary.valueDomains[0].name).toBe('生产');
  });
});
