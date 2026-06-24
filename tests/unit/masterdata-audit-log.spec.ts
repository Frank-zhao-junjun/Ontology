import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseFieldNames } from '@/lib/masterdata/field-parser';
import { createEmptyMasterDataRecord } from '@/lib/masterdata/record-factory';
import { useOntologyStore } from '@/store/ontology-store';

describe('US-8.3: MasterData 审计日志与版本控制', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('应在更新和停用记录时自动更新审计日志 (updatedAt)', () => {
    const fields = parseFieldNames('物料编码,物料名称,状态');
    
    vi.setSystemTime(new Date('2026-04-20T10:00:00.000Z'));
    const record = createEmptyMasterDataRecord('MATERIAL', fields);

    expect(record.definitionId).toBe('MATERIAL');
    expect(record.createdAt).toBe('2026-04-20T10:00:00.000Z');
    expect(record.updatedAt).toBe('2026-04-20T10:00:00.000Z');

    // MOCK 初始化仓库
    useOntologyStore.setState({
      masterDataRecords: { 'MATERIAL': [record] }
    });
    
    // 操作1：内容更新，应自动更新 updatedAt
    vi.setSystemTime(new Date('2026-04-21T12:00:00.000Z'));
    useOntologyStore.getState().updateMasterDataRecord('MATERIAL', record.id, {
      values: { ...record.values, '物料编码': 'M001' }
    });
    
    const updatedRecord = useOntologyStore.getState().masterDataRecords['MATERIAL'][0];
    expect(updatedRecord.values['物料编码']).toBe('M001');
    expect(updatedRecord.updatedAt).toBe('2026-04-21T12:00:00.000Z');
    expect(updatedRecord.createdAt).toBe('2026-04-20T10:00:00.000Z'); // createdAt 保持不变
    
    // 操作2：启停操作，应自动更新 updatedAt
    vi.setSystemTime(new Date('2026-04-22T15:00:00.000Z'));
    useOntologyStore.getState().toggleMasterDataRecordStatus('MATERIAL', record.id);
    
    const toggledRecord = useOntologyStore.getState().masterDataRecords['MATERIAL'][0];
    expect(toggledRecord.status).toBe('99');
    expect(toggledRecord.updatedAt).toBe('2026-04-22T15:00:00.000Z');
    expect(toggledRecord.createdAt).toBe('2026-04-20T10:00:00.000Z'); // createdAt 保持不变
    
    vi.useRealTimers();
  });
});