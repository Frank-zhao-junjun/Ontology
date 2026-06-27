import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { findLegacyApiRoutes, assertNoLegacyApiRoutes, FORBIDDEN_LEGACY_API_SEGMENTS } from '@/lib/legacy-audit';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('legacy-audit', () => {
  describe('FORBIDDEN_LEGACY_API_SEGMENTS', () => {
    it('should include agent-semantic-layer', () => {
      expect(FORBIDDEN_LEGACY_API_SEGMENTS).toContain('agent-semantic-layer');
    });

    it('should include entity-lifecycle', () => {
      expect(FORBIDDEN_LEGACY_API_SEGMENTS).toContain('entity-lifecycle');
    });

    it('should include generate-model', () => {
      expect(FORBIDDEN_LEGACY_API_SEGMENTS).toContain('generate-model');
    });

    it('should include extract-entities', () => {
      expect(FORBIDDEN_LEGACY_API_SEGMENTS).toContain('extract-entities');
    });
  });

  describe('findLegacyApiRoutes', () => {
    const testDir = join(tmpdir(), `legacy-audit-test-${Date.now()}`);

    beforeAll(() => {
      mkdirSync(join(testDir, 'agent-semantic-layer'), { recursive: true });
      writeFileSync(join(testDir, 'agent-semantic-layer', 'route.ts'), '');
      mkdirSync(join(testDir, 'entity-lifecycle'), { recursive: true });
      writeFileSync(join(testDir, 'entity-lifecycle', 'route.ts'), '');
      mkdirSync(join(testDir, 'ok-feature'), { recursive: true });
      writeFileSync(join(testDir, 'ok-feature', 'route.ts'), '');
    });

    afterAll(() => {
      rmSync(testDir, { recursive: true, force: true });
    });

    it('should find agent-semantic-layer route', () => {
      const hits = findLegacyApiRoutes(testDir);
      expect(hits.some((h) => h.includes('agent-semantic-layer'))).toBe(true);
    });

    it('should find entity-lifecycle route', () => {
      const hits = findLegacyApiRoutes(testDir);
      expect(hits.some((h) => h.includes('entity-lifecycle'))).toBe(true);
    });

    it('should not flag ok-feature route', () => {
      const hits = findLegacyApiRoutes(testDir);
      expect(hits.some((h) => h.includes('ok-feature'))).toBe(false);
    });

    it('should return empty array when no forbidden routes exist', () => {
      const cleanDir = join(tmpdir(), `legacy-audit-clean-${Date.now()}`);
      mkdirSync(join(cleanDir, 'ok'), { recursive: true });
      writeFileSync(join(cleanDir, 'ok', 'route.ts'), '');
      const hits = findLegacyApiRoutes(cleanDir);
      expect(hits).toHaveLength(0);
      rmSync(cleanDir, { recursive: true, force: true });
    });
  });

  describe('assertNoLegacyApiRoutes', () => {
    it('should not throw on clean directory', () => {
      const cleanDir = join(tmpdir(), `legacy-audit-assert-${Date.now()}`);
      mkdirSync(join(cleanDir, 'ok'), { recursive: true });
      writeFileSync(join(cleanDir, 'ok', 'route.ts'), '');
      expect(() => assertNoLegacyApiRoutes(cleanDir)).not.toThrow();
      rmSync(cleanDir, { recursive: true, force: true });
    });

    it('should throw when forbidden routes found', () => {
      const dirtyDir = join(tmpdir(), `legacy-audit-assert-dirty-${Date.now()}`);
      mkdirSync(join(dirtyDir, 'agent-semantic-layer'), { recursive: true });
      writeFileSync(join(dirtyDir, 'agent-semantic-layer', 'route.ts'), '');
      expect(() => assertNoLegacyApiRoutes(dirtyDir)).toThrow('发现遗留 API 路由');
      rmSync(dirtyDir, { recursive: true, force: true });
    });
  });
});
