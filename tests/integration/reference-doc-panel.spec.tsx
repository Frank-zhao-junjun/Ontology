import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReferenceDocPanel } from '@/components/ontology/reference-doc-panel';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), message: vi.fn() },
}));

const domain: Domain = { id: 'd1', name: '测试', nameEn: 'Test', description: '', icon: 'factory', color: '#000' };

const uploadedAt = '2026-06-26T00:00:00.000Z';

describe('ReferenceDocPanel — Integration', () => {
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

  it('renders the panel heading and document count badge', () => {
    render(<ReferenceDocPanel />);
    expect(screen.getByText('参考文档')).toBeInTheDocument();
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });

  it('shows empty state with upload hint when no documents', () => {
    render(<ReferenceDocPanel />);
    expect(screen.getByText(/上传参考文档辅助 AI 建模/)).toBeInTheDocument();
    expect(screen.getByText(/支持 .docx .pdf .xlsx .txt .md .csv/)).toBeInTheDocument();
  });

  it('shows an upload button', () => {
    render(<ReferenceDocPanel />);
    expect(screen.getByText('上传')).toBeInTheDocument();
  });

  it('renders document list when documents exist in store', () => {
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        referenceDocuments: [
          {
            id: 'doc-1',
            fileName: '需求文档.docx',
            fileType: 'docx',
            fileSize: 204800,
            uploadedAt,
            textLength: 5000,
            parseStatus: 'success' as const,
            extractedText: '示例内容',
            title: '需求规格',
            extractionStatus: 'none' as const,
            extractedEntities: [],
          },
        ],
      },
    });

    render(<ReferenceDocPanel />);
    expect(screen.getByText('需求文档.docx')).toBeInTheDocument();
    expect(screen.getByText('docx')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('shows document actions: preview, extract entities, delete', () => {
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        referenceDocuments: [
          {
            id: 'doc-1',
            fileName: '需求文档.docx',
            fileType: 'docx',
            fileSize: 204800,
            uploadedAt,
            textLength: 5000,
            parseStatus: 'success' as const,
            extractedText: '示例内容',
            title: '需求规格',
            extractionStatus: 'none' as const,
            extractedEntities: [],
          },
        ],
      },
    });

    render(<ReferenceDocPanel />);
    expect(screen.getByText('预览')).toBeInTheDocument();
    expect(screen.getByText('提取实体')).toBeInTheDocument();
    // Delete button should be present (trash icon button)
    const deleteBtn = document.querySelector('button.text-red-500');
    expect(deleteBtn).toBeInTheDocument();
  });

  it('shows extracted entities when extraction is done', () => {
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        referenceDocuments: [
          {
            id: 'doc-1',
            fileName: '需求文档.docx',
            fileType: 'docx',
            fileSize: 204800,
            uploadedAt,
            textLength: 5000,
            parseStatus: 'success' as const,
            extractedText: '内容',
            title: '需求',
            extractionStatus: 'done' as const,
            extractedEntities: [
              {
                name: '订单',
                nameEn: 'Order',
                description: '销售订单实体',
                source: '需求文档.docx',
                confidence: 0.95,
                attributes: [{ name: '金额', dataType: 'decimal', description: '订单金额', source: '需求文档.docx' }],
              },
            ],
          },
        ],
      },
    });

    render(<ReferenceDocPanel />);
    expect(screen.getByText('提取的实体候选 (1):')).toBeInTheDocument();
    expect(screen.getByText('订单')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });
});
