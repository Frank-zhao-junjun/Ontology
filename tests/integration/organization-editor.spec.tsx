import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OrganizationEditor } from '@/components/ontology/organization-editor';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), message: vi.fn() },
}));

// Mock ScrollArea to avoid Radix UI issues
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: React.PropsWithChildren<{ className?: string }>) =>
    <div className={className} data-testid="scroll-area">{children}</div>,
  ScrollBar: () => null,
}));

// ---------------------------------------------------------------------------
// Mock the ontology store to avoid infinite re-render loops caused by
// getDepartmentTree() returning a new reference on every selector call.
// ---------------------------------------------------------------------------
const mockState: Record<string, unknown> = {
  project: null,
  addDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
  addPosition: vi.fn(),
  deletePosition: vi.fn(),
  detectResponsibilityOverlap: vi.fn(),
  getDepartmentTree: vi.fn(() => []),
};

vi.mock('@/store/ontology-store', () => ({
  useOntologyStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector(mockState) : mockState,
}));

describe('OrganizationEditor — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset project to null => empty state
    mockState.project = null;
    mockState.getDepartmentTree = vi.fn(() => []);
  });

  // -----------------------------------------------------------------------
  it('shows empty state when no organization model exists', () => {
    render(<OrganizationEditor />);
    expect(screen.getByText('尚未配置组织体系模型')).toBeInTheDocument();
    expect(screen.getByText('添加部门开始构建组织架构')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('shows the add department dialog trigger in empty state', () => {
    render(<OrganizationEditor />);
    // There should be a button labeled "部门" to add departments
    const addDeptBtn = screen.getByRole('button', { name: /部门/ });
    expect(addDeptBtn).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('renders department tree and positions when organization model exists', () => {
    mockState.project = {
      id: 'proj-1',
      name: '测试',
      organizationModel: {
        id: 'org-1',
        name: '测试组织',
        nameEn: 'Test Org',
        departments: [
          { id: 'dept-1', name: '研发部', nameEn: 'R&D', type: 'department', parentId: undefined, status: 'active' },
        ],
        positions: [
          { id: 'pos-1', name: '高级工程师', nameEn: 'Sr Eng', departmentId: 'dept-1', level: 3, roleIds: ['dev'], responsibilities: [], status: 'active' },
        ],
        syncConfig: null,
        lastSyncResult: null,
      },
      dataModel: null,
      behaviorModel: null,
      ruleModel: null,
      processModel: null,
      eventModel: null,
      valueDomains: [],
      capabilities: [],
      scenarios: [],
      epcProcesses: [],
      metaElements: [],
      referenceDocuments: [],
      moduleVersionRecords: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    };

    mockState.getDepartmentTree = vi.fn(() => [
      {
        department: { id: 'dept-1', name: '研发部', nameEn: 'R&D', type: 'department', parentId: undefined, status: 'active' },
        positions: [
          { id: 'pos-1', name: '高级工程师', nameEn: 'Sr Eng', departmentId: 'dept-1', level: 3, roleIds: ['dev'], responsibilities: [], status: 'active' },
        ],
        children: [
          {
            department: { id: 'dept-2', name: '产品组', nameEn: 'Product', type: 'team', parentId: 'dept-1', status: 'active' },
            positions: [],
            children: [],
          },
        ],
      },
    ]);

    render(<OrganizationEditor />);

    // Department tree nodes should be visible
    expect(screen.getByText('研发部')).toBeInTheDocument();
    expect(screen.getByText('产品组')).toBeInTheDocument();

    // Click on the department to see its positions
    fireEvent.click(screen.getByText('研发部'));
    expect(screen.getByText('高级工程师')).toBeInTheDocument();
    expect(screen.getByText('(Sr Eng)')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('shows HR sync section with unconfigured state', () => {
    mockState.project = {
      id: 'proj-1',
      name: '测试',
      organizationModel: {
        id: 'org-1',
        name: '测试组织',
        nameEn: 'Test Org',
        departments: [],
        positions: [],
        syncConfig: null,
        lastSyncResult: null,
      },
      dataModel: null,
      behaviorModel: null,
      ruleModel: null,
      processModel: null,
      eventModel: null,
      valueDomains: [],
      capabilities: [],
      scenarios: [],
      epcProcesses: [],
      metaElements: [],
      referenceDocuments: [],
      moduleVersionRecords: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    };
    mockState.getDepartmentTree = vi.fn(() => []);

    render(<OrganizationEditor />);
    expect(screen.getByText('HR 同步')).toBeInTheDocument();
    expect(screen.getByText('未配置 HR 同步')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('shows HR sync config details when sync is configured', () => {
    mockState.project = {
      id: 'proj-1',
      name: '测试',
      organizationModel: {
        id: 'org-1',
        name: '测试组织',
        nameEn: 'Test Org',
        departments: [],
        positions: [],
        syncConfig: {
          enabled: true,
          source: 'HRIS',
          syncInterval: 'daily',
          conflictStrategy: 'overwrite',
          syncScope: { syncDepartments: true, syncPositions: true },
        },
        lastSyncResult: null,
      },
      dataModel: null,
      behaviorModel: null,
      ruleModel: null,
      processModel: null,
      eventModel: null,
      valueDomains: [],
      capabilities: [],
      scenarios: [],
      epcProcesses: [],
      metaElements: [],
      referenceDocuments: [],
      moduleVersionRecords: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    };
    mockState.getDepartmentTree = vi.fn(() => []);

    render(<OrganizationEditor />);
    expect(screen.getByText('HR 同步')).toBeInTheDocument();
    expect(screen.getByText('已启用')).toBeInTheDocument();
    expect(screen.getByText('HRIS')).toBeInTheDocument();
    expect(screen.getByText('daily')).toBeInTheDocument();
  });
});
