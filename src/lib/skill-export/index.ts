import JSZip from 'jszip';
import type { OntologyProject } from '@/types/ontology';
import type { SkillExportOptions, SkillExportScope } from './types';
import { buildOntologyJson, isEmptyScope } from './build-ontology-json';
import { buildSkillJson } from './build-skill-json';
import { buildIntentsJson } from './build-intents-json';
import { buildExamples } from './build-examples';
import { buildSkillMd } from './build-skill-md';
import { buildReadme } from './build-readme';
import { resolveProjectStatus } from './annotate-status';

export * from './types';
export type { SkillExportOptions, SkillExportScope, SkillJson, OntologyJson } from './types';
export { buildOntologyJson, isEmptyScope } from './build-ontology-json';
export { buildSkillJson } from './build-skill-json';
export { buildIntentsJson } from './build-intents-json';
export { buildExamples } from './build-examples';
export { buildSkillMd } from './build-skill-md';
export { buildReadme } from './build-readme';
export { renderOntologyMarkdown } from './markdown-renderer';
export { resolveProjectStatus, resolveObjectStatus } from './annotate-status';
// buildSkillZip is defined and exported below

const DEFAULT_OPTIONS: Required<SkillExportOptions> = {
  scope: 'all',
  includeExamples: true,
  includeSemanticLayer: true,
};

function sanitizeFilenameSegment(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'ontology';
  const safe = trimmed.replace(/[^\w\u4e00-\u9fff-]+/gu, '_').replace(/^_+|_+$/g, '');
  return safe || 'ontology';
}

export function buildSkillExportFilename(project: OntologyProject, version: string): string {
  const nameSegment = sanitizeFilenameSegment(project.name);
  const versionSegment = version.startsWith('v') ? version : `v${version}`;
  return `ontology-model-skill-${nameSegment}-${versionSegment}.zip`;
}

export async function buildSkillZip(
  project: OntologyProject,
  options?: SkillExportOptions
): Promise<{ buffer: Buffer; filename: string; projectStatus: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const scope: SkillExportScope = opts.scope ?? 'all';
  const exportedAt = new Date().toISOString();
  const version = (project as { version?: string }).version || '1.0.0';
  const projectStatus = resolveProjectStatus(project);

  const ontologyJson = buildOntologyJson(project, {
    scope,
    includeSemanticLayer: opts.includeSemanticLayer,
    exportedAt,
    version,
  });

  if (isEmptyScope(ontologyJson)) {
    throw new Error('EMPTY_SCOPE');
  }

  const skillJson = buildSkillJson(project, { exportedAt, version });
  const intentsJson = buildIntentsJson(ontologyJson);
  const skillMd = buildSkillMd(project, { exportedAt, version });
  const readmeMd = buildReadme(project, { exportedAt, version });

  const zip = new JSZip();
  zip.file('skill.json', JSON.stringify(skillJson, null, 2));
  zip.file('SKILL.md', skillMd);
  zip.file('README.md', readmeMd);
  zip.file('ontology.json', JSON.stringify(ontologyJson, null, 2));
  zip.file('intents.json', JSON.stringify(intentsJson, null, 2));

  if (opts.includeExamples) {
    const { queryExamples, reasoningExamples } = buildExamples(ontologyJson);
    zip.file('examples/query-examples.md', queryExamples);
    zip.file('examples/reasoning-examples.md', reasoningExamples);
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const filename = buildSkillExportFilename(project, version);

  return { buffer, filename, projectStatus };
}
