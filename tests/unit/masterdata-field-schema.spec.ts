import { describe, it, expect } from 'vitest';
import { parseFieldNames } from '@/lib/masterdata/field-parser';

describe('UT-MD-001: MasterData 字段清单解析稳定性', () => {
  it('应按输入顺序解析字段清单', () => {
    const fields = parseFieldNames('物料编码,物料名称,状态');

    expect(fields).toHaveLength(3);
    expect(fields.map((field) => field.key)).toEqual(['物料编码', '物料名称', '状态']);
    expect(fields.map((field) => field.order)).toEqual([0, 1, 2]);
  });

  it('应兼容中文逗号并自动去空格', () => {
    const fields = parseFieldNames('供应商编码， 供应商名称 ， 状态');

    expect(fields.map((field) => field.label)).toEqual(['供应商编码', '供应商名称', '状态']);
  });
});
