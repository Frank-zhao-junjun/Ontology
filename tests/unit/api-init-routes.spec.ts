import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMetadata } from '@/app/api/metadata/init/route';
import { GET as getMasterdata } from '@/app/api/masterdata/init/route';
import { METADATA_LIST } from '@/lib/metadata-local';

describe('Init API Routes (Q-T3b)', () => {
  describe('GET /api/metadata/init', () => {
    it('returns localized metadata list with success envelope', async () => {
      const response = await getMetadata();
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.total).toBe(METADATA_LIST.length);
      expect(payload.data).toHaveLength(METADATA_LIST.length);
      expect(payload.data[0]).toMatchObject({
        domain: METADATA_LIST[0].domain,
        name: METADATA_LIST[0].name,
        nameEn: METADATA_LIST[0].nameEn,
        type: METADATA_LIST[0].type,
      });
      expect(payload.data[0].id).toBeTruthy();
      expect(payload.data[0].createdAt).toBeTruthy();
    });
  });

  describe('GET /api/masterdata/init', () => {
    it('returns sample masterdata definitions and records', async () => {
      const request = new NextRequest('http://localhost/api/masterdata/init');
      const response = await getMasterdata(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.total).toBeGreaterThan(0);
      expect(Array.isArray(payload.data.definitions)).toBe(true);
      expect(payload.data.definitions[0]).toMatchObject({
        domain: expect.any(String),
        name: expect.any(String),
        code: expect.any(String),
      });
      expect(typeof payload.data.records).toBe('object');
    });
  });
});
