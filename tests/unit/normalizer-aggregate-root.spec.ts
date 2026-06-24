/**
 * 元模型标准化 - 聚合根测试
 * 
 * 测试用例：
 * - UT-NORM-003: 聚合根筛选准确性
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { createMockEntity, createMockDomain } from './test-helpers';

describe('Normalizer Aggregate Root', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('UT-NORM-003: 聚合根筛选准确性', () => {
    it('应正确识别聚合根', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', { isAggregateRoot: true }),
        createMockEntity('e2', '合同条款', 'ContractClause', { isAggregateRoot: false }),
        createMockEntity('e3', '付款计划', 'PaymentSchedule', { isAggregateRoot: true }),
        createMockEntity('e4', '合同附件', 'ContractAttachment', { isAggregateRoot: false }),
      ];
      
      const project = {
        id: 'project-1',
        name: '测试项目',
        domain: createMockDomain(),
        dataModel: {
          id: 'dm-1',
          name: '数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
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
      };

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      // 验证聚合根筛选
      const aggregateRoots = normalizedEntities.filter((e: { isAggregateRoot: boolean }) => e.isAggregateRoot);
      const nonAggregateRoots = normalizedEntities.filter((e: { isAggregateRoot: boolean }) => !e.isAggregateRoot);

      expect(aggregateRoots).toHaveLength(2);
      expect(nonAggregateRoots).toHaveLength(2);

      const aggregateRootNames = aggregateRoots.map((e: { name: string }) => e.name);
      expect(aggregateRootNames).toContain('合同');
      expect(aggregateRootNames).toContain('付款计划');
    });

    it('未指定 isAggregateRoot 时默认应为 false（非聚合根）', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract'), // 未指定，默认为 false
        createMockEntity('e2', '合同条款', 'ContractClause', { isAggregateRoot: false }),
      ];
      
      const project = {
        id: 'project-1',
        name: '测试项目',
        domain: createMockDomain(),
        dataModel: {
          id: 'dm-1',
          name: '数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
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
      };

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      const contract = normalizedEntities.find((e: { nameEn: string }) => e.nameEn === 'Contract');
      expect(contract.isAggregateRoot).toBe(false);
    });

    it('所有实体都非聚合根时结果应正确', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', { isAggregateRoot: false }),
        createMockEntity('e2', '合同条款', 'ContractClause', { isAggregateRoot: false }),
      ];
      
      const project = {
        id: 'project-1',
        name: '测试项目',
        domain: createMockDomain(),
        dataModel: {
          id: 'dm-1',
          name: '数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
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
      };

      const result = await exporter.export(project, { includeData: false });
      const file = result.files.find(f => f.path === 'data/entities.json');
      const normalizedEntities = JSON.parse(file!.content);

      const aggregateRoots = normalizedEntities.filter((e: { isAggregateRoot: boolean }) => e.isAggregateRoot);
      expect(aggregateRoots).toHaveLength(0);
    });
  });
});
