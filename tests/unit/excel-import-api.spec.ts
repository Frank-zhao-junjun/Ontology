import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/excel-import/route';
import type { ExcelImportResult } from '@/types/ontology';
import * as XLSX from 'xlsx';

const SHEET_HEADERS: Record<string, string[]> = {
  '实体': ['实体名称(必填)', '英文名称(必填)', '实体角色', '父聚合ID', '项目名称', '业务场景', '描述', '业务含义', '同义词(逗号分隔)'],
  '属性': ['实体英文名称(必填)', '属性名称(必填)', '英文名称(必填)', '数据类型(必填)', '必填', '唯一', '长度'],
  '关系': ['源实体英文名称(必填)', '关系名称(必填)', '关系类型(必填)', '目标实体英文名称(必填)'],
  '状态机': ['实体英文名称(必填)', '状态机名称(必填)', '状态字段', '状态名称(必填)'],
  '规则': ['实体英文名称(必填)', '规则名称(必填)', '规则类型(必填)', '字段', '条件类型', '条件值', '严重程度', '错误消息(必填)'],
  '事件': ['实体英文名称(必填)', '事件名称(必填)', '英文名称', '触发时机(必填)', '条件', '事务阶段', '领域事件', '载荷字段(逗号分隔)', '描述'],
};

function buildWorkbook(rowsBySheet: Record<string, unknown[][]>) {
  const workbook = XLSX.utils.book_new();
  for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
    const rows = rowsBySheet[sheetName] || [];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

async function importWorkbook(rowsBySheet: Record<string, unknown[][]>) {
  const formData = new FormData();
  const file = new File([buildWorkbook(rowsBySheet)], 'ontology.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  formData.append('file', file);

  const response = await POST(new Request('http://localhost/api/excel-import', {
    method: 'POST',
    body: formData,
  }) as never);

  return response.json() as Promise<ExcelImportResult>;
}

describe('Excel import API', () => {
  it('returns parsed events under the ExcelParsedData events contract', async () => {
    const result = await importWorkbook({
      '实体': [['合同', 'Contract', 'aggregate_root', '', '合同中心', '合同签订']],
      '事件': [['Contract', '合同已创建', 'ContractCreated', 'create', '', '', 'true', 'id,contractNo']],
    });

    expect(result.success).toBe(true);
    expect(result.parsedData?.events).toEqual([
      expect.objectContaining({
        entityNameEn: 'Contract',
        name: '合同已创建',
        nameEn: 'ContractCreated',
        trigger: 'create',
        payloadFields: ['id', 'contractNo'],
      }),
    ]);
    expect((result.parsedData as unknown as { eventDefinitions?: unknown })?.eventDefinitions).toBeUndefined();
  });

  it('rejects a workbook with no real entity rows', async () => {
    const result = await importWorkbook({});

    expect(result.success).toBe(false);
    expect(result.validation.errorCount).toBeGreaterThan(0);
    expect(result.errorMessage).toContain('至少需要填写一个实体');
  });

  it('rejects duplicate entity English names before model parsing', async () => {
    const result = await importWorkbook({
      '实体': [
        ['合同', 'Contract', 'aggregate_root', '', '合同中心', '合同签订'],
        ['合同副本', 'Contract', 'aggregate_root', '', '合同中心', '合同签订'],
      ],
    });

    expect(result.success).toBe(false);
    expect(result.validation.errors).toEqual([
      expect.objectContaining({
        sheet: '实体',
        row: 3,
        column: '英文名称(必填)',
        value: 'Contract',
        errorType: 'duplicate',
      }),
    ]);
  });

  it('rejects relation source and target references missing from the entity sheet', async () => {
    const result = await importWorkbook({
      '实体': [['合同', 'Contract', 'aggregate_root', '', '合同中心', '合同签订']],
      '关系': [
        ['MissingSource', '错误源关系', 'one_to_many', 'Contract'],
        ['Contract', '错误目标关系', 'one_to_many', 'MissingTarget'],
      ],
    });

    expect(result.success).toBe(false);
    expect(result.validation.errors).toEqual([
      expect.objectContaining({
        sheet: '关系',
        row: 2,
        column: '源实体英文名称(必填)',
        value: 'MissingSource',
        errorType: 'invalid_reference',
      }),
      expect.objectContaining({
        sheet: '关系',
        row: 3,
        column: '目标实体英文名称(必填)',
        value: 'MissingTarget',
        errorType: 'invalid_reference',
      }),
    ]);
  });

  it('rejects child entities whose parent aggregate English name is invalid', async () => {
    const result = await importWorkbook({
      '实体': [
        ['合同明细', 'ContractLine', 'child_entity', 'MissingContract', '合同中心', '合同签订'],
      ],
    });

    expect(result.success).toBe(false);
    expect(result.validation.errors).toEqual([
      expect.objectContaining({
        sheet: '实体',
        row: 2,
        column: '父聚合ID',
        value: 'MissingContract',
        errorType: 'invalid_reference',
      }),
    ]);
  });

  it('defaults blank event optional fields and validates invalid event options', async () => {
    const defaulted = await importWorkbook({
      '实体': [['合同', 'Contract', 'aggregate_root', '', '合同中心', '合同签订']],
      '事件': [['Contract', '合同已创建', 'ContractCreated', 'create', '', '', '', 'id']],
    });

    expect(defaulted.success).toBe(true);
    expect(defaulted.parsedData?.events[0]).toEqual(expect.objectContaining({
      transactionPhase: 'AFTER_COMMIT',
      isDomainEvent: true,
    }));

    const invalid = await importWorkbook({
      '实体': [['合同', 'Contract', 'aggregate_root', '', '合同中心', '合同签订']],
      '事件': [['Contract', '合同已创建', 'ContractCreated', 'create', '', 'MIDDLE_COMMIT', 'yes', 'id']],
    });

    expect(invalid.success).toBe(false);
    expect(invalid.validation.errors).toEqual([
      expect.objectContaining({
        sheet: '事件',
        row: 2,
        column: '事务阶段',
        value: 'MIDDLE_COMMIT',
        errorType: 'invalid_enum',
      }),
      expect.objectContaining({
        sheet: '事件',
        row: 2,
        column: '领域事件',
        value: 'yes',
        errorType: 'invalid_type',
      }),
    ]);
  });

  it('parses native Excel boolean and numeric cells without crashing', async () => {
    const result = await importWorkbook({
      '实体': [['合同', 'Contract', 'aggregate_root', '', '合同中心', '合同签订']],
      '属性': [['Contract', '合同编号', 'contractNo', 'string', true, false, 50]],
      '事件': [['Contract', '合同已创建', 'ContractCreated', 'create', '', 'AFTER_COMMIT', true, 'id']],
    });

    expect(result.success).toBe(true);
    expect(result.parsedData?.attributes[0]).toEqual(expect.objectContaining({
      required: true,
      unique: false,
      length: 50,
    }));
    expect(result.parsedData?.events[0]).toEqual(expect.objectContaining({
      isDomainEvent: true,
      transactionPhase: 'AFTER_COMMIT',
    }));
  });
});
