import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
const domain = { id: 'd1', name: '测试域', nameEn: 'Test', description: '' };

function resetStore() {
  useOntologyStore.setState({
    project: null,
    activeModelType: null,
    selectedBusinessChainNode: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
  });
}

/** Create a single value domain and return its ID. */
function addIsolatedValueDomain(): string {
  const store = useOntologyStore.getState();
  const vd = store.addValueDomain({ name: '单值域' });
  return vd.id;
}

/** Create a full A-B-C-EPC chain and return all four node IDs. */
function addFullChain() {
  const store = useOntologyStore.getState();
  const a = store.addValueDomain({ name: '生产域' });
  const b = store.addCapability(a.id, { name: '计划能力' });
  const c = store.addScenario(b.id, { name: '排产场景' });
  const epc = store.addEpcProcess(c.id, { name: '主流程' });
  return { a: a.id, b: b.id, c: c.id, epc: epc.id };
}


// -------------------------------
// createProject UI side effects
// -------------------------------
describe('ontology-store UI State — createProject side effects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    resetStore();
  });

  it('should set activeModelType to "data" after creating a project', () => {
    expect(useOntologyStore.getState().activeModelType).toBeNull();
    useOntologyStore.getState().createProject('测试', domain);
    expect(useOntologyStore.getState().activeModelType).toBe('data');
  });

  it('should leave selectedBusinessChainNode as null after creating a project', () => {
    useOntologyStore.getState().createProject('测试', domain);
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });
});

// -------------------------------
// exportProject
// -------------------------------
describe('ontology-store UI State — exportProject', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    resetStore();
  });

  it('should return valid JSON string when a project exists', () => {
    useOntologyStore.getState().createProject('导出测试', domain, '描述');
    const json = useOntologyStore.getState().exportProject();
    const parsed = JSON.parse(json);
    expect(parsed).not.toBeNull();
    expect(parsed.name).toBe('导出测试');
    expect(parsed.description).toBe('描述');
    expect(parsed.domain.id).toBe('d1');
  });

  it('should return "null" when project is null', () => {
    const json = useOntologyStore.getState().exportProject();
    expect(json).toBe('null');
  });
});

// -------------------------------
// importProject
// -------------------------------
describe('ontology-store UI State — importProject', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    resetStore();
  });

  it('should set activeModelType to "data" after successfully importing a project', () => {
    useOntologyStore.getState().createProject('导入测试', domain);
    const exported = useOntologyStore.getState().exportProject();
    resetStore();
    expect(useOntologyStore.getState().activeModelType).toBeNull();
    useOntologyStore.getState().importProject(exported);
    expect(useOntologyStore.getState().activeModelType).toBe('data');
  });

  it('should restore project from a valid JSON string', () => {
    useOntologyStore.getState().createProject('原项目', domain, '原始描述');
    const exported = useOntologyStore.getState().exportProject();
    resetStore();
    useOntologyStore.getState().importProject(exported);
    const project = useOntologyStore.getState().project;
    expect(project).not.toBeNull();
    expect(project!.name).toBe('原项目');
    expect(project!.description).toBe('原始描述');
  });

  it('should gracefully handle invalid JSON without crashing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      useOntologyStore.getState().importProject('这不是有效的 JSON {{{');
    }).not.toThrow();
    expect(useOntologyStore.getState().project).toBeNull();
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });
});

// -------------------------------
// selectedBusinessChainNode deletion clearing
// -------------------------------
describe('ontology-store UI State — business chain node deletion clears selection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    resetStore();
    useOntologyStore.getState().createProject('链删除测试', domain);
  });

  it('should clear selectedBusinessChainNode when deleting the selected value domain', () => {
    const id = addIsolatedValueDomain();
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'A', id });
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'A', id });
    useOntologyStore.getState().deleteValueDomain(id);
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });

  it('should preserve selectedBusinessChainNode when deleting a different value domain', () => {
    const keep = addIsolatedValueDomain();
    const vd2 = useOntologyStore.getState().addValueDomain({ name: '另一值域' });
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'A', id: keep });
    useOntologyStore.getState().deleteValueDomain(vd2.id);
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'A', id: keep });
  });

  it('should clear selectedBusinessChainNode when deleting the selected capability', () => {
    const a = useOntologyStore.getState().addValueDomain({ name: '值域' });
    const b = useOntologyStore.getState().addCapability(a.id, { name: '能力' });
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'B', id: b.id });
    useOntologyStore.getState().deleteCapability(b.id);
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });

  it('should clear selectedBusinessChainNode when deleting the selected scenario', () => {
    const a = useOntologyStore.getState().addValueDomain({ name: '值域' });
    const b = useOntologyStore.getState().addCapability(a.id, { name: '能力' });
    const c = useOntologyStore.getState().addScenario(b.id, { name: '场景' });
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'C', id: c.id });
    useOntologyStore.getState().deleteScenario(c.id);
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });

  it('should clear selectedBusinessChainNode when deleting the selected EPC process', () => {
    const { epc } = addFullChain();
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'EPC', id: epc });
    useOntologyStore.getState().deleteEpcProcess(epc);
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });

  it('should preserve selected EPC when deleting a different EPC process', () => {
    const { epc: epc1 } = addFullChain();
    const epc2 = useOntologyStore.getState().addEpcProcess(
      useOntologyStore.getState().project!.scenarios![0].id,
      { name: '备选流程' },
    );
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'EPC', id: epc1 });
    useOntologyStore.getState().deleteEpcProcess(epc2.id);
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'EPC', id: epc1 });
  });

  it('should throw and preserve selection when deleting a parent value domain that has children', () => {
    const a = useOntologyStore.getState().addValueDomain({ name: '父值域' });
    useOntologyStore.getState().addCapability(a.id, { name: '子能力' });
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'A', id: a.id });
    expect(() => useOntologyStore.getState().deleteValueDomain(a.id)).toThrow('存在子节点');
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'A', id: a.id });
  });
});
