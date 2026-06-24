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

describe('US-5.3 / RuleModelEditor business constraints', () => {
  beforeEach(() => {
    resetStore();
    useOntologyStore.setState({
      project: createFrozenProject('1.0.0'),
      versions: [],
      activeModelType: 'rule',
    });
  });

  it('应支持创建跨实体业务约束规则并保存约束配置', async () => {
    render(React.createElement(RuleModelEditor, { mode: 'entity-detail', entityId: 'contract-1' }));

    fireEvent.click(screen.getByRole('button', { name: '+ 添加规则' }));
    fireEvent.change(screen.getByPlaceholderText('如：合同编号格式'), { target: { value: '冻结合同禁止关闭' } });

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.click(comboboxes[0]);
    fireEvent.click(await screen.findByText('跨实体校验'));
    fireEvent.click(comboboxes[2]);
    fireEvent.click(await screen.findByText('表达式'));

    fireEvent.click(screen.getByText('选择检查实体'));
    fireEvent.click(await screen.findByText('合同条款'));

    fireEvent.change(screen.getByPlaceholderText("如：vendor.status == 'active'"), { target: { value: "contract.status != 'frozen'" } });
    fireEvent.click(screen.getByRole('button', { name: '添加规则' }));

    await waitFor(() => {
      expect(screen.getByText('冻结合同禁止关闭')).toBeInTheDocument();
      expect(screen.getByText('跨实体校验')).toBeInTheDocument();
    });

    const saved = useOntologyStore.getState().project?.ruleModel?.rules.find((rule) => rule.name === '冻结合同禁止关闭');
    expect(saved?.type).toBe('cross_entity_validation');
    expect(saved?.condition.checkEntity).toBe('clause-1');
    expect(saved?.condition.checkCondition).toBe("contract.status != 'frozen'");
  });
});
