import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MasterDataManager } from '@/components/ontology/masterdata-manager';
import { useOntologyStore } from '@/store/ontology-store';

describe('IT-MASTERDATA-003: 主数据模板字段一键填充', () => {
  beforeEach(() => {
    useOntologyStore.setState({ masterDataList: [], masterDataRecords: {} });
    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ success: true, data: { definitions: [], records: {} } }),
    } as Response);
  });

  it('新增主数据时选择字段模板应自动写入字段清单', async () => {
    render(React.createElement(MasterDataManager));

    fireEvent.click(screen.getByRole('button', { name: '新增主数据' }));
    let comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[0]);
    fireEvent.click(await screen.findByText('采购管理'));
    fireEvent.change(screen.getByPlaceholderText('如：客户主数据'), { target: { value: '采购组织主数据' } });
    fireEvent.change(screen.getByPlaceholderText('如：CustomerMaster'), { target: { value: 'PurchasingOrg' } });
    fireEvent.change(screen.getByPlaceholderText('主数据编码'), { target: { value: 'PUR_ORG' } });

    comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[2]);
    fireEvent.click(await screen.findByText('基础主体模板'));

    expect(screen.getByDisplayValue('编码,名称,状态')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^保存$/ }));

    await waitFor(() => {
      expect(screen.getByText('采购组织主数据')).toBeInTheDocument();
    });
    const saved = useOntologyStore.getState().masterDataList.find((item) => item.code === 'PUR_ORG');
    expect(saved?.fieldNames).toBe('编码,名称,状态');
  });
});
