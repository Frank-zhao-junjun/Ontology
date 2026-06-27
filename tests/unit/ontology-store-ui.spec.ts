import { describe, expect, it, beforeEach } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { BusinessChainNodeRef } from '@/store/ontology-store';

const domain = { id: 'dm-1', name: '离散制造', nameEn: 'Discrete Manufacturing', description: '离散制造领域' };

function resetStore() {
  useOntologyStore.setState({
    project: null,
    activeModelType: null,
    selectedBusinessChainNode: null,
  });
}

function createTestProject() {
  const store = useOntologyStore.getState();
  store.createProject('测试项目', domain, '测试描述');
}

describe('ontology-store UI State — setActiveModelType', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should set activeModelType to "data" and read it back', () => {
    useOntologyStore.getState().setActiveModelType('data');
    expect(useOntologyStore.getState().activeModelType).toBe('data');
  });

  it('should set activeModelType to "behavior" and read it back', () => {
    useOntologyStore.getState().setActiveModelType('behavior');
    expect(useOntologyStore.getState().activeModelType).toBe('behavior');
  });

  it('should set activeModelType to "rule" and read it back', () => {
    useOntologyStore.getState().setActiveModelType('rule');
    expect(useOntologyStore.getState().activeModelType).toBe('rule');
  });

  it('should set activeModelType to "process" and read it back', () => {
    useOntologyStore.getState().setActiveModelType('process');
    expect(useOntologyStore.getState().activeModelType).toBe('process');
  });

  it('should set activeModelType to "event" and read it back', () => {
    useOntologyStore.getState().setActiveModelType('event');
    expect(useOntologyStore.getState().activeModelType).toBe('event');
  });

  it('should set activeModelType to null and read it back (edge case)', () => {
    // First set to a non-null value, then to null
    useOntologyStore.getState().setActiveModelType('data');
    expect(useOntologyStore.getState().activeModelType).toBe('data');

    useOntologyStore.getState().setActiveModelType(null);
    expect(useOntologyStore.getState().activeModelType).toBeNull();
  });

  it('should start with activeModelType as null (default value)', () => {
    expect(useOntologyStore.getState().activeModelType).toBeNull();
  });

  it('should switch between model types sequentially', () => {
    useOntologyStore.getState().setActiveModelType('data');
    expect(useOntologyStore.getState().activeModelType).toBe('data');

    useOntologyStore.getState().setActiveModelType('behavior');
    expect(useOntologyStore.getState().activeModelType).toBe('behavior');

    useOntologyStore.getState().setActiveModelType('rule');
    expect(useOntologyStore.getState().activeModelType).toBe('rule');

    useOntologyStore.getState().setActiveModelType('process');
    expect(useOntologyStore.getState().activeModelType).toBe('process');

    useOntologyStore.getState().setActiveModelType('event');
    expect(useOntologyStore.getState().activeModelType).toBe('event');

    useOntologyStore.getState().setActiveModelType(null);
    expect(useOntologyStore.getState().activeModelType).toBeNull();
  });
});

describe('ontology-store UI State — setSelectedBusinessChainNode', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should set selectedBusinessChainNode to a valid ref and read it back', () => {
    const node: BusinessChainNodeRef = { kind: 'A', id: 'vd-1' };
    useOntologyStore.getState().setSelectedBusinessChainNode(node);
    const result = useOntologyStore.getState().selectedBusinessChainNode;
    expect(result).toEqual({ kind: 'A', id: 'vd-1' });
  });

  it('should set selectedBusinessChainNode to a capability ref', () => {
    const node: BusinessChainNodeRef = { kind: 'B', id: 'cap-1' };
    useOntologyStore.getState().setSelectedBusinessChainNode(node);
    const result = useOntologyStore.getState().selectedBusinessChainNode;
    expect(result).toEqual({ kind: 'B', id: 'cap-1' });
  });

  it('should set selectedBusinessChainNode to a scenario ref', () => {
    const node: BusinessChainNodeRef = { kind: 'C', id: 'sc-1' };
    useOntologyStore.getState().setSelectedBusinessChainNode(node);
    const result = useOntologyStore.getState().selectedBusinessChainNode;
    expect(result).toEqual({ kind: 'C', id: 'sc-1' });
  });

  it('should set selectedBusinessChainNode to an EPC ref', () => {
    const node: BusinessChainNodeRef = { kind: 'EPC', id: 'epc-1' };
    useOntologyStore.getState().setSelectedBusinessChainNode(node);
    const result = useOntologyStore.getState().selectedBusinessChainNode;
    expect(result).toEqual({ kind: 'EPC', id: 'epc-1' });
  });

  it('should set selectedBusinessChainNode to null (edge case)', () => {
    // First set a value, then clear it
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'A', id: 'vd-1' });
    expect(useOntologyStore.getState().selectedBusinessChainNode).not.toBeNull();

    useOntologyStore.getState().setSelectedBusinessChainNode(null);
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });

  it('should start with selectedBusinessChainNode as null (default value)', () => {
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });

  it('should replace an existing selection with a new one', () => {
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'A', id: 'vd-1' });
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'B', id: 'cap-2' });
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'B', id: 'cap-2' });
  });
});

describe('ontology-store UI State — resetProject', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should clear project, activeModelType, and selectedBusinessChainNode when project is active', () => {
    createTestProject();

    // Set additional UI state
    useOntologyStore.getState().setActiveModelType('behavior');
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'A', id: 'vd-1' });

    // Verify UI state is set
    expect(useOntologyStore.getState().project).not.toBeNull();
    expect(useOntologyStore.getState().activeModelType).toBe('behavior');
    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'A', id: 'vd-1' });

    // Reset
    useOntologyStore.getState().resetProject();

    // Verify all are cleared
    expect(useOntologyStore.getState().project).toBeNull();
    expect(useOntologyStore.getState().activeModelType).toBeNull();
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });

  it('should not throw when resetProject is called with no project active', () => {
    expect(() => useOntologyStore.getState().resetProject()).not.toThrow();
    expect(useOntologyStore.getState().project).toBeNull();
    expect(useOntologyStore.getState().activeModelType).toBeNull();
    expect(useOntologyStore.getState().selectedBusinessChainNode).toBeNull();
  });
});

describe('ontology-store UI State — clearAllModels', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should clear all models and set activeModelType to null when a project exists', () => {
    createTestProject();

    // Set UI state to a model type
    useOntologyStore.getState().setActiveModelType('behavior');

    // Call clearAllModels
    useOntologyStore.getState().clearAllModels();

    const state = useOntologyStore.getState();
    // activeModelType should be reset to null
    expect(state.activeModelType).toBeNull();
    // Project should still exist
    expect(state.project).not.toBeNull();
    // Models inside project should be cleared
    expect(state.project!.behaviorModel).toBeNull();
    expect(state.project!.ruleModel).toBeNull();
    expect(state.project!.processModel).toBeNull();
    expect(state.project!.eventModel).toBeNull();
    expect(state.project!.epcModel).toBeNull();
    expect(state.project!.organizationModel).toBeNull();
    expect(state.project!.agentSemanticLayer).toBeNull();
  });

  it('should do nothing (return state) when clearAllModels is called with no project', () => {
    expect(() => useOntologyStore.getState().clearAllModels()).not.toThrow();
    // activeModelType should remain null since no project existed to trigger the set
    expect(useOntologyStore.getState().project).toBeNull();
  });

  it('should preserve the project object after clearAllModels', () => {
    createTestProject();
    const projectId = useOntologyStore.getState().project!.id;

    useOntologyStore.getState().clearAllModels();

    const project = useOntologyStore.getState().project;
    expect(project).not.toBeNull();
    expect(project!.id).toBe(projectId);
    expect(project!.name).toBe('测试项目');
  });
});

describe('ontology-store UI State — combined and consistency', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should independently manage activeModelType and selectedBusinessChainNode', () => {
    useOntologyStore.getState().setActiveModelType('data');
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'EPC', id: 'epc-1' });

    const state = useOntologyStore.getState();
    expect(state.activeModelType).toBe('data');
    expect(state.selectedBusinessChainNode).toEqual({ kind: 'EPC', id: 'epc-1' });
  });

  it('should preserve selectedBusinessChainNode when only activeModelType changes', () => {
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'A', id: 'vd-42' });
    useOntologyStore.getState().setActiveModelType('rule');
    useOntologyStore.getState().setActiveModelType('event');

    expect(useOntologyStore.getState().selectedBusinessChainNode).toEqual({ kind: 'A', id: 'vd-42' });
  });

  it('should preserve activeModelType when only selectedBusinessChainNode changes', () => {
    useOntologyStore.getState().setActiveModelType('process');
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'B', id: 'cap-99' });
    useOntologyStore.getState().setSelectedBusinessChainNode({ kind: 'C', id: 'sc-77' });

    expect(useOntologyStore.getState().activeModelType).toBe('process');
  });
});
