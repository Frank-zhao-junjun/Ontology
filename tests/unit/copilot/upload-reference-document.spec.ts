import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runUploadReferenceDocument } from '@/lib/copilot/actions/upload-reference-document';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('runUploadReferenceDocument — TC-03', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('Upload 测试', domain);
  });

  it('uploads via API and adds reference document to store', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          fileName: 'sop.txt',
          fileType: 'txt',
          fileSize: 100,
          uploadedAt: '2026-06-27T00:00:00.000Z',
          extractedText: 'SOP 内容',
          textLength: 6,
          parseStatus: 'success',
          title: 'SOP',
        },
      }),
    });

    const result = await runUploadReferenceDocument(
      useOntologyStore.getState(),
      { file: new File(['SOP 内容'], 'sop.txt', { type: 'text/plain' }) },
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/reference-documents/upload',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.document.fileName).toBe('sop.txt');
    expect(useOntologyStore.getState().project?.referenceDocuments).toHaveLength(1);
  });
});
