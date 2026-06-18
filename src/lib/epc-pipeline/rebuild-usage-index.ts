import type {
  ElementUsageRef,
  EpcProcess,
  MetaElement,
} from '@/types/ontology';

export interface RebuildUsageIndexInput {
  epcProcesses?: EpcProcess[];
  metaElements?: MetaElement[];
}

export function rebuildUsageIndex(input: RebuildUsageIndexInput): MetaElement[] {
  const epcProcesses = input.epcProcesses ?? [];
  const metaElements = input.metaElements ?? [];
  const usageMap = new Map<string, ElementUsageRef[]>();

  for (const epc of epcProcesses) {
    const scenarioId = epc.parentId;
    for (const step of epc.steps) {
      const elementId = step.elementRef?.elementId?.trim();
      if (!elementId || !step.elementRef) continue;

      const entry: ElementUsageRef = {
        epcId: epc.id,
        stepId: step.id,
        scenarioId,
        versionPin: step.elementRef.versionPin,
      };
      const list = usageMap.get(elementId) ?? [];
      list.push(entry);
      usageMap.set(elementId, list);
    }
  }

  return metaElements.map((meta) => ({
    ...meta,
    usageRefs: usageMap.get(meta.id) ?? [],
  }));
}
