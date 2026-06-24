import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MetadataManager } from '@/components/ontology/metadata-manager';
import { useOntologyStore } from '@/store/ontology-store';

const now = '2026-04-21T00:00:00.000Z';

describe('US-9.1 / MetadataManager CRUD and category filtering', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useOntologyStore.setState({
      project: null,
      metadataList: [
        {
          id: 'meta-1',
          domain: '合同管理',
          name: '合同名称',
          nameEn: 'ContractName',
          description: '合同名称模板',
          type: 'string',
          createdAt: now,
          updatedAt: now,
        },
      ],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
    });
  });

  it('应支持新增、编辑、删除元数据模板', async () => {
    render(React.createElement(MetadataManager));

    fireEvent.click(screen.getByRole('button', { name: '+ 新增元数据' }));
    fireEvent.change(screen.getByPlaceholderText('如：财务、物料'), { target: { value: '采购管理' } });
    fireEvent.change(screen.getByPlaceholderText('如：物料编码'), { target: { value: '采购订单号' } });
    fireEvent.change(screen.getByPlaceholderText('如：MATERIAL_ID'), { target: { value: 'PurchaseOrderNo' } });
    fireEvent.change(screen.getByPlaceholderText('字段的业务含义说明'), { target: { value: '采购订单唯一编码' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(screen.getByText('采购订单号')).toBeInTheDocument();
    });

    const created = useOntologyStore.getState().metadataList.find((item) => item.name === '采购订单号');
    expect(created).toBeDefined();
    expect(created?.domain).toBe('采购管理');
    expect(created?.nameEn).toBe('PurchaseOrderNo');

    fireEvent.click(screen.getAllByRole('button', { name: '编辑' })[1]);
    fireEvent.change(screen.getByPlaceholderText('字段的业务含义说明'), { target: { value: '采购订单业务主键' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(useOntologyStore.getState().metadataList.find((item) => item.name === '采购订单号')?.description).toBe('采购订单业务主键');
    });

    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[1]);
    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    await waitFor(() => {
      expect(screen.queryByText('采购订单号')).not.toBeInTheDocument();
    });
    expect(useOntologyStore.getState().metadataList.map((item) => item.name)).not.toContain('采购订单号');
  });

  it('应支持按领域/名称搜索元数据模板', () => {
    useOntologyStore.setState({
      metadataList: [
        {
          id: 'meta-1',
          domain: '合同管理',
          name: '合同名称',
          nameEn: 'ContractName',
          description: '合同标题',
          type: 'string',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'meta-2',
          domain: '采购管理',
          name: '采购组织',
          nameEn: 'PurchasingOrg',
          description: '采购组织编码',
          type: 'string',
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    render(React.createElement(MetadataManager));

    fireEvent.change(screen.getByPlaceholderText('搜索元数据（名称、英文名、描述）...'), { target: { value: '采购管理' } });
    expect(screen.queryByText('合同名称')).not.toBeInTheDocument();
    expect(screen.getByText('采购组织')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('搜索元数据（名称、英文名、描述）...'), { target: { value: 'ContractName' } });
    expect(screen.getByText('合同名称')).toBeInTheDocument();
    expect(screen.queryByText('采购组织')).not.toBeInTheDocument();
  });
});
