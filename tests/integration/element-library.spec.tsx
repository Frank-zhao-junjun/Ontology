import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ElementLibrary } from '@/components/ontology/element-library';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('ElementLibrary (US-S07-U03)', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('库测试', domain);
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        metaElements: [
          { id: 'el-1', name: '订单', dimension: 'E1', usageRefs: [{ epcId: 'epc1', stepId: 's1', scenarioId: 'c1', versionPin: 'latest_confirmed' }] },
          { id: 'el-2', name: '闲置实体', dimension: 'E1' },
          { id: 'el-3', name: '闲置规则', dimension: 'E4' },
        ],
        epcProcesses: [{ id: 'epc1', name: '主流程', parentId: 'c1', steps: [] }],
      },
    });
  });

  it('should list elements for active dimension tab', () => {
    render(<ElementLibrary />);
    expect(screen.getByTestId('element-row-el-1')).toBeInTheDocument();
    expect(screen.getByTestId('element-row-el-2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /E4 规则/i }));
    expect(screen.queryByTestId('element-row-el-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('element-row-el-3')).toBeInTheDocument();
  });

  it('should filter unreferenced only when toggle on', () => {
    render(<ElementLibrary />);
    expect(screen.getByTestId('element-row-el-1')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('element-library-unreferenced-toggle'));
    expect(screen.queryByTestId('element-row-el-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('element-row-el-2')).toBeInTheDocument();
  });

  it('should show usage count and expand refs', () => {
    render(<ElementLibrary />);
    const row = screen.getByTestId('element-row-el-1');
    expect(within(row).getByText(/引用 1/i)).toBeInTheDocument();
    fireEvent.click(within(row).getByTestId('element-usage-toggle-el-1'));
    expect(screen.getByTestId('element-usage-detail-el-1')).toHaveTextContent('主流程');
  });

  it('should show coverage badge for referenced and unreferenced elements', () => {
    const store = useOntologyStore.getState();
    store.saveModuleDraft('EPC', 'epc1', { steps: [] });
    store.confirmModule('EPC', 'epc1');
    render(<ElementLibrary />);
    expect(screen.getByTestId('coverage-badge-el-1')).toHaveTextContent('已覆盖');
    expect(screen.getByTestId('coverage-badge-el-1')).toHaveAttribute('data-covered', 'true');
    expect(screen.getByTestId('coverage-badge-el-2')).toHaveTextContent('未覆盖');
    expect(screen.getByTestId('coverage-badge-el-2')).toHaveAttribute('data-covered', 'false');
  });
});
