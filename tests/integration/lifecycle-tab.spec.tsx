import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LifecycleTab } from '@/components/ontology/lifecycle-tab';
import { useOntologyStore } from '@/store/ontology-store';
import type { EntityLifecycle } from '@/types/ontology';

// Mock ScrollArea to avoid Radix UI setRef infinite loop in test env
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <>{children}</>,
  ScrollBar: () => null,
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() } }));

function makeStates(overrides?: Partial<EntityLifecycle['stateMachine']>): EntityLifecycle['stateMachine'] {
  return {
    id: 'sm-1', name: '状态机',
    states: [
      { id: 's1', name: '草稿', isInitial: true, isFinal: false, color: undefined, availableActions: [], constraints: [], triggerableEvents: [], allowedRoles: [], timeout: undefined, dataVisibility: undefined, semanticTag: undefined },
      { id: 's2', name: '审批中', isInitial: false, isFinal: false, color: undefined, availableActions: [], constraints: [], triggerableEvents: [], allowedRoles: [], timeout: undefined, dataVisibility: undefined, semanticTag: undefined },
      { id: 's3', name: '已生效', isInitial: false, isFinal: true, color: undefined, availableActions: [], constraints: [], triggerableEvents: [], allowedRoles: [], timeout: undefined, dataVisibility: undefined, semanticTag: undefined },
    ],
    transitions: [
      { id: 't1', name: '提交审批', from: 's1', to: 's2', trigger: 'manual' as const, guardCondition: undefined, requiresApproval: false },
      { id: 't2', name: '审批通过', from: 's2', to: 's3', trigger: 'manual' as const, guardCondition: undefined, requiresApproval: false },
    ],
    ...overrides,
  };
}

const defaultLifecycle: EntityLifecycle = {
  entityId: 'entity-1', entityName: '订单', entityNameEn: 'Order', statusField: 'status',
  stateMachine: makeStates(),
  actionsByState: {}, rulesByState: {}, eventsByState: {}, rolesByState: {},
  auditTrail: [],
  stats: { totalStates: 3, totalTransitions: 2, totalActions: 0 },
};

// We'll keep a stable reference to the mock lifecycle so getEntityLifecycle
// always returns the same object (avoiding Zustand infinite re-render loop).
let stableLifecycle: EntityLifecycle = defaultLifecycle;

describe('LifecycleTab — Integration', () => {
  beforeEach(() => {
    // Store-level state reset
    useOntologyStore.setState({
      project: null, metadataList: [], masterDataList: [], masterDataRecords: {},
      versions: [], activeModelType: null, selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('Lifecycle Test', {
      id: 'd1', name: 'Test', nameEn: 'Test', description: '', icon: 'factory', color: '#000',
    });

    // Override getEntityLifecycle to return stable object reference
    stableLifecycle = defaultLifecycle;
    useOntologyStore.setState({
      getEntityLifecycle: (_entityId: string) => stableLifecycle,
    });
  });

  afterEach(() => {
    // Restore original method
    vi.restoreAllMocks();
  });

  it('shows "未配置状态机" message when entity has no state machine', () => {
    useOntologyStore.setState({
      getEntityLifecycle: (_entityId: string) => null,
    });
    render(<LifecycleTab entityId="e1" />);
    expect(screen.getByText('该实体未配置状态机，无法查看生命周期')).toBeInTheDocument();
  });

  it('shows stat cards when lifecycle exists', () => {
    render(<LifecycleTab entityId="entity-1" />);
    expect(screen.getByText('状态流转')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('转换')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
    expect(screen.getByText('审计')).toBeInTheDocument();
  });

  it('shows state names and transitions in state flow section', () => {
    stableLifecycle = {
      entityId: 'e1', entityName: '订单', entityNameEn: 'Order', statusField: 'status',
      stateMachine: {
        id: 'sm-2', name: '审批状态机',
        states: [
          { id: 'st1', name: '待提交', isInitial: true, isFinal: false, color: undefined, availableActions: [], constraints: [], triggerableEvents: [], allowedRoles: [], timeout: undefined, dataVisibility: undefined, semanticTag: undefined },
          { id: 'st2', name: '部门审核', isInitial: false, isFinal: false, color: undefined, availableActions: [], constraints: [], triggerableEvents: [], allowedRoles: [], timeout: undefined, dataVisibility: undefined, semanticTag: undefined },
          { id: 'st3', name: '已完成', isInitial: false, isFinal: true, color: undefined, availableActions: [], constraints: [], triggerableEvents: [], allowedRoles: [], timeout: undefined, dataVisibility: undefined, semanticTag: undefined },
        ],
        transitions: [
          { id: 'tr1', name: '提交', from: 'st1', to: 'st2', trigger: 'manual' as const, guardCondition: undefined, requiresApproval: false },
          { id: 'tr2', name: '审核通过', from: 'st2', to: 'st3', trigger: 'manual' as const, guardCondition: undefined, requiresApproval: false },
        ],
      },
      actionsByState: {}, rulesByState: {}, eventsByState: {}, rolesByState: {},
      auditTrail: [],
      stats: { totalStates: 3, totalTransitions: 2, totalActions: 0 },
    };
    render(<LifecycleTab entityId="e1" />);
    expect(screen.getByText('待提交')).toBeInTheDocument();
    // "部门审核" and "已完成" appear as both state name and transition target
    expect(screen.getAllByText('部门审核').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('已完成').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('初始')).toBeInTheDocument();
    expect(screen.getByText('终止')).toBeInTheDocument();
    expect(screen.getByText('提交')).toBeInTheDocument();
    expect(screen.getByText('审核通过')).toBeInTheDocument();
  });

  it('shows audit trail entries when present', () => {
    stableLifecycle = {
      entityId: 'e3', entityName: '合同', entityNameEn: 'Contract', statusField: 'status',
      stateMachine: {
        id: 'sm-4', name: '合同状态机',
        states: [
          { id: 'cs1', name: '拟定', isInitial: true, isFinal: false, color: undefined, availableActions: [], constraints: [], triggerableEvents: [], allowedRoles: [], timeout: undefined, dataVisibility: undefined, semanticTag: undefined },
          { id: 'cs2', name: '生效', isInitial: false, isFinal: true, color: undefined, availableActions: [], constraints: [], triggerableEvents: [], allowedRoles: [], timeout: undefined, dataVisibility: undefined, semanticTag: undefined },
        ],
        transitions: [
          { id: 'ct1', name: '生效', from: 'cs1', to: 'cs2', trigger: 'manual' as const, guardCondition: undefined, requiresApproval: false },
        ],
      },
      actionsByState: {}, rulesByState: {}, eventsByState: {}, rolesByState: {},
      auditTrail: [{
        id: 'a1', entityId: 'e3', entityNameEn: 'Contract',
        timestamp: '2026-06-26T10:00:00.000Z', eventType: 'transition',
        fromStateId: 'cs1', toStateId: 'cs2', transitionId: 'ct1',
        actorDescription: '张三', result: 'success' as const,
      }],
      stats: { totalStates: 2, totalTransitions: 1, totalActions: 0 },
    };
    render(<LifecycleTab entityId="e3" />);
    expect(screen.getByText(/审计记录/)).toBeInTheDocument();
    expect(screen.getByText('transition')).toBeInTheDocument();
    // "拟定" and "生效" appear in both state flow and audit trail sections
    expect(screen.getAllByText('拟定').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('生效').length).toBeGreaterThanOrEqual(1);
  });
});
