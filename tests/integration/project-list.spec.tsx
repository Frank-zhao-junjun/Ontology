import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ProjectList } from '@/components/ontology/project-list';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, OntologyProject } from '@/types/ontology';

// ---------------------------------------------------------------------------
// Mock sonner – the component calls toast.error inside handlers
// ---------------------------------------------------------------------------
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn(), refresh: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Mock use-confirm
// ---------------------------------------------------------------------------
const mockConfirmFn = vi.fn();
vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => ({
    confirm: mockConfirmFn,
    ConfirmDialog: <div data-testid="confirm-dialog" />,
  }),
}));

// ---------------------------------------------------------------------------
// Mock project-service
// ---------------------------------------------------------------------------
const mockFetchProjects = vi.fn();
const mockDeleteProject = vi.fn();
const mockUpdateProject = vi.fn();

vi.mock('@/services/project-service', () => ({
  fetchProjects: (...args: unknown[]) => mockFetchProjects(...args),
  deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
  updateProject: (...args: unknown[]) => mockUpdateProject(...args),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const testDomain: Domain = {
  id: 'd1',
  name: '测试域',
  nameEn: 'Test',
  description: '',
};

const mockProjects = [
  {
    id: 'proj-1',
    name: '测试项目1',
    description: '第一个测试项目',
    domain_id: 'd1',
    domain_name: '财务',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'proj-2',
    name: '测试项目2',
    description: null,
    domain_id: 'd2',
    domain_name: '物料',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-06-15T00:00:00Z',
  },
];

// A valid OntologyProject that can pass through importProject → normalizeOntologyProject
const mockFullProject: OntologyProject = {
  id: 'proj-1',
  name: '测试项目1',
  description: '第一个测试项目',
  domain: testDomain,
  dataModel: null,
  behaviorModel: null,
  ruleModel: null,
  processModel: null,
  eventModel: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Mock fetch helper (happy-dom's globalThis.fetch is read-only on some
// versions, so we use Object.defineProperty).
// ---------------------------------------------------------------------------
interface MockRoute {
  method: string;
  urlMatch: (url: string) => boolean;
  handler: () => Promise<Response>;
}

function createMockResponse(ok: boolean, status: number, body: unknown): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(ok, status, body),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

function installMockFetch(routes: MockRoute[]) {
  const handler = async (input: RequestInfo | URL, init?: RequestInit) => {
    const reqUrl = typeof input === 'string' ? input : 'url' in input ? (input as Request).url : String(input);
    const method = (init?.method ?? 'GET').toUpperCase();

    for (const route of routes) {
      if (route.method === method && route.urlMatch(reqUrl)) {
        return route.handler();
      }
    }

    console.error('[mock-fetch] No route matched:', method, reqUrl);
    return createMockResponse(false, 404, { error: 'no mock' });
  };

  Object.defineProperty(globalThis, 'fetch', {
    value: handler,
    writable: true,
    configurable: true,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ProjectList — Integration', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Reset store state
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
      auditTrail: [],
    });
  });

  // -----------------------------------------------------------------------
  it('renders the loading state initially, then the project list on mount', async () => {
    mockFetchProjects.mockResolvedValueOnce(mockProjects);

    render(<ProjectList />);

    // The component starts in loading state, showing "加载中..."
    expect(screen.getByText('加载中...')).toBeInTheDocument();

    // After fetch resolves, project cards should appear
    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    expect(screen.getByText('测试项目2')).toBeInTheDocument();

    // Domain badges should be visible
    expect(screen.getByText('财务')).toBeInTheDocument();
    expect(screen.getByText('物料')).toBeInTheDocument();

    // The section heading should be present
    expect(screen.getByText('已有项目')).toBeInTheDocument();

    // Each card should have an "打开" button
    const openButtons = screen.getAllByRole('button', { name: /打开/ });
    expect(openButtons).toHaveLength(2);
  });

  // -----------------------------------------------------------------------
  it('can open a project by clicking the 打开 button', async () => {
    mockFetchProjects.mockResolvedValueOnce(mockProjects);

    // Mock fetch for GET /api/projects/proj-1 (handleOpenProject fetches full project)
    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/projects/proj-1'),
        handler: () =>
          Promise.resolve(createMockResponse(true, 200, { success: true, data: mockFullProject })),
      },
    ]);

    render(<ProjectList />);

    // Wait for project list to render
    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    // Click "打开" on the first project
    const openButtons = screen.getAllByRole('button', { name: /打开/ });
    fireEvent.click(openButtons[0]);

    // Wait for the fetch + store + navigation to happen
    await waitFor(() => {
      // importProject should have been called (store updated)
      const state = useOntologyStore.getState();
      expect(state.project).not.toBeNull();
    });

    // Router should have navigated to /tool
    expect(mockRouterPush).toHaveBeenCalledWith('/tool');
  });

  // -----------------------------------------------------------------------
  it('shows error toast when opening a project fails', async () => {
    const { toast } = await import('sonner');
    mockFetchProjects.mockResolvedValueOnce(mockProjects);

    // Mock fetch to throw a network error — only thrown errors trigger the catch block
    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/projects/proj-1'),
        handler: () => Promise.reject(new Error('Network error')),
      },
    ]);

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    const openButtons = screen.getAllByRole('button', { name: /打开/ });
    fireEvent.click(openButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('打开项目失败');
    });

    // Router should NOT have been called
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  it('can delete a project after confirmation', async () => {
    mockFetchProjects.mockResolvedValueOnce(mockProjects);
    mockConfirmFn.mockResolvedValueOnce(true); // user confirms
    mockDeleteProject.mockResolvedValueOnce(undefined);

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    // Find the first project card and click the delete button inside it
    const cards = screen.getAllByText('测试项目1');
    const card = cards[0].closest('[class*="space-y-"]')?.querySelector('.grid > div:first-child')
      ?? document.querySelector('.grid > div:first-child');

    // Find the trash button: the last ghost button with text-destructive class
    const allButtons = screen.getAllByRole('button');
    const trashButton = allButtons.find(
      (btn) => btn.classList.contains('text-destructive') || btn.className.includes('text-destructive'),
    );

    expect(trashButton).toBeTruthy();
    fireEvent.click(trashButton!);

    // Confirm was called with destructive variant
    await waitFor(() => {
      expect(mockConfirmFn).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('确定要删除项目'),
          variant: 'destructive',
        }),
      );
    });

    // deleteProject should have been called
    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith('proj-1');
    });

    // The project card should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('测试项目1')).not.toBeInTheDocument();
    });

    // But the second project should still be there
    expect(screen.getByText('测试项目2')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('does not delete a project when confirmation is cancelled', async () => {
    mockFetchProjects.mockResolvedValueOnce(mockProjects);
    mockConfirmFn.mockResolvedValueOnce(false); // user cancels

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    // Find and click the trash button
    const allButtons = screen.getAllByRole('button');
    const trashButton = allButtons.find(
      (btn) => btn.classList.contains('text-destructive') || btn.className.includes('text-destructive'),
    );

    expect(trashButton).toBeTruthy();
    fireEvent.click(trashButton!);

    // Confirm was called
    await waitFor(() => {
      expect(mockConfirmFn).toHaveBeenCalled();
    });

    // deleteProject should NOT have been called
    expect(mockDeleteProject).not.toHaveBeenCalled();

    // Both projects should still be visible
    expect(screen.getByText('测试项目1')).toBeInTheDocument();
    expect(screen.getByText('测试项目2')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('shows empty state (null render) when no projects are returned', async () => {
    mockFetchProjects.mockResolvedValueOnce([]);

    const { container } = render(<ProjectList />);

    // Loading shows initially
    expect(screen.getByText('加载中...')).toBeInTheDocument();

    // After loading, the component returns null — nothing rendered
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // The section heading should not exist
    expect(screen.queryByText('已有项目')).not.toBeInTheDocument();

    // No buttons should be present
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // Container should be effectively empty
    expect(container.innerHTML).toBe('');
  });

  // -----------------------------------------------------------------------
  it('handles API error gracefully — shows nothing after loading', async () => {
    mockFetchProjects.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<ProjectList />);

    // Loading shows initially
    expect(screen.getByText('加载中...')).toBeInTheDocument();

    // After the error, loading stops and empty list → component returns null
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // Nothing should be rendered (component returns null for empty list)
    expect(screen.queryByText('已有项目')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.innerHTML).toBe('');
  });

  // -----------------------------------------------------------------------
  it('can edit a project name and description', async () => {
    mockFetchProjects.mockResolvedValueOnce(mockProjects);

    // Mock fetch for GET /api/projects/proj-1 (handleOpenEditDialog + handleSaveEdit both fetch)
    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/projects/proj-1'),
        handler: () =>
          Promise.resolve(createMockResponse(true, 200, { success: true, data: mockFullProject })),
      },
    ]);

    mockUpdateProject.mockResolvedValueOnce(undefined);

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    // Find and click the pencil (edit) button
    // The pencil button is a ghost button with text-muted-foreground class
    const allButtons = screen.getAllByRole('button');
    const editButtons = allButtons.filter(
      (btn) => btn.className.includes('text-muted-foreground'),
    );
    expect(editButtons.length).toBeGreaterThan(0);
    fireEvent.click(editButtons[0]);

    // Edit dialog should appear
    await waitFor(() => {
      expect(screen.getByText('编辑项目')).toBeInTheDocument();
    });

    // Find the name and description inputs
    const nameInput = screen.getByLabelText('项目名称') as HTMLInputElement;
    const descInput = screen.getByLabelText('项目描述') as HTMLTextAreaElement;

    expect(nameInput.value).toBe('测试项目1');
    expect(descInput.value).toBe('第一个测试项目');

    // Change the name
    fireEvent.change(nameInput, { target: { value: '更新的项目名称' } });
    fireEvent.change(descInput, { target: { value: '更新后的描述' } });

    // Click save
    const saveButton = screen.getByRole('button', { name: /保存/ });
    fireEvent.click(saveButton);

    // updateProject should have been called
    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalled();
    });

    // The dialog should close and the project name should be updated in the list
    await waitFor(() => {
      expect(screen.getByText('更新的项目名称')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  it('shows error toast when deleting a project fails', async () => {
    const { toast } = await import('sonner');
    mockFetchProjects.mockResolvedValueOnce(mockProjects);
    mockConfirmFn.mockResolvedValueOnce(true); // user confirms
    mockDeleteProject.mockRejectedValueOnce(new Error('Delete failed'));

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });

    // Find and click the trash button
    const allButtons = screen.getAllByRole('button');
    const trashButton = allButtons.find(
      (btn) => btn.classList.contains('text-destructive') || btn.className.includes('text-destructive'),
    );

    expect(trashButton).toBeTruthy();
    fireEvent.click(trashButton!);

    // Wait for the delete to fail
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('删除项目失败');
    });

    // The project should still be visible (not removed from list)
    expect(screen.getByText('测试项目1')).toBeInTheDocument();
  });
});
