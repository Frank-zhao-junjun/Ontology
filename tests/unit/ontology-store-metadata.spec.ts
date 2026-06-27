import { describe, expect, it, beforeEach } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Metadata, MasterData, MasterDataRecord } from '@/types/ontology';

// ────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────

const mockMetadata1: Metadata = {
  id: 'md-1',
  domain: '财务',
  name: '客户编号',
  nameEn: 'CustomerID',
  description: '客户唯一标识',
  type: 'string',
  valueRange: '',
  standard: 'ISO',
  source: 'SAP',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockMetadata2: Metadata = {
  id: 'md-2',
  domain: '财务',
  name: '客户名称',
  nameEn: 'CustomerName',
  description: '客户全称',
  type: 'string',
  valueRange: '',
  standard: '',
  source: 'SAP',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockMetadata3: Metadata = {
  id: 'md-3',
  domain: '物料',
  name: '物料编码',
  nameEn: 'MaterialCode',
  description: '物料唯一编码',
  type: 'string',
  valueRange: '',
  standard: '',
  source: 'ERP',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

const mockMasterDataDef: MasterData = {
  id: 'mdd-1',
  domain: '生产管理',
  name: '客户主数据',
  nameEn: 'Customer',
  code: 'MD-CUST',
  description: '客户主数据定义',
  coreData: '',
  fieldNames: '客户编码,客户名称',
  sourceSystem: 'SAP',
  status: '00',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockMasterDataDef2: MasterData = {
  id: 'mdd-2',
  domain: '物料管理',
  name: '物料主数据',
  nameEn: 'Material',
  code: 'MD-MAT',
  description: '物料主数据定义',
  coreData: '',
  fieldNames: '物料编码,物料名称',
  sourceSystem: 'ERP',
  status: '00',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockRecord1: MasterDataRecord = {
  id: 'rec-1',
  definitionId: 'mdd-1',
  values: { '客户编码': 'C-001', '客户名称': '华中客户' },
  status: '00',
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
};

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function resetStore() {
  useOntologyStore.setState({
    project: null,
    activeModelType: 'data',
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
  });
}

// ────────────────────────────────────────────
// Metadata Operations
// ────────────────────────────────────────────

describe('Metadata Operations', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── setMetadataList ────────────────────────

  describe('setMetadataList', () => {
    it('should set metadataList from empty to a populated list', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1, mockMetadata2]);
      expect(useOntologyStore.getState().metadataList).toHaveLength(2);
      expect(useOntologyStore.getState().metadataList[0].id).toBe('md-1');
    });

    it('should replace the entire list (not append)', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1]);
      store.setMetadataList([mockMetadata2]); // replace
      expect(useOntologyStore.getState().metadataList).toHaveLength(1);
      expect(useOntologyStore.getState().metadataList[0].id).toBe('md-2');
    });

    it('should set an empty list', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1]);
      store.setMetadataList([]);
      expect(useOntologyStore.getState().metadataList).toEqual([]);
    });
  });

  // ── addMetadata ─────────────────────────────

  describe('addMetadata', () => {
    it('should append a metadata entry to an empty list', () => {
      const store = useOntologyStore.getState();
      store.addMetadata(mockMetadata1);
      expect(useOntologyStore.getState().metadataList).toHaveLength(1);
      expect(useOntologyStore.getState().metadataList[0]).toEqual(mockMetadata1);
    });

    it('should append metadata to an existing list', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1]);
      store.addMetadata(mockMetadata2);
      const list = useOntologyStore.getState().metadataList;
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe('md-1');
      expect(list[1].id).toBe('md-2');
    });

    it('should handle duplicate IDs gracefully (append regardless)', () => {
      const store = useOntologyStore.getState();
      store.addMetadata(mockMetadata1);
      store.addMetadata({ ...mockMetadata1 }); // same id, different instance
      expect(useOntologyStore.getState().metadataList).toHaveLength(2);
    });
  });

  // ── updateMetadata ──────────────────────────

  describe('updateMetadata', () => {
    it('should update matching metadata and add updatedAt timestamp', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1, mockMetadata2]);
      const before = Date.now();
      store.updateMetadata('md-1', { ...mockMetadata1, name: '客户编码(更新)' });
      const after = Date.now();
      const list = useOntologyStore.getState().metadataList;
      expect(list[0].name).toBe('客户编码(更新)');
      // updatedAt should be a fresh ISO timestamp
      const updatedTime = new Date(list[0].updatedAt).getTime();
      expect(updatedTime).toBeGreaterThanOrEqual(before);
      expect(updatedTime).toBeLessThanOrEqual(after);
    });

    it('should leave non-matching entries unchanged', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1, mockMetadata2]);
      store.updateMetadata('md-1', { ...mockMetadata1, name: 'Updated' });
      const list = useOntologyStore.getState().metadataList;
      expect(list[1].name).toBe('客户名称'); // unchanged
    });

    it('should do nothing when id does not exist (no throw)', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1]);
      expect(() => {
        store.updateMetadata('nonexistent', { ...mockMetadata1, name: 'Nope' });
      }).not.toThrow();
      expect(useOntologyStore.getState().metadataList).toHaveLength(1);
      expect(useOntologyStore.getState().metadataList[0].name).toBe('客户编号');
    });

    it('should not change list length on update', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1, mockMetadata2]);
      store.updateMetadata('md-2', { ...mockMetadata2, name: '客户名称(更新)' });
      expect(useOntologyStore.getState().metadataList).toHaveLength(2);
    });
  });

  // ── deleteMetadata ──────────────────────────

  describe('deleteMetadata', () => {
    it('should remove metadata by id', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1, mockMetadata2]);
      store.deleteMetadata('md-1');
      const list = useOntologyStore.getState().metadataList;
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('md-2');
    });

    it('should handle deleting the last item', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1]);
      store.deleteMetadata('md-1');
      expect(useOntologyStore.getState().metadataList).toEqual([]);
    });

    it('should do nothing when id does not exist (no throw)', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1]);
      expect(() => store.deleteMetadata('nonexistent')).not.toThrow();
      expect(useOntologyStore.getState().metadataList).toHaveLength(1);
    });

    it('should do nothing on empty list', () => {
      const store = useOntologyStore.getState();
      expect(() => store.deleteMetadata('md-1')).not.toThrow();
      expect(useOntologyStore.getState().metadataList).toEqual([]);
    });
  });

  // ── findMetadataByName ──────────────────────

  describe('findMetadataByName', () => {
    it('should return the first metadata matching name', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1, mockMetadata2]);
      const result = store.findMetadataByName('客户编号');
      expect(result).toBeDefined();
      expect(result!.id).toBe('md-1');
    });

    it('should return undefined when name not found', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1]);
      const result = store.findMetadataByName('不存在的名称');
      expect(result).toBeUndefined();
    });

    it('should return undefined on empty list', () => {
      const store = useOntologyStore.getState();
      const result = store.findMetadataByName('客户编号');
      expect(result).toBeUndefined();
    });

    it('should return the first match when there are duplicates', () => {
      const store = useOntologyStore.getState();
      const dup1 = { ...mockMetadata1, id: 'dup-1' };
      const dup2 = { ...mockMetadata1, id: 'dup-2' };
      store.setMetadataList([dup1, dup2]);
      const result = store.findMetadataByName('客户编号');
      expect(result).toBeDefined();
      expect(result!.id).toBe('dup-1');
    });
  });

  // ── findMetadataByNameEn ────────────────────

  describe('findMetadataByNameEn', () => {
    it('should return the first metadata matching nameEn', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1, mockMetadata2]);
      const result = store.findMetadataByNameEn('CustomerID');
      expect(result).toBeDefined();
      expect(result!.id).toBe('md-1');
    });

    it('should return undefined when nameEn not found', () => {
      const store = useOntologyStore.getState();
      store.setMetadataList([mockMetadata1]);
      const result = store.findMetadataByNameEn('NonExistent');
      expect(result).toBeUndefined();
    });

    it('should return undefined on empty list', () => {
      const store = useOntologyStore.getState();
      const result = store.findMetadataByNameEn('CustomerID');
      expect(result).toBeUndefined();
    });

    it('should return the first match when there are duplicates', () => {
      const store = useOntologyStore.getState();
      const dup1 = { ...mockMetadata1, id: 'dup-1' };
      const dup2 = { ...mockMetadata1, id: 'dup-2' };
      store.setMetadataList([dup1, dup2]);
      const result = store.findMetadataByNameEn('CustomerID');
      expect(result).toBeDefined();
      expect(result!.id).toBe('dup-1');
    });
  });
});

// ────────────────────────────────────────────
// MasterData Operations (list/set/add)
// Note: MasterData record CRUD (addRecord,
// updateRecord, deleteRecord, toggleStatus)
// is already tested in ontology-store-extended.spec.ts
// ────────────────────────────────────────────

describe('MasterData Operations', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── setMasterDataList ───────────────────────

  describe('setMasterDataList', () => {
    it('should set masterDataList from empty to a populated list', () => {
      const store = useOntologyStore.getState();
      store.setMasterDataList([mockMasterDataDef]);
      expect(useOntologyStore.getState().masterDataList).toHaveLength(1);
      expect(useOntologyStore.getState().masterDataList[0].id).toBe('mdd-1');
    });

    it('should replace the entire list', () => {
      const store = useOntologyStore.getState();
      store.setMasterDataList([mockMasterDataDef]);
      store.setMasterDataList([mockMasterDataDef2]);
      expect(useOntologyStore.getState().masterDataList).toHaveLength(1);
      expect(useOntologyStore.getState().masterDataList[0].id).toBe('mdd-2');
    });

    it('should set an empty list', () => {
      const store = useOntologyStore.getState();
      store.setMasterDataList([mockMasterDataDef]);
      store.setMasterDataList([]);
      expect(useOntologyStore.getState().masterDataList).toEqual([]);
    });
  });

  // ── setMasterDataRecords ────────────────────

  describe('setMasterDataRecords', () => {
    it('should set masterDataRecords map', () => {
      const store = useOntologyStore.getState();
      store.setMasterDataRecords({ 'mdd-1': [mockRecord1] });
      const records = useOntologyStore.getState().masterDataRecords;
      expect(records['mdd-1']).toHaveLength(1);
      expect(records['mdd-1'][0].id).toBe('rec-1');
    });

    it('should replace the entire records map', () => {
      const store = useOntologyStore.getState();
      const rec2: MasterDataRecord = {
        ...mockRecord1,
        id: 'rec-2',
        values: { '客户编码': 'C-002' },
      };
      store.setMasterDataRecords({ 'mdd-1': [mockRecord1] });
      store.setMasterDataRecords({ 'mdd-2': [rec2] }); // replace
      const records = useOntologyStore.getState().masterDataRecords;
      expect(Object.keys(records)).toEqual(['mdd-2']);
    });

    it('should set an empty records map', () => {
      const store = useOntologyStore.getState();
      store.setMasterDataRecords({ 'mdd-1': [mockRecord1] });
      store.setMasterDataRecords({});
      expect(useOntologyStore.getState().masterDataRecords).toEqual({});
    });
  });

  // ── addMasterData ───────────────────────────

  describe('addMasterData', () => {
    it('should append a master data definition to empty list', () => {
      const store = useOntologyStore.getState();
      store.addMasterData(mockMasterDataDef);
      expect(useOntologyStore.getState().masterDataList).toHaveLength(1);
      expect(useOntologyStore.getState().masterDataList[0]).toEqual(mockMasterDataDef);
    });

    it('should append to an existing list', () => {
      const store = useOntologyStore.getState();
      store.setMasterDataList([mockMasterDataDef]);
      store.addMasterData(mockMasterDataDef2);
      const list = useOntologyStore.getState().masterDataList;
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe('mdd-1');
      expect(list[1].id).toBe('mdd-2');
    });

    it('should handle duplicate IDs (append regardless)', () => {
      const store = useOntologyStore.getState();
      store.addMasterData(mockMasterDataDef);
      store.addMasterData({ ...mockMasterDataDef });
      expect(useOntologyStore.getState().masterDataList).toHaveLength(2);
    });
  });
});
