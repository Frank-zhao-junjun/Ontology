/**
 * 运行时加载测试
 * 
 * 测试用例：
 * - IT-RUNTIME-001: 加载配置包成功
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuntimeLoader } from './test-helpers';
import { ConfigExporter } from '@/lib/configexporter';
import { createFrozenProject } from '../unit/test-helpers';

describe('Runtime Load', () => {
  let exporter: ConfigExporter;
  let loader: RuntimeLoader;

  beforeEach(() => {
    exporter = new ConfigExporter();
    loader = new RuntimeLoader();
  });

  describe('IT-RUNTIME-001: 加载配置包成功', () => {
    it('加载有效配置包后状态应为 loaded', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: true });
      
      loader.load(result);
      
      const state = loader.getState();
      expect(state.status).toBe('loaded');
      expect(state.currentVersion).toBe('1.0.0');
      expect(state.config).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it('加载后应正确设置当前版本', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      loader.load(result);
      
      // 当前版本是 manifest 中的版本，固定为 '1.0.0'
      expect(loader.getState().currentVersion).toBe('1.0.0');
    });

    it('加载后应能获取配置内容', async () => {
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      loader.load(result);
      
      const state = loader.getState();
      const entitiesFile = state.config!.files.find(f => f.path === 'data/entities.json');
      const entities = JSON.parse(entitiesFile!.content);
      
      expect(entities.length).toBe(2);
    });
  });
});
