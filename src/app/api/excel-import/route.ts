import { NextRequest, NextResponse } from 'next/server';
import type { AttributeDataType, ExcelImportResult, ExcelImportError, ExcelImportValidation, ExcelParsedData, RuleType } from '@/types/ontology';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EXPECTED_SHEETS = ['实体', '属性', '关系', '状态机', '规则', '事件'];
const SHEET_HEADER_MAP: Record<string, Record<number, { key: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[] }>> = {
  '实体': {
    0: { key: 'name', required: true, type: 'string' },
    1: { key: 'nameEn', required: true, type: 'string' },
    2: { key: 'entityRole', required: false, type: 'enum', enumValues: ['aggregate_root', 'child_entity'] },
    3: { key: 'parentAggregateId', required: false, type: 'string' },
    4: { key: 'projectName', required: false, type: 'string' },
    5: { key: 'businessScenarioName', required: false, type: 'string' },
    6: { key: 'description', required: false, type: 'string' },
    7: { key: 'businessMeaning', required: false, type: 'string' },
    8: { key: 'aliases', required: false, type: 'string' },
  },
  '属性': {
    0: { key: 'entityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    2: { key: 'nameEn', required: true, type: 'string' },
    3: { key: 'dataType', required: true, type: 'enum', enumValues: ['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'enum', 'reference'] },
    4: { key: 'required', required: false, type: 'boolean' },
    5: { key: 'unique', required: false, type: 'boolean' },
  },
  '关系': {
    0: { key: 'sourceEntityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    2: { key: 'type', required: true, type: 'enum', enumValues: ['one_to_one', 'one_to_many', 'many_to_many'] },
    3: { key: 'targetEntityNameEn', required: true, type: 'string' },
  },
  '状态机': {
    0: { key: 'entityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    2: { key: 'statusField', required: false, type: 'string' },
    3: { key: 'stateName', required: true, type: 'string' },
  },
  '规则': {
    0: { key: 'entityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    2: { key: 'type', required: true, type: 'enum', enumValues: ['field_validation', 'cross_field_validation', 'cross_entity_validation', 'aggregation_validation', 'temporal_rule'] },
    7: { key: 'errorMessage', required: true, type: 'string' },
  },
  '事件': {
    0: { key: 'entityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    3: { key: 'trigger', required: true, type: 'enum', enumValues: ['create', 'update', 'delete', 'state_change', 'custom'] },
  },
};

export async function POST(request: NextRequest) {
  const XLSX = await import('xlsx');
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, errorMessage: '未上传文件' } as ExcelImportResult, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ success: false, errorMessage: '仅支持 .xlsx 格式文件' } as ExcelImportResult, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, errorMessage: `文件大小超过5MB限制(当前${(file.size / 1024 / 1024).toFixed(1)}MB)` } as ExcelImportResult, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });

    // Sheet 结构校验
    const sheetNames = wb.SheetNames.filter(n => n !== '填写说明');
    const missingSheets = EXPECTED_SHEETS.filter(s => !sheetNames.includes(s));
    if (missingSheets.length > 0) {
      return NextResponse.json({
        success: false,
        errorMessage: `缺少必需的Sheet: ${missingSheets.join(', ')}`,
        validation: { totalRows: 0, validRows: 0, errorCount: 0, errors: [] },
      } as ExcelImportResult, { status: 400 });
    }

    // 逐 Sheet 逐行校验
    const allErrors: ExcelImportError[] = [];
    let totalRows = 0;
    const entityNameEns = new Set<string>();

    // 第一遍: 收集实体名
    const entitySheet = wb.Sheets['实体'];
    if (entitySheet) {
      const entityData = XLSX.utils.sheet_to_json<Record<string, string>>(entitySheet, { defval: '' });
      const seenEntityNameEns = new Set<string>();
      for (let i = 0; i < entityData.length; i++) {
        const row = entityData[i];
        const firstVal = Object.values(row)[0] || '';
        const firstStr = firstVal.toString();
        if (firstStr.startsWith('#DESC#') || firstStr.startsWith('#EXAMPLE#')) continue;

        const nameEn = row['英文名称(必填)'] || '';
        const trimmedNameEn = nameEn.trim();
        if (!trimmedNameEn) continue;
        if (seenEntityNameEns.has(trimmedNameEn)) {
          allErrors.push({
            sheet: '实体',
            row: i + 2,
            column: '英文名称(必填)',
            value: trimmedNameEn,
            errorType: 'duplicate',
            message: `第${i + 2}行: 英文名称"${trimmedNameEn}"重复`,
          });
          continue;
        }
        seenEntityNameEns.add(trimmedNameEn);
        entityNameEns.add(trimmedNameEn);
      }
    }

    // 第二遍: 校验每个 Sheet + 收集数据
    const sheetDataList: { name: string; headers: string[]; rows: Record<string, string>[] }[] = [];
    for (const sheetName of EXPECTED_SHEETS) {
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;

      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
      const colMap = SHEET_HEADER_MAP[sheetName] || {};
      const allRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      const headers = allRows[0] as string[];

      const validRows: Record<string, string>[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // 跳过描述行(以 #DESC# 开头的值)和示例行(以 #EXAMPLE# 开头)
        const firstVal = Object.values(row)[0] || '';
        const firstStr = firstVal.toString();
        if (firstStr.startsWith('#DESC#') || firstStr.startsWith('#EXAMPLE#')) continue;

        totalRows++;
        let hasError = false;

        for (const [colIdx, spec] of Object.entries(colMap)) {
          const colLabel = headers[Number(colIdx)];
          const value = (row[colLabel] || '').toString().trim();

          if (spec.required && !value) {
            allErrors.push({
              sheet: sheetName,
              row: i + 2,
              column: colLabel,
              value: '',
              errorType: 'missing_required',
              message: `第${i + 2}行: ${colLabel} 为必填字段`,
            });
            hasError = true;
            continue;
          }

          if (!value) continue;

          if (spec.type === 'enum' && spec.enumValues && !spec.enumValues.includes(value)) {
            allErrors.push({
              sheet: sheetName,
              row: i + 2,
              column: colLabel,
              value,
              errorType: 'invalid_enum',
              message: `第${i + 2}行: ${colLabel} 值"${value}"不在允许范围[${spec.enumValues.join('/')}]内`,
            });
            hasError = true;
          }

          if (spec.type === 'boolean' && !['true', 'false', ''].includes(value.toLowerCase())) {
            allErrors.push({
              sheet: sheetName,
              row: i + 2,
              column: colLabel,
              value,
              errorType: 'invalid_type',
              message: `第${i + 2}行: ${colLabel} 必须为 true 或 false`,
            });
            hasError = true;
          }
        }

        // 跨Sheet引用校验: 非实体Sheet中引用的实体英文名必须在实体Sheet中存在
        if (sheetName !== '实体') {
          const referenceKeys = sheetName === '关系'
            ? ['sourceEntityNameEn', 'targetEntityNameEn']
            : ['entityNameEn'];

          for (const referenceKey of referenceKeys) {
            const entityNameEnCol = Object.entries(colMap).find(([, s]) => s.key === referenceKey)?.[0];
            if (!entityNameEnCol) continue;

            const colLabel = headers[Number(entityNameEnCol)];
            const refName = (row[colLabel] || '').toString().trim();
            if (refName && !entityNameEns.has(refName)) {
              allErrors.push({
                sheet: sheetName,
                row: i + 2,
                column: colLabel,
                value: refName,
                errorType: 'invalid_reference',
                message: `第${i + 2}行: 实体"${refName}"在实体Sheet中不存在`,
              });
              hasError = true;
            }
          }
        }

        if (!hasError) validRows.push(row);
      }

      sheetDataList.push({ name: sheetName, headers, rows: validRows });
    }

    const validation: ExcelImportValidation = {
      totalRows,
      validRows: totalRows - new Set(allErrors.map(e => `${e.sheet}:${e.row}`)).size,
      errorCount: allErrors.length,
      errors: allErrors,
    };

    if (allErrors.length > 0) {
      return NextResponse.json({
        success: false,
        errorMessage: `校验发现${allErrors.length}个错误`,
        validation,
      } as ExcelImportResult, { status: 200 });
    }

    // 解析成功 - 生成版本ID + 解析数据
    const versionId = `v-${Date.now()}`;
    const versionName = `v${new Date().toISOString().slice(0, 10)}`;
    const parsedData = parseExcelToModels(sheetDataList);
    if (parsedData.entities.length === 0) {
      const emptyEntityError: ExcelImportError = {
        sheet: '实体',
        row: 2,
        column: '实体名称(必填)',
        value: '',
        errorType: 'missing_required',
        message: '至少需要填写一个实体',
      };
      return NextResponse.json({
        success: false,
        errorMessage: emptyEntityError.message,
        validation: {
          totalRows,
          validRows: 0,
          errorCount: 1,
          errors: [emptyEntityError],
        },
      } as ExcelImportResult, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      validation,
      versionId,
      versionName,
      parsedData,
    } as ExcelImportResult, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({
      success: false,
      errorMessage: `导入失败: ${message}`,
      validation: { totalRows: 0, validRows: 0, errorCount: 0, errors: [] },
    } as ExcelImportResult, { status: 500 });
  }
}

// ========== Excel 行数据 → 模型对象解析 ==========

interface SheetData {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
}

function parseExcelToModels(sheets: SheetData[]): ExcelParsedData {
  const entitySheet = sheets.find(s => s.name === '实体');
  const attrSheet = sheets.find(s => s.name === '属性');
  const relSheet = sheets.find(s => s.name === '关系');
  const smSheet = sheets.find(s => s.name === '状态机');
  const ruleSheet = sheets.find(s => s.name === '规则');
  const eventSheet = sheets.find(s => s.name === '事件');

  const entities = (entitySheet?.rows || []).map(row => ({
    name: (row['实体名称(必填)'] || '').trim(),
    nameEn: (row['英文名称(必填)'] || '').trim(),
    role: ((row['实体角色'] || 'aggregate_root').trim() || 'aggregate_root') as 'aggregate_root' | 'child_entity',
    parentAggregateId: (row['父聚合ID'] || '').trim() || undefined,
    projectName: (row['项目名称'] || '').trim() || undefined,
    businessScenario: (row['业务场景'] || '').trim() || undefined,
    description: (row['描述'] || '').trim() || undefined,
    businessMeaning: (row['业务含义'] || '').trim() || undefined,
    aliases: (row['同义词(逗号分隔)'] || '').trim()
      ? (row['同义词(逗号分隔)'] || '').split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
      : undefined,
  }));

  const attributes = (attrSheet?.rows || []).map(row => ({
    entityNameEn: (row['实体英文名称(必填)'] || '').trim(),
    name: (row['属性名称(必填)'] || '').trim(),
    nameEn: (row['英文名称(必填)'] || '').trim(),
    dataType: (row['数据类型(必填)'] || 'string').trim() as AttributeDataType,
    required: (row['必填'] || '').trim() === 'true',
    unique: (row['唯一'] || '').trim() === 'true',
    length: (row['长度'] || '').trim() ? Number(row['长度']) : undefined,
    precision: (row['精度'] || '').trim() ? Number(row['精度']) : undefined,
    scale: (row['小数位'] || '').trim() ? Number(row['小数位']) : undefined,
    defaultValue: (row['默认值'] || '').trim() || undefined,
    referencedEntityNameEn: (row['引用实体英文名'] || '').trim() || undefined,
    referenceType: ((row['引用类型'] || '').trim() || undefined) as ExcelParsedData['attributes'][number]['referenceType'],
    masterDataType: (row['主数据类型'] || '').trim() || undefined,
    enumRef: (row['枚举引用'] || '').trim() || undefined,
    description: (row['描述'] || '').trim() || undefined,
    businessMeaning: (row['业务含义'] || '').trim() || undefined,
    metadataTemplateName: (row['元数据模板名'] || '').trim() || undefined,
  }));

  const relations = (relSheet?.rows || []).map(row => ({
    sourceEntityNameEn: (row['源实体英文名称(必填)'] || '').trim(),
    name: (row['关系名称(必填)'] || '').trim(),
    type: (row['关系类型(必填)'] || 'one_to_many').trim() as 'one_to_one' | 'one_to_many' | 'many_to_many',
    targetEntityNameEn: (row['目标实体英文名称(必填)'] || '').trim(),
    foreignKey: (row['外键字段'] || '').trim() || undefined,
    intermediateEntity: (row['中间实体'] || '').trim() || undefined,
    cascade: (row['级联'] || 'none').trim() as 'none' | 'cascade' | 'set_null',
    recursive: (row['递归关系'] || '').trim() === 'true',
    directed: (row['方向性'] || '').trim() === 'directed',
    description: (row['描述'] || '').trim() || undefined,
  }));

  const stateMachines = parseStateMachines(smSheet?.rows || []);
  const rules = parseRules(ruleSheet?.rows || []);
  const events = parseEvents(eventSheet?.rows || []);

  return { entities, attributes, relations, stateMachines, rules, events };
}

function parseStateMachines(rows: Record<string, string>[]) {
  const groups = new Map<string, {
    entityNameEn: string;
    name: string;
    statusField: string;
    states: Array<{ name: string; isInitial: boolean; isTerminal: boolean }>;
    transitions: Array<{ name: string; from: string; to: string; triggerType: string }>;
  }>();

  for (const row of rows) {
    const entityNameEn = (row['实体英文名称(必填)'] || '').trim();
    const smName = (row['状态机名称(必填)'] || '').trim();
    const key = `${entityNameEn}:${smName}`;

    if (!groups.has(key)) {
      groups.set(key, {
        entityNameEn,
        name: smName,
        statusField: (row['状态字段'] || 'status').trim(),
        states: [],
        transitions: [],
      });
    }

    const group = groups.get(key)!;

    // Parse states (semicolon-separated)
    const stateNames = (row['状态名称(必填)'] || '').split(/[;；]/).map(s => s.trim()).filter(Boolean);
    const isInitial = (row['是否初始状态'] || '').trim();
    const isTerminal = (row['是否终止状态'] || '').trim();

    for (const sn of stateNames) {
      if (!group.states.find(s => s.name === sn)) {
        group.states.push({
          name: sn,
          isInitial: sn === isInitial,
          isTerminal: sn === isTerminal,
        });
      }
    }

    // Parse transitions (semicolon-separated)
    const transNames = (row['转换名称'] || '').split(/[;；]/).map(s => s.trim()).filter(Boolean);
    const transPaths = (row['转换从→到'] || '').split(/[;；]/).map(s => s.trim()).filter(Boolean);
    const triggerTypes = (row['触发类型'] || '').split(/[;；]/).map(s => s.trim()).filter(Boolean);

    for (let i = 0; i < transNames.length; i++) {
      const path = transPaths[i] || '';
      const [from = '', to = ''] = path.split(/[→>]/).map(s => s.trim());
      group.transitions.push({
        name: transNames[i],
        from,
        to,
        triggerType: triggerTypes[i] || 'manual',
      });
    }
  }

  return Array.from(groups.values());
}

function parseRules(rows: Record<string, string>[]) {
  return rows.map(row => ({
    entityNameEn: (row['实体英文名称(必填)'] || '').trim(),
    name: (row['规则名称(必填)'] || '').trim(),
    type: ((row['规则类型(必填)'] || 'field_validation').trim() || 'field_validation') as RuleType,
    field: (row['字段'] || '').trim() || undefined,
    conditionType: (row['条件类型'] || '').trim(),
    conditionValue: (row['条件值'] || '').trim() || undefined,
    severity: ((row['严重程度'] || 'error').trim() || 'error') as 'error' | 'warning' | 'info',
    errorMessage: (row['错误消息(必填)'] || '').trim(),
    priority: (row['优先级'] || '').trim() ? Number(row['优先级']) : undefined,
    enabled: (row['启用'] || 'true').trim() !== 'false',
    description: (row['描述'] || '').trim() || undefined,
  }));
}

function parseEvents(rows: Record<string, string>[]) {
  return rows.map(row => ({
    entityNameEn: (row['实体英文名称(必填)'] || '').trim(),
    name: (row['事件名称(必填)'] || '').trim(),
    nameEn: (row['英文名称'] || '').trim() || undefined,
    trigger: ((row['触发时机(必填)'] || 'create').trim() || 'create') as 'create' | 'update' | 'delete' | 'state_change' | 'custom',
    condition: (row['条件'] || '').trim() || undefined,
    transactionPhase: (row['事务阶段'] || '').trim() || undefined,
    isDomainEvent: (row['领域事件'] || '').trim() === 'true',
    payloadFields: (row['载荷字段(逗号分隔)'] || '').trim()
      ? (row['载荷字段(逗号分隔)'] || '').split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
      : undefined,
    description: (row['描述'] || '').trim() || undefined,
  }));
}
