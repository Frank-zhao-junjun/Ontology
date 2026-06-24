import type {
  EpcStep,
  MetaDimension,
  MetaElement,
} from '@/types/ontology';

export interface InlineElementPayload {
  name: string;
  nameEn?: string;
  description?: string;
}

export type UpsertInlineOptions = {
  generateId: () => string;
  onElementDraft: (dimension: MetaDimension, elementId: string, snapshot: MetaElement) => void;
};

export type UpsertInlineResult = {
  metaElements: MetaElement[];
  steps: EpcStep[];
};

function parseInlinePayload(payload: unknown): InlineElementPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('内联要素缺少 inlinePayload');
  }
  const record = payload as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) {
    throw new Error('内联要素名称不能为空');
  }
  return {
    name,
    nameEn: typeof record.nameEn === 'string' ? record.nameEn.trim() || undefined : undefined,
    description: typeof record.description === 'string' ? record.description.trim() || undefined : undefined,
  };
}

export function upsertInlineElements(
  metaElements: MetaElement[],
  steps: EpcStep[],
  options: UpsertInlineOptions,
): UpsertInlineResult {
  const elements = metaElements.map((el) => ({ ...el }));
  const nextSteps = steps.map((step) => {
    if (!step.elementRef?.inlineNew) {
      return { ...step, elementRef: step.elementRef ? { ...step.elementRef } : undefined };
    }

    const payload = parseInlinePayload(step.elementRef.inlinePayload);
    const dimension = step.elementRef.dimension;
    let elementId = step.elementRef.elementId?.trim() ?? '';
    const index = elementId ? elements.findIndex((el) => el.id === elementId) : -1;

    const snapshot: MetaElement = index >= 0
      ? {
          ...elements[index],
          name: payload.name,
          nameEn: payload.nameEn ?? elements[index].nameEn,
          dimension,
        }
      : {
          id: elementId || options.generateId(),
          name: payload.name,
          nameEn: payload.nameEn,
          dimension,
        };

    if (index >= 0) {
      elements[index] = snapshot;
    } else {
      elementId = snapshot.id;
      elements.push(snapshot);
    }

    options.onElementDraft(dimension, snapshot.id, snapshot);

    return {
      ...step,
      elementRef: {
        dimension,
        elementId: snapshot.id,
        versionPin: step.elementRef.versionPin,
      },
    };
  });

  return { metaElements: elements, steps: nextSteps };
}
