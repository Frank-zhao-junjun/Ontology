import { describe, expect, it } from 'vitest';
import { buildSkillJson } from '@/lib/skill-export/build-skill-json';
import type { OntologyProject } from '@/types/ontology';

function makeProject(overrides: Partial<OntologyProject> = {}): OntologyProject {
  return {
    id: 'proj-1',
    name: '生产管理',
    description: '测试项目',
    domain: { id: 'dm-1', name: '离散制造', nameEn: 'DiscreteManufacturing', description: '' },
    dataModel: {
      id: 'dm-1', name: '数据模型', version: '1.0.0', domain: '离散制造',
      projects: [], businessScenarios: [], entities: [], attributes: [],
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    },
    behaviorModel: null, ruleModel: null, processModel: null, eventModel: null,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as OntologyProject;
}

describe('skill-export/build-skill-json', () => {
  it('构建包含完整元数据的 skill.json', () => {
    const project = makeProject();
    const result = buildSkillJson(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '2.0.0' });

    expect(result.version).toBe('2.0.0');
    expect(result.domain).toBe('离散制造');
    expect(result.source.tool).toBe('Ontology 本体模型建模工具');
    expect(result.source.projectId).toBe('proj-1');
    expect(result.format.type).toBe('ontology-model-skill');
    expect(result.format.version).toBe('1.0');
    expect(result.capabilities).toHaveLength(5);
    expect(result.capabilities).toContain('entity-query');
    expect(result.files.skill).toBe('SKILL.md');
    expect(result.files.ontology).toBe('ontology.json');
  });

  it('name 应包含项目名和状态后缀', () => {
    const project = makeProject();
    const result = buildSkillJson(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result.name).toContain('生产管理');
    expect(result.name).toContain('本体模型');
  });

  it('confirmed 状态不追加后缀', () => {
    const project = makeProject({ status: 'confirmed' });
    const result = buildSkillJson(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result.name).not.toContain('(draft)');
  });
});
