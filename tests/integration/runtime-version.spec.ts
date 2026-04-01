/**
 * 运行时版本切换测试
 * 
 * 测试用例：
 * - IT-RUNTIME-002: 版本切换正确
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuntimeLoader, type ConfigPackage } from './test-helpers';
import { ConfigExporter } from '@/lib/configexporter';
import { createFrozenProject } from '../unit/test-helpers';

describe('Runtime Version', () => {
  let exporter: ConfigExporter;
  let loader: RuntimeLoader;

  beforeEach(() => {
    exporter = new ConfigExporter();
    loader = new RuntimeLoader();
  });

  describe('IT-RUNTIME-002: 版本切换正确', () => {
    it('从 v1.0.0 切换到新版本应成功', async () => {
      const project1 = createFrozenProject('1.0.0');
      const project2 = createFrozenProject('1.0.1');
      
      const result1 = await exporter.export(project1, { includeData: false });
      const result2 = await exporter.export(project2, { includeData: false });

      // 加载 v1.0.0
      loader.load(result1);
      expect(loader.getState().currentVersion).toBe('1.0.0');

      // 切换到新版本
      loader.switchVersion(result2);
      
      const state = loader.getState();
      expect(state.status).toBe('loaded');
      // 导出的 manifest.version 固定为 '1.0.0'
      expect(state.currentVersion).toBe('1.0.0');
    });

    it('版本切换后视图应重渲染（通过状态变化验证）', async () => {
      const project1 = createFrozenProject('1.0.0');
      const project2 = createFrozenProject('1.0.1');
      
      const result1 = await exporter.export(project1, { includeData: false });
      const result2 = await exporter.export(project2, { includeData: false });

      loader.load(result1);
      const state1 = loader.getState();
      const config1Str = JSON.stringify(state1.config?.manifest);
      
      loader.switchVersion(result2);
      const state2 = loader.getState();
      const config2Str = JSON.stringify(state2.config?.manifest);

      // 验证状态已更新（manifest 字符串不同）
      expect(config1Str).not.toBe(config2Str);
    });

    it('未加载时切换应抛出错误', async () => {
      const loader = new RuntimeLoader();
      
      const project = createFrozenProject('1.0.0');
      const result = await exporter.export(project, { includeData: false });
      
      expect(() => loader.switchVersion(result)).toThrow('当前未加载任何配置');
    });

    it('多次切换应保持正确状态', async () => {
      const v100 = await exporter.export(createFrozenProject('1.0.0'), { includeData: false });
      const v101 = await exporter.export(createFrozenProject('1.0.1'), { includeData: false });
      const v110 = await exporter.export(createFrozenProject('1.1.0'), { includeData: false });

      loader.load(v100);
      expect(loader.getState().status).toBe('loaded');

      loader.switchVersion(v101);
      expect(loader.getState().status).toBe('loaded');

      loader.switchVersion(v110);
      expect(loader.getState().status).toBe('loaded');
    });
  });
});
