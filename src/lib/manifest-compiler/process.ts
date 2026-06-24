import type {
  OntologyManifestProcess,
  ManifestOrchestration,
  ManifestProcessStep,
} from '@/lib/manifest-validator/types';
import type { OntologyProject } from '@/types/ontology';
import { toStableId } from './mappers/utils';

/**
 * 将设计台 ProcessModel 编译为 Manifest process section。
 */
export function compileProcess(
  project: OntologyProject
): OntologyManifestProcess {
  const orchestrations = project.processModel?.orchestrations ?? [];

  return {
    orchestrations: orchestrations.map(mapOrchestration),
  };
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
}): ManifestOrchestration {
  return {
    id: toStableId(orch.id),
    name: orch.name,
    entryPoint: orch.entryPoint || '',
    steps: (orch.steps || []).map(mapStep),
    description: orch.description,
  };
}

function mapStep(step: {
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
