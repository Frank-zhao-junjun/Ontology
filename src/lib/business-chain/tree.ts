import type {
  Capability,
  EpcProcess,
  Scenario,
  ValueDomain,
} from '@/types/ontology';

export type BusinessChainNodeKind = 'A' | 'B' | 'C' | 'EPC';

export interface BusinessChainTreeNode {
  kind: BusinessChainNodeKind;
  id: string;
  name: string;
  children: BusinessChainTreeNode[];
}

export interface BusinessChainSlices {
  valueDomains?: ValueDomain[];
  capabilities?: Capability[];
  scenarios?: Scenario[];
  epcProcesses?: EpcProcess[];
}

function emptySlices(): Required<BusinessChainSlices> {
  return {
    valueDomains: [],
    capabilities: [],
    scenarios: [],
    epcProcesses: [],
  };
}

export function normalizeBusinessChainSlices(
  slices: BusinessChainSlices,
): Required<BusinessChainSlices> {
  const base = emptySlices();
  return {
    valueDomains: slices.valueDomains ?? base.valueDomains,
    capabilities: slices.capabilities ?? base.capabilities,
    scenarios: slices.scenarios ?? base.scenarios,
    epcProcesses: slices.epcProcesses ?? base.epcProcesses,
  };
}

export function buildBusinessChainTree(slices: BusinessChainSlices): BusinessChainTreeNode[] {
  const data = normalizeBusinessChainSlices(slices);
  const aIds = new Set(data.valueDomains.map((a) => a.id));
  const validB = data.capabilities.filter((b) => aIds.has(b.parentId));
  const bIds = new Set(validB.map((b) => b.id));
  const validC = data.scenarios.filter((c) => bIds.has(c.parentId));
  const cIds = new Set(validC.map((c) => c.id));
  const validEpc = data.epcProcesses.filter((e) => cIds.has(e.parentId));

  return data.valueDomains.map((a) => ({
    kind: 'A',
    id: a.id,
    name: a.name,
    children: validB
      .filter((b) => b.parentId === a.id)
      .map((b) => ({
        kind: 'B' as const,
        id: b.id,
        name: b.name,
        children: validC
          .filter((c) => c.parentId === b.id)
          .map((c) => ({
            kind: 'C' as const,
            id: c.id,
            name: c.name,
            children: validEpc
              .filter((e) => e.parentId === c.id)
              .map((e) => ({
                kind: 'EPC' as const,
                id: e.id,
                name: e.name,
                children: [],
              })),
          })),
      })),
  }));
}

export function findBusinessChainNode(
  slices: BusinessChainSlices,
  kind: BusinessChainNodeKind,
  id: string,
): BusinessChainTreeNode | undefined {
  const walk = (nodes: BusinessChainTreeNode[]): BusinessChainTreeNode | undefined => {
    for (const node of nodes) {
      if (node.kind === kind && node.id === id) return node;
      const found = walk(node.children);
      if (found) return found;
    }
    return undefined;
  };
  return walk(buildBusinessChainTree(slices));
}

export function getBusinessChainDisplayPath(
  slices: BusinessChainSlices,
  kind: BusinessChainNodeKind,
  id: string,
): string {
  const data = normalizeBusinessChainSlices(slices);

  if (kind === 'A') {
    return data.valueDomains.find((a) => a.id === id)?.name ?? '';
  }
  if (kind === 'B') {
    const b = data.capabilities.find((item) => item.id === id);
    if (!b) return '';
    const a = data.valueDomains.find((item) => item.id === b.parentId);
    return [a?.name, b.name].filter(Boolean).join('/');
  }
  if (kind === 'C') {
    const c = data.scenarios.find((item) => item.id === id);
    if (!c) return '';
    const b = data.capabilities.find((item) => item.id === c.parentId);
    const a = b ? data.valueDomains.find((item) => item.id === b.parentId) : undefined;
    return [a?.name, b?.name, c.name].filter(Boolean).join('/');
  }

  const epc = data.epcProcesses.find((item) => item.id === id);
  if (!epc) return '';
  const c = data.scenarios.find((item) => item.id === epc.parentId);
  const b = c ? data.capabilities.find((item) => item.id === c.parentId) : undefined;
  const a = b ? data.valueDomains.find((item) => item.id === b.parentId) : undefined;
  return [a?.name, b?.name, c?.name, epc.name].filter(Boolean).join('/');
}

export function canDeleteBusinessChainNode(
  slices: BusinessChainSlices,
  kind: BusinessChainNodeKind,
  id: string,
): boolean {
  const data = normalizeBusinessChainSlices(slices);

  if (kind === 'A') {
    return !data.capabilities.some((b) => b.parentId === id);
  }
  if (kind === 'B') {
    return !data.scenarios.some((c) => c.parentId === id);
  }
  if (kind === 'C') {
    return !data.epcProcesses.some((e) => e.parentId === id);
  }
  return true;
}
