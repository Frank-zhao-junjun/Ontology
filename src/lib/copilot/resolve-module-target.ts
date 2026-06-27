import { getLatestConfirmed, getModuleDraft } from '@/lib/module-version';
import type { ModuleKind, ModuleVersionRecord } from '@/types/ontology';

export type ModuleTargetKind = Extract<ModuleKind, 'A' | 'B' | 'C' | 'EPC'>;

export interface ModuleCandidate {
  id: string;
  name: string;
  nameEn?: string;
}

export type ModuleTargetMode = 'fork' | 'create' | 'update';

export interface ResolveModuleTargetResult {
  mode: ModuleTargetMode;
  moduleId?: string;
  match?: ModuleCandidate;
}

export interface ResolveModuleTargetInput {
  name: string;
  kind: ModuleTargetKind;
  userText: string;
  modules: ModuleCandidate[];
  records: ModuleVersionRecord[];
}

const MODIFY_PATTERNS = /改|修改|更新|改成|改为|调整|变更|替换|rename/i;
const NEW_PATTERNS = /新建|创建|新增|添加|加一个|再建|another|new/i;

export function isModifyIntent(userText: string): boolean {
  return MODIFY_PATTERNS.test(userText);
}

export function isNewIntent(userText: string): boolean {
  return NEW_PATTERNS.test(userText);
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function fuzzyMatchModule(name: string, modules: ModuleCandidate[]): ModuleCandidate | undefined {
  const needle = normalizeName(name);
  if (!needle) return undefined;

  const exact = modules.find(
    (m) => normalizeName(m.name) === needle || (m.nameEn && normalizeName(m.nameEn) === needle),
  );
  if (exact) return exact;

  return modules.find(
    (m) =>
      normalizeName(m.name).includes(needle) ||
      needle.includes(normalizeName(m.name)) ||
      (m.nameEn != null &&
        (normalizeName(m.nameEn).includes(needle) || needle.includes(normalizeName(m.nameEn)))),
  );
}

function resolveModuleStatus(
  kind: ModuleTargetKind,
  moduleId: string,
  records: ModuleVersionRecord[],
): 'draft' | 'confirmed' | 'none' {
  if (getModuleDraft(records, kind, moduleId)) return 'draft';
  if (getLatestConfirmed(records, kind, moduleId)) return 'confirmed';
  return 'none';
}

export function resolveModuleTarget(input: ResolveModuleTargetInput): ResolveModuleTargetResult {
  const match = fuzzyMatchModule(input.name, input.modules);
  if (!match) {
    return { mode: 'create' };
  }

  const status = resolveModuleStatus(input.kind, match.id, input.records);

  if (status === 'draft') {
    return { mode: 'update', moduleId: match.id, match };
  }

  if (status === 'confirmed') {
    if (isNewIntent(input.userText)) {
      return { mode: 'create' };
    }
    if (isModifyIntent(input.userText)) {
      return { mode: 'fork', moduleId: match.id, match };
    }
    return { mode: 'fork', moduleId: match.id, match };
  }

  return { mode: 'create' };
}
