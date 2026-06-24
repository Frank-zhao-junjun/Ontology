import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Metadata } from '@/types/ontology';

const now = '2026-04-21T00:00:00.000Z';

function createMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    id: overrides.id || 'meta-contract-name',
    domain: overrides.domain || '合同管理',
    name: overrides.name || '合同名称',
    nameEn: overrides.nameEn || 'ContractName',
    description: overrides.description || '合同标题字段',
    type: overrides.type || 'string',
    valueRange: overrides.valueRange,
    standard: overrides.standard,
    source: overrides.source,
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
  };
}

describe('US-9.1 / metadata template management in store', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
    });
  });

  it('应支持元数据模板新增、更新、删除（CRUD）', () => {
    const store = useOntologyStore.getState();

    const original = createMetadata();
    store.addMetadata(original);
    expect(useOntologyStore.getState().metadataList).toHaveLength(1);
    expect(useOntologyStore.getState().metadataList[0]).toMatchObject({
      id: 'meta-contract-name',
      domain: '合同管理',
      name: '合同名称',
      nameEn: 'ContractName',
    });

    const updated = createMetadata({
      id: 'meta-contract-name',
      domain: '采购管理',
      name: '采购合同名称',
      nameEn: 'PurchaseContractName',
      description: '采购合同标题字段',
      type: 'text',
      valueRange: '长度 1-200',
    });
    store.updateMetadata('meta-contract-name', updated);

    const afterUpdate = useOntologyStore.getState().metadataList.find((item) => item.id === 'meta-contract-name');
    expect(afterUpdate).toBeDefined();
    expect(afterUpdate).toMatchObject({
      domain: '采购管理',
      name: '采购合同名称',
      nameEn: 'PurchaseContractName',
      type: 'text',
      valueRange: '长度 1-200',
    });

    store.deleteMetadata('meta-contract-name');
    expect(useOntologyStore.getState().metadataList).toHaveLength(0);
  });

  it('应支持按中文名和英文名查询元数据模板', () => {
    const store = useOntologyStore.getState();

    store.setMetadataList([
      createMetadata({
        id: 'meta-contract-no',
        domain: '合同管理',
        name: '合同编号',
        nameEn: 'ContractNo',
      }),
      createMetadata({
        id: 'meta-order-no',
        domain: '采购管理',
        name: '订单编号',
        nameEn: 'OrderNo',
      }),
    ]);

    expect(store.findMetadataByName('订单编号')?.id).toBe('meta-order-no');
    expect(store.findMetadataByNameEn('ContractNo')?.id).toBe('meta-contract-no');
    expect(store.findMetadataByName('不存在字段')).toBeUndefined();
  });
});
