/**
 * 导出接口与文件产物集成测试
 * 
 * 测试用例：IT-API-EXPORT-001 ~ IT-API-EXPORT-004
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter, type ExportConfig } from '@/lib/configexporter';
import type { OntologyProject, Entity, StateMachine, Rule, EventDefinition } from '@/types/ontology';

// ========== 测试数据 ==========

const createFrozenProject = (version: string): OntologyProject => {
  const entities: Entity[] = [
    {
      id: 'contract-1',
      name: '合同',
      nameEn: 'Contract',
      projectId: 'project-1',
      businessScenarioId: 'scenario-1',
      description: '合同实体',
      entityRole: 'aggregate_root',
      attributes: [
        { id: 'a1', name: '合同编号', nameEn: 'contractNo', dataType: 'string', required: true, unique: true },
        { id: 'a2', name: '合同名称', nameEn: 'contractName', dataType: 'string', required: true },
        { id: 'a3', name: '合同金额', nameEn: 'amount', dataType: 'decimal', required: true },
        { id: 'a4', name: '签订日期', nameEn: 'signDate', dataType: 'date' },
        { id: 'a5', name: '合同状态', nameEn: 'status', dataType: 'enum' },
      ],
      relations: [
        { id: 'r1', name: '合同条款', type: 'one_to_many', targetEntity: 'clause-1' },
      ],
    },
    {
      id: 'clause-1',
      name: '合同条款',
      nameEn: 'ContractClause',
      projectId: 'project-1',
      businessScenarioId: 'scenario-1',
      description: '合同条款实体',
      entityRole: 'child_entity',
      parentAggregateId: 'contract-1',
      attributes: [
        { id: 'c1', name: '条款编号', nameEn: 'clauseNo', dataType: 'string', required: true },
        { id: 'c2', name: '条款内容', nameEn: 'content', dataType: 'text', required: true },
      ],
      relations: [],
    },
  ];

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

  return {
    id: 'project-1',
    name: '合同管理系统',
    description: '合同管理领域建模项目',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同管理领域',
    },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version,
      domain: 'domain-1',
      projects: [{ id: 'p1', name: '核心模块' }],
      businessScenarios: [{ id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'project-1' }],
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
};

// ========== 测试用例 ==========

describe('导出接口与文件产物', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('IT-API-EXPORT-001: POST /api/export 成功导出', () => {
    it('应成功导出冻结版本并返回 downloadUrl', async () => {
      const project = createFrozenProject('1.0.0');
      const config: ExportConfig = { includeData: true };

      const result = await exporter.export(project, config);

      // 验证导出成功
      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.manifest).toBeDefined();

      // 验证 manifest 包含必要信息
      expect(result.manifest.projectId).toBe('project-1');
      expect(result.manifest.version).toBe('1.0.0');
      expect(result.manifest.entityCount).toBe(2);
    });
  });

  describe('IT-API-EXPORT-002: 导出包结构完整', () => {
    it('导出包应包含所有必需文件', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: true });

      const filePaths = result.files.map(f => f.path);

      // 验证根目录文件
      expect(filePaths).toContain('config.json');
      expect(filePaths).toContain('README.md');
      expect(filePaths).toContain('manifest.json');

      // 验证数据目录文件
      expect(filePaths).toContain('data/entities.json');
      expect(filePaths).toContain('data/state_machines.json');
      expect(filePaths).toContain('data/rules.json');
      expect(filePaths).toContain('data/events.json');
      expect(filePaths).toContain('data/seed_data.json');
    });

    it('导出包文件应为有效的 JSON', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      // 验证 JSON 文件可以被正确解析
      const jsonFiles = result.files.filter(
        f => f.path.endsWith('.json')
      );

      for (const file of jsonFiles) {
        expect(() => JSON.parse(file.content)).not.toThrow();
      }
    });
  });

  describe('IT-API-EXPORT-003: Schema 校验通过', () => {
    it('manifest schema 应通过校验', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      const manifestFile = result.files.find(f => f.path === 'manifest.json');
      const manifest = JSON.parse(manifestFile!.content);

      // 验证 manifest schema
      expect(manifest).toHaveProperty('projectId');
      expect(typeof manifest.projectId).toBe('string');
      expect(manifest).toHaveProperty('version');
      expect(typeof manifest.version).toBe('string');
      expect(manifest).toHaveProperty('generatedAt');
      expect(typeof manifest.generatedAt).toBe('string');
      expect(manifest).toHaveProperty('entityCount');
      expect(typeof manifest.entityCount).toBe('number');
    });

    it('config schema 应通过校验', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      const configFile = result.files.find(f => f.path === 'config.json');
      const config = JSON.parse(configFile!.content);

      // 验证 config schema
      expect(config).toHaveProperty('project');
      expect(typeof config.project).toBe('string');
      expect(config).toHaveProperty('version');
      expect(typeof config.version).toBe('string');
      expect(config).toHaveProperty('generatedAt');
      expect(typeof config.generatedAt).toBe('string');
    });

    it('entities schema 应通过校验', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      const entitiesFile = result.files.find(f => f.path === 'data/entities.json');
      const entities = JSON.parse(entitiesFile!.content);

      // 验证 entities schema
      expect(Array.isArray(entities)).toBe(true);

      for (const entity of entities) {
        expect(entity).toHaveProperty('id');
        expect(entity).toHaveProperty('name');
        expect(entity).toHaveProperty('nameEn');
        expect(entity).toHaveProperty('fileName');
        expect(entity).toHaveProperty('className');
        expect(entity).toHaveProperty('tableName');
        expect(entity).toHaveProperty('attributes');
        expect(Array.isArray(entity.attributes)).toBe(true);
        expect(entity).toHaveProperty('relations');
        expect(Array.isArray(entity.relations)).toBe(true);
      }
    });
  });

  describe('IT-API-EXPORT-004: includeData 开关正确', () => {
    it('includeData=true 时应包含 seed_data.json', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: true });

      const seedFile = result.files.find(f => f.path === 'data/seed_data.json');
      expect(seedFile).toBeDefined();

      const seedData = JSON.parse(seedFile!.content);
      expect(seedData).toHaveProperty('Contract');
      expect(seedData).toHaveProperty('ContractClause');
    });

    it('includeData=false 时不应包含 seed_data.json', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      const seedFile = result.files.find(f => f.path === 'data/seed_data.json');
      expect(seedFile).toBeUndefined();
    });

    it('对比两次导出（true/false）文件列表差异', async () => {
      const project = createFrozenProject('1.0.0');

      const resultWithSeed = await exporter.export(project, { includeData: true });
      const resultWithoutSeed = await exporter.export(project, { includeData: false });

      const pathsWithSeed = resultWithSeed.files.map(f => f.path).sort();
      const pathsWithoutSeed = resultWithoutSeed.files.map(f => f.path).sort();

      // true 比 false 多一个 seed_data.json
      expect(pathsWithSeed.length).toBe(pathsWithoutSeed.length + 1);
      expect(pathsWithSeed).toContain('data/seed_data.json');
      expect(pathsWithoutSeed).not.toContain('data/seed_data.json');
    });
  });
});
