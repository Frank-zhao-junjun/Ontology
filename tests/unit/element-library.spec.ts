import { describe, it, expect } from 'vitest';
import type { MetaElement } from '@/types/ontology';
import {
  isUnreferencedElement,
  getUsageCount,
  filterUnreferencedElements,
  filterMetaElementsByDimension,
} from '@/lib/element-library';

const elements: MetaElement[] = [
  { id: 'a', name: '已引用', dimension: 'E1', usageRefs: [{ epcId: 'e1', stepId: 's1', scenarioId: 'c1', versionPin: 'latest_confirmed' }] },
  { id: 'b', name: '孤儿', dimension: 'E1', usageRefs: [] },
  { id: 'c', name: '无索引', dimension: 'E4' },
  { id: 'd', name: '规则', dimension: 'E4', usageRefs: [{ epcId: 'e2', stepId: 's2', scenarioId: 'c2', versionPin: 'latest_confirmed' }] },
];

describe('element-library lib (US-S07-U01)', () => {
  it('should treat empty or missing usageRefs as unreferenced', () => {
    expect(isUnreferencedElement(elements[0])).toBe(false);
    expect(isUnreferencedElement(elements[1])).toBe(true);
    expect(isUnreferencedElement(elements[2])).toBe(true);
  });

  it('should count usage refs', () => {
    expect(getUsageCount(elements[0])).toBe(1);
    expect(getUsageCount(elements[2])).toBe(0);
  });

  it('should filter unreferenced when toggle on', () => {
    const all = filterUnreferencedElements(elements, false);
    expect(all).toHaveLength(4);
    const unref = filterUnreferencedElements(elements, true);
    expect(unref.map((e) => e.id)).toEqual(['b', 'c']);
  });

  it('should filter by dimension', () => {
    expect(filterMetaElementsByDimension(elements, 'E1')).toHaveLength(2);
    expect(filterMetaElementsByDimension(elements, 'E8')).toHaveLength(0);
  });
});
