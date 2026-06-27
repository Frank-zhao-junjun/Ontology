import { describe, expect, it, vi } from 'vitest';
import { runAnalyzeDocument } from '@/lib/copilot/analyze-document-orchestrator';

const project = {
  id: 'p1',
  domain: { id: 'd1', name: '离散制造', nameEn: 'Mfg', description: '', icon: 'f', color: '#000' },
  valueDomains: [],
  capabilities: [],
  scenarios: [],
  epcProcesses: [],
  metaElements: [],
  moduleVersionRecords: [],
};

describe('runAnalyzeDocument — TC-03 partial', () => {
  it('3 sub-calls stub: one failure does not fail others', async () => {
    const result = await runAnalyzeDocument({
      documentText: 'SOP 文档内容',
      project,
      inferBusinessChain: vi.fn().mockRejectedValue(new Error('chain LLM 失败')),
      inferEpcSteps: vi.fn().mockResolvedValue({
        steps: [{ name: '接收订单', description: '接收' }],
      }),
      inferElements: vi.fn().mockResolvedValue({
        elements: [{ name: '订单实体', dimension: 'E1', description: '订单', fields: {} }],
      }),
    });

    expect(result.chain).toBeNull();
    expect(result.epc?.steps).toHaveLength(1);
    expect(result.elements).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('chain');
  });

  it('all sub-calls succeed', async () => {
    const result = await runAnalyzeDocument({
      documentText: '文档',
      project,
      inferBusinessChain: vi.fn().mockResolvedValue({
        valueDomains: [{ name: '生产域', capabilities: [] }],
      }),
      inferEpcSteps: vi.fn().mockResolvedValue({ steps: [] }),
      inferElements: vi.fn().mockResolvedValue({ elements: [] }),
    });

    expect(result.errors).toEqual([]);
    expect(result.chain?.valueDomains[0].name).toBe('生产域');
  });
});
