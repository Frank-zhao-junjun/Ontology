import { describe, expect, it } from 'vitest';
import type { OntologyProject } from '@/types/ontology';
import {
  buildProjectOntologySummary,
  PROJECT_SUMMARY_MAX_LENGTH,
} from '@/lib/ai-draft/build-project-summary';

function makeProject(overrides: Partial<OntologyProject> = {}): OntologyProject {
  return {
    id: 'proj-1',
    name: '测试项目',
    dataModel: null,
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as OntologyProject;
}

function makeProjectWithDataModel(entityCount: number): OntologyProject {
  const entities = Array.from({ length: entityCount }, (_, i) => ({
    id: `e${i}`,
    name: `实体${i}`,
    nameEn: `Entity${i}`,
    projectId: 'p1',
    businessScenarioId: 'bs1',
    description: `这是第 ${i} 个实体的描述，用于填充摘要长度`,
    attributes: [
      { id: `a${i}-1`, name: '金额', nameEn: 'amount', dataType: 'decimal' as const },
    ],
    relations: i > 0 ? [{ id: `r${i}`, name: '关联', type: 'one_to_many' as const, targetEntity: 'e0' }] : [],
  }));
  return makeProject({
    dataModel: {
      id: 'dm1',
      name: '数据模型',
      version: 'v1',
      domain: 'd',
      projects: [],
      businessScenarios: [],
      entities,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  });
}

describe('buildProjectOntologySummary', () => {
  it('空项目返回空摘要', () => {
    expect(buildProjectOntologySummary(makeProject())).toBe('');
  });

  it('应包含实体、属性与关系行', () => {
    const summary = buildProjectOntologySummary(makeProjectWithDataModel(2));
    expect(summary).toContain('## E1 数据模型');
    expect(summary).toContain('实体 | e0 | 实体0 (Entity0)');
    expect(summary).toContain('属性 | e0 | a0-1 | 实体0.金额 | decimal');
    expect(summary).toContain('关系 | r1 | 实体1 -> 实体0 | one_to_many | 关联');
  });

  it('应包含 E2/E3/E4/E5 维度要素', () => {
    const project = makeProject({
      behaviorModel: {
        id: 'bm1', name: '行为模型', version: 'v1', domain: 'd',
        stateMachines: [
          { id: 'sm1', name: '订单状态机', entity: 'e1', statusField: 'status', states: [{ id: 's1', name: '草稿' }], transitions: [] },
        ],
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      },
      ruleModel: {
        id: 'rm1', name: '规则模型', version: 'v1', domain: 'd',
        rules: [
          { id: 'ru1', name: '金额必填', type: 'field_validation', entity: 'e1', condition: { type: 'regex' }, errorMessage: '必填' },
        ],
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      },
      eventModel: {
        id: 'evm1', name: '事件模型', version: 'v1', domain: 'd',
        events: [{ id: 'ev1', name: '订单已创建', entity: 'e1', trigger: 'create', payload: [] }],
        subscriptions: [],
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      },
      organizationModel: {
        id: 'om1',
        departments: [{ id: 'd1', name: '采购部', nameEn: 'PD', type: 'department', status: 'active' }],
        positions: [{ id: 'p1', name: '采购专员', nameEn: 'Buyer', departmentId: 'd1', roleIds: [], responsibilities: [], status: 'active' }],
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      },
    } as Partial<OntologyProject>);
    const summary = buildProjectOntologySummary(project);
    expect(summary).toContain('状态机 | sm1 | 订单状态机 | 状态: 草稿');
    expect(summary).toContain('规则 | ru1 | 金额必填 | field_validation');
    expect(summary).toContain('事件 | ev1 | 订单已创建 | create');
    expect(summary).toContain('部门 | d1 | 采购部');
    expect(summary).toContain('岗位 | p1 | 采购专员');
  });

  it('超长项目应截断到 2000 字以内并追加标注', () => {
    const summary = buildProjectOntologySummary(makeProjectWithDataModel(200));
    expect(summary.length).toBeLessThanOrEqual(
      PROJECT_SUMMARY_MAX_LENGTH + '\n...（摘要已截断，原始长度 999999 字符）'.length,
    );
    expect(summary).toContain('摘要已截断');
  });

  it('未超长时不应有截断标注', () => {
    const summary = buildProjectOntologySummary(makeProjectWithDataModel(2));
    expect(summary).not.toContain('摘要已截断');
  });
});
