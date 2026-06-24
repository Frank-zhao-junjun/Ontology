import { describe, it, expect } from 'vitest';
import { parseFieldNames } from '@/lib/masterdata/field-parser';

describe('UT-MD-002: MasterData 空字段/重复字段拦截', () => {
  it('字段清单为空时应抛错', () => {
    expect(() => parseFieldNames('')).toThrow('字段清单不合法');
  });

  it('存在空项时应抛错', () => {
    expect(() => parseFieldNames('物料编码,,状态')).toThrow('字段清单不合法');
  });

  it('存在重复字段时应抛错', () => {
    expect(() => parseFieldNames('物料编码,状态,物料编码')).toThrow('字段清单不合法');
  });
});
