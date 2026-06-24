import type { EventDefinition, OntologyProject } from '@/types/ontology';
import type { ManifestDomainEvent } from '@/lib/manifest-validator';
import { ensurePastTenseNameEn, resolveAggregateRootId } from './utils';

export function mapDomainEvents(project: OntologyProject): ManifestDomainEvent[] {
  const events = project.eventModel?.events ?? [];
  const entitiesById = new Map((project.dataModel?.entities ?? []).map((e) => [e.id, e]));

  return events.map((evt: EventDefinition): ManifestDomainEvent => {
    const aggregateRootId = resolveAggregateRootId(evt.entity, entitiesById) ?? evt.entity;

    return {
      id: evt.id,
      name: evt.name,
      nameEn: ensurePastTenseNameEn(evt.nameEn ?? '', evt.name),
      aggregateRootId,
    };
  });
}
