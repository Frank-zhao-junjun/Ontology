import type { useOntologyStore } from '@/store/ontology-store';
import type { ReferenceDocument } from '@/types/ontology';

type StoreSlice = Pick<ReturnType<typeof useOntologyStore.getState>, 'addReferenceDocument'>;

export interface UploadReferenceDocumentInput {
  file: File;
}

export interface UploadReferenceDocumentResult {
  id: string;
  fileName: string;
  textLength: number;
  message: string;
  document: ReferenceDocument;
}

export async function runUploadReferenceDocument(
  store: StoreSlice,
  input: UploadReferenceDocumentInput,
  fetchFn: typeof fetch = fetch,
): Promise<UploadReferenceDocumentResult> {
  const formData = new FormData();
  formData.append('file', input.file);

  const response = await fetchFn('/api/reference-documents/upload', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json()) as {
    success?: boolean;
    error?: string;
    data?: ReferenceDocument;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? '文档上传失败');
  }

  const document = store.addReferenceDocument(payload.data);

  return {
    id: document.id,
    fileName: document.fileName,
    textLength: document.textLength,
    message: `已上传参考文档「${document.fileName}」`,
    document,
  };
}
