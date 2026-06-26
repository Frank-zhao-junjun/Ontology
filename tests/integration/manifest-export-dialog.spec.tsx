import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ManifestExportDialog } from '@/components/ontology/manifest-export-dialog';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, OntologyProject } from '@/types/ontology';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), message: vi.fn() },
}));

// Mock manifest-export lib
vi.mock('@/lib/manifest-export', () => ({
  buildManifestExportBundle: vi.fn(() => ({
    manifest: { ontology: { projectName: '测试项目' } },
    filename: 'test_ontology.yaml',
    validation: {
      valid: true,
      errors: [],
      warnings: [{ code: 'W001', severity: 'warning', message: '测试警告', elementType: 'entity', id: 'e1', field: 'name' }],
    },
  })),
  downloadManifestExport: vi.fn(),
}));

const domain: Domain = { id: 'd1', name: '测试', nameEn: 'Test', description: '', icon: 'factory', color: '#000' };

function createTestProject(): OntologyProject {
  return {
    id: 'proj-1',
    name: '测试项目',
    description: '测试描述',
    domain,
    dataModel: { id: 'dm1', name: 'dm', version: '1.0.0', domain: 'd1', projects: [], businessScenarios: [], entities: [], createdAt: '', updatedAt: '' },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  };
}

describe('ManifestExportDialog — Integration', () => {
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
  });

  it('renders the dialog trigger button when uncontrolled', () => {
    render(<ManifestExportDialog project={createTestProject()} />);
    expect(screen.getByText('导出 OntologyManifest')).toBeInTheDocument();
  });

  it('shows title and description when opened', () => {
    render(<ManifestExportDialog project={createTestProject()} open={true} />);
    expect(screen.getByText('导出平台本体制品')).toBeInTheDocument();
  });

  it('shows format toggle buttons (YAML, JSON, XLSX)', () => {
    render(<ManifestExportDialog project={createTestProject()} open={true} />);
    expect(screen.getByText('YAML')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('XLSX')).toBeInTheDocument();
  });

  it('shows validation pass alert with warnings', () => {
    render(<ManifestExportDialog project={createTestProject()} open={true} />);
    expect(screen.getByText(/校验通过/)).toBeInTheDocument();
    // Warning should be visible in the issues list
    expect(screen.getByText('测试警告')).toBeInTheDocument();
  });

  it('shows download button', () => {
    render(<ManifestExportDialog project={createTestProject()} open={true} />);
    expect(screen.getByText('下载 YAML')).toBeInTheDocument();
  });

  it('shows close button in footer', () => {
    render(<ManifestExportDialog project={createTestProject()} open={true} />);
    expect(screen.getByText('关闭')).toBeInTheDocument();
  });
});
