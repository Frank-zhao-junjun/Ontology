import {
  confirmModule,
  getLatestConfirmed,
  getModuleDraft,
} from '@/lib/module-version';
import type {
  Capability,
  EpcProcess,
  MetaDimension,
  MetaElement,
  ModuleKind,
  ModuleVersionRecord,
  OntologyProject,
  Scenario,
  ValueDomain,
} from '@/types/ontology';

const META_DIMENSIONS = new Set<MetaDimension>(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8']);
const META_MODULE_KINDS = new Set<ModuleKind>(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8']);

export type ValidationError = {
  field: string;
  message: string;
};

export type ConfirmFlowProject = Pick<
  OntologyProject,
  'valueDomains' | 'capabilities' | 'scenarios' | 'epcProcesses' | 'metaElements' | 'moduleVersionRecords'
>;

type SnapshotRecord = {
  name?: string;
  parentId?: string;
  dimension?: string;
};

function readSnapshot(snapshot: unknown): SnapshotRecord {
  if (snapshot && typeof snapshot === 'object') {
    return snapshot as SnapshotRecord;
  }
  return {};
}

export function validateConfirm(
  moduleKind: ModuleKind,
  draftSnapshot: unknown,
  project: ConfirmFlowProject,
): ValidationError[] {
  const snapshot = readSnapshot(draftSnapshot);
  const errors: ValidationError[] = [];

  if (!snapshot.name?.trim()) {
    errors.push({ field: 'name', message: '名称不能为空' });
  }

  if (moduleKind === 'B') {
    const parentId = snapshot.parentId?.trim();
    if (!parentId) {
      errors.push({ field: 'parentId', message: '必须选择所属价值域' });
    } else if (!(project.valueDomains ?? []).some((item) => item.id === parentId)) {
      errors.push({ field: 'parentId', message: '所属价值域不存在' });
    }
  }

  if (moduleKind === 'C') {
    const parentId = snapshot.parentId?.trim();
    if (!parentId) {
      errors.push({ field: 'parentId', message: '必须选择所属能力' });
    } else if (!(project.capabilities ?? []).some((item) => item.id === parentId)) {
      errors.push({ field: 'parentId', message: '所属能力不存在' });
    }
  }

  if (moduleKind === 'EPC') {
    const parentId = snapshot.parentId?.trim();
    if (!parentId) {
      errors.push({ field: 'parentId', message: '必须归属业务场景' });
    } else if (!(project.scenarios ?? []).some((item) => item.id === parentId)) {
      errors.push({ field: 'parentId', message: '所属业务场景不存在' });
    }
  }

  if (moduleKind.startsWith('E') && META_MODULE_KINDS.has(moduleKind)) {
    const dimension = snapshot.dimension as MetaDimension | undefined;
    if (!dimension || !META_DIMENSIONS.has(dimension)) {
      errors.push({ field: 'dimension', message: '要素维度无效' });
    }
    if (moduleKind !== dimension) {
      errors.push({ field: 'dimension', message: '要素维度与模块类型不一致' });
    }
  }

  return errors;
}

export type ConfirmFlowSuccess = {
  ok: true;
  moduleVersionRecords: ModuleVersionRecord[];
  confirmed: ModuleVersionRecord;
  archived?: ModuleVersionRecord;
};

export type ConfirmFlowFailure = {
  ok: false;
  errors: ValidationError[];
};

export function runConfirmFlow(
  project: ConfirmFlowProject,
  moduleKind: ModuleKind,
  moduleId: string,
  now?: string,
): ConfirmFlowSuccess | ConfirmFlowFailure {
  const records = project.moduleVersionRecords ?? [];
  const draft = getModuleDraft(records, moduleKind, moduleId);
  if (!draft) {
    return { ok: false, errors: [{ field: 'draft', message: '没有可确认的草稿' }] };
  }

  const errors = validateConfirm(moduleKind, draft.snapshot, project);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const priorConfirmed = getLatestConfirmed(records, moduleKind, moduleId);
  const nextRecords = confirmModule(records, moduleKind, moduleId, now);
  const confirmed = getLatestConfirmed(nextRecords, moduleKind, moduleId);
  if (!confirmed) {
    return { ok: false, errors: [{ field: 'confirm', message: '确认失败' }] };
  }

  let archived: ModuleVersionRecord | undefined;
  if (priorConfirmed) {
    archived = nextRecords.find(
      (record) => record.id === priorConfirmed.id && record.status === 'archived',
    );
  }

  return { ok: true, moduleVersionRecords: nextRecords, confirmed, archived };
}

export function applyModuleSnapshotToProject(
  project: OntologyProject,
  moduleKind: ModuleKind,
  moduleId: string,
  snapshot: unknown,
): OntologyProject {
  if (moduleKind === 'A') {
    const node = snapshot as ValueDomain;
    return {
      ...project,
      valueDomains: (project.valueDomains ?? []).map((item) =>
        item.id === moduleId ? { ...item, ...node, id: moduleId } : item,
      ),
    };
  }
  if (moduleKind === 'B') {
    const node = snapshot as Capability;
    return {
      ...project,
      capabilities: (project.capabilities ?? []).map((item) =>
        item.id === moduleId ? { ...item, ...node, id: moduleId } : item,
      ),
    };
  }
  if (moduleKind === 'C') {
    const node = snapshot as Scenario;
    return {
      ...project,
      scenarios: (project.scenarios ?? []).map((item) =>
        item.id === moduleId ? { ...item, ...node, id: moduleId } : item,
      ),
    };
  }
  if (moduleKind === 'EPC') {
    const node = snapshot as EpcProcess;
    return {
      ...project,
      epcProcesses: (project.epcProcesses ?? []).map((item) =>
        item.id === moduleId ? { ...item, ...node, id: moduleId } : item,
      ),
    };
  }
  if (moduleKind.startsWith('E') && META_MODULE_KINDS.has(moduleKind)) {
    const node = snapshot as MetaElement;
    return {
      ...project,
      metaElements: (project.metaElements ?? []).map((item) =>
        item.id === moduleId ? { ...item, ...node, id: moduleId } : item,
      ),
    };
  }
  return project;
}
