import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';

const now = '2026-04-01T00:00:00.000Z';

describe('US-8.1: master data definition versioning and sync strategy', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: {
        id: 'proj-1',
        name: '合同管理本体',
        description: '测试项目',
        domain: {
          id: 'domain-1',
          name: '合同管理',
          nameEn: 'ContractManagement',
          description: '测试领域',
        },
        dataModel: null,
        behaviorModel: null,
        ruleModel: null,
        processModel: null,
        eventModel: null,
        createdAt: now,
        updatedAt: now,
      },
      masterDataList: [
        {
          id: 'md-supplier',
          domain: '采购管理',
          name: '供应商主数据',
          nameEn: 'SupplierMaster',
          code: 'SUPPLIER',
          description: '供应商档案',
          coreData: '是',
          fieldNames: '供应商编码,供应商名称',
          sourceSystem: 'ERP',
          status: '00',
          source: 'ERP',
          createdAt: now,
          updatedAt: now,
        },
      ],
      masterDataRecords: {
        'md-supplier': [
          {
            id: 'rec-1',
            definitionId: 'md-supplier',
            values: {
              供应商编码: 'S-001',
              供应商名称: '华北供应商',
            },
            status: '00',
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      versions: [],
    });
  });

  it('createVersion 应包含主数据定义与记录快照', () => {
    const created = useOntologyStore.getState().createVersion({
      version: '1.0.0',
      name: 'v1',
      description: '主数据基线',
    });

    expect(created.metamodels.masterData?.definitions).toHaveLength(1);
    expect(created.metamodels.masterData?.definitions[0].name).toBe('供应商主数据');
    expect(created.metamodels.masterData?.records['md-supplier'][0].values['供应商编码']).toBe('S-001');
  });

  it('updateMasterData 修改字段清单后应同步重映射现有记录', () => {
    useOntologyStore.getState().updateMasterData('md-supplier', {
      id: 'md-supplier',
      domain: '采购管理',
      name: '供应商主数据',
      nameEn: 'SupplierMaster',
      code: 'SUPPLIER',
      description: '供应商档案',
      coreData: '是',
      fieldNames: '供应商编码,供应商简称,状态',
      sourceSystem: 'ERP',
      status: '00',
      source: 'ERP',
      createdAt: now,
      updatedAt: now,
    });

    const syncedRecord = useOntologyStore.getState().masterDataRecords['md-supplier'][0];
    expect(syncedRecord.values).toEqual({
      供应商编码: 'S-001',
      供应商简称: '',
      状态: '',
    });
  });
});
