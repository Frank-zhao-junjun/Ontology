import {
  META_DIMENSION_ORDER,
  META_DIMENSION_LABELS,
  type MetaDimension,
} from '@/lib/element-selector/constants';
import type { EpcStepElementRef, MetaElement } from '@/types/ontology';
import type { InlineElementPayload } from '@/lib/epc-pipeline/upsert-inline';

export { META_DIMENSION_ORDER, META_DIMENSION_LABELS };
export type { MetaDimension };

export function filterMetaElements(
  elements: MetaElement[],
  query: string,
  dimension?: MetaDimension,
): MetaElement[] {
  const q = query.trim().toLowerCase();
  return elements.filter((el) => {
    if (dimension && el.dimension !== dimension) return false;
    if (!q) return true;
    const hay = `${el.name} ${el.nameEn ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
}

export function groupMetaElementsByDimension(
  elements: MetaElement[],
): Record<MetaDimension, MetaElement[]> {
  const grouped = Object.fromEntries(
    META_DIMENSION_ORDER.map((d) => [d, [] as MetaElement[]]),
  ) as Record<MetaDimension, MetaElement[]>;
  for (const el of elements) {
    grouped[el.dimension].push(el);
  }
  return grouped;
}

export function resolveElementLabel(elementId: string, elements: MetaElement[]): string {
  const found = elements.find((el) => el.id === elementId);
  return found?.name ?? '(未知要素)';
}

export function buildExistingElementRef(element: MetaElement): EpcStepElementRef {
  return {
    dimension: element.dimension,
    elementId: element.id,
    versionPin: 'latest_confirmed',
  };
}

export function createInlineElementRef(
  dimension: MetaDimension,
  payload: InlineElementPayload,
  generateId: () => string,
): EpcStepElementRef {
  return {
    dimension,
    elementId: generateId(),
    versionPin: 'latest_confirmed',
    inlineNew: true,
    inlinePayload: payload,
  };
}
