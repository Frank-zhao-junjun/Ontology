import { describe, it, expect } from 'vitest';
import {
  EXCEL_SHEET_CONFIGS,
  HIDDEN_REF_SHEET_CONFIG,
  ALL_SHEET_CONFIGS,
  validateModuleRow,
} from '@/lib/excel/excel-schema';

describe('excel-schema', () => {
  describe('AC-1: Sheet configs', () => {
    it('should have 12 visible sheet configs', () => {
      expect(EXCEL_SHEET_CONFIGS).toHaveLength(12);
    });

    it('should have one hidden reference sheet config', () => {
      expect(HIDDEN_REF_SHEET_CONFIG.moduleKind).toBe('_REF');
      expect(HIDDEN_REF_SHEET_CONFIG.hidden).toBe(true);
    });

    it('should have 13 total configs (12 visible + 1 hidden)', () => {
      expect(ALL_SHEET_CONFIGS).toHaveLength(13);
    });

    it('each visible sheet should have moduleKind from the ModuleKind union', () => {
      const kinds = ['A', 'B', 'C', 'EPC', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];
      const configKinds = EXCEL_SHEET_CONFIGS.map((c) => c.moduleKind);
      expect(configKinds.sort()).toEqual(kinds.sort());
    });

    it('each visible sheet should define at least id and name columns', () => {
      for (const config of EXCEL_SHEET_CONFIGS) {
        const keys = config.columns.map((c) => c.key);
        expect(keys).toContain('id');
        expect(keys).toContain('name');
      }
    });
  });

  describe('AC-2: Required field validation', () => {
    it('should return warning when required field is missing', () => {
      const row = { name: 'Test' /* missing id */ };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'A')!;
      const warnings = validateModuleRow(row, config, 2);
      const idWarning = warnings.find((w) => w.column === 'id');
      expect(idWarning).toBeDefined();
      expect(idWarning!.message).toContain('必填');
    });

    it('should return warning when required field is empty string', () => {
      const row = { id: '', name: 'Test' };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'A')!;
      const warnings = validateModuleRow(row, config, 2);
      const idWarning = warnings.find((w) => w.column === 'id');
      expect(idWarning).toBeDefined();
    });

    it('should return no warning when all required fields are present', () => {
      const row = { id: 'VD-001', name: 'Test Domain', nameEn: 'TD', description: 'desc' };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'A')!;
      const warnings = validateModuleRow(row, config, 2);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('AC-3: JSON column format validation', () => {
    it('should return warning when JSON column has invalid JSON', () => {
      const row = {
        id: 'EPC-001',
        name: 'Test EPC',
        parentId: 'C-001',
        steps: '{invalid json',
        semantics: '{ "terms": ["ok"] }',
        scenarioId: 'C-001',
      };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'EPC')!;
      const warnings = validateModuleRow(row, config, 2);
      const stepsWarning = warnings.find((w) => w.column === 'steps');
      expect(stepsWarning).toBeDefined();
      expect(stepsWarning!.message).toContain('JSON');
    });

    it('should not return warning for valid JSON in JSON columns', () => {
      const row = {
        id: 'EPC-001',
        name: 'Test EPC',
        parentId: 'C-001',
        steps: JSON.stringify([{ id: 'step-1', name: 'Step 1' }]),
        semantics: JSON.stringify({ terms: ['term1'] }),
        scenarioId: 'C-001',
      };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'EPC')!;
      const warnings = validateModuleRow(row, config, 2);
      expect(warnings).toHaveLength(0);
    });

    it('should treat empty JSON column as valid (optional)', () => {
      const row = {
        id: 'A-001',
        name: 'Test A',
        semantics: '',  // empty, not required
      };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'A')!;
      const warnings = validateModuleRow(row, config, 2);
      const semWarning = warnings.find((w) => w.column === 'semantics');
      expect(semWarning).toBeUndefined();
    });
  });

  describe('AC-4: Type imports', () => {
    it('should export all sheet configs as importable constants', () => {
      expect(EXCEL_SHEET_CONFIGS).toBeDefined();
      expect(HIDDEN_REF_SHEET_CONFIG).toBeDefined();
      expect(ALL_SHEET_CONFIGS).toBeDefined();
      expect(validateModuleRow).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should include row number in warning', () => {
      const row = { name: 'Test' };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'A')!;
      const warnings = validateModuleRow(row, config, 5);
      expect(warnings.every((w) => w.row === 5)).toBe(true);
    });

    it('should include sheet name in warning', () => {
      const row = { name: 'Test' };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'A')!;
      const warnings = validateModuleRow(row, config, 2);
      expect(warnings.every((w) => w.sheet === config.sheetName)).toBe(true);
    });

    it('should validate E1-E8 have dimension field', () => {
      const row = { id: 'E1-001', name: 'Test Entity' };
      const config = EXCEL_SHEET_CONFIGS.find((c) => c.moduleKind === 'E1')!;
      const warnings = validateModuleRow(row, config, 2);
      const dimWarning = warnings.find((w) => w.column === 'dimension');
      expect(dimWarning).toBeDefined();
    });
  });
});
