/**
 * OntologyManifest 校验器（V01–V11）
 * Golden：manufacturing-manifest.yaml
 */

import { describe, it, expect } from 'vitest';
import { validateManifest } from '@/lib/manifest-validator';
import { loadManifestFixture } from '../helpers/load-manifest-fixture';

describe('manifest-validator', () => {
  describe('manufacturing-manifest.yaml（合法样例）', () => {
    const manifest = loadManifestFixture('manufacturing-manifest.yaml');

    it('应通过全部 error 级规则', () => {
      const result = validateManifest(manifest);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('V01 apiVersion 应为 ontology.platform/v1', () => {
      const result = validateManifest(manifest);
      expect(result.errors.some((e) => e.code === 'V01')).toBe(false);
    });
  });

  describe('invalid-no-aggregate-root.yaml', () => {
    it('应触发 V03 且无 aggregate_root', () => {
      const result = validateManifest(loadManifestFixture('invalid-no-aggregate-root.yaml'));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'V03')).toBe(true);
    });

    it('entity 无有效 aggregateRootId 应触发 V04', () => {
      const result = validateManifest(loadManifestFixture('invalid-no-aggregate-root.yaml'));
      expect(result.errors.some((e) => e.code === 'V04')).toBe(true);
    });
  });

  describe('invalid-plaintext-secret.yaml', () => {
    it('应触发 V10 禁止明文 password', () => {
      const result = validateManifest(loadManifestFixture('invalid-plaintext-secret.yaml'));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'V10')).toBe(true);
    });
  });

  describe('结构校验', () => {
    it('空对象应返回 STRUCTURE 错误', () => {
      const result = validateManifest({});
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'STRUCTURE')).toBe(true);
    });

    it('不支持的 apiVersion 应触发 V01', () => {
      const base = loadManifestFixture('invalid-no-aggregate-root.yaml') as Record<string, unknown>;
      const result = validateManifest({
        ...base,
        apiVersion: 'ontology.platform/v99',
      });
      expect(result.errors.some((e) => e.code === 'V01')).toBe(true);
    });
  });
});
