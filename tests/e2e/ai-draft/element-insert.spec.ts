import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { MetaDimension, MetaElement, OntologyProject } from '@/types/ontology';

// ── mocks (same pattern as fork-rules.epc.spec.ts) ─────────────────────────

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

// ── helpers ─────────────────────────────────────────────────────────────────

const now = '2026-06-24T12:00:00.000Z';

function createProject(): OntologyProject {
  return {
    id: 'proj-element-insert',
    name: '要素插入 E2E',
    description: '',
    domain: {
      id: 'domain-1',
      name: '离散制造',
      nameEn: 'Mfg',
      description: '',
      icon: 'factory',
      color: '#3b82f6',
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
    moduleVersionRecords: [],
    createdAt: now,
    updatedAt: now,
  };
}

const DIM_E1: MetaDimension = 'E1';
const DIM_E2: MetaDimension = 'E2';

/** Build a single existing meta element (as if already in the project). */
function existingElement(
  id: string,
  name: string,
  dimension: MetaDimension,
  overrides?: Partial<MetaElement>,
): MetaElement {
  return {
    id,
    name,
    dimension,
    visibility: 'project',
    ...overrides,
  };
}

// ── test suite ──────────────────────────────────────────────────────────────

describe('US-S19-Task4: applyAiElementDrafts insert + 去重 E2E', () => {
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

  it('TC1 @smoke 上传文档 → AI 生成 → 要素库显示新要素', () => {
    const store = useOntologyStore.getState();

    // 模拟 AI 解析文档后生成的要素列表
    const aiElements = [
      { name: '订单', dimension: DIM_E1, nameEn: 'Order' },
      { name: '客户', dimension: DIM_E1, nameEn: 'Customer' },
      { name: '审批中', dimension: DIM_E2, nameEn: 'Approving' },
    ];

    const result = store.applyAiElementDrafts(aiElements);

    // 返回值
    expect(result.inserted).toBe(3);
    expect(result.skipped).toHaveLength(0);

    // 要素库（metaElements）包含新插入的 3 个要素
    const metaElements = useOntologyStore.getState().project!.metaElements!;
    expect(metaElements).toHaveLength(3);

    // 验证名称正确
    const names = metaElements.map((el) => el.name);
    expect(names).toContain('订单');
    expect(names).toContain('客户');
    expect(names).toContain('审批中');

    // E1 要素有 nameEn
    const order = metaElements.find((el) => el.name === '订单')!;
    expect(order.nameEn).toBe('Order');
    expect(order.dimension).toBe(DIM_E1);

    // E2 要素
    const approving = metaElements.find((el) => el.name === '审批中')!;
    expect(approving.dimension).toBe(DIM_E2);
  });

  it('TC2 @smoke 已有要素不受影响', () => {
    const store = useOntologyStore.getState();

    // 先手动插入已有的要素
    const existing: MetaElement[] = [
      existingElement('el-1', '物料', DIM_E1),
      existingElement('el-2', '供应商', DIM_E1),
    ];
    useOntologyStore.setState({
      project: {
        ...useOntologyStore.getState().project!,
        metaElements: existing,
      },
    });

    // 模拟 AI 生成新要素
    const aiElements = [
      { name: '订单', dimension: DIM_E1 },
      { name: '客户', dimension: DIM_E1 },
    ];

    const result = store.applyAiElementDrafts(aiElements);

    // 返回值
    expect(result.inserted).toBe(2);
    expect(result.skipped).toHaveLength(0);

    // 已有要素仍然存在
    const metaElements = useOntologyStore.getState().project!.metaElements!;
    expect(metaElements).toHaveLength(4);

    const existingNames = metaElements.map((el) => el.name);
    expect(existingNames).toContain('物料');
    expect(existingNames).toContain('供应商');
    expect(existingNames).toContain('订单');
    expect(existingNames).toContain('客户');

    // 已有要素的 id 不变
    const material = metaElements.find((el) => el.id === 'el-1');
    expect(material).toBeDefined();
    expect(material!.name).toBe('物料');

    const supplier = metaElements.find((el) => el.id === 'el-2');
    expect(supplier).toBeDefined();
    expect(supplier!.name).toBe('供应商');
  });

  it('TC3 @smoke 重复插入 draft 合并更新（二次上传同一文档）', () => {
    const store = useOntologyStore.getState();

    // 第一次上传
    const firstBatch = [
      { name: '订单', dimension: DIM_E1 },
      { name: '客户', dimension: DIM_E1 },
      { name: '审批中', dimension: DIM_E2 },
    ];
    const firstResult = store.applyAiElementDrafts(firstBatch);
    expect(firstResult.inserted).toBe(3);
    expect(firstResult.skipped).toHaveLength(0);
    expect(useOntologyStore.getState().project!.metaElements!).toHaveLength(3);

    // 第二次上传完全相同的内容 — C1'：draft 同名更新，不 skip
    const secondBatch = [
      { name: '订单', dimension: DIM_E1 },
      { name: '客户', dimension: DIM_E1 },
      { name: '审批中', dimension: DIM_E2 },
    ];
    const secondResult = store.applyAiElementDrafts(secondBatch);

    expect(secondResult.inserted).toBe(0);
    expect(secondResult.updated).toBe(3);
    expect(secondResult.skipped).toHaveLength(0);

    // 要素总数不变
    expect(useOntologyStore.getState().project!.metaElements!).toHaveLength(3);

    // 部分重复：1 个新要素 + 2 个 draft 更新
    const thirdBatch = [
      { name: '订单', dimension: DIM_E1 },          // draft 更新
      { name: '生产订单', dimension: DIM_E1 },       // 新
      { name: '审批中', dimension: DIM_E2 },         // draft 更新
    ];
    const thirdResult = store.applyAiElementDrafts(thirdBatch);

    expect(thirdResult.inserted).toBe(1);
    expect(thirdResult.updated).toBe(2);
    expect(thirdResult.skipped).toHaveLength(0);

    // 要素总数 +1
    expect(useOntologyStore.getState().project!.metaElements!).toHaveLength(4);
    const allNames = useOntologyStore.getState().project!.metaElements!.map((el) => el.name);
    expect(allNames).toContain('生产订单');
  });

  it('TC4 @smoke 新要素均为 draft', () => {
    const store = useOntologyStore.getState();

    const aiElements = [
      { name: '订单', dimension: DIM_E1 },
      { name: '客户', dimension: DIM_E1, description: '购买产品的客户' },
      { name: '审批中', dimension: DIM_E2, nameEn: 'Approving' },
    ];

    store.applyAiElementDrafts(aiElements);

    const metaElements = useOntologyStore.getState().project!.metaElements!;
    expect(metaElements).toHaveLength(3);

    for (const el of metaElements) {
      // 所有新要素都是 draft
      expect((el as MetaElement & { status?: string }).status).toBe('draft');
      // 所有新要素默认 visibility project
      expect(el.visibility).toBe('project');
    }

    // 验证 description 透传
    const customer = metaElements.find((el) => el.name === '客户')!;
    expect((customer as MetaElement & { description?: string }).description).toBe('购买产品的客户');

    // 验证 nameEn 透传
    const approving = metaElements.find((el) => el.name === '审批中')!;
    expect(approving.nameEn).toBe('Approving');

    // 所有要素都有 id
    for (const el of metaElements) {
      expect(el.id).toBeDefined();
      expect(el.id).not.toBe('');
    }
  });
});
