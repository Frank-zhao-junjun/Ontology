import type { useOntologyStore } from '@/store/ontology-store';
import type { ValueDomain } from '@/types/ontology';

type StoreSlice = Pick<ReturnType<typeof useOntologyStore.getState>, 'addValueDomain'>;

export interface CreateValueDomainInput {
  name: string;
  nameEn?: string;
  description?: string;
}

export interface CreateValueDomainResult {
  id: string;
  name: string;
  message: string;
  node: ValueDomain;
}

export function runCreateValueDomain(
  store: StoreSlice,
  input: CreateValueDomainInput,
): CreateValueDomainResult {
  const node = store.addValueDomain({
    name: input.name,
    nameEn: input.nameEn,
    description: input.description,
  });
  return {
    id: node.id,
    name: node.name,
    message: `已创建价值域「${node.name}」（draft）`,
    node,
  };
}
