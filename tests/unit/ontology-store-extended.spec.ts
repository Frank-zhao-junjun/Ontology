import { describe, it, expect, beforeEach } from 'vitest';
import { useOntologyStore } from '../../src/store/ontology-store';
import type {
  PositionResponsibility, Intent, StateMachine,
  BusinessMetric, TransactionBoundary, BehaviorIndicator, BehaviorConstraint,
  BehaviorModel, MasterDataRecord, EpcStep, MetaElement,
  HRSyncConfig, HRSyncResult,
  GovernanceModel, GovernanceRole, GovernanceFieldPermission, GovernanceAgentPolicy,
  DataSourcesModel, DataSourceDefinition,
} from '../../src/types/ontology';

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

// ============================================================
// Business Metrics CRUD (B05)
// ============================================================
describe('Business Metrics', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  function makeMetric(id: string, name: string, nameEn: string, formula: string): BusinessMetric {
    return {
      id, name, nameEn,
      formula,
      unit: '个',
      targetValue: 100,
      boundActionId: 'action-1',
      measurementType: 'automatic',
      dataSourceRef: 'ds-1',
    };
  }

  it('should add a metric and create metricsModel if missing', () => {
    const store = useOntologyStore.getState();
    store.addMetric(makeMetric('m-1', '订单数量', 'orderCount', 'COUNT(orders)'));

    const model = useOntologyStore.getState().project?.metricsModel;
    expect(model).toBeDefined();
    expect(model?.metrics).toHaveLength(1);
    expect(model?.metrics[0].name).toBe('订单数量');
    expect(model?.metrics[0].formula).toBe('COUNT(orders)');
  });

  it('should add multiple metrics and increment count', () => {
    const store = useOntologyStore.getState();
    store.addMetric(makeMetric('m-1', '订单数量', 'orderCount', 'COUNT(orders)'));
    store.addMetric(makeMetric('m-2', '总金额', 'totalAmount', 'SUM(amount)'));

    const model = useOntologyStore.getState().project?.metricsModel;
    expect(model?.metrics).toHaveLength(2);
  });

  it('should update a metric field', () => {
    const store = useOntologyStore.getState();
    store.addMetric(makeMetric('m-1', '订单数量', 'orderCount', 'COUNT(orders)'));

    store.updateMetric('m-1', { name: '订单总数量', targetValue: 200 });

    const model = useOntologyStore.getState().project?.metricsModel;
    expect(model?.metrics).toHaveLength(1);
    expect(model?.metrics[0].name).toBe('订单总数量');
    expect(model?.metrics[0].targetValue).toBe(200);
    expect(model?.metrics[0].formula).toBe('COUNT(orders)'); // unchanged
  });

  it('should delete a metric by id', () => {
    const store = useOntologyStore.getState();
    store.addMetric(makeMetric('m-1', '订单数量', 'orderCount', 'COUNT(orders)'));
    store.addMetric(makeMetric('m-2', '总金额', 'totalAmount', 'SUM(amount)'));

    store.deleteMetric('m-1');

    const model = useOntologyStore.getState().project?.metricsModel;
    expect(model?.metrics).toHaveLength(1);
    expect(model?.metrics[0].id).toBe('m-2');
  });

  it('should handle delete on non-existent metric gracefully', () => {
    const store = useOntologyStore.getState();
    store.addMetric(makeMetric('m-1', '订单数量', 'orderCount', 'COUNT(orders)'));

    expect(() => store.deleteMetric('non-existent')).not.toThrow();
    const model = useOntologyStore.getState().project?.metricsModel;
    expect(model?.metrics).toHaveLength(1);
  });
});

// ============================================================
// Transaction Boundaries CRUD (B06)
// ============================================================
describe('Transaction Boundaries', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  function makeBoundary(id: string, name: string, actionIds: string[]): TransactionBoundary {
    return {
      id,
      name,
      nameEn: name,
      description: `${name} description`,
      actionIds,
      aggregateRootIds: ['agg-1'],
      isolation: 'read_committed',
      compensationActionId: undefined,
    };
  }

  it('should add a transaction boundary and create behaviorModel if missing', () => {
    const store = useOntologyStore.getState();
    store.addTransactionBoundary(makeBoundary('tb-1', '创建订单', ['action-1', 'action-2']));

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model).toBeDefined();
    expect(model?.transactionBoundaries).toHaveLength(1);
    expect(model?.transactionBoundaries![0].name).toBe('创建订单');
    expect(model?.transactionBoundaries![0].actionIds).toEqual(['action-1', 'action-2']);
  });

  it('should add multiple boundaries', () => {
    const store = useOntologyStore.getState();
    store.addTransactionBoundary(makeBoundary('tb-1', '创建订单', ['a-1']));
    store.addTransactionBoundary(makeBoundary('tb-2', '审核订单', ['a-2']));

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.transactionBoundaries).toHaveLength(2);
  });

  it('should update a transaction boundary', () => {
    const store = useOntologyStore.getState();
    store.addTransactionBoundary(makeBoundary('tb-1', '创建订单', ['a-1']));

    store.updateTransactionBoundary('tb-1', { name: '更新订单', actionIds: ['a-1', 'a-3'] });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.transactionBoundaries).toHaveLength(1);
    expect(model?.transactionBoundaries![0].name).toBe('更新订单');
    expect(model?.transactionBoundaries![0].actionIds).toContain('a-3');
  });

  it('should delete a transaction boundary', () => {
    const store = useOntologyStore.getState();
    store.addTransactionBoundary(makeBoundary('tb-1', '创建订单', ['a-1']));
    store.addTransactionBoundary(makeBoundary('tb-2', '审核订单', ['a-2']));

    store.deleteTransactionBoundary('tb-1');

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.transactionBoundaries).toHaveLength(1);
    expect(model?.transactionBoundaries![0].id).toBe('tb-2');
  });

  it('should handle delete on non-existent boundary gracefully', () => {
    const store = useOntologyStore.getState();
    store.addTransactionBoundary(makeBoundary('tb-1', '创建订单', ['a-1']));

    expect(() => store.deleteTransactionBoundary('non-existent')).not.toThrow();
    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.transactionBoundaries).toHaveLength(1);
  });
});

// ============================================================
// Behavior Model CRUD
// ============================================================
describe('Behavior Model CRUD', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  // --- setBehaviorModel ---
  it('should set the entire behavior model', () => {
    const store = useOntologyStore.getState();
    const model: BehaviorModel = {
      id: 'bm-1',
      name: '测试行为模型',
      version: '1.0.0',
      domain: 'dm-1',
      stateMachines: [],
      actions: [],
      functions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setBehaviorModel(model);

    const bm = useOntologyStore.getState().project?.behaviorModel;
    expect(bm).toBeDefined();
    expect(bm?.id).toBe('bm-1');
    expect(bm?.name).toBe('测试行为模型');
  });

  // --- State Machines ---
  it('should add a state machine', () => {
    const store = useOntologyStore.getState();
    store.addStateMachine({
      id: 'sm-1',
      name: '订单状态机',
      entity: 'ent-1',
      statusField: 'status',
      states: [{ id: 's-1', name: '草稿', isInitial: true }],
      transitions: [],
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model).toBeDefined();
    expect(model?.stateMachines).toHaveLength(1);
    expect(model?.stateMachines[0].name).toBe('订单状态机');
  });

  it('should update a state machine', () => {
    const store = useOntologyStore.getState();
    store.addStateMachine({
      id: 'sm-1',
      name: '订单状态机',
      entity: 'ent-1',
      statusField: 'status',
      states: [{ id: 's-1', name: '草稿', isInitial: true }],
      transitions: [],
    });

    store.updateStateMachine('sm-1', {
      id: 'sm-1',
      name: '更新后的状态机',
      entity: 'ent-1',
      statusField: 'status',
      states: [
        { id: 's-1', name: '草稿', isInitial: true },
        { id: 's-2', name: '已发布', isFinal: true },
      ],
      transitions: [{ id: 't-1', from: 's-1', to: 's-2', name: '发布', trigger: 'manual' }],
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.stateMachines).toHaveLength(1);
    expect(model?.stateMachines[0].name).toBe('更新后的状态机');
    expect(model?.stateMachines[0].states).toHaveLength(2);
  });

  it('should delete a state machine', () => {
    const store = useOntologyStore.getState();
    store.addStateMachine({
      id: 'sm-1',
      name: '状态机1',
      entity: 'ent-1',
      statusField: 'status',
      states: [],
      transitions: [],
    });
    store.addStateMachine({
      id: 'sm-2',
      name: '状态机2',
      entity: 'ent-2',
      statusField: 'status',
      states: [],
      transitions: [],
    });

    store.deleteStateMachine('sm-1');

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.stateMachines).toHaveLength(1);
    expect(model?.stateMachines[0].id).toBe('sm-2');
  });

  // --- Actions ---
  it('should add an action', () => {
    const store = useOntologyStore.getState();
    store.addAction({
      id: 'a-1',
      name: '创建订单',
      nameEn: 'CreateOrder',
      description: '创建采购订单',
      entity: 'ent-1',
      stateMachine: 'sm-1',
      trigger: 'manual',
      inputAttributes: [],
      outputAttributes: [],
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.actions).toHaveLength(1);
    expect(model?.actions![0].name).toBe('创建订单');
    expect(model?.actions![0].stateMachine).toBe('sm-1');
  });

  it('should update an action', () => {
    const store = useOntologyStore.getState();
    store.addAction({
      id: 'a-1',
      name: '创建订单',
      nameEn: 'CreateOrder',
      entity: 'ent-1',
      trigger: 'manual',
      inputAttributes: [],
      outputAttributes: [],
    });

    store.updateAction('a-1', {
      id: 'a-1',
      name: '更新订单',
      nameEn: 'UpdateOrder',
      entity: 'ent-1',
      trigger: 'manual',
      inputAttributes: ['field-1'],
      outputAttributes: [],
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.actions).toHaveLength(1);
    expect(model?.actions![0].name).toBe('更新订单');
    expect(model?.actions![0].inputAttributes).toContain('field-1');
  });

  it('should delete an action', () => {
    const store = useOntologyStore.getState();
    store.addAction({
      id: 'a-1',
      name: '创建订单',
      nameEn: 'CreateOrder',
      entity: 'ent-1',
      trigger: 'manual',
      inputAttributes: [],
      outputAttributes: [],
    });
    store.addAction({
      id: 'a-2',
      name: '审核订单',
      nameEn: 'ApproveOrder',
      entity: 'ent-1',
      trigger: 'manual',
      inputAttributes: [],
      outputAttributes: [],
    });

    store.deleteAction('a-1');

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.actions).toHaveLength(1);
    expect(model?.actions![0].id).toBe('a-2');
  });

  // --- Functions ---
  it('should add a function definition', () => {
    const store = useOntologyStore.getState();
    store.addFunction({
      id: 'f-1',
      name: '计算金额',
      nameEn: 'CalculateAmount',
      description: '计算订单总金额',
      entity: 'ent-1',
      inputAttributes: ['quantity', 'price'],
      outputAttributes: ['totalAmount'],
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.functions).toHaveLength(1);
    expect(model?.functions![0].name).toBe('计算金额');
  });

  it('should update a function', () => {
    const store = useOntologyStore.getState();
    store.addFunction({
      id: 'f-1',
      name: '计算金额',
      nameEn: 'CalculateAmount',
      entity: 'ent-1',
      inputAttributes: [],
      outputAttributes: [],
    });

    store.updateFunction('f-1', {
      id: 'f-1',
      name: '重新计算金额',
      nameEn: 'RecalculateAmount',
      entity: 'ent-1',
      inputAttributes: ['qty'],
      outputAttributes: ['total'],
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.functions![0].name).toBe('重新计算金额');
  });

  it('should delete a function', () => {
    const store = useOntologyStore.getState();
    store.addFunction({
      id: 'f-1',
      name: '函数1',
      nameEn: 'Func1',
      entity: 'ent-1',
      inputAttributes: [],
      outputAttributes: [],
    });
    store.addFunction({
      id: 'f-2',
      name: '函数2',
      nameEn: 'Func2',
      entity: 'ent-1',
      inputAttributes: [],
      outputAttributes: [],
    });

    store.deleteFunction('f-1');

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.functions).toHaveLength(1);
    expect(model?.functions![0].id).toBe('f-2');
  });

  // --- Behavior Indicators ---
  it('should add a behavior indicator', () => {
    const store = useOntologyStore.getState();
    // Ensure behaviorModel exists first
    store.addStateMachine({
      id: 'sm-init',
      name: 'Init',
      entity: 'ent-1',
      statusField: 'status',
      states: [],
      transitions: [],
    });

    store.addBehaviorIndicator({
      id: 'bi-1',
      name: '订单处理时长',
      type: 'duration',
      targetEntity: 'ent-1',
      targetAttribute: 'processingTime',
      formula: 'endTime - startTime',
      warningThreshold: 3600,
      criticalThreshold: 7200,
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.indicators).toHaveLength(1);
    expect(model?.indicators![0].name).toBe('订单处理时长');
    expect(model?.indicators![0].type).toBe('duration');
  });

  it('should update a behavior indicator', () => {
    const store = useOntologyStore.getState();
    store.addStateMachine({
      id: 'sm-init',
      name: 'Init',
      entity: 'ent-1',
      statusField: 'status',
      states: [],
      transitions: [],
    });

    store.addBehaviorIndicator({
      id: 'bi-1',
      name: '订单处理时长',
      type: 'duration',
      targetEntity: 'ent-1',
    });

    store.updateBehaviorIndicator('bi-1', {
      id: 'bi-1',
      name: '订单处理时长(秒)',
      type: 'duration',
      targetEntity: 'ent-1',
      warningThreshold: 1800,
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.indicators![0].name).toBe('订单处理时长(秒)');
    expect(model?.indicators![0].warningThreshold).toBe(1800);
  });

  it('should delete a behavior indicator', () => {
    const store = useOntologyStore.getState();
    store.addStateMachine({
      id: 'sm-init',
      name: 'Init',
      entity: 'ent-1',
      statusField: 'status',
      states: [],
      transitions: [],
    });

    store.addBehaviorIndicator({
      id: 'bi-1', name: '时长', type: 'duration', targetEntity: 'ent-1',
    });
    store.addBehaviorIndicator({
      id: 'bi-2', name: '数量', type: 'count', targetEntity: 'ent-1',
    });

    store.deleteBehaviorIndicator('bi-1');

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.indicators).toHaveLength(1);
    expect(model?.indicators![0].id).toBe('bi-2');
  });

  // --- Behavior Constraints ---
  it('should add a behavior constraint', () => {
    const store = useOntologyStore.getState();
    store.addStateMachine({
      id: 'sm-init',
      name: 'Init',
      entity: 'ent-1',
      statusField: 'status',
      states: [],
      transitions: [],
    });

    store.addBehaviorConstraint({
      id: 'bc-1',
      name: '金额校验',
      description: '订单金额不能为负',
      scope: 'pre_action',
      constraintType: 'preCondition',
      condition: 'amount >= 0',
      severity: 'blocking',
      errorMessage: '订单金额不能为负',
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.constraints).toHaveLength(1);
    expect(model?.constraints![0].name).toBe('金额校验');
    expect(model?.constraints![0].severity).toBe('blocking');
  });

  it('should update a behavior constraint', () => {
    const store = useOntologyStore.getState();
    store.addStateMachine({
      id: 'sm-init',
      name: 'Init',
      entity: 'ent-1',
      statusField: 'status',
      states: [],
      transitions: [],
    });

    store.addBehaviorConstraint({
      id: 'bc-1',
      name: '金额校验',
      scope: 'pre_action',
      condition: 'amount >= 0',
      severity: 'blocking',
    });

    store.updateBehaviorConstraint('bc-1', {
      id: 'bc-1',
      name: '金额校验(更新)',
      scope: 'pre_action',
      condition: 'amount > 0',
      severity: 'warning',
      errorMessage: '金额需为正数',
    });

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.constraints![0].name).toBe('金额校验(更新)');
    expect(model?.constraints![0].condition).toBe('amount > 0');
    expect(model?.constraints![0].severity).toBe('warning');
  });

  it('should delete a behavior constraint', () => {
    const store = useOntologyStore.getState();
    store.addStateMachine({
      id: 'sm-init',
      name: 'Init',
      entity: 'ent-1',
      statusField: 'status',
      states: [],
      transitions: [],
    });

    store.addBehaviorConstraint({
      id: 'bc-1', name: '约束1', scope: 'pre_action', condition: 'a', severity: 'blocking',
    });
    store.addBehaviorConstraint({
      id: 'bc-2', name: '约束2', scope: 'post_action', condition: 'b', severity: 'warning',
    });

    store.deleteBehaviorConstraint('bc-1');

    const model = useOntologyStore.getState().project?.behaviorModel;
    expect(model?.constraints).toHaveLength(1);
    expect(model?.constraints![0].id).toBe('bc-2');
  });
});

// ============================================================
// MasterData Records Tests
// ============================================================
describe('MasterData Records', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({ masterDataList: [], masterDataRecords: {} });
    createTestProject();
  });

  function makeRecord(id: string, values: Record<string, string>): MasterDataRecord {
    return {
      id,
      definitionId: 'md-def-1',
      values,
      status: '00',
      createdAt: '2026-06-26T00:00:00.000Z',
      updatedAt: '2026-06-26T00:00:00.000Z',
    };
  }

  it('should add a record and appear in masterDataRecords map', () => {
    const store = useOntologyStore.getState();
    store.setMasterDataList([{ id: 'md-def-1', domain: '生产管理', name: '客户主数据', nameEn: 'Customer', code: 'MD-CUST', description: '', coreData: '', fieldNames: '', sourceSystem: 'SAP', status: '00', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }]);
    store.addMasterDataRecord('md-def-1', makeRecord('rec-1', { 客户编码: 'C-001', 客户名称: '华中客户' }));

    const records = useOntologyStore.getState().masterDataRecords;
    expect(records['md-def-1']).toHaveLength(1);
    expect(records['md-def-1'][0].values['客户编码']).toBe('C-001');
  });

  it('should update a record field and updatedAt timestamp', () => {
    const store = useOntologyStore.getState();
    store.setMasterDataList([{ id: 'md-def-1', domain: '生产管理', name: '客户主数据', nameEn: 'Customer', code: 'MD-CUST', description: '', coreData: '', fieldNames: '', sourceSystem: 'SAP', status: '00', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }]);
    store.addMasterDataRecord('md-def-1', makeRecord('rec-1', { 客户编码: 'C-001', 客户名称: '华中客户' }));

    store.updateMasterDataRecord('md-def-1', 'rec-1', { values: { 客户编码: 'C-001', 客户名称: '华中重点客户' } });

    const records = useOntologyStore.getState().masterDataRecords;
    expect(records['md-def-1'][0].values['客户名称']).toBe('华中重点客户');
    expect(records['md-def-1'][0].updatedAt).not.toBe('2026-06-26T00:00:00.000Z');
  });

  it('should toggle status from 00 to 99 and back', () => {
    const store = useOntologyStore.getState();
    store.setMasterDataList([{ id: 'md-def-1', domain: '生产管理', name: '客户主数据', nameEn: 'Customer', code: 'MD-CUST', description: '', coreData: '', fieldNames: '', sourceSystem: 'SAP', status: '00', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }]);
    store.addMasterDataRecord('md-def-1', makeRecord('rec-1', { 客户编码: 'C-001', 客户名称: '华中客户' }));

    // Initially '00' (active)
    expect(useOntologyStore.getState().masterDataRecords['md-def-1'][0].status).toBe('00');

    // Toggle to '99' (inactive)
    store.toggleMasterDataRecordStatus('md-def-1', 'rec-1');
    expect(useOntologyStore.getState().masterDataRecords['md-def-1'][0].status).toBe('99');

    // Toggle back to '00'
    store.toggleMasterDataRecordStatus('md-def-1', 'rec-1');
    expect(useOntologyStore.getState().masterDataRecords['md-def-1'][0].status).toBe('00');
  });

  it('should delete a record and remove from map', () => {
    const store = useOntologyStore.getState();
    store.setMasterDataList([{ id: 'md-def-1', domain: '生产管理', name: '客户主数据', nameEn: 'Customer', code: 'MD-CUST', description: '', coreData: '', fieldNames: '', sourceSystem: 'SAP', status: '00', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }]);
    store.addMasterDataRecord('md-def-1', makeRecord('rec-1', { 客户编码: 'C-001' }));

    store.deleteMasterDataRecord('md-def-1', 'rec-1');

    const records = useOntologyStore.getState().masterDataRecords;
    expect(records['md-def-1']).toHaveLength(0);
  });
});

// ============================================================
// HR Sync Tests
// ============================================================
describe('HR Sync', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should update HR sync config on project.organizationModel', () => {
    const store = useOntologyStore.getState();
    const config: HRSyncConfig = {
      enabled: true,
      source: 'dingtalk',
      syncInterval: 'daily',
      fieldMapping: {
        department: { name: 'dept_name', code: 'dept_code' },
        position: { name: 'pos_name', code: 'pos_code' },
      },
      conflictStrategy: 'hr_wins',
      syncScope: { syncDepartments: true, syncPositions: true, syncResponsibilities: false, includeInactive: false },
    };

    store.updateHRSyncConfig(config);

    const project = useOntologyStore.getState().project!;
    expect(project.organizationModel).toBeDefined();
    expect(project.organizationModel!.syncConfig).toBeDefined();
    expect(project.organizationModel!.syncConfig!.enabled).toBe(true);
    expect(project.organizationModel!.syncConfig!.source).toBe('dingtalk');
    expect(project.organizationModel!.syncConfig!.syncInterval).toBe('daily');
    expect(project.organizationModel!.syncConfig!.conflictStrategy).toBe('hr_wins');
  });

  it('should set last sync result on organizationModel', () => {
    const store = useOntologyStore.getState();
    // Ensure organizationModel exists first by setting sync config
    const config: HRSyncConfig = {
      enabled: true,
      source: 'feishu',
      syncInterval: 'manual',
      fieldMapping: { department: {}, position: {} },
      conflictStrategy: 'local_wins',
      syncScope: { syncDepartments: true, syncPositions: true, syncResponsibilities: false, includeInactive: false },
    };
    store.updateHRSyncConfig(config);

    const result: HRSyncResult = {
      syncId: 'sync-001',
      triggeredAt: '2026-06-26T08:00:00.000Z',
      completedAt: '2026-06-26T08:05:00.000Z',
      status: 'success',
      source: 'feishu',
      summary: {
        departments: { total: 10, created: 2, updated: 3, deactivated: 1, unchanged: 4 },
        positions: { total: 20, created: 5, updated: 5, deactivated: 0, unchanged: 10 },
      },
    };
    store.setLastSyncResult(result);

    const project = useOntologyStore.getState().project!;
    expect(project.organizationModel!.lastSyncResult).toBeDefined();
    expect(project.organizationModel!.lastSyncResult!.syncId).toBe('sync-001');
    expect(project.organizationModel!.lastSyncResult!.status).toBe('success');
    expect(project.organizationModel!.lastSyncResult!.summary.departments.created).toBe(2);
    expect(project.organizationModel!.lastSyncResult!.summary.positions.created).toBe(5);
  });

  it('should update config then result in sequence preserving both', () => {
    const store = useOntologyStore.getState();
    store.updateHRSyncConfig({
      enabled: true,
      source: 'sap',
      syncInterval: 'weekly',
      fieldMapping: { department: {}, position: {} },
      conflictStrategy: 'manual',
      syncScope: { syncDepartments: true, syncPositions: true, syncResponsibilities: false, includeInactive: false },
    });
    store.setLastSyncResult({
      syncId: 'sync-002',
      triggeredAt: '2026-06-26T10:00:00.000Z',
      status: 'partial',
      source: 'sap',
      summary: { departments: { total: 5, created: 1, updated: 1, deactivated: 0, unchanged: 3 }, positions: { total: 8, created: 2, updated: 2, deactivated: 1, unchanged: 3 } },
      conflicts: [{ type: 'department', externalId: 'ext-1', localId: 'dept-1', field: 'name', hrValue: '采购部', localValue: '采购管理部' }],
    });

    const project = useOntologyStore.getState().project!;
    expect(project.organizationModel!.syncConfig!.source).toBe('sap');
    expect(project.organizationModel!.lastSyncResult!.status).toBe('partial');
    expect(project.organizationModel!.lastSyncResult!.conflicts).toHaveLength(1);
  });

  it('should handle setLastSyncResult gracefully when no project exists', () => {
    resetStore(); // project = null
    const store = useOntologyStore.getState();
    // Should not throw
    expect(() => {
      store.setLastSyncResult({
        syncId: 'sync-003',
        triggeredAt: new Date().toISOString(),
        status: 'success',
        source: 'custom_api',
        summary: { departments: { total: 0, created: 0, updated: 0, deactivated: 0, unchanged: 0 }, positions: { total: 0, created: 0, updated: 0, deactivated: 0, unchanged: 0 } },
      });
    }).not.toThrow();
  });
});

// ============================================================
// AI Drafts Tests
// ============================================================
describe('AI Drafts', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.getState().createProject('AI Drafts Test', { id: 'dm-1', name: '离散制造', nameEn: 'Discrete Manufacturing', description: '离散制造领域' });
  });

  // ---------- applyAiEpcDraft ----------

  it('should apply AI EPC draft steps and update epcProcesses', () => {
    const store = useOntologyStore.getState();
    // Set up business chain: valueDomain -> capability -> scenario -> epcProcess
    const a = store.addValueDomain({ name: '生产域' });
    const b = store.addCapability(a.id, { name: '生产管理' });
    const c = store.addScenario(b.id, { name: '生产场景' });
    const epc = store.addEpcProcess(c.id, { name: '测试 EPC' });

    const aiSteps: EpcStep[] = [
      { id: 'step-1', name: '接收订单' },
      { id: 'step-2', name: '审核订单' },
    ];

    store.applyAiEpcDraft(epc.id, aiSteps);

    const project = useOntologyStore.getState().project!;
    const updatedEpc = project.epcProcesses!.find((e) => e.id === epc.id);
    expect(updatedEpc).toBeDefined();
    expect(updatedEpc!.steps).toHaveLength(2);
    expect(updatedEpc!.steps[0].name).toBe('接收订单');
    expect(updatedEpc!.steps[1].name).toBe('审核订单');
  });

  it('should create a draft version record when no prior versions exist', () => {
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: '测试域' });
    const b = store.addCapability(a.id, { name: '测试能力' });
    const c = store.addScenario(b.id, { name: '测试场景' });
    const epc = store.addEpcProcess(c.id, { name: '测试 EPC' });

    store.applyAiEpcDraft(epc.id, [{ id: 's-1', name: '新步骤' }]);

    const project = useOntologyStore.getState().project!;
    const draftRecord = (project.moduleVersionRecords ?? []).find(
      (r) => r.moduleKind === 'EPC' && r.moduleId === epc.id && r.status === 'draft',
    );
    expect(draftRecord).toBeDefined();
  });

  it('should throw error when EPC does not exist', () => {
    const store = useOntologyStore.getState();
    expect(() => {
      store.applyAiEpcDraft('non-existent-epc', []);
    }).toThrow();
  });

  // ---------- applyAiElementDrafts ----------

  it('should insert new elements into metaElements', () => {
    const store = useOntologyStore.getState();

    const result = store.applyAiElementDrafts([
      { name: '用户管理', dimension: 'E1' },
      { name: '订单审核', dimension: 'E2' },
    ]);

    expect(result.inserted).toBe(2);
    expect(result.skipped).toEqual([]);

    const project = useOntologyStore.getState().project!;
    const metaElements = project.metaElements ?? [];
    expect(metaElements).toHaveLength(2);
    expect(metaElements[0].name).toBe('用户管理');
    expect(metaElements[0].dimension).toBe('E1');
  });

  it('should skip existing elements (dimension + name match)', () => {
    const store = useOntologyStore.getState();
    // First insert
    store.applyAiElementDrafts([{ name: '用户管理', dimension: 'E1' }]);

    // Second insert with mix of new and duplicate
    const result = store.applyAiElementDrafts([
      { name: '用户管理', dimension: 'E1' },  // duplicate
      { name: '新要素', dimension: 'E3' },     // new
    ]);

    expect(result.inserted).toBe(1);
    expect(result.skipped).toEqual([{ name: '用户管理', dimension: 'E1' }]);

    const project = useOntologyStore.getState().project!;
    expect(project.metaElements ?? []).toHaveLength(2);
  });

  it('should handle empty input gracefully', () => {
    const store = useOntologyStore.getState();

    const result = store.applyAiElementDrafts([]);

    expect(result.inserted).toBe(0);
    expect(result.skipped).toEqual([]);

    const project = useOntologyStore.getState().project!;
    expect(project.metaElements ?? []).toHaveLength(0);
  });

  it('should throw error when no active project', () => {
    resetStore();
    const store = useOntologyStore.getState();
    expect(() => {
      store.applyAiElementDrafts([{ name: '测试', dimension: 'E1' }]);
    }).toThrow();
  });
});

// ============================================================
// Governance Model — Roles, Field Permissions & Agent Policies
// ============================================================
describe('Governance Model CRUD', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  // ---------- Governance Roles ----------

  it('should add a governance role and auto-create governance model', () => {
    const store = useOntologyStore.getState();
    const role: GovernanceRole = {
      id: 'role-1',
      name: '采购员',
      permissions: [
        { objectTypeId: 'entity-1', ops: ['READ', 'WRITE'] },
      ],
    };
    store.addGovernanceRole(role);

    const project = useOntologyStore.getState().project!;
    expect(project.governanceModel).toBeDefined();
    expect(project.governanceModel!.roles).toHaveLength(1);
    expect(project.governanceModel!.roles[0].name).toBe('采购员');
    expect(project.governanceModel!.roles[0].permissions[0].ops).toContain('READ');
  });

  it('should add multiple governance roles', () => {
    const store = useOntologyStore.getState();
    store.addGovernanceRole({ id: 'role-1', name: '采购员', permissions: [] });
    store.addGovernanceRole({ id: 'role-2', name: '审批员', permissions: [] });

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.roles).toHaveLength(2);
    expect(model.roles[1].name).toBe('审批员');
  });

  it('should update a governance role by id', () => {
    const store = useOntologyStore.getState();
    store.addGovernanceRole({ id: 'role-1', name: '采购员', permissions: [] });

    const updated: GovernanceRole = {
      id: 'role-1',
      name: '高级采购员',
      permissions: [
        { objectTypeId: 'entity-1', ops: ['READ', 'WRITE', 'EXECUTE'] },
      ],
    };
    store.updateGovernanceRole('role-1', updated);

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.roles).toHaveLength(1);
    expect(model.roles[0].name).toBe('高级采购员');
    expect(model.roles[0].permissions[0].ops).toContain('EXECUTE');
  });

  it('should delete a governance role and cascade to fieldPermissions and agentPolicies', () => {
    const store = useOntologyStore.getState();
    store.addGovernanceRole({ id: 'role-1', name: '采购员', permissions: [] });
    store.addGovernanceRole({ id: 'role-2', name: '审批员', permissions: [] });

    // Add a field permission referencing role-1 and an agent policy referencing role-1
    store.addFieldPermission({
      objectTypeId: 'entity-1',
      propertyNameEn: 'amount',
      allowedRoleIds: ['role-1', 'role-2'],
    });
    store.addAgentPolicy({
      id: 'policy-1',
      roleId: 'role-1',
      allowedActionIds: ['action-1'],
    });

    store.deleteGovernanceRole('role-1');

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.roles).toHaveLength(1);
    expect(model.roles[0].id).toBe('role-2');

    // role-1 removed from fieldPermission.allowedRoleIds
    expect(model.fieldPermissions[0].allowedRoleIds).toEqual(['role-2']);

    // agent policy with roleId === role-1 should be removed
    expect(model.agentPolicies).toHaveLength(0);
  });

  it('should handle updateGovernanceRole when model does not exist (no-op)', () => {
    const store = useOntologyStore.getState();
    expect(() => {
      store.updateGovernanceRole('non-existent', { id: 'r', name: 'x', permissions: [] });
    }).not.toThrow();
  });

  it('should handle deleteGovernanceRole when model does not exist (no-op)', () => {
    const store = useOntologyStore.getState();
    expect(() => {
      store.deleteGovernanceRole('non-existent');
    }).not.toThrow();
  });

  // ---------- Field Permissions ----------

  it('should add a field permission and auto-create governance model', () => {
    const store = useOntologyStore.getState();
    store.addFieldPermission({
      objectTypeId: 'entity-1',
      propertyNameEn: 'amount',
      allowedRoleIds: ['role-1'],
    });

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.fieldPermissions).toHaveLength(1);
    expect(model.fieldPermissions[0].propertyNameEn).toBe('amount');
    expect(model.fieldPermissions[0].allowedRoleIds).toContain('role-1');
  });

  it('should add multiple field permissions', () => {
    const store = useOntologyStore.getState();
    store.addFieldPermission({ objectTypeId: 'entity-1', propertyNameEn: 'amount', allowedRoleIds: [] });
    store.addFieldPermission({ objectTypeId: 'entity-1', propertyNameEn: 'quantity', allowedRoleIds: [] });

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.fieldPermissions).toHaveLength(2);
  });

  it('should update a field permission by index', () => {
    const store = useOntologyStore.getState();
    store.addFieldPermission({ objectTypeId: 'entity-1', propertyNameEn: 'amount', allowedRoleIds: ['role-1'] });

    store.updateFieldPermission(0, {
      objectTypeId: 'entity-1',
      propertyNameEn: 'amount',
      allowedRoleIds: ['role-1', 'role-2'],
    });

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.fieldPermissions[0].allowedRoleIds).toHaveLength(2);
    expect(model.fieldPermissions[0].allowedRoleIds).toContain('role-2');
  });

  it('should delete a field permission by index', () => {
    const store = useOntologyStore.getState();
    store.addFieldPermission({ objectTypeId: 'entity-1', propertyNameEn: 'amount', allowedRoleIds: [] });
    store.addFieldPermission({ objectTypeId: 'entity-1', propertyNameEn: 'quantity', allowedRoleIds: [] });

    store.deleteFieldPermission(0);

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.fieldPermissions).toHaveLength(1);
    expect(model.fieldPermissions[0].propertyNameEn).toBe('quantity');
  });

  it('should handle deleteFieldPermission with out-of-bounds index (no-op)', () => {
    const store = useOntologyStore.getState();
    store.addFieldPermission({ objectTypeId: 'entity-1', propertyNameEn: 'amount', allowedRoleIds: [] });

    expect(() => {
      store.deleteFieldPermission(99);
    }).not.toThrow();
  });

  // ---------- Agent Policies ----------

  it('should add an agent policy and auto-create governance model', () => {
    const store = useOntologyStore.getState();
    store.addAgentPolicy({
      id: 'policy-1',
      roleId: 'role-1',
      allowedMcpTools: ['tool-a', 'tool-b'],
      allowedAggregateRootIds: ['agg-1'],
    });

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.agentPolicies).toHaveLength(1);
    expect(model.agentPolicies[0].roleId).toBe('role-1');
    expect(model.agentPolicies[0].allowedMcpTools).toContain('tool-a');
  });

  it('should add multiple agent policies', () => {
    const store = useOntologyStore.getState();
    store.addAgentPolicy({ id: 'policy-1', roleId: 'role-1' });
    store.addAgentPolicy({ id: 'policy-2', roleId: 'role-2' });

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.agentPolicies).toHaveLength(2);
  });

  it('should update an agent policy by id', () => {
    const store = useOntologyStore.getState();
    store.addAgentPolicy({ id: 'policy-1', roleId: 'role-1', allowedActionIds: ['action-1'] });

    store.updateAgentPolicy('policy-1', {
      id: 'policy-1',
      roleId: 'role-1',
      allowedActionIds: ['action-1', 'action-2'],
      defaultDeny: true,
    });

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.agentPolicies[0].allowedActionIds).toHaveLength(2);
    expect(model.agentPolicies[0].defaultDeny).toBe(true);
  });

  it('should delete an agent policy by id', () => {
    const store = useOntologyStore.getState();
    store.addAgentPolicy({ id: 'policy-1', roleId: 'role-1' });
    store.addAgentPolicy({ id: 'policy-2', roleId: 'role-2' });

    store.deleteAgentPolicy('policy-1');

    const model = useOntologyStore.getState().project!.governanceModel!;
    expect(model.agentPolicies).toHaveLength(1);
    expect(model.agentPolicies[0].id).toBe('policy-2');
  });

  it('should handle deleteAgentPolicy when model does not exist (no-op)', () => {
    const store = useOntologyStore.getState();
    expect(() => {
      store.deleteAgentPolicy('non-existent');
    }).not.toThrow();
  });
});

// ============================================================
// Data Sources Model CRUD
// ============================================================
describe('Data Sources Model CRUD', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should add a data source and auto-create dataSourcesModel', () => {
    const store = useOntologyStore.getState();
    const source: DataSourceDefinition = {
      id: 'ds-1',
      name: 'SAP ERP 系统',
      type: 'api',
      api: { baseUrl: 'https://sap.example.com/api', entitySet: 'Materials', authSecretRef: 'sec-sap' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.addDataSource(source);

    const model = useOntologyStore.getState().project!.dataSourcesModel!;
    expect(model).toBeDefined();
    expect(model.sources).toHaveLength(1);
    expect(model.sources[0].name).toBe('SAP ERP 系统');
    expect(model.sources[0].type).toBe('api');
    expect(model.sources[0].api!.baseUrl).toBe('https://sap.example.com/api');
  });

  it('should add multiple data sources', () => {
    const store = useOntologyStore.getState();
    const now = new Date().toISOString();
    store.addDataSource({ id: 'ds-1', name: 'SAP', type: 'api', createdAt: now, updatedAt: now });
    store.addDataSource({ id: 'ds-2', name: 'MySQL', type: 'database', createdAt: now, updatedAt: now });

    const model = useOntologyStore.getState().project!.dataSourcesModel!;
    expect(model.sources).toHaveLength(2);
    expect(model.sources[1].name).toBe('MySQL');
  });

  it('should update a data source by sourceId', () => {
    const store = useOntologyStore.getState();
    const now = new Date().toISOString();
    store.addDataSource({ id: 'ds-1', name: 'SAP ERP', type: 'api', createdAt: now, updatedAt: now });

    const updated: DataSourceDefinition = {
      id: 'ds-1',
      name: 'SAP ERP (更新)',
      type: 'api',
      boundObjectTypeId: 'entity-1',
      api: { baseUrl: 'https://sap-new.example.com', entitySet: 'Materials', authSecretRef: 'sec-sap' },
      createdAt: now,
      updatedAt: new Date().toISOString(),
    };
    store.updateDataSource('ds-1', updated);

    const model = useOntologyStore.getState().project!.dataSourcesModel!;
    expect(model.sources).toHaveLength(1);
    expect(model.sources[0].name).toBe('SAP ERP (更新)');
    expect(model.sources[0].boundObjectTypeId).toBe('entity-1');
    expect(model.sources[0].api!.baseUrl).toBe('https://sap-new.example.com');
  });

  it('should delete a data source by sourceId', () => {
    const store = useOntologyStore.getState();
    const now = new Date().toISOString();
    store.addDataSource({ id: 'ds-1', name: 'SAP', type: 'api', createdAt: now, updatedAt: now });
    store.addDataSource({ id: 'ds-2', name: 'MySQL', type: 'database', createdAt: now, updatedAt: now });

    store.deleteDataSource('ds-1');

    const model = useOntologyStore.getState().project!.dataSourcesModel!;
    expect(model.sources).toHaveLength(1);
    expect(model.sources[0].id).toBe('ds-2');
  });

  it('should handle deleteDataSource when model does not exist (no-op)', () => {
    const store = useOntologyStore.getState();
    expect(() => {
      store.deleteDataSource('non-existent');
    }).not.toThrow();
  });

  it('should handle updateDataSource when model does not exist (no-op)', () => {
    const store = useOntologyStore.getState();
    const now = new Date().toISOString();
    expect(() => {
      store.updateDataSource('ds-1', { id: 'ds-1', name: 'x', type: 'file', createdAt: now, updatedAt: now });
    }).not.toThrow();
  });
});
