import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataModelEditor } from '@/components/ontology/data-model-editor';
import { useOntologyStore } from '@/store/ontology-store';

const now = '2026-04-02T00:00:00.000Z';

function openAttributeDialog() {
  fireEvent.click(screen.getByRole('button', { name: /\+ 添加属性/i }));
}

function fillAttributeNames(name: string, nameEn: string) {
  fireEvent.change(screen.getByLabelText('中文名称'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('英文名称'), { target: { value: nameEn } });
}

describe('IT-ATTR-META: free modeling (no metadata template)', () => {
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
      metadataList: [
        {
          id: 'meta-standard-name',
          domain: '合同管理',
          name: '标准名称',
          nameEn: 'StandardName',
          description: '统一的名称字段模板',
          type: '字符串',
          createdAt: now,
          updatedAt: now,
        },
      ],
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
      ],
      masterDataRecords: {},
    });
  });

  describe('IT-ATTR-META-004 [REQ-ATTR-META-04] [P1]', () => {
    it('metadataTemplateId 为空时应允许保存 string、integer、reference 三类属性', async () => {
      render(React.createElement(DataModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

      openAttributeDialog();
      fillAttributeNames('合同标题', 'contractTitle');
      fireEvent.click(screen.getByRole('button', { name: /添加属性|保存修改/i }));

      await waitFor(() => {
        expect(screen.getByText('合同标题')).toBeInTheDocument();
      });

      openAttributeDialog();
      fillAttributeNames('审批顺序', 'approvalOrder');
      fireEvent.click(screen.getByRole('combobox', { name: '数据类型' }));
      fireEvent.click(await screen.findByText('整数 (Integer)'));
      fireEvent.click(screen.getByRole('button', { name: /添加属性|保存修改/i }));

      await waitFor(() => {
        expect(screen.getByText('审批顺序')).toBeInTheDocument();
      });

      openAttributeDialog();
      fillAttributeNames('来源订单', 'sourceOrder');
      fireEvent.click(screen.getByRole('combobox', { name: '数据类型' }));
      fireEvent.click(await screen.findByText('引用 (Reference)'));
      fireEvent.click(screen.getByRole('combobox', { name: '引用实体' }));
      fireEvent.click(await screen.findByText('订单 (Order)'));
      fireEvent.click(screen.getByRole('button', { name: /添加属性|保存修改/i }));

      await waitFor(() => {
        expect(screen.getByText('来源订单')).toBeInTheDocument();
        expect(screen.getByText(/→ 订单/)).toBeInTheDocument();
      });

      const attributes = useOntologyStore
        .getState()
        .project?.dataModel?.entities.find((entity) => entity.id === 'entity-contract')
        ?.attributes || [];

      expect(attributes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: '合同标题',
            dataType: 'string',
            metadataTemplateId: undefined,
          }),
          expect.objectContaining({
            name: '审批顺序',
            dataType: 'integer',
            metadataTemplateId: undefined,
          }),
          expect.objectContaining({
            name: '来源订单',
            dataType: 'reference',
            referenceKind: 'entity',
            referencedEntityId: 'entity-order',
            metadataTemplateId: undefined,
          }),
        ])
      );
    });
  });

  describe('IT-ATTR-META-005 [REQ-ATTR-META-05]', () => {
    it('不关联元数据时应允许保存主数据引用路径', async () => {
      render(React.createElement(DataModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

      openAttributeDialog();

      fillAttributeNames('签约主体', 'signingParty');
      fireEvent.click(screen.getByRole('combobox', { name: '数据类型' }));
      fireEvent.click(await screen.findByText('引用 (Reference)'));
      fireEvent.click(screen.getByLabelText('是否关联主数据'));

      fireEvent.click(await screen.findByRole('combobox', { name: '主数据类型' }));
      fireEvent.click(await screen.findByText('供应商主数据'));

      fireEvent.click(await screen.findByRole('combobox', { name: '主数据字段（可选）' }));
      fireEvent.click(await screen.findByText('供应商名称'));

      fireEvent.click(screen.getByRole('button', { name: /添加属性|保存修改/i }));

      await waitFor(() => {
        expect(screen.getByText('签约主体')).toBeInTheDocument();
        expect(screen.getByText(/主数据: 供应商主数据 \/ 供应商名称/)).toBeInTheDocument();
      });

      const savedAttribute = useOntologyStore
        .getState()
        .project?.dataModel?.entities.find((entity) => entity.id === 'entity-contract')
        ?.attributes.find((attribute) => attribute.name === '签约主体');

      expect(savedAttribute?.metadataTemplateId).toBeUndefined();
      expect(savedAttribute?.dataType).toBe('reference');
      expect(savedAttribute?.referenceKind).toBe('masterData');
      expect(savedAttribute?.isMasterDataRef).toBe(true);
      expect(savedAttribute?.masterDataType).toBe('md-supplier');
      expect(savedAttribute?.masterDataField).toBe('供应商名称');
    });
  });
});
