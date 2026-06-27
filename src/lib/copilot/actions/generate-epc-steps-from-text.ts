import type { EpcStepSuggestion } from '@/lib/ai-draft/epc-doc-prompt';
import type { useOntologyStore } from '@/store/ontology-store';
import type { EpcStep, OntologyProject } from '@/types/ontology';

type StoreSlice = Pick<ReturnType<typeof useOntologyStore.getState>, 'applyAiEpcDraft' | 'project'>;

export interface GenerateEpcStepsFromTextInput {
  epcId: string;
  text: string;
  userHint?: string;
  project?: OntologyProject;
}

export interface GenerateEpcStepsFromTextResult {
  stepCount: number;
  steps: EpcStep[];
  message: string;
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
            versionPin: (step.elementRef.versionPin ?? 'latest_confirmed') as import('@/types/ontology').VersionPin,
          },
        }
      : {}),
  }));
}

export async function runGenerateEpcStepsFromText(
  store: StoreSlice,
  input: GenerateEpcStepsFromTextInput,
  fetchFn: typeof fetch = fetch,
): Promise<GenerateEpcStepsFromTextResult> {
  const project = input.project ?? store.project;
  if (!project) throw new Error('没有活动项目');

  const response = await fetchFn('/api/generate-module-draft', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      moduleKind: 'EPC',
      moduleId: input.epcId,
      project: {
        valueDomains: project.valueDomains,
        capabilities: project.capabilities,
        scenarios: project.scenarios,
        epcProcesses: project.epcProcesses,
        metaElements: project.metaElements,
        moduleVersionRecords: project.moduleVersionRecords,
      },
      userHint: input.userHint,
      documentText: input.text,
    }),
  });

  const payload = (await response.json()) as {
    success?: boolean;
    error?: string;
    data?: { suggestion?: { steps?: EpcStepSuggestion[] } };
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'EPC 步骤生成失败');
  }

  const suggestions = payload.data?.suggestion?.steps ?? [];
  if (suggestions.length === 0) {
    throw new Error('AI 未返回有效 EPC 步骤');
  }

  const steps = toEpcSteps(suggestions);
  store.applyAiEpcDraft(input.epcId, steps);

  return {
    stepCount: steps.length,
    steps,
    message: `已生成 ${steps.length} 个 EPC 步骤到 draft`,
  };
}
