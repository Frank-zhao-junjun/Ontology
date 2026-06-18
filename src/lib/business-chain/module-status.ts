import type { BusinessChainNodeKind } from '@/lib/business-chain/tree';
import {
  getLatestConfirmed,
  getModuleDraft,
  getModuleVersions,
} from '@/lib/module-version';
import type { ModuleStatus, ModuleVersionRecord } from '@/types/ontology';

export function resolveBusinessChainModuleStatus(
  records: ModuleVersionRecord[],
  kind: BusinessChainNodeKind,
  moduleId: string,
): ModuleStatus {
  if (getModuleDraft(records, kind, moduleId)) {
    return 'draft';
  }
  if (getLatestConfirmed(records, kind, moduleId)) {
    return 'confirmed';
  }
  const hasArchived = getModuleVersions(records, kind, moduleId).some(
    (record) => record.status === 'archived',
  );
  if (hasArchived) {
    return 'archived';
  }
  return 'draft';
}
