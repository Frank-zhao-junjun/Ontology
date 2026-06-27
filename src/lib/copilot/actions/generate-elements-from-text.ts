import type { ElementDraftSuggestion } from '@/lib/ai-draft/element-doc-prompt';
import type { useOntologyStore } from '@/store/ontology-store';

type StoreSlice = Pick<
  ReturnType<typeof useOntologyStore.getState>,
  'applyAiElementDrafts' | 'project'
>;

export interface GenerateElementsFromTextInput {
  documentText: string;
}

export interface GenerateElementsFromTextResult {
  inserted: number;
  updated: number;
  skipped: number;
  skippedItems: Array<{ name: string; dimension: string; reason?: string }>;
  message: string;
}

export async function runGenerateElementsFromText(
  store: StoreSlice,
  input: GenerateElementsFromTextInput,
  fetchFn: typeof fetch = fetch,
): Promise<GenerateElementsFromTextResult> {
  const project = store.project;
  if (!project) throw new Error('没有活动项目');

  const response = await fetchFn('/api/generate-element-draft', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      projectId: project.id,
      documentText: input.documentText,
      existingElementNames: (project.metaElements ?? []).map((el) => el.name),
    }),
  });

  const payload = (await response.json()) as {
    error?: string;
    elements?: ElementDraftSuggestion[];
  };

  if (!response.ok) {
    throw new Error(payload.error ?? '要素生成失败');
  }

  const elements = payload.elements ?? [];
  if (elements.length === 0) {
    throw new Error('AI 未返回有效要素');
  }

  const { inserted, updated, skipped } = store.applyAiElementDrafts(elements);

  return {
    inserted,
    updated,
    skipped: skipped.length,
    skippedItems: skipped,
    message: `已生成 ${inserted} 个要素到 draft（更新 ${updated}，跳过 ${skipped.length} 条重复）`,
  };
}
