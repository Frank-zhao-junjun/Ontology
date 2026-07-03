/**
 * @ontology/core — Business Chain CRUD pure functions
 *
 * All functions are (project, ...args) => { project, node? }.
 * No UI state, no zustand dependency.
 */

import type {
  OntologyProject,
  ValueDomain,
  Capability,
  Scenario,
  EpcProcess,
  SemanticsBlock,
  ModuleVersionRecord,
  BusinessNodeBase,
} from '@/types/ontology';
import { canDeleteBusinessChainNode, type BusinessChainNodeKind } from '@/lib/business-chain/tree';
import { saveModuleDraft as saveModuleDraftRecord } from '@/lib/module-version';
import { generateId } from '@/lib/id';

// ========== Shared helpers ==========

export type BusinessChainNodeInput = {
  name: string;
  nameEn?: string;
  description?: string;
  semantics?: SemanticsBlock;
  autoGenerateMetamodels?: boolean;
};

function normalizeInput(
  input: BusinessChainNodeInput,
): Pick<BusinessNodeBase, 'name' | 'nameEn' | 'description' | 'semantics'> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('名称不能为空');
  }
  return {
    name,
    nameEn: input.nameEn?.trim() || undefined,
    description: input.description?.trim() || undefined,
    semantics: input.semantics,
  };
}

function mergeUpdates<T extends { name: string; nameEn?: string; description?: string }>(
  current: T,
  updates: Partial<BusinessChainNodeInput>,
): T {
  const next = { ...current };
  if (updates.name !== undefined) {
    next.name = updates.name.trim();
  }
  if (updates.nameEn !== undefined) {
    next.nameEn = updates.nameEn.trim() || undefined;
  }
  if (updates.description !== undefined) {
    next.description = updates.description.trim() || undefined;
  }
  if (!next.name.trim()) throw new Error('名称不能为空');
  return next;
}

function saveDraft(
  records: ModuleVersionRecord[],
  moduleKind: BusinessChainNodeKind,
  moduleId: string,
  snapshot: unknown,
): ModuleVersionRecord[] {
  return saveModuleDraftRecord(records ?? [], {
    moduleKind,
    moduleId,
    snapshot,
    recordId: generateId(),
  });
}

// ========== A — 业务价值域 ==========

export function addValueDomain(
  project: OntologyProject,
  input: BusinessChainNodeInput,
): { project: OntologyProject; node: ValueDomain } {
  const fields = normalizeInput(input);
  const node: ValueDomain = { id: generateId(), ...fields };
  const valueDomains = [...(project.valueDomains ?? []), node];
  const moduleVersionRecords = saveDraft(
    project.moduleVersionRecords ?? [],
    'A',
    node.id,
    node,
  );
  return {
    project: {
      ...project,
      valueDomains,
      moduleVersionRecords,
      updatedAt: new Date().toISOString(),
    },
    node,
  };
}

export function updateValueDomain(
  project: OntologyProject,
  id: string,
  updates: Partial<BusinessChainNodeInput>,
): OntologyProject {
  const valueDomains = project.valueDomains ?? [];
  const index = valueDomains.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('业务价值域不存在');
  const current = valueDomains[index] as ValueDomain & { nameEn?: string; description?: string };
  // We spread original fields, then override; nameEn, description handled by mergeUpdates
  const raw: ValueDomain & { nameEn?: string; description?: string } = {
    ...current,
  };
  const nextNode = mergeUpdates(raw, updates) as ValueDomain;
  const nextDomains = valueDomains.slice();
  nextDomains[index] = nextNode;
  const moduleVersionRecords = saveDraft(
    project.moduleVersionRecords ?? [],
    'A',
    id,
    nextNode,
  );
  return {
    ...project,
    valueDomains: nextDomains,
    moduleVersionRecords,
    updatedAt: new Date().toISOString(),
  };
}

export function deleteValueDomain(
  project: OntologyProject,
  id: string,
): OntologyProject {
  const slices = {
    valueDomains: project.valueDomains,
    capabilities: project.capabilities,
    scenarios: project.scenarios,
    epcProcesses: project.epcProcesses,
  };
  if (!canDeleteBusinessChainNode(slices, 'A', id)) {
    throw new Error('存在子节点，无法删除');
  }
  return {
    ...project,
    valueDomains: (project.valueDomains ?? []).filter((item) => item.id !== id),
    updatedAt: new Date().toISOString(),
  };
}

// ========== B — 业务能力 ==========

export function addCapability(
  project: OntologyProject,
  parentAId: string,
  input: BusinessChainNodeInput,
): { project: OntologyProject; node: Capability } {
  if (!(project.valueDomains ?? []).some((item) => item.id === parentAId)) {
    throw new Error('父级业务价值域不存在');
  }
  const fields = normalizeInput(input);
  const node: Capability = { id: generateId(), parentId: parentAId, ...fields };
  const capabilities = [...(project.capabilities ?? []), node];
  const moduleVersionRecords = saveDraft(
    project.moduleVersionRecords ?? [],
    'B',
    node.id,
    node,
  );
  return {
    project: {
      ...project,
      capabilities,
      moduleVersionRecords,
      updatedAt: new Date().toISOString(),
    },
    node,
  };
}

export function updateCapability(
  project: OntologyProject,
  id: string,
  updates: Partial<BusinessChainNodeInput>,
): OntologyProject {
  const capabilities = project.capabilities ?? [];
  const index = capabilities.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('业务能力不存在');
  const current = capabilities[index] as Capability & { nameEn?: string; description?: string };
  const raw: Capability & { nameEn?: string; description?: string } = { ...current };
  const nextNode = mergeUpdates(raw, updates) as Capability;
  const nextList = capabilities.slice();
  nextList[index] = nextNode;
  const moduleVersionRecords = saveDraft(
    project.moduleVersionRecords ?? [],
    'B',
    id,
    nextNode,
  );
  return {
    ...project,
    capabilities: nextList,
    moduleVersionRecords,
    updatedAt: new Date().toISOString(),
  };
}

export function deleteCapability(
  project: OntologyProject,
  id: string,
): OntologyProject {
  const slices = {
    valueDomains: project.valueDomains,
    capabilities: project.capabilities,
    scenarios: project.scenarios,
    epcProcesses: project.epcProcesses,
  };
  if (!canDeleteBusinessChainNode(slices, 'B', id)) {
    throw new Error('存在子节点，无法删除');
  }
  return {
    ...project,
    capabilities: (project.capabilities ?? []).filter((item) => item.id !== id),
    updatedAt: new Date().toISOString(),
  };
}

// ========== C — 业务场景 ==========

export function addScenario(
  project: OntologyProject,
  parentBId: string,
  input: BusinessChainNodeInput,
): { project: OntologyProject; node: Scenario } {
  if (!(project.capabilities ?? []).some((item) => item.id === parentBId)) {
    throw new Error('父级业务能力不存在');
  }
  const fields = normalizeInput(input);
  const node: Scenario = { id: generateId(), parentId: parentBId, ...fields };
  const scenarios = [...(project.scenarios ?? []), node];
  const moduleVersionRecords = saveDraft(
    project.moduleVersionRecords ?? [],
    'C',
    node.id,
    node,
  );
  return {
    project: {
      ...project,
      scenarios,
      moduleVersionRecords,
      updatedAt: new Date().toISOString(),
    },
    node,
  };
}

export function updateScenario(
  project: OntologyProject,
  id: string,
  updates: Partial<BusinessChainNodeInput>,
): OntologyProject {
  const scenarios = project.scenarios ?? [];
  const index = scenarios.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('业务场景不存在');
  const current = scenarios[index] as Scenario & { nameEn?: string; description?: string };
  const raw: Scenario & { nameEn?: string; description?: string } = { ...current };
  const nextNode = mergeUpdates(raw, updates) as Scenario;
  const nextList = scenarios.slice();
  nextList[index] = nextNode;
  const moduleVersionRecords = saveDraft(
    project.moduleVersionRecords ?? [],
    'C',
    id,
    nextNode,
  );
  return {
    ...project,
    scenarios: nextList,
    moduleVersionRecords,
    updatedAt: new Date().toISOString(),
  };
}

export function deleteScenario(
  project: OntologyProject,
  id: string,
): OntologyProject {
  const slices = {
    valueDomains: project.valueDomains,
    capabilities: project.capabilities,
    scenarios: project.scenarios,
    epcProcesses: project.epcProcesses,
  };
  if (!canDeleteBusinessChainNode(slices, 'C', id)) {
    throw new Error('存在子节点，无法删除');
  }
  return {
    ...project,
    scenarios: (project.scenarios ?? []).filter((item) => item.id !== id),
    updatedAt: new Date().toISOString(),
  };
}

// ========== D / EPC — 业务流程 ==========

export function addEpcProcess(
  project: OntologyProject,
  parentCId: string,
  input: BusinessChainNodeInput,
): { project: OntologyProject; node: EpcProcess } {
  if (!(project.scenarios ?? []).some((item) => item.id === parentCId)) {
    throw new Error('父级业务场景不存在');
  }
  const fields = normalizeInput(input);
  const node: EpcProcess = {
    id: generateId(),
    parentId: parentCId,
    steps: [],
    ...fields,
    autoGenerateMetamodels: input.autoGenerateMetamodels ?? false,
  };
  const epcProcesses = [...(project.epcProcesses ?? []), node];
  const moduleVersionRecords = saveDraft(
    project.moduleVersionRecords ?? [],
    'EPC',
    node.id,
    node,
  );
  return {
    project: {
      ...project,
      epcProcesses,
      moduleVersionRecords,
      updatedAt: new Date().toISOString(),
    },
    node,
  };
}

export function updateEpcProcess(
  project: OntologyProject,
  id: string,
  updates: Partial<BusinessChainNodeInput>,
): OntologyProject {
  const epcProcesses = project.epcProcesses ?? [];
  const index = epcProcesses.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('EPC 流程不存在');
  const current = epcProcesses[index] as EpcProcess & { nameEn?: string; description?: string };
  const raw: EpcProcess & { nameEn?: string; description?: string } = { ...current };
  const nextNode = mergeUpdates(raw, updates) as EpcProcess;
  const nextList = epcProcesses.slice();
  nextList[index] = nextNode;
  const moduleVersionRecords = saveDraft(
    project.moduleVersionRecords ?? [],
    'EPC',
    id,
    nextNode,
  );
  return {
    ...project,
    epcProcesses: nextList,
    moduleVersionRecords,
    updatedAt: new Date().toISOString(),
  };
}

export function deleteEpcProcess(
  project: OntologyProject,
  id: string,
): OntologyProject {
  return {
    ...project,
    epcProcesses: (project.epcProcesses ?? []).filter((item) => item.id !== id),
    updatedAt: new Date().toISOString(),
  };
}
