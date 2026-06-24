import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain, MetaElement } from '@/types/ontology';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

function seedExistingElements(): MetaElement[] {
  return [
    { id: 'el-1', name: '用户管理', dimension: 'E1', visibility: 'project' },
    { id: 'el-2', name: '订单审核', dimension: 'E2', visibility: 'project' },
    { id: 'el-3', name: '库存查询', dimension: 'E4', visibility: 'project' },
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('US-S19-Task2: applyAiElementDrafts', () => {
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
    useOntologyStore.getState().createProject('AI 要素测试', domain);

    // 注入已有要素
    const project = useOntologyStore.getState().project!;
    useOntologyStore.setState({
      project: {
        ...project,
        metaElements: seedExistingElements(),
      },
    });
  });

  // ---------- 场景 1：插入成功 ----------
  it('应成功插入不重复的要素', () => {
    const result = useOntologyStore.getState().applyAiElementDrafts([
      { name: '数据导出', dimension: 'E1' },
      { name: '权限校验', dimension: 'E2' },
    ]);

    expect(result.inserted).toBe(2);
    expect(result.skipped).toEqual([]);

    const project = useOntologyStore.getState().project!;
    expect(project.metaElements).toHaveLength(5);
    // 新要素应包含 id / visibility / status / createdAt / updatedAt
    const newEl1 = project.metaElements.find((m) => m.name === '数据导出')!;
    expect(newEl1).toBeDefined();
    expect(newEl1.id).toBeTruthy();
    expect(newEl1.dimension).toBe('E1');
    expect(newEl1.visibility).toBe('project');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((newEl1 as any).status).toBe('draft');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((newEl1 as any).createdAt).toBe('2026-06-24T12:00:00.000Z');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((newEl1 as any).updatedAt).toBe('2026-06-24T12:00:00.000Z');

    const newEl2 = project.metaElements.find((m) => m.name === '权限校验')!;
    expect(newEl2).toBeDefined();
    expect(newEl2.id).toBeTruthy();
    expect(newEl2.visibility).toBe('project');
  });

  // ---------- 场景 2：重复跳过 ----------
  it('应跳过已存在的要素（dimension + name 全等）', () => {
    const result = useOntologyStore.getState().applyAiElementDrafts([
      { name: '用户管理', dimension: 'E1' },  // 已存在
      { name: '新要素', dimension: 'E3' },
      { name: '订单审核', dimension: 'E2' },  // 已存在
    ]);

    expect(result.inserted).toBe(1);
    expect(result.skipped).toEqual([
      { name: '用户管理', dimension: 'E1' },
      { name: '订单审核', dimension: 'E2' },
    ]);

    const project = useOntologyStore.getState().project!;
    // 原有 3 个 + 新 1 个 = 4 个
    expect(project.metaElements).toHaveLength(4);
    // 原有的要素应未被修改
    expect(project.metaElements.find((m) => m.id === 'el-1')?.name).toBe('用户管理');
    expect(project.metaElements.find((m) => m.id === 'el-2')?.name).toBe('订单审核');
  });

  // ---------- 场景 3：已有要素不修改、不删除 ----------
  it('不应修改或删除任何已有要素（纯 insert）', () => {
    // 先记录原始快照
    const before = useOntologyStore.getState().project!.metaElements;
    const beforeJson = JSON.stringify(before);

    useOntologyStore.getState().applyAiElementDrafts([
      { name: '全新要素 A', dimension: 'E5' },
      { name: '全新要素 B', dimension: 'E6' },
    ]);

    const after = useOntologyStore.getState().project!.metaElements;
    // 原有 3 个要素的 id / name / dimension 应完全不变
    for (const orig of seedExistingElements()) {
      const found = after.find((m) => m.id === orig.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe(orig.name);
      expect(found!.dimension).toBe(orig.dimension);
    }
    // 总数量 = 3 + 2
    expect(after).toHaveLength(5);
  });

  // ---------- 场景 4：返回值正确 ----------
  it('应返回正确的 inserted 和 skipped 值', () => {
    // 全重复
    const r1 = useOntologyStore.getState().applyAiElementDrafts([
      { name: '用户管理', dimension: 'E1' },
    ]);
    expect(r1.inserted).toBe(0);
    expect(r1.skipped).toHaveLength(1);
    expect(r1.skipped[0]).toEqual({ name: '用户管理', dimension: 'E1' });

    // 全为新
    const r2 = useOntologyStore.getState().applyAiElementDrafts([
      { name: 'A', dimension: 'E1' },
      { name: 'B', dimension: 'E2' },
      { name: 'C', dimension: 'E3' },
    ]);
    expect(r2.inserted).toBe(3);
    expect(r2.skipped).toEqual([]);

    // 混合：重复 + 新 + 重复
    const r3 = useOntologyStore.getState().applyAiElementDrafts([
      { name: 'A', dimension: 'E1' },      // 已存在（上一步刚插入）
      { name: 'D', dimension: 'E4' },
      { name: '订单审核', dimension: 'E2' }, // 已存在（原始）
    ]);
    expect(r3.inserted).toBe(1);
    expect(r3.skipped).toHaveLength(2);
    expect(r3.skipped[0]).toEqual({ name: 'A', dimension: 'E1' });
    expect(r3.skipped[1]).toEqual({ name: '订单审核', dimension: 'E2' });
  });

  // ---------- 场景 5：索引重建 ----------
  it('调用后应触发 rebuildUsageIndex（usageRefs 被更新）', () => {
    // 注入一个 EPC 流程引用某个已存在的要素，以便索引重建产生内容
    const project = useOntologyStore.getState().project!;
    const scenarioId = 's-1';

    // 先注入一个 EPC
    useOntologyStore.setState({
      project: {
        ...project,
        scenarios: [
          { id: scenarioId, name: '测试场景', parentId: 'b-1' },
        ],
        epcProcesses: [
          {
            id: 'epc-1',
            name: '测试流程',
            parentId: scenarioId,
            steps: [
              {
                id: 'step-1',
                name: '步骤1',
                elementRef: {
                  dimension: 'E1',
                  elementId: 'el-1',  // 引用已有要素
                  versionPin: 'latest_confirmed',
                },
              },
            ],
          },
        ],
      },
    });

    // 插入新要素
    const result = useOntologyStore.getState().applyAiElementDrafts([
      { name: '新要素', dimension: 'E1' },
    ]);
    expect(result.inserted).toBe(1);

    const updated = useOntologyStore.getState().project!;
    // 已有的 '用户管理' 要素应有 usageRefs（索引重建后）
    const el1 = updated.metaElements!.find((m) => m.id === 'el-1')!;
    expect(el1.usageRefs).toBeDefined();
    expect(el1.usageRefs!.length).toBeGreaterThanOrEqual(1);
    expect(el1.usageRefs![0].epcId).toBe('epc-1');
    expect(el1.usageRefs![0].stepId).toBe('step-1');

    // 新插入的要素应也有 usageRefs 字段（空数组）
    const newEl = updated.metaElements!.find((m) => m.name === '新要素')!;
    expect(newEl.usageRefs).toBeDefined();
    expect(newEl.usageRefs).toEqual([]);
  });

  // ---------- 场景 6：空列表 ----------
  it('空输入列表不应新增任何要素', () => {
    const result = useOntologyStore.getState().applyAiElementDrafts([]);
    expect(result.inserted).toBe(0);
    expect(result.skipped).toEqual([]);

    const project = useOntologyStore.getState().project!;
    expect(project.metaElements).toHaveLength(3); // 保持不变
  });

  // ---------- 场景 7：无项目时抛错 ----------
  it('无活动项目时应抛出错误', () => {
    useOntologyStore.setState({ project: null });
    expect(() => {
      useOntologyStore.getState().applyAiElementDrafts([
        { name: '测试', dimension: 'E1' },
      ]);
    }).toThrow('没有活动项目');
  });
});
