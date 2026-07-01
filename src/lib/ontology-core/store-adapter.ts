/**
 * @ontology/core — Store adapter for business-chain CRUD
 *
 * Wraps pure functions from @/lib/business-chain/business-chain with zustand
 * set/get. Keeps the store body thin: each store method delegates to the
 * adapter, which handles both state mutation and selected-node side effects.
 */

import {
  addValueDomain as addValueDomainPure,
  updateValueDomain as updateValueDomainPure,
  deleteValueDomain as deleteValueDomainPure,
  addCapability as addCapabilityPure,
  updateCapability as updateCapabilityPure,
  deleteCapability as deleteCapabilityPure,
  addScenario as addScenarioPure,
  updateScenario as updateScenarioPure,
  deleteScenario as deleteScenarioPure,
  addEpcProcess as addEpcProcessPure,
  updateEpcProcess as updateEpcProcessPure,
  deleteEpcProcess as deleteEpcProcessPure,
  type BusinessChainNodeInput,
} from '@/lib/business-chain/business-chain';
import type { BusinessChainNodeKind } from '@/lib/business-chain/tree';
import type {
  OntologyProject,
  ValueDomain,
  Capability,
  Scenario,
  EpcProcess,
} from '@/types/ontology';

export type { BusinessChainNodeInput };

export interface StoreAdapter {
  addValueDomain: (input: BusinessChainNodeInput) => ValueDomain;
  updateValueDomain: (id: string, updates: Partial<BusinessChainNodeInput>) => void;
  deleteValueDomain: (id: string) => void;
  addCapability: (parentAId: string, input: BusinessChainNodeInput) => Capability;
  updateCapability: (id: string, updates: Partial<BusinessChainNodeInput>) => void;
  deleteCapability: (id: string) => void;
  addScenario: (parentBId: string, input: BusinessChainNodeInput) => Scenario;
  updateScenario: (id: string, updates: Partial<BusinessChainNodeInput>) => void;
  deleteScenario: (id: string) => void;
  addEpcProcess: (parentCId: string, input: BusinessChainNodeInput) => EpcProcess;
  updateEpcProcess: (id: string, updates: Partial<BusinessChainNodeInput>) => void;
  deleteEpcProcess: (id: string) => void;
}

export type BusinessChainNodeRef = { kind: BusinessChainNodeKind; id: string };

type SetFn = (partial: {
  project?: OntologyProject | null;
  selectedBusinessChainNode?: BusinessChainNodeRef | null;
}) => void;
type GetFn = () => {
  project: OntologyProject | null;
  selectedBusinessChainNode: BusinessChainNodeRef | null;
};

export function createStoreAdapter(set: SetFn, get: GetFn): StoreAdapter {
  return {
    addValueDomain: (input) => {
      const { project } = get();
      if (!project) throw new Error('没有活动项目');
      const { project: nextProject, node } = addValueDomainPure(project, input);
      set({ project: nextProject, selectedBusinessChainNode: { kind: 'A', id: node.id } });
      return node;
    },

    updateValueDomain: (id, updates) => {
      const { project } = get();
      if (!project) throw new Error('没有活动项目');
      set({ project: updateValueDomainPure(project, id, updates) });
    },

    deleteValueDomain: (id) => {
      const state = get();
      if (!state.project) throw new Error('没有活动项目');
      const project = deleteValueDomainPure(state.project, id);
      set({
        project,
        selectedBusinessChainNode:
          state.selectedBusinessChainNode?.kind === 'A' && state.selectedBusinessChainNode.id === id
            ? null
            : state.selectedBusinessChainNode,
      });
    },

    addCapability: (parentAId, input) => {
      const { project } = get();
      if (!project) throw new Error('没有活动项目');
      const { project: nextProject, node } = addCapabilityPure(project, parentAId, input);
      set({ project: nextProject, selectedBusinessChainNode: { kind: 'B', id: node.id } });
      return node;
    },

    updateCapability: (id, updates) => {
      const { project } = get();
      if (!project) throw new Error('没有活动项目');
      set({ project: updateCapabilityPure(project, id, updates) });
    },

    deleteCapability: (id) => {
      const state = get();
      if (!state.project) throw new Error('没有活动项目');
      const project = deleteCapabilityPure(state.project, id);
      set({
        project,
        selectedBusinessChainNode:
          state.selectedBusinessChainNode?.kind === 'B' && state.selectedBusinessChainNode.id === id
            ? null
            : state.selectedBusinessChainNode,
      });
    },

    addScenario: (parentBId, input) => {
      const { project } = get();
      if (!project) throw new Error('没有活动项目');
      const { project: nextProject, node } = addScenarioPure(project, parentBId, input);
      set({ project: nextProject, selectedBusinessChainNode: { kind: 'C', id: node.id } });
      return node;
    },

    updateScenario: (id, updates) => {
      const { project } = get();
      if (!project) throw new Error('没有活动项目');
      set({ project: updateScenarioPure(project, id, updates) });
    },

    deleteScenario: (id) => {
      const state = get();
      if (!state.project) throw new Error('没有活动项目');
      const project = deleteScenarioPure(state.project, id);
      set({
        project,
        selectedBusinessChainNode:
          state.selectedBusinessChainNode?.kind === 'C' && state.selectedBusinessChainNode.id === id
            ? null
            : state.selectedBusinessChainNode,
      });
    },

    addEpcProcess: (parentCId, input) => {
      const { project } = get();
      if (!project) throw new Error('没有活动项目');
      const { project: nextProject, node } = addEpcProcessPure(project, parentCId, input);
      set({ project: nextProject, selectedBusinessChainNode: { kind: 'EPC', id: node.id } });
      return node;
    },

    updateEpcProcess: (id, updates) => {
      const { project } = get();
      if (!project) throw new Error('没有活动项目');
      set({ project: updateEpcProcessPure(project, id, updates) });
    },

    deleteEpcProcess: (id) => {
      const state = get();
      if (!state.project) throw new Error('没有活动项目');
      const project = deleteEpcProcessPure(state.project, id);
      set({
        project,
        selectedBusinessChainNode:
          state.selectedBusinessChainNode?.kind === 'EPC' && state.selectedBusinessChainNode.id === id
            ? null
            : state.selectedBusinessChainNode,
      });
    },
  };
}
