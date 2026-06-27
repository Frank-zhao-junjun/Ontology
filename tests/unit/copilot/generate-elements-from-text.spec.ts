import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runGenerateElementsFromText } from '@/lib/copilot/actions/generate-elements-from-text';
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

describe('runGenerateElementsFromText', () => {
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
    useOntologyStore.getState().createProject('Elements 测试', domain);
  });

  it('calls generate-element-draft API and applies via applyAiElementDrafts', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        elements: [
          { name: '物料主数据', dimension: 'E1', description: '物料', fields: {} },
          { name: '库存查询', dimension: 'E4', description: '规则', fields: {} },
        ],
      }),
    });

    const result = await runGenerateElementsFromText(
      useOntologyStore.getState(),
      { documentText: '物料管理规范' },
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/generate-element-draft',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.inserted).toBe(2);
    expect(useOntologyStore.getState().project?.metaElements).toHaveLength(2);
  });
});
