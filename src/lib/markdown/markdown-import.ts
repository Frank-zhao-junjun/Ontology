/**
 * Markdown 导入解析器
 *
 * 支持的 Markdown 格式：每个 `##` 二级标题对应一个模块类型（A/B/C/EPC/E1-E8），
 * 标题下的 Markdown 表格行解析为模块数据。
 *
 * 示例：
 * ```md
 * ## A-价值域
 *
 * | ID | 名称 | 描述 |
 * |----|------|------|
 * | VD001 | 合同生命周期 | 管理合同从创建到归档的完整流程 |
 *
 * ## B-能力
 *
 * | ID | 名称 | 描述 | 父ID |
 * |----|------|------|-------|
 * | CAP001 | 合同创建 | 发起合同起草流程 | VD001 |
 * ```
 */

import type { ModuleKind } from '@/types/ontology';
import type {
  ImportPreview,
  ImportChangeItem,
  ValidationWarning,
  ExcelModuleRow,
} from '@/lib/excel/excel-schema';
import { buildExcelWorkbook, type ExportExcelOptions } from '@/lib/excel/export-excel';
import * as XLSX from 'xlsx';

// ── 类型映射 ──

const SECTION_PREFIX_MAP: Record<string, ModuleKind> = {
  'a': 'A',
  'a-价值域': 'A',
  'a-价值域(value-domain)': 'A',
  'b': 'B',
  'b-能力': 'B',
  'b-能力(capability)': 'B',
  'c': 'C',
  'c-场景': 'C',
  'c-场景(scenario)': 'C',
  'epc': 'EPC',
  'epc流程': 'EPC',
  'epc-process': 'EPC',
  'e1': 'E1',
  'e1-数据': 'E1',
  'e1-数据(data)': 'E1',
  'e2': 'E2',
  'e2-行为': 'E2',
  'e2-行为(behavior)': 'E2',
  'e3': 'E3',
  'e3-规则': 'E3',
  'e3-规则(rule)': 'E3',
  'e4': 'E4',
  'e4-事件': 'E4',
  'e4-事件(event)': 'E4',
  'e5': 'E5',
  'e5-岗位角色': 'E5',
  'e5-岗位角色(organization)': 'E5',
  'e6': 'E6',
  'e6-指标': 'E6',
  'e6-指标(metric)': 'E6',
  'e7': 'E7',
  'e7-边界约束': 'E7',
  'e7-边界约束(boundary)': 'E7',
  'e8': 'E8',
  'e8-数据源': 'E8',
  'e8-数据源(datasource)': 'E8',
};

const ALL_MODULE_KINDS: ModuleKind[] = ['A', 'B', 'C', 'EPC', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];

// ── 解析结果 ──

export interface MarkdownParseResult {
  rows: ExcelModuleRow[];
  warnings: ValidationWarning[];
  sections: { kind: ModuleKind; title: string; rowCount: number }[];
}

// ── 解析函数 ──

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, '');
}

function parseTableBlock(lines: string[], startIndex: number): { headers: string[]; dataRows: string[][]; endIndex: number } {
  const headers: string[] = [];
  const dataRows: string[][] = [];
  let i = startIndex;

  // 表头行
  const headerLine = lines[i]?.trim();
  if (!headerLine || !headerLine.startsWith('|')) {
    return { headers, dataRows, endIndex: i };
  }
  headers.push(...headerLine.split('|').slice(1, -1).map((h) => h.trim()));

  i++;

  // 分隔行 (|---|---|)
  const sepLine = lines[i]?.trim();
  if (sepLine && sepLine.startsWith('|') && sepLine.includes('-')) {
    i++;
  }

  // 数据行
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; break; }
    if (!line.startsWith('|')) break;

    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    dataRows.push(cells);
    i++;
  }

  return { headers, dataRows, endIndex: i };
}

function tryParseJson(value: string): unknown {
  if (!value) return value;
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * 解析 Markdown 文本为结构化模块数据
 */
export function parseMarkdownToModules(text: string): MarkdownParseResult {
  const lines = text.split('\n');
  const rows: ExcelModuleRow[] = [];
  const warnings: ValidationWarning[] = [];
  const sections: { kind: ModuleKind; title: string; rowCount: number }[] = [];

  let i = 0;
  let currentKind: ModuleKind | null = null;
  let currentTitle = '';
  let sectionRowCount = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 二级标题 → 模块分区
    if (line.startsWith('## ')) {
      const rawTitle = line.slice(3).trim();
      const key = normalizeKey(rawTitle);
      const kind = SECTION_PREFIX_MAP[key];

      if (kind) {
        // 保存上一个 section 的计数
        if (currentKind && sectionRowCount > 0) {
          sections.push({ kind: currentKind, title: currentTitle, rowCount: sectionRowCount });
        }
        currentKind = kind;
        currentTitle = rawTitle;
        sectionRowCount = 0;
      } else {
        // 未知标题，结束当前 section
        if (currentKind && sectionRowCount > 0) {
          sections.push({ kind: currentKind, title: currentTitle, rowCount: sectionRowCount });
        }
        currentKind = null;
      }
      i++;
      continue;
    }

    // 一级标题 → 可能是文档标题，跳过
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      i++;
      continue;
    }

    // 表格行
    if (line.startsWith('|') && currentKind) {
      const { headers, dataRows, endIndex } = parseTableBlock(lines, i);

      if (headers.length === 0) {
        i = endIndex;
        continue;
      }

      // 找 ID 列
      const idColIdx = headers.findIndex((h) =>
        normalizeKey(h) === 'id' || normalizeKey(h) === '编号' || normalizeKey(h) === '模块id' || normalizeKey(h) === '模块id(id)'
      );

      if (idColIdx === -1) {
        warnings.push({
          sheet: currentTitle,
          row: i + 1,
          column: 'ID',
          message: `表格缺少 ID 列，跳过此表格`,
        });
        i = endIndex;
        continue;
      }

      for (let r = 0; r < dataRows.length; r++) {
        const cells = dataRows[r];
        const moduleId = cells[idColIdx]?.trim();

        if (!moduleId) {
          warnings.push({
            sheet: currentTitle,
            row: i + r + 2,
            column: headers[idColIdx],
            message: `ID 为空，跳过此行`,
          });
          continue;
        }

        const data: Record<string, unknown> = {};
        for (let c = 0; c < headers.length; c++) {
          const key = headers[c];
          const value = cells[c]?.trim() ?? '';
          data[key] = tryParseJson(value);
        }

        rows.push({
          moduleKind: currentKind,
          moduleId,
          data,
        });
        sectionRowCount++;
      }

      i = endIndex;
      continue;
    }

    i++;
  }

  // 保存最后一个 section
  if (currentKind && sectionRowCount > 0) {
    sections.push({ kind: currentKind, title: currentTitle, rowCount: sectionRowCount });
  }

  return { rows, warnings, sections };
}

// ── 预览构建 ──

export interface ExistingModule {
  moduleKind: ModuleKind;
  moduleId: string;
  status?: string;
}

export interface MarkdownImportParams {
  text: string;
  existingModules: ExistingModule[];
}

export function parseMarkdownImport(params: MarkdownImportParams): ImportPreview {
  const { text, existingModules } = params;
  const parseResult = parseMarkdownToModules(text);

  const changes: ImportChangeItem[] = [];
  const warnings: ValidationWarning[] = [...parseResult.warnings];

  const existingMap = new Map<string, ExistingModule>();
  for (const m of existingModules) {
    existingMap.set(`${m.moduleKind}:${m.moduleId}`, m);
  }

  // 检测缺少 ID 的 section → 占位（跳过 _REF 引用行）
  const moduleRows = parseResult.rows.filter((r) => r.moduleKind !== '_REF');
  const foundKinds = new Set<ModuleKind>();
  for (const row of moduleRows) {
    const mk = row.moduleKind as ModuleKind;
    foundKinds.add(mk);
    const key = `${mk}:${row.moduleId}`;
    const existing = existingMap.get(key);

    if (existing) {
      changes.push({
        moduleKind: mk,
        moduleId: row.moduleId,
        action: existing.status === 'draft' ? 'update_draft' : 'update_draft',
        existingStatus: existing.status as 'draft' | 'confirmed' | 'archived' | undefined,
        row: changes.length + 1,
      });
    } else {
      changes.push({
        moduleKind: mk,
        moduleId: row.moduleId,
        action: 'new_draft',
        row: changes.length + 1,
      });
    }
  }

  // 检测引用但缺失的父节点 → 占位 draft
  const allIds = new Set(moduleRows.map((r) => `${r.moduleKind as ModuleKind}:${r.moduleId}`));
  for (const row of moduleRows) {
    const mk = row.moduleKind as ModuleKind;
    const data = row.data;
    const parentId = (data['父ID'] || data['parentId'] || data['父ID(parentId)'] || '') as string;
    if (parentId && !allIds.has(`${mk}:${parentId}`) && !existingMap.has(`${mk}:${parentId}`)) {
      changes.push({
        moduleKind: mk,
        moduleId: parentId,
        action: 'placeholder_draft',
        row: changes.length + 1,
      });
      warnings.push({
        sheet: mk,
        row: 0,
        column: '父ID',
        message: `${row.moduleId} 引用的父节点 ${parentId} 不存在，将创建占位 draft`,
      });
    }
  }

  const newDrafts = changes.filter((c) => c.action === 'new_draft').length;
  const updatedDrafts = changes.filter((c) => c.action === 'update_draft').length;
  const placeholderDrafts = changes.filter((c) => c.action === 'placeholder_draft').length;

  return {
    changes,
    warnings,
    rows: parseResult.rows,
    summary: {
      newDrafts,
      updatedDrafts,
      placeholderDrafts,
      warningCount: warnings.length,
    },
  };
}

// ── 导出 Markdown 模板 ──

export function generateMarkdownTemplate(): string {
  return `# 本体建模数据导入模板

> 每个 \`##\` 二级标题对应一个模块类型。标题下用 Markdown 表格定义数据。
> 必填列：ID。其他列名与 Excel 导入模板一致。

## A-价值域

| ID | 名称 | 描述 |
|----|------|------|
| VD001 | 合同生命周期 | 管理合同从创建到归档的完整流程 |

## B-能力

| ID | 名称 | 描述 | 父ID |
|----|------|------|------|
| CAP001 | 合同创建 | 发起合同起草流程 | VD001 |

## C-场景

| ID | 名称 | 描述 | 父ID |
|----|------|------|------|
| SCN001 | 建筑合同起草 | 建筑行业合同起草场景 | CAP001 |

## EPC流程

| ID | 名称 | 描述 | 父ID |
|----|------|------|------|
| EPC001 | 合同起草EPC | 合同起草完整EPC流程 | SCN001 |

## E1-数据

| ID | 名称 | 描述 |
|----|------|------|
| ENT001 | 合同 | 合同实体 |

## E2-行为

| ID | 名称 | 描述 |
|----|------|------|
| SM001 | 合同状态机 | 管理合同状态流转 |

## E3-规则

| ID | 名称 | 描述 |
|----|------|------|
| RUL001 | 金额校验 | 合同金额必须大于0 |

## E4-事件

| ID | 名称 | 描述 |
|----|------|------|
| EVT001 | 合同创建事件 | 合同创建时触发 |

## E5-岗位角色

| ID | 名称 | 描述 |
|----|------|------|
| POS001 | 合同管理员 | 负责合同起草和审核 |

## E6-指标

| ID | 名称 | 描述 |
|----|------|------|
| MET001 | 合同审批时长 | 从起草到确认的平均时长 |

## E7-边界约束

| ID | 名称 | 描述 |
|----|------|------|
| BND001 | 合同金额上限 | 单笔合同不超过5000万 |

## E8-数据源

| ID | 名称 | 描述 |
|----|------|------|
| DS001 | ERP系统 | 企业资源规划系统 |
`;
}

/**
 * 将模块数据导出为 Markdown 格式（与 Excel 导出同源数据）
 */
export function exportModulesToMarkdown(options: ExportExcelOptions): string {
  const wb = buildExcelWorkbook(options);

  const kindLabels: Record<string, string> = {
    'A': 'A-价值域',
    'B': 'B-能力',
    'C': 'C-场景',
    'epc': 'EPC',
    'E1': 'E1-数据',
    'E2': 'E2-行为',
    'E3': 'E3-规则',
    'E4': 'E4-事件',
    'E5': 'E5-岗位角色',
    'E6': 'E6-指标',
    'E7': 'E7-边界约束',
    'E8': 'E8-数据源',
  };

  const lines: string[] = [];
  lines.push(`# 本体模型导出`);
  lines.push('');
  lines.push(`> 导出时间: ${new Date().toISOString()}`);
  lines.push('');

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      header: 0,
      defval: '',
    });

    const label = kindLabels[sheetName] || sheetName;
    lines.push(`## ${label}`);
    lines.push('');

    if (rows.length === 0) {
      lines.push('*暂无数据*');
      lines.push('');
      continue;
    }

    const fieldSet = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        fieldSet.add(key);
      }
    }
    const fields = Array.from(fieldSet);

    lines.push(`| ${fields.join(' | ')} |`);
    lines.push(`|${fields.map(() => '----').join('|')}|`);

    for (const row of rows) {
      const values = fields.map(f => String(row[f] ?? ''));
      lines.push(`| ${values.join(' | ')} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
