import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import {
  getLatestConfirmed,
  getModuleDraft,
} from '@/lib/module-version';
import type {
  Domain,
  EpcStep,
  EpcProcess,
  ModuleVersionRecord,
} from '@/types/ontology';

// ---------------------------------------------------------------------------
// 工厂 helpers
// ---------------------------------------------------------------------------

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

function makeSteps(prefix: string, count = 2): EpcStep[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `step-${prefix}-${i}`,
    name: `${prefix} Step ${i + 1}`,
  }));
}

function addEpcToStore(scenarioId: string): EpcProcess {
  const store = useOntologyStore.getState();
  return store.addEpcProcess(scenarioId, { name: '测试 EPC' });
}

function addScenario(): string {
  const store = useOntologyStore.getState();
  const a = store.addValueDomain({ name: '生产域' });
  const b = store.addCapability(a.id, { name: '生产管理' });
  const c = store.addScenario(b.id, { name: '生产场景' });
  return c.id;
}

// ---------------------------------------------------------------------------
// 伪造一个 confirmed 版本的 moduleVersionRecord 并写回 store
// ---------------------------------------------------------------------------

function injectConfirmedRecord(
  epcId: string,
  snapshot: EpcProcess,
  version = 'v1',
): ModuleVersionRecord {
  const now = new Date().toISOString();
  const record: ModuleVersionRecord = {
    id: `mvr-confirmed-${epcId}`,
    moduleKind: 'EPC',
    moduleId: epcId,
    status: 'confirmed',
    version,
    confirmedAt: now,
    createdAt: now,
    snapshot: { ...snapshot },
  };
  const project = useOntologyStore.getState().project!;
  useOntologyStore.setState({
    project: {
      ...project,
      moduleVersionRecords: [
        ...(project.moduleVersionRecords ?? []),
        record,
      ],
    },
  });
  return record;
}

function injectDraftRecord(
  epcId: string,
  snapshot: EpcProcess,
): ModuleVersionRecord {
  const now = new Date().toISOString();
  const record: ModuleVersionRecord = {
    id: `mvr-draft-${epcId}`,
    moduleKind: 'EPC',
    moduleId: epcId,
    status: 'draft',
    createdAt: now,
    snapshot: { ...snapshot },
  };
  const project = useOntologyStore.getState().project!;
  useOntologyStore.setState({
    project: {
      ...project,
      moduleVersionRecords: [
        ...(project.moduleVersionRecords ?? []),
        record,
      ],
    },
  });
  return record;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('US-S11b-Task2: applyAiEpcDraft', () => {
  let scenarioId: string;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));

    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('AI EPC 测试', domain);

    scenarioId = addScenario();
  });

  // ---------- 场景 1：有 confirmed 版本 → fork 出新 draft ----------
  it('应 fork confirmed 快照并覆盖 steps（规则 1）', () => {
    const epc = addEpcToStore(scenarioId);
    injectConfirmedRecord(epc.id, { ...epc, steps: makeSteps('confirmed') });

    const aiSteps = makeSteps('ai');
    useOntologyStore.getState().applyAiEpcDraft(epc.id, aiSteps);

    const project = useOntologyStore.getState().project!;
    const updatedEpc = project.epcProcesses!.find((e) => e.id === epc.id)!;
    expect(updatedEpc.steps).toEqual(aiSteps);
    expect(updatedEpc.steps[0].name).toBe('ai Step 1');

    // 应该有一个 draft 版本
    const draft = getModuleDraft(project.moduleVersionRecords ?? [], 'EPC', epc.id);
    expect(draft).toBeTruthy();
    expect(draft!.status).toBe('draft');

    // confirmed 版本仍存在（不可变）
    const confirmed = getLatestConfirmed(
      project.moduleVersionRecords ?? [],
      'EPC',
      epc.id,
    );
    expect(confirmed).toBeTruthy();
    expect(confirmed!.version).toBe('v1');
  });

  // ---------- 场景 2：无 confirmed 但有 draft → 全量覆盖 ----------
  it('应全量覆盖已有 draft 的 steps（规则 2）', () => {
    const epc = addEpcToStore(scenarioId);
    injectDraftRecord(epc.id, { ...epc, steps: makeSteps('old-draft') });
    // 确认没有 confirmed
    expect(
      getLatestConfirmed(
        useOntologyStore.getState().project!.moduleVersionRecords ?? [],
        'EPC',
        epc.id,
      ),
    ).toBeUndefined();

    const newSteps = makeSteps('new-ai');
    useOntologyStore.getState().applyAiEpcDraft(epc.id, newSteps);

    const project = useOntologyStore.getState().project!;
    const updatedEpc = project.epcProcesses!.find((e) => e.id === epc.id)!;
    expect(updatedEpc.steps).toEqual(newSteps);
    expect(updatedEpc.steps[0].name).toBe('new-ai Step 1');

    // draft 记录仍然存在（内容已被覆盖）
    const draft = getModuleDraft(project.moduleVersionRecords ?? [], 'EPC', epc.id);
    expect(draft).toBeTruthy();
    const snap = draft!.snapshot as EpcProcess;
    expect(snap.steps).toEqual(newSteps);

    // 确认没有 confirmed 被意外创建
    expect(
      getLatestConfirmed(
        project.moduleVersionRecords ?? [],
        'EPC',
        epc.id,
      ),
    ).toBeUndefined();
  });

  // ---------- 场景 3：无任何版本 → 创建新 draft ----------
  it('应创建新 draft（规则 3）', () => {
    const epc = addEpcToStore(scenarioId);
    // 确认没有 confirmed 版本记录
    const recordsBefore = useOntologyStore.getState().project!.moduleVersionRecords ?? [];
    expect(
      recordsBefore.filter(
        (r) => r.moduleKind === 'EPC' && r.moduleId === epc.id && r.status === 'confirmed',
      ),
    ).toHaveLength(0);

    const aiSteps = makeSteps('fresh');
    useOntologyStore.getState().applyAiEpcDraft(epc.id, aiSteps);

    const project = useOntologyStore.getState().project!;
    const updatedEpc = project.epcProcesses!.find((e) => e.id === epc.id)!;
    expect(updatedEpc.steps).toEqual(aiSteps);

    // 应该有 draft 版本
    const draft = getModuleDraft(project.moduleVersionRecords ?? [], 'EPC', epc.id);
    expect(draft).toBeTruthy();
    expect(draft!.status).toBe('draft');

    // 但绝无 confirmed
    expect(
      getLatestConfirmed(project.moduleVersionRecords ?? [], 'EPC', epc.id),
    ).toBeUndefined();
  });

  // ---------- 场景 4：不触发 confirm ----------
  it('不应触发 confirm（所有版本始终保持 draft）', () => {
    const epc = addEpcToStore(scenarioId);
    injectDraftRecord(epc.id, { ...epc, steps: makeSteps('pre') });

    // 调用两次
    useOntologyStore.getState().applyAiEpcDraft(epc.id, makeSteps('v1'));
    useOntologyStore.getState().applyAiEpcDraft(epc.id, makeSteps('v2'));

    const project = useOntologyStore.getState().project!;
    const records = project.moduleVersionRecords ?? [];
    const epcRecords = records.filter(
      (r) => r.moduleKind === 'EPC' && r.moduleId === epc.id,
    );
    // 不应有 confirmed 状态的记录
    for (const r of epcRecords) {
      expect(r.status).not.toBe('confirmed');
    }
    // 所有记录都是 draft
    expect(epcRecords.every((r) => r.status === 'draft')).toBe(true);
  });

  // ---------- 场景 5：索引重建 ----------
  it('应调用 rebuildUsageIndex 更新 metaElements', () => {
    // 先准备一个有 elementRef 的 step，确保索引重建能起作用
    const epc = addEpcToStore(scenarioId);
    const project = useOntologyStore.getState().project!;

    // 注入一个 metaElement 让它能被索引
    useOntologyStore.setState({
      project: {
        ...project,
        metaElements: [
          {
            id: 'elem-1',
            name: '测试要素',
            nameEn: 'TestElement',
            dimension: 'E1',
          },
        ],
      },
    });

    const stepsWithRef: EpcStep[] = [
      {
        id: 'step-ref-1',
        name: '有引用的步骤',
        elementRef: {
          dimension: 'E1',
          elementId: 'elem-1',
          versionPin: 'latest_confirmed',
        },
      },
    ];

    useOntologyStore.getState().applyAiEpcDraft(epc.id, stepsWithRef);

    const updatedProject = useOntologyStore.getState().project!;
    const meta = updatedProject.metaElements?.find((m) => m.id === 'elem-1');
    expect(meta).toBeTruthy();
    // usageRefs 应该已被索引重建填充
    expect(meta!.usageRefs).toBeDefined();
    expect(meta!.usageRefs!.length).toBeGreaterThanOrEqual(1);
    expect(meta!.usageRefs![0].epcId).toBe(epc.id);
    expect(meta!.usageRefs![0].stepId).toBe('step-ref-1');
  });

  // ---------- 场景 6：EPC 不存在时抛出错误 ----------
  it('EPC 不存在时应抛出错误', () => {
    expect(() => {
      useOntologyStore.getState().applyAiEpcDraft('non-existent', []);
    }).toThrow('EPC 流程不存在');
  });
});
