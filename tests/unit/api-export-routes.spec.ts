import { describe, expect, it } from 'vitest';
import { GET as getExportTemplate } from '@/app/api/export/route';
import { GET as getExcelTemplate } from '@/app/api/excel-template/route';

describe('Export API Routes (Q-T3b)', () => {
  describe('GET /api/export', () => {
    it('returns export config template and structure', async () => {
      const response = await getExportTemplate();
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.data.configTemplate).toMatchObject({ includeData: false });
      expect(Array.isArray(payload.data.exportStructure)).toBe(true);
      expect(payload.data.exportStructure).toContain('manifest.json');
    });
  });

  describe('GET /api/excel-template', () => {
    it('returns xlsx attachment buffer', async () => {
      const response = await getExcelTemplate();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('spreadsheetml');
      expect(response.headers.get('Content-Disposition')).toContain('ontology-import-template.xlsx');

      const buffer = Buffer.from(await response.arrayBuffer());
      expect(buffer.byteLength).toBeGreaterThan(1000);
    });
  });
});
