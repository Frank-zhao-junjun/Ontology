import type { ModuleStatus } from '@/types/ontology';

export const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = {
  draft: 'draft',
  confirmed: 'confirmed',
  archived: 'archived',
};

export const MODULE_STATUS_TITLE: Record<ModuleStatus, string> = {
  draft: '草稿：尚未确认的版本',
  confirmed: '已确认：存在可用的已确认版本',
  archived: '已归档：当前无草稿或已确认版本，仅保留历史归档',
};

export function getModuleStatusTitle(status: ModuleStatus): string {
  return MODULE_STATUS_TITLE[status];
}
