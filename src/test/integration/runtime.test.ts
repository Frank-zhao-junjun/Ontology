/**
 * 运行时加载与版本切换测试
 * 
 * 测试用例：IT-RUNTIME-001 ~ IT-RUNTIME-003
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { ConfigPackage } from '@/lib/configexporter';

// ========== 运行时加载器模拟 ==========

interface RuntimeState {
  status: 'idle' | 'loaded' | 'error';
  currentVersion: string | null;
  config: ConfigPackage | null;
  error: string | null;
}

class RuntimeLoader {
  private state: RuntimeState = {
    status: 'idle',
    currentVersion: null,
    config: null,
    error: null,
  };

  /**
   * 加载配置包
   */
  load(config: ConfigPackage): void {
    try {
      // 校验配置包完整性
      this.validateConfig(config);
      
      this.state = {
        status: 'loaded',
        currentVersion: config.manifest.version,
        config,
        error: null,
      };
    } catch (error) {
      this.state = {
        status: 'error',
        currentVersion: null,
        config: null,
        error: error instanceof Error ? error.message : '加载失败',
      };
      throw error;
    }
  }

  /**
   * 校验配置包
   */
  private validateConfig(config: ConfigPackage): void {
    // 校验 manifest
    if (!config.manifest) {
      throw new Error('缺少 manifest');
    }
    if (!config.manifest.version) {
      throw new Error('缺少版本号');
    }
    if (!config.manifest.projectId) {
      throw new Error('缺少项目ID');
    }

    // 校验文件
    if (!config.files || config.files.length === 0) {
      throw new Error('配置包文件为空');
    }

    const filePaths = config.files.map(f => f.path);
    if (!filePaths.includes('config.json')) {
      throw new Error('缺少 config.json');
    }
    if (!filePaths.includes('data/entities.json')) {
      throw new Error('缺少 data/entities.json');
    }
  }

  /**
   * 获取当前状态
   */
  getState(): RuntimeState {
    return { ...this.state };
  }

  /**
   * 切换版本
   */
  switchVersion(newConfig: ConfigPackage): void {
    if (this.state.status !== 'loaded') {
      throw new Error('当前未加载任何配置');
    }
    
    this.load(newConfig);
  }
}

// ========== 测试数据 ==========

const createMockConfig = (version: string, entityCount: number = 1): ConfigPackage => {
  const entities = [];
  for (let i = 0; i < entityCount; i++) {
    entities.push({
      id: `entity-${i}`,
      name: `实体${i}`,
      nameEn: `Entity${i}`,
      fileName: `entity_${i}`,
      className: `Entity${i}`,
      tableName: `t_entity_${i}`,
      entityRole: 'aggregate_root',
      attributes: [
        { id: 'a1', name: '名称', nameEn: 'name', dataType: 'string', required: true, columnName: 'name' },
      ],
      relations: [],
      rules: [],
      events: [],
    });
  }

  return {
    files: [
      { path: 'config.json', content: JSON.stringify({ project: 'Test', version }) },
      { path: 'README.md', content: '# Test' },
      { path: 'manifest.json', content: JSON.stringify({ projectId: 'p1', version }) },
      { path: 'data/entities.json', content: JSON.stringify(entities) },
      { path: 'data/state_machines.json', content: '[]' },
      { path: 'data/rules.json', content: '[]' },
      { path: 'data/events.json', content: '{}' },
    ],
    manifest: {
      projectId: 'p1',
      version,
      generatedAt: new Date().toISOString(),
      entityCount,
      stateMachineCount: 0,
      ruleCount: 0,
      eventCount: 0,
    },
  };
};

// ========== 测试用例 ==========

describe('运行时加载与版本切换', () => {
  let loader: RuntimeLoader;

  beforeEach(() => {
    loader = new RuntimeLoader();
  });

  describe('IT-RUNTIME-001: 加载配置包成功', () => {
    it('加载有效配置包后状态应为 loaded', () => {
      const config = createMockConfig('1.0.0');
      
      loader.load(config);
      
      const state = loader.getState();
      expect(state.status).toBe('loaded');
      expect(state.currentVersion).toBe('1.0.0');
      expect(state.config).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it('加载后应正确设置当前版本', () => {
      const config = createMockConfig('2.0.0');
      
      loader.load(config);
      
      expect(loader.getState().currentVersion).toBe('2.0.0');
    });
  });

  describe('IT-RUNTIME-002: 版本切换正确', () => {
    it('从 v1.0.0 切换到 v1.0.1 应成功', () => {
      const config1 = createMockConfig('1.0.0', 1);
      const config2 = createMockConfig('1.0.1', 2);

      // 加载 v1.0.0
      loader.load(config1);
      expect(loader.getState().currentVersion).toBe('1.0.0');

      // 切换到 v1.0.1
      loader.switchVersion(config2);
      
      const state = loader.getState();
      expect(state.status).toBe('loaded');
      expect(state.currentVersion).toBe('1.0.1');
      
      // 验证实体数量变化
      const entitiesFile = state.config!.files.find(f => f.path === 'data/entities.json');
      const entities = JSON.parse(entitiesFile!.content);
      expect(entities.length).toBe(2);
    });

    it('版本切换后视图应重渲染（通过状态变化验证）', () => {
      const config1 = createMockConfig('1.0.0', 1);
      const config2 = createMockConfig('1.0.1', 3);

      loader.load(config1);
      const state1 = loader.getState();
      
      loader.switchVersion(config2);
      const state2 = loader.getState();

      // 验证状态已更新
      expect(state2.currentVersion).not.toBe(state1.currentVersion);
      expect(state2.config).not.toBe(state1.config);
      
      // 验证实体数量变化（模拟视图更新）
      const entities1 = JSON.parse(
        state1.config!.files.find(f => f.path === 'data/entities.json')!.content
      );
      const entities2 = JSON.parse(
        state2.config!.files.find(f => f.path === 'data/entities.json')!.content
      );
      
      expect(entities2.length).not.toBe(entities1.length);
    });
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
      const invalidConfig = createMockConfig('1.0.0');
      invalidConfig.manifest = {
        ...invalidConfig.manifest,
        version: '',
      };

      expect(() => loader.load(invalidConfig)).toThrow('缺少版本号');
    });

    it('缺少 config.json 应拒绝加载', () => {
      const invalidConfig = createMockConfig('1.0.0');
      invalidConfig.files = invalidConfig.files.filter(f => f.path !== 'config.json');

      expect(() => loader.load(invalidConfig)).toThrow('缺少 config.json');
    });

    it('缺少 data/entities.json 应拒绝加载', () => {
      const invalidConfig = createMockConfig('1.0.0');
      invalidConfig.files = invalidConfig.files.filter(f => f.path !== 'data/entities.json');

      expect(() => loader.load(invalidConfig)).toThrow('缺少 data/entities.json');
    });

    it('配置包文件为空应拒绝加载', () => {
      const invalidConfig = {
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
  });
});
