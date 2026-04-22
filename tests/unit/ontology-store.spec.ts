import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Entity, EventDefinition, MasterData, MasterDataRecord, OntologyProject, Rule, Subscription } from '@/types/ontology';
import { createFrozenProject, createMockProject } from './test-helpers';

function resetStore() {
  useOntologyStore.setState({
    project: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: null,
  });
}

function createProjectForEpcSync(): OntologyProject {
  return {
    id: 'proj-1',
    name: '合同管理本体',
    description: '测试项目',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同领域',
    },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [{ id: 'module-1', name: '合同中心', nameEn: 'ContractCenter' }],
      businessScenarios: [{
        id: 'scenario-1',
        name: '合同签订',
        nameEn: 'ContractSign',
        description: '合同审批与签署流程说明',
        projectId: 'proj-1',
      }],
      entities: [
        {
          id: 'contract-1',
          name: '合同',
          nameEn: 'Contract',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'aggregate_root',
          attributes: [
            { id: 'a1', name: '合同编号', nameEn: 'contractNo', dataType: 'string', required: true },
            { id: 'a2', name: '客户主体', nameEn: 'customerSubject', dataType: 'reference', referenceKind: 'masterData', isMasterDataRef: true, masterDataType: '客户主数据' },
          ],
          relations: [],
        },
        {
          id: 'line-1',
          name: '合同明细',
          nameEn: 'ContractLine',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'child_entity',
          parentAggregateId: 'contract-1',
          attributes: [{ id: 'l1', name: '金额', nameEn: 'amount', dataType: 'decimal' }],
          relations: [],
        },
      ],
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    },
    behaviorModel: {
      id: 'bm-1',
      name: '合同状态机',
      version: '1.0.0',
      domain: 'domain-1',
      stateMachines: [{
        id: 'sm-1',
        name: '合同生命周期',
        entity: 'contract-1',
        statusField: 'status',
        states: [
          { id: 'draft', name: '草稿', isInitial: true },
          { id: 'approved', name: '已审批', isFinal: true },
        ],
        transitions: [{ id: 't-1', name: '提交审批', from: 'draft', to: 'approved', trigger: 'manual' }],
      }],
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    },
    ruleModel: {
      id: 'rm-1',
      name: '合同规则',
      version: '1.0.0',
      domain: 'domain-1',
      rules: [{
        id: 'rule-1',
        name: '合同编号必填',
        type: 'field_validation',
        entity: 'contract-1',
        field: 'contractNo',
        condition: { type: 'regex', pattern: '.+' },
        errorMessage: '合同编号不能为空',
        severity: 'error',
      }],
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    },
    processModel: null,
    eventModel: {
      id: 'em-1',
      name: '合同事件',
      version: '1.0.0',
      domain: 'domain-1',
      events: [{ id: 'event-1', name: '合同已创建', nameEn: 'ContractCreated', entity: 'contract-1', trigger: 'create', payload: [{ field: 'id' }] }],
      subscriptions: [],
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    },
    epcModel: null,
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
  };
}

describe('Ontology Store State Transitions', () => {
  beforeEach(() => {
    resetStore();
  });

  it('importProject 应将旧字段归一化到新契约', () => {
    const legacyProject = {
      id: 'project-legacy',
      name: '遗留项目',
      description: '旧格式导入',
      domain: {
        id: 'domain-1',
        name: '合同管理',
        nameEn: 'ContractManagement',
        description: '合同领域',
      },
      dataModel: {
        id: 'dm-1',
        name: '数据模型',
        version: '1.0.0',
        domain: 'domain-1',
        projects: [{ id: 'module-1', name: '合同中心', nameEn: 'ContractCenter' }],
        businessScenarios: [{ id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'project-legacy' }],
        entities: [{
          id: 'entity-1',
          name: '合同',
          nameEn: 'Contract',
          projectId: 'module-1',
          scenarioId: 'scenario-1',
          isAggregateRoot: true,
          attributes: [{
            id: 'attr-1',
            name: '客户主体',
            nameEn: 'customerSubject',
            type: 'reference',
            referenceTargetType: 'masterdata',
            masterDataId: 'md-customer',
            metadataId: 'meta-1',
            metadataName: '客户模板',
          }],
          relations: [],
        }],
        createdAt: '2026-04-02T00:00:00.000Z',
        updatedAt: '2026-04-02T00:00:00.000Z',
      },
      behaviorModel: null,
      ruleModel: null,
      processModel: null,
      eventModel: null,
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    };

    useOntologyStore.getState().importProject(JSON.stringify(legacyProject));

    const state = useOntologyStore.getState();
    const entity = state.project?.dataModel?.entities[0];
    const attribute = entity?.attributes[0];

    expect(state.activeModelType).toBe('data');
    expect(entity?.businessScenarioId).toBe('scenario-1');
    expect(attribute?.dataType).toBe('reference');
    expect(attribute?.referenceKind).toBe('masterData');
    expect(attribute?.isMasterDataRef).toBe(true);
    expect(attribute?.masterDataType).toBe('md-customer');
    expect(attribute?.metadataTemplateId).toBe('meta-1');
    expect(attribute?.metadataTemplateName).toBe('客户模板');
  });

  it('updateEntity 应保留原有 businessScenarioId，不允许跨场景移动', () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project, versions: [], activeModelType: 'data' });

    const store = useOntologyStore.getState();
    const originalEntity = store.project?.dataModel?.entities.find((entity) => entity.id === 'contract-1') as Entity;

    store.updateEntity('contract-1', {
      ...originalEntity,
      name: '合同主单',
      businessScenarioId: 'scenario-2',
    });

    const updatedEntity = useOntologyStore.getState().project?.dataModel?.entities.find((entity) => entity.id === 'contract-1');
    expect(updatedEntity?.name).toBe('合同主单');
    expect(updatedEntity?.businessScenarioId).toBe('scenario-1');
  });

  it('createVersion 与 publishVersion 应保存快照并标记发布时间', () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project, versions: [], activeModelType: 'data' });

    const store = useOntologyStore.getState();
    const version = store.createVersion({ version: '1.0.0', name: '初始版本', description: '首个冻结版' });

    store.updateEntity('contract-1', {
      ...(useOntologyStore.getState().project?.dataModel?.entities.find((entity) => entity.id === 'contract-1') as Entity),
      name: '合同主单',
    });
    store.publishVersion(version.id);

    const savedVersion = useOntologyStore.getState().versions.find((item) => item.id === version.id);
    expect(savedVersion?.status).toBe('published');
    expect(savedVersion?.publishedAt).toBeDefined();
    expect(savedVersion?.metamodels.data?.entities.find((entity) => entity.id === 'contract-1')?.name).toBe('合同');
    expect(useOntologyStore.getState().project?.dataModel?.entities.find((entity) => entity.id === 'contract-1')?.name).toBe('合同主单');
    expect(savedVersion?.metamodels.epc?.profiles.length).toBeGreaterThan(0);
  });

  it('ensureEpcProfile 与 regenerateEpcDocument 应同步 EPC 派生信息', () => {
    const project = createProjectForEpcSync();
    useOntologyStore.setState({ project, versions: [], activeModelType: 'data' });

    const store = useOntologyStore.getState();
    const initialProfile = store.ensureEpcProfile('contract-1');

    expect(initialProfile.businessBackground).toBe('合同审批与签署流程说明');
    expect(useOntologyStore.getState().project?.epcModel?.profiles).toHaveLength(1);
    expect(initialProfile.informationObjects.some((item) => item.sourceType === 'masterdata' && item.sourceRefId === '客户主数据')).toBe(true);

    const nextProject = createProjectForEpcSync();
    nextProject.dataModel!.entities[0].name = '合同主单';
    nextProject.dataModel!.businessScenarios[0].description = '合同主单审批流程说明';
    nextProject.epcModel = useOntologyStore.getState().project?.epcModel || null;
    useOntologyStore.setState({ project: nextProject });

    useOntologyStore.getState().regenerateEpcDocument('contract-1');

    const regenerated = useOntologyStore.getState().project?.epcModel?.profiles.find((item) => item.aggregateId === 'contract-1');
    expect(regenerated?.status).toBe('generated');
    expect(regenerated?.businessName).toBe('合同主单');
    expect(regenerated?.businessBackground).toBe('合同主单审批流程说明');
    expect(regenerated?.generatedDocument).toContain('合同主单审批流程说明');
  });

  it('主数据定义与记录 CRUD 应保持列表和记录映射一致', () => {
    useOntologyStore.setState({ project: createMockProject(), versions: [], activeModelType: 'data' });
    const store = useOntologyStore.getState();

    const masterData: MasterData = {
      id: 'md-1',
      domain: '合同管理',
      name: '客户主数据',
      nameEn: 'CustomerMaster',
      code: 'CUSTOMER',
      description: '客户信息',
      coreData: '是',
      fieldNames: '客户编码,客户名称',
      sourceSystem: 'MDM',
      status: '00',
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    };
    const record: MasterDataRecord = {
      id: 'record-1',
      definitionId: 'md-1',
      values: { 客户编码: 'C-001', 客户名称: '华中客户' },
      status: '00',
      createdAt: '2026-04-02T00:00:00.000Z',
      updatedAt: '2026-04-02T00:00:00.000Z',
    };

    store.addMasterData(masterData);
    store.addMasterDataRecord('md-1', record);
    store.updateMasterData('md-1', { ...masterData, name: '重点客户主数据' });
    store.updateMasterDataRecord('md-1', 'record-1', { values: { 客户编码: 'C-001', 客户名称: '华中重点客户' } });
    store.toggleMasterDataRecordStatus('md-1', 'record-1');

    let state = useOntologyStore.getState();
    expect(state.masterDataList[0].name).toBe('重点客户主数据');
    expect(state.masterDataRecords['md-1'][0].values['客户名称']).toBe('华中重点客户');
    expect(state.masterDataRecords['md-1'][0].status).toBe('99');

    store.deleteMasterDataRecord('md-1', 'record-1');
    state = useOntologyStore.getState();
    expect(state.masterDataRecords['md-1']).toEqual([]);

    store.deleteMasterData('md-1');
    state = useOntologyStore.getState();
    expect(state.masterDataList).toEqual([]);
    expect(state.masterDataRecords['md-1']).toBeUndefined();
  });

  it('规则与事件相关 action 应支持自动建模和完整增删改', () => {
    const project = createMockProject({ ruleModel: null, eventModel: null });
    if (project.dataModel?.entities[0]) {
      project.dataModel.entities[0] = {
        ...project.dataModel.entities[0],
        entityRole: 'aggregate_root',
      };
    }

    useOntologyStore.setState({
      project,
      versions: [],
      activeModelType: 'data',
    });
    const store = useOntologyStore.getState();

    const rule: Rule = {
      id: 'rule-1',
      name: '合同编号唯一',
      type: 'field_validation',
      entity: 'entity-1',
      field: 'name',
      condition: { type: 'regex', pattern: '.+' },
      errorMessage: '合同编号不能为空',
      severity: 'error',
    };
    const event: EventDefinition = {
      id: 'event-1',
      name: '合同已创建',
      nameEn: 'ContractCreated',
      entity: 'entity-1',
      trigger: 'create',
      payload: [{ field: 'id' }],
    };
    const subscription: Subscription = {
      id: 'sub-1',
      name: '同步合同索引',
      eventId: 'event-1',
      handler: 'async',
      action: 'webhook',
      actionRef: 'https://example.com/webhook',
      retryPolicy: {
        maxRetries: 3,
        backoff: 'fixed',
        interval: 10,
      },
      handlerId: 'contract-indexer',
    };

    store.addRule(rule);
    store.addEventDefinition(event);
    store.addSubscription(subscription);

    let state = useOntologyStore.getState();
    expect(state.project?.ruleModel?.rules).toHaveLength(1);
    expect(state.project?.ruleModel?.name).toBe('合同管理规则模型');
    expect(state.project?.eventModel?.events).toHaveLength(1);
    expect(state.project?.eventModel?.subscriptions).toHaveLength(1);

    store.updateRule('rule-1', { ...rule, name: '合同编号必填' });
    store.updateEventDefinition('event-1', { ...event, name: '合同已创建' });
    store.updateSubscription('sub-1', { ...subscription, handler: 'sync' });

    state = useOntologyStore.getState();
    expect(state.project?.ruleModel?.rules[0].name).toBe('合同编号必填');
    expect(state.project?.eventModel?.events[0].name).toBe('合同已创建');
    expect(state.project?.eventModel?.subscriptions[0].handler).toBe('sync');

    store.deleteSubscription('sub-1');
    store.deleteEventDefinition('event-1');
    store.deleteRule('rule-1');

    state = useOntologyStore.getState();
    expect(state.project?.eventModel?.subscriptions).toEqual([]);
    expect(state.project?.eventModel?.events).toEqual([]);
    expect(state.project?.ruleModel?.rules).toEqual([]);
  });

  it('删除类 action 应遵守关联约束并仅移除允许删除的对象', () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project, versions: [], activeModelType: 'data' });
    const store = useOntologyStore.getState();

    expect(useOntologyStore.getState().project?.dataModel?.entities).toHaveLength(2);
    expect(useOntologyStore.getState().project?.dataModel?.projects).toHaveLength(1);
    expect(useOntologyStore.getState().project?.dataModel?.businessScenarios).toHaveLength(1);

    store.deleteEntity('clause-1');
    store.deleteEntityProject('p1');
    store.deleteBusinessScenario('scenario-1');

    const state = useOntologyStore.getState();
    expect(state.project?.dataModel?.entities.map((entity) => entity.id)).toEqual(['contract-1']);
    expect(state.project?.dataModel?.projects).toEqual([]);
    expect(state.project?.dataModel?.businessScenarios.map((scenario) => scenario.id)).toEqual(['scenario-1']);
  });

  it('clearAllModels 应保留项目与分类并清空建模数据', () => {
    const project = createFrozenProject('1.0.0');
    useOntologyStore.setState({ project, versions: [], activeModelType: 'event' });

    useOntologyStore.getState().clearAllModels();

    const state = useOntologyStore.getState();
    expect(state.project?.name).toBe(project.name);
    expect(state.project?.dataModel?.projects).toEqual(project.dataModel?.projects || []);
    expect(state.project?.dataModel?.businessScenarios).toEqual(project.dataModel?.businessScenarios || []);
    expect(state.project?.dataModel?.entities).toEqual([]);
    expect(state.project?.behaviorModel).toBeNull();
    expect(state.project?.ruleModel).toBeNull();
    expect(state.project?.processModel).toBeNull();
    expect(state.project?.eventModel).toBeNull();
    expect(state.project?.epcModel).toBeNull();
    expect(state.activeModelType).toBeNull();
  });
});