import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MasterDataManager } from '@/components/ontology/masterdata-manager';
import { useOntologyStore } from '@/store/ontology-store';

describe('IT-MASTERDATA-002: 动态主数据表增删改查', () => {
  beforeEach(() => {
    useOntologyStore.setState({ masterDataList: [], masterDataRecords: {} as Record<string, never[]> });

    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          definitions: [
            {
              id: 'md-material',
              domain: '研发管理',
              name: '物料主数据',
              nameEn: 'MaterialMaster',
              code: 'MATERIAL',
              description: '物料基础信息',
              coreData: '是',
              fieldNames: '物料编码,物料名称,状态',
              sourceSystem: 'ERP',
              apiUrl: '',
              status: '00',
              createdAt: '2026-04-01T00:00:00.000Z',
              updatedAt: '2026-04-01T00:00:00.000Z'
            }
          ],
          records: {
            'md-material': []
          }
        }
      })
    } as Response);
  });

  it('应允许新增动态记录', async () => {
    render(React.createElement(MasterDataManager));

    await screen.findByText('物料主数据');
    fireEvent.click(screen.getByRole('button', { name: /查看数据表/i }));
    fireEvent.click(await screen.findByRole('button', { name: /新增记录/i }));

    fireEvent.change(screen.getByLabelText('物料编码'), { target: { value: 'M-002' } });
    fireEvent.change(screen.getByLabelText('物料名称'), { target: { value: '铜材T2' } });
    fireEvent.change(screen.getByLabelText('状态'), { target: { value: '生效' } });
    fireEvent.click(screen.getByRole('button', { name: /^保存$/ }));

    await waitFor(() => {
      expect(screen.getByText('M-002')).toBeInTheDocument();
      expect(screen.getByText('铜材T2')).toBeInTheDocument();
    });
  });
});
