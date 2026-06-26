import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SemanticLayerTab } from '@/components/ontology/semantic-layer-tab';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, AgentSemanticLayer } from '@/types/ontology';

// Mock Zustand persist middleware to prevent localStorage rehydration loop in tests
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware');
  return { ...(actual as object), persist: (config: unknown) => config };
});

// Mock ScrollArea to avoid Radix UI setRef infinite loop in test env
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <>{children}</>,
  ScrollBar: () => null,
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() } }));

const domain: Domain = {
  id: 'd1', name: 'Test', nameEn: 'Test', description: '', icon: 'factory', color: '#000',
};

const defaultLayer: AgentSemanticLayer = {
  metadata: {
    version: '1.0', lastUpdated: '2026-06-26T12:00:00.000Z',
    totalIntents: 2, totalTerms: 1, totalRelations: 1,
    coverage: { entitiesWithIntents: 1, totalEntities: 1, actionsWithRecovery: 0, totalActions: 0 },
  },
  intents: [{
    id: 'i1', name: '创建订单', category: 'crud', priority: 1,
    triggerPhrases: ['创建订单', '新建订单'],
    slotFilling: { slots: [], requiredSlots: [], fillOrder: [], allowBatchFill: true },
    actionId: 'a1', targetEntityId: 'e1', requiresConfirmation: false, examples: [],
  }],
  businessTerms: [{
    id: 't1', term: '订单', termEn: 'Order', definition: '业务单据定义',
    domain: 'commerce', synonyms: ['采购单'], status: 'active' as const,
    examples: [], modelRefs: [],
  }],
  semanticRelations: [{
    id: 'r1', type: 'is_a', sourceEntityId: 'e1', targetEntityId: 'e2',
    weight: 1, transitive: false, symmetric: false, name: '直属关系',
  }],
  errorRecoveries: [],
  fieldMappings: [],
  agentPolicies: [],
  dialogContextTemplate: { ttl: 300, referencedEntities: [], turnCount: 0, state: 'idle' as const },
  temporalValidities: [],
};

// Stable coverage return to avoid computed-selector infinite loop
let stableCoverage: { entitiesWithIntents: number; totalEntities: number; actionsWithRecovery: number; totalActions: number } | null = {
  entitiesWithIntents: 1, totalEntities: 1, actionsWithRecovery: 0, totalActions: 0,
};

function setup(agentSemanticLayer: AgentSemanticLayer | null) {
  useOntologyStore.setState({
    project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
    versions: [], activeModelType: null, selectedBusinessChainNode: null,
  });
  useOntologyStore.getState().createProject('Test', domain);

  const project = useOntologyStore.getState().project!;
  useOntologyStore.setState({
    project: agentSemanticLayer ? { ...project, agentSemanticLayer } : project,
    getSemanticCoverage: () => stableCoverage,
  });
}
describe('SemanticLayerTab — Integration', () => {
  beforeEach(() => {
    stableCoverage = { entitiesWithIntents: 1, totalEntities: 1, actionsWithRecovery: 0, totalActions: 0 };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows "尚未配置 Agent 语义层" message when agentSemanticLayer is null', () => {
    setup(null);
    render(<SemanticLayerTab />);
    expect(screen.getByText('尚未配置 Agent 语义层')).toBeInTheDocument();
    expect(screen.getByText(/通过 API 或未来 UI 创建 Intent/)).toBeInTheDocument();
  });

  it('shows coverage dashboard cards when agentSemanticLayer exists', () => {
    setup(defaultLayer);
    render(<SemanticLayerTab />);

    // Coverage dashboard shows text nodes — "100" and "%" are separate
    expect(screen.getByText('意图')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('术语')).toBeInTheDocument();
    expect(screen.getByText('关系')).toBeInTheDocument();
    // "1" appears for both totalTerms (1) and totalRelations (1) dashboard cards
    const ones = screen.getAllByText('1');
    expect(ones.length).toBe(2);
    // Coverage percent: React 19 renders "100" and "%" as fragmented text nodes
    // Use the parent container to verify the full content
    expect(screen.getByText('覆盖率')).toBeInTheDocument();
    const coverageCard = screen.getByText('覆盖率').closest('[data-slot="card-content"]');
    expect(coverageCard?.textContent).toMatch(/100\s*%/);
  });

  it('shows intent tab content by default (first tab)', () => {
    setup(defaultLayer);
    render(<SemanticLayerTab />);

    // "创建订单" appears both in intent content and V-AS-01 error (action 'a1' doesn't exist)
    expect(screen.getByText('crud')).toBeInTheDocument();
    const createOrder = screen.getAllByText('创建订单');
    expect(createOrder.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('新建订单')).toBeInTheDocument();
    expect(screen.getByText(/Slots:/)).toBeInTheDocument();
  });

  it('shows terms tab trigger with correct count', () => {
    setup(defaultLayer);
    render(<SemanticLayerTab />);

    // Verify terms tab trigger exists with count
    const termsTab = screen.getByRole('tab', { name: /术语.*1/ });
    expect(termsTab).toBeInTheDocument();
  });

  it('shows relations tab trigger with correct count', () => {
    setup(defaultLayer);
    render(<SemanticLayerTab />);

    // Verify relations tab trigger exists with count  
    const relTab = screen.getByRole('tab', { name: /关系.*1/ });
    expect(relTab).toBeInTheDocument();
  });

  it('shows validation issues when intents reference non-existent entities', () => {
    const layerWithBadIntents: AgentSemanticLayer = {
      ...defaultLayer,
      metadata: { ...defaultLayer.metadata, totalIntents: 2 },
      intents: [
        {
          id: 'bad-1', name: 'Bad Intent', category: 'crud', priority: 1,
          triggerPhrases: ['create bad'],
          slotFilling: { slots: [], requiredSlots: [], fillOrder: [], allowBatchFill: true },
          actionId: 'bad-action', targetEntityId: 'bad-e', requiresConfirmation: false, examples: [],
        },
        {
          id: 'bad-2', name: 'Bad Intent 2', category: 'crud', priority: 1,
          triggerPhrases: ['create bad 2'],
          slotFilling: { slots: [], requiredSlots: [], fillOrder: [], allowBatchFill: true },
          actionId: 'bad-action-2', targetEntityId: 'bad-e-2', requiresConfirmation: false, examples: [],
        },
      ],
    };
    setup(layerWithBadIntents);
    render(<SemanticLayerTab />);

    // "V-AS-01" appears twice (one per bad intent)
    const vas01 = screen.getAllByText('V-AS-01');
    expect(vas01.length).toBe(2);
    // "V-AS-02" also appears twice (one per bad intent referencing non-existent entity)
    const vas02 = screen.getAllByText('V-AS-02');
    expect(vas02.length).toBe(2);
  });
});
