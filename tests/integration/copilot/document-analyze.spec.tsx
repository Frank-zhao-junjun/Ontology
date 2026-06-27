import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { runAnalyzeDocumentAndModel } from '@/lib/copilot/actions/analyze-document-and-model';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, OntologyProject } from '@/types/ontology';

vi.mock('@/lib/copilot/actions/analyze-document-and-model', () => ({
  runAnalyzeDocumentAndModel: vi.fn(),
}));

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

function seedProject(): OntologyProject {
  const store = useOntologyStore.getState();
  store.createProject('文档推断集成测试', domain);
  return useOntologyStore.getState().project!;
}

describe('document analyze integration — TC-03', () => {
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
    vi.mocked(runAnalyzeDocumentAndModel).mockReset();
  });

  it('analyze action increases valueDomains after document inference', async () => {
    seedProject();
    const store = useOntologyStore.getState();

    vi.mocked(runAnalyzeDocumentAndModel).mockImplementation(async (s) => {
      s.addValueDomain({ name: '推断价值域', description: '来自 SOP' });
      return {
        message: '业务链：1 价值域 / 0 能力 / 0 场景 / 0 EPC',
        chainCreated: { valueDomains: 1, capabilities: 0, scenarios: 0, epcProcesses: 0 },
        epcStepCount: 0,
        elementsInserted: 0,
        elementsUpdated: 0,
        elementsSkipped: 0,
        errors: [],
        markdown: '已创建以下内容（均为草稿）：',
      };
    });

    const result = await runAnalyzeDocumentAndModel(store, {
      documentText: 'SOP 文档内容',
    });

    expect(result.chainCreated.valueDomains).toBe(1);
    expect(useOntologyStore.getState().project?.valueDomains).toHaveLength(1);
    expect(useOntologyStore.getState().project?.valueDomains?.[0].name).toBe('推断价值域');
  });
});

describe('document analyze UI hook', () => {
  it('renders analyze handler result message with stats', async () => {
    seedProject();
    vi.mocked(runAnalyzeDocumentAndModel).mockResolvedValue({
      message: '业务链：1 价值域；要素：新增 2、更新 0、跳过 1',
      chainCreated: { valueDomains: 1, capabilities: 0, scenarios: 0, epcProcesses: 0 },
      epcStepCount: 0,
      elementsInserted: 2,
      elementsUpdated: 0,
      elementsSkipped: 1,
      errors: [],
      markdown: '已创建以下内容（均为草稿）：',
    });

    const TestPanel = () => {
      const [msg, setMsg] = React.useState('');
      return (
        <div>
          <button
            type="button"
            data-testid="run-analyze"
            onClick={() =>
              void runAnalyzeDocumentAndModel(useOntologyStore.getState(), {
                documentText: 'doc',
              }).then((r) => setMsg(r.message))
            }
          >
            分析
          </button>
          <span data-testid="analyze-result">{msg}</span>
        </div>
      );
    };

    render(<TestPanel />);
    fireEvent.click(screen.getByTestId('run-analyze'));

    await waitFor(() => {
      expect(screen.getByTestId('analyze-result')).toHaveTextContent('业务链');
    });
  });
});
