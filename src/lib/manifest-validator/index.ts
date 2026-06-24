import { runManifestValidationRules } from './rules';
import {
  ONTOLOGY_MANIFEST_KIND,
  type ManifestValidationIssue,
  type ManifestValidationResult,
  type OntologyManifest,
} from './types';
import { isRecord, issue } from './utils';

export * from './types';
export { collectManifestIds } from './collect-ids';
export { runManifestValidationRules } from './rules';

function validateStructure(input: unknown): { manifest: OntologyManifest | null; issues: ManifestValidationIssue[] } {
  const issues: ManifestValidationIssue[] = [];

  if (!isRecord(input)) {
    return {
      manifest: null,
      issues: [
        issue({
          code: 'STRUCTURE',
          elementType: 'OntologyManifest',
          message: 'Manifest 必须是对象',
        }),
      ],
    };
  }

  const requiredTopLevel: Array<{ key: string; label: string }> = [
    { key: 'apiVersion', label: 'apiVersion' },
    { key: 'kind', label: 'kind' },
    { key: 'metadata', label: 'metadata' },
    { key: 'spec', label: 'spec' },
  ];

  for (const { key, label } of requiredTopLevel) {
    if (!(key in input)) {
      issues.push(
        issue({
          code: 'STRUCTURE',
          elementType: 'OntologyManifest',
          field: label,
          message: `缺少必填字段 ${label}`,
        })
      );
    }
  }

  if (issues.length > 0) {
    return { manifest: null, issues };
  }

  if (!isRecord(input.metadata)) {
    issues.push(
      issue({
        code: 'STRUCTURE',
        elementType: 'metadata',
        message: 'metadata 必须是对象',
      })
    );
    return { manifest: null, issues };
  }

  if (!isRecord(input.spec)) {
    issues.push(
      issue({
        code: 'STRUCTURE',
        elementType: 'spec',
        message: 'spec 必须是对象',
      })
    );
    return { manifest: null, issues };
  }

  const metadata = input.metadata;
  for (const field of ['id', 'version', 'name', 'boundedContext'] as const) {
    if (typeof metadata[field] !== 'string' || metadata[field].trim() === '') {
      issues.push(
        issue({
          code: 'STRUCTURE',
          elementType: 'metadata',
          id: typeof metadata.id === 'string' ? metadata.id : undefined,
          field,
          message: `metadata.${field} 必填`,
        })
      );
    }
  }

  if (issues.length > 0) {
    return { manifest: null, issues };
  }

  const manifest = input as unknown as OntologyManifest;
  if (manifest.kind !== ONTOLOGY_MANIFEST_KIND) {
    // still run kind check in rules
  }

  return { manifest, issues };
}

/**
 * 校验 OntologyManifest（V01–V11，与 ontology-manifest-spec §8 对齐）
 */
export function validateManifest(input: unknown): ManifestValidationResult {
  const { manifest, issues: structureIssues } = validateStructure(input);

  if (!manifest) {
    return {
      valid: false,
      errors: structureIssues,
      warnings: [],
    };
  }

  const ruleIssues = runManifestValidationRules(manifest);
  const allIssues = [...structureIssues, ...ruleIssues];
  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 类型守卫：结构合法且校验通过（无 error）
 */
export function isValidOntologyManifest(input: unknown): input is OntologyManifest {
  return validateManifest(input).valid;
}
