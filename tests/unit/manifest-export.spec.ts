import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildManifestExportBundle,
  downloadManifestExport,
} from '@/lib/manifest-export';
import { normalizeOntologyProjectEntityRoles } from '@/lib/entity-role';
import type { OntologyProject } from '@/types/ontology';

const FIXTURE_PATH = join(process.cwd(), 'tests/fixtures/manifest-compile-project.json');

function loadCompileFixture(): OntologyProject {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as OntologyProject;
  return normalizeOntologyProjectEntityRoles(raw);
}

describe('manifest-export', () => {
  const fixedTime = '2026-06-04T12:00:00.000Z';

  it('合法项目应生成 YAML 且通过校验', () => {
    const project = loadCompileFixture();
    const bundle = buildManifestExportBundle(project, {
      metadataId: 'test-ontology',
      version: '1.0.0',
      compiledAt: fixedTime,
      format: 'yaml',
    });

    expect(bundle.format).toBe('yaml');
    expect(bundle.filename).toBe('test-ontology-ontology-manifest.yaml');
    expect(bundle.content).toContain('apiVersion: ontology.platform/v1');
    expect(bundle.validation.valid).toBe(true);
  });

  it('校验失败时不应触发下载', () => {
    const project = loadCompileFixture();
    const bundle = buildManifestExportBundle(
      {
        ...project,
        dataModel: project.dataModel
          ? { ...project.dataModel, entities: [] }
          : null,
      },
      { format: 'json' }
    );

    expect(bundle.validation.valid).toBe(false);
    const createElement = vi.spyOn(document, 'createElement');
    expect(downloadManifestExport(bundle)).toBe(false);
    expect(createElement).not.toHaveBeenCalled();
    createElement.mockRestore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
