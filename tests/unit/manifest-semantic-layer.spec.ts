/**
 * S09/S10 语义层 Golden Compiler 测试
 *
 * 验证 compileSemantic 的输出形状：
 * - UT-MANIFEST-SEMANTIC-01: value_objects 从 entityRole=value_object 的实体提取
 * - UT-MANIFEST-SEMANTIC-02: value_objects 不再出现在 objectTypes 中
 * - UT-MANIFEST-SEMANTIC-03: enum_defs 从 DataModel.enumDefs 编译
 * - UT-MANIFEST-SEMANTIC-04: enum_def values 正确映射 code→id, label→name
 */

import { describe, it, expect } from 'vitest';
import { compileSemantic } from '@/lib/manifest-compiler/semantic';
import type { OntologyProject } from '@/types/ontology';

function createProject(overrides: Partial<OntologyProject> = {}): OntologyProject {
  return {
    id: 'project-1',
    name: '测试项目',
    description: '测试',
    domain: {
      id: 'domain-1',
      name: '测试域',
      nameEn: 'TestDomain',
      description: '测试域描述',
    },
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [],
      businessScenarios: [],
      entities: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const metadata = {
  id: 'manifest-1',
  version: '1.0.0',
  name: '测试',
  boundedContext: 'test',
};

describe('S09/S10 Semantic Layer Compiler', () => {
  describe('UT-MANIFEST-SEMANTIC-01: Value objects extracted from entities', () => {
    it('should extract entities with entityRole=value_object into valueObjects', () => {
      const project = createProject({
        dataModel: {
          id: 'dm-1',
          name: '数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
          entities: [
            {
              id: 'entity-ar',
              name: '订单',
              nameEn: 'Order',
              projectId: 'p1',
              businessScenarioId: 's1',
              entityRole: 'aggregate_root',
              attributes: [
                { id: 'a1', name: '订单号', nameEn: 'orderNo', dataType: 'string', required: true },
              ],
              relations: [],
            },
            {
              id: 'entity-vo',
              name: '金额',
              nameEn: 'Money',
              projectId: 'p1',
              businessScenarioId: 's1',
              entityRole: 'value_object',
              attributes: [
                { id: 'a2', name: '币种', nameEn: 'currency', dataType: 'string', required: true },
                { id: 'a3', name: '数额', nameEn: 'amount', dataType: 'decimal', required: true },
              ],
              relations: [],
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      });

      const result = compileSemantic(project, metadata);
      expect(result.valueObjects).toHaveLength(1);
      expect(result.valueObjects![0].id).toBe('entity-vo');
      expect(result.valueObjects![0].name).toBe('金额');
      expect(result.valueObjects![0].nameEn).toBe('Money');
      expect(result.valueObjects![0].properties).toHaveLength(2);
    });
  });

  describe('UT-MANIFEST-SEMANTIC-02: Value objects excluded from objectTypes', () => {
    it('should not include value_object entities in objectTypes', () => {
      const project = createProject({
        dataModel: {
          id: 'dm-1',
          name: '数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
          entities: [
            {
              id: 'entity-ar',
              name: '订单',
              nameEn: 'Order',
              projectId: 'p1',
              businessScenarioId: 's1',
              entityRole: 'aggregate_root',
              attributes: [],
              relations: [],
            },
            {
              id: 'entity-vo',
              name: '金额',
              nameEn: 'Money',
              projectId: 'p1',
              businessScenarioId: 's1',
              entityRole: 'value_object',
              attributes: [],
              relations: [],
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      });

      const result = compileSemantic(project, metadata);
      expect(result.objectTypes).toHaveLength(1);
      expect(result.objectTypes![0].id).toBe('entity-ar');
    });
  });

  describe('UT-MANIFEST-SEMANTIC-03: Enum defs compiled from DataModel', () => {
    it('should compile enumDefs into semantic output', () => {
      const project = createProject({
        dataModel: {
          id: 'dm-1',
          name: '数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
          entities: [],
          enumDefs: [
            {
              id: 'enum-status',
              name: '合同状态',
              nameEn: 'ContractStatus',
              combinationPolicy: 'single',
              values: [
                { code: 'DRAFT', label: '草稿', labelEn: 'Draft', isDefault: true },
                { code: 'ACTIVE', label: '生效', labelEn: 'Active' },
              ],
              description: '合同生命周期状态',
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      });

      const result = compileSemantic(project, metadata);
      expect(result.enumDefs).toHaveLength(1);

      const ed = result.enumDefs![0];
      expect(ed.id).toBe('enum-status');
      expect(ed.name).toBe('合同状态');
      expect(ed.nameEn).toBe('ContractStatus');
      expect(ed.combinationPolicy).toBe('single');
      expect(ed.description).toBe('合同生命周期状态');
    });
  });

  describe('UT-MANIFEST-SEMANTIC-04: Enum values mapped correctly', () => {
    it('should map code→id, label→name, labelEn→nameEn', () => {
      const project = createProject({
        dataModel: {
          id: 'dm-1',
          name: '数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
          entities: [],
          enumDefs: [
            {
              id: 'enum-priority',
              name: '优先级',
              nameEn: 'Priority',
              combinationPolicy: 'multi',
              values: [
                { code: 'HIGH', label: '高', labelEn: 'High', description: '高优先级' },
                { code: 'LOW', label: '低', labelEn: 'Low' },
              ],
            },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      });

      const result = compileSemantic(project, metadata);
      const values = result.enumDefs![0].values;

      expect(values).toHaveLength(2);
      expect(values[0].id).toBe('HIGH');
      expect(values[0].name).toBe('高');
      expect(values[0].nameEn).toBe('High');
      expect(values[0].description).toBe('高优先级');

      expect(values[1].id).toBe('LOW');
      expect(values[1].name).toBe('低');
      expect(values[1].nameEn).toBe('Low');
    });
  });
});
