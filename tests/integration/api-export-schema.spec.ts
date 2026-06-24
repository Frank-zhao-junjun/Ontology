/**
 * API 导出 Schema 校验测试
 * 
 * 测试用例：
 * - IT-API-EXPORT-003: Schema 校验通过
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { createFrozenProject } from '../unit/test-helpers';

describe('API Export Schema', () => {
  let exporter: ConfigExporter;

  beforeEach(() => {
    exporter = new ConfigExporter();
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
      expect(manifest).toHaveProperty('epcCount');
      expect(typeof manifest.epcCount).toBe('number');
      expect(manifest).toHaveProperty('epcAggregates');
      expect(Array.isArray(manifest.epcAggregates)).toBe(true);
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

    it('state_machines schema 应通过校验', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      const smFile = result.files.find(f => f.path === 'data/state_machines.json');
      const stateMachines = JSON.parse(smFile!.content);

      expect(Array.isArray(stateMachines)).toBe(true);
      
      if (stateMachines.length > 0) {
        const sm = stateMachines[0];
        expect(sm).toHaveProperty('id');
        expect(sm).toHaveProperty('name');
        expect(sm).toHaveProperty('entity');
        expect(sm).toHaveProperty('statusField');
        expect(sm).toHaveProperty('states');
        expect(sm).toHaveProperty('transitions');
      }
    });

    it('rules schema 应通过校验', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      const rulesFile = result.files.find(f => f.path === 'data/rules.json');
      const rules = JSON.parse(rulesFile!.content);

      expect(Array.isArray(rules)).toBe(true);
      
      if (rules.length > 0) {
        const rule = rules[0];
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('type');
        expect(rule).toHaveProperty('entity');
        expect(rule).toHaveProperty('condition');
        expect(rule).toHaveProperty('errorMessage');
      }
    });

    it('epc schema 应通过校验', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });

      const epcFile = result.files.find(f => f.path === 'data/epc.json');
      const epc = JSON.parse(epcFile!.content);

      expect(epc).toHaveProperty('profiles');
      expect(Array.isArray(epc.profiles)).toBe(true);
      expect(epc.profiles.length).toBeGreaterThan(0);
      expect(epc.profiles[0]).toHaveProperty('aggregateId');
      expect(epc.profiles[0]).toHaveProperty('generatedDocument');
      expect(epc.profiles[0]).toHaveProperty('validationSummary');
    });
  });
});
