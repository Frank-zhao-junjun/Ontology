import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RuleModelEditor } from '@/components/ontology/rule-model-editor';
import { useOntologyStore } from '@/store/ontology-store';
import { createFrozenProject } from '../unit/test-helpers';

function resetStore() {
  useOntologyStore.setState({
    project: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: null,
  });
}

describe('US-5.2 / RuleModelEditor cross-field validation', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      versions: [],
      activeModelType: 'rule',
    });
  });

  it('应支持创建跨字段规则并保留字段列表与优先级', async () => {
    render(React.createElement(RuleModelEditor, { mode: 'entity-detail', entityId: 'contract-1' }));

    fireEvent.click(screen.getByRole('button', { name: '+ 添加规则' }));
    fireEvent.change(screen.getByPlaceholderText('如：合同编号格式'), { target: { value: '金额与编号一致性校验' } });

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[0]);
    fireEvent.click(await screen.findByText('跨字段校验'));

    fireEvent.click(comboboxes[2]);
    fireEvent.click(await screen.findByText('表达式'));

    fireEvent.change(screen.getByPlaceholderText('如：end_date > start_date'), { target: { value: 'amount > 0 && contractNo.length > 0' } });
    fireEvent.change(screen.getByPlaceholderText('如：attr-contract-no, attr-amount'), { target: { value: 'amount, contractNo' } });
    fireEvent.change(screen.getByDisplayValue('100'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: '添加规则' }));

    await waitFor(() => {
      expect(screen.getByText('金额与编号一致性校验')).toBeInTheDocument();
      expect(screen.getByText('跨字段校验')).toBeInTheDocument();
      expect(screen.getByText('P15')).toBeInTheDocument();
    });

    const saved = useOntologyStore.getState().project?.ruleModel?.rules.find((rule) => rule.name === '金额与编号一致性校验');
    expect(saved?.type).toBe('cross_field_validation');
    expect(saved?.condition.expression).toBe('amount > 0 && contractNo.length > 0');
    expect(saved?.condition.fields).toEqual(['amount', 'contractNo']);
    expect(saved?.priority).toBe(15);
  });
});
