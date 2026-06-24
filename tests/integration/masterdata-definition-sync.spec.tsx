import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MasterDataManager } from '@/components/ontology/masterdata-manager';
import { useOntologyStore } from '@/store/ontology-store';

describe('IT-MASTERDATA-DEF-001: 主数据类型字段变更同步记录', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      masterDataList: [],
      masterDataRecords: {},
    });

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
              fieldNames: '物料编码,物料名称',
              sourceSystem: 'ERP',
              apiUrl: '',
              status: '00',
              createdAt: '2026-04-01T00:00:00.000Z',
              updatedAt: '2026-04-01T00:00:00.000Z',
            },
          ],
          records: {
            'md-material': [
              {
                id: 'rec-1',
                definitionId: 'md-material',
                values: { 物料编码: 'M-001', 物料名称: '钢材Q235A' },
                status: '00',
                createdAt: '2026-04-01T00:00:00.000Z',
                updatedAt: '2026-04-01T00:00:00.000Z',
              },
            ],
          },
        },
      }),
    } as Response);
  });

  it('编辑字段清单后动态表应切换为新字段并保留可映射值', async () => {
    render(React.createElement(MasterDataManager));

    await screen.findByText('物料主数据');
    fireEvent.click(screen.getByRole('button', { name: /查看数据表/i }));
    expect(screen.getByRole('columnheader', { name: '物料编码' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '物料名称' })).toBeInTheDocument();
    expect(screen.getByText('钢材Q235A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '编辑主数据-物料主数据' }));
    fireEvent.change(screen.getByDisplayValue('物料编码,物料名称'), {
      target: { value: '物料编码,状态' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^保存$/ }));

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: '物料编码' })).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader', { name: '状态' }).length).toBeGreaterThan(0);
      expect(screen.queryByRole('columnheader', { name: '物料名称' })).not.toBeInTheDocument();
      expect(screen.queryByText('钢材Q235A')).not.toBeInTheDocument();
    });

    const synced = useOntologyStore.getState().masterDataRecords['md-material'][0];
    expect(synced.values).toEqual({
      物料编码: 'M-001',
      状态: '',
    });
  });
});
