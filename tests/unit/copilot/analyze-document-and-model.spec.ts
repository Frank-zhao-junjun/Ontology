import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runAnalyzeDocumentAndModel } from '@/lib/copilot/actions/analyze-document-and-model';
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

describe('runAnalyzeDocumentAndModel — TC-03', () => {
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
    useOntologyStore.getState().createProject('Analyze 测试', domain);
  });

  it('calls analyze API and applies chain/epc/elements to store', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          chain: {
            valueDomains: [
              {
                name: '生产域',
                capabilities: [
                  {
                    name: '计划能力',
                    scenarios: [
                      {
                        name: 'MTS排产',
                        epcProcesses: [{ name: '订单处理' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          epc: {
            steps: [
              { name: '接收订单', description: '接收' },
              { name: '审核', description: '审核' },
            ],
          },
          elements: [{ name: '订单实体', dimension: 'E1', description: '订单', fields: {} }],
          errors: [],
        },
      }),
    });

    const result = await runAnalyzeDocumentAndModel(
      useOntologyStore.getState(),
      { documentText: 'SOP 文档' },
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/analyze-document-model',
      expect.objectContaining({ method: 'POST' }),
    );

    const project = useOntologyStore.getState().project!;
    expect(project.valueDomains).toHaveLength(1);
    expect(project.capabilities).toHaveLength(1);
    expect(project.scenarios).toHaveLength(1);
    expect(project.epcProcesses).toHaveLength(1);
    expect(project.epcProcesses![0].steps).toHaveLength(2);
    expect(project.metaElements).toHaveLength(1);
    expect(result.message).toContain('业务链');
    expect(result.elementsInserted).toBe(1);
  });
});
