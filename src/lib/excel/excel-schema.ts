import type { ModuleKind } from '@/types/ontology';

/** 列定义 */
export interface ExcelColumnDef {
  key: string;
  header: string;
  type: 'string' | 'json' | 'enum';
  required: boolean;
  enumValues?: string[];
  description?: string;
}

/** Sheet 配置 */
export interface ExcelSheetConfig {
  moduleKind: ModuleKind | '_REF';
  sheetName: string;
  columns: ExcelColumnDef[];
  hidden?: boolean;
}

/** 导入行数据 */
export interface ExcelModuleRow {
  moduleKind: ModuleKind | '_REF';
  moduleId: string;
  data: Record<string, unknown>;
}

/** 校验警告 */
export interface ValidationWarning {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

/** 导入变更项 */
export interface ImportChangeItem {
  moduleKind: ModuleKind;
  moduleId: string;
  action: 'new_draft' | 'update_draft' | 'placeholder_draft';
  existingStatus?: 'draft' | 'confirmed' | 'archived';
  row: number;
}

/** 导入预览 */
export interface ImportPreview {
  changes: ImportChangeItem[];
  warnings: ValidationWarning[];
  rows: ExcelModuleRow[];
  summary: {
    newDrafts: number;
    updatedDrafts: number;
    placeholderDrafts: number;
    warningCount: number;
  };
}

// ── 通用列 ──

const ID_COL: ExcelColumnDef = { key: 'id', header: 'ID', type: 'string', required: true };
const NAME_COL: ExcelColumnDef = { key: 'name', header: '名称', type: 'string', required: true };
const NAME_EN_COL: ExcelColumnDef = { key: 'nameEn', header: '英文名', type: 'string', required: false };
const DESC_COL: ExcelColumnDef = { key: 'description', header: '描述', type: 'string', required: false };
const SEMANTICS_COL: ExcelColumnDef = { key: 'semantics', header: '语义(JSON)', type: 'json', required: false };
const PARENT_ID_COL: ExcelColumnDef = { key: 'parentId', header: '父节点ID', type: 'string', required: true, description: '引用上级节点id，下拉选择' };
const DIMENSION_COL: ExcelColumnDef = { key: 'dimension', header: '维度', type: 'string', required: true, description: 'E1-E8' };
const VISIBILITY_COL: ExcelColumnDef = { key: 'visibility', header: '可见性', type: 'enum', required: false, enumValues: ['project', 'domain_scoped', 'private_draft'] };
const STEPS_COL: ExcelColumnDef = { key: 'steps', header: '步骤(JSON)', type: 'json', required: false, description: 'EPC步骤数组' };
const SCENARIO_ID_COL: ExcelColumnDef = { key: 'scenarioId', header: '归属场景ID', type: 'string', required: true, description: '所属C节点的id' };

// ── 可见 Sheet 配置 ──

export const EXCEL_SHEET_CONFIGS: ExcelSheetConfig[] = [
  {
    moduleKind: 'A', sheetName: 'A',
    columns: [ID_COL, NAME_COL, NAME_EN_COL, DESC_COL, SEMANTICS_COL],
  },
  {
    moduleKind: 'B', sheetName: 'B',
    columns: [ID_COL, NAME_COL, NAME_EN_COL, DESC_COL, SEMANTICS_COL, PARENT_ID_COL],
  },
  {
    moduleKind: 'C', sheetName: 'C',
    columns: [ID_COL, NAME_COL, NAME_EN_COL, DESC_COL, SEMANTICS_COL, PARENT_ID_COL],
  },
  {
    moduleKind: 'EPC', sheetName: 'EPC',
    columns: [ID_COL, NAME_COL, NAME_EN_COL, DESC_COL, SEMANTICS_COL, PARENT_ID_COL, SCENARIO_ID_COL, STEPS_COL],
  },
  ...(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'] as ModuleKind[]).map(
    (kind): ExcelSheetConfig => ({
      moduleKind: kind,
      sheetName: kind,
      columns: [ID_COL, NAME_COL, NAME_EN_COL, DIMENSION_COL, VISIBILITY_COL, DESC_COL],
    }),
  ),
];

// ── 隐藏引用表 ──

export const HIDDEN_REF_SHEET_CONFIG: ExcelSheetConfig = {
  moduleKind: '_REF',
  sheetName: '_要素引用表',
  columns: [
    { key: 'id', header: 'ID', type: 'string', required: true },
    { key: 'name', header: '名称', type: 'string', required: false },
    { key: 'dimension', header: '维度', type: 'string', required: false },
  ],
  hidden: true,
};

export const ALL_SHEET_CONFIGS: ExcelSheetConfig[] = [
  ...EXCEL_SHEET_CONFIGS,
  HIDDEN_REF_SHEET_CONFIG,
];

// ── 校验 ──

/**
 * 校验单行数据。
 * 返回 ValidationWarning[]；空数组 = 通过。
 */
export function validateModuleRow(
  row: Record<string, unknown>,
  config: ExcelSheetConfig,
  rowIndex: number,
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const sheet = config.sheetName;

  for (const col of config.columns) {
    const raw = row[col.key];
    const isEmpty =
      raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');

    // 必填检查
    if (col.required && isEmpty) {
      warnings.push({
        sheet,
        row: rowIndex,
        column: col.key,
        message: `"${col.header}" 为必填字段`,
      });
      continue;
    }

    if (isEmpty) continue;

    // JSON 列格式检查
    if (col.type === 'json' && typeof raw === 'string' && raw.trim() !== '') {
      try {
        JSON.parse(raw);
      } catch {
        warnings.push({
          sheet,
          row: rowIndex,
          column: col.key,
          message: `"${col.header}" JSON 格式错误`,
        });
      }
    }

    // enum 列检查
    if (col.type === 'enum' && col.enumValues && typeof raw === 'string') {
      if (!col.enumValues.includes(raw)) {
        warnings.push({
          sheet,
          row: rowIndex,
          column: col.key,
          message: `"${col.header}" 值不在允许范围内：${col.enumValues.join(', ')}`,
        });
      }
    }
  }

  return warnings;
}

/** 获取可见配置（不含隐藏 Sheet） */
export function getVisibleConfigs(): ExcelSheetConfig[] {
  return EXCEL_SHEET_CONFIGS;
}

/** 根据 moduleKind 获取配置 */
export function getConfigByKind(kind: ModuleKind | '_REF'): ExcelSheetConfig | undefined {
  return ALL_SHEET_CONFIGS.find((c) => c.moduleKind === kind);
}
