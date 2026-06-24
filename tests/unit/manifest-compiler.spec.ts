/**
 * OntologyProject → OntologyManifest 编译器（P0-02）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileManifest } from '@/lib/manifest-compiler';
import { validateManifest } from '@/lib/manifest-validator';
import { normalizeOntologyProjectEntityRoles } from '@/lib/entity-role';
import type { OntologyProject } from '@/types/ontology';
import { createFrozenProject } from './test-helpers';

const FIXTURE_PATH = join(process.cwd(), 'tests/fixtures/manifest-compile-project.json');

function loadCompileFixture(): OntologyProject {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as OntologyProject;
  return normalizeOntologyProjectEntityRoles(raw);
}

describe('manifest-compiler', () => {
  const fixedTime = '2026-06-04T12:00:00.000Z';

  describe('metadata', () => {
    it('应映射 apiVersion、kind、metadata.source 与 boundedContext', () => {
      const project = loadCompileFixture();
      const manifest = compileManifest(project, {
        metadataId: 'manufacturing-ontology',
        version: '1.0.0',
        compiledAt: fixedTime,
      });

      expect(manifest.apiVersion).toBe('ontology.platform/v1');
      expect(manifest.kind).toBe('OntologyManifest');
      expect(manifest.metadata).toMatchObject({
        id: 'manufacturing-ontology',
        version: '1.0.0',
        name: project.name,
        boundedContext: '生产制造',
        source: 'ontology-designer',
        status: 'draft',
        compiledAt: fixedTime,
      });
    });
  });

  describe('validateManifest（V01–V11）', () => {
    it('manifest-compile-project.json 编译结果应零 error', () => {
      const manifest = compileManifest(loadCompileFixture(), {
        metadataId: 'manifest-compile-demo',
        version: '1.0.0',
        compiledAt: fixedTime,
      });
      const result = validateManifest(manifest);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('createFrozenProject 编译结果应通过校验', () => {
      const project = normalizeOntologyProjectEntityRoles({
        ...createFrozenProject('1.0.0'),
        dataModel: {
          ...createFrozenProject('1.0.0').dataModel!,
          entities: createFrozenProject('1.0.0').dataModel!.entities.map((e) =>
            e.id === 'clause-1'
              ? { ...e, parentAggregateId: 'contract-1', entityRole: 'child_entity' as const }
              : e
          ),
        },
      });

      const manifest = compileManifest(project, {
        metadataId: 'contract-ontology',
        version: '1.0.0',
        compiledAt: fixedTime,
      });
      const result = validateManifest(manifest);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });
  });

  describe('语义层关键 id（制造域子集）', () => {
    it('应保留 production-order / operation 与场景关联', () => {
      const manifest = compileManifest(loadCompileFixture(), { compiledAt: fixedTime });
      const objectTypeIds = manifest.spec.semantic?.objectTypes?.map((o) => o.id) ?? [];
      expect(objectTypeIds).toContain('production-order');
      expect(objectTypeIds).toContain('operation');

      const operation = manifest.spec.semantic?.objectTypes?.find((o) => o.id === 'operation');
      expect(operation?.kind).toBe('entity');
      expect(operation?.aggregateRootId).toBe('production-order');

      const scenario = manifest.spec.semantic?.businessScenarios?.find((s) => s.id === 'scenario-mts') as
        | { applicableObjectTypeIds?: string[] }
        | undefined;
      expect(scenario?.applicableObjectTypeIds).toContain('production-order');
    });
  });

  describe('治理与数据源', () => {
    it('应编译 store 中的 governance 与 dataSources', () => {
      const project = loadCompileFixture();
      const now = fixedTime;
      project.governanceModel = {
        id: 'gov-1',
        roles: [{ id: 'role-a', name: '角色A', permissions: [] }],
        fieldPermissions: [],
        agentPolicies: [],
        createdAt: now,
        updatedAt: now,
      };
      project.dataSourcesModel = {
        id: 'ds-model-1',
        sources: [
          {
            id: 'ds-test',
            name: 'Test API',
            type: 'api',
            boundObjectTypeId: 'production-order',
            api: { authSecretRef: 'secret/test-ref' },
            createdAt: now,
            updatedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      const manifest = compileManifest(project, { compiledAt: fixedTime });
      expect(manifest.spec.governance?.roles?.map((r) => r.id)).toContain('role-a');
      expect(manifest.spec.dataSources?.[0]).toMatchObject({
        id: 'ds-test',
        api: { authSecretRef: 'secret/test-ref' },
      });
    });
  });

  describe('行为与事件引用', () => {
    it('action 应含 preRuleIds 与 publishesEventIds', () => {
      const manifest = compileManifest(loadCompileFixture(), { compiledAt: fixedTime });
      const action = manifest.spec.behavior?.actions?.find((a) => a.id === 'action-release-order');
      expect(action?.aggregateRootId).toBe('production-order');
      expect(action?.preRuleIds).toEqual(['rule-kitting']);
      expect(action?.publishesEventIds).toEqual(['evt-order-released']);
    });
  });
});
