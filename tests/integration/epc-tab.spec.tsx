import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EpcTab } from '@/components/ontology/epc-tab';
import { useOntologyStore } from '@/store/ontology-store';

const now = '2026-04-01T00:00:00.000Z';
const originalCreateElement = document.createElement.bind(document);

describe('IT-EPC-001: 聚合根 EPC 页签骨架', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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
          description: '合同领域',
        },
        dataModel: {
          id: 'dm-1',
          name: '合同数据模型',
          version: '1.0.0',
          domain: 'domain-1',
          projects: [],
          businessScenarios: [],
          entities: [
            {
              id: 'entity-contract',
              name: '合同',
              nameEn: 'Contract',
              projectId: 'module-1',
              entityRole: 'aggregate_root',
              attributes: [{ id: 'attr-1', name: '合同编号', nameEn: 'contractNo', type: 'string' }],
              relations: [],
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        behaviorModel: {
          id: 'bm-1',
          name: '合同状态机',
          version: '1.0.0',
          domain: 'domain-1',
          stateMachines: [
            {
              id: 'sm-1',
              name: '合同生命周期',
              entity: 'entity-contract',
              statusField: 'status',
              states: [{ id: 'draft', name: '草稿', isInitial: true }],
              transitions: [{ id: 'transition-1', name: '提交审批', from: 'draft', to: 'draft', trigger: 'manual' }],
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        ruleModel: { id: 'rm-1', name: '规则', version: '1.0.0', domain: 'domain-1', rules: [], createdAt: now, updatedAt: now },
        processModel: null,
        eventModel: { id: 'em-1', name: '事件', version: '1.0.0', domain: 'domain-1', events: [], subscriptions: [], createdAt: now, updatedAt: now },
        epcModel: null,
        createdAt: now,
        updatedAt: now,
      },
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
    });
  });

  it('应为聚合根显示EPC预览并允许保存补充信息', async () => {
    render(React.createElement(EpcTab, { entityId: 'entity-contract' }));

    await screen.findByText('EPC概览');

    await waitFor(() => {
      expect(screen.getByText(/EPC业务活动规格说明书/)).toBeInTheDocument();
      expect(screen.getByText(/4\.2 流程说明/)).toBeInTheDocument();
      expect(screen.getByText(/5\. EPC流程矩阵/)).toBeInTheDocument();
      expect(screen.getByText(/6\. EPC元素连接关系/)).toBeInTheDocument();
      expect(screen.getByText(/7\. 角色和权限矩阵/)).toBeInTheDocument();
      expect(screen.getByText(/12\. EPC完整性自检/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('文档目的'), { target: { value: '规范合同审批与签署业务流程' } });
    fireEvent.click(screen.getByRole('button', { name: '保存补充信息' }));

    await waitFor(() => {
      const profile = useOntologyStore.getState().project?.epcModel?.profiles.find((item) => item.aggregateId === 'entity-contract');
      expect(profile?.purpose).toBe('规范合同审批与签署业务流程');
    });
  });

  it('应允许新增手工信息对象，且派生对象结构字段只读', async () => {
    render(React.createElement(EpcTab, { entityId: 'entity-contract' }));

    await screen.findByRole('button', { name: '+ 添加手工对象' });

    const derivedNameInput = await screen.findByLabelText('对象名称');
    expect(derivedNameInput).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '+ 添加手工对象' }));

    const nameInputs = screen.getAllByLabelText('对象名称');
    const manualNameInput = nameInputs[nameInputs.length - 1];
    fireEvent.change(manualNameInput, { target: { value: '预算校验结果' } });

    const attributeInputs = screen.getAllByLabelText('属性摘要');
    fireEvent.change(attributeInputs[attributeInputs.length - 1], { target: { value: '预算额度、校验结果' } });

    const descriptionInputs = screen.getAllByLabelText('流程说明');
    fireEvent.change(descriptionInputs[descriptionInputs.length - 1], { target: { value: '外部预算系统返回对象' } });

    fireEvent.click(screen.getByRole('button', { name: '保存信息对象规则' }));

    await waitFor(() => {
      const profile = useOntologyStore.getState().project?.epcModel?.profiles.find((item) => item.aggregateId === 'entity-contract');
      expect(profile?.informationObjects.some((item) => item.name === '预算校验结果' && item.sourceType === 'manual')).toBe(true);
      expect(profile?.generatedDocument).toContain('预算校验结果');
    });
  });

  it('应允许维护组织单元与执行系统并刷新 EPC 预览', async () => {
    render(React.createElement(EpcTab, { entityId: 'entity-contract' }));

    await screen.findByRole('button', { name: '+ 添加组织单元' });

    fireEvent.click(screen.getByRole('button', { name: '+ 添加组织单元' }));
    fireEvent.change(screen.getByLabelText('组织单元名称'), { target: { value: '采购专员' } });
    fireEvent.change(screen.getByLabelText('职责说明'), { target: { value: '负责发起采购申请并跟踪审批' } });
    fireEvent.change(screen.getByLabelText('权限说明'), { target: { value: '可提交采购申请' } });
    fireEvent.click(screen.getByRole('button', { name: '保存组织单元' }));

    fireEvent.click(screen.getByRole('button', { name: '+ 添加系统' }));
    fireEvent.change(screen.getByLabelText('系统名称'), { target: { value: 'SRM平台' } });
    fireEvent.change(screen.getByLabelText('系统说明'), { target: { value: '承载采购申请与采购订单流转' } });
    fireEvent.click(screen.getByRole('button', { name: '保存执行系统' }));

    await waitFor(() => {
      const profile = useOntologyStore.getState().project?.epcModel?.profiles.find((item) => item.aggregateId === 'entity-contract');
      expect(profile?.organizationalUnits.some((item) => item.name === '采购专员')).toBe(true);
      expect(profile?.systems.some((item) => item.name === 'SRM平台')).toBe(true);
      expect(profile?.generatedDocument).toContain('采购专员');
      expect(profile?.generatedDocument).toContain('SRM平台');
    });
  });

  it('应允许从 EPC 页签直接导出 Markdown 与 JSON', async () => {
    const createdAnchors: HTMLAnchorElement[] = [];
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);
      if (tagName.toLowerCase() === 'a') {
        createdAnchors.push(element as HTMLAnchorElement);
      }
      return element;
    }) as typeof document.createElement);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:epc-download');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(React.createElement(EpcTab, { entityId: 'entity-contract' }));

    await screen.findByRole('button', { name: '导出 Markdown' });

    fireEvent.click(screen.getByRole('button', { name: '导出 JSON' }));
    fireEvent.click(screen.getByRole('button', { name: '导出 Markdown' }));

    expect(createElementSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(createdAnchors[0]?.download).toBe('contract.json');
    expect(createdAnchors[1]?.download).toBe('contract.md');
  });

  it('应允许从 EPC 页签导出整包配置包', async () => {
    const createdAnchors: HTMLAnchorElement[] = [];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          downloadUrl: 'data:application/json;base64,ZXBj',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);
      if (tagName.toLowerCase() === 'a') {
        createdAnchors.push(element as HTMLAnchorElement);
      }
      return element;
    }) as typeof document.createElement);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(React.createElement(EpcTab, { entityId: 'entity-contract' }));

    await screen.findByRole('button', { name: '导出配置包' });
    fireEvent.click(screen.getByRole('button', { name: '导出配置包' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/export', expect.objectContaining({
      method: 'POST',
    }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchors[0]?.download).toBe('合同管理本体_contract_config_package.json');
    expect(createdAnchors[0]?.href).toBe('data:application/json;base64,ZXBj');
  });
});