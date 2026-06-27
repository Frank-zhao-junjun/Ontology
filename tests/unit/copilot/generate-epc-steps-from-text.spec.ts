import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runGenerateEpcStepsFromText } from '@/lib/copilot/actions/generate-epc-steps-from-text';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Manufacturing',
  description: 'test',
  icon: 'factory',
  color: '#000',
};

describe('runGenerateEpcStepsFromText — TC-07', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('EPC Copilot 测试', domain);
  });

  it('calls generate-module-draft API and applies steps via applyAiEpcDraft', async () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '计划能力' });
    const c = store.addScenario(b.id, { name: 'MTS排产' });
    const epc = store.addEpcProcess(c.id, { name: '订单处理' });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          suggestion: {
            steps: [
              { name: '接收订单', description: '接收客户订单' },
              { name: '审核', description: '审核订单信息' },
            ],
          },
        },
      }),
    });

    const result = await runGenerateEpcStepsFromText(
      useOntologyStore.getState(),
      {
        epcId: epc.id,
        text: '接收订单 → 审核 → 排产',
      },
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/generate-module-draft',
      expect.objectContaining({ method: 'POST' }),
    );

    const project = useOntologyStore.getState().project!;
    const saved = project.epcProcesses?.find((item) => item.id === epc.id);
    expect(result.stepCount).toBe(2);
    expect(saved?.steps).toHaveLength(2);
    expect(saved?.steps[0].name).toBe('接收订单');
    expect(
      project.moduleVersionRecords?.some(
        (r) => r.moduleKind === 'EPC' && r.moduleId === epc.id && r.status === 'draft',
      ),
    ).toBe(true);
  });
});
