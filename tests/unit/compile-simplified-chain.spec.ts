import { describe, expect, it } from 'vitest';
import { compileManifest } from '@/lib/manifest-compiler';
import { compileSimplifiedChain } from '@/lib/manifest-compiler/simplified-chain';
import type { ModuleVersionRecord, OntologyProject } from '@/types/ontology';

function chainProject(): OntologyProject {
  return {
    id: 'p-chain',
    name: '业务链项目',
    domain: {
      id: 'd1',
      name: '制造',
      nameEn: 'Mfg',
      description: '',
      icon: 'factory',
      color: '#000',
    },
    dataModel: null,
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    valueDomains: [{ id: 'a1', name: '价值域' }],
    capabilities: [{ id: 'b1', name: '能力', parentId: 'a1' }],
    scenarios: [{ id: 'c1', name: '场景', parentId: 'b1' }],
    epcProcesses: [
      {
        id: 'epc1',
        name: '流程',
        parentId: 'c1',
        steps: [],
      },
    ],
    moduleVersionRecords: [
      {
        id: 'r-a1',
        moduleKind: 'A',
        moduleId: 'a1',
        status: 'confirmed',
        version: 'v1',
        confirmedAt: '2026-06-18T12:00:00.000Z',
        createdAt: '2026-06-18T12:00:00.000Z',
        snapshot: { id: 'a1', name: '价值域（已确认）' },
      },
      {
        id: 'r-c1',
        moduleKind: 'C',
        moduleId: 'c1',
        status: 'confirmed',
        version: 'v1',
        confirmedAt: '2026-06-18T12:00:00.000Z',
        createdAt: '2026-06-18T12:00:00.000Z',
        snapshot: { id: 'c1', name: '场景（已确认）', parentId: 'b1' },
      },
    ] satisfies ModuleVersionRecord[],
    createdAt: '2026-06-18T12:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z',
  };
}

describe('compileSimplifiedChain (US-S13-U01)', () => {
  it('should compile confirmed snapshots and draft fallbacks', () => {
    const result = compileSimplifiedChain(chainProject());

    expect(result.simplifiedChain.valueDomains).toHaveLength(1);
    expect(result.simplifiedChain.valueDomains[0]).toMatchObject({
      id: 'a1',
      status: 'confirmed',
      version: 'v1',
      snapshot: { name: '价值域（已确认）' },
    });
    expect(result.simplifiedChain.capabilities[0].status).toBe('draft');
    expect(result.simplifiedChain.scenarios[0].status).toBe('confirmed');
    expect(result.simplifiedChain.epcProcesses).toHaveLength(1);
    expect(Array.isArray(result.epcWarnings)).toBe(true);
  });

  it('should expose non-empty simplifiedChain via compileManifest extensions', () => {
    const manifest = compileManifest(chainProject(), {
      metadataId: 'chain-meta',
      version: '1.0.0',
      compiledAt: '2026-06-18T12:00:00.000Z',
    });

    expect(manifest.metadata.extensions?.simplifiedChain).toBeDefined();
    expect(manifest.metadata.extensions?.epcWarnings).toEqual(
      expect.any(Array),
    );

    const chain = manifest.metadata.extensions?.simplifiedChain as {
      valueDomains: unknown[];
    };
    expect(chain.valueDomains.length).toBeGreaterThan(0);
  });
});
