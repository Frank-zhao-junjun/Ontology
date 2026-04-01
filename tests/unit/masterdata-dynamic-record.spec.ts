import { describe, it, expect } from 'vitest';
import { parseFieldNames } from '@/lib/masterdata/field-parser';
import { createEmptyMasterDataRecord } from '@/lib/masterdata/record-factory';

describe('UT-MD-003: MasterData 动态记录映射正确', () => {
  it('应基于动态列生成空记录', () => {
    const fields = parseFieldNames('物料编码,物料名称,状态');
    const record = createEmptyMasterDataRecord('MATERIAL', fields);

    expect(record.definitionId).toBe('MATERIAL');
    expect(record.status).toBe('00');
    expect(record.values).toEqual({
      物料编码: '',
      物料名称: '',
      状态: '',
    });
  });
});
