import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { EpcProcess, EpcStep, ModuleVersionRecord, OntologyProject } from '@/types/ontology';

// ── mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/use-project-sync', () => ({
  useProjectSync: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/services/project-service', () => ({
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));

vi.mock('@/components/ontology/data-model-editor', () => ({
  DataModelEditor: () => React.createElement('div', { 'data-testid': 'data-model-editor' }),
}));
vi.mock('@/components/ontology/behavior-model-editor', () => ({
  BehaviorModelEditor: () => React.createElement('div', { 'data-testid': 'behavior-model-editor' }),
}));
vi.mock('@/components/ontology/rule-model-editor', () => ({
  RuleModelEditor: () => React.createElement('div', { 'data-testid': 'rule-model-editor' }),
}));
vi.mock('@/components/ontology/event-model-editor', () => ({
  EventModelEditor: () => React.createElement('div', { 'data-testid': 'event-model-editor' }),
}));
vi.mock('@/components/ontology/epc-tab', () => ({
  EpcTab: () => React.createElement('div', { 'data-testid': 'epc-tab' }),
}));
vi.mock('@/components/ontology/manual-generator', () => ({
  ManualGenerator: () => React.createElement('div', { 'data-testid': 'manual-generator' }),
}));
vi.mock('@/components/ontology/metadata-manager', () => ({
  MetadataManager: () => React.createElement('div', { 'data-testid': 'metadata-manager' }),
}));
vi.mock('@/components/ontology/masterdata-manager', () => ({
  MasterDataManager: () => React.createElement('div', { 'data-testid': 'masterdata-manager' }),
}));
vi.mock('@/components/ontology/publish-dialog', () => ({
  PublishDialog: () => React.createElement('div', { 'data-testid': 'publish-dialog' }),
}));
vi.mock('@/components/ontology/manifest-export-dialog', () => ({
  ManifestExportDialog: () => React.createElement('div', { 'data-testid': 'manifest-export-dialog' }),
}));
vi.mock('@/components/ontology/governance-editor', () => ({
  GovernanceEditor: () => React.createElement('div', { 'data-testid': 'governance-editor' }),
}));
vi.mock('@/components/ontology/data-source-editor', () => ({
  DataSourceEditor: () => React.createElement('div', { 'data-testid': 'data-source-editor' }),
}));
vi.mock('@/components/ontology/metrics-editor', () => ({
  MetricsEditor: () => React.createElement('div', { 'data-testid': 'metrics-editor' }),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const now = '2026-06-24T12:00:00.000Z';

function createProject(): OntologyProject {
  return {
    id: 'proj-fork-rules',
    name: 'Fork 规则 E2E',
    description: '',
    domain: {
      id: 'domain-1',
      name: '离散制造',
      nameEn: 'Mfg',
      description: '',
      icon: 'factory',
      color: '#3b82f6',
    },
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1',
      domain: 'domain-1',
      projects: [{ id: 'ep-1', name: '默认', nameEn: 'Default', color: '#3b82f6', createdAt: now, updatedAt: now }],
      businessScenarios: [],
      entities: [],
      createdAt: now,
      updatedAt: now,
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    valueDomains: [],
    capabilities: [],
    scenarios: [],
    epcProcesses: [],
    metaElements: [],
    moduleVersionRecords: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Build a single EpcStep */
function makeStep(id: string, name: string): EpcStep {
  return { id, name };
}

/** Build a confirmed ModuleVersionRecord */
function confirmedRecord(
  moduleKind: ModuleVersionRecord['moduleKind'],
  moduleId: string,
  version: string,
  snapshot: unknown,
): ModuleVersionRecord {
  return {
    id: `mvr-${moduleKind}-${moduleId}-${version}`,
    moduleKind,
    moduleId,
    status: 'confirmed',
    version,
    confirmedAt: now,
    createdAt: now,
    snapshot,
  };
}

/** Build a draft ModuleVersionRecord */
function draftRecord(
  moduleKind: ModuleVersionRecord['moduleKind'],
  moduleId: string,
  snapshot: unknown,
): ModuleVersionRecord {
  return {
    id: `mvr-${moduleKind}-${moduleId}-draft`,
    moduleKind,
    moduleId,
    status: 'draft',
    createdAt: now,
    snapshot,
  };
}

// ── test suite ───────────────────────────────────────────────────────────────

describe('E2E-EPC-FORK-001 @smoke: 有 confirmed 版 → fork → 原 confirmed 不变', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
      selectedBusinessChainNode: null,
    });
  });

  it('@smoke 调用 applyAiEpcDraft 后原 confirmed 记录不变，新 draft 创建', () => {
    const store = useOntologyStore.getState();
    const c = store.addScenario(store.addCapability(store.addValueDomain({ name: '生产域' }).id, { name: '计划能力' }).id, { name: 'MTS场景' });
    const epc = store.addEpcProcess(c.id, { name: '主流程' });

    // 手动插入 confirmed v1 记录
    const confirmedSnapshot: EpcProcess = { ...epc, steps: [makeStep('s1', '旧步骤')] };
    useOntologyStore.setState({
      project: {
        ...useOntologyStore.getState().project!,
        moduleVersionRecords: [
          confirmedRecord('EPC', epc.id, 'v1', confirmedSnapshot),
        ],
      },
    });

    // 确认 EPС 对应的项目数据也包含旧 steps
    useOntologyStore.setState({
      project: {
        ...useOntologyStore.getState().project!,
        epcProcesses: [confirmedSnapshot],
      },
    });

    // 执行 fork — AI 生成新 steps
    const newSteps: EpcStep[] = [makeStep('s2', '新步骤')];
    store.applyAiEpcDraft(epc.id, newSteps);

    const records = useOntologyStore.getState().project!.moduleVersionRecords!;

    // 原 confirmed v1 不变
    const confirmed = records.find((r) => r.status === 'confirmed');
    expect(confirmed).toBeDefined();
    expect(confirmed!.version).toBe('v1');
    expect((confirmed!.snapshot as EpcProcess).steps).toHaveLength(1);
    expect((confirmed!.snapshot as EpcProcess).steps[0].id).toBe('s1');

    // 新增 draft 记录
    const drafts = records.filter((r) => r.status === 'draft');
    expect(drafts).toHaveLength(1);
    expect((drafts[0].snapshot as EpcProcess).steps).toHaveLength(1);
    expect((drafts[0].snapshot as EpcProcess).steps[0].id).toBe('s2');

    // 项目 EPC 数据已更新
    const updatedEpc = useOntologyStore.getState().project!.epcProcesses![0];
    expect(updatedEpc.steps).toHaveLength(1);
    expect(updatedEpc.steps[0].id).toBe('s2');
  });
});

describe('E2E-EPC-FORK-002 @smoke: 无 confirmed 有 draft → 覆盖', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
      selectedBusinessChainNode: null,
    });
  });

  it('@smoke 无 confirmed 有 draft 时 applyAiEpcDraft 全量覆盖 draft', () => {
    const store = useOntologyStore.getState();
    const c = store.addScenario(store.addCapability(store.addValueDomain({ name: '生产域' }).id, { name: '计划能力' }).id, { name: 'MTS场景' });
    const epc = store.addEpcProcess(c.id, { name: '主流程' });

    // 只插入 draft（无 confirmed）
    const oldDraftSnapshot: EpcProcess = { ...epc, steps: [makeStep('s1', '旧草稿步骤')] };
    useOntologyStore.setState({
      project: {
        ...useOntologyStore.getState().project!,
        moduleVersionRecords: [
          draftRecord('EPC', epc.id, oldDraftSnapshot),
        ],
        epcProcesses: [oldDraftSnapshot],
      },
    });

    // 执行 fork — AI 生成新 steps
    const newSteps: EpcStep[] = [makeStep('s2', '新覆盖步骤')];
    store.applyAiEpcDraft(epc.id, newSteps);

    const records = useOntologyStore.getState().project!.moduleVersionRecords!;

    // 仍只有 1 条 draft（被覆盖，不是新增第二条）
    const drafts = records.filter((r) => r.status === 'draft');
    expect(drafts).toHaveLength(1);

    // snapshot 已更新为新 steps
    expect((drafts[0].snapshot as EpcProcess).steps).toHaveLength(1);
    expect((drafts[0].snapshot as EpcProcess).steps[0].id).toBe('s2');
    expect((drafts[0].snapshot as EpcProcess).steps[0].name).toBe('新覆盖步骤');

    // 无 confirmed 记录
    const confirmed = records.filter((r) => r.status === 'confirmed');
    expect(confirmed).toHaveLength(0);

    // 项目 EPC 数据已更新
    const updatedEpc = useOntologyStore.getState().project!.epcProcesses![0];
    expect(updatedEpc.steps).toHaveLength(1);
    expect(updatedEpc.steps[0].name).toBe('新覆盖步骤');
  });
});

describe('E2E-EPC-FORK-003 @smoke: 无任何版本 → 创建新 draft', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
      selectedBusinessChainNode: null,
    });
  });

  it('@smoke 无任何版本时 applyAiEpcDraft 创建新 draft', () => {
    const store = useOntologyStore.getState();
    const c = store.addScenario(store.addCapability(store.addValueDomain({ name: '生产域' }).id, { name: '计划能力' }).id, { name: 'MTS场景' });
    const epc = store.addEpcProcess(c.id, { name: '主流程' });

    // 清空业务链节点自动创建的 version records，确保 EPC 无任何版本
    useOntologyStore.setState({
      project: {
        ...useOntologyStore.getState().project!,
        moduleVersionRecords: [],
      },
    });
    expect(useOntologyStore.getState().project!.moduleVersionRecords).toHaveLength(0);

    // 执行 fork
    const newSteps: EpcStep[] = [makeStep('s1', '全新步骤')];
    store.applyAiEpcDraft(epc.id, newSteps);

    const records = useOntologyStore.getState().project!.moduleVersionRecords!;

    // 只关心 EPC 的记录
    const epcRecords = records.filter((r) => r.moduleKind === 'EPC');
    expect(epcRecords).toHaveLength(1);
    expect(epcRecords[0].status).toBe('draft');
    expect(epcRecords[0].moduleKind).toBe('EPC');
    expect(epcRecords[0].moduleId).toBe(epc.id);

    // draft snapshot 包含新 steps
    expect((records[0].snapshot as EpcProcess).steps).toHaveLength(1);
    expect((records[0].snapshot as EpcProcess).steps[0].name).toBe('全新步骤');

    // 项目 EPC 数据已更新
    const updatedEpc = useOntologyStore.getState().project!.epcProcesses![0];
    expect(updatedEpc.steps).toHaveLength(1);
    expect(updatedEpc.steps[0].name).toBe('全新步骤');
  });
});

describe('E2E-EPC-FORK-004 @smoke: AI 生成后步骤列表刷新', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
      selectedBusinessChainNode: null,
    });
  });

  it('@smoke applyAiEpcDraft 后 epcProcesses 中步骤列表正确更新', () => {
    const store = useOntologyStore.getState();
    const c = store.addScenario(store.addCapability(store.addValueDomain({ name: '生产域' }).id, { name: '计划能力' }).id, { name: 'MTS场景' });
    const epc = store.addEpcProcess(c.id, { name: '主流程' });

    // 初始状态：EPC 已创建但 steps 为空
    expect(useOntologyStore.getState().project!.epcProcesses![0].steps).toHaveLength(0);

    // AI 生成 3 个步骤
    const aiSteps: EpcStep[] = [
      makeStep('st-1', '创建订单'),
      makeStep('st-2', '审批订单'),
      makeStep('st-3', '发货'),
    ];
    store.applyAiEpcDraft(epc.id, aiSteps);

    // 验证项目中的 EPC 步骤已刷新
    const updatedEpc = useOntologyStore.getState().project!.epcProcesses![0];
    expect(updatedEpc.steps).toHaveLength(3);
    expect(updatedEpc.steps[0].name).toBe('创建订单');
    expect(updatedEpc.steps[1].name).toBe('审批订单');
    expect(updatedEpc.steps[2].name).toBe('发货');

    // verify IDs
    expect(updatedEpc.steps[0].id).toBe('st-1');
    expect(updatedEpc.steps[1].id).toBe('st-2');
    expect(updatedEpc.steps[2].id).toBe('st-3');

    // draft 记录中的 snapshot steps 也保持一致
    const epcDraft = useOntologyStore.getState().project!.moduleVersionRecords!.find(
      (r) => r.moduleKind === 'EPC' && r.status === 'draft',
    )!;
    const draftEpc = epcDraft.snapshot as EpcProcess;
    expect(draftEpc.steps).toEqual(aiSteps);
  });
});

describe('E2E-EPC-FORK-005 @smoke: 多步骤场景 — fork 不丢失步骤顺序', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: createProject(),
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: 'data',
      selectedBusinessChainNode: null,
    });
  });

  it('@smoke 有 confirmed 版本后 AI 生成多步骤，confirmed 步骤不变且顺序保留', () => {
    const store = useOntologyStore.getState();
    const c = store.addScenario(store.addCapability(store.addValueDomain({ name: '生产域' }).id, { name: '计划能力' }).id, { name: 'MTS场景' });
    const epc = store.addEpcProcess(c.id, { name: '主流程' });

    // 手动插入 confirmed v1 含 2 个旧步骤
    const confirmedSteps: EpcStep[] = [makeStep('old-1', '旧步骤1'), makeStep('old-2', '旧步骤2')];
    const confirmedSnapshot: EpcProcess = { ...epc, steps: confirmedSteps };
    useOntologyStore.setState({
      project: {
        ...useOntologyStore.getState().project!,
        moduleVersionRecords: [
          confirmedRecord('EPC', epc.id, 'v1', confirmedSnapshot),
        ],
        epcProcesses: [confirmedSnapshot],
      },
    });

    // AI 生成 3 个新步骤
    const aiSteps: EpcStep[] = [makeStep('new-1', '新步骤1'), makeStep('new-2', '新步骤2'), makeStep('new-3', '新步骤3')];
    store.applyAiEpcDraft(epc.id, aiSteps);

    const records = useOntologyStore.getState().project!.moduleVersionRecords!;

    // confirmed 记录的 steps 不变
    const confirmed = records.find((r) => r.status === 'confirmed')!;
    expect((confirmed.snapshot as EpcProcess).steps).toHaveLength(2);
    expect((confirmed.snapshot as EpcProcess).steps[0].id).toBe('old-1');
    expect((confirmed.snapshot as EpcProcess).steps[1].id).toBe('old-2');

    // draft 记录的 steps 是新的，顺序正确
    const draft = records.find((r) => r.status === 'draft')!;
    expect((draft.snapshot as EpcProcess).steps).toHaveLength(3);
    expect((draft.snapshot as EpcProcess).steps[0].id).toBe('new-1');
    expect((draft.snapshot as EpcProcess).steps[1].id).toBe('new-2');
    expect((draft.snapshot as EpcProcess).steps[2].id).toBe('new-3');

    // 项目 EPC 数据已更新为新 steps
    const updatedEpc = useOntologyStore.getState().project!.epcProcesses![0];
    expect(updatedEpc.steps).toHaveLength(3);
    expect(updatedEpc.steps.map((s) => s.id)).toEqual(['new-1', 'new-2', 'new-3']);
  });
});
