import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { AiDraftFillDialog } from '@/components/ontology/ai-draft-fill-dialog';
import type { OntologyProject, Domain, EpcProcess } from '@/types/ontology';
import type { ModuleDraftSuggestion } from '@/lib/ai-draft';
import type { EpcStepSuggestion } from '@/lib/ai-draft/epc-doc-prompt';

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));

// ── Fixtures ────────────────────────────────────────────────────────

const domain: Domain = {
  id: 'd1', name: '离散制造', nameEn: 'Mfg', description: '', icon: 'factory', color: '#000',
};

function createMockProject(overrides?: Partial<OntologyProject>): OntologyProject {
  return {
    id: 'proj-1', name: '测试项目', domain, description: '',
    dataModel: { entities: [], relations: [] },
    behaviorModel: { stateMachines: [], actions: [], functions: [], indicators: [], constraints: [] },
    ruleModel: { rules: [] },
    processModel: { processes: [] },
    eventModel: { events: [], subscriptions: [] },
    metadataList: [], masterDataList: [], masterDataRecords: {}, versions: [],
    entityProjects: [], businessScenarios: [], valueDomains: [],
    capabilities: [], scenarios: [], epcProcesses: [], metaElements: [],
    moduleVersionRecords: [], metricsModel: null, governanceModel: null,
    dataSourcesModel: null, semanticsBlock: null, semanticsLayer: null,
    organizationModel: null, referenceDocuments: [], publishConfig: null,
    ...overrides,
  };
}

const STEPS_RESPONSE: EpcStepSuggestion[] = [
  { name: '创建订单', description: '在系统中录入采购订单信息', elementRef: { elementId: 'el1', versionPin: 'latest_confirmed' } },
  { name: '审核订单', description: '主管审核采购订单内容' },
];

// ── Helpers ─────────────────────────────────────────────────────────

function mockFetchOk(data: unknown) {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data }) }),
  ));
}

function mockFetchError(errorMsg: string) {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({ success: false, error: errorMsg }) }),
  ));
}

function createFile(name: string, content: string): File {
  return new File([new Blob([content], { type: 'text/plain' })], name, { type: 'text/plain' });
}

function uploadFile(fileInput: HTMLElement, file: File) {
  fireEvent.change(fileInput, { target: { files: [file] } });
}

// ── Tests ───────────────────────────────────────────────────────────

describe('AiDraftFillDialog — EPC 文档上传功能 (US-S11b-Task3)', () => {
  const project = createMockProject();
  const epcProcess: EpcProcess = { id: 'epc-1', name: '采购流程', parentId: 'c1', steps: [] };
  const projectWithEpc = createMockProject({ epcProcesses: [epcProcess] });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  // ── 1. EPC 显示上传区域 ──
  it('1. should show document upload section when moduleKind is EPC', () => {
    render(
      <AiDraftFillDialog
        open={true} onOpenChange={vi.fn()}
        moduleKind="EPC" moduleId="epc-1" project={projectWithEpc}
        onEnsureDraft={vi.fn()} onApply={vi.fn()}
      />,
    );
    expect(screen.getByTestId('epc-doc-upload-section')).toBeInTheDocument();
    expect(screen.getByTestId('epc-doc-upload-btn')).toBeInTheDocument();
    expect(screen.getByTestId('epc-doc-file-input')).toBeInTheDocument();
  });

  // ── 2. 非 EPC 隐藏上传区域 ──
  it('2. should NOT show document upload section when moduleKind is A', () => {
    render(
      <AiDraftFillDialog
        open={true} onOpenChange={vi.fn()}
        moduleKind="A" moduleId="vd-1" project={project}
        onEnsureDraft={vi.fn()} onApply={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('epc-doc-upload-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('epc-doc-upload-btn')).not.toBeInTheDocument();
  });

  // ── 3. 非法扩展名被拒绝 ──
  it('3. should reject file with unsupported extension and show toast error', () => {
    render(
      <AiDraftFillDialog
        open={true} onOpenChange={vi.fn()}
        moduleKind="EPC" moduleId="epc-1" project={projectWithEpc}
        onEnsureDraft={vi.fn()} onApply={vi.fn()}
      />,
    );
    uploadFile(screen.getByTestId('epc-doc-file-input'), createFile('report.pdf', 'fake'));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('.pdf'));
  });

  // ── 4. 文件过大被拒绝 ──
  it('4. should reject file larger than 50KB and show toast error', async () => {
    render(
      <AiDraftFillDialog
        open={true} onOpenChange={vi.fn()}
        moduleKind="EPC" moduleId="epc-1" project={projectWithEpc}
        onEnsureDraft={vi.fn()} onApply={vi.fn()}
      />,
    );
    uploadFile(screen.getByTestId('epc-doc-file-input'), createFile('large.txt', 'x'.repeat(51000)));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('文件过大')));
  });

  // ── 5. 提交时发送 documentText ──
  it('5. should send documentText in API request body when file is selected', async () => {
    mockFetchOk({ suggestion: { steps: STEPS_RESPONSE } });
    render(
      <AiDraftFillDialog
        open={true} onOpenChange={vi.fn()}
        moduleKind="EPC" moduleId="epc-1" project={projectWithEpc}
        onEnsureDraft={vi.fn()} onApply={vi.fn()} onApplyEpcDraft={vi.fn()}
      />,
    );
    uploadFile(screen.getByTestId('epc-doc-file-input'), createFile('process.txt', '创建 → 审核 → 付款'));

    // Wait for the file to be read and filename displayed
    await waitFor(() => expect(screen.getByTestId('epc-doc-filename')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('ai-draft-submit'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.documentText).toBe('创建 → 审核 → 付款');
    expect(body.moduleKind).toBe('EPC');
  });

  // ── 6. EPC 成功调用 onApplyEpcDraft ──
  it('6. should call onApplyEpcDraft with parsed steps on successful EPC response', async () => {
    mockFetchOk({ suggestion: { steps: STEPS_RESPONSE } });
    const onApplyEpc = vi.fn();
    const onApply = vi.fn();
    render(
      <AiDraftFillDialog
        open={true} onOpenChange={vi.fn()}
        moduleKind="EPC" moduleId="epc-1" project={projectWithEpc}
        onEnsureDraft={vi.fn()} onApply={onApply} onApplyEpcDraft={onApplyEpc}
      />,
    );
    uploadFile(screen.getByTestId('epc-doc-file-input'), createFile('p.txt', 'doc content'));
    fireEvent.click(screen.getByTestId('ai-draft-submit'));

    await waitFor(() => expect(onApplyEpc).toHaveBeenCalledTimes(1));
    expect(onApplyEpc).toHaveBeenCalledWith(STEPS_RESPONSE);
    expect(onApply).not.toHaveBeenCalled();
  });

  // ── 7. 非 EPC 调用 onApply ──
  it('7. should call onApply (not onApplyEpcDraft) for non-EPC module kind', async () => {
    const suggestion: ModuleDraftSuggestion = { description: 'AI 补充描述' };
    mockFetchOk({ suggestion });
    const onApplyEpc = vi.fn();
    const onApply = vi.fn();
    render(
      <AiDraftFillDialog
        open={true} onOpenChange={vi.fn()}
        moduleKind="A" moduleId="vd-1" project={project}
        onEnsureDraft={vi.fn()} onApply={onApply} onApplyEpcDraft={onApplyEpc}
      />,
    );
    fireEvent.click(screen.getByTestId('ai-draft-submit'));

    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    expect(onApply).toHaveBeenCalledWith(suggestion);
    expect(onApplyEpc).not.toHaveBeenCalled();
  });

  // ── 8. API 错误时显示 toast ──
  it('8. should show toast error when API returns failure', async () => {
    mockFetchError('LLM API 调用超时');
    render(
      <AiDraftFillDialog
        open={true} onOpenChange={vi.fn()}
        moduleKind="EPC" moduleId="epc-1" project={projectWithEpc}
        onEnsureDraft={vi.fn()} onApply={vi.fn()} onApplyEpcDraft={vi.fn()}
      />,
    );
    uploadFile(screen.getByTestId('epc-doc-file-input'), createFile('p.txt', 'doc'));
    fireEvent.click(screen.getByTestId('ai-draft-submit'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('超时')));
  });
});
