import type { useOntologyStore } from '@/store/ontology-store';
import type { Capability, EpcProcess, Scenario } from '@/types/ontology';

type StoreSlice = Pick<
  ReturnType<typeof useOntologyStore.getState>,
  'addCapability' | 'addScenario' | 'addEpcProcess'
>;

export interface CreateChainNodeInput {
  name: string;
  nameEn?: string;
  description?: string;
}

export interface CreateChainNodeResult<T> {
  id: string;
  name: string;
  message: string;
  node: T;
}

export function runCreateCapability(
  store: StoreSlice,
  parentAId: string,
  input: CreateChainNodeInput,
): CreateChainNodeResult<Capability> {
  const node = store.addCapability(parentAId, input);
  return {
    id: node.id,
    name: node.name,
    message: `已创建能力「${node.name}」（draft）`,
    node,
  };
}

export function runCreateScenario(
  store: StoreSlice,
  parentBId: string,
  input: CreateChainNodeInput,
): CreateChainNodeResult<Scenario> {
  const node = store.addScenario(parentBId, input);
  return {
    id: node.id,
    name: node.name,
    message: `已创建场景「${node.name}」（draft）`,
    node,
  };
}

export function runCreateEpcProcess(
  store: StoreSlice,
  parentCId: string,
  input: CreateChainNodeInput,
): CreateChainNodeResult<EpcProcess> {
  const node = store.addEpcProcess(parentCId, input);
  return {
    id: node.id,
    name: node.name,
    message: `已创建 EPC 流程「${node.name}」（draft）`,
    node,
  };
}
