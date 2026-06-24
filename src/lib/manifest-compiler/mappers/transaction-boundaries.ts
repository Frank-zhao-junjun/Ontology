import type { OntologyProject } from '@/types/ontology';

export function mapTransactionBoundaries(project: OntologyProject): Array<{
  id: string;
  name?: string;
  nameEn: string;
  actionIds: string[];
  aggregateRootIds: string[];
  isolation: string;
  compensationActionId?: string;
  description?: string;
}> {
  const boundaries = project.behaviorModel?.transactionBoundaries ?? [];

  return boundaries.map((tb) => ({
    id: tb.id,
    name: tb.name,
    nameEn: tb.nameEn,
    actionIds: tb.actionIds,
    aggregateRootIds: tb.aggregateRootIds,
    isolation: tb.isolation,
    compensationActionId: tb.compensationActionId,
    description: tb.description,
  }));
}
