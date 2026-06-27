import { describe, it, expect } from 'vitest';
import {
  parseFieldNames,
  tryParseFieldNames,
  buildRecordValues,
} from '@/lib/masterdata/field-parser';
import type { MasterDataField } from '@/types/ontology';

// ============================================================
// parseFieldNames
// ============================================================

describe('parseFieldNames', () => {
  // TC-1
  it('should parse comma-separated field names', () => {
    const result = parseFieldNames('字段A,字段B,字段C');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ key: '字段A', label: '字段A', order: 0 });
    expect(result[1]).toEqual({ key: '字段B', label: '字段B', order: 1 });
    expect(result[2]).toEqual({ key: '字段C', label: '字段C', order: 2 });
  });

  // TC-2
  it('should handle Chinese comma (，) as delimiter', () => {
    const result = parseFieldNames('名称，描述，备注');
    expect(result).toHaveLength(3);
    expect(result[0].key).toBe('名称');
    expect(result[1].key).toBe('描述');
    expect(result[2].key).toBe('备注');
  });

  // TC-3
  it('should throw on empty input', () => {
    expect(() => parseFieldNames('')).toThrow('字段清单不能为空');
  });

  // TC-4
  it('should throw on whitespace-only input', () => {
    expect(() => parseFieldNames('   ')).toThrow('字段清单不能为空');
  });

  // TC-5
  it('should throw on duplicate field names', () => {
    expect(() => parseFieldNames('重复,唯一,重复')).toThrow('存在重复字段：重复');
  });

  // TC-6
  it('should throw on empty segment between delimiters', () => {
    expect(() => parseFieldNames('a,,b')).toThrow('存在空字段');
  });
});

// ============================================================
// tryParseFieldNames
// ============================================================

describe('tryParseFieldNames', () => {
  // TC-7
  it('should return parsed fields on valid input', () => {
    const result = tryParseFieldNames('A,B,C');
    expect(result).toHaveLength(3);
    expect(result[0].key).toBe('A');
  });

  // TC-8
  it('should return empty array on invalid input instead of throwing', () => {
    const result = tryParseFieldNames('');
    expect(result).toEqual([]);
  });

  // TC-9
  it('should return empty array on duplicate input', () => {
    const result = tryParseFieldNames('x,x');
    expect(result).toEqual([]);
  });
});

// ============================================================
// buildRecordValues
// ============================================================

describe('buildRecordValues', () => {
  // TC-10
  it('should build empty record for empty fields array', () => {
    const result = buildRecordValues([]);
    expect(result).toEqual({});
  });

  // TC-11
  it('should build a record with empty strings keyed by field keys', () => {
    const fields: MasterDataField[] = [
      { key: 'name', label: '名称', order: 0 },
      { key: 'desc', label: '描述', order: 1 },
    ];
    const result = buildRecordValues(fields);
    expect(result).toEqual({ name: '', desc: '' });
  });

  // TC-12
  it('should preserve field order in iteration', () => {
    const fields: MasterDataField[] = [
      { key: 'z', label: 'Z', order: 2 },
      { key: 'a', label: 'A', order: 0 },
      { key: 'm', label: 'M', order: 1 },
    ];
    const result = buildRecordValues(fields);
    const keys = Object.keys(result);
    expect(keys).toEqual(['z', 'a', 'm']);
  });
});
