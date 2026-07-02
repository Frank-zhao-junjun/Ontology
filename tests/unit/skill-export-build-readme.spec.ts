import { describe, expect, it } from 'vitest';
import { buildReadme } from '@/lib/skill-export/build-readme';
import type { OntologyProject } from '@/types/ontology';

function makeProject(overrides: Partial<OntologyProject> = {}): OntologyProject {
  return {
    id: 'proj-1',
    name: '生产管理',
    description: '测试项目',
    domain: { id: 'dm-1', name: '离散制造', nameEn: 'DiscreteManufacturing', description: '' },
    dataModel: null, behaviorModel: null, ruleModel: null, processModel: null, eventModel: null,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as OntologyProject;
}

describe('skill-export/build-readme', () => {
  it('应包含项目名称和领域', () => {
    const project = makeProject();
    const result = buildReadme(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('# 生产管理 本体模型 Skill');
    expect(result).toContain('离散制造');
  });

  it('应包含版本和导出时间', () => {
    const project = makeProject();
    const result = buildReadme(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '2.0.0' });
    expect(result).toContain('Skill 版本**：2.0.0');
    expect(result).toContain('2026-07-01');
  });

  it('应包含状态标注说明', () => {
    const project = makeProject();
    const result = buildReadme(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    // 默认项目状态为draft，应显示"草稿"
    expect(result).toContain('项目状态**：草稿');
    // 应包含状态含义列表
    expect(result).toContain('confirmed');
    expect(result).toContain('draft');
  });

  it('应包含文件说明', () => {
    const project = makeProject();
    const result = buildReadme(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('skill.json');
    expect(result).toContain('ontology.json');
    expect(result).toContain('intents.json');
    expect(result).toContain('SKILL.md');
    expect(result).toContain('查询类示例');
    expect(result).toContain('推理类示例');
  });

  it('应包含快速开始指南', () => {
    const project = makeProject();
    const result = buildReadme(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('Coze');
    expect(result).toContain('自定义 Agent');
    expect(result).toContain('解压 ZIP 文件');
    expect(result).toContain('triggerPhrases');
  });

  it('应包含限制说明', () => {
    const project = makeProject();
    const result = buildReadme(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('不涉及模型外的业务判断');
    expect(result).toContain('不执行写操作');
  });

  it('confirmed 状态应显示"已确认"', () => {
    const project = makeProject({ status: 'confirmed' } as any);
    const result = buildReadme(project, { exportedAt: '2026-07-01T00:00:00.000Z', version: '1.0.0' });
    expect(result).toContain('已确认');
  });
});
