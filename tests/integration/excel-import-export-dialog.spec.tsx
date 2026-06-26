import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExcelImportExportDialog } from '@/components/ontology/excel-import-export-dialog';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), message: vi.fn() },
}));

// Mock Excel and Markdown libs to avoid heavy imports
vi.mock('@/lib/excel/import-excel', () => ({
  parseExcelImport: vi.fn().mockResolvedValue({ summary: { newDrafts: 0, updatedDrafts: 0, placeholderDrafts: 0, warningCount: 0 }, warnings: [], changes: [] }),
  executeImport: vi.fn(),
}));

vi.mock('@/lib/excel/export-excel', () => ({
  exportModulesToExcel: vi.fn().mockReturnValue(new ArrayBuffer(0)),
}));

vi.mock('@/lib/markdown/markdown-import', () => ({
  parseMarkdownImport: vi.fn().mockReturnValue({ summary: { newDrafts: 0, updatedDrafts: 0, placeholderDrafts: 0, warningCount: 0 }, warnings: [], changes: [] }),
  generateMarkdownTemplate: vi.fn().mockReturnValue('# Template'),
  exportModulesToMarkdown: vi.fn().mockReturnValue('# Modules'),
}));

const domain: Domain = { id: 'd1', name: '测试', nameEn: 'Test', description: '', icon: 'factory', color: '#000' };

function activateTab(testId: string) {
  const tab = screen.getByTestId(testId);
  fireEvent.pointerDown(tab, { button: 0 });
  fireEvent.mouseDown(tab, { button: 0 });
  fireEvent.click(tab);
}

describe('ExcelImportExportDialog — Integration', () => {
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

  it('renders the dialog trigger button when uncontrolled', () => {
    render(<ExcelImportExportDialog />);
    expect(screen.getByTestId('excel-dialog-trigger')).toBeInTheDocument();
  });

  it('opens with export tab when controlled open is true', () => {
    render(<ExcelImportExportDialog open={true} />);
    expect(screen.getByText('分模块导入/导出')).toBeInTheDocument();
    expect(screen.getByTestId('tab-export')).toBeInTheDocument();
    expect(screen.getByTestId('tab-import')).toBeInTheDocument();
  });

  it('shows export tab content with export buttons', () => {
    render(<ExcelImportExportDialog open={true} />);
    expect(screen.getByTestId('export-excel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-md-btn')).toBeInTheDocument();
  });

  it('switches to import tab and shows dropzone', () => {
    render(<ExcelImportExportDialog open={true} />);
    activateTab('tab-import');
    expect(screen.getByTestId('import-dropzone')).toBeInTheDocument();
    expect(screen.getByText('选择文件')).toBeInTheDocument();
  });

  it('shows format selection buttons in import tab', () => {
    render(<ExcelImportExportDialog open={true} />);
    activateTab('tab-import');
    expect(screen.getByRole('button', { name: /Excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Markdown/i })).toBeInTheDocument();
  });

  it('shows download template button for markdown import', () => {
    render(<ExcelImportExportDialog open={true} />);
    activateTab('tab-import');
    fireEvent.click(screen.getByRole('button', { name: /Markdown/i }));
    expect(screen.getByText('下载模板')).toBeInTheDocument();
  });

  it('shows a close button in the dialog footer', () => {
    render(<ExcelImportExportDialog open={true} />);
    expect(screen.getByText('关闭')).toBeInTheDocument();
  });
});
