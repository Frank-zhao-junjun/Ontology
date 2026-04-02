import { describe, expect, it } from 'vitest';
import { ensureEpcProfile, regenerateEpcProfile } from '@/lib/epc-generator';
import type { OntologyProject } from '@/types/ontology';

const now = '2026-04-01T00:00:00.000Z';

function createProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '合同管理本体',
    description: '测试项目',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同领域',
    },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [],
      businessScenarios: [{ id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', description: '合同审批与签署流程说明', projectId: 'proj-1' }],
      entities: [
        {
          id: 'entity-contract',
          name: '合同',
          nameEn: 'Contract',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'aggregate_root',
          attributes: [
            { id: 'attr-1', name: '合同编号', nameEn: 'contractNo', dataType: 'string' },
            { id: 'attr-2', name: '甲方主体', nameEn: 'firstParty', dataType: 'reference', referenceKind: 'masterData', isMasterDataRef: true, masterDataType: '客户主数据' },
          ],
          relations: [],
        },
        {
          id: 'entity-line',
          name: '合同明细',
          nameEn: 'ContractLine',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'child_entity',
          parentAggregateId: 'entity-contract',
          attributes: [{ id: 'line-1', name: '金额', nameEn: 'amount', dataType: 'decimal' }],
          relations: [],
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    behaviorModel: {
      id: 'bm-1',
      name: '合同状态机',
      version: '1.0.0',
      domain: 'domain-1',
      stateMachines: [
        {
          id: 'sm-1',
          name: '合同生命周期',
          entity: 'entity-contract',
          statusField: 'status',
          states: [
            { id: 'draft', name: '草稿', isInitial: true },
            { id: 'approved', name: '已审批', isFinal: true },
          ],
          transitions: [
            { id: 'transition-submit', name: '提交审批', from: 'draft', to: 'approved', trigger: 'manual', description: '提交并审批' },
          ],
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    ruleModel: {
      id: 'rm-1',
      name: '合同规则',
      version: '1.0.0',
      domain: 'domain-1',
      rules: [
        {
          id: 'rule-1',
          name: '合同编号必填',
          type: 'field_validation',
          entity: 'entity-contract',
          field: 'attr-1',
          condition: { type: 'regex', pattern: '.+' },
          errorMessage: '合同编号不能为空',
          severity: 'error',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    processModel: null,
    eventModel: {
      id: 'em-1',
      name: '合同事件',
      version: '1.0.0',
      domain: 'domain-1',
      events: [
        {
          id: 'event-1',
          name: '合同已创建',
          entity: 'entity-contract',
          trigger: 'create',
          payload: [{ field: 'id' }],
        },
      ],
      subscriptions: [],
      createdAt: now,
      updatedAt: now,
    },
    epcModel: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe('UT-EPC-001: EPC generator skeleton', () => {
  it('应为聚合根生成基础 EPC profile 与 Markdown', () => {
    const project = createProject();
    const profile = ensureEpcProfile(project, 'entity-contract');

    expect(profile.aggregateId).toBe('entity-contract');
    expect(profile.activities.length).toBeGreaterThan(0);
    expect(profile.informationObjects.some((item) => item.name === '合同')).toBe(true);
    expect(profile.generatedDocument).toContain('# EPC业务活动规格说明书');
    expect(profile.generatedDocument).toContain('合同');
  });

  it('重新生成时应以业务场景描述刷新业务背景', () => {
    const project = createProject();
    const profile = ensureEpcProfile(project, 'entity-contract');
    const regenerated = regenerateEpcProfile(project, {
      ...profile,
      businessBackground: '旧背景',
    });

    expect(regenerated.businessBackground).toBe('合同审批与签署流程说明');
    expect(regenerated.status).toBe('generated');
    expect(regenerated.generatedDocument).toContain('合同审批与签署流程说明');
  });

  it('补充组织单元与系统后应进入 EPC 文档并消除缺口提示', () => {
    const project = createProject();
    const profile = ensureEpcProfile(project, 'entity-contract');
    const regenerated = regenerateEpcProfile(project, {
      ...profile,
      activities: profile.activities.map((activity, index) => ({
        ...activity,
        ownerOrgUnitId: index === 0 ? 'org-1' : undefined,
        systemId: index === 0 ? undefined : 'system-1',
        inputObjectIds: profile.informationObjects[0] ? [profile.informationObjects[0].id] : undefined,
        outputObjectIds: profile.informationObjects[1] ? [profile.informationObjects[1].id] : undefined,
      })),
      organizationalUnits: [
        {
          id: 'org-1',
          name: '合同专员',
          type: 'role',
          responsibilities: '发起合同审批',
          permissions: '提交审批',
        },
      ],
      systems: [
        {
          id: 'system-1',
          name: '合同平台',
          type: 'platform',
          description: '承载合同审批与签署流程',
        },
      ],
    });

    expect(regenerated.generatedDocument).toContain('合同专员');
    expect(regenerated.generatedDocument).toContain('合同平台');
    expect(regenerated.generatedDocument).toContain('### 3.6 执行系统与外部平台');
    expect(regenerated.generatedDocument).toContain('### 4.2 流程说明');
    expect(regenerated.generatedDocument).toContain('## 5. EPC流程矩阵');
    expect(regenerated.generatedDocument).toContain('## 6. EPC元素连接关系');
    expect(regenerated.generatedDocument).toContain('## 7. 角色和权限矩阵');
    expect(regenerated.generatedDocument).toContain('事件完整性');
    expect(regenerated.generatedDocument).toContain('流程矩阵完整性');
    expect(regenerated.validationSummary?.issues.some((issue) => issue.code === 'EPC_ORG_MISSING')).toBe(false);
    expect(regenerated.validationSummary?.issues.some((issue) => issue.code === 'EPC_SYSTEM_MISSING')).toBe(false);
  });

  it('重新生成时应刷新派生信息对象并丢弃手工补充对象', () => {
    const project = createProject();
    const profile = ensureEpcProfile(project, 'entity-contract');
    const regenerated = regenerateEpcProfile(project, {
      ...profile,
      informationObjects: [
        ...profile.informationObjects.map((item) => (
          item.sourceType === 'aggregate'
            ? { ...item, description: '流程中作为主单据流转' }
            : item
        )),
        {
          id: 'manual-1',
          name: '预算校验结果',
          sourceType: 'manual',
          attributes: ['预算额度', '校验结果'],
          description: '外部预算系统返回结果',
        },
      ],
    });

    expect(regenerated.informationObjects.some((item) => item.name === '预算校验结果' && item.sourceType === 'manual')).toBe(false);
    expect(regenerated.informationObjects.find((item) => item.sourceType === 'aggregate')?.description).toBe('流程中作为主单据流转');
  });
});