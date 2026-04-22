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
          businessScenarios: [
            {
              id: 'scenario-1',
              name: '合同签订',
              nameEn: 'ContractSign',
              description: '合同审批与签署流程说明',
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
              attributes: [{ id: 'attr-1', name: '合同编号', nameEn: 'contractNo', dataType: 'string' }],
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

  it('应为聚合根显示只读 EPC 预览和业务场景来源', async () => {
    render(React.createElement(EpcTab, { entityId: 'entity-contract' }));

    await screen.findByText('EPC事件说明书');

    await waitFor(() => {
      expect(screen.getByText(/生成依据/)).toBeInTheDocument();
      expect(screen.getByText(/业务场景说明/)).toBeInTheDocument();
      expect(screen.getByText('合同签订')).toBeInTheDocument();
      expect(screen.getByText('合同审批与签署流程说明')).toBeInTheDocument();
      expect(screen.getByText(/质量评分/)).toBeInTheDocument();
    });

    expect(screen.queryByText('保存补充信息')).not.toBeInTheDocument();
    expect(screen.queryByText('+ 添加手工对象')).not.toBeInTheDocument();
    expect(screen.queryByText('+ 添加组织单元')).not.toBeInTheDocument();
  });

  it('应显示 EPC 完整性问题列表代码', async () => {
    render(React.createElement(EpcTab, { entityId: 'entity-contract' }));
    await screen.findByText('EPC事件说明书');

    await waitFor(() => {
      expect(screen.getByText('EPC_ORG_MISSING')).toBeInTheDocument();
      expect(screen.getByText('EPC_SYSTEM_MISSING')).toBeInTheDocument();
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

  it('导出内容应与当前预览一致，并支持 PDF 命名格式', async () => {
    const createdAnchors: HTMLAnchorElement[] = [];
    const objectUrlPayloads: Blob[] = [];
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);
      if (tagName.toLowerCase() === 'a') {
        createdAnchors.push(element as HTMLAnchorElement);
      }
      return element;
    }) as typeof document.createElement);
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob | MediaSource) => {
      objectUrlPayloads.push(blob as Blob);
      return `blob:epc-${objectUrlPayloads.length}`;
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(React.createElement(EpcTab, { entityId: 'entity-contract' }));

    const preview = await screen.findByText((content) => content.includes('# EPC业务活动规格说明书'));
    expect(preview).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '导出 Markdown' }));
    fireEvent.click(screen.getByRole('button', { name: '导出 PDF' }));

    expect(createElementSpy).toHaveBeenCalled();
    expect(createdAnchors.at(-2)?.download).toBe('contract.md');
    expect(createdAnchors.at(-1)?.download).toBe('contract.pdf');

    const markdownBlob = objectUrlPayloads[0];
    const markdownContent = await markdownBlob.text();
    expect(markdownContent).toContain('# EPC业务活动规格说明书');

    const pdfBlob = objectUrlPayloads[1];
    expect(pdfBlob.type).toBe('application/pdf');
    const pdfContent = await pdfBlob.text();
    expect(pdfContent).toContain('# EPC业务活动规格说明书');
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