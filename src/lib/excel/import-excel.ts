import { read, utils } from 'xlsx';
import type {
  ModuleKind,
  ModuleVersionRecord,
  ValueDomain,
  Capability,
  Scenario,
  MetaElement,
  EpcStep,
  EpcStepElementRef,
} from '@/types/ontology';
import {
  EXCEL_SHEET_CONFIGS,
  HIDDEN_REF_SHEET_CONFIG,
  validateModuleRow,
  type ExcelModuleRow,
  type ImportPreview,
  type ImportChangeItem,
  type ValidationWarning,
} from './excel-schema';

// ── 类型 ──

export interface ParseExcelImportOptions {
  file: File;
  existingValueDomains: ValueDomain[];
  existingCapabilities: Capability[];
  existingScenarios: Scenario[];
  existingMetaElements: MetaElement[];
  existingModuleVersionRecords: ModuleVersionRecord[];
}

export interface ExecuteImportOptions {
  preview: ImportPreview;
  saveModuleDraft: (kind: ModuleKind, id: string, snapshot: unknown) => void;
  rebuildUsageIndex: () => void;
}

// ── 解析 ──

export async function parseExcelImport(
  options: ParseExcelImportOptions,
): Promise<ImportPreview> {
  const { file, existingValueDomains, existingCapabilities, existingScenarios, existingMetaElements, existingModuleVersionRecords } = options;

  // 读取文件
  const buf = await file.arrayBuffer();
  const wb = read(new Uint8Array(buf as ArrayBuffer), { type: 'array' });

  const allRows: ExcelModuleRow[] = [];
  const warnings: ValidationWarning[] = [];
  const changes: ImportChangeItem[] = [];

  // 构建已有 ID 集合
  const existingVDIds = new Set(existingValueDomains.map((v) => v.id));
  const existingCapIds = new Set(existingCapabilities.map((c) => c.id));
  const existingScIds = new Set(existingScenarios.map((s) => s.id));
  const existingMetaIds = new Set(existingMetaElements.map((m) => m.id));

  // 已有 draft 的 (kind, id) 对
  const existingDrafts = new Map<string, ModuleVersionRecord>();
  for (const rec of existingModuleVersionRecords) {
    if (rec.status === 'draft') {
      existingDrafts.set(`${rec.moduleKind}:${rec.moduleId}`, rec);
    }
  }

  // 逐 Sheet 解析
  for (const config of EXCEL_SHEET_CONFIGS) {
    const ws = wb.Sheets[config.sheetName];
    if (!ws) continue;

    const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    if (rows.length === 0) continue;

    // 构建中文表头 → 英文 key 的映射（兼容中文表头导出）
    const headerToKey = new Map<string, string>();
    for (const col of config.columns) {
      headerToKey.set(col.header, col.key);
      headerToKey.set(col.key, col.key); // 同时兼容英文 key
    }

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const rowIndex = i + 2; // Excel 行号（跳过表头）

      // 将中文表头键名归一化为英文 key
      const normalizedRow: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rawRow)) {
        const mappedKey = headerToKey.get(k) ?? k;
        if (!headerToKey.has(k)) {
          console.warn(`[ExcelImport] Sheet "${config.sheetName}" row ${rowIndex}: unmapped header "${String(k)}", passing through as-is`);
        }
        normalizedRow[mappedKey] = v;
      }

      // 1. 字段级校验
      const fieldWarnings = validateModuleRow(normalizedRow, config, rowIndex);
      warnings.push(...fieldWarnings);

      const moduleId = String(normalizedRow.id ?? '').trim();
      if (!moduleId) continue; // skip rows without id (already warned)

      const row: ExcelModuleRow = {
        moduleKind: config.moduleKind as ModuleKind,
        moduleId,
        data: { ...normalizedRow },
      };
      allRows.push(row);

      // 2. 父节点完整性检查
      const parentId = String(normalizedRow.parentId ?? '').trim();
      if (parentId) {
        const kind = config.moduleKind;
        const parentExists = checkParentExists(kind, parentId, existingVDIds, existingCapIds, existingScIds);
        if (!parentExists) {
          // 创建占位 draft
          const placeholderKind = getParentKind(kind);
          if (placeholderKind) {
            const existingPlaceholder = changes.find(
              (c) => c.moduleKind === placeholderKind && c.moduleId === parentId,
            );
            if (!existingPlaceholder) {
              changes.push({
                moduleKind: placeholderKind,
                moduleId: parentId,
                action: 'placeholder_draft',
                row: rowIndex,
              });
            }
          } else {
            warnings.push({
              sheet: config.sheetName,
              row: rowIndex,
              column: 'parentId',
              message: `父节点 "${parentId}" 不存在，且无法确定其类型`,
            });
          }
        }
      }

      // 3. EPC 要素引用检查
      if (config.moduleKind === 'EPC') {
        const stepsRaw = normalizedRow.steps;
        if (stepsRaw && typeof stepsRaw === 'string' && stepsRaw.trim()) {
          try {
            const steps = JSON.parse(stepsRaw) as EpcStep[];
            for (const step of steps) {
              if (step.elementRef) {
                const elId = step.elementRef.elementId;
                if (!existingMetaIds.has(elId)) {
                  warnings.push({
                    sheet: config.sheetName,
                    row: rowIndex,
                    column: 'steps',
                    message: `EPC 步骤 "${step.name}" 引用的要素 "${elId}" 不在八维库中`,
                  });
                }
                // 检查 inlineNew
                if (step.elementRef.inlineNew) {
                  row.data._hasInlineNew = true;
                }
              }
            }
          } catch {
            // JSON parse error already caught by validateModuleRow
          }
        }
      }

      // 4. 判断 change 类型
      const draftKey = `${config.moduleKind}:${moduleId}`;
      if (existingDrafts.has(draftKey)) {
        changes.push({
          moduleKind: config.moduleKind as ModuleKind,
          moduleId,
          action: 'update_draft',
          existingStatus: 'draft',
          row: rowIndex,
        });
      } else {
        // Check if this module already has a confirmed version
        const hasConfirmed = existingModuleVersionRecords.some(
          (r) => r.moduleKind === config.moduleKind && r.moduleId === moduleId && r.status === 'confirmed',
        );
        changes.push({
          moduleKind: config.moduleKind as ModuleKind,
          moduleId,
          action: 'new_draft',
          existingStatus: hasConfirmed ? 'confirmed' : undefined,
          row: rowIndex,
        });
      }
    }
  }

  // 汇总
  const newDrafts = changes.filter((c) => c.action === 'new_draft').length;
  const updatedDrafts = changes.filter((c) => c.action === 'update_draft').length;
  const placeholderDrafts = changes.filter((c) => c.action === 'placeholder_draft').length;

  return {
    changes,
    warnings,
    rows: allRows,
    summary: {
      newDrafts,
      updatedDrafts,
      placeholderDrafts,
      warningCount: warnings.length,
    },
  };
}

// ── 执行导入 ──

export function executeImport(options: ExecuteImportOptions): void {
  const { preview, saveModuleDraft, rebuildUsageIndex } = options;

  // 先创建占位 draft
  const placeholderChanges = preview.changes.filter((c) => c.action === 'placeholder_draft');
  for (const change of placeholderChanges) {
    const placeholderSnapshot = {
      id: change.moduleId,
      name: change.moduleId,
      description: '（导入占位，请补全必填字段）',
    };
    saveModuleDraft(change.moduleKind, change.moduleId, placeholderSnapshot);
  }

  // 创建/更新模块 draft
  const moduleChanges = preview.changes.filter((c) => c.action !== 'placeholder_draft');
  let hasInlineNew = false;

  for (const change of moduleChanges) {
    const row = preview.rows.find(
      (r) => r.moduleKind === change.moduleKind && r.moduleId === change.moduleId,
    );
    if (!row) continue;

    // 清理内部字段
    const data = { ...row.data };
    const hasInline = data._hasInlineNew === true;
    delete data._hasInlineNew;

    // 解析 JSON 字段
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try {
          data[key] = JSON.parse(val);
        } catch {
          // keep as string if parse fails
        }
      }
    }

    saveModuleDraft(change.moduleKind, change.moduleId, data);

    if (hasInline) {
      hasInlineNew = true;
    }
  }

  // 有内联新建要素时重建索引
  if (hasInlineNew) {
    rebuildUsageIndex();
  }
}

// ── 辅助 ──

function checkParentExists(
  kind: string,
  parentId: string,
  vdIds: Set<string>,
  capIds: Set<string>,
  scIds: Set<string>,
): boolean {
  switch (kind) {
    case 'B': return vdIds.has(parentId);
    case 'C': return capIds.has(parentId);
    case 'EPC': return scIds.has(parentId);
    default: return true; // A has no parent
  }
}

function getParentKind(childKind: string): ModuleKind | null {
  switch (childKind) {
    case 'B': return 'A';
    case 'C': return 'B';
    case 'EPC': return 'C';
    default: return null;
  }
}
