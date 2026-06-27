import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runAnalyzeDocumentAndModel } from '@/lib/copilot/actions/analyze-document-and-model';
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

describe('document upload E2E — TC-03 @smoke', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-27T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('Upload E2E', domain);
  });

  it('@smoke upload txt fixture then analyze increases valueDomains', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            fileName: 'sop.txt',
            fileType: 'txt',
            fileSize: 50,
            uploadedAt: '2026-06-27T00:00:00.000Z',
            extractedText: '生产制造 SOP：价值域=生产域',
            textLength: 20,
            parseStatus: 'success',
            title: 'SOP',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            chain: {
              valueDomains: [{ name: '生产域', capabilities: [] }],
            },
            epc: null,
            elements: null,
            errors: [],
          },
        }),
      });

    await runUploadReferenceDocument(
      useOntologyStore.getState(),
      { file: new File(['生产制造 SOP'], 'sop.txt', { type: 'text/plain' }) },
      mockFetch as unknown as typeof fetch,
    );

    expect(useOntologyStore.getState().project?.referenceDocuments).toHaveLength(1);

    const result = await runAnalyzeDocumentAndModel(
      useOntologyStore.getState(),
      { documentText: '生产制造 SOP：价值域=生产域' },
      mockFetch as unknown as typeof fetch,
    );

    expect(result.chainCreated.valueDomains).toBe(1);
    expect(useOntologyStore.getState().project?.valueDomains).toHaveLength(1);
    expect(useOntologyStore.getState().project?.valueDomains?.[0].name).toBe('生产域');
  });
});
