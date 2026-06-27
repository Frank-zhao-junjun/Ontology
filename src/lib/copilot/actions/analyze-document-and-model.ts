import type { EpcStepSuggestion } from '@/lib/ai-draft/epc-doc-prompt';
import { formatCopilotReply } from '@/lib/copilot/format-copilot-reply';
import {
  runAnalyzeDocument,
  type AnalyzeDocumentResult,
  type EpcInferenceResult,
} from '@/lib/copilot/analyze-document-orchestrator';
import type {
  ChainDocParseResult,
} from '@/lib/copilot/chain-doc-prompt';
import { runUploadReferenceDocument } from '@/lib/copilot/actions/upload-reference-document';
import type { useOntologyStore } from '@/store/ontology-store';
import { useOntologyStore as ontologyStore } from '@/store/ontology-store';
import type { EpcStep, VersionPin } from '@/types/ontology';

type StoreSlice = Pick<
  ReturnType<typeof useOntologyStore.getState>,
  | 'addValueDomain'
  | 'addCapability'
  | 'addScenario'
  | 'addEpcProcess'
  | 'applyAiEpcDraft'
  | 'applyAiElementDrafts'
  | 'addReferenceDocument'
  | 'project'
>;

export interface AnalyzeDocumentAndModelInput {
  documentText: string;
  file?: File;
}

export interface AnalyzeDocumentAndModelResult {
  message: string;
  chainCreated: {
    valueDomains: number;
    capabilities: number;
    scenarios: number;
    epcProcesses: number;
  };
  epcStepCount: number;
  elementsInserted: number;
  elementsUpdated: number;
  elementsSkipped: number;
  errors: string[];
  markdown: string;
}

function toEpcSteps(suggestions: EpcStepSuggestion[]): EpcStep[] {
  return suggestions.map((step, index) => ({
    id: `step-${index + 1}`,
    name: step.name,
    ...(step.elementRef
      ? {
          elementRef: {
            dimension: 'E1' as const,
            elementId: step.elementRef.elementId,
            versionPin: (step.elementRef.versionPin ?? 'latest_confirmed') as VersionPin,
          },
        }
      : {}),
  }));
}

function applyChainToStore(
  store: StoreSlice,
  chain: ChainDocParseResult,
): AnalyzeDocumentAndModelResult['chainCreated'] & { lastEpcId?: string } {
  const counts = { valueDomains: 0, capabilities: 0, scenarios: 0, epcProcesses: 0 };
  let lastEpcId: string | undefined;

  for (const vd of chain.valueDomains) {
    const a = store.addValueDomain({
      name: vd.name,
      nameEn: vd.nameEn,
      description: vd.description,
    });
    counts.valueDomains += 1;

    for (const cap of vd.capabilities ?? []) {
      const b = store.addCapability(a.id, {
        name: cap.name,
        nameEn: cap.nameEn,
        description: cap.description,
      });
      counts.capabilities += 1;

      for (const scenario of cap.scenarios ?? []) {
        const c = store.addScenario(b.id, {
          name: scenario.name,
          nameEn: scenario.nameEn,
          description: scenario.description,
        });
        counts.scenarios += 1;

        for (const epc of scenario.epcProcesses ?? []) {
          const created = store.addEpcProcess(c.id, {
            name: epc.name,
            nameEn: epc.nameEn,
            description: epc.description,
          });
          lastEpcId = created.id;
          counts.epcProcesses += 1;
        }
      }
    }
  }

  return { ...counts, lastEpcId };
}

function applyEpcSteps(
  store: StoreSlice,
  epc: EpcInferenceResult | null,
  preferredEpcId?: string,
): number {
  const steps = epc?.steps ?? [];
  if (steps.length === 0) return 0;

  const project = ontologyStore.getState().project ?? store.project;
  const targetEpcId =
    preferredEpcId ?? project?.epcProcesses?.[project.epcProcesses.length - 1]?.id;
  if (!targetEpcId) return 0;

  store.applyAiEpcDraft(targetEpcId, toEpcSteps(steps));
  return steps.length;
}

function buildMessage(
  chainCreated: AnalyzeDocumentAndModelResult['chainCreated'],
  epcStepCount: number,
  elementsInserted: number,
  elementsUpdated: number,
  elementsSkipped: number,
  errors: string[],
): string {
  const parts = [
    `业务链：${chainCreated.valueDomains} 价值域 / ${chainCreated.capabilities} 能力 / ${chainCreated.scenarios} 场景 / ${chainCreated.epcProcesses} EPC`,
    `EPC 步骤：${epcStepCount} 步`,
    `要素：新增 ${elementsInserted}、更新 ${elementsUpdated}、跳过 ${elementsSkipped}`,
  ];
  if (errors.length > 0) {
    parts.push(`部分推断失败：${errors.join('; ')}`);
  }
  return parts.join('；');
}

function applyAnalyzeResult(
  store: StoreSlice,
  data: AnalyzeDocumentResult,
): Omit<AnalyzeDocumentAndModelResult, 'markdown'> {
  const chainApplied = data.chain ? applyChainToStore(store, data.chain) : {
    valueDomains: 0,
    capabilities: 0,
    scenarios: 0,
    epcProcesses: 0,
    lastEpcId: undefined,
  };
  const { lastEpcId, ...chainCreated } = chainApplied;
  const epcStepCount = applyEpcSteps(store, data.epc, lastEpcId);

  let elementsInserted = 0;
  let elementsUpdated = 0;
  let elementsSkipped = 0;
  if (data.elements?.length) {
    const { inserted, updated, skipped } = store.applyAiElementDrafts(
      data.elements.map((el) => ({
        name: el.name,
        dimension: el.dimension,
        nameEn: el.nameEn,
        description: el.description,
      })),
    );
    elementsInserted = inserted;
    elementsUpdated = updated;
    elementsSkipped = skipped.length;
  }

  const errors = data.errors ?? [];
  const message = buildMessage(
    chainCreated,
    epcStepCount,
    elementsInserted,
    elementsUpdated,
    elementsSkipped,
    errors,
  );

  return {
    message,
    chainCreated,
    epcStepCount,
    elementsInserted,
    elementsUpdated,
    elementsSkipped,
    errors,
  };
}

export async function runAnalyzeDocumentAndModel(
  store: StoreSlice,
  input: AnalyzeDocumentAndModelInput,
  fetchFn: typeof fetch = fetch,
): Promise<AnalyzeDocumentAndModelResult> {
  const project = store.project;
  if (!project) throw new Error('没有活动项目');

  let documentText = input.documentText?.trim() ?? '';
  if (input.file) {
    const uploaded = await runUploadReferenceDocument(store, { file: input.file }, fetchFn);
    documentText = uploaded.document.extractedText || documentText;
  }

  if (!documentText) {
    throw new Error('缺少可分析的文档内容');
  }

  const data = await runAnalyzeDocument({
    documentText,
    project,
    fetchFn,
  });

  const applied = applyAnalyzeResult(store, data);

  const created = [];
  if (applied.chainCreated.valueDomains > 0) {
    const latest = ontologyStore.getState().project?.valueDomains?.slice(-1)[0];
    if (latest) created.push({ kind: 'A' as const, name: latest.name, id: latest.id });
  }

  const markdown = formatCopilotReply({
    created,
    elements: {
      inserted: applied.elementsInserted,
      updated: applied.elementsUpdated,
      skipped: applied.elementsSkipped,
    },
    skipped: applied.errors,
  });

  return { ...applied, markdown };
}
