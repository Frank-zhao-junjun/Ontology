import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ==================== Mock xlsx ====================
// Route uses: const XLSX = await import('xlsx'); then XLSX.utils.* and XLSX.write()

const xlsxState = vi.hoisted(() => ({
  bookNewCallCount: 0,
  appendSheetCallCount: 0,
  writeCallCount: 0,
  lastWriteOpts: null as Record<string, unknown> | null,
}));

vi.mock('xlsx', () => {
  const mockSheet = { '!ref': 'A1:B2' };

  const mockWrite = vi.fn((_wb: unknown, opts: unknown) => {
    xlsxState.writeCallCount++;
    xlsxState.lastWriteOpts = opts as Record<string, unknown>;
    return Buffer.from('mock-xlsx-content');
  });

  return {
    write: mockWrite,
    utils: {
      book_new: vi.fn(() => {
        xlsxState.bookNewCallCount++;
        return {};
      }),
      book_append_sheet: vi.fn(() => {
        xlsxState.appendSheetCallCount++;
      }),
      aoa_to_sheet: vi.fn(() => mockSheet),
    },
  };
});

import { GET } from './route';

describe('Excel Template Route (GET /api/excel-template)', () => {
  beforeEach(() => {
    xlsxState.bookNewCallCount = 0;
    xlsxState.appendSheetCallCount = 0;
    xlsxState.writeCallCount = 0;
    xlsxState.lastWriteOpts = null;
  });

  it('应返回 200 状态码', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
  });

  it('应返回 xlsx Content-Type', async () => {
    const response = await GET();

    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('应设置 Content-Disposition 为附件下载', async () => {
    const response = await GET();

    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="ontology-import-template.xlsx"',
    );
  });

  it('应生成包含 填写说明 Sheet 的 workbook', async () => {
    await GET();

    // 11 data sheets + 1 instruction sheet = 12 sheets appended
    expect(xlsxState.appendSheetCallCount).toBe(12);
    expect(xlsxState.bookNewCallCount).toBe(1);
  });

  it('应使用 buffer 类型写入 workbook', async () => {
    await GET();

    expect(xlsxState.writeCallCount).toBe(1);
    expect(xlsxState.lastWriteOpts).toEqual(
      expect.objectContaining({ type: 'buffer', bookType: 'xlsx' }),
    );
  });

  it('应返回 NextResponse 实例', async () => {
    const response = await GET();

    expect(response).toBeInstanceOf(NextResponse);
  });
});
