import { stringify } from 'yaml';
import { compileManifest, type CompileManifestOptions } from '@/lib/manifest-compiler';
import {
  validateManifest,
  type ManifestValidationResult,
  type OntologyManifest,
} from '@/lib/manifest-validator';
import type { OntologyProject } from '@/types/ontology';

export type ManifestExportFormat = 'yaml' | 'json' | 'xlsx';

export interface BuildManifestExportOptions extends CompileManifestOptions {
  format?: ManifestExportFormat;
}

export interface ManifestExportBundle {
  manifest: OntologyManifest;
  format: ManifestExportFormat;
  content: string;
  filename: string;
  validation: ManifestValidationResult;
}

function sanitizeFilenameSegment(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'ontology';
  const safe = trimmed.replace(/[^\w\u4e00-\u9fff-]+/gu, '_').replace(/^_+|_+$/g, '');
  return safe || 'ontology';
}

/**
 * 编译 OntologyProject → OntologyManifest，序列化为 YAML/JSON，并执行 V01–V11 校验。
 * 供浏览器端 US-D03 导出（无需 /api/manifest/export）。
 */
export function buildManifestExportBundle(
  project: OntologyProject,
  options?: BuildManifestExportOptions
): ManifestExportBundle {
  const format = options?.format ?? 'yaml';
  const manifest = compileManifest(project, options);
  const validation = validateManifest(manifest);
  const idSegment = sanitizeFilenameSegment(manifest.metadata.id);
  const formatSuffix = format === 'yaml' ? 'yaml' : 'json';
  const filename = `${idSegment}-ontology-manifest.${formatSuffix}`;

  const content =
    format === 'json'
      ? `${JSON.stringify(manifest, null, 2)}\n`
      : stringify(manifest, { lineWidth: 0 });

  return {
    manifest,
    format,
    content,
    filename,
    validation,
  };
}

/** 触发浏览器下载；仅在 validation.valid 时生效。 */
export function downloadManifestExport(bundle: ManifestExportBundle): boolean {
  if (!bundle.validation.valid) {
    return false;
  }

  const mime =
    bundle.format === 'yaml' ? 'application/x-yaml;charset=utf-8' : 'application/json;charset=utf-8';
  const blob = new Blob([bundle.content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = bundle.filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}
