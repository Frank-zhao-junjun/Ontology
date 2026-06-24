import { lintBusinessEpc } from '@/lib/business-epc-linter';
import type { EpcWarning } from '@/lib/business-epc-linter/types';
import { getLatestConfirmed } from '@/lib/module-version';
import type {
  Capability,
  EpcProcess,
  MetaDimension,
  MetaElement,
  ModuleKind,
  ModuleStatus,
  ModuleVersionRecord,
  OntologyProject,
  Scenario,
  ValueDomain,
} from '@/types/ontology';

export type SimplifiedChainModuleEntry<T> = {
  id: string;
  status: ModuleStatus;
  version?: string;
  snapshot: T;
};

export type SimplifiedChainMetaEntry = {
  id: string;
  dimension: MetaDimension;
  status: ModuleStatus;
  version?: string;
  snapshot: MetaElement;
};

export type SimplifiedChainExport = {
  valueDomains: SimplifiedChainModuleEntry<ValueDomain>[];
  capabilities: SimplifiedChainModuleEntry<Capability>[];
  scenarios: SimplifiedChainModuleEntry<Scenario>[];
  epcProcesses: SimplifiedChainModuleEntry<EpcProcess>[];
  metaElements: SimplifiedChainMetaEntry[];
};

export type CompileSimplifiedChainResult = {
  simplifiedChain: SimplifiedChainExport;
  epcWarnings: EpcWarning[];
};

function resolveSnapshot<T extends { id: string }>(
  records: ModuleVersionRecord[],
  kind: ModuleKind,
  live: T,
): SimplifiedChainModuleEntry<T> {
  const confirmed = getLatestConfirmed(records, kind, live.id);
  if (confirmed) {
    return {
      id: live.id,
      status: 'confirmed',
      version: confirmed.version,
      snapshot: confirmed.snapshot as T,
    };
  }
  return {
    id: live.id,
    status: 'draft',
    snapshot: live,
  };
}

function resolveMetaSnapshot(
  records: ModuleVersionRecord[],
  live: MetaElement,
): SimplifiedChainMetaEntry {
  const confirmed = getLatestConfirmed(records, live.dimension, live.id);
  if (confirmed) {
    return {
      id: live.id,
      dimension: live.dimension,
      status: 'confirmed',
      version: confirmed.version,
      snapshot: confirmed.snapshot as MetaElement,
    };
  }
  return {
    id: live.id,
    dimension: live.dimension,
    status: 'draft',
    snapshot: live,
  };
}

export function compileSimplifiedChain(
  project: Pick<
    OntologyProject,
    | 'valueDomains'
    | 'capabilities'
    | 'scenarios'
    | 'epcProcesses'
    | 'metaElements'
    | 'moduleVersionRecords'
  >,
): CompileSimplifiedChainResult {
  const records = project.moduleVersionRecords ?? [];
  const valueDomains = (project.valueDomains ?? []).map((item) =>
    resolveSnapshot(records, 'A', item),
  );
  const capabilities = (project.capabilities ?? []).map((item) =>
    resolveSnapshot(records, 'B', item),
  );
  const scenarios = (project.scenarios ?? []).map((item) =>
    resolveSnapshot(records, 'C', item),
  );
  const epcProcesses = (project.epcProcesses ?? []).map((item) =>
    resolveSnapshot(records, 'EPC', item),
  );
  const metaElements = (project.metaElements ?? []).map((item) =>
    resolveMetaSnapshot(records, item),
  );

  const epcWarnings = lintBusinessEpc({
    moduleVersionRecords: records,
    scenarios: project.scenarios,
    epcProcesses: project.epcProcesses,
    metaElements: project.metaElements,
  });

  return {
    simplifiedChain: {
      valueDomains,
      capabilities,
      scenarios,
      epcProcesses,
      metaElements,
    },
    epcWarnings,
  };
}
