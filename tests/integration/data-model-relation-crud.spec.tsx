import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataModelEditor } from '@/components/ontology/data-model-editor';
import { useOntologyStore } from '@/store/ontology-store';

const now = '2026-04-01T00:00:00.000Z';

function initStore() {
  useOntologyStore.setState({
    project: {
      id: 'proj-1',
      name: '合同管理本体',
      description: '关系建模测试项目',
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
        businessScenarios: [{ id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'module-1' }],
        entities: [
          {
            id: 'entity-contract',
            name: '合同',
            nameEn: 'Contract',
            projectId: 'module-1',
            businessScenarioId: 'scenario-1',
            entityRole: 'aggregate_root',
            attributes: [],
            relations: [],
          },
          {
            id: 'entity-order',
            name: '订单',
            nameEn: 'Order',
            projectId: 'module-1',
            businessScenarioId: 'scenario-1',
            entityRole: 'aggregate_root',
            attributes: [],
            relations: [],
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      behaviorModel: null,
      ruleModel: null,
      processModel: null,
      eventModel: null,
      createdAt: now,
      updatedAt: now,
    },
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: 'data',
  });
}

describe('US-3.5 / DataModelEditor relation CRUD and constraints', () => {
  beforeEach(() => {
    initStore();
  });

  it('应支持关系新增、编辑与删除', async () => {
    render(React.createElement(DataModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

    fireEvent.click(screen.getByRole('button', { name: '+ 添加关系' }));
    fireEvent.change(screen.getByPlaceholderText('如：关联发票'), { target: { value: '关联订单' } });
    let comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[2]);
    fireEvent.click(await screen.findByText('订单 (Order)'));
    fireEvent.click(screen.getByRole('button', { name: '添加关系' }));

    await waitFor(() => {
      expect(screen.getByText('关联订单')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    fireEvent.change(screen.getByDisplayValue('关联订单'), { target: { value: '关联销售订单' } });
    fireEvent.click(screen.getByRole('button', { name: '保存关系' }));

    await waitFor(() => {
      expect(screen.getByText('关联销售订单')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(screen.queryByText('关联销售订单')).not.toBeInTheDocument();
    });
  });

  it('多对多关系缺少中间实体时应拦截保存', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    render(React.createElement(DataModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

    fireEvent.click(screen.getByRole('button', { name: '+ 添加关系' }));
    fireEvent.change(screen.getByPlaceholderText('如：关联发票'), { target: { value: '关联附件' } });
    let comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[0]);
    fireEvent.click(await screen.findByText('多对多 (N:M)'));
    comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[2]);
    fireEvent.click(await screen.findByText('订单 (Order)'));
    fireEvent.click(screen.getByRole('button', { name: '添加关系' }));

    expect(alertSpy).toHaveBeenCalledWith('多对多关系必须填写中间实体');
    const relations = useOntologyStore.getState().project?.dataModel?.entities.find((e) => e.id === 'entity-contract')?.relations || [];
    expect(relations).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});
