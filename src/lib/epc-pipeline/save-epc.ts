import type { EpcProcess, MetaElement } from '@/types/ontology';
import { rebuildUsageIndex } from '@/lib/epc-pipeline/rebuild-usage-index';
import { upsertInlineElements } from '@/lib/epc-pipeline/upsert-inline';
import { validateSaveEpcInput } from '@/lib/epc-pipeline/validate-save-epc';

export type SaveEpcPipelineInput = {
  epcProcesses?: EpcProcess[];
  metaElements?: MetaElement[];
  epc: EpcProcess;
  generateId: () => string;
  onElementDraft: (dimension: MetaElement['dimension'], elementId: string, snapshot: MetaElement) => void;
  onEpcDraft: (epcId: string, snapshot: EpcProcess) => void;
};

export type SaveEpcPipelineResult = {
  epcProcesses: EpcProcess[];
  metaElements: MetaElement[];
};

export function runSaveEpcPipeline(input: SaveEpcPipelineInput): SaveEpcPipelineResult {
  validateSaveEpcInput(input.epc);

  const upserted = upsertInlineElements(input.metaElements ?? [], input.epc.steps, {
    generateId: input.generateId,
    onElementDraft: input.onElementDraft,
  });

  const epcSnapshot: EpcProcess = {
    ...input.epc,
    steps: upserted.steps,
  };

  const epcProcesses = [...(input.epcProcesses ?? [])];
  const index = epcProcesses.findIndex((item) => item.id === epcSnapshot.id);
  if (index >= 0) {
    epcProcesses[index] = epcSnapshot;
  } else {
    epcProcesses.push(epcSnapshot);
  }

  input.onEpcDraft(epcSnapshot.id, epcSnapshot);

  const metaElements = rebuildUsageIndex({
    epcProcesses,
    metaElements: upserted.metaElements,
  });

  return { epcProcesses, metaElements };
}
