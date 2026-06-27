import { resolveBusinessChainModuleStatus } from '@/lib/business-chain/module-status';
import { getLatestConfirmed, getModuleDraft } from '@/lib/module-version';
import type { ModuleTargetKind } from '@/lib/copilot/resolve-module-target';
import type {
  Capability,
  EpcProcess,
  OntologyProject,
  Scenario,
  ValueDomain,
} from '@/types/ontology';

export interface GetModuleDetailInput {
  kind: ModuleTargetKind;
  id: string;
}

export interface ModuleDetailResult {
  kind: ModuleTargetKind;
  id: string;
  name?: string;
  nameEn?: string;
  status: string;
  draftSnapshot?: unknown;
  confirmedSnapshot?: unknown;
  liveNode?: unknown;
}

function findLiveNode(
  project: OntologyProject,
  kind: ModuleTargetKind,
  id: string,
): ValueDomain | Capability | Scenario | EpcProcess | undefined {
  if (kind === 'A') return project.valueDomains?.find((m) => m.id === id);
  if (kind === 'B') return project.capabilities?.find((m) => m.id === id);
  if (kind === 'C') return project.scenarios?.find((m) => m.id === id);
  return project.epcProcesses?.find((m) => m.id === id);
}

export function buildModuleDetail(
  project: OntologyProject,
  input: GetModuleDetailInput,
): ModuleDetailResult {
  const records = project.moduleVersionRecords ?? [];
  const draft = getModuleDraft(records, input.kind, input.id);
  const confirmed = getLatestConfirmed(records, input.kind, input.id);
  const liveNode = findLiveNode(project, input.kind, input.id);
  const status = resolveBusinessChainModuleStatus(records, input.kind, input.id);

  return {
    kind: input.kind,
    id: input.id,
    name: liveNode?.name,
    nameEn: liveNode?.nameEn,
    status,
    draftSnapshot: draft?.snapshot,
    confirmedSnapshot: confirmed?.snapshot,
    liveNode,
  };
}

export function runGetModuleDetail(project: OntologyProject, input: GetModuleDetailInput): string {
  return JSON.stringify(buildModuleDetail(project, input));
}
