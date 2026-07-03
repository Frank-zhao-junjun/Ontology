import { utils, write } from 'xlsx';
import type {
  ModuleKind,
  ModuleVersionRecord,
  ValueDomain,
  Capability,
  Scenario,
  EpcProcess,
  MetaElement,
} from '@/types/ontology';
import {
  EXCEL_SHEET_CONFIGS,
  HIDDEN_REF_SHEET_CONFIG,
  type ExcelSheetConfig,
} from './excel-schema';
import { getLatestConfirmed, getConfirmedByVersion } from '@/lib/module-version';

// ── 类型 ──

export interface ExportExcelOptions {
  valueDomains: ValueDomain[];
  capabilities: Capability[];
  scenarios: Scenario[];
  epcProcesses: EpcProcess[];
  metaElements: MetaElement[];
  moduleVersionRecords: ModuleVersionRecord[];
  versionMap?: Partial<Record<ModuleKind, string>>;
}

// ── 模块数据提取 ──

interface ModuleDataEntry {
  kind: ModuleKind;
  id: string;
  snapshot: Record<string, unknown>;
}

function extractModules(options: ExportExcelOptions): ModuleDataEntry[] {
  const { moduleVersionRecords: records, versionMap } = options;
  const modules: ModuleDataEntry[] = [];

  // A/B/C/EPC 从 confirmed 记录提取
  for (const kind of ['A', 'B', 'C', 'EPC'] as ModuleKind[]) {
    const specifiedVersion = versionMap?.[kind];
    const kindRecords = records.filter((r) => r.moduleKind === kind);

    // 已确认版本按 moduleId 分组
    const byId = new Map<string, ModuleVersionRecord[]>();
    for (const r of kindRecords) {
      if (r.status === 'confirmed') {
        const list = byId.get(r.moduleId) || [];
        list.push(r);
        byId.set(r.moduleId, list);
      }
    }

    for (const [moduleId, recs] of byId) {
      let rec: ModuleVersionRecord | undefined;
      if (specifiedVersion) {
        rec = getConfirmedByVersion(recs, kind, moduleId, specifiedVersion);
      } else {
        rec = getLatestConfirmed(recs, kind, moduleId);
      }
      if (rec && rec.snapshot) {
        modules.push({
          kind,
          id: moduleId,
          snapshot: rec.snapshot as Record<string, unknown>,
        });
      }
    }
  }

  // E1–E8 MetaElement：confirmedVersion 非空
  const eKinds: ModuleKind[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];
  for (const kind of eKinds) {
    for (const el of options.metaElements) {
      if (el.dimension === kind && el.confirmedVersion) {
        modules.push({
          kind,
          id: el.id,
          snapshot: { ...el } as unknown as Record<string, unknown>,
        });
      }
    }
  }

  return modules;
}

// ── 引用表 ──

interface RefEntry {
  id: string;
  name: string;
  dimension: string;
}

function buildRefEntries(
  options: ExportExcelOptions,
  modules: ModuleDataEntry[],
): RefEntry[] {
  const entries: RefEntry[] = [];

  // 所有已确认的 A/B/C/EPC + MetaElement
  for (const m of modules) {
    if (['A', 'B', 'C', 'EPC'].includes(m.kind)) {
      entries.push({ id: m.id, name: (m.snapshot.name as string) ?? '', dimension: m.kind });
    }
  }
  for (const el of options.metaElements) {
    if (el.confirmedVersion) {
      entries.push({ id: el.id, name: el.name, dimension: el.dimension });
    }
  }

  return entries;
}

// ── 主函数 ──

/**
 * 构建 Excel Workbook 对象（含 Data Validation），供测试验证。
 * 通常调用 exportModulesToExcel 即可。
 */
export function buildExcelWorkbook(options: ExportExcelOptions): ReturnType<typeof utils.book_new> {
  const modules = extractModules(options);
  const refEntries = buildRefEntries(options, modules);

  const wb = utils.book_new();

  // 按 kind 分组
  const byKind = new Map<ModuleKind, ModuleDataEntry[]>();
  for (const m of modules) {
    const list = byKind.get(m.kind) || [];
    list.push(m);
    byKind.set(m.kind, list);
  }

  // 先生成引用表（使用中文表头）
  const refHeaderRow = HIDDEN_REF_SHEET_CONFIG.columns.map((c) => c.header);
  const refDataRows = refEntries.map((e) => [e.id, e.name, e.dimension]);
  const refSheet = utils.aoa_to_sheet([refHeaderRow, ...refDataRows]);
  utils.book_append_sheet(wb, refSheet, HIDDEN_REF_SHEET_CONFIG.sheetName);

  // 隐藏引用表
  if (!wb.Workbook) wb.Workbook = { Sheets: [] };
  if (!wb.Workbook.Sheets) wb.Workbook.Sheets = [];
  wb.Workbook.Sheets.push({ name: HIDDEN_REF_SHEET_CONFIG.sheetName, Hidden: 1 });

  // 引用表数据范围（供 Data Validation）
  const refDataRange = refEntries.length > 0
    ? `_要素引用表!$A$2:$A$${refEntries.length + 1}`
    : '_要素引用表!$A$2:$A$2';

  // 生成各模块 Sheet（使用中文表头）
  for (const config of EXCEL_SHEET_CONFIGS) {
    const kindModules = byKind.get(config.moduleKind as ModuleKind) || [];
    const colKeys = config.columns.map((c) => c.key);

    // 表头行使用中文 header
    const headerRow = config.columns.map((c) => c.header);
    // 数据行
    const dataRows = kindModules.map((m) => {
      return config.columns.map((col) => {
        const val = m.snapshot[col.key];
        if (col.type === 'json' && val !== undefined && val !== null) {
          return typeof val === 'string' ? val : JSON.stringify(val);
        }
        return val ?? '';
      });
    });

    const ws = utils.aoa_to_sheet([headerRow, ...dataRows]);
    const refCols = getRefColumns(config);
    const refColCount = refEntries.length;

    // 设置 Data Validation
    if (refColCount > 0 && refCols.length > 0) {
      const dvArray: Record<string, unknown>[] = [];
      for (const refCol of refCols) {
        // 计算列字母
        const colIdx = colKeys.indexOf(refCol.key);
        if (colIdx < 0) continue;

        const colLetter = numberToColLetter(colIdx);
        // 对从第 2 行到第 N 行的每个单元格设置 validation
        const endRow = dataRows.length + 1; // +1 for header

        for (let r = 2; r <= Math.max(endRow, 2); r++) {
          const cellRef = `${colLetter}${r}`;
          dvArray.push({
            sqref: cellRef,
            type: 'list',
            formula1: `'${refDataRange}'`,
            allow_blank: true,
            showDropDown: false, // allow any value, not just list
          });
        }
      }
      if (dvArray.length > 0) {
        (ws as Record<string, unknown>)['!dataValidation'] = dvArray;
      }
    }

    utils.book_append_sheet(wb, ws, config.sheetName);
  }

  // EPC 步骤明细 Sheet — 每个 EPC 步骤一行
  const epcStepHeaderRow = [
    'EPC流程ID', 'EPC流程名称', '步骤序号', '步骤ID', '步骤名称',
    '关联维度', '关联元素ID', '关联元素名称', '步骤描述',
  ];
  const epcStepDataRows: unknown[][] = [];
  for (const m of modules) {
    if (m.kind !== 'EPC') continue;
    const epcId = m.id;
    const epcName = (m.snapshot.name as string) ?? '';
    const steps = m.snapshot.steps;
    if (!Array.isArray(steps)) continue;
    steps.forEach((step: Record<string, unknown>, idx: number) => {
      const ref = step.elementRef as Record<string, unknown> | undefined;
      epcStepDataRows.push([
        epcId,
        epcName,
        idx + 1,
        step.id ?? '',
        step.name ?? '',
        ref?.dimension ?? '',
        ref?.elementId ?? '',
        ref?.elementName ?? '',
        step.description ?? '',
      ]);
    });
  }
  const epcStepWs = utils.aoa_to_sheet([epcStepHeaderRow, ...epcStepDataRows]);
  utils.book_append_sheet(wb, epcStepWs, 'EPC-步骤明细');

  return wb;
}

export function exportModulesToExcel(options: ExportExcelOptions): Uint8Array {
  const wb = buildExcelWorkbook(options);
  const buf = write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

// ── 辅助 ──

interface RefColumnDef {
  key: string;
  label: string;
}

function getRefColumns(config: ExcelSheetConfig): RefColumnDef[] {
  const refs: RefColumnDef[] = [];
  for (const col of config.columns) {
    if (col.key === 'parentId') {
      refs.push({ key: 'parentId', label: '父节点ID' });
    }
  }
  return refs;
}

function numberToColLetter(n: number): string {
  let result = '';
  let num = n;
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  return result;
}
