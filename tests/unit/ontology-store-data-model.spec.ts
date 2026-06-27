import { describe, expect, it, beforeEach } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { DataModel, Entity, EntityProject, BusinessScenario } from '@/types/ontology';

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
  // Seed a dataModel with a business scenario so entities can reference it
  if (project?.dataModel) {
    useOntologyStore.setState({
      project: {
        ...project,
        dataModel: {
          ...project.dataModel,
          businessScenarios: [
            { id: 'bs-1', name: '生产管理', nameEn: 'ProductionMgmt', description: '生产管理场景', projectId: 'ep1' },
            { id: 'bs-2', name: '采购管理', nameEn: 'ProcurementMgmt', description: '采购管理场景', projectId: 'ep1' },
          ],
        },
      },
    });
  }
}

// ── Helper factories ──

const emptyDataModel = (): DataModel => ({
  id: 'dm-test',
  name: 'Test Data Model',
  version: '1.0.0',
  domain: domain.id,
  projects: [],
  businessScenarios: [
    { id: 'bs-1', name: '生产管理', nameEn: 'ProductionMgmt', description: '', projectId: 'ep1' },
    { id: 'bs-2', name: '采购管理', nameEn: 'ProcurementMgmt', description: '', projectId: 'ep1' },
  ],
  entities: [],
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
});

function aggregateRoot(id: string, name: string, overrides: Partial<Entity> = {}): Entity {
  return {
    id,
    name,
    nameEn: name,
    description: `${name} entity`,
    projectId: 'ep1',
    businessScenarioId: 'bs-1',
    entityRole: 'aggregate_root',
    attributes: [],
    relations: [],
    ...overrides,
  };
}

function childEntity(id: string, name: string, parentAggregateId: string, overrides: Partial<Entity> = {}): Entity {
  return {
    id,
    name,
    nameEn: name,
    description: `${name} entity`,
    projectId: 'ep1',
    businessScenarioId: 'bs-1',
    entityRole: 'child_entity',
    parentAggregateId,
    attributes: [],
    relations: [],
    ...overrides,
  };
}

// ── Data Model Operations ──

describe('ontology-store Data Model Operations', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  describe('setDataModel', () => {
    it('should replace the dataModel on the project', () => {
      const dm = emptyDataModel();
      useOntologyStore.getState().setDataModel(dm);
      const project = useOntologyStore.getState().project;
      expect(project?.dataModel).not.toBeNull();
      expect(project!.dataModel!.id).toBe('dm-test');
      expect(project!.dataModel!.name).toBe('Test Data Model');
    });

    it('should not throw when project is null (returns null project)', () => {
      resetStore();
      expect(() => useOntologyStore.getState().setDataModel(emptyDataModel())).not.toThrow();
      // project should still be null – setDataModel sets project.dataModel, but if project is null it sets project to null
      const project = useOntologyStore.getState().project;
      // setDataModel: if no project, project stays null (ternary returns null)
      expect(project).toBeNull();
    });

    it('should retain other project fields when setting dataModel', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      const project = useOntologyStore.getState().project;
      expect(project!.name).toBe('测试项目');
      expect(project!.domain).toEqual(domain);
    });
  });

  describe('addEntity', () => {
    it('should add an aggregate_root entity to dataModel.entities', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      useOntologyStore.getState().addEntity(aggregateRoot('e1', 'Customer'));
      const entities = useOntologyStore.getState().project!.dataModel!.entities;
      expect(entities).toHaveLength(1);
      expect(entities[0].id).toBe('e1');
      expect(entities[0].name).toBe('Customer');
      expect(entities[0].entityRole).toBe('aggregate_root');
    });

    it('should add a child_entity referencing an existing aggregate_root', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [aggregateRoot('parent', 'Order')],
      });
      useOntologyStore.getState().addEntity(childEntity('child', 'OrderItem', 'parent'));
      const entities = useOntologyStore.getState().project!.dataModel!.entities;
      expect(entities).toHaveLength(2);
      expect(entities[1].parentAggregateId).toBe('parent');
    });

    it('should auto-create a dataModel when none exists', () => {
      // Remove dataModel from the seeded project
      const project = useOntologyStore.getState().project!;
      useOntologyStore.setState({
        project: { ...project, dataModel: undefined as unknown as DataModel },
      });
      expect(useOntologyStore.getState().project?.dataModel).toBeUndefined();

      useOntologyStore.getState().addEntity(aggregateRoot('e1', 'Customer'));
      const dm = useOntologyStore.getState().project!.dataModel!;
      expect(dm).toBeDefined();
      expect(dm.entities).toHaveLength(1);
      expect(dm.entities[0].id).toBe('e1');
      // Auto-created name uses domain
      expect(dm.name).toContain('数据模型');
    });

    it('should throw when adding a child_entity without a parentAggregateId', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      const bad = childEntity('orphan', 'Orphan', '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (bad as any).parentAggregateId;
      expect(() => useOntologyStore.getState().addEntity(bad)).toThrow('子实体必须指定所属聚合根');
    });

    it('should throw when adding a child_entity referencing a non-existent parent', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      expect(() =>
        useOntologyStore.getState().addEntity(childEntity('orphan', 'Orphan', 'nonexistent-parent'))
      ).toThrow('父聚合根不存在');
    });

    it('should throw when adding an aggregate_root with parentAggregateId set', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      const root = aggregateRoot('e1', 'BadRoot');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (root as any).parentAggregateId = 'some-other';
      expect(() => useOntologyStore.getState().addEntity(root)).toThrow('聚合根不能指定所属聚合根');
    });

    it('should do nothing when project is null', () => {
      resetStore();
      useOntologyStore.getState().addEntity(aggregateRoot('e1', 'Customer'));
      expect(useOntologyStore.getState().project).toBeNull();
    });

    it('should throw if entity has no businessScenarioId and no scenarios exist', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        businessScenarios: [],
      });
      const entity = aggregateRoot('e1', 'NoScenario');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (entity as any).businessScenarioId;
      expect(() => useOntologyStore.getState().addEntity(entity)).toThrow('实体必须归属一个业务场景');
    });
  });

  describe('updateEntity', () => {
    it('should update entity fields by id', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [aggregateRoot('e1', 'Customer')],
      });
      useOntologyStore.getState().updateEntity('e1', { ...aggregateRoot('e1', 'UpdatedCustomer'), name: 'UpdatedCustomer' });
      const entity = useOntologyStore.getState().project!.dataModel!.entities[0];
      expect(entity.name).toBe('UpdatedCustomer');
    });

    it('should return state unchanged when entityId does not exist', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [aggregateRoot('e1', 'Customer')],
      });
      useOntologyStore.getState().updateEntity('nonexistent', aggregateRoot('e1', 'ShouldNotUpdate'));
      const entities = useOntologyStore.getState().project!.dataModel!.entities;
      expect(entities).toHaveLength(1);
      expect(entities[0].name).toBe('Customer');
    });

    it('should return state unchanged when dataModel is missing', () => {
      const project = useOntologyStore.getState().project!;
      useOntologyStore.setState({
        project: { ...project, dataModel: undefined as unknown as DataModel },
      });
      // Should not throw, just return state unchanged
      expect(() => useOntologyStore.getState().updateEntity('e1', aggregateRoot('e1', 'Customer'))).not.toThrow();
    });

    it('should allow renaming a child_entity without changing parentAggregateId', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [
          aggregateRoot('parent', 'Order'),
          childEntity('child', 'OrderItem', 'parent'),
        ],
      });
      useOntologyStore.getState().updateEntity('child', {
        ...childEntity('child', 'RenamedItem', 'parent'),
        name: 'RenamedItem',
      });
      const entities = useOntologyStore.getState().project!.dataModel!.entities;
      expect(entities[1].name).toBe('RenamedItem');
      expect(entities[1].parentAggregateId).toBe('parent');
    });

    it('should throw when demoting aggregate_root that has child entities', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [
          aggregateRoot('parent', 'Order'),
          childEntity('child', 'OrderItem', 'parent'),
          aggregateRoot('other-root', 'OtherRoot'),
        ],
      });
      const demoted = aggregateRoot('parent', 'Order');
      demoted.entityRole = 'child_entity';
      demoted.parentAggregateId = 'other-root';
      expect(() => useOntologyStore.getState().updateEntity('parent', demoted)).toThrow('存在归属到当前聚合根的子实体');
    });

    it('should allow demoting aggregate_root that has NO child entities', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [aggregateRoot('parent', 'Order')],
      });
      const demoted: Entity = {
        ...aggregateRoot('parent', 'Order'),
        entityRole: 'child_entity',
        parentAggregateId: 'new-parent',
      };
      // Must also have a target aggregate_root to reference
      useOntologyStore.getState().addEntity(aggregateRoot('new-parent', 'NewRoot'));
      useOntologyStore.getState().updateEntity('parent', demoted);
      const entity = useOntologyStore.getState().project!.dataModel!.entities.find((e) => e.id === 'parent');
      expect(entity!.entityRole).toBe('child_entity');
      expect(entity!.parentAggregateId).toBe('new-parent');
    });
  });

  describe('deleteEntity (cascade)', () => {
    it('should delete a single entity with no children', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [aggregateRoot('e1', 'Customer')],
      });
      useOntologyStore.getState().deleteEntity('e1');
      expect(useOntologyStore.getState().project!.dataModel!.entities).toHaveLength(0);
    });

    it('should cascade-delete child entities when deleting the aggregate_root', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [
          aggregateRoot('parent', 'Order'),
          childEntity('child1', 'Item', 'parent'),
          childEntity('child2', 'Line', 'parent'),
          aggregateRoot('other', 'Customer'),
        ],
      });
      useOntologyStore.getState().deleteEntity('parent');
      const entities = useOntologyStore.getState().project!.dataModel!.entities;
      expect(entities).toHaveLength(1);
      expect(entities[0].id).toBe('other');
    });

    it('should cascade recursively (grandchildren)', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [
          aggregateRoot('grandparent', 'Order'),
          childEntity('parent', 'OrderHeader', 'grandparent'),
          childEntity('child', 'OrderLine', 'parent'),
          childEntity('grandchild', 'OrderTax', 'child'),
          aggregateRoot('other', 'Customer'),
        ],
      });
      useOntologyStore.getState().deleteEntity('grandparent');
      const entities = useOntologyStore.getState().project!.dataModel!.entities;
      expect(entities).toHaveLength(1);
      expect(entities[0].id).toBe('other');
    });

    it('should do nothing when entityId does not exist', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        entities: [aggregateRoot('e1', 'Customer')],
      });
      expect(() => useOntologyStore.getState().deleteEntity('nonexistent')).not.toThrow();
      expect(useOntologyStore.getState().project!.dataModel!.entities).toHaveLength(1);
    });

    it('should do nothing when dataModel is missing', () => {
      const project = useOntologyStore.getState().project!;
      useOntologyStore.setState({
        project: { ...project, dataModel: undefined as unknown as DataModel },
      });
      expect(() => useOntologyStore.getState().deleteEntity('e1')).not.toThrow();
    });
  });
});

// ── Project Category Management ──

describe('ontology-store Project Category Management', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  const mockProject: EntityProject = {
    id: 'ep1',
    name: 'CRM',
    nameEn: 'CRM',
    description: '客户关系管理',
  };

  describe('addEntityProject', () => {
    it('should add a project to dataModel.projects', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      useOntologyStore.getState().addEntityProject(mockProject);
      const projects = useOntologyStore.getState().project!.dataModel!.projects;
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe('ep1');
      expect(projects[0].name).toBe('CRM');
    });

    it('should auto-create dataModel when none exists', () => {
      const project = useOntologyStore.getState().project!;
      useOntologyStore.setState({
        project: { ...project, dataModel: undefined as unknown as DataModel },
      });
      useOntologyStore.getState().addEntityProject(mockProject);
      const dm = useOntologyStore.getState().project!.dataModel!;
      expect(dm).toBeDefined();
      expect(dm.projects).toHaveLength(1);
      expect(dm.projects[0].id).toBe('ep1');
    });

    it('should do nothing when project is null', () => {
      resetStore();
      useOntologyStore.getState().addEntityProject(mockProject);
      expect(useOntologyStore.getState().project).toBeNull();
    });

    it('should append to existing projects', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        projects: [{ id: 'ep-existing', name: 'Existing', nameEn: 'Existing', description: '' }],
      });
      useOntologyStore.getState().addEntityProject(mockProject);
      const projects = useOntologyStore.getState().project!.dataModel!.projects;
      expect(projects).toHaveLength(2);
      expect(projects[1].id).toBe('ep1');
    });
  });

  describe('updateEntityProject', () => {
    it('should update project fields by id', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        projects: [mockProject],
      });
      useOntologyStore.getState().updateEntityProject('ep1', { ...mockProject, name: 'Updated' });
      expect(useOntologyStore.getState().project!.dataModel!.projects[0].name).toBe('Updated');
    });

    it('should return state unchanged when projectId does not exist', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        projects: [mockProject],
      });
      useOntologyStore.getState().updateEntityProject('nonexistent', { ...mockProject, name: 'NeverApplied' });
      expect(useOntologyStore.getState().project!.dataModel!.projects[0].name).toBe('CRM');
    });

    it('should return state unchanged when dataModel or projects is missing', () => {
      const project = useOntologyStore.getState().project!;
      useOntologyStore.setState({
        project: { ...project, dataModel: undefined as unknown as DataModel },
      });
      expect(() => useOntologyStore.getState().updateEntityProject('ep1', mockProject)).not.toThrow();
    });
  });

  describe('deleteEntityProject (linked-entity guard)', () => {
    it('should delete a project with no linked entities', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        projects: [mockProject],
      });
      useOntologyStore.getState().deleteEntityProject('ep1');
      expect(useOntologyStore.getState().project!.dataModel!.projects).toHaveLength(0);
    });

    it('should NOT delete a project that has entities linked to it', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        projects: [mockProject],
        entities: [aggregateRoot('e1', 'Customer')], // has projectId: 'ep1'
      });
      useOntologyStore.getState().deleteEntityProject('ep1');
      // Project should still exist
      expect(useOntologyStore.getState().project!.dataModel!.projects).toHaveLength(1);
      expect(useOntologyStore.getState().project!.dataModel!.projects[0].id).toBe('ep1');
    });

    it('should return state unchanged when projectId does not exist', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        projects: [mockProject],
      });
      useOntologyStore.getState().deleteEntityProject('nonexistent');
      expect(useOntologyStore.getState().project!.dataModel!.projects).toHaveLength(1);
    });

    it('should return state unchanged when dataModel is missing', () => {
      resetStore();
      expect(() => useOntologyStore.getState().deleteEntityProject('ep1')).not.toThrow();
    });

    it('should allow deleting a project when linked entities reference a different project', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        projects: [
          mockProject,
          { id: 'ep-other', name: 'Other', nameEn: 'Other', description: '' },
        ],
        entities: [aggregateRoot('e1', 'Customer', { projectId: 'ep-other' })],
      });
      useOntologyStore.getState().deleteEntityProject('ep1');
      const projects = useOntologyStore.getState().project!.dataModel!.projects;
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe('ep-other');
    });
  });
});

// ── Business Scenario Operations ──

describe('ontology-store Business Scenario Operations', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  const mockScenario: BusinessScenario = {
    id: 'bs-new',
    name: '仓储管理',
    nameEn: 'WarehouseMgmt',
    description: '仓储管理场景',
    projectId: 'ep1',
  };

  describe('addBusinessScenario', () => {
    it('should add a business scenario to dataModel.businessScenarios', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      useOntologyStore.getState().addBusinessScenario(mockScenario);
      const scenarios = useOntologyStore.getState().project!.dataModel!.businessScenarios;
      expect(scenarios).toHaveLength(3); // 2 default + 1 new
      expect(scenarios.some((s) => s.id === 'bs-new')).toBe(true);
    });

    it('should do nothing when project or dataModel is null', () => {
      resetStore();
      useOntologyStore.getState().addBusinessScenario(mockScenario);
      expect(useOntologyStore.getState().project).toBeNull();
    });

    it('should enforce MAX_BUSINESS_SCENARIOS_PER_PROJECT (10) per projectId', () => {
      // Seed 10 scenarios for projectId 'ep1' (the limit)
      const scenarios: BusinessScenario[] = [];
      for (let i = 0; i < 10; i++) {
        scenarios.push({
          id: `bs-${i}`,
          name: `Scenario ${i}`,
          nameEn: `Scenario${i}`,
          projectId: 'ep1',
        });
      }
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        businessScenarios: scenarios,
      });

      // Trying to add one more for the same projectId should be blocked
      useOntologyStore.getState().addBusinessScenario(mockScenario);
      const after = useOntologyStore.getState().project!.dataModel!.businessScenarios;
      expect(after).toHaveLength(10);
      expect(after.every((s) => s.id !== 'bs-new')).toBe(true);
    });

    it('should allow adding scenarios up to the limit (9 → 10 is ok)', () => {
      const scenarios: BusinessScenario[] = [];
      for (let i = 0; i < 9; i++) {
        scenarios.push({
          id: `bs-${i}`,
          name: `Scenario ${i}`,
          nameEn: `Scenario${i}`,
          projectId: 'ep1',
        });
      }
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        businessScenarios: scenarios,
      });
      useOntologyStore.getState().addBusinessScenario(mockScenario);
      expect(useOntologyStore.getState().project!.dataModel!.businessScenarios).toHaveLength(10);
    });

    it('should allow adding scenarios for different projectIds even when one is at the limit', () => {
      const scenarios: BusinessScenario[] = [];
      for (let i = 0; i < 10; i++) {
        scenarios.push({
          id: `bs-${i}`,
          name: `Scenario ${i}`,
          nameEn: `Scenario${i}`,
          projectId: 'ep1',
        });
      }
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        businessScenarios: scenarios,
      });
      // Adding for a different projectId should work
      const otherScenario: BusinessScenario = {
        id: 'bs-other',
        name: 'Other',
        nameEn: 'Other',
        projectId: 'ep-other',
      };
      useOntologyStore.getState().addBusinessScenario(otherScenario);
      expect(useOntologyStore.getState().project!.dataModel!.businessScenarios).toHaveLength(11);
    });
  });

  describe('updateBusinessScenario', () => {
    it('should update scenario fields by id', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      useOntologyStore.getState().updateBusinessScenario('bs-1', {
        id: 'bs-1',
        name: 'UpdatedProduction',
        nameEn: 'UpdatedProd',
        projectId: 'ep1',
      });
      const scenarios = useOntologyStore.getState().project!.dataModel!.businessScenarios;
      expect(scenarios.find((s) => s.id === 'bs-1')!.name).toBe('UpdatedProduction');
    });

    it('should return state unchanged when scenarioId does not exist', () => {
      useOntologyStore.getState().setDataModel(emptyDataModel());
      useOntologyStore.getState().updateBusinessScenario('nonexistent', {
        id: 'nonexistent',
        name: 'Nope',
        nameEn: 'Nope',
        projectId: 'ep1',
      });
      const scenarios = useOntologyStore.getState().project!.dataModel!.businessScenarios;
      expect(scenarios).toHaveLength(2);
    });

    it('should return state unchanged when dataModel or businessScenarios is missing', () => {
      resetStore();
      expect(() =>
        useOntologyStore.getState().updateBusinessScenario('bs-1', {
          id: 'bs-1',
          name: 'Nope',
          nameEn: 'Nope',
          projectId: 'ep1',
        })
      ).not.toThrow();
    });
  });

  describe('deleteBusinessScenario (linked-entity guard)', () => {
    it('should delete a scenario with no linked entities', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        businessScenarios: [mockScenario],
      });
      useOntologyStore.getState().deleteBusinessScenario('bs-new');
      expect(useOntologyStore.getState().project!.dataModel!.businessScenarios).toHaveLength(0);
    });

    it('should NOT delete a scenario that has entities linked to it via businessScenarioId', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        businessScenarios: [
          { id: 'bs-1', name: '生产管理', nameEn: 'ProductionMgmt', description: '', projectId: 'ep1' },
        ],
        entities: [aggregateRoot('e1', 'Customer')], // has businessScenarioId: 'bs-1'
      });
      useOntologyStore.getState().deleteBusinessScenario('bs-1');
      // Scenario should still exist
      expect(useOntologyStore.getState().project!.dataModel!.businessScenarios).toHaveLength(1);
      expect(useOntologyStore.getState().project!.dataModel!.businessScenarios[0].id).toBe('bs-1');
    });

    it('should return state unchanged when scenarioId does not exist', () => {
      useOntologyStore.getState().setDataModel({
        ...emptyDataModel(),
        businessScenarios: [mockScenario],
      });
      useOntologyStore.getState().deleteBusinessScenario('nonexistent');
      expect(useOntologyStore.getState().project!.dataModel!.businessScenarios).toHaveLength(1);
    });

    it('should return state unchanged when dataModel or businessScenarios is missing', () => {
      resetStore();
      expect(() => useOntologyStore.getState().deleteBusinessScenario('bs-1')).not.toThrow();
    });
  });
});
