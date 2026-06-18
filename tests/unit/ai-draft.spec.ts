import { describe, expect, it } from 'vitest';
import type { EpcProcess, OntologyProject, ValueDomain } from '@/types/ontology';
import {
  buildModuleDraftContext,
  buildModuleDraftPrompt,
  listConfirmedMetaElements,
  mergeAiDraftSuggestion,
  parseModuleDraftResponse,
} from '@/lib/ai-draft';

const NOW = '2026-06-18T12:00:00.000Z';

function sampleProject(): Pick<
  OntologyProject,
  'valueDomains' | 'capabilities' | 'scenarios' | 'epcProcesses' | 'metaElements' | 'moduleVersionRecords'
> {
  return {
    valueDomains: [{ id: 'a1', name: '生产域' }],
    capabilities: [{ id: 'b1', name: '计划能力', parentId: 'a1' }],
    scenarios: [{ id: 'c1', name: '排产场景', parentId: 'b1' }],
    epcProcesses: [{ id: 'e1', name: '主流程', parentId: 'c1', steps: [] }],
    metaElements: [{ id: 'el1', name: '订单', dimension: 'E1' }],
    moduleVersionRecords: [
      {
        id: 'mvr-el1',
        moduleKind: 'E1',
        moduleId: 'el1',
        status: 'confirmed',
        version: 'v1',
        createdAt: NOW,
        snapshot: { id: 'el1', name: '订单', dimension: 'E1' },
      },
    ],
  };
}

describe('ai-draft lib (US-S11-U01)', () => {
  it('should list confirmed meta elements only', () => {
    const items = listConfirmedMetaElements(
      sampleProject().moduleVersionRecords ?? [],
      sampleProject().metaElements,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'el1', dimension: 'E1', version: 'v1' });
  });

  it('should build chain path context for EPC module', () => {
    const ctx = buildModuleDraftContext(sampleProject(), 'EPC', 'e1');
    expect(ctx.chainPath).toContain('生产域');
    expect(ctx.chainPath).toContain('排产场景');
    expect(ctx.confirmedElements).toHaveLength(1);
    expect(ctx.currentSnapshot).toMatchObject({ id: 'e1', parentId: 'c1' });
  });

  it('should include confirmed catalog in prompt', () => {
    const ctx = buildModuleDraftContext(sampleProject(), 'A', 'a1');
    const prompt = buildModuleDraftPrompt(ctx, 'A', '补充生产域描述');
    expect(prompt.user).toContain('生产域');
    expect(prompt.user).toContain('el1');
    expect(prompt.system).toContain('JSON');
  });

  it('should parse and merge A module suggestion', () => {
    const current = { id: 'a1', name: '生产域' };
    const parsed = parseModuleDraftResponse(
      { description: 'AI 描述', semantics: { terms: ['制造'] } },
      'A',
      ['el1'],
    );
    const merged = mergeAiDraftSuggestion(current, parsed, 'A') as ValueDomain;
    expect(merged.name).toBe('生产域');
    expect(merged.description).toBe('AI 描述');
    expect(merged.semantics?.terms).toEqual(['制造']);
  });

  it('should reject EPC step referencing unknown element', () => {
    expect(() =>
      parseModuleDraftResponse(
        {
          steps: [
            {
              id: 's1',
              name: '步骤1',
              elementRef: { dimension: 'E1', elementId: 'missing', versionPin: 'latest_confirmed' },
            },
          ],
        },
        'EPC',
        ['el1'],
      ),
    ).toThrow(/不在已确认要素目录/);
  });

  it('should merge valid EPC steps', () => {
    const current: EpcProcess = { id: 'e1', name: '主流程', parentId: 'c1', steps: [] };
    const parsed = parseModuleDraftResponse(
      {
        description: '流程说明',
        steps: [
          {
            id: 's1',
            name: '引用订单',
            elementRef: { dimension: 'E1', elementId: 'el1', versionPin: 'latest_confirmed' },
          },
        ],
      },
      'EPC',
      ['el1'],
    );
    const merged = mergeAiDraftSuggestion(current, parsed, 'EPC') as EpcProcess;
    expect(merged.steps).toHaveLength(1);
    expect(merged.steps[0].elementRef?.elementId).toBe('el1');
  });
});
