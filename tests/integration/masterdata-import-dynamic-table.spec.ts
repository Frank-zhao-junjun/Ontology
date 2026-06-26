import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MasterDataManager } from '@/components/ontology/masterdata-manager';
import { useOntologyStore } from '@/store/ontology-store';
import { mockMasterdataInit } from './helpers/masterdata-msw';

describe('IT-MASTERDATA-001: 根据字段清单生成动态主数据表', () => {
  beforeEach(() => {
    useOntologyStore.setState({ masterDataList: [], masterDataRecords: {} as Record<string, never[]> });
    mockMasterdataInit({
      'md-material': [
        {
          id: 'rec-1',
          definitionId: 'md-material',
          values: { 物料编码: 'M-001', 物料名称: '钢材Q235A', 状态: '生效' },
          status: '00',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('应渲染动态列和记录', async () => {
    render(React.createElement(MasterDataManager));

    await screen.findByText('物料主数据');
    fireEvent.click(screen.getByRole('button', { name: /查看数据表/i }));

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: '物料编码' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: '物料名称' })).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader', { name: '状态' }).length).toBeGreaterThan(0);
    });

    expect(screen.getByText('M-001')).toBeInTheDocument();
    expect(screen.getByText('钢材Q235A')).toBeInTheDocument();
  });
});
