import { describe, expect, it } from 'vitest';
import type { OntologyProject } from '@/types/ontology';
import { migrateBusinessScenariosToChain } from '@/lib/migration/business-scenario-to-chain';

function legacyProject(): OntologyProject {
  return {
    id: 'p1',
    name: 'Legacy',
    domain: {
      id: 'd1',
      name: '域',
      nameEn: 'Domain',
      description: '',
      icon: 'factory',
      color: '#000',
    },
    dataModel: {
      id: 'dm1',
      name: 'dm',
      version: '1',
      domain: 'd1',
      projects: [],
      businessScenarios: [
        { id: 'scenario-1', name: '场景一', nameEn: 'S1', projectId: 'p1' },
      ],
      entities: [],
      createdAt: '2026-06-18T12:00:00.000Z',
      updatedAt: '2026-06-18T12:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-06-18T12:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z',
  };
}

describe('migrateBusinessScenariosToChain (US-S12-U03)', () => {
  it('should create A/B and map legacy scenarios to C nodes', () => {
    const result = migrateBusinessScenariosToChain(legacyProject());
    expect(result.migratedCount).toBe(1);
    expect(result.project.valueDomains).toHaveLength(1);
    expect(result.project.capabilities).toHaveLength(1);
    expect(result.project.scenarios?.[0]).toMatchObject({
      id: 'scenario-1',
      name: '场景一',
      parentId: result.project.capabilities![0].id,
    });
  });

  it('should skip when simplified chain already exists', () => {
    const project = {
      ...legacyProject(),
      valueDomains: [{ id: 'a1', name: '已有域' }],
    };
    const result = migrateBusinessScenariosToChain(project);
    expect(result.migratedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.project.scenarios ?? []).toHaveLength(0);
  });
});
