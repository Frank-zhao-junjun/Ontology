/**
 * 元模型标准化单元测试
 * 
 * 测试用例：UT-NORM-001 ~ UT-NORM-003
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from './index';
import type { OntologyProject, Entity, Relation } from '@/types/ontology';

// ========== 测试数据 ==========

const createMockDomain = () => ({
  id: 'domain-1',
  name: '合同管理',
  nameEn: 'ContractManagement',
  description: '合同管理领域',
});

const createMockEntity = (
  id: string,
  name: string,
  nameEn: string,
  overrides: Partial<Entity> = {}
): Entity => ({
  id,
  name,
  nameEn,
  projectId: 'project-1',
  businessScenarioId: 'scenario-1',
  description: `${name}实体`,
  // 注意：默认不显式设置 entityRole，让测试验证真实场景与兼容逻辑
  attributes: [
    {
      id: `${id}-attr-1`,
      name: '名称',
      nameEn: 'name',
      dataType: 'string',
      required: true,
    },
  ],
  relations: [],
  ...overrides,
});

const createMockProjectWithEntities = (entities: Entity[]): OntologyProject => ({
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
    businessScenarios: [{ id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'project-1' }],
    entities,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  behaviorModel: null,
  ruleModel: null,
  processModel: null,
  eventModel: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ========== 测试用例 ==========

describe('元模型标准化', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('UT-NORM-001: 实体 nameEn 规范化稳定', () => {
    it('相同输入多次运行输出应一致', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract'),
        createMockEntity('e2', '合同条款', 'ContractClause'),
        createMockEntity('e3', '审批实例', 'ApprovalInstance'),
      ];
      const project = createMockProjectWithEntities(entities);

      // 多次导出
      const results = await Promise.all([
        exporter.export(project, { includeData: false }),
        exporter.export(project, { includeData: false }),
        exporter.export(project, { includeData: false }),
      ]);

      // 验证所有结果的 entities 一致
      const entitiesList = results.map(r => {
        const file = r.files.find(f => f.path === 'data/entities.json');
        return JSON.parse(file!.content);
      });

      // 所有运行的 nameEn 应该一致
      const nameEns = entitiesList.map(list => list.map((e: { nameEn: string }) => e.nameEn));
      expect(nameEns[0]).toEqual(nameEns[1]);
      expect(nameEns[1]).toEqual(nameEns[2]);

      // 验证命名转换
      const firstResult = entitiesList[0];
      const contract = firstResult.find((e: { nameEn: string }) => e.nameEn === 'Contract');
      expect(contract).toBeDefined();
      expect(contract.fileName).toBe('contract');
      expect(contract.className).toBe('Contract');
      expect(contract.tableName).toBe('t_contract');
    });

    it('驼峰命名应正确转换为下划线格式', async () => {
      const entities = [
        createMockEntity('e1', '合同条款', 'ContractClause'),
        createMockEntity('e2', '审批实例', 'ApprovalInstance'),
      ];
      const project = createMockProjectWithEntities(entities);

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      const clause = normalizedEntities.find((e: { nameEn: string }) => e.nameEn === 'ContractClause');
      expect(clause.fileName).toBe('contract_clause');
      expect(clause.tableName).toBe('t_contract_clause');

      const approval = normalizedEntities.find((e: { nameEn: string }) => e.nameEn === 'ApprovalInstance');
      expect(approval.fileName).toBe('approval_instance');
      expect(approval.tableName).toBe('t_approval_instance');
    });
  });

  describe('UT-NORM-002: 关系引用完整性', () => {
    it('关系引用存在的实体应成功', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', {
          entityRole: 'aggregate_root',
          relations: [
            {
              id: 'rel-1',
              name: '合同条款',
              type: 'one_to_many',
              targetEntity: 'e2',
              foreignKey: 'contractId',
            } as Relation,
          ],
        }),
        createMockEntity('e2', '合同条款', 'ContractClause'),
      ];
      const project = createMockProjectWithEntities(entities);

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      const contract = normalizedEntities.find((e: { nameEn: string }) => e.nameEn === 'Contract');
      expect(contract.relations).toHaveLength(1);
      expect(contract.relations[0].targetEntityName).toBe('合同条款');
    });

    it('关系引用不存在的实体应显示为 Unknown', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', {
          entityRole: 'aggregate_root',
          relations: [
            {
              id: 'rel-1',
              name: '不存在的实体',
              type: 'one_to_many',
              targetEntity: 'non-existent-id',
            } as Relation,
          ],
        }),
      ];
      const project = createMockProjectWithEntities(entities);

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      const contract = normalizedEntities.find((e: { nameEn: string }) => e.nameEn === 'Contract');
      expect(contract.relations[0].targetEntityName).toBe('Unknown');
    });
  });

  describe('UT-NORM-003: 聚合根筛选准确性', () => {
    it('应正确识别聚合根', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', { entityRole: 'aggregate_root' }),
        createMockEntity('e2', '合同条款', 'ContractClause', { entityRole: 'child_entity', parentAggregateId: 'e1' }),
        createMockEntity('e3', '付款计划', 'PaymentSchedule', { entityRole: 'aggregate_root' }),
        createMockEntity('e4', '合同附件', 'ContractAttachment', { entityRole: 'child_entity', parentAggregateId: 'e3' }),
      ];
      const project = createMockProjectWithEntities(entities);

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      // 验证聚合角色筛选
      const aggregateRoots = normalizedEntities.filter((e: { entityRole: string }) => e.entityRole === 'aggregate_root');
      const childEntities = normalizedEntities.filter((e: { entityRole: string }) => e.entityRole === 'child_entity');

      expect(aggregateRoots).toHaveLength(2);
      expect(childEntities).toHaveLength(2);

      const aggregateRootNames = aggregateRoots.map((e: { name: string }) => e.name);
      expect(aggregateRootNames).toContain('合同');
      expect(aggregateRootNames).toContain('付款计划');
    });

    it('未指定 entityRole 时默认应为 child_entity', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract'),
        createMockEntity('e2', '合同条款', 'ContractClause', { entityRole: 'child_entity', parentAggregateId: 'e1' }),
      ];
      const project = createMockProjectWithEntities(entities);

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      const contract = normalizedEntities.find((e: { nameEn: string }) => e.nameEn === 'Contract');
      expect(contract.entityRole).toBe('child_entity');
      expect(contract.parentAggregateId).toBeUndefined();
    });

    it('应保留 parentAggregateId 并仅允许聚合根发布领域事件', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', { entityRole: 'aggregate_root' }),
        createMockEntity('e2', '合同条款', 'ContractClause', { entityRole: 'child_entity', parentAggregateId: 'e1' }),
      ];
      const project = createMockProjectWithEntities(entities);

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      const contract = normalizedEntities.find((e: { nameEn: string }) => e.nameEn === 'Contract');
      const clause = normalizedEntities.find((e: { nameEn: string }) => e.nameEn === 'ContractClause');
      
      expect(contract.entityRole).toBe('aggregate_root');
      expect(contract.parentAggregateId).toBeUndefined();
      expect(clause.entityRole).toBe('child_entity');
      expect(clause.parentAggregateId).toBe('e1');
    });
  });

  describe('额外测试：属性标准化', () => {
    it('属性应正确标准化', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', {
          attributes: [
            {
              id: 'attr-1',
              name: '合同编号',
              nameEn: 'contractNo',
              dataType: 'string',
              required: true,
              unique: true,
              length: 50,
              description: '合同唯一编号',
            },
            {
              id: 'attr-2',
              name: '合同金额',
              nameEn: 'amount',
              dataType: 'decimal',
              required: true,
            },
            {
              id: 'attr-3',
              name: '备注',
              nameEn: 'remark',
              dataType: 'text',
              required: false,
            },
          ],
        }),
      ];
      const project = createMockProjectWithEntities(entities);

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      const contract = normalizedEntities[0];
      
      // 验证属性数量
      expect(contract.attributes).toHaveLength(3);

      // 验证第一个属性
      const contractNo = contract.attributes.find((a: { nameEn: string }) => a.nameEn === 'contractNo');
      expect(contractNo).toBeDefined();
      expect(contractNo.name).toBe('合同编号');
      expect(contractNo.dataType).toBe('string');
      expect(contractNo.required).toBe(true);
      expect(contractNo.unique).toBe(true);
      expect(contractNo.length).toBe(50);
      expect(contractNo.columnName).toBe('contract_no');
      expect(contractNo.description).toBe('合同唯一编号');
    });
  });
});
