/**
 * 单元测试辅助函数
 * 
 * 提供测试数据和工厂函数
 */

import type { OntologyProject, Entity, Domain, StateMachine, Rule, EventDefinition } from '@/types/ontology';
import { createEmptyEpcModel, ensureEpcProfile, regenerateEpcProfile } from '@/lib/epc-generator';

export const createMockDomain = (): Domain => ({
  id: 'domain-1',
  name: '合同管理',
  nameEn: 'ContractManagement',
  description: '合同管理领域',
});

export const createMockEntity = (
  id: string,
  name: string,
  nameEn: string,
  overrides: Partial<Entity> = {}
): Entity => ({
  id,
  name,
  nameEn,
  projectId: 'project-1',
  description: `${name}实体`,
  attributes: [
    {
      id: `${id}-attr-1`,
      name: '名称',
      nameEn: 'name',
      type: 'string',
      required: true,
    },
  ],
  relations: [],
  ...overrides,
});

export const createMockProject = (overrides: Partial<OntologyProject> = {}): OntologyProject => ({
  id: 'project-1',
  name: '合同管理系统',
  description: '合同管理领域建模项目',
  domain: createMockDomain(),
  dataModel: {
    id: 'dm-1',
    name: '合同数据模型',
    version: '1.0.0',
    domain: 'domain-1',
    projects: [],
    businessScenarios: [],
    entities: [createMockEntity('entity-1', '合同', 'Contract')],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  behaviorModel: null,
  ruleModel: null,
  processModel: null,
  eventModel: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createContractEntity = (overrides: Partial<Entity> = {}): Entity =>
  createMockEntity('contract-1', '合同', 'Contract', {
    isAggregateRoot: true,
    attributes: [
      { id: 'a1', name: '合同编号', nameEn: 'contractNo', type: 'string', required: true, unique: true },
      { id: 'a2', name: '合同名称', nameEn: 'contractName', type: 'string', required: true },
      { id: 'a3', name: '合同金额', nameEn: 'amount', type: 'decimal', required: true },
      { id: 'a4', name: '签订日期', nameEn: 'signDate', type: 'date' },
      { id: 'a5', name: '合同状态', nameEn: 'status', type: 'enum' },
    ],
    ...overrides,
  });

export const createContractClauseEntity = (): Entity =>
  createMockEntity('clause-1', '合同条款', 'ContractClause', {
    isAggregateRoot: false,
    attributes: [
      { id: 'c1', name: '条款编号', nameEn: 'clauseNo', type: 'string', required: true },
      { id: 'c2', name: '条款内容', nameEn: 'content', type: 'text', required: true },
    ],
  });

export const createFrozenProject = (version: string): OntologyProject => {
  // 每次调用生成唯一的 project ID 和不同的 createdAt，确保测试隔离
  const projectId = `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entities = [createContractEntity(), createContractClauseEntity()];

  const stateMachines: StateMachine[] = [
    {
      id: 'sm-1',
      name: '合同状态机',
      entity: 'contract-1',
      statusField: 'status',
      states: [
        { id: 's1', name: '草稿', isInitial: true },
        { id: 's2', name: '审批中' },
        { id: 's3', name: '已生效', isFinal: true },
      ],
      transitions: [
        { id: 't1', name: '提交审批', from: 's1', to: 's2', trigger: 'manual' },
        { id: 't2', name: '审批通过', from: 's2', to: 's3', trigger: 'manual' },
      ],
    },
  ];

  const rules: Rule[] = [
    {
      id: 'rule-1',
      name: '合同金额必须大于0',
      type: 'field_validation',
      entity: 'contract-1',
      field: 'amount',
      condition: { type: 'range', min: 0, exclusiveMin: true },
      errorMessage: '合同金额必须大于0',
      severity: 'error',
    },
  ];

  const events: EventDefinition[] = [
    {
      id: 'event-1',
      name: '合同创建事件',
      nameEn: 'ContractCreated',
      entity: 'contract-1',
      trigger: 'create',
      payload: [{ field: 'contractNo' }, { field: 'contractName' }],
    },
  ];

  const baseProject: OntologyProject = {
    id: projectId,
    name: '合同管理系统',
    description: '合同管理领域建模项目',
    domain: createMockDomain(),
    dataModel: {
      id: `dm-${Date.now()}`,
      name: '合同数据模型',
      version,
      domain: 'domain-1',
      projects: [{ id: 'p1', name: '核心模块' }],
      businessScenarios: [{ id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: projectId }],
      entities,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    behaviorModel: {
      id: 'bm-1',
      name: '合同行为模型',
      version,
      domain: 'domain-1',
      stateMachines,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    ruleModel: {
      id: 'rm-1',
      name: '合同规则模型',
      version,
      domain: 'domain-1',
      rules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    processModel: null,
    eventModel: {
      id: 'em-1',
      name: '合同事件模型',
      version,
      domain: 'domain-1',
      events,
      subscriptions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const epcProfile = regenerateEpcProfile(baseProject, {
    ...ensureEpcProfile(baseProject, 'contract-1'),
    businessBackground: '合同从起草到审批生效的业务活动说明。',
    organizationalUnits: [
      {
        id: 'org-1',
        name: '合同专员',
        type: 'role',
        responsibilities: '发起与跟踪合同审批',
        permissions: '创建合同并提交审批',
      },
    ],
    systems: [
      {
        id: 'system-1',
        name: '合同平台',
        type: 'platform',
        description: '承载合同审批与签署流程',
      },
    ],
  });

  return {
    ...baseProject,
    epcModel: {
      ...createEmptyEpcModel(),
      version,
      profiles: [epcProfile],
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};
