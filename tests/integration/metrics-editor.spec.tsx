import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MetricsEditor } from '@/components/ontology/metrics-editor';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() } }));

const domain: Domain = {
  id: 'd1', name: 'Test', nameEn: 'Test', description: '', icon: 'factory', color: '#000',
};

describe('MetricsEditor — Integration', () => {
  beforeEach(() => {
    // Do NOT use fake timers — they block Radix Dialog animation transitions
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('Test', domain);
  });

  it('renders card header and empty state when no metrics exist', () => {
    render(<MetricsEditor />);

    expect(screen.getByText('业务指标')).toBeInTheDocument();
    expect(screen.getByText('定义业务度量和KPI指标公式')).toBeInTheDocument();
    expect(screen.getByText('暂无业务指标')).toBeInTheDocument();
    expect(screen.getByText('+ 添加指标')).toBeInTheDocument();
  });

  it('shows metrics list with details when metrics exist', () => {
    const store = useOntologyStore.getState();
    store.addMetric({
      id: 'm1', name: '完成率', nameEn: 'CompletionRate', formula: 'a/b*100',
      unit: '%', measurementType: 'automatic', boundActionId: '',
      description: '完成百分比', targetValue: 100, dataSourceRef: undefined,
    });

    render(<MetricsEditor />);

    expect(screen.getByText('完成率')).toBeInTheDocument();
    expect(screen.getByText('CompletionRate')).toBeInTheDocument();
    expect(screen.getByText('自动')).toBeInTheDocument(); // measurement type badge
    expect(screen.getByText('%')).toBeInTheDocument(); // unit badge
    expect(screen.getByText('a/b*100')).toBeInTheDocument(); // formula
    expect(screen.getByText(/目标: 100%/)).toBeInTheDocument(); // target value
  });

  it('adds a metric via dialog form', async () => {
    render(<MetricsEditor />);

    // Open add dialog
    fireEvent.click(screen.getByText('+ 添加指标'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument(), { timeout: 5000 });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('如：合同签订完成率'), { target: { value: '交付率' } });
    fireEvent.change(screen.getByPlaceholderText('如：ContractSigningRate'), { target: { value: 'DeliveryRate' } });
    fireEvent.change(screen.getByPlaceholderText('如：completed / total * 100'), { target: { value: 'delivered/total*100' } });
    fireEvent.change(screen.getByPlaceholderText('如：%、件、小时'), { target: { value: '%' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: '添加指标' }));
    await waitFor(() => expect(screen.getByText('交付率')).toBeInTheDocument(), { timeout: 5000 });

    // Verify store
    const project = useOntologyStore.getState().project;
    expect(project?.metricsModel?.metrics).toHaveLength(1);
    expect(project?.metricsModel?.metrics[0].name).toBe('交付率');
  });

  it('edits a metric via dialog', async () => {
    const store = useOntologyStore.getState();
    store.addMetric({
      id: 'm-edit', name: '原名称', nameEn: 'OldName', formula: 'x+y',
      unit: '件', measurementType: 'manual', boundActionId: '',
      description: '旧描述', targetValue: 50,
    });

    render(<MetricsEditor />);
    expect(screen.getByText('原名称')).toBeInTheDocument();

    // Click edit
    fireEvent.click(screen.getByText('编辑'));
    await waitFor(() => expect(screen.getByText('编辑指标')).toBeInTheDocument(), { timeout: 5000 });

    // Modify name
    fireEvent.change(screen.getByPlaceholderText('如：合同签订完成率'), { target: { value: '新名称' } });

    // Submit edit
    fireEvent.click(screen.getByText('保存修改'));
    await waitFor(() => expect(screen.getByText('新名称')).toBeInTheDocument(), { timeout: 5000 });

    expect(screen.queryByText('原名称')).not.toBeInTheDocument();

    const metrics = useOntologyStore.getState().project?.metricsModel?.metrics ?? [];
    expect(metrics.find(m => m.id === 'm-edit')?.name).toBe('新名称');
  });

  it('deletes a metric', async () => {
    const store = useOntologyStore.getState();
    store.addMetric({
      id: 'm-del', name: '待删除', nameEn: 'ToDelete', formula: 'z',
      unit: '个', measurementType: 'manual', boundActionId: '',
      description: '', targetValue: 10,
    });

    render(<MetricsEditor />);
    expect(screen.getByText('待删除')).toBeInTheDocument();

    // Click delete
    fireEvent.click(screen.getByText('删除'));
    await waitFor(() => {
      expect(screen.queryByText('待删除')).not.toBeInTheDocument();
      expect(screen.getByText('暂无业务指标')).toBeInTheDocument();
    }, { timeout: 5000 });

    const metrics = useOntologyStore.getState().project?.metricsModel?.metrics ?? [];
    expect(metrics).toHaveLength(0);
  });

  it('shows correct measurement type badge for automatic and manual metrics', () => {
    const store = useOntologyStore.getState();
    store.addMetric({
      id: 'm-auto', name: '自动指标', nameEn: 'AutoMetric', formula: 'a',
      unit: '', measurementType: 'automatic', boundActionId: '',
      description: '', targetValue: undefined,
    });
    store.addMetric({
      id: 'm-manual', name: '手动指标', nameEn: 'ManualMetric', formula: 'b',
      unit: '', measurementType: 'manual', boundActionId: '',
      description: '', targetValue: undefined,
    });

    render(<MetricsEditor />);

    expect(screen.getByText('自动指标')).toBeInTheDocument();
    expect(screen.getByText('手动指标')).toBeInTheDocument();

    const autoBadges = screen.getAllByText('自动');
    const manualBadges = screen.getAllByText('手动');
    expect(autoBadges.length).toBeGreaterThanOrEqual(1);
    expect(manualBadges.length).toBeGreaterThanOrEqual(1);
  });
});
