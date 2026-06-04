/**
 * P0-12：制造域 golden — compile → validate，与 manufacturing-manifest.yaml 关键 id 对齐
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileManifest } from '@/lib/manifest-compiler';
import { validateManifest, type OntologyManifest } from '@/lib/manifest-validator';
import { buildManifestExportBundle } from '@/lib/manifest-export';
import { normalizeOntologyProjectEntityRoles } from '@/lib/entity-role';
import type { OntologyProject } from '@/types/ontology';
import { loadManifestFixture } from '../helpers/load-manifest-fixture';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures');
const COMPILE_PROJECT_PATH = join(FIXTURES_DIR, 'manifest-compile-project.json');
const EXPECTATIONS_PATH = join(FIXTURES_DIR, 'manufacturing-golden-expectations.json');

type GoldenExpectations = {
  metadataId: string;
  version: string;
  elementIds: string[];
  propertyNameEns: Record<string, string[]>;
  goldenYaml: string;
};

const fixedTime = '2026-06-04T12:00:00.000Z';

function loadExpectations(): GoldenExpectations {
  return JSON.parse(readFileSync(EXPECTATIONS_PATH, 'utf8')) as GoldenExpectations;
}

function loadManufacturingCompileProject(): OntologyProject {
  const raw = JSON.parse(readFileSync(COMPILE_PROJECT_PATH, 'utf8')) as OntologyProject;
  return normalizeOntologyProjectEntityRoles(raw);
}

/** 收集 Manifest 内可引用的 element id（用于与 golden 子集比对） */
function collectReferencedIds(manifest: OntologyManifest): Set<string> {
  const ids = new Set<string>();
  const semantic = manifest.spec.semantic;
  const behavior = manifest.spec.behavior;
  const events = manifest.spec.events;

  for (const scenario of semantic?.businessScenarios ?? []) {
    ids.add(scenario.id);
  }
  for (const ot of semantic?.objectTypes ?? []) {
    ids.add(ot.id);
  }
  for (const sm of semantic?.stateMachines ?? []) {
    ids.add(sm.id);
  }
  for (const action of behavior?.actions ?? []) {
    ids.add(action.id);
  }
  for (const rule of behavior?.rules ?? []) {
    ids.add(rule.id);
  }
  for (const evt of events?.domainEvents ?? []) {
    ids.add(evt.id);
  }

  return ids;
}

function propertyNameEnsForObjectType(
  manifest: OntologyManifest,
  objectTypeId: string
): string[] {
  const ot = manifest.spec.semantic?.objectTypes?.find((o) => o.id === objectTypeId);
  return (ot?.properties ?? [])
    .map((p) => p.nameEn)
    .filter((nameEn): nameEn is string => Boolean(nameEn));
}

describe('P0-12 manufacturing golden', () => {
  const expectations = loadExpectations();
  const compileOptions = {
    metadataId: expectations.metadataId,
    version: expectations.version,
    compiledAt: fixedTime,
  };

  describe('参考样例 manufacturing-manifest.yaml', () => {
    const golden = loadManifestFixture(expectations.goldenYaml) as OntologyManifest;

    it('golden 文件本身应通过 V01–V11', () => {
      const result = validateManifest(golden);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('golden 应包含 expectations 中的全部 element id', () => {
      const goldenIds = collectReferencedIds(golden);
      for (const id of expectations.elementIds) {
        expect(goldenIds.has(id), `golden 缺少 id: ${id}`).toBe(true);
      }
    });
  });

  describe('设计台 fixture → compile → validate', () => {
    const project = loadManufacturingCompileProject();

    it('compile + validate 零 error', () => {
      const manifest = compileManifest(project, compileOptions);
      const result = validateManifest(manifest);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('manifest-export 端到端应可下载且 valid', () => {
      const bundle = buildManifestExportBundle(project, {
        ...compileOptions,
        format: 'yaml',
      });
      expect(bundle.validation.valid).toBe(true);
      expect(bundle.content).toContain('apiVersion: ontology.platform/v1');
      expect(bundle.filename).toContain('manufacturing-ontology');
    });

    it('编译结果应覆盖 manufacturing golden 关键 element id', () => {
      const manifest = compileManifest(project, compileOptions);
      const compiledIds = collectReferencedIds(manifest);

      for (const id of expectations.elementIds) {
        expect(compiledIds.has(id), `编译结果缺少 id: ${id}`).toBe(true);
      }
    });

    it('属性 nameEn 应符合方案 A（平台表列 / snake_case）', () => {
      const manifest = compileManifest(project, compileOptions);

      for (const [objectTypeId, nameEns] of Object.entries(expectations.propertyNameEns)) {
        const actual = propertyNameEnsForObjectType(manifest, objectTypeId);
        for (const nameEn of nameEns) {
          expect(actual, `${objectTypeId} 缺少 nameEn ${nameEn}`).toContain(nameEn);
        }
      }
    });

    it('action-release-order 引用应与 golden 一致', () => {
      const manifest = compileManifest(project, compileOptions);
      const action = manifest.spec.behavior?.actions?.find((a) => a.id === 'action-release-order');
      expect(action?.aggregateRootId).toBe('production-order');
      expect(action?.preRuleIds).toEqual(['rule-kitting']);
      expect(action?.publishesEventIds).toEqual(['evt-order-released']);
    });
  });
});
