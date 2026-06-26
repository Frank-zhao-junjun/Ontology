import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MasterDataManager } from '@/components/ontology/masterdata-manager';
import { useOntologyStore } from '@/store/ontology-store';
import { mockMasterdataInit } from './helpers/masterdata-msw';

describe('IT-MASTERDATA-002: 动态主数据表增删改查', () => {
  beforeEach(() => {
    useOntologyStore.setState({ masterDataList: [], masterDataRecords: {} as Record<string, never[]> });
    mockMasterdataInit({ 'md-material': [] });
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
