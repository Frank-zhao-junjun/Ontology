import type { BusinessChainNodeKind } from '@/lib/business-chain/tree';
import type { EpcProcess, MetaElement, OntologyProject } from '@/types/ontology';

export type ModuleReferenceLink = {
  kind: BusinessChainNodeKind | 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
  id: string;
  name: string;
  relation: string;
};

function findName(project: OntologyProject, kind: BusinessChainNodeKind, id: string): string {
  if (kind === 'A') {
    return project.valueDomains?.find((item) => item.id === id)?.name ?? id;
  }
  if (kind === 'B') {
    return project.capabilities?.find((item) => item.id === id)?.name ?? id;
  }
  if (kind === 'C') {
    return project.scenarios?.find((item) => item.id === id)?.name ?? id;
  }
  return project.epcProcesses?.find((item) => item.id === id)?.name ?? id;
}

export function listIncomingModuleReferences(
  project: OntologyProject,
  kind: BusinessChainNodeKind,
  moduleId: string,
): ModuleReferenceLink[] {
  const links: ModuleReferenceLink[] = [];

  if (kind === 'A') {
    for (const item of project.capabilities ?? []) {
      if (item.parentId === moduleId) {
        links.push({ kind: 'B', id: item.id, name: item.name, relation: '子能力' });
      }
    }
  }

  if (kind === 'B') {
    for (const item of project.scenarios ?? []) {
      if (item.parentId === moduleId) {
        links.push({ kind: 'C', id: item.id, name: item.name, relation: '子场景' });
      }
    }
  }

  if (kind === 'C') {
    for (const item of project.epcProcesses ?? []) {
      if (item.parentId === moduleId) {
        links.push({ kind: 'EPC', id: item.id, name: item.name, relation: '子流程' });
      }
    }
  }

  if (kind === 'EPC') {
    for (const element of project.metaElements ?? []) {
      const refs = element.usageRefs ?? [];
      if (refs.some((ref) => ref.epcId === moduleId)) {
        links.push({
          kind: element.dimension,
          id: element.id,
          name: element.name,
          relation: '流程引用要素',
        });
      }
    }
  }

  return links;
}

export function listOutgoingModuleReferences(
  project: OntologyProject,
  kind: BusinessChainNodeKind,
  moduleId: string,
): ModuleReferenceLink[] {
  const links: ModuleReferenceLink[] = [];

  if (kind === 'B') {
    const node = project.capabilities?.find((item) => item.id === moduleId);
    if (node?.parentId) {
      links.push({
        kind: 'A',
        id: node.parentId,
        name: findName(project, 'A', node.parentId),
        relation: '所属价值域',
      });
    }
  }

  if (kind === 'C') {
    const node = project.scenarios?.find((item) => item.id === moduleId);
    if (node?.parentId) {
      links.push({
        kind: 'B',
        id: node.parentId,
        name: findName(project, 'B', node.parentId),
        relation: '所属能力',
      });
    }
  }

  if (kind === 'EPC') {
    const epc = project.epcProcesses?.find((item) => item.id === moduleId);
    if (epc?.parentId) {
      links.push({
        kind: 'C',
        id: epc.parentId,
        name: findName(project, 'C', epc.parentId),
        relation: '所属场景',
      });
    }
    const metaMap = new Map<string, MetaElement>();
    for (const element of project.metaElements ?? []) {
      metaMap.set(element.id, element);
    }
    for (const step of (epc as EpcProcess | undefined)?.steps ?? []) {
      const elementId = step.elementRef?.elementId?.trim();
      if (!elementId) continue;
      const element = metaMap.get(elementId);
      links.push({
        kind: step.elementRef!.dimension,
        id: elementId,
        name: element?.name ?? elementId,
        relation: '步骤引用要素',
      });
    }
  }

  return links;
}
