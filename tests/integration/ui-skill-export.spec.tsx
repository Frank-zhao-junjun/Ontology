import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ManifestExportDialog } from '@/components/ontology/manifest-export-dialog';
import type { OntologyProject } from '@/types/ontology';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

function makeProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '生产管理',
    description: '测试项目',
    domain: { id: 'dm-1', name: '离散制造', nameEn: 'DiscreteManufacturing', description: '' },
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1.0.0',
      domain: '离散制造',
      projects: [],
      businessScenarios: [],
      entities: [
        { id: 'ent-1', name: '物料', nameEn: 'Material', projectId: 'proj-1', businessScenarioId: 'bs-1', attributes: [], relations: [] },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as OntologyProject;
}

describe('ManifestExportDialog Skill ZIP', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders format buttons including Skill ZIP and Markdown', () => {
    render(<ManifestExportDialog project={makeProject()} />);
    fireEvent.click(screen.getByText('导出 OntologyManifest'));

    expect(screen.getByText('YAML')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('XLSX')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('Skill ZIP')).toBeInTheDocument();
  });

  it('shows scope selector when Skill ZIP is selected', () => {
    render(<ManifestExportDialog project={makeProject()} />);
    fireEvent.click(screen.getByText('导出 OntologyManifest'));
    fireEvent.click(screen.getByText('Skill ZIP'));

    expect(screen.getByText('导出范围')).toBeInTheDocument();
    expect(screen.getByText('全部模型')).toBeInTheDocument();
    expect(screen.getByText('仅数据模型')).toBeInTheDocument();
  });

  it('shows status alert for draft project', () => {
    render(<ManifestExportDialog project={makeProject()} />);
    fireEvent.click(screen.getByText('导出 OntologyManifest'));
    fireEvent.click(screen.getByText('Skill ZIP'));

    expect(screen.getByText(/草稿/)).toBeInTheDocument();
    expect(screen.getByText(/未确认对象/)).toBeInTheDocument();
  });

  it('calls /api/export/skill when downloading Skill ZIP', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(new Blob(['PK']), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="test.zip"',
        },
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<ManifestExportDialog project={makeProject()} />);
    fireEvent.click(screen.getByText('导出 OntologyManifest'));
    fireEvent.click(screen.getByText('Skill ZIP'));
    fireEvent.click(screen.getByText('仅数据模型'));
    fireEvent.click(screen.getByText('下载 Skill ZIP'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/export/skill',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"scope":"data"'),
        })
      );
    });
  });
});
