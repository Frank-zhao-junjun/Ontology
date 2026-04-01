/**
 * 导出 Seed 数据切换测试
 * 
 * 测试用例：
 * - UT-EXPORT-003: includeData=false 不生成 seed
 * - UT-EXPORT-004: includeData=true 生成 seed
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter, type ExportConfig } from '@/lib/configexporter';
import { createFrozenProject } from './test-helpers';

describe('Export Seed Toggle', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('UT-EXPORT-003: includeData=false 不生成 seed', () => {
    it('当 includeData 为 false 时不应包含 seed_data.json', async () => {
      const project = createFrozenProject('1.0.0');
      const config: ExportConfig = { includeData: false };
      
      const result = await exporter.export(project, config);
      
      const seedFile = result.files.find(f => f.path === 'data/seed_data.json');
      expect(seedFile).toBeUndefined();
    });

    it('其他必需文件仍应存在', async () => {
      const project = createFrozenProject('1.0.0');
      const config: ExportConfig = { includeData: false };
      
      const result = await exporter.export(project, config);
      const filePaths = result.files.map(f => f.path);
      
      expect(filePaths).toContain('config.json');
      expect(filePaths).toContain('manifest.json');
      expect(filePaths).toContain('data/entities.json');
    });
  });

  describe('UT-EXPORT-004: includeData=true 生成 seed', () => {
    it('当 includeData 为 true 时应包含 seed_data.json', async () => {
      const project = createFrozenProject('1.0.0');
      const config: ExportConfig = { includeData: true };
      
      const result = await exporter.export(project, config);
      
      const seedFile = result.files.find(f => f.path === 'data/seed_data.json');
      expect(seedFile).toBeDefined();
    });

    it('seed_data.json 应包含实体示例数据', async () => {
      const project = createFrozenProject('1.0.0');
      const config: ExportConfig = { includeData: true };
      
      const result = await exporter.export(project, config);
      const seedFile = result.files.find(f => f.path === 'data/seed_data.json');
      
      const seedData = JSON.parse(seedFile!.content);
      expect(seedData).toHaveProperty('Contract');
      expect(Array.isArray(seedData.Contract)).toBe(true);
      expect(seedData.Contract.length).toBeGreaterThan(0);
    });

    it('示例数据应包含所有实体', async () => {
      const project = createFrozenProject('1.0.0');
      const config: ExportConfig = { includeData: true };
      
      const result = await exporter.export(project, config);
      const seedFile = result.files.find(f => f.path === 'data/seed_data.json');
      
      const seedData = JSON.parse(seedFile!.content);
      
      // 验证包含 Contract 和 ContractClause
      expect(seedData).toHaveProperty('Contract');
      expect(seedData).toHaveProperty('ContractClause');
    });
  });
});
