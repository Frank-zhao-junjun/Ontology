import type { EpcProcess, MetaDimension, MetaElement } from '@/types/ontology';

export interface ScenarioReferenceSource {
  epcId: string;
  epcName: string;
  stepId: string;
  stepName: string;
}

export interface ScenarioReferenceUnionItem {
  elementId: string;
  dimension: MetaDimension;
  elementName: string;
  sources: ScenarioReferenceSource[];
}

export function getChildEpcProcesses(
  scenarioId: string,
  epcProcesses: EpcProcess[] | undefined,
): EpcProcess[] {
  return (epcProcesses ?? []).filter((epc) => epc.parentId === scenarioId);
}

function resolveElementName(elementId: string, metaElements: MetaElement[] | undefined): string {
  return metaElements?.find((m) => m.id === elementId)?.name ?? '(未知要素)';
}

export function buildScenarioReferenceUnion(
  scenarioId: string,
  epcProcesses: EpcProcess[] | undefined,
  metaElements: MetaElement[] | undefined,
): ScenarioReferenceUnionItem[] {
  const children = getChildEpcProcesses(scenarioId, epcProcesses);
  const map = new Map<string, ScenarioReferenceUnionItem>();

  for (const epc of children) {
    for (const step of epc.steps) {
      const ref = step.elementRef;
      const elementId = ref?.elementId?.trim();
      if (!elementId || !ref) continue;

      const source: ScenarioReferenceSource = {
        epcId: epc.id,
        epcName: epc.name,
        stepId: step.id,
        stepName: step.name,
      };

      const existing = map.get(elementId);
      if (existing) {
        existing.sources.push(source);
      } else {
        map.set(elementId, {
          elementId,
          dimension: ref.dimension,
          elementName: resolveElementName(elementId, metaElements),
          sources: [source],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.elementName.localeCompare(b.elementName, 'zh-CN'));
}
