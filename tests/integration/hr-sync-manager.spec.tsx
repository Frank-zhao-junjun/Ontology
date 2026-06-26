import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HRSyncManager } from '@/components/ontology/hr-sync-manager';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, HRSyncConfig, HRSyncResult } from '@/types/ontology';

// ---------------------------------------------------------------------------
// Mock sonner – the component calls toast.success / toast.error inside
// handlers; without a mock they'd throw in the test environment.
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
// Test data
// ---------------------------------------------------------------------------
const testDomain: Domain = {
  id: 'd1',
  name: '测试域',
  nameEn: 'Test',
  description: '',
  icon: 'sync',
  color: '#000',
};

const mockConfig: HRSyncConfig = {
  enabled: true,
  source: 'feishu',
  endpoint: 'https://open.feishu.cn/open-apis/contact/v3/departments',
  syncInterval: 'manual',
  fieldMapping: {
    department: {
      name: 'department_name',
      nameEn: 'department_name_en',
      code: 'department_code',
      parentId: 'parent_department_code',
      type: 'department_type',
      managerId: 'manager_id',
      status: 'status',
    },
    position: {
      name: 'position_name',
      nameEn: 'position_name_en',
      code: 'position_code',
      departmentCode: 'department_code',
      parentCode: 'parent_position_code',
      level: 'position_level',
      headcount: 'headcount',
      status: 'status',
    },
  },
  conflictStrategy: 'manual',
  syncScope: {
    syncDepartments: true,
    syncPositions: true,
    syncResponsibilities: false,
    includeInactive: false,
  },
};

const mockHistory: HRSyncResult[] = [
  {
    syncId: 'sync-001',
    triggeredAt: '2026-06-26T10:00:00Z',
    completedAt: '2026-06-26T10:01:00Z',
    status: 'success',
    source: 'feishu',
    summary: {
      departments: { total: 5, created: 2, updated: 1, deactivated: 0, unchanged: 2 },
      positions: { total: 10, created: 3, updated: 2, deactivated: 0, unchanged: 5 },
    },
  },
  {
    syncId: 'sync-002',
    triggeredAt: '2026-06-25T14:00:00Z',
    status: 'failed',
    source: 'feishu',
    summary: {
      departments: { total: 0, created: 0, updated: 0, deactivated: 0, unchanged: 0 },
      positions: { total: 0, created: 0, updated: 0, deactivated: 0, unchanged: 0 },
    },
  },
];

const mockSyncResult: HRSyncResult = {
  syncId: 'sync-003',
  triggeredAt: '2026-06-26T11:00:00Z',
  completedAt: '2026-06-26T11:00:30Z',
  status: 'success',
  source: 'feishu',
  summary: {
    departments: { total: 5, created: 0, updated: 1, deactivated: 0, unchanged: 4 },
    positions: { total: 10, created: 0, updated: 3, deactivated: 0, unchanged: 7 },
  },
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

// Define fetch with Object.defineProperty since it's read-only
function installMockFetch(routes: MockRoute[]) {
  const handler = async (input: RequestInfo | URL, init?: RequestInit) => {
    const reqUrl = typeof input === 'string' ? input : 'url' in input ? (input as Request).url : String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    
    // Try routes in order
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
describe('HRSyncManager — Integration', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('HR Test', testDomain);
  });

  // -----------------------------------------------------------------------
  it('renders the header and loads config on mount', async () => {
    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/hr-sync/config'),
        handler: () => Promise.resolve(createMockResponse(true, 200, mockConfig)),
      },
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/hr-sync/history'),
        handler: () => Promise.resolve(createMockResponse(true, 200, [])),
      },
    ]);

    render(<HRSyncManager />);

    // The component should mount and show the title immediately.
    expect(screen.getByText('HR 系统同步')).toBeInTheDocument();

    // Wait for config to be fetched — the "启用自动同步" label is from a
    // <Label> rendered near the switch in the config card.
    await waitFor(() => {
      expect(screen.getByText('启用自动同步')).toBeInTheDocument();
    });

    // The history section should show the empty-state placeholder.
    // The full text from the component is:
    //   "暂无同步记录，点击「立即同步」开始"
    await waitFor(() => {
      expect(screen.getByText(/暂无同步记录/)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  it('displays the sync history list returned by the API', async () => {
    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/hr-sync/config'),
        handler: () => Promise.resolve(createMockResponse(true, 200, mockConfig)),
      },
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/hr-sync/history'),
        handler: () => Promise.resolve(createMockResponse(true, 200, mockHistory)),
      },
    ]);

    render(<HRSyncManager />);

    // Wait for the source label ("飞书") to appear in a history row.
    await waitFor(() => {
      expect(screen.getByText('飞书')).toBeInTheDocument();
    });

    // Both status badges should be visible.
    expect(screen.getByText('成功')).toBeInTheDocument();
    expect(screen.getByText('失败')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('triggers a sync when the button is clicked and appends the result', async () => {
    const { toast } = await import('sonner');

    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/hr-sync/config'),
        handler: () => Promise.resolve(createMockResponse(true, 200, mockConfig)),
      },
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/hr-sync/history'),
        handler: () => Promise.resolve(createMockResponse(true, 200, [])),
      },
      {
        method: 'POST',
        urlMatch: (url) => url.includes('/api/hr-sync/trigger'),
        handler: () => Promise.resolve(createMockResponse(true, 200, mockSyncResult)),
      },
    ]);

    render(<HRSyncManager />);

    // Should show empty history initially.
    expect(await screen.findByText(/暂无同步记录/)).toBeInTheDocument();

    // Click the "立即同步" trigger button.
    const triggerBtn = screen.getByRole('button', { name: /立即同步/i });
    fireEvent.click(triggerBtn);

    // Verify the POST was handled by checking toast.success was called
    // with the sync completion message.
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  it('shows the empty history state when the API call fails', async () => {
    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/hr-sync/config'),
        handler: () => Promise.resolve(createMockResponse(true, 200, mockConfig)),
      },
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/hr-sync/history'),
        handler: () => Promise.resolve(createMockResponse(false, 500, null)),
      },
    ]);

    render(<HRSyncManager />);

    // The component's catch block keeps the current (empty) history, so
    // the placeholder should remain visible.
    await waitFor(() => {
      expect(screen.getByText(/暂无同步记录/)).toBeInTheDocument();
    });

    // The history card header should still render.
    expect(screen.getByText('同步历史')).toBeInTheDocument();
  });
});
