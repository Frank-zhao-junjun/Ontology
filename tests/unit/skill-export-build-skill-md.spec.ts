import { describe, expect, it } from 'vitest';
import { buildSkillMd } from '@/lib/skill-export/build-skill-md';
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

describe('skill-export/build-skill-md', () => {
  it('应包含项目名称和领域', () => {
    const project = makeProject();
    const result = buildSkillMd(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('# 生产管理 本体模型 Skill');
    expect(result).toContain('离散制造');
  });

  it('应包含所有能力概述', () => {
    const project = makeProject();
    const result = buildSkillMd(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('实体属性查询');
    expect(result).toContain('实体关系推理');
    expect(result).toContain('业务规则解释');
    expect(result).toContain('状态机分析');
    expect(result).toContain('事件影响分析');
  });

  it('应包含加载方式说明', () => {
    const project = makeProject();
    const result = buildSkillMd(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('Coze');
    expect(result).toContain('自定义 Agent');
    expect(result).toContain('ontology.json');
    expect(result).toContain('intents.json');
  });

  it('应包含文件说明', () => {
    const project = makeProject();
    const result = buildSkillMd(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('skill.json');
    expect(result).toContain('README.md');
    expect(result).toContain('examples/query-examples.md');
    expect(result).toContain('examples/reasoning-examples.md');
  });

  it('应包含项目状态', () => {
    const project = makeProject();
    const result = buildSkillMd(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('draft');
    expect(result).toContain('confirmed');
    expect(result).toContain('unknown');
    expect(result).toContain('archived');
  });

  it('应包含版本和技术信息', () => {
    const project = makeProject();
    const result = buildSkillMd(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '2.0.0' });
    expect(result).toContain('Skill 版本：2.0.0');
    expect(result).toContain('Ontology 本体模型建模工具');
  });

  it('domain 为字符串类型时应正确处理', () => {
    const project = makeProject({ domain: '制造业' as any });
    const result = buildSkillMd(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('制造业');
  });
});
