import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock xlsx module ====================

/** Helper: build a mock sheet that sheet_to_json returns data for */
function makeSheet(data: Record<string, string>[]): Record<string, unknown> {
  return { _data: data };
}

interface MockSheetDef {
  name: string;
  data?: Record<string, string>[];
}

function createMockWorkbook(sheets: MockSheetDef[]) {
  const sheetMap: Record<string, ReturnType<typeof makeSheet>> = {};
  for (const s of sheets) {
    sheetMap[s.name] = makeSheet(s.data || []);
  }
  return {
    SheetNames: sheets.filter(s => !s.name.startsWith('_')).map(s => s.name),
    Sheets: sheetMap,
  };
}

const xlsxState = vi.hoisted(() => ({
  workbook: createMockWorkbook([]),
  readCallCount: 0,
}));

vi.mock('xlsx', () => {
  function sheet_to_json(ws: Record<string, unknown>, opts?: Record<string, unknown>) {
    const data = (ws._data as Record<string, string>[]) || [];
    if (opts && (opts as Record<string, unknown>).header === 1) {
      // Return 2D array with all rows as arrays
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      return [headers, ...data.map(r => headers.map(h => r[h] || ''))];
    }
    // Default (with defval): return array of objects
    return data;
  }

  return {
    read: vi.fn((_buffer: unknown, _opts: unknown) => {
      xlsxState.readCallCount++;
      return xlsxState.workbook;
    }),
    utils: {
      sheet_to_json,
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
      aoa_to_sheet: vi.fn(() => ({})),
      write: vi.fn(() => Buffer.from('mock-xlsx')),
    },
  };
});

import { POST } from './route';

// ==================== Test Data Builders ====================

/**
 * Build a full row for each sheet with ALL columns expected by the template,
 * matching the SHEET_HEADER_MAP column indices. Empty values for optional fields.
 */

function entityRow(name: string, nameEn: string, role = 'aggregate_root'): Record<string, string> {
  return {
    '实体名称(必填)': name,
    '英文名称(必填)': nameEn,
    '实体角色': role,
    '父聚合ID': '',
    '项目名称': '',
    '业务场景': '',
    '描述': '',
    '业务含义': '',
    '同义词(逗号分隔)': '',
  };
}

function attrRow(entityNameEn: string, name: string, nameEn: string, dataType: string): Record<string, string> {
  return {
    '实体英文名称(必填)': entityNameEn,
    '属性名称(必填)': name,
    '英文名称(必填)': nameEn,
    '数据类型(必填)': dataType,
    '必填': '',
    '唯一': '',
    '长度': '',
    '精度': '',
    '小数位': '',
    '默认值': '',
    '引用实体英文名': '',
    '引用类型': '',
    '主数据类型': '',
    '枚举引用': '',
    '描述': '',
    '业务含义': '',
    '元数据模板名': '',
  };
}

function relRow(source: string, name: string, type: string, target: string): Record<string, string> {
  return {
    '源实体英文名称(必填)': source,
    '关系名称(必填)': name,
    '关系类型(必填)': type,
    '目标实体英文名称(必填)': target,
    '外键字段': '',
    '中间实体': '',
    '级联': '',
    '递归关系': '',
    '方向性': '',
    '描述': '',
  };
}

function smRow(entityNameEn: string, smName: string, stateName: string): Record<string, string> {
  return {
    '实体英文名称(必填)': entityNameEn,
    '状态机名称(必填)': smName,
    '状态字段': '',
    '状态名称(必填)': stateName,
    '是否初始状态': '',
    '是否终止状态': '',
    '转换名称': '',
    '转换从→到': '',
    '触发类型': '',
  };
}

function ruleRow(entityNameEn: string, name: string, type: string, errorMessage: string): Record<string, string> {
  return {
    '实体英文名称(必填)': entityNameEn,
    '规则名称(必填)': name,
    '规则类型(必填)': type,
    '字段': '',
    '条件类型': '',
    '条件值': '',
    '严重程度': '',
    '错误消息(必填)': errorMessage,
    '优先级': '',
    '启用': '',
    '描述': '',
  };
}

function eventRow(entityNameEn: string, name: string, trigger: string): Record<string, string> {
  return {
    '实体英文名称(必填)': entityNameEn,
    '事件名称(必填)': name,
    '英文名称': '',
    '触发时机(必填)': trigger,
    '条件': '',
    '事务阶段': '',
    '领域事件': '',
    '载荷字段(逗号分隔)': '',
    '描述': '',
  };
}

/** Set up a workbook with valid data for all 6 required sheets */
function setupValidWorkbook(): void {
  xlsxState.workbook = createMockWorkbook([
    { name: '实体', data: [entityRow('物料', 'Material', 'aggregate_root')] },
    { name: '属性', data: [attrRow('Material', '物料编码', 'materialCode', 'string')] },
    { name: '关系', data: [relRow('Material', '包含BOM项', 'one_to_many', 'BomItem')] },
    { name: '状态机', data: [smRow('Material', '物料生命周期', '草稿;已发布')] },
    { name: '规则', data: [ruleRow('Material', '编码校验', 'field_validation', '格式错误')] },
    { name: '事件', data: [eventRow('Material', '物料已创建', 'create')] },
  ]);
}

/** Create a NextRequest with a file upload */
function makeUploadRequest(fileContent = 'dummy', filename = 'test.xlsx'): NextRequest {
  const form = new FormData();
  const file = new File([fileContent], filename, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  form.append('file', file);
  return new NextRequest('http://localhost/api/excel-import', {
    method: 'POST',
    body: form,
  });
}

function makeTextUploadRequest(): NextRequest {
  const form = new FormData();
  const file = new File(['not excel'], 'test.txt', { type: 'text/plain' });
  form.append('file', file);
  return new NextRequest('http://localhost/api/excel-import', {
    method: 'POST',
    body: form,
  });
}

// ==================== Tests ====================

describe('Excel Import Route (POST /api/excel-import)', () => {
  beforeEach(() => {
    xlsxState.readCallCount = 0;
    setupValidWorkbook();
  });

  // ==================== 1. Request Validation ====================

  describe('request validation', () => {
    it('缺少文件时应返回 400', async () => {
      const form = new FormData();
      const request = new NextRequest('http://localhost/api/excel-import', {
        method: 'POST',
        body: form,
      });

      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.errorMessage).toBe('未上传文件');
    });

    it('非 xlsx 文件应返回 400', async () => {
      const request = makeTextUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.errorMessage).toContain('.xlsx');
    });

    it('超大文件应返回 400', async () => {
      const bigContent = Buffer.alloc(6 * 1024 * 1024).toString('hex');
      const form = new FormData();
      const file = new File([bigContent], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      form.append('file', file);

      const request = new NextRequest('http://localhost/api/excel-import', {
        method: 'POST',
        body: form,
      });

      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.errorMessage).toContain('5MB');
    });
  });

  // ==================== 2. Sheet Validation ====================

  describe('sheet validation', () => {
    it('缺少必需 Sheet 时应返回 400', async () => {
      xlsxState.workbook = createMockWorkbook([
        { name: '属性', data: [] },
        // Missing: 实体 (the only required sheet)
      ]);

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.errorMessage).toContain('缺少必需的Sheet');
      expect(payload.validation).toBeDefined();
    });

    it('包含 填写说明 sheet 时应被忽略且不报错', async () => {
      xlsxState.workbook = createMockWorkbook([
        { name: '填写说明', data: [] },
        { name: '实体', data: [entityRow('物料', 'Material')] },
        { name: '属性', data: [attrRow('Material', '编码', 'code', 'string')] },
        { name: '关系', data: [relRow('Material', 'R1', 'one_to_many', 'BomItem')] },
        { name: '状态机', data: [smRow('Material', 'SM1', '草稿')] },
        { name: '规则', data: [ruleRow('Material', '编码校验', 'field_validation', '格式错误')] },
        { name: '事件', data: [eventRow('Material', '已创建', 'create')] },
      ]);

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
    });
  });

  // ==================== 3. Data Validation ====================

  describe('data validation', () => {
    it('必填字段缺失时应返回校验错误', async () => {
      xlsxState.workbook = createMockWorkbook([
        { name: '实体', data: [{ ...entityRow('物料', ''), '英文名称(必填)': '' }] },
        { name: '属性', data: [attrRow('Material', '编码', 'code', 'string')] },
        { name: '关系', data: [relRow('Material', 'R1', 'one_to_many', 'BomItem')] },
        { name: '状态机', data: [smRow('Material', 'SM1', '草稿')] },
        { name: '规则', data: [ruleRow('Material', '编码校验', 'field_validation', '格式错误')] },
        { name: '事件', data: [eventRow('Material', '已创建', 'create')] },
      ]);

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(false);
      expect(payload.errorMessage).toContain('校验发现');
      expect(payload.validation.errorCount).toBeGreaterThan(0);
      expect(payload.validation.errors[0].errorType).toBe('missing_required');
    });

    it('枚举值不在允许范围内时应返回校验错误', async () => {
      xlsxState.workbook = createMockWorkbook([
        { name: '实体', data: [entityRow('物料', 'Material', 'invalid_role')] },
        { name: '属性', data: [attrRow('Material', '编码', 'code', 'string')] },
        { name: '关系', data: [relRow('Material', 'R1', 'one_to_many', 'BomItem')] },
        { name: '状态机', data: [smRow('Material', 'SM1', '草稿')] },
        { name: '规则', data: [ruleRow('Material', '编码校验', 'field_validation', '格式错误')] },
        { name: '事件', data: [eventRow('Material', '已创建', 'create')] },
      ]);

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(false);
      expect(payload.validation.errorCount).toBeGreaterThan(0);
      expect(payload.validation.errors.some((e: { errorType: string }) => e.errorType === 'invalid_enum')).toBe(true);
    });
  });

  // ==================== 4. Success Response ====================

  describe('success response', () => {
    it('有效数据应返回成功结果', async () => {
      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.validation).toBeDefined();
      expect(typeof payload.validation.totalRows).toBe('number');
      expect(typeof payload.validation.validRows).toBe('number');
      expect(typeof payload.validation.errorCount).toBe('number');
      expect(Array.isArray(payload.validation.errors)).toBe(true);
      expect(payload.versionId).toBeDefined();
      expect(typeof payload.versionId).toBe('string');
      expect(payload.versionName).toBeDefined();
      expect(typeof payload.versionName).toBe('string');
      expect(payload.parsedData).toBeDefined();
      expect(payload.parsedData.entities).toBeDefined();
      expect(payload.parsedData.attributes).toBeDefined();
      expect(payload.parsedData.relations).toBeDefined();
    });

    it('可选 sheet 不存在时仍应成功', async () => {
      // Only required 6 sheets, no optional sheets (部门, 岗位, 指标, 边界约束, 数据源)
      xlsxState.workbook = createMockWorkbook([
        { name: '实体', data: [entityRow('物料', 'Material')] },
        { name: '属性', data: [attrRow('Material', '编码', 'code', 'string')] },
        { name: '关系', data: [relRow('Material', 'R1', 'one_to_many', 'BomItem')] },
        { name: '状态机', data: [smRow('Material', 'SM1', '草稿')] },
        { name: '规则', data: [ruleRow('Material', '编码校验', 'field_validation', '格式错误')] },
        { name: '事件', data: [eventRow('Material', '已创建', 'create')] },
      ]);

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
    });

    it('描述行和示例行应被忽略', async () => {
      xlsxState.workbook = createMockWorkbook([
        {
          name: '实体',
          data: [
            { ...entityRow('#DESC#实体名称', '#DESC#英文名称') },
            { ...entityRow('#EXAMPLE#物料', 'Material') },
            entityRow('合同', 'Contract'),
          ],
        },
        { name: '属性', data: [attrRow('Contract', '名称', 'name', 'string')] },
        { name: '关系', data: [relRow('Contract', 'R1', 'one_to_many', 'BomItem')] },
        { name: '状态机', data: [smRow('Contract', 'SM1', '草稿')] },
        { name: '规则', data: [ruleRow('Contract', '编码校验', 'field_validation', '格式错误')] },
        { name: '事件', data: [eventRow('Contract', '已创建', 'create')] },
      ]);

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      // Only 合同 row should be counted; #DESC# and #EXAMPLE# rows are skipped
      expect(payload.parsedData.entities).toHaveLength(1);
      expect(payload.parsedData.entities[0].nameEn).toBe('Contract');
    });
  });

  // ==================== 5. Error Handling ====================

  describe('error handling', () => {
    it('xlsx 读取失败时应返回 500', async () => {
      const mockXlsx = await vi.mocked(await import('xlsx'));
      (mockXlsx.read as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('Corrupted file');
      });

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload.success).toBe(false);
      expect(payload.errorMessage).toContain('导入失败');
    });

    it('跨 Sheet 引用无效时应返回校验错误', async () => {
      xlsxState.workbook = createMockWorkbook([
        { name: '实体', data: [entityRow('物料', 'Material')] },
        {
          name: '属性',
          data: [attrRow('NonExistentEntity', '编码', 'code', 'string')],
        },
        { name: '关系', data: [relRow('Material', 'R1', 'one_to_many', 'BomItem')] },
        { name: '状态机', data: [smRow('Material', 'SM1', '草稿')] },
        { name: '规则', data: [ruleRow('Material', '编码校验', 'field_validation', '格式错误')] },
        { name: '事件', data: [eventRow('Material', '已创建', 'create')] },
      ]);

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(false);
      expect(payload.validation.errors.some((e: { errorType: string }) => e.errorType === 'invalid_reference')).toBe(true);
    });

    it('布尔字段类型校验: 非 true/false 值应报错', async () => {
      // 属性 sheet 中 必填 字段类型为 boolean，传入非 true/false 值
      xlsxState.workbook = createMockWorkbook([
        { name: '实体', data: [entityRow('物料', 'Material')] },
        {
          name: '属性',
          data: [{ ...attrRow('Material', '编码', 'code', 'string'), '必填': 'yes' }],
        },
        { name: '关系', data: [relRow('Material', 'R1', 'one_to_many', 'BomItem')] },
        { name: '状态机', data: [smRow('Material', 'SM1', '草稿')] },
        { name: '规则', data: [ruleRow('Material', '编码校验', 'field_validation', '格式错误')] },
        { name: '事件', data: [eventRow('Material', '已创建', 'create')] },
      ]);

      const request = makeUploadRequest();
      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(false);
      expect(payload.validation.errors.some((e: { errorType: string }) => e.errorType === 'invalid_type')).toBe(true);
    });
  });
});
