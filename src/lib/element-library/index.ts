import {
  isUnreferencedElement,
  getUsageCount,
  filterUnreferencedElements,
  filterMetaElementsByDimension,
} from '@/lib/element-library/unreferenced';
import type { MetaDimension, MetaElement } from '@/types/ontology';

export {
  isUnreferencedElement,
  getUsageCount,
  filterUnreferencedElements,
  filterMetaElementsByDimension,
};

export function resolveEpcName(
  epcId: string,
  epcProcesses: { id: string; name: string }[] | undefined,
): string {
  return epcProcesses?.find((epc) => epc.id === epcId)?.name ?? epcId;
}

export type { MetaDimension, MetaElement };
