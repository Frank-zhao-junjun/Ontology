import type { OntologyProject } from '@/types/ontology';
import type { SkillJson } from './types';
import { resolveProjectStatus } from './annotate-status';

function sanitizeNameEn(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Ontology';
  // 保留中文、英文、数字、下划线，其他替换为下划线
  const safe = trimmed.replace(/[^\w\u4e00-\u9fff]+/gu, '_').replace(/^_+|_+$/g, '');
  return safe || 'Ontology';
}

function toPascalCase(name: string): string {
  const safe = sanitizeNameEn(name);
  return safe
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join('');
}

export function buildSkillJson(
  project: OntologyProject,
  options: { exportedAt: string; version: string }
): SkillJson {
  const { exportedAt, version } = options;
  const domainName = typeof project.domain === 'string' ? project.domain : project.domain?.name || '';
  const projectStatus = resolveProjectStatus(project);
  const statusSuffix = projectStatus === 'confirmed' ? '' : ` (${projectStatus})`;

  const name = `${project.name}本体模型${statusSuffix}`;
  const nameEn = `${toPascalCase(project.name)}${toPascalCase(domainName)}Ontology`;
  const description =
    project.description ||
    `涵盖${domainName}领域核心实体的本体模型，由 Ontology 建模工具导出`;

  return {
    name,
    nameEn,
    version,
    description,
    domain: domainName,
    exportedAt,
    source: {
      tool: 'Ontology 本体模型建模工具',
      url: 'https://Ontology1.coze.site',
      projectId: project.id,
    },
    format: {
      type: 'ontology-model-skill',
      version: '1.0',
    },
    files: {
      skill: 'SKILL.md',
      ontology: 'ontology.json',
      intents: 'intents.json',
      readme: 'README.md',
    },
    capabilities: [
      'entity-query',
      'relation-query',
      'rule-explanation',
      'state-transition-analysis',
      'event-impact-analysis',
    ],
  };
}
