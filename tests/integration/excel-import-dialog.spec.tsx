import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExcelImportDialog } from '@/components/ontology/excel-import-dialog';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), message: vi.fn() },
}));

const domain: Domain = { id: 'd1', name: '测试', nameEn: 'Test', description: '', icon: 'factory', color: '#000' };

describe('ExcelImportDialog — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('测试项目', domain);
  });

  const renderDialog = () => {
    const handlers = { onOpenChange: vi.fn() };
    const utils = render(
      <ExcelImportDialog open={true} onOpenChange={handlers.onOpenChange} />
    );
    return { ...utils, handlers };
  };

  it('shows the dialog title and description', () => {
    renderDialog();
    expect(screen.getByText('导入 Excel 数据')).toBeInTheDocument();
    expect(screen.getByText(/上传符合模板格式的 Excel 文件/)).toBeInTheDocument();
  });

  it('shows upload step with download template button', () => {
    renderDialog();
    expect(screen.getByText('下载模板')).toBeInTheDocument();
    expect(screen.getByText(/下载模板后按格式填写/)).toBeInTheDocument();
  });

  it('shows the upload dropzone area', () => {
    renderDialog();
    expect(screen.getByText('点击选择文件或拖拽到此处')).toBeInTheDocument();
  });

  it('shows template format hints', () => {
    renderDialog();
    expect(screen.getByText(/模板包含6个Sheet/)).toBeInTheDocument();
  });

  it('exposes hidden file input for upload', () => {
    renderDialog();
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
