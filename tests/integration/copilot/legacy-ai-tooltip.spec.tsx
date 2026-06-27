import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AiDraftFillTrigger } from '@/components/ontology/ai-draft-fill-dialog';
import { ElementLibrary } from '@/components/ontology/element-library';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, OntologyProject } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

const now = '2026-06-27T12:00:00.000Z';

function createProject(): OntologyProject {
  return {
    id: 'proj-tooltip',
    name: 'Tooltip 测试',
    description: '',
    domain,
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1',
      domain: 'd1',
      projects: [],
      businessScenarios: [],
      entities: [],
      createdAt: now,
      updatedAt: now,
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    valueDomains: [{ id: 'a1', name: '生产域' }],
    capabilities: [],
    scenarios: [],
    epcProcesses: [],
    metaElements: [],
    moduleVersionRecords: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('legacy AI tooltip — TC-06', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
  });

  it('AiDraftFillTrigger renders tooltip「建议使用右侧 Copilot」', () => {
    render(
      <AiDraftFillTrigger
        moduleKind="A"
        moduleId="a1"
        project={createProject()}
        onEnsureDraft={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    fireEvent.focus(screen.getByTestId('module-action-ai-draft'));
    expect(screen.getByTestId('legacy-ai-copilot-tooltip')).toHaveTextContent(
      '建议使用右侧 Copilot',
    );
  });

  it('ElementLibrary AI button renders tooltip「建议使用右侧 Copilot」', () => {
    render(<ElementLibrary />);

    fireEvent.focus(screen.getByTestId('ai-element-draft-btn'));
    expect(screen.getByTestId('legacy-ai-copilot-tooltip')).toHaveTextContent(
      '建议使用右侧 Copilot',
    );
  });
});
