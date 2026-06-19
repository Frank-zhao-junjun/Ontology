import type {
  CrossModuleRef,
  ModuleKind,
  ModuleVersionRecord,
  VersionPin,
} from '@/types/ontology';

export type ModuleVersionKey = {
  moduleKind: ModuleKind;
  moduleId: string;
};

function moduleKey(kind: ModuleKind, moduleId: string): string {
  return `${kind}:${moduleId}`;
}

function parseVersionNumber(version?: string): number {
  if (!version) return 0;
  const match = /^v(\d+)$/.exec(version);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function formatVersion(n: number): string {
  return `v${n}`;
}

function filterByModule(
  records: ModuleVersionRecord[],
  kind: ModuleKind,
  moduleId: string,
): ModuleVersionRecord[] {
  return records.filter((r) => r.moduleKind === kind && r.moduleId === moduleId);
}

export function getModuleDraft(
  records: ModuleVersionRecord[],
  kind: ModuleKind,
  moduleId: string,
): ModuleVersionRecord | undefined {
  return filterByModule(records, kind, moduleId).find((r) => r.status === 'draft');
}

export function getLatestConfirmed(
  records: ModuleVersionRecord[],
  kind: ModuleKind,
  moduleId: string,
): ModuleVersionRecord | undefined {
  const confirmed = filterByModule(records, kind, moduleId).filter(
    (r) => r.status === 'confirmed' && r.version,
  );
  if (confirmed.length === 0) return undefined;
  return confirmed.reduce((best, cur) =>
    parseVersionNumber(cur.version) > parseVersionNumber(best.version) ? cur : best,
  );
}

export function getConfirmedByVersion(
  records: ModuleVersionRecord[],
  kind: ModuleKind,
  moduleId: string,
  version: string,
): ModuleVersionRecord | undefined {
  return filterByModule(records, kind, moduleId).find(
    (r) =>
      r.version === version &&
      (r.status === 'confirmed' || r.status === 'archived'),
  );
}

export function sortModuleVersionsForDisplay(
  versions: ModuleVersionRecord[],
): ModuleVersionRecord[] {
  return versions.slice().sort((a, b) => {
    const order = (s: ModuleVersionRecord['status']) =>
      s === 'draft' ? 3 : s === 'confirmed' ? 2 : 1;
    const byStatus = order(b.status) - order(a.status);
    if (byStatus !== 0) return byStatus;
    return parseVersionNumber(b.version) - parseVersionNumber(a.version);
  });
}

export function getModuleVersions(
  records: ModuleVersionRecord[],
  kind: ModuleKind,
  moduleId: string,
): ModuleVersionRecord[] {
  return sortModuleVersionsForDisplay(filterByModule(records, kind, moduleId));
}

export function saveModuleDraft(
  records: ModuleVersionRecord[],
  input: {
    moduleKind: ModuleKind;
    moduleId: string;
    snapshot: unknown;
    now?: string;
    recordId?: string;
  },
): ModuleVersionRecord[] {
  const now = input.now ?? new Date().toISOString();
  const existing = getModuleDraft(records, input.moduleKind, input.moduleId);
  if (existing) {
    return records.map((r) =>
      r.id === existing.id ? { ...r, snapshot: input.snapshot } : r,
    );
  }
  const draft: ModuleVersionRecord = {
    id: input.recordId ?? `mvr-${input.moduleKind}-${input.moduleId}-draft`,
    moduleKind: input.moduleKind,
    moduleId: input.moduleId,
    status: 'draft',
    createdAt: now,
    snapshot: input.snapshot,
  };
  return [...records, draft];
}

export function forkConfirmedToDraft(
  records: ModuleVersionRecord[],
  input: {
    moduleKind: ModuleKind;
    moduleId: string;
    snapshot: unknown;
    now?: string;
    recordId?: string;
  },
): ModuleVersionRecord[] {
  if (getModuleDraft(records, input.moduleKind, input.moduleId)) {
    return saveModuleDraft(records, input);
  }
  return saveModuleDraft(records, input);
}

export function cancelModuleDraft(
  records: ModuleVersionRecord[],
  kind: ModuleKind,
  moduleId: string,
): ModuleVersionRecord[] {
  return records.filter(
    (record) =>
      !(record.moduleKind === kind && record.moduleId === moduleId && record.status === 'draft'),
  );
}

export function confirmModule(
  records: ModuleVersionRecord[],
  kind: ModuleKind,
  moduleId: string,
  now?: string,
): ModuleVersionRecord[] {
  const confirmedAt = now ?? new Date().toISOString();
  const draft = getModuleDraft(records, kind, moduleId);
  if (!draft) {
    throw new Error(`No draft to confirm for ${moduleKey(kind, moduleId)}`);
  }
  const latest = getLatestConfirmed(records, kind, moduleId);
  const nextNum = parseVersionNumber(latest?.version) + 1;
  const nextVersion = formatVersion(nextNum);

  return records.map((r) => {
    if (r.id === draft.id) {
      return {
        ...r,
        status: 'confirmed' as const,
        version: nextVersion,
        confirmedAt,
      };
    }
    if (
      r.moduleKind === kind &&
      r.moduleId === moduleId &&
      r.status === 'confirmed'
    ) {
      return { ...r, status: 'archived' as const };
    }
    return r;
  });
}

export function resolveModuleRef(
  records: ModuleVersionRecord[],
  ref: CrossModuleRef,
): ModuleVersionRecord | null {
  const { targetModuleKind, targetElementId, pin } = ref;
  if (pin === 'latest_confirmed') {
    return getLatestConfirmed(records, targetModuleKind, targetElementId) ?? null;
  }
  const pinned = getConfirmedByVersion(
    records,
    targetModuleKind,
    targetElementId,
    pin.version,
  );
  return pinned ?? null;
}

export function isResolvableRef(
  records: ModuleVersionRecord[],
  ref: CrossModuleRef,
): boolean {
  return resolveModuleRef(records, ref) !== null;
}

export function assertVersionPin(pin: VersionPin): void {
  if (pin !== 'latest_confirmed' && !/^v\d+$/.test(pin.version)) {
    throw new Error(`Invalid version pin: ${JSON.stringify(pin)}`);
  }
}
