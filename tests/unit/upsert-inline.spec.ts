import { describe, it, expect, vi } from 'vitest';
import type { EpcStep, MetaElement } from '@/types/ontology';
import { upsertInlineElements } from '@/lib/epc-pipeline/upsert-inline';

describe('upsertInlineElements (US-S05-U01)', () => {
  it('should create meta element and clear inline flags', () => {
    const steps: EpcStep[] = [{
      id: 's1',
      name: '步骤1',
      elementRef: {
        dimension: 'E1',
        elementId: '',
        versionPin: 'latest_confirmed',
        inlineNew: true,
        inlinePayload: { name: '订单', description: '实体' },
      },
    }];
    const onDraft = vi.fn();

    const result = upsertInlineElements([], steps, {
      generateId: () => 'el-new-1',
      onElementDraft: onDraft,
    });

    expect(result.metaElements).toHaveLength(1);
    expect(result.metaElements[0].id).toBe('el-new-1');
    expect(result.metaElements[0].name).toBe('订单');
    expect(result.steps[0].elementRef?.elementId).toBe('el-new-1');
    expect(result.steps[0].elementRef?.inlineNew).toBeUndefined();
    expect(result.steps[0].elementRef?.inlinePayload).toBeUndefined();
    expect(onDraft).toHaveBeenCalledWith('E1', 'el-new-1', expect.objectContaining({ name: '订单' }));
  });

  it('should update existing meta element when elementId present', () => {
    const existing: MetaElement[] = [{
      id: 'el-1',
      name: '旧名',
      dimension: 'E4',
    }];
    const steps: EpcStep[] = [{
      id: 's1',
      name: '校验',
      elementRef: {
        dimension: 'E4',
        elementId: 'el-1',
        versionPin: 'latest_confirmed',
        inlineNew: true,
        inlinePayload: { name: '新规则名' },
      },
    }];

    const result = upsertInlineElements(existing, steps, {
      generateId: () => 'unused',
      onElementDraft: vi.fn(),
    });

    expect(result.metaElements[0].name).toBe('新规则名');
    expect(result.metaElements).toHaveLength(1);
  });

  it('should throw when inlinePayload missing name', () => {
    const steps: EpcStep[] = [{
      id: 's1',
      name: 'x',
      elementRef: {
        dimension: 'E1',
        elementId: '',
        versionPin: 'latest_confirmed',
        inlineNew: true,
        inlinePayload: { description: 'no name' },
      },
    }];

    expect(() => upsertInlineElements([], steps, {
      generateId: () => 'id',
      onElementDraft: vi.fn(),
    })).toThrow();
  });
});
