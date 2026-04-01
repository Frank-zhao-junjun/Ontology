/**
 * E2E: 从建模到运行时加载
 * 
 * Feature: 导出并加载运行时
 * Scenario: 从建模到运行时加载成功
 * 
 * Given 用户在建模工具中完成合同域项目并冻结版本 "v1.0.0"
 * When 用户点击"导出新版本"并下载配置包
 * And 在运行时系统中加载该配置包
 * Then 系统显示当前版本为 "v1.0.0"
 * And 数据视图可查看 Contract 实体数据
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigExporter } from '@/lib/configexporter';
import { RuntimeLoader } from '../integration/test-helpers';
import { createFrozenProject } from '../unit/test-helpers';

describe('E2E: Modeling Export to Runtime Load', () => {
  let exporter: ConfigExporter;
  let loader: RuntimeLoader;

  beforeEach(() => {
    exporter = new ConfigExporter();
    loader = new RuntimeLoader();
  });

  it('@smoke 从建模到运行时加载成功', async () => {
    // Given: 用户在建模工具中完成合同域项目并冻结版本 "v1.0.0"
    const project = createFrozenProject('1.0.0');
    
    // When: 用户点击"导出新版本"并下载配置包
    const exportResult = await exporter.export(project, { includeData: true });
    expect(exportResult.manifest.version).toBe('1.0.0');
    
    // And: 在运行时系统中加载该配置包
    loader.load(exportResult);
    
    // Then: 系统显示当前版本为 "v1.0.0"
    const state = loader.getState();
    expect(state.status).toBe('loaded');
    expect(state.currentVersion).toBe('1.0.0');
    
    // And: 数据视图可查看 Contract 实体数据
    const entitiesFile = state.config!.files.find(f => f.path === 'data/entities.json');
    const entities = JSON.parse(entitiesFile!.content);
    
    const contractEntity = entities.find((e: { nameEn: string }) => e.nameEn === 'Contract');
    expect(contractEntity).toBeDefined();
    expect(contractEntity.name).toBe('合同');
    expect(contractEntity.attributes.length).toBeGreaterThan(0);
  });

  it('@smoke 导出包包含所有固定测试实体', async () => {
    // Given: 冻结版本 v1.0.0
    const project = createFrozenProject('1.0.0');
    
    // When: 导出配置包
    const result = await exporter.export(project, { includeData: false });
    
    // Then: 应包含所有固定测试实体
    const entitiesFile = result.files.find(f => f.path === 'data/entities.json');
    const entities = JSON.parse(entitiesFile!.content);
    const entityNames = entities.map((e: { nameEn: string }) => e.nameEn);
    
    expect(entityNames).toContain('Contract');
    expect(entityNames).toContain('ContractClause');
  });

  it('@smoke 导出后可多次加载', async () => {
    // Given: 冻结版本 v1.0.0
    const project = createFrozenProject('1.0.0');
    const result = await exporter.export(project, { includeData: false });
    
    // When: 在运行时系统中加载
    loader.load(result);
    
    // Then: 应成功加载
    expect(loader.getState().status).toBe('loaded');
    
    // When: 再次加载
    const loader2 = new RuntimeLoader();
    loader2.load(result);
    
    // Then: 也应成功加载
    expect(loader2.getState().status).toBe('loaded');
  });
});
