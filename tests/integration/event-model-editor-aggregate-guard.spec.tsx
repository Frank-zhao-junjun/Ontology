import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EventModelEditor } from '@/components/ontology/event-model-editor';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';

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
    description: '事件守卫测试',
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
      businessScenarios: [
        { id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'module-1' },
      ],
      entities: [
        {
          id: 'entity-root-1',
          name: '合同',
          nameEn: 'Contract',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'aggregate_root',
          attributes: [],
          relations: [],
        },
        {
          id: 'entity-child-1',
          name: '合同条款',
          nameEn: 'ContractClause',
          projectId: 'module-1',
          businessScenarioId: 'scenario-1',
          entityRole: 'child_entity',
          parentAggregateId: 'entity-root-1',
          attributes: [],
          relations: [],
        },
      ],
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    },
    behaviorModel: {
      id: 'bm-1',
      name: '合同行为模型',
      version: '1.0.0',
      domain: 'domain-1',
      stateMachines: [],
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    },
    ruleModel: null,
    processModel: null,
    eventModel: null,
    epcModel: null,
    createdAt: '2026-04-21T00:00:00.000Z',
    updatedAt: '2026-04-21T00:00:00.000Z',
  };
}

describe('US-2.1 / IT-MODEL-ROLE-002: only aggregate roots can define domain events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    useOntologyStore.setState({
      project: createProject(),
      versions: [],
      activeModelType: 'event',
    });
  });

  it('child_entity 尝试添加事件时应提示错误且不写入事件模型', () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);

    render(React.createElement(EventModelEditor, { mode: 'entity-detail', entityId: 'entity-child-1' }));

    fireEvent.click(screen.getByRole('button', { name: '+ 添加事件' }));
    fireEvent.click(screen.getByRole('button', { name: '添加事件' }));

    expect(alertSpy).toHaveBeenCalledWith('只有 `entityRole = aggregate_root` 的实体才能定义领域事件。请先在数据模型中将其设置为聚合根。');
    expect(useOntologyStore.getState().project?.eventModel?.events || []).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it('aggregate_root 添加事件时应成功写入事件模型', () => {
    render(React.createElement(EventModelEditor, { mode: 'entity-detail', entityId: 'entity-root-1' }));

    fireEvent.click(screen.getByRole('button', { name: '+ 添加事件' }));
    fireEvent.click(screen.getByRole('button', { name: '添加事件' }));

    expect(screen.getByText('合同已创建')).toBeInTheDocument();
    expect(useOntologyStore.getState().project?.eventModel?.events).toHaveLength(1);
    expect(useOntologyStore.getState().project?.eventModel?.events[0]).toEqual(expect.objectContaining({
      name: '合同已创建',
      transactionPhase: 'AFTER_COMMIT',
      payload: [{ field: 'id' }],
      entity: 'entity-root-1',
      entityRole: 'aggregate_root',
      entityIsAggregateRoot: true,
    }));
  });
});