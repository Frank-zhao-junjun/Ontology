import type {
  OntologyManifestProcess,
  ManifestOrchestration,
  ManifestProcessStep,
} from '@/lib/manifest-validator/types';
import type { OntologyProject, EpcProcess, EpcStep } from '@/types/ontology';
import { toStableId } from './mappers/utils';

/**
 * 将设计台 ProcessModel + EPC 业务流程编译为 Manifest process section。
 * EPC 流程作为 source='epc' 的 orchestration 输出，步骤中包含 elementRef 信息。
 */
export function compileProcess(
  project: OntologyProject
): OntologyManifestProcess {
  const orchestrations: ManifestOrchestration[] = [];

  // 1. 传统 Orchestration（兼容保留）
  const legacyOrchs = project.processModel?.orchestrations ?? [];
  for (const orch of legacyOrchs) {
    orchestrations.push(mapOrchestration(orch, 'orchestration'));
  }

  // 2. EPC 业务流程（主要来源）
  const epcProcesses = project.epcProcesses ?? [];
  for (const epc of epcProcesses) {
    orchestrations.push(mapEpcProcess(epc));
  }

  return { orchestrations };
}

function mapOrchestration(orch: {
  id: string;
  name: string;
  entryPoint?: string;
  steps?: Array<{
    id: string;
    name?: string;
    type: string;
    actionId?: string;
    targetEntityId?: string;
    description?: string;
  }>;
  description?: string;
}, source: 'orchestration' | 'epc' = 'orchestration'): ManifestOrchestration {
  return {
    id: toStableId(orch.id),
    name: orch.name,
    entryPoint: orch.entryPoint || '',
    steps: (orch.steps || []).map(mapLegacyStep),
    description: orch.description,
    source,
  };
}

function mapEpcProcess(epc: EpcProcess): ManifestOrchestration {
  return {
    id: toStableId(epc.id),
    name: epc.name,
    entryPoint: '',
    steps: (epc.steps || []).map(mapEpcStep),
    description: epc.description,
    source: 'epc',
    parentId: epc.parentId,
  };
}

function mapLegacyStep(step: {
  id: string;
  name?: string;
  type: string;
  actionId?: string;
  targetEntityId?: string;
  description?: string;
}): ManifestProcessStep {
  return {
    id: toStableId(step.id),
    name: step.name,
    type: step.type,
    actionId: step.actionId,
    targetEntityId: step.targetEntityId,
    description: step.description,
  };
}

function mapEpcStep(step: EpcStep): ManifestProcessStep {
  const ref = step.elementRef;
  return {
    id: toStableId(step.id),
    name: step.name,
    type: 'epc_step',
    dimension: ref?.dimension,
    elementId: ref?.elementId,
    elementName: ref?.elementName,
  };
}
