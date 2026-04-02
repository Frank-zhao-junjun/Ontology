import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DataModelEditor } from '@/components/ontology/data-model-editor';
import { useOntologyStore } from '@/store/ontology-store';

const now = '2026-04-02T00:00:00.000Z';

function openAttributeDialog() {
  fireEvent.click(screen.getByRole('button', { name: /\+ 添加属性/i }));
}

function chooseMetadataTemplate(optionText: RegExp) {
  fireEvent.click(screen.getAllByRole('combobox')[0]);
  fireEvent.click(screen.getByText(optionText));
}

describe('IT-ATTR-META: metadata template + attribute (strict binding)', () => {
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

  describe('IT-ATTR-META-001 [REQ-ATTR-META-01]', () => {
    it('绑定元数据模板后应锁定 dataType，并按模板解析结果保存', async () => {
      render(React.createElement(DataModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

      openAttributeDialog();

      fireEvent.change(screen.getByLabelText('中文名称'), { target: { value: '合同名称' } });
      fireEvent.change(screen.getByLabelText('英文名称'), { target: { value: 'contractName' } });
      chooseMetadataTemplate(/标准名称\s*\(StandardName\)\s*-\s*合同管理/);

      await waitFor(() => {
        expect(screen.getByText('已关联元数据模板，数据类型将按模板锁定。')).toBeInTheDocument();
      });

      const dataTypeTrigger = screen.getByRole('combobox', { name: '数据类型' });
      expect(dataTypeTrigger).toBeDisabled();
      expect(screen.getByText('模板绑定后，数据类型不可手工修改。')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /添加属性|保存修改/i }));

      await waitFor(() => {
        expect(screen.getByText('合同名称')).toBeInTheDocument();
        expect(screen.getByText('元数据: 标准名称')).toBeInTheDocument();
      });

      const savedAttribute = useOntologyStore
        .getState()
        .project?.dataModel?.entities.find((entity) => entity.id === 'entity-contract')
        ?.attributes.find((attribute) => attribute.name === '合同名称');

      expect(savedAttribute?.metadataTemplateId).toBe('meta-standard-name');
      expect(savedAttribute?.metadataTemplateName).toBe('标准名称');
      expect(savedAttribute?.dataType).toBe('string');
    });
  });

  describe('IT-ATTR-META-002 [REQ-ATTR-META-02]', () => {
    it('选择元数据模板后应清空与模板冲突的实体引用设置', async () => {
      render(React.createElement(DataModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

      openAttributeDialog();

      fireEvent.change(screen.getByLabelText('中文名称'), { target: { value: '关联对象' } });
      fireEvent.change(screen.getByLabelText('英文名称'), { target: { value: 'linkedTarget' } });

      fireEvent.click(screen.getByRole('combobox', { name: '数据类型' }));
      fireEvent.click(await screen.findByText('引用 (Reference)'));

      fireEvent.click(screen.getByRole('combobox', { name: '引用实体' }));
      fireEvent.click(await screen.findByText('订单 (Order)'));

      chooseMetadataTemplate(/标准名称\s*\(StandardName\)\s*-\s*合同管理/);

      await waitFor(() => {
        expect(screen.queryByLabelText('引用实体')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /添加属性|保存修改/i }));

      const savedAttribute = useOntologyStore
        .getState()
        .project?.dataModel?.entities.find((entity) => entity.id === 'entity-contract')
        ?.attributes.find((attribute) => attribute.name === '关联对象');

      expect(savedAttribute?.dataType).toBe('string');
      expect(savedAttribute?.referenceKind).toBeUndefined();
      expect(savedAttribute?.referencedEntityId).toBeUndefined();
      expect(savedAttribute?.metadataTemplateId).toBe('meta-standard-name');
    });
  });

  describe('IT-ATTR-META-003 [REQ-ATTR-META-03]', () => {
    it('选择元数据模板后应覆盖与自由建模冲突的主数据引用字段', async () => {
      render(React.createElement(DataModelEditor, { mode: 'entity-detail', entityId: 'entity-contract' }));

      openAttributeDialog();

      fireEvent.change(screen.getByLabelText('中文名称'), { target: { value: '来源信息' } });
      fireEvent.change(screen.getByLabelText('英文名称'), { target: { value: 'sourceInfo' } });

      fireEvent.click(screen.getByRole('combobox', { name: '数据类型' }));
      fireEvent.click(await screen.findByText('引用 (Reference)'));
      fireEvent.click(screen.getByLabelText('是否关联主数据'));

      fireEvent.click(await screen.findByRole('combobox', { name: '主数据类型' }));
      fireEvent.click(await screen.findByText('供应商主数据'));

      fireEvent.click(await screen.findByRole('combobox', { name: '主数据字段（可选）' }));
      fireEvent.click(await screen.findByText('供应商编码'));

      chooseMetadataTemplate(/标准名称\s*\(StandardName\)\s*-\s*合同管理/);

      await waitFor(() => {
        expect(screen.queryByLabelText('主数据类型')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /添加属性|保存修改/i }));

      const savedAttribute = useOntologyStore
        .getState()
        .project?.dataModel?.entities.find((entity) => entity.id === 'entity-contract')
        ?.attributes.find((attribute) => attribute.name === '来源信息');

      expect(savedAttribute?.dataType).toBe('string');
      expect(savedAttribute?.referenceKind).toBeUndefined();
      expect(savedAttribute?.isMasterDataRef).toBe(false);
      expect(savedAttribute?.masterDataType).toBeUndefined();
      expect(savedAttribute?.masterDataField).toBeUndefined();
      expect(savedAttribute?.metadataTemplateId).toBe('meta-standard-name');
    });
  });
});
