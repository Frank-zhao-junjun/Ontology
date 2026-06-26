import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AgentSkillsManager } from '@/components/ontology/agent-skills-manager';

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
const mockSkills = [
  {
    id: 'sk-1',
    name: 'DataModel Query',
    description: '查询数据模型的技能',
    category: 'coding',
    prompt: '你可以查询数据模型...',
    enabled: true,
  },
  {
    id: 'sk-2',
    name: 'EPC Linter',
    description: '检查 EPC 图表的正确性',
    category: 'review',
    prompt: '你可以检查 EPC 图表...',
    enabled: true,
  },
  {
    id: 'sk-3',
    name: 'Document Generator',
    description: '自动生成文档',
    category: 'documentation',
    prompt: '你可以生成 Markdown 文档...',
    enabled: false,
  },
];

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
describe('AgentSkillsManager — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  it('renders the header and loads skill list on mount', async () => {
    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/agent/skills'),
        handler: () =>
          Promise.resolve(
            createMockResponse(true, 200, { data: mockSkills }),
          ),
      },
    ]);

    render(<AgentSkillsManager />);

    // The component should mount and show the title immediately.
    expect(screen.getByText('Agent 技能管理')).toBeInTheDocument();

    // Wait for skills to load — the first skill name should appear.
    await waitFor(() => {
      expect(screen.getByText('DataModel Query')).toBeInTheDocument();
    });

    // All three skills should be visible.
    expect(screen.getByText('EPC Linter')).toBeInTheDocument();
    expect(screen.getByText('Document Generator')).toBeInTheDocument();

    // Category badges should render (using CATEGORY_LABELS mapping).
    expect(screen.getByText('编码')).toBeInTheDocument();
    expect(screen.getByText('评审')).toBeInTheDocument();
    expect(screen.getByText('文档')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  it('handles enabling/disabling a skill via toggle switch', async () => {
    const { toast } = await import('sonner');

    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/agent/skills'),
        handler: () =>
          Promise.resolve(
            createMockResponse(true, 200, { data: mockSkills }),
          ),
      },
      {
        method: 'POST',
        urlMatch: (url) => url.includes('/api/agent/skills'),
        handler: () =>
          Promise.resolve(
            createMockResponse(true, 200, { success: true }),
          ),
      },
    ]);

    render(<AgentSkillsManager />);

    // Wait for skills to render.
    await waitFor(() => {
      expect(screen.getByText('DataModel Query')).toBeInTheDocument();
    });

    // Find all switches — they render as role="switch".
    const switches = screen.getAllByRole('switch');

    // The third skill (Document Generator) is disabled (enabled: false),
    // so its switch should have the correct aria-checked state.
    expect(switches[2]).toHaveAttribute('aria-checked', 'false');

    // Click the third switch to enable the skill.
    fireEvent.click(switches[2]);

    // Verify the POST was handled by checking toast.success was called.
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('技能已启用');
    });
  });

  // -----------------------------------------------------------------------
  it('shows empty state when the API call fails', async () => {
    installMockFetch([
      {
        method: 'GET',
        urlMatch: (url) => url.includes('/api/agent/skills'),
        handler: () =>
          Promise.resolve(createMockResponse(false, 500, null)),
      },
    ]);

    render(<AgentSkillsManager />);

    // The component's catch block keeps skills as an empty array,
    // so the empty-state alert should appear.
    await waitFor(() => {
      expect(screen.getByText('暂无可用技能')).toBeInTheDocument();
    });

    // The header should still render.
    expect(screen.getByText('Agent 技能管理')).toBeInTheDocument();
  });
});
