import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock xlsx for reading ====================
const xlsxMockState = vi.hoisted(() => {
  const createMockSheet = (rows: string[][]) => {
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);
    const json = dataRows.map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] || '';
      });
      return obj;
    });
    const rawRows = [headers, ...dataRows];
    return {
      '!ref': `A1:${String.fromCharCode(64 + headers.length)}${rows.length}`,
      sheet_to_json_calls: [],
      _headers: headers,
      _rawRows: rawRows,
    };
  };

  return {
    read: vi.fn(),
    utils: {
      sheet_to_json: vi.fn(),
      aoa_to_sheet: vi.fn(() => ({})),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
    },
    write: vi.fn(() => Buffer.from('mock')),
  };
});

vi.mock('xlsx', () => ({
  read: xlsxMockState.read,
  utils: xlsxMockState.utils,
  write: xlsxMockState.write,
}));

import { POST } from '@/app/api/excel-import/route';

// Helper to build a mock file for formData
function createFile(content: string, filename: string, type: string): File {
  return new File([content], filename, { type });
}

function buildMockXlsx(sheets: Record<string, string[][]>) {
  const sheetNames = Object.keys(sheets);
  const sheetMap: Record<string, unknown> = {};
  for (const [name, rows] of Object.entries(sheets)) {
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);
    const jsonResult = dataRows.map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] || '';
      });
      return obj;
    });
    // Cast sheet_to_json to return different data based on params
    const sheet = {
      '!ref': `A1:${String.fromCharCode(64 + Math.max(headers.length, 1))}${rows.length}`,
    };
    sheetMap[name] = sheet;

    // We'll store the expected data per sheet name for the mock to return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sheetMap as Record<string, any>)[`__json_${name}`] = jsonResult;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sheetMap as Record<string, any>)[`__raw_${name}`] = rows;
  }

  return { SheetNames: sheetNames, Sheets: sheetMap };
}

describe('POST /api/excel-import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when file is missing', async () => {
    const form = new FormData();
    const req = new NextRequest('http://localhost/api/excel-import', {
      method: 'POST',
      body: form,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.errorMessage).toContain('未上传文件');
  });

  it('returns 400 when file is not .xlsx', async () => {
    const form = new FormData();
    form.append('file', new File(['data'], 'test.xls', { type: 'application/vnd.ms-excel' }));
    const req = new NextRequest('http://localhost/api/excel-import', {
      method: 'POST',
      body: form,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.errorMessage).toContain('.xlsx');
  });

  it('returns 400 when file exceeds 5MB', async () => {
    const bigBuf = Buffer.alloc(6 * 1024 * 1024);
    const form = new FormData();
    form.append('file', new File([bigBuf], 'large.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const req = new NextRequest('http://localhost/api/excel-import', {
      method: 'POST',
      body: form,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.errorMessage).toContain('5MB');
  });

  it('returns 400 when required sheets are missing', async () => {
    xlsxMockState.read.mockReturnValueOnce({
      SheetNames: ['填写说明', '部门'],
      Sheets: {
        '填写说明': {},
        '部门': {},
      },
    });
    xlsxMockState.utils.sheet_to_json.mockReturnValue([]);

    const form = new FormData();
    form.append('file', new File(['dummy'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const req = new NextRequest('http://localhost/api/excel-import', {
      method: 'POST',
      body: form,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.errorMessage).toContain('缺少必需的Sheet');
  });

  it('returns validation errors for missing required fields', async () => {
    // Build a valid mock xlsx with entities sheet but missing name
    const entityHeaders = ['实体名称(必填)', '英文名称(必填)', '实体角色'];
    const entityRows = [
      entityHeaders,
      ['', '', ''], // empty required fields
    ];

    // Mock xlsx.read return
    xlsxMockState.read.mockReturnValueOnce({
      SheetNames: ['实体', '属性', '关系', '状态机', '规则', '事件'],
      Sheets: {
        '实体': { '!ref': 'A1:C2' },
        '属性': { '!ref': 'A1:A1' },
        '关系': { '!ref': 'A1:A1' },
        '状态机': { '!ref': 'A1:A1' },
        '规则': { '!ref': 'A1:A1' },
        '事件': { '!ref': 'A1:A1' },
      },
    });

    // sheet_to_json returns different data per sheet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    xlsxMockState.utils.sheet_to_json.mockImplementation((ws: any, opts?: any) => {
      // header:1 returns raw rows
      if (opts?.header === 1) {
        // simplified: just return headers for lookup
        return [entityHeaders];
      }
      // default: return JSON rows
      if (ws === xlsxMockState.read.mock.results[0].value.Sheets['实体']) {
        return [{ '实体名称(必填)': '', '英文名称(必填)': '', '实体角色': '' }];
      }
      return [];
    });

    const form = new FormData();
    form.append('file', new File(['dummy'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const req = new NextRequest('http://localhost/api/excel-import', {
      method: 'POST',
      body: form,
    });
    const res = await POST(req);
    expect(res.status).toBe(200); // validation errors return 200
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.validation.errorCount).toBeGreaterThan(0);
  });

  it('returns 500 on unexpected error', async () => {
    xlsxMockState.read.mockImplementationOnce(() => {
      throw new Error('Unexpected parsing failure');
    });

    const form = new FormData();
    form.append('file', new File(['broken'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const req = new NextRequest('http://localhost/api/excel-import', {
      method: 'POST',
      body: form,
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.errorMessage).toContain('导入失败');
  });
});
