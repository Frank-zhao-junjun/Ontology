import { beforeEach, describe, expect, it } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { EntityProject, OntologyProject } from '@/types/ontology';

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

function createProject(): OntologyProject {
  return {
    id: 'project-1',
    name: '合同管理系统',
    description: '项目分组管理测试',
    domain: {
      id: 'domain-1',
      name: '合同管理',
      nameEn: 'ContractManagement',
      description: '合同管理领域',
    },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [
        {
          id: 'module-1',
          name: '合同中心',
          nameEn: 'ContractCenter',
          color: '#3b82f6',
        },
      ],
      businessScenarios: [
        { id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'module-1' },
      ],
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

describe('US-1.1 / entity project management', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createProject(),
      versions: [],
      activeModelType: 'data',
    });
  });

  it('应支持新增与更新项目分组基础字段', () => {
    const store = useOntologyStore.getState();

    const entityProject: EntityProject = {
      id: 'module-2',
      name: '履约中心',
      nameEn: 'FulfillmentCenter',
      color: '#22c55e',
    };

    store.addEntityProject(entityProject);
    store.updateEntityProject('module-2', {
      ...entityProject,
      description: '负责合同履约跟踪',
      color: '#f59e0b',
    });

    const saved = useOntologyStore.getState().project?.dataModel?.projects.find((item) => item.id === 'module-2');
    expect(saved?.description).toBe('负责合同履约跟踪');
    expect(saved?.color).toBe('#f59e0b');
  });

  it('删除仍有关联实体的项目分组时应拒绝删除', () => {
    const store = useOntologyStore.getState();

    store.deleteEntityProject('module-1');

    const projects = useOntologyStore.getState().project?.dataModel?.projects || [];
    expect(projects.map((item) => item.id)).toEqual(['module-1']);
  });
});