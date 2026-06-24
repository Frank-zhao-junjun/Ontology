import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { ElementLibrary } from '@/components/ontology/element-library';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));

// ── Fixtures ────────────────────────────────────────────────────────

const domain: Domain = {
  id: 'd1', name: '离散制造', nameEn: 'Mfg', description: '', icon: 'factory', color: '#000',
};

// ── Helpers ─────────────────────────────────────────────────────────

function mockFetchOk(data: unknown) {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(data) }),
  ));
}

function mockFetchError(errorMsg: string) {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({ error: errorMsg }) }),
  ));
}

function createFile(name: string, content: string): File {
  return new File([new Blob([content], { type: 'text/plain' })], name, { type: 'text/plain' });
}

function uploadFile(fileInput: HTMLElement, file: File) {
  fireEvent.change(fileInput, { target: { files: [file] } });
}

// ── Tests ───────────────────────────────────────────────────────────

describe('ElementLibrary — AI 解析文档对话框 (US-S19-Task3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
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
          { id: 'el-1', name: '订单', dimension: 'E1' },
        ],
      },
    });
  });

  // ── 1. 显示 AI 解析文档按钮 ──
  it('1. should show "AI 解析文档" button in toolbar', () => {
    render(<ElementLibrary />);
    const btn = screen.getByTestId('ai-element-draft-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('AI 解析文档');
  });

  // ── 2. 点击按钮打开对话框 ──
  it('2. should open dialog when button is clicked', () => {
    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));
    expect(screen.getByTestId('ai-element-draft-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('element-doc-upload-section')).toBeInTheDocument();
  });

  // ── 3. 对话框包含文件上传区域 ──
  it('3. should show file upload section and submit button in dialog', () => {
    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));
    expect(screen.getByTestId('element-doc-upload-btn')).toBeInTheDocument();
    expect(screen.getByTestId('element-doc-file-input')).toBeInTheDocument();
    expect(screen.getByTestId('element-doc-submit')).toBeInTheDocument();
  });

  // ── 4. 非法扩展名被拒绝 ──
  it('4. should reject unsupported file extension and show toast error', () => {
    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));
    const fileInput = screen.getByTestId('element-doc-file-input');
    uploadFile(fileInput, new File(['dummy'], 'report.exe', { type: 'application/octet-stream' }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('.exe'));
  });

  // ── 5. .docx 格式被拒绝（客户端不支持直接读取）──
  it('5. should reject .docx file and show toast about unsupported binary format', () => {
    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));
    const fileInput = screen.getByTestId('element-doc-file-input');
    uploadFile(fileInput, new File(['dummy'], 'report.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('.docx'));
  });

  // ── 6. 文件过大被拒绝 ──
  it('6. should reject file larger than 50KB and show toast error', async () => {
    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));
    const fileInput = screen.getByTestId('element-doc-file-input');
    uploadFile(fileInput, createFile('large.txt', 'x'.repeat(51000)));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('文件过大')));
  });

  // ── 7. 成功提交调用 API 并应用要素 ──
  it('7. should call API with documentText and apply elements on success', async () => {
    const elements = [
      { name: '客户', dimension: 'E1', description: '客户信息实体' },
      { name: '供应商', dimension: 'E1', description: '供应商信息实体' },
    ];
    mockFetchOk({ elements });

    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));

    // 上传文本文件
    const fileInput = screen.getByTestId('element-doc-file-input');
    uploadFile(fileInput, createFile('doc.txt', '客户和供应商管理'));

    // 等待文件名显示
    await waitFor(() => expect(screen.getByTestId('element-doc-filename')).toBeInTheDocument());

    // 提交
    fireEvent.click(screen.getByTestId('element-doc-submit'));

    // 验证 API 调用
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.documentText).toBe('客户和供应商管理');
    expect(body.projectId).toBeTruthy();
    expect(body.existingElementNames).toContain('订单');

    // 验证 toast 成功
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('成功插入 2 个要素')));
  });

  // ── 8. API 错误时显示 toast ──
  it('8. should show toast error when API returns failure', async () => {
    mockFetchError('LLM API 调用失败');

    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));

    const fileInput = screen.getByTestId('element-doc-file-input');
    uploadFile(fileInput, createFile('doc.txt', '测试文档'));

    await waitFor(() => expect(screen.getByTestId('element-doc-filename')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('element-doc-submit'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('调用失败')));
  });

  // ── 9. AI 返回空列表时显示提示 ──
  it('9. should show toast when AI returns empty elements list', async () => {
    mockFetchOk({ elements: [] });

    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));

    const fileInput = screen.getByTestId('element-doc-file-input');
    uploadFile(fileInput, createFile('doc.txt', '一些无关文本'));

    await waitFor(() => expect(screen.getByTestId('element-doc-filename')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('element-doc-submit'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('未识别出任何要素')));
  });

  // ── 10. 显示加载进度状态 ──
  it('10. should show loading indicator while submitting', async () => {
    // 让 fetch 不立即 resolve
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    render(<ElementLibrary />);
    fireEvent.click(screen.getByTestId('ai-element-draft-btn'));

    const fileInput = screen.getByTestId('element-doc-file-input');
    uploadFile(fileInput, createFile('doc.txt', '测试内容'));

    await waitFor(() => expect(screen.getByTestId('element-doc-filename')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('element-doc-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('element-doc-loading')).toBeInTheDocument();
    });
    expect(screen.getByTestId('element-doc-submit')).toBeDisabled();
  });
});
