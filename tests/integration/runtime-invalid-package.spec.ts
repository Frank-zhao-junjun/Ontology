/**
 * 运行时无效配置包拦截测试
 * 
 * 测试用例：
 * - IT-RUNTIME-003: 无效配置包拒绝加载
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuntimeLoader } from './test-helpers';
import type { ConfigPackage } from '@/lib/configexporter';

describe('Runtime Invalid Package', () => {
  let loader: RuntimeLoader;

  beforeEach(() => {
    loader = new RuntimeLoader();
  });

  describe('IT-RUNTIME-003: 无效配置包拒绝加载', () => {
    it('缺少 manifest 应拒绝加载并返回错误', () => {
      const invalidConfig = {
        files: [
          { path: 'config.json', content: '{}' },
        ],
        manifest: null as unknown as ConfigPackage['manifest'],
      };

      expect(() => loader.load(invalidConfig)).toThrow('缺少 manifest');
      
      const state = loader.getState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('缺少 manifest');
    });

    it('缺少版本号应拒绝加载', () => {
      const invalidConfig: ConfigPackage = {
        files: [
          { path: 'config.json', content: '{}' },
          { path: 'data/entities.json', content: '[]' },
        ],
        manifest: {
          projectId: 'p1',
          version: '',
          generatedAt: new Date().toISOString(),
          entityCount: 0,
          stateMachineCount: 0,
          ruleCount: 0,
          eventCount: 0,
        },
      };

      expect(() => loader.load(invalidConfig)).toThrow('缺少版本号');
    });

    it('缺少 config.json 应拒绝加载', () => {
      const invalidConfig: ConfigPackage = {
        files: [
          { path: 'data/entities.json', content: '[]' },
        ],
        manifest: {
          projectId: 'p1',
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          entityCount: 0,
          stateMachineCount: 0,
          ruleCount: 0,
          eventCount: 0,
        },
      };

      expect(() => loader.load(invalidConfig)).toThrow('缺少 config.json');
    });

    it('缺少 data/entities.json 应拒绝加载', () => {
      const invalidConfig: ConfigPackage = {
        files: [
          { path: 'config.json', content: '{}' },
        ],
        manifest: {
          projectId: 'p1',
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          entityCount: 0,
          stateMachineCount: 0,
          ruleCount: 0,
          eventCount: 0,
        },
      };

      expect(() => loader.load(invalidConfig)).toThrow('缺少 data/entities.json');
    });

    it('配置包文件为空应拒绝加载', () => {
      const invalidConfig: ConfigPackage = {
        files: [],
        manifest: {
          projectId: 'p1',
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          entityCount: 1,
          stateMachineCount: 0,
          ruleCount: 0,
          eventCount: 0,
        },
      };

      expect(() => loader.load(invalidConfig)).toThrow('配置包文件为空');
    });

    it('缺少 projectId 应拒绝加载', () => {
      const invalidConfig: ConfigPackage = {
        files: [
          { path: 'config.json', content: '{}' },
          { path: 'data/entities.json', content: '[]' },
        ],
        manifest: {
          projectId: '',
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          entityCount: 0,
          stateMachineCount: 0,
          ruleCount: 0,
          eventCount: 0,
        },
      };

      expect(() => loader.load(invalidConfig)).toThrow('缺少项目ID');
    });
  });
});
