import type { MetaDimension, MetaElement } from '@/types/ontology';

export function isUnreferencedElement(element: MetaElement): boolean {
  return !element.usageRefs?.length;
}

export function getUsageCount(element: MetaElement): number {
  return element.usageRefs?.length ?? 0;
}

export function filterUnreferencedElements(
  elements: MetaElement[],
  onlyUnreferenced: boolean,
): MetaElement[] {
  if (!onlyUnreferenced) return elements;
  return elements.filter(isUnreferencedElement);
}

export function filterMetaElementsByDimension(
  elements: MetaElement[],
  dimension: MetaDimension,
): MetaElement[] {
  return elements.filter((el) => el.dimension === dimension);
}
