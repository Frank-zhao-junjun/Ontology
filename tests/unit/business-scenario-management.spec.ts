import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { BusinessScenario, OntologyProject } from '@/types/ontology';

function resetStore() {
  useOntologyStore.setState({
    project: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: null,
  });
}

function createProject(scenarioCount = 1): OntologyProject {
  const businessScenarios = Array.from({ length: scenarioCount }, (_, index) => ({
    id: `scenario-${index + 1}`,
    name: `场景${index + 1}`,
    nameEn: `Scenario${index + 1}`,
    projectId: 'module-1',
    color: '#3b82f6',
  }));

  return {
    id: 'project-1',
    name: '合同管理系统',
    description: '业务场景管理测试',
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
      projects: [{ id: 'module-1', name: '合同中心', nameEn: 'ContractCenter' }],
      businessScenarios,
      entities: [
        {
          id: 'entity-1',
          name: '合同',
          nameEn: 'Contract',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'aggregate_root',
          attributes: [],
          relations: [],
        },
      ],
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    epcModel: null,
    createdAt: '2026-04-21T00:00:00.000Z',
    updatedAt: '2026-04-21T00:00:00.000Z',
  };
}

describe('US-1.2 / business scenario management', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createProject(),
      versions: [],
      activeModelType: 'data',
    });
  });

  it('应支持新增与更新业务场景颜色等基础字段', () => {
    const store = useOntologyStore.getState();

    const scenario: BusinessScenario = {
      id: 'scenario-2',
      name: '合同履约',
      nameEn: 'ContractFulfillment',
      projectId: 'module-1',
      color: '#22c55e',
    };

    store.addBusinessScenario(scenario);
    store.updateBusinessScenario('scenario-2', {
      ...scenario,
      description: '履约过程场景',
      color: '#f59e0b',
    });

    const saved = useOntologyStore.getState().project?.dataModel?.businessScenarios.find((item) => item.id === 'scenario-2');
    expect(saved?.description).toBe('履约过程场景');
    expect(saved?.color).toBe('#f59e0b');
  });

  it('删除仍有关联实体的业务场景时应拒绝删除', () => {
    const store = useOntologyStore.getState();

    store.deleteBusinessScenario('scenario-1');

    const scenarios = useOntologyStore.getState().project?.dataModel?.businessScenarios || [];
    expect(scenarios.map((item) => item.id)).toEqual(['scenario-1']);
  });

  it('同一项目达到 10 个业务场景后应拒绝新增第 11 个', () => {
    resetStore();
    useOntologyStore.setState({
      project: createProject(10),
      versions: [],
      activeModelType: 'data',
    });

    const store = useOntologyStore.getState();

    store.addBusinessScenario({
      id: 'scenario-11',
      name: '超限场景',
      nameEn: 'OverflowScenario',
      projectId: 'module-1',
      color: '#22c55e',
    });

    const scenarios = useOntologyStore.getState().project?.dataModel?.businessScenarios || [];
    expect(scenarios).toHaveLength(10);
    expect(scenarios.map((item) => item.id)).not.toContain('scenario-11');
  });
});