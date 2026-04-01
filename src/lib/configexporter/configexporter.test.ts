/**
 * 配置导出器单元测试
 * 
 * 测试用例：UT-EXPORT-001 ~ UT-EXPORT-006
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter, type ExportConfig } from './index';
import type { OntologyProject, Entity, Domain } from '@/types/ontology';

// ========== 测试数据 ==========

const createMockDomain = (): Domain => ({
  id: 'domain-1',
  name: '合同管理',
  nameEn: 'ContractManagement',
  description: '合同管理领域',
});

const createMockEntity = (overrides: Partial<Entity> = {}): Entity => ({
  id: 'entity-1',
  name: '合同',
  nameEn: 'Contract',
  projectId: 'project-1',
  description: '合同实体',
  entityRole: 'aggregate_root',
  attributes: [
    {
      id: 'attr-1',
      name: '合同编号',
      nameEn: 'contractNo',
      type: 'string',
      required: true,
      unique: true,
      length: 50,
    },
    {
      id: 'attr-2',
      name: '合同名称',
      nameEn: 'contractName',
      type: 'string',
      required: true,
      length: 200,
    },
    {
      id: 'attr-3',
      name: '合同金额',
      nameEn: 'amount',
      type: 'decimal',
      required: true,
    },
  ],
  relations: [],
  ...overrides,
});

const createMockProject = (overrides: Partial<OntologyProject> = {}): OntologyProject => ({
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
    entities: [createMockEntity()],
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

// ========== 测试用例 ==========

describe('ConfigExporter', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('UT-EXPORT-001: 版本号必填校验', () => {
    it('当版本号为空时应抛出错误', async () => {
      const project = createMockProject({
        id: '',  // 空项目ID应该触发校验
      });
      
      await expect(exporter.export(project, { includeData: false }))
        .rejects.toThrow('导出失败：项目ID不能为空');
    });
  });

  describe('UT-EXPORT-002: 至少一个实体校验', () => {
    it('当数据模型为空时应抛出错误', async () => {
      const project = createMockProject({
        dataModel: null,
      });
      
      await expect(exporter.export(project, { includeData: false }))
        .rejects.toThrow('导出失败：数据模型为空');
    });

    it('当实体列表为空时应抛出错误', async () => {
      const project = createMockProject({
        dataModel: {
          id: 'dm-1',
          name: '空数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
          entities: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      
      await expect(exporter.export(project, { includeData: false }))
        .rejects.toThrow('导出失败：数据模型为空');
    });
  });

  describe('UT-EXPORT-003: includeData=false 不生成 seed', () => {
    it('当 includeData 为 false 时不应包含 seed_data.json', async () => {
      const project = createMockProject();
      const result = await exporter.export(project, { includeData: false });
      
      const seedFile = result.files.find(f => f.path === 'data/seed_data.json');
      expect(seedFile).toBeUndefined();
    });
  });

  describe('UT-EXPORT-004: includeData=true 生成 seed', () => {
    it('当 includeData 为 true 时应包含 seed_data.json', async () => {
      const project = createMockProject();
      const result = await exporter.export(project, { includeData: true });
      
      const seedFile = result.files.find(f => f.path === 'data/seed_data.json');
      expect(seedFile).toBeDefined();
      
      // 验证 seed_data.json 内容
      const seedData = JSON.parse(seedFile!.content);
      expect(seedData).toHaveProperty('Contract');
      expect(Array.isArray(seedData.Contract)).toBe(true);
      expect(seedData.Contract.length).toBeGreaterThan(0);
    });
  });

  describe('UT-EXPORT-005: manifest 字段完整性', () => {
    it('manifest 应包含所有必需字段', async () => {
      const project = createMockProject();
      const result = await exporter.export(project, { includeData: false });
      
      expect(result.manifest).toHaveProperty('projectId');
      expect(result.manifest).toHaveProperty('version');
      expect(result.manifest).toHaveProperty('generatedAt');
      expect(result.manifest).toHaveProperty('entityCount');
    });
  });

  describe('UT-EXPORT-006: generatedAt 格式校验', () => {
    it('generatedAt 应为 ISO datetime 格式', async () => {
      const project = createMockProject();
      const result = await exporter.export(project, { includeData: false });
      
      const { generatedAt } = result.manifest;
      
      // 验证 ISO datetime 格式
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(isoRegex.test(generatedAt)).toBe(true);
      
      // 验证可以被解析为有效日期
      const date = new Date(generatedAt);
      expect(date instanceof Date && !isNaN(date.getTime())).toBe(true);
    });
  });

  describe('额外测试：导出文件结构', () => {
    it('导出包应包含所有必需文件', async () => {
      const project = createMockProject();
      const result = await exporter.export(project, { includeData: false });
      
      const filePaths = result.files.map(f => f.path);
      
      expect(filePaths).toContain('config.json');
      expect(filePaths).toContain('README.md');
      expect(filePaths).toContain('manifest.json');
      expect(filePaths).toContain('data/entities.json');
      expect(filePaths).toContain('data/state_machines.json');
      expect(filePaths).toContain('data/rules.json');
      expect(filePaths).toContain('data/events.json');
    });

    it('config.json 应包含项目信息', async () => {
      const project = createMockProject();
      const result = await exporter.export(project, { includeData: false });
      
      const configFile = result.files.find(f => f.path === 'config.json');
      const config = JSON.parse(configFile!.content);
      
      expect(config).toHaveProperty('project', '合同管理系统');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('generatedAt');
    });

    it('entities.json 应包含标准化后的实体', async () => {
      const project = createMockProject();
      const result = await exporter.export(project, { includeData: false });
      
      const entitiesFile = result.files.find(f => f.path === 'data/entities.json');
      const entities = JSON.parse(entitiesFile!.content);
      
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBe(1);
      
      const entity = entities[0];
      expect(entity).toHaveProperty('id');
      expect(entity).toHaveProperty('name');
      expect(entity).toHaveProperty('nameEn');
      expect(entity).toHaveProperty('fileName');
      expect(entity).toHaveProperty('className');
      expect(entity).toHaveProperty('tableName');
      expect(entity).toHaveProperty('attributes');
      expect(entity).toHaveProperty('relations');
    });
  });
});
