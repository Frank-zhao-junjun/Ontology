import { describe, it, expect } from 'vitest';
import type { MetaElement } from '@/types/ontology';
import {
  META_DIMENSION_ORDER,
  META_DIMENSION_LABELS,
  filterMetaElements,
  groupMetaElementsByDimension,
  resolveElementLabel,
  buildExistingElementRef,
  createInlineElementRef,
} from '@/lib/element-selector';

const sample: MetaElement[] = [
  { id: 'e1-a', name: '订单', nameEn: 'Order', dimension: 'E1' },
  { id: 'e4-r', name: '库存校验', dimension: 'E4' },
  { id: 'e1-b', name: '物料', nameEn: 'Material', dimension: 'E1' },
];

describe('element-selector lib (US-S06-U01)', () => {
  it('should expose all eight dimensions in order with labels', () => {
    expect(META_DIMENSION_ORDER).toHaveLength(8);
    expect(META_DIMENSION_LABELS.E1).toContain('数据');
    expect(META_DIMENSION_LABELS.E8).toContain('接口');
  });

  it('should filter by name, nameEn and dimension', () => {
    expect(filterMetaElements(sample, 'order')).toHaveLength(1);
    expect(filterMetaElements(sample, '物料')).toHaveLength(1);
    expect(filterMetaElements(sample, '', 'E4')).toHaveLength(1);
    expect(filterMetaElements(sample, '订单', 'E4')).toHaveLength(0);
  });

  it('should group elements by dimension', () => {
    const grouped = groupMetaElementsByDimension(sample);
    expect(grouped.E1).toHaveLength(2);
    expect(grouped.E4).toHaveLength(1);
    expect(grouped.E2).toHaveLength(0);
  });

  it('should resolve element label by id', () => {
    expect(resolveElementLabel('e1-a', sample)).toBe('订单');
    expect(resolveElementLabel('missing', sample)).toBe('(未知要素)');
  });

  it('should build existing element ref without inline flags', () => {
    const ref = buildExistingElementRef(sample[0]);
    expect(ref).toEqual({
      dimension: 'E1',
      elementId: 'e1-a',
      versionPin: 'latest_confirmed',
    });
  });

  it('should create inline element ref with payload', () => {
    const ref = createInlineElementRef('E2', { name: '新行为' }, () => 'gen-1');
    expect(ref).toEqual({
      dimension: 'E2',
      elementId: 'gen-1',
      versionPin: 'latest_confirmed',
      inlineNew: true,
      inlinePayload: { name: '新行为' },
    });
  });
});
