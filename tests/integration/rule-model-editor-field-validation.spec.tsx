import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RuleModelEditor } from '@/components/ontology/rule-model-editor';
import { useOntologyStore } from '@/store/ontology-store';
import type { OntologyProject } from '@/types/ontology';

const now = '2026-04-21T00:00:00.000Z';

function buildProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '合同管理本体',
    description: 'US-5.1 集成测试',
    domain: { id: 'domain-1', name: '合同管理', nameEn: 'ContractManagement', description: '合同管理' },
    dataModel: {
      id: 'dm-1',
      name: '合同数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [{ id: 'module-1', name: '合同中心' }],
      businessScenarios: [{ id: 'scenario-1', name: '合同签订', nameEn: 'ContractSign', projectId: 'module-1' }],
      entities: [{
        id: 'entity-contract',
        name: '合同',
        nameEn: 'Contract',
        projectId: 'module-1',
        businessScenarioId: 'scenario-1',
        entityRole: 'aggregate_root',
        attributes: [{ id: 'attr-contract-no', name: '合同编号', nameEn: 'contractNo', dataType: 'string' }],
        relations: [],
      }],
      createdAt: now,
      updatedAt: now,
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe('US-5.1 / RuleModelEditor field validation controls', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: buildProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'rule',
    });
  });

  it('应支持创建表达式规则并显示优先级徽标', async () => {
    render(React.createElement(RuleModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

    fireEvent.click(screen.getByRole('button', { name: '+ 添加规则' }));
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(screen.getByPlaceholderText('如：合同编号格式'), { target: { value: '编号表达式校验' } });
    fireEvent.click(comboboxes[1]);
    fireEvent.click(await screen.findByText('合同编号'));
    fireEvent.click(comboboxes[2]);
    fireEvent.click(await screen.findByText('表达式'));
    fireEvent.change(screen.getByPlaceholderText('如：end_date > start_date'), { target: { value: 'contractNo.length > 0' } });
    fireEvent.change(screen.getByDisplayValue('100'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: '添加规则' }));

    await waitFor(() => {
      expect(screen.getByText('编号表达式校验')).toBeInTheDocument();
      expect(screen.getByText('P5')).toBeInTheDocument();
    });
  });

  it('应支持通过复选框启停字段规则', async () => {
    const store = useOntologyStore.getState();
    store.addRule({
      id: 'rule-toggle',
      name: '合同编号必填',
      type: 'field_validation',
      entity: 'entity-contract',
      field: 'attr-contract-no',
      priority: 20,
      condition: { type: 'regex', pattern: '^.+$' },
      errorMessage: '合同编号不能为空',
      severity: 'error',
      enabled: true,
    });

    render(React.createElement(RuleModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(useOntologyStore.getState().project?.ruleModel?.rules[0].enabled).toBe(false);
    });
  });
});
