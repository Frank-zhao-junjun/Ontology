/**
 * API 导出产物测试
 * 
 * 测试用例：
 * - IT-API-EXPORT-002: 导出包结构完整
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { createFrozenProject } from '../unit/test-helpers';

describe('API Export Artifact', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
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

      const jsonFiles = result.files.filter(
        f => f.path.endsWith('.json') && f.path !== 'README.md'
      );

      for (const file of jsonFiles) {
        expect(() => JSON.parse(file.content)).not.toThrow();
      }
    });

    it('每个文件应有非空内容', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      for (const file of result.files) {
        expect(file.content.length).toBeGreaterThan(0);
      }
    });

    it('README.md 应包含项目信息', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      const readme = result.files.find(f => f.path === 'README.md');
      expect(readme).toBeDefined();
      expect(readme!.content).toContain(project.name);
      expect(readme!.content).toContain(project.domain.name);
    });
  });
});
