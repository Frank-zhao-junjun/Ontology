import { describe, it, expect, beforeEach } from 'vitest';
import { useOntologyStore } from '../../src/store/ontology-store';
import type { PositionResponsibility, Intent, StateMachine } from '../../src/types/ontology';

// Helper to reset store between tests
function resetStore() {
  useOntologyStore.setState({
    project: null,
    activeModelType: 'data',
    metadataList: [],
  });
}

// Helper to create a project with business scenario and dataModel
function createTestProject() {
  const store = useOntologyStore.getState();
  store.createProject('测试项目', { id: 'dm-1', name: '离散制造', nameEn: 'Discrete Manufacturing', description: '离散制造领域' }, '测试描述');
  const project = useOntologyStore.getState().project;
  if (project && project.dataModel) {
    useOntologyStore.setState({
      project: {
        ...project,
        dataModel: {
          ...project.dataModel,
          businessScenarios: [
            { id: 'bs-1', name: '生产管理', nameEn: 'ProductionMgmt', description: '生产管理场景', projectId: project.id },
          ],
        },
      },
    });
  }
}

// ============================================================
// Entity Lifecycle Tests
// ============================================================
describe('Entity Lifecycle', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should get entity lifecycle with state machines', () => {
    const store = useOntologyStore.getState();
    const project = useOntologyStore.getState().project!;
    // Add entity with businessScenarioId
    store.addEntity({ id: 'ent-1', name: '物料', nameEn: 'Material', projectId: project.id, businessScenarioId: 'bs-1', entityRole: 'aggregate_root', attributes: [], relations: [] });
    const project2 = useOntologyStore.getState().project!;
    const entity = project2.dataModel!.entities[0];
    expect(entity).toBeDefined();

    // Add state machine
    const sm: StateMachine = {
      id: 'sm-1',
      name: '物料状态机',
      entity: entity!.id,
      statusField: 'status',
      states: [
        { id: 's-1', name: '草稿', isInitial: true },
        { id: 's-2', name: '已发布', isFinal: true },
      ],
      transitions: [
        { id: 't-1', from: 's-1', to: 's-2', name: '发布', trigger: 'manual' },
      ],
    };
    store.addStateMachine(sm);

    // Get lifecycle
    const lifecycle = store.getEntityLifecycle(entity!.id);
    expect(lifecycle).toBeDefined();
    expect(lifecycle?.entityId).toBe(entity!.id);
    expect(lifecycle?.stats.totalStates).toBe(2);
    expect(lifecycle?.stats.totalTransitions).toBe(1);
  });

  it('should return null for non-existent entity lifecycle', () => {
    const store = useOntologyStore.getState();
    const lifecycle = store.getEntityLifecycle('non-existent');
    expect(lifecycle).toBeNull();
  });

  it('should add and retrieve audit trail entries', () => {
    const store = useOntologyStore.getState();
    const project = useOntologyStore.getState().project!;
    store.addEntity({ id: 'ent-2', name: '物料', nameEn: 'Material', projectId: project.id, businessScenarioId: 'bs-1', entityRole: 'aggregate_root', attributes: [], relations: [] });
    const project2 = useOntologyStore.getState().project!;
    const entity = project2.dataModel!.entities[0];

    store.addLifecycleAuditEntry({
      entityId: entity!.id,
      entityNameEn: 'Material',
      fromStateId: 's-1',
      toStateId: 's-2',
      actionId: 'a-1',
      timestamp: new Date().toISOString(),
      eventType: 'transition',
      result: 'success',
    });

    const trail = store.getAuditTrail(entity!.id);
    expect(trail).toHaveLength(1);
    expect(trail[0].fromStateId).toBe('s-1');
    expect(trail[0].toStateId).toBe('s-2');
  });

  it('should clear audit trail', () => {
    const store = useOntologyStore.getState();
    const project = useOntologyStore.getState().project!;
    store.addEntity({ id: 'ent-3', name: '物料', nameEn: 'Material', projectId: project.id, businessScenarioId: 'bs-1', entityRole: 'aggregate_root', attributes: [], relations: [] });
    const project2 = useOntologyStore.getState().project!;
    const entity = project2.dataModel!.entities[0];

    store.addLifecycleAuditEntry({
      entityId: entity!.id,
      entityNameEn: 'Material',
      fromStateId: 's-1',
      toStateId: 's-2',
      timestamp: new Date().toISOString(),
      eventType: 'transition',
      result: 'success',
    });

    store.clearAuditTrail(entity!.id);
    const trail = store.getAuditTrail(entity!.id);
    expect(trail).toHaveLength(0);
  });
});

// ============================================================
// Agent Semantic Layer Tests
// ============================================================
describe('Agent Semantic Layer', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  function makeIntent(id: string, name: string, actionId: string, triggerPhrases?: string[]): Intent {
    return {
      id, name,
      category: 'crud',
      triggerPhrases: triggerPhrases || ['帮我创建采购订单', '新建采购单'],
      actionId,
      targetEntityId: 'entity-1',
      slotFilling: { slots: [], requiredSlots: [], fillOrder: [], allowBatchFill: true },
      priority: 1,
      requiresConfirmation: false,
      examples: [],
    };
  }

  it('should add and retrieve an intent', () => {
    const store = useOntologyStore.getState();
    store.addIntent(makeIntent('intent-1', '创建采购订单', 'action-1'));

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl).toBeDefined();
    expect(asl?.intents).toHaveLength(1);
    expect(asl?.intents[0].name).toBe('创建采购订单');
  });

  it('should update an intent', () => {
    const store = useOntologyStore.getState();
    store.addIntent(makeIntent('intent-1', '创建采购订单', 'action-1'));
    store.updateIntent('intent-1', makeIntent('intent-1', '创建采购申请', 'action-1'));

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl?.intents[0].name).toBe('创建采购申请');
  });

  it('should delete an intent', () => {
    const store = useOntologyStore.getState();
    store.addIntent(makeIntent('intent-1', '创建采购订单', 'action-1', []));
    store.deleteIntent('intent-1');

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl?.intents).toHaveLength(0);
  });

  it('should add a business term', () => {
    const store = useOntologyStore.getState();
    // Ensure agentSemanticLayer exists first
    store.addIntent(makeIntent('temp', 'temp', 'a-1'));

    store.addBusinessTerm({
      id: 'bt-1',
      term: '采购订单',
      definition: '向供应商采购物料的正式凭证',
      synonyms: ['采购单', 'PO'],
      domain: '供应链',
      examples: [],
      modelRefs: [],
      status: 'active',
    });

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl?.businessTerms).toHaveLength(1);
    expect(asl?.businessTerms[0].term).toBe('采购订单');
  });

  it('should add a semantic relation', () => {
    const store = useOntologyStore.getState();
    // Ensure agentSemanticLayer exists first
    store.addIntent(makeIntent('temp', 'temp', 'a-1'));

    store.addSemanticRelation({
      id: 'sr-1',
      sourceEntityId: 'entity-1',
      targetEntityId: 'entity-2',
      type: 'is_a',
      name: '采购订单是订单的子类',
      description: '采购订单是订单的子类',
      weight: 1,
      transitive: true,
      symmetric: false,
    });

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl?.semanticRelations).toHaveLength(1);
    expect(asl?.semanticRelations[0].type).toBe('is_a');
  });

  it('should get semantic coverage', () => {
    const store = useOntologyStore.getState();
    const project = useOntologyStore.getState().project!;
    // Add entity and intent
    store.addEntity({ id: 'ent-cov-1', name: '物料', nameEn: 'Material', projectId: project.id, businessScenarioId: 'bs-1', entityRole: 'aggregate_root', attributes: [], relations: [] });
    store.addIntent(makeIntent('intent-1', '创建物料', 'action-1'));

    const coverage = store.getSemanticCoverage();
    expect(coverage).toBeDefined();
    expect(coverage?.totalEntities).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// Organization & Position Tests
// ============================================================
describe('Organization & Position', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should add a department', () => {
    const store = useOntologyStore.getState();
    const result = store.addDepartment({
      name: '集团总部',
      nameEn: 'HQ',
      type: 'group',
      status: 'active',
    });
    expect(result).toBeDefined();
    expect(result.name).toBe('集团总部');
    // Note: id is regenerated by store
  });

  it('should build department tree', () => {
    const store = useOntologyStore.getState();
    // Add root department
    const root = store.addDepartment({
      name: '集团总部',
      nameEn: 'HQ',
      type: 'group',
      status: 'active',
    });

    // Add child department
    store.addDepartment({
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
      status: 'active',
      parentId: root.id,
    });

    const tree = store.getDepartmentTree();
    expect(tree).toHaveLength(1); // 1 root
    expect(tree[0].department.name).toBe('集团总部');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].department.name).toBe('生产管理部');
  });

  it('should add a position', () => {
    const store = useOntologyStore.getState();
    const dept = store.addDepartment({
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
      status: 'active',
    });

    const result = store.addPosition({
      name: '生产主管',
      nameEn: 'ProductionManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [],
      status: 'active',
    });
    expect(result).toBeDefined();
    expect(result.name).toBe('生产主管');
  });

  it('should get positions by department', () => {
    const store = useOntologyStore.getState();
    const dept = store.addDepartment({
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
      status: 'active',
    });

    store.addPosition({
      name: '生产主管',
      nameEn: 'ProductionManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [],
      status: 'active',
    });

    const positions = store.getPositionsByDepartment(dept.id);
    expect(positions).toHaveLength(1);
    expect(positions[0].name).toBe('生产主管');
  });

  it('should delete department and cascade positions', () => {
    const store = useOntologyStore.getState();
    const dept = store.addDepartment({
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
      status: 'active',
    });

    store.addPosition({
      name: '生产主管',
      nameEn: 'ProductionManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [],
      status: 'active',
    });

    store.deleteDepartment(dept.id);

    const tree = store.getDepartmentTree();
    expect(tree).toHaveLength(0);

    // Positions should also be deleted
    const orgModel = useOntologyStore.getState().project?.organizationModel;
    expect(orgModel?.positions).toHaveLength(0);
  });

  it('should detect responsibility overlap', () => {
    const store = useOntologyStore.getState();
    const dept = store.addDepartment({
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
      status: 'active',
    });

    const responsibility1: PositionResponsibility = {
      id: 'resp-1',
      name: '物料审批',
      scope: 'entity',
      scopeRefs: ['entity-1'],
      actions: ['approve_material'],
      decisionAuthority: 'approve',
      isActive: true,
    };

    const responsibility2: PositionResponsibility = {
      id: 'resp-2',
      name: '物料审批',
      scope: 'entity',
      scopeRefs: ['entity-1'],
      actions: ['approve_material'],
      decisionAuthority: 'approve',
      isActive: true,
    };

    const pos1 = store.addPosition({
      name: '生产主管',
      nameEn: 'ProductionManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [responsibility1],
      status: 'active',
    });

    const pos2 = store.addPosition({
      name: '采购主管',
      nameEn: 'PurchaseManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [responsibility2],
      status: 'active',
    });

    const overlaps = store.detectResponsibilityOverlap(pos1.id, pos2.id);
    expect(overlaps).toBeDefined();
    expect(overlaps.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Reference Document Tests
// ============================================================
describe('Reference Documents', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should add a reference document', () => {
    const store = useOntologyStore.getState();
    const result = store.addReferenceDocument({
      fileName: '业务规范.docx',
      fileType: 'docx',
      fileSize: 1024,
      extractedText: '这是一份业务规范文档',
      textLength: '这是一份业务规范文档'.length,
      parseStatus: 'success',
      uploadedAt: new Date().toISOString(),
    });
    expect(result).toBeDefined();
    expect(result.fileName).toBe('业务规范.docx');
    expect(result.id).toBeDefined();
  });

  it('should remove a reference document', () => {
    const store = useOntologyStore.getState();
    const added = store.addReferenceDocument({
      fileName: 'test.pdf',
      fileType: 'pdf',
      fileSize: 2048,
      extractedText: 'test content',
      textLength: 'test content'.length,
      parseStatus: 'success',
      uploadedAt: new Date().toISOString(),
    });

    store.removeReferenceDocument(added.id);

    const docs = useOntologyStore.getState().project?.referenceDocuments;
    expect(docs).toHaveLength(0);
  });

  it('should update a reference document', () => {
    const store = useOntologyStore.getState();
    const added = store.addReferenceDocument({
      fileName: 'test.pdf',
      fileType: 'pdf',
      fileSize: 2048,
      extractedText: 'original',
      textLength: 'original'.length,
      parseStatus: 'success',
      uploadedAt: new Date().toISOString(),
    });

    store.updateReferenceDocument(added.id, { extractedText: 'updated' });

    const docs = useOntologyStore.getState().project?.referenceDocuments;
    expect(docs).toHaveLength(1);
    expect(docs?.[0].extractedText).toBe('updated');
  });

  it('should clear all reference documents', () => {
    const store = useOntologyStore.getState();
    store.addReferenceDocument({
      fileName: 'a.pdf',
      fileType: 'pdf',
      fileSize: 1024,
      extractedText: 'a',
      textLength: 1,
      parseStatus: 'success',
      uploadedAt: new Date().toISOString(),
    });
    store.addReferenceDocument({
      fileName: 'b.docx',
      fileType: 'docx',
      fileSize: 2048,
      extractedText: 'b',
      textLength: 1,
      parseStatus: 'success',
      uploadedAt: new Date().toISOString(),
    });

    store.clearReferenceDocuments();

    const docs = useOntologyStore.getState().project?.referenceDocuments;
    expect(docs).toHaveLength(0);
  });
});
