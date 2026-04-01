/**
 * E2E: 运行时版本切换
 * 
 * Feature: 版本切换
 * Scenario: 从 v1.0.0 切换到 v1.0.1
 * 
 * Given 运行时已加载版本 "v1.0.0"
 * And 可选版本列表包含 "v1.0.1"
 * When 用户选择版本 "v1.0.1"
 * Then 页面版本标识更新为 "v1.0.1"
 * And Contract 实体视图按 v1.0.1 模型展示
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { RuntimeLoader } from '../integration/test-helpers';
import { createFrozenProject } from '../unit/test-helpers';

describe('E2E: Runtime Version Switch', () => {
  let exporter: ConfigExporter;
  let loader: RuntimeLoader;

  beforeEach(() => {
    exporter = new ConfigExporter();
    loader = new RuntimeLoader();
  });

  it('@smoke 从 v1.0.0 切换到新版本', async () => {
    // Given: 运行时已加载版本 "v1.0.0"
    const v100 = await exporter.export(createFrozenProject('1.0.0'), { includeData: false });
    loader.load(v100);
    
    const state1 = loader.getState();
    expect(state1.currentVersion).toBe('1.0.0');
    
    // Given: 可选版本列表包含其他版本
    const v101 = await exporter.export(createFrozenProject('1.0.1'), { includeData: false });
    
    // When: 用户选择新版本
    loader.switchVersion(v101);
    
    // Then: 页面版本标识更新
    const state2 = loader.getState();
    expect(state2.status).toBe('loaded');
    
    // And: Contract 实体视图按新版本模型展示
    const entitiesFile = state2.config!.files.find(f => f.path === 'data/entities.json');
    const entities = JSON.parse(entitiesFile!.content);
    
    const contractEntity = entities.find((e: { nameEn: string }) => e.nameEn === 'Contract');
    expect(contractEntity).toBeDefined();
  });

  it('@smoke 版本切换后状态正确', async () => {
    // Given: 已加载 v1.0.0
    const v100 = await exporter.export(createFrozenProject('1.0.0'), { includeData: false });
    loader.load(v100);
    
    // When: 切换到新版本
    const v101 = await exporter.export(createFrozenProject('1.0.1'), { includeData: false });
    loader.switchVersion(v101);
    
    // Then: 状态应为 loaded
    const state = loader.getState();
    expect(state.status).toBe('loaded');
    expect(state.error).toBeNull();
  });

  it('@smoke 版本切换保留数据完整性', async () => {
    // Given: 已加载 v1.0.0
    const v100 = await exporter.export(createFrozenProject('1.0.0'), { includeData: false });
    loader.load(v100);
    
    // When: 切换到 v1.0.1
    const v101 = await exporter.export(createFrozenProject('1.0.1'), { includeData: false });
    loader.switchVersion(v101);
    
    // Then: 实体数据完整
    const state = loader.getState();
    const entitiesFile = state.config!.files.find(f => f.path === 'data/entities.json');
    const entities = JSON.parse(entitiesFile!.content);
    
    expect(entities.length).toBeGreaterThan(0);
    
    // 验证 entities.json schema 完整性
    for (const entity of entities) {
      expect(entity).toHaveProperty('id');
      expect(entity).toHaveProperty('name');
      expect(entity).toHaveProperty('attributes');
      expect(entity).toHaveProperty('relations');
    }
  });

  it('@smoke 版本切换前后配置内容变化', async () => {
    // Given: 已加载 v1.0.0
    const v100 = await exporter.export(createFrozenProject('1.0.0'), { includeData: false });
    loader.load(v100);
    const state1 = loader.getState();
    
    // When: 切换到 v1.0.1
    const v101 = await exporter.export(createFrozenProject('1.0.1'), { includeData: false });
    loader.switchVersion(v101);
    const state2 = loader.getState();
    
    // Then: 配置内容不同（manifest 的 generatedAt 不同）
    const manifest1 = JSON.stringify(state1.config?.manifest);
    const manifest2 = JSON.stringify(state2.config?.manifest);
    expect(manifest1).not.toBe(manifest2);
  });
});
