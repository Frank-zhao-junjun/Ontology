/**
 * 导出验证测试
 * 
 * 测试用例：
 * - UT-EXPORT-001: 版本号必填校验
 * - UT-EXPORT-002: 至少一个实体校验
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { createMockProject } from './test-helpers';

describe('Export Validation', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('UT-EXPORT-001: 版本号必填校验', () => {
    it('当项目ID为空时应抛出错误', async () => {
      const project = createMockProject({ id: '' });
      
      await expect(exporter.export(project, { includeData: false }))
        .rejects.toThrow('导出失败：项目ID不能为空');
    });

    it('当项目名称为空时应抛出错误', async () => {
      const project = createMockProject({ name: '' });
      
      await expect(exporter.export(project, { includeData: false }))
        .rejects.toThrow('导出失败：项目名称不能为空');
    });
  });

  describe('UT-EXPORT-002: 至少一个实体校验', () => {
    it('当数据模型为null时应抛出错误', async () => {
      const project = createMockProject({ dataModel: null });
      
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

    it('数据模型存在但无实体列表时应抛出错误', async () => {
      const project = createMockProject({
        dataModel: {
          id: 'dm-1',
          name: '数据模型',
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
});
