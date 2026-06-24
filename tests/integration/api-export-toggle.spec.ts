/**
 * API 导出 Toggle 测试
 * 
 * 测试用例：
 * - IT-API-EXPORT-004: includeData 开关正确
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { createFrozenProject } from '../unit/test-helpers';

describe('API Export Toggle', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
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

    it('其他文件不应受 includeData 影响', async () => {
      const project = createFrozenProject('1.0.0');

      const resultWithSeed = await exporter.export(project, { includeData: true });
      const resultWithoutSeed = await exporter.export(project, { includeData: false });

      // manifest.json 和 config.json 有 generatedAt 时间戳，排除比较
      const corePaths = [
        'data/entities.json',
        'data/state_machines.json',
        'data/rules.json',
        'data/events.json',
      ];

      for (const path of corePaths) {
        const withSeed = resultWithSeed.files.find(f => f.path === path);
        const withoutSeed = resultWithoutSeed.files.find(f => f.path === path);
        
        expect(withSeed).toBeDefined();
        expect(withoutSeed).toBeDefined();
        expect(withSeed!.content).toBe(withoutSeed!.content);
      }

      // 比较 manifest 关键字段（排除 generatedAt）
      expect(resultWithSeed.manifest.projectId).toBe(resultWithoutSeed.manifest.projectId);
      expect(resultWithSeed.manifest.version).toBe(resultWithoutSeed.manifest.version);
      expect(resultWithSeed.manifest.entityCount).toBe(resultWithoutSeed.manifest.entityCount);
    });
  });
});
