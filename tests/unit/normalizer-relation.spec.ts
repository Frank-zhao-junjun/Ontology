/**
 * 元模型标准化 - 关系测试
 * 
 * 测试用例：
 * - UT-NORM-002: 关系引用完整性
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { createMockEntity, createMockDomain } from './test-helpers';

describe('Normalizer Relation', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('UT-NORM-002: 关系引用完整性', () => {
    it('关系引用存在的实体应成功', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', {
          isAggregateRoot: true,
          relations: [
            {
              id: 'rel-1',
              name: '合同条款',
              type: 'one_to_many' as const,
              targetEntity: 'e2',
              foreignKey: 'contractId',
            },
          ],
        }),
        createMockEntity('e2', '合同条款', 'ContractClause'),
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
      expect(contract.relations).toHaveLength(1);
      expect(contract.relations[0].targetEntityName).toBe('合同条款');
    });

    it('关系引用不存在的实体应显示为 Unknown', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', {
          isAggregateRoot: true,
          relations: [
            {
              id: 'rel-1',
              name: '不存在的实体',
              type: 'one_to_many' as const,
              targetEntity: 'non-existent-id',
            },
          ],
        }),
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
      expect(contract.relations[0].targetEntityName).toBe('Unknown');
    });

    it('多对多关系应正确处理', async () => {
      const entities = [
        createMockEntity('e1', '合同', 'Contract', {
          isAggregateRoot: true,
          relations: [
            {
              id: 'rel-1',
              name: '附件',
              type: 'many_to_many' as const,
              targetEntity: 'e3',
              viaEntity: 'contract_attachment',
            },
          ],
        }),
        createMockEntity('e3', '合同附件', 'ContractAttachment'),
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
      expect(contract.relations[0].type).toBe('many_to_many');
      expect(contract.relations[0].targetEntityName).toBe('合同附件');
    });
  });
});
