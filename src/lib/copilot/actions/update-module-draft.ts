import type { ModuleDraftSuggestion } from '@/lib/ai-draft';
import {
  fuzzyMatchModule,
  resolveModuleTarget,
  type ModuleCandidate,
  type ModuleTargetKind,
} from '@/lib/copilot/resolve-module-target';
import type { useOntologyStore } from '@/store/ontology-store';
import type { ModuleVersionRecord, OntologyProject } from '@/types/ontology';

type StoreSlice = Pick<
  ReturnType<typeof useOntologyStore.getState>,
  | 'forkModuleToDraft'
  | 'applyAiModuleDraft'
  | 'updateValueDomain'
  | 'updateCapability'
  | 'updateScenario'
  | 'updateEpcProcess'
  | 'project'
>;

export interface UpdateModuleDraftInput {
  name: string;
  kind: ModuleTargetKind;
  userText: string;
  updates: ModuleDraftSuggestion;
}

export interface UpdateModuleDraftResult {
  mode: 'fork' | 'create' | 'update';
  moduleId?: string;
  moduleName?: string;
  message: string;
}

function modulesForKind(project: OntologyProject, kind: ModuleTargetKind): ModuleCandidate[] {
  if (kind === 'A') {
    return (project.valueDomains ?? []).map((m) => ({ id: m.id, name: m.name, nameEn: m.nameEn }));
  }
  if (kind === 'B') {
    return (project.capabilities ?? []).map((m) => ({ id: m.id, name: m.name, nameEn: m.nameEn }));
  }
  if (kind === 'C') {
    return (project.scenarios ?? []).map((m) => ({ id: m.id, name: m.name, nameEn: m.nameEn }));
  }
  return (project.epcProcesses ?? []).map((m) => ({ id: m.id, name: m.name, nameEn: m.nameEn }));
}

function findNodeSnapshot(
  project: OntologyProject,
  kind: ModuleTargetKind,
  moduleId: string,
): unknown {
  if (kind === 'A') return project.valueDomains?.find((m) => m.id === moduleId);
  if (kind === 'B') return project.capabilities?.find((m) => m.id === moduleId);
  if (kind === 'C') return project.scenarios?.find((m) => m.id === moduleId);
  return project.epcProcesses?.find((m) => m.id === moduleId);
}

function applyUpdates(
  store: StoreSlice,
  kind: ModuleTargetKind,
  moduleId: string,
  updates: ModuleDraftSuggestion,
): void {
  const payload = {
    name: updates.name,
    nameEn: updates.nameEn,
    description: updates.description,
    semantics: updates.semantics,
  };

  if (updates.semantics != null || updates.steps != null) {
    store.applyAiModuleDraft(kind, moduleId, updates);
    return;
  }

  if (kind === 'A') store.updateValueDomain(moduleId, payload);
  else if (kind === 'B') store.updateCapability(moduleId, payload);
  else if (kind === 'C') store.updateScenario(moduleId, payload);
  else store.updateEpcProcess(moduleId, payload);
}

export function runUpdateModuleDraft(
  store: StoreSlice,
  input: UpdateModuleDraftInput,
): UpdateModuleDraftResult {
  const project = store.project;
  if (!project) throw new Error('没有活动项目');

  const records: ModuleVersionRecord[] = project.moduleVersionRecords ?? [];
  const modules = modulesForKind(project, input.kind);
  const resolved = resolveModuleTarget({
    name: input.name,
    kind: input.kind,
    userText: input.userText,
    modules,
    records,
  });

  if (resolved.mode === 'create') {
    return {
      mode: 'create',
      message: `未找到可更新的模块「${input.name}」，请使用 create* Action 新建`,
    };
  }

  const moduleId = resolved.moduleId!;
  const match = resolved.match ?? fuzzyMatchModule(input.name, modules);
  const moduleName = match?.name ?? input.name;
  const snapshot = findNodeSnapshot(project, input.kind, moduleId);

  if (resolved.mode === 'fork') {
    if (snapshot) {
      store.forkModuleToDraft(input.kind, moduleId, snapshot);
    }
    applyUpdates(store, input.kind, moduleId, input.updates);
    return {
      mode: 'fork',
      moduleId,
      moduleName,
      message: `模块「${moduleName}」已有 confirmed 版本，已 fork 到 draft 并应用更新`,
    };
  }

  applyUpdates(store, input.kind, moduleId, input.updates);
  return {
    mode: 'update',
    moduleId,
    moduleName,
    message: `已更新模块「${moduleName}」draft`,
  };
}
