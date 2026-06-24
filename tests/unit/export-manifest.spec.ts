/**
 * 导出 Manifest 测试
 * 
 * 测试用例：
 * - UT-EXPORT-005: manifest 字段完整性
 * - UT-EXPORT-006: generatedAt 格式校验
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter, type ExportConfig } from '@/lib/configexporter';
import { createFrozenProject } from './test-helpers';

describe('Export Manifest', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('UT-EXPORT-005: manifest 字段完整性', () => {
    it('manifest 应包含所有必需字段', async () => {
      const project = createFrozenProject('1.0.0');
      const config: ExportConfig = { includeData: false };
      
      const result = await exporter.export(project, config);
      
      expect(result.manifest).toHaveProperty('projectId');
      expect(result.manifest).toHaveProperty('version');
      expect(result.manifest).toHaveProperty('generatedAt');
      expect(result.manifest).toHaveProperty('entityCount');
    });

    it('manifest.projectId 应为有效字符串', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      expect(typeof result.manifest.projectId).toBe('string');
      expect(result.manifest.projectId.length).toBeGreaterThan(0);
    });

    it('manifest.entityCount 应与实际实体数量一致', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      const entitiesFile = result.files.find(f => f.path === 'data/entities.json');
      const entities = JSON.parse(entitiesFile!.content);
      
      expect(result.manifest.entityCount).toBe(entities.length);
    });

    it('manifest 应包含状态机、规则、事件数量', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      expect(result.manifest).toHaveProperty('stateMachineCount');
      expect(result.manifest).toHaveProperty('ruleCount');
      expect(result.manifest).toHaveProperty('eventCount');
      
      expect(result.manifest.stateMachineCount).toBeGreaterThanOrEqual(0);
      expect(result.manifest.ruleCount).toBeGreaterThanOrEqual(0);
      expect(result.manifest.eventCount).toBeGreaterThanOrEqual(0);
    });

    it('manifest 应包含 EPC 导出元数据', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      expect(result.manifest).toHaveProperty('epcCount', 1);
      expect(result.manifest).toHaveProperty('epcAggregates');
      expect(Array.isArray(result.manifest.epcAggregates)).toBe(true);
      expect(result.manifest).toHaveProperty('generatedEpcAt');
      expect(typeof result.manifest.generatedEpcAt).toBe('string');
    });
  });

  describe('UT-EXPORT-006: generatedAt 格式校验', () => {
    it('generatedAt 应为 ISO datetime 格式', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      const { generatedAt } = result.manifest;
      
      // 验证 ISO datetime 格式
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(isoRegex.test(generatedAt)).toBe(true);
    });

    it('generatedAt 应可被解析为有效日期', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      const { generatedAt } = result.manifest;
      const date = new Date(generatedAt);
      
      expect(date instanceof Date && !isNaN(date.getTime())).toBe(true);
    });

    it('generatedAt 应在合理时间范围内（不早于项目创建时间）', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      const projectCreatedAt = new Date(project.createdAt);
      const generatedAt = new Date(result.manifest.generatedAt);
      
      expect(generatedAt.getTime()).toBeGreaterThanOrEqual(projectCreatedAt.getTime());
    });
  });
});
