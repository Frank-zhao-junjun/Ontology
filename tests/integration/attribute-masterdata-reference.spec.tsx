import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataModelEditor } from '@/components/ontology/data-model-editor';
import { useOntologyStore } from '@/store/ontology-store';

const now = '2026-04-01T00:00:00.000Z';

describe('IT-DATAMODEL-REFERENCE-001: Reference 属性支持主数据类型与字段绑定', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: {
        id: 'proj-1',
        name: '合同管理本体',
        description: '测试项目',
        domain: {
          id: 'domain-1',
          name: '合同管理',
          nameEn: 'ContractManagement',
          description: '合同业务测试领域',
        },
        dataModel: {
          id: 'dm-1',
          name: '合同数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [
            {
              id: 'module-1',
              name: '合同中心',
              nameEn: 'ContractCenter',
            },
          ],
          businessScenarios: [
            {
              id: 'scenario-1',
              name: '合同签订',
              nameEn: 'ContractSign',
              projectId: 'proj-1',
            },
          ],
          entities: [
            {
              id: 'entity-contract',
              name: '合同',
              nameEn: 'Contract',
              projectId: 'module-1',
              businessScenarioId: 'scenario-1',
              entityRole: 'aggregate_root',
              attributes: [],
              relations: [],
            },
            {
              id: 'entity-order',
              name: '订单',
              nameEn: 'Order',
              projectId: 'module-1',
              businessScenarioId: 'scenario-1',
              entityRole: 'aggregate_root',
              attributes: [],
              relations: [],
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        behaviorModel: null,
        ruleModel: null,
        processModel: null,
        eventModel: null,
        createdAt: now,
        updatedAt: now,
      },
      metadataList: [],
      masterDataList: [
        {
          id: 'md-supplier',
          domain: '采购管理',
          name: '供应商主数据',
          nameEn: 'SupplierMaster',
          code: 'SUPPLIER',
          description: '供应商信息',
          coreData: '是',
          fieldNames: '供应商编码,供应商名称',
          sourceSystem: 'ERP',
          status: '00',
          source: 'ERP',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'md-customer',
          domain: '销售管理',
          name: '客户主数据',
          nameEn: 'CustomerMaster',
          code: 'CUSTOMER',
          description: '客户信息',
          coreData: '是',
          fieldNames: '客户编码,客户名称',
          sourceSystem: 'CRM',
          status: '00',
          source: 'CRM',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'md-employee',
          domain: '人力资源管理',
          name: '员工主数据',
          nameEn: 'EmployeeMaster',
          code: 'EMPLOYEE',
          description: '员工信息',
          coreData: '是',
          fieldNames: '员工编码,员工姓名',
          sourceSystem: 'HR',
          status: '00',
          source: 'HR',
          createdAt: now,
          updatedAt: now,
        },
      ],
      masterDataRecords: {},
    });
  });

  it('应允许把引用类型属性关联到单个主数据类型及字段', async () => {
    render(React.createElement(DataModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

    fireEvent.click(screen.getByRole('button', { name: /\+ 添加属性/i }));

    fireEvent.change(screen.getByLabelText('中文名称'), { target: { value: '甲方主体' } });
    fireEvent.change(screen.getByLabelText('英文名称'), { target: { value: 'firstParty' } });

    fireEvent.click(screen.getByRole('combobox', { name: '数据类型' }));
    fireEvent.click(await screen.findByText('引用 (Reference)'));

    fireEvent.click(screen.getByLabelText('是否关联主数据'));

    fireEvent.click(await screen.findByRole('combobox', { name: '主数据类型' }));
    fireEvent.click(await screen.findByText('供应商主数据'));

    fireEvent.click(await screen.findByRole('combobox', { name: '主数据字段（可选）' }));
    fireEvent.click(await screen.findByText('供应商编码'));

    fireEvent.click(screen.getByRole('button', { name: /添加属性|保存修改/i }));

    await waitFor(() => {
      expect(screen.getByText('甲方主体')).toBeInTheDocument();
      expect(screen.getByText(/主数据: 供应商主数据 \/ 供应商编码/)).toBeInTheDocument();
    });

    const savedAttribute = useOntologyStore
      .getState()
      .project?.dataModel?.entities.find((entity) => entity.id === 'entity-contract')
      ?.attributes.find((attribute) => attribute.name === '甲方主体');

    expect(savedAttribute?.dataType).toBe('reference');
    expect(savedAttribute?.referenceKind).toBe('masterData');
    expect(savedAttribute?.isMasterDataRef).toBe(true);
    expect(savedAttribute?.masterDataType).toBe('md-supplier');
    expect(savedAttribute?.masterDataField).toBe('供应商编码');
  });
});
