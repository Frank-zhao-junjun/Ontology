import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { E1EntityPanel } from '@/components/ontology/e1-entity-panel';
import { buildE1Entity } from '@/lib/e1-entity/create-entity';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, OntologyProject } from '@/types/ontology';

vi.mock('@/components/ontology/data-model-editor', () => ({
  DataModelEditor: ({ entityId }: { entityId: string }) =>
    React.createElement('div', { 'data-testid': 'data-model-editor', 'data-entity-id': entityId }),
}));

vi.mock('@/components/ontology/behavior-model-editor', () => ({
  BehaviorModelEditor: () => React.createElement('div', { 'data-testid': 'behavior-model-editor' }),
}));

vi.mock('@/components/ontology/rule-model-editor', () => ({
  RuleModelEditor: () => React.createElement('div', { 'data-testid': 'rule-model-editor' }),
}));

vi.mock('@/components/ontology/event-model-editor', () => ({
  EventModelEditor: () => React.createElement('div', { 'data-testid': 'event-model-editor' }),
}));

const domain: Domain = {
  id: 'd1',
  name: '制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

function seedProject(): OntologyProject {
  const base = useOntologyStore.getState().project!;
  return {
    ...base,
    dataModel: {
      id: 'dm1',
      name: 'dm',
      version: '1.0.0',
      domain: 'd1',
      projects: [{ id: 'mod1', name: '模块', nameEn: 'Mod', color: '#000' }],
      businessScenarios: [],
      entities: [
        {
          id: 'entity-1',
          name: '物料',
          nameEn: 'Material',
          projectId: 'mod1',
          businessScenarioId: 'e1-global',
          entityRole: 'aggregate_root',
          attributes: [],
          relations: [],
        },
      ],
      createdAt: '2026-06-18T12:00:00.000Z',
      updatedAt: '2026-06-18T12:00:00.000Z',
    },
  };
}

describe('E1EntityPanel (legacy entity editor replacement)', () => {
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
    useOntologyStore.getState().createProject('E1 测试', domain);
    useOntologyStore.setState({ project: seedProject() });
  });

  it('should list entities and open model editor without legacy scenario sidebar', () => {
    render(<E1EntityPanel />);
    expect(screen.getByTestId('e1-entity-row-entity-1')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('e1-entity-row-entity-1'));
    expect(screen.getByTestId('data-model-editor')).toHaveAttribute('data-entity-id', 'entity-1');
  });

  it('should create entity via store using E1 builder', () => {
    const project = seedProject();
    const entity = buildE1Entity(project, { name: '订单' }, 'entity-new');
    useOntologyStore.getState().addEntity(entity);
    const entities = useOntologyStore.getState().project?.dataModel?.entities ?? [];
    expect(entities.some((item) => item.name === '订单')).toBe(true);
  });
});
