import { beforeEach, describe, expect, it, vi } from 'vitest';

// ==================== Mock xlsx ====================
const mockBookNew = vi.fn(() => ({}));
const mockAoaToSheet = vi.fn(() => ({ '!cols': [] }));
const mockBookAppendSheet = vi.fn();
const mockWrite = vi.fn(() => Buffer.from('mock-xlsx-buffer'));

vi.mock('xlsx', () => ({
  utils: {
    book_new: mockBookNew,
    aoa_to_sheet: mockAoaToSheet,
    book_append_sheet: mockBookAppendSheet,
  },
  write: mockWrite,
}));

import { GET } from '@/app/api/excel-template/route';

describe('GET /api/excel-template', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with XLSX buffer', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const buffer = await res.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    expect(text).toBe('mock-xlsx-buffer');
    expect(mockWrite).toHaveBeenCalled();
  });

  it('returns correct Content-Type header', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('returns correct Content-Disposition header with filename', async () => {
    const res = await GET();
    const disposition = res.headers.get('Content-Disposition');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('ontology-import-template.xlsx');
  });

  it('creates 12 sheets: 填寫說明 + 11 data sheets', async () => {
    await GET();
    // 填写说明 sheet + 11 data sheets = 12
    expect(mockBookAppendSheet).toHaveBeenCalledTimes(12);
  });

  it('calls xlsx.write with buffer type', async () => {
    await GET();
    expect(mockWrite).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ type: 'buffer', bookType: 'xlsx' }),
    );
  });
});
