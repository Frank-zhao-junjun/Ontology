import type { ElementDraftSuggestion } from '@/lib/ai-draft/element-doc-prompt';
import type { EpcStepSuggestion } from '@/lib/ai-draft/epc-doc-prompt';
import type { ChainDocParseResult } from '@/lib/copilot/chain-doc-prompt';
import type { OntologyProject } from '@/types/ontology';

export type AnalyzeDocumentProjectSlice = Pick<
  OntologyProject,
  | 'id'
  | 'domain'
  | 'valueDomains'
  | 'capabilities'
  | 'scenarios'
  | 'epcProcesses'
  | 'metaElements'
  | 'moduleVersionRecords'
>;

export interface EpcInferenceResult {
  scenarioName?: string;
  epcName?: string;
  steps: EpcStepSuggestion[];
}

export interface AnalyzeDocumentResult {
  chain: ChainDocParseResult | null;
  epc: EpcInferenceResult | null;
  elements: ElementDraftSuggestion[] | null;
  errors: string[];
}

export type InferSubCall<T> = (
  documentText: string,
  project: AnalyzeDocumentProjectSlice,
) => Promise<T>;

export interface RunAnalyzeDocumentInput {
  documentText: string;
  project: AnalyzeDocumentProjectSlice;
  fetchFn?: typeof fetch;
  inferBusinessChain?: InferSubCall<ChainDocParseResult>;
  inferEpcSteps?: InferSubCall<EpcInferenceResult>;
  inferElements?: InferSubCall<{ elements: ElementDraftSuggestion[] }>;
}

async function defaultFetchAnalyze(
  fetchFn: typeof fetch,
  documentText: string,
  project: AnalyzeDocumentProjectSlice,
): Promise<AnalyzeDocumentResult> {
  const response = await fetchFn('/api/analyze-document-model', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ documentText, project }),
  });

  const payload = (await response.json()) as {
    success?: boolean;
    error?: string;
    data?: AnalyzeDocumentResult;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? '文档推断失败');
  }

  return (
    payload.data ?? {
      chain: null,
      epc: null,
      elements: null,
      errors: [payload.error ?? '空响应'],
    }
  );
}

export async function runAnalyzeDocument(
  input: RunAnalyzeDocumentInput,
): Promise<AnalyzeDocumentResult> {
  const { documentText, project, fetchFn, inferBusinessChain, inferEpcSteps, inferElements } =
    input;

  if (fetchFn && !inferBusinessChain && !inferEpcSteps && !inferElements) {
    return defaultFetchAnalyze(fetchFn, documentText, project);
  }

  const errors: string[] = [];
  let chain: ChainDocParseResult | null = null;
  let epc: EpcInferenceResult | null = null;
  let elements: ElementDraftSuggestion[] | null = null;

  const tasks: Array<{ key: string; run: () => Promise<void> }> = [];

  if (inferBusinessChain) {
    tasks.push({
      key: 'chain',
      run: async () => {
        chain = await inferBusinessChain(documentText, project);
      },
    });
  }

  if (inferEpcSteps) {
    tasks.push({
      key: 'epc',
      run: async () => {
        epc = await inferEpcSteps(documentText, project);
      },
    });
  }

  if (inferElements) {
    tasks.push({
      key: 'elements',
      run: async () => {
        const result = await inferElements(documentText, project);
        elements = result.elements;
      },
    });
  }

  const results = await Promise.allSettled(tasks.map((t) => t.run()));

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const key = tasks[index]?.key ?? 'unknown';
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push(`${key}: ${message}`);
    }
  });

  return { chain, epc, elements, errors };
}
