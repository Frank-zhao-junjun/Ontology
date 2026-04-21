import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import { createMockProject } from './test-helpers';
import type { MasterData, MasterDataRecord } from '@/types/ontology';

const now = '2026-04-21T00:00:00.000Z';

describe('US-10.1: 版本快照依赖管理与回滚策略', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createMockProject(),
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
    });
  });

  const setupMockData = () => {
    const store = useOntologyStore.getState();
    const md: MasterData = {
      id: 'md-version-test',
      domain: '测试',
      name: '测试数据',
      nameEn: 'TestData',
      code: 'TEST',
      description: '版本测试',
      coreData: '是',
      fieldNames: 'code,name',
      sourceSystem: 'MDM',
      status: '00',
      createdAt: now,
      updatedAt: now,
    };
    const rec: MasterDataRecord = {
      id: 'rec-version-test',
      definitionId: 'md-version-test',
      values: { code: 'A', name: 'Original Name' },
      status: '00',
      createdAt: now,
      updatedAt: now,
    };
    
    store.addMasterData(md);
    store.addMasterDataRecord('md-version-test', rec);
    
    // Modify a basic project attribute to test model rollback
    store.updateEntity('entity-1', {
      ...store.project?.dataModel?.entities.find(e => e.id === 'entity-1') as any,
      id: 'entity-1',
      name: 'Original Entity Name',
      entityRole: 'aggregate_root'
    });
  };

  it('应用回滚时应全量恢复至版本快照当时的状态（包括主数据、工作台配置及各模型）', () => {
    setupMockData();
    const store = useOntologyStore.getState();
    
    // 1. Create a version snapshot at original state
    const version1 = store.createVersion({
      version: '1.0.0',
      name: '原始状态',
    });
    
    // 2. Mess up the state
    store.updateEntity('entity-1', {
      ...store.project?.dataModel?.entities.find(e => e.id === 'entity-1') as any,
      id: 'entity-1',
      name: 'Messed Up Entity',
      entityRole: 'aggregate_root'
    });
    store.updateMasterDataRecord('md-version-test', 'rec-version-test', {
      values: { code: 'A', name: 'Messed Up Name' }
    });
    
    // Verify dirty state
    const dirtyStore = useOntologyStore.getState();
    expect(dirtyStore.project?.dataModel?.entities.find(e => e.id === 'entity-1')?.name).toBe('Messed Up Entity');
    expect(dirtyStore.masterDataRecords['md-version-test'][0].values['name']).toBe('Messed Up Name');
    
    // 3. Rollback!
    dirtyStore.rollbackVersion(version1.id);
    
    // Verify restored state
    const restoredStore = useOntologyStore.getState();
    
    // Model entity should be restored
    expect(restoredStore.project?.dataModel?.entities.find(e => e.id === 'entity-1')?.name).toBe('Original Entity Name');
    // Master data should be restored
    expect(restoredStore.masterDataRecords['md-version-test'][0].values['name']).toBe('Original Name');
  });

  it('未加载项目或指定的版本不存在时回滚应抛出错误', () => {
    const store = useOntologyStore.getState();
    expect(() => store.rollbackVersion('non-existent')).toThrow('版本不存在');
    
    useOntologyStore.setState({ project: null });
    expect(() => store.rollbackVersion('some-id')).toThrow('没有活动项目');
  });
});