import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VersionManager } from '@/components/ontology/version-manager';
import { useOntologyStore } from '@/store/ontology-store';
import { createFrozenProject } from '../unit/test-helpers';

const baseTime = '2026-04-21T10:00:00.000Z';

describe('US-10.3 / VersionManager history and impact summary', () => {
  beforeEach(() => {
    const project = createFrozenProject('1.0.0');
    const draftVersion = {
      id: 'ver-100',
      projectId: project.id,
      version: '1.0.0',
      name: '初始冻结版',
      description: '第一版基线',
      metamodels: {
        data: {
          ...project.dataModel!,
          entities: project.dataModel!.entities.slice(0, 1),
        },
        behavior: {
          ...project.behaviorModel!,
          stateMachines: project.behaviorModel!.stateMachines.slice(0, 1),
        },
        rules: project.ruleModel,
        process: project.processModel,
        events: project.eventModel,
        epc: project.epcModel,
      },
      createdAt: baseTime,
      status: 'draft' as const,
    };

    const publishedVersion = {
      ...draftVersion,
      id: 'ver-110',
      version: '1.1.0',
      name: '增强版本',
      description: '增加实体和状态机',
      metamodels: {
        ...draftVersion.metamodels,
        data: project.dataModel,
        behavior: project.behaviorModel,
      },
      createdAt: '2026-04-21T11:00:00.000Z',
      publishedAt: '2026-04-21T12:00:00.000Z',
      status: 'published' as const,
    };

    useOntologyStore.setState({
      project,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [draftVersion, publishedVersion],
      activeModelType: 'data',
    });
  });

  it('应展示版本历史列表及发布状态', () => {
    render(React.createElement(VersionManager));

    expect(screen.getByText('初始冻结版')).toBeInTheDocument();
    expect(screen.getByText('增强版本')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v1.1.0')).toBeInTheDocument();
    expect(screen.getByText('草稿')).toBeInTheDocument();
    expect(screen.getByText('已发布')).toBeInTheDocument();
  });

  it('应展示每个历史版本的模型规模摘要（影响分析基线）', () => {
    render(React.createElement(VersionManager));

    expect(screen.getAllByText('实体: 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('状态机: 1').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '创建新版本' }));
    expect(screen.getByText('当前模型快照')).toBeInTheDocument();
    expect(screen.getByText('实体')).toBeInTheDocument();
    expect(screen.getByText('状态机')).toBeInTheDocument();
  });
});
