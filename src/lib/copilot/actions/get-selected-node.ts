import { getBusinessChainDisplayPath } from '@/lib/business-chain/tree';
import { resolveBusinessChainModuleStatus } from '@/lib/business-chain/module-status';
import type { BusinessChainNodeRef } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';

export interface SelectedNodeDetail {
  selected: BusinessChainNodeRef | null;
  name?: string;
  nameEn?: string;
  status?: string;
  path?: string;
}

function findNodeName(project: OntologyProject, ref: BusinessChainNodeRef): string | undefined {
  if (ref.kind === 'A') return project.valueDomains?.find((m) => m.id === ref.id)?.name;
  if (ref.kind === 'B') return project.capabilities?.find((m) => m.id === ref.id)?.name;
  if (ref.kind === 'C') return project.scenarios?.find((m) => m.id === ref.id)?.name;
  return project.epcProcesses?.find((m) => m.id === ref.id)?.name;
}

export function buildSelectedNodeDetail(
  project: OntologyProject | null,
  selected: BusinessChainNodeRef | null,
): SelectedNodeDetail {
  if (!project || !selected) {
    return { selected: null };
  }

  const records = project.moduleVersionRecords ?? [];
  return {
    selected,
    name: findNodeName(project, selected),
    nameEn:
      selected.kind === 'A'
        ? project.valueDomains?.find((m) => m.id === selected.id)?.nameEn
        : selected.kind === 'B'
          ? project.capabilities?.find((m) => m.id === selected.id)?.nameEn
          : selected.kind === 'C'
            ? project.scenarios?.find((m) => m.id === selected.id)?.nameEn
            : project.epcProcesses?.find((m) => m.id === selected.id)?.nameEn,
    status: resolveBusinessChainModuleStatus(records, selected.kind, selected.id),
    path: getBusinessChainDisplayPath(project, selected.kind, selected.id),
  };
}

export function runGetSelectedNode(
  project: OntologyProject | null,
  selected: BusinessChainNodeRef | null,
): string {
  return JSON.stringify(buildSelectedNodeDetail(project, selected));
}
