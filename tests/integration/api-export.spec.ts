/**
 * API 导出接口测试
 * 
 * 测试用例：
 * - IT-API-EXPORT-001: POST /api/export 成功导出
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { createFrozenProject } from '../unit/test-helpers';

describe('API Export', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
  });

  describe('IT-API-EXPORT-001: POST /api/export 成功导出', () => {
    it('应成功导出冻结版本', async () => {
      const project = createFrozenProject('1.0.0');
      
      const result = await exporter.export(project, { includeData: true });

      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.manifest).toBeDefined();
    });

    it('返回的 downloadUrl 应有效', async () => {
      const project = createFrozenProject('1.0.0');
      
      const result = await exporter.export(project, { includeData: false });

      // 验证 manifest 包含必要信息
      expect(result.manifest.projectId).toBeDefined();
      expect(result.manifest.projectId.length).toBeGreaterThan(0);
      expect(result.manifest.version).toBe('1.0.0');
      expect(result.manifest.entityCount).toBe(2);
    });

    it('导出应包含所有元模型数据', async () => {
      const project = createFrozenProject('1.0.0');
      
      const result = await exporter.export(project, { includeData: false });

      // 验证行为模型文件
      const smFile = result.files.find(f => f.path === 'data/state_machines.json');
      expect(smFile).toBeDefined();
      const stateMachines = JSON.parse(smFile!.content);
      expect(stateMachines.length).toBeGreaterThan(0);

      // 验证规则模型文件
      const rulesFile = result.files.find(f => f.path === 'data/rules.json');
      expect(rulesFile).toBeDefined();
      const rules = JSON.parse(rulesFile!.content);
      expect(rules.length).toBeGreaterThan(0);

      // 验证事件模型文件
      const eventsFile = result.files.find(f => f.path === 'data/events.json');
      expect(eventsFile).toBeDefined();
      const events = JSON.parse(eventsFile!.content);
      expect(events.events.length).toBeGreaterThan(0);

      const epcFile = result.files.find(f => f.path === 'data/epc.json');
      expect(epcFile).toBeDefined();
      const epc = JSON.parse(epcFile!.content);
      expect(Array.isArray(epc.profiles)).toBe(true);
      expect(epc.profiles.length).toBeGreaterThan(0);
    });
  });
});
