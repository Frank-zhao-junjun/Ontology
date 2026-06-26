import { describe, expect, it, beforeEach } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Action, BehaviorModel, DataModel, Entity, StateMachine } from '@/types/ontology';

const domain = { id: 'dm-1', name: '离散制造', nameEn: 'Discrete Manufacturing', description: '离散制造领域' };

function resetStore() {
  useOntologyStore.setState({
    project: null,
    activeModelType: 'data',
    metadataList: [],
  });
}

function createTestProject() {
  const store = useOntologyStore.getState();
  store.createProject('测试项目', domain, '测试描述');
  const project = useOntologyStore.getState().project;
  if (project?.dataModel) {
    useOntologyStore.setState({
      project: {
        ...project,
        dataModel: {
          ...project.dataModel,
          businessScenarios: [
            { id: 'bs-1', name: '生产管理', nameEn: 'ProductionMgmt', description: '生产管理场景', projectId: 'ep1' },
          ],
        },
      },
    });
  }
}

const mockEntity: Entity = {
  id: 'e1',
  name: 'Customer',
  nameEn: 'Customer',
  description: 'Customer entity',
  projectId: 'ep1',
  businessScenarioId: 'bs-1',
  entityRole: 'aggregate_root',
  attributes: [],
  relations: [],
};

const emptyDataModel = (): DataModel => ({
  id: 'dm-test',
  name: 'Test Data Model',
  version: '1.0.0',
  domain: domain.id,
  projects: [],
  businessScenarios: [{ id: 'bs-1', name: '生产管理', nameEn: 'ProductionMgmt', description: '', projectId: 'ep1' }],
  entities: [],
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
});

const emptyBehaviorModel = (): BehaviorModel => ({
  id: 'bm-test',
  name: 'Test Behavior Model',
  version: '1.0.0',
  domain: domain.id,
  stateMachines: [],
  actions: [],
  functions: [],
  indicators: [],
  constraints: [],
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
});

describe('ontology-store Entity CRUD', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('setDataModel and addEntity', () => {
    useOntologyStore.getState().setDataModel(emptyDataModel());
    useOntologyStore.getState().addEntity(mockEntity);
    const project = useOntologyStore.getState().project;
    expect(project?.dataModel).not.toBeNull();
    expect(project!.dataModel!.entities).toHaveLength(1);
    expect(project!.dataModel!.entities[0].name).toBe('Customer');
  });

  it('updateEntity', () => {
    useOntologyStore.getState().setDataModel({ ...emptyDataModel(), entities: [mockEntity] });
    useOntologyStore.getState().updateEntity('e1', { ...mockEntity, name: 'Updated' });
    expect(useOntologyStore.getState().project!.dataModel!.entities[0].name).toBe('Updated');
  });

  it('deleteEntity', () => {
    useOntologyStore.getState().setDataModel({ ...emptyDataModel(), entities: [mockEntity] });
    useOntologyStore.getState().deleteEntity('e1');
    expect(useOntologyStore.getState().project!.dataModel!.entities).toHaveLength(0);
  });

  it('deleteEntity with non-existent id does not throw', () => {
    useOntologyStore.getState().setDataModel({ ...emptyDataModel(), entities: [mockEntity] });
    expect(() => useOntologyStore.getState().deleteEntity('nonexistent')).not.toThrow();
  });
});

describe('ontology-store Project CRUD', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('addEntityProject', () => {
    useOntologyStore.getState().addEntityProject({ id: 'ep1', name: 'CRM', nameEn: 'CRM', description: '' });
    const projects = useOntologyStore.getState().project!.dataModel!.projects;
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('CRM');
  });

  it('updateEntityProject', () => {
    useOntologyStore.getState().addEntityProject({ id: 'ep1', name: 'CRM', nameEn: 'CRM', description: '' });
    useOntologyStore.getState().updateEntityProject('ep1', { id: 'ep1', name: 'Updated', nameEn: 'Updated', description: '' });
    expect(useOntologyStore.getState().project!.dataModel!.projects[0].name).toBe('Updated');
  });

  it('deleteEntityProject', () => {
    useOntologyStore.getState().addEntityProject({ id: 'ep1', name: 'CRM', nameEn: 'CRM', description: '' });
    useOntologyStore.getState().deleteEntityProject('ep1');
    expect(useOntologyStore.getState().project!.dataModel!.projects).toHaveLength(0);
  });
});

describe('ontology-store BehaviorModel CRUD', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  const mockStateMachine: StateMachine = {
    id: 'sm1',
    name: 'Order Status',
    entity: 'e1',
    statusField: 'status',
    states: [],
    transitions: [],
  };

  const mockAction: Action = {
    id: 'a1',
    name: 'Create',
    nameEn: 'Create',
    description: '',
    actionType: 'create',
  };

  it('setBehaviorModel and addStateMachine', () => {
    useOntologyStore.getState().setBehaviorModel(emptyBehaviorModel());
    useOntologyStore.getState().addStateMachine(mockStateMachine);
    const bm = useOntologyStore.getState().project!.behaviorModel!;
    expect(bm.stateMachines).toHaveLength(1);
    expect(bm.stateMachines[0].name).toBe('Order Status');
  });

  it('updateStateMachine', () => {
    useOntologyStore.getState().setBehaviorModel({
      ...emptyBehaviorModel(),
      stateMachines: [mockStateMachine],
    });
    useOntologyStore.getState().updateStateMachine('sm1', { ...mockStateMachine, name: 'Updated' });
    expect(useOntologyStore.getState().project!.behaviorModel!.stateMachines[0].name).toBe('Updated');
  });

  it('deleteStateMachine', () => {
    useOntologyStore.getState().setBehaviorModel({
      ...emptyBehaviorModel(),
      stateMachines: [mockStateMachine],
    });
    useOntologyStore.getState().deleteStateMachine('sm1');
    expect(useOntologyStore.getState().project!.behaviorModel!.stateMachines).toHaveLength(0);
  });

  it('addAction', () => {
    useOntologyStore.getState().setBehaviorModel(emptyBehaviorModel());
    useOntologyStore.getState().addAction(mockAction);
    expect(useOntologyStore.getState().project!.behaviorModel!.actions).toHaveLength(1);
  });

  it('updateAction', () => {
    useOntologyStore.getState().setBehaviorModel({
      ...emptyBehaviorModel(),
      actions: [mockAction],
    });
    useOntologyStore.getState().updateAction('a1', { ...mockAction, name: 'Updated' });
    expect(useOntologyStore.getState().project!.behaviorModel!.actions![0].name).toBe('Updated');
  });

  it('deleteAction', () => {
    useOntologyStore.getState().setBehaviorModel({
      ...emptyBehaviorModel(),
      actions: [mockAction],
    });
    useOntologyStore.getState().deleteAction('a1');
    expect(useOntologyStore.getState().project!.behaviorModel!.actions).toHaveLength(0);
  });
});
