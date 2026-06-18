import { describe, it, expect, vi } from 'vitest';
import type { EpcProcess } from '@/types/ontology';
import { runSaveEpcPipeline } from '@/lib/epc-pipeline/save-epc';

describe('runSaveEpcPipeline (US-S05-U03)', () => {
  it('should upsert inline, save epc draft, and rebuild usage index', () => {
    const onElementDraft = vi.fn();
    const onEpcDraft = vi.fn();

    const epc: EpcProcess = {
      id: 'epc-1',
      name: '主流程',
      parentId: 'c-1',
      steps: [{
        id: 'step-1',
        name: '创建',
        elementRef: {
          dimension: 'E1',
          elementId: '',
          versionPin: 'latest_confirmed',
          inlineNew: true,
          inlinePayload: { name: '订单' },
        },
      }],
    };

    const result = runSaveEpcPipeline({
      epcProcesses: [],
      metaElements: [],
      epc,
      generateId: () => 'el-1',
      onElementDraft,
      onEpcDraft,
    });

    expect(result.metaElements).toHaveLength(1);
    expect(result.epcProcesses).toHaveLength(1);
    expect(result.epcProcesses[0].steps[0].elementRef?.elementId).toBe('el-1');
    expect(result.metaElements[0].usageRefs).toHaveLength(1);
    expect(result.metaElements[0].usageRefs?.[0].scenarioId).toBe('c-1');
    expect(onElementDraft).toHaveBeenCalled();
    expect(onEpcDraft).toHaveBeenCalledWith('epc-1', result.epcProcesses[0]);
  });
});
