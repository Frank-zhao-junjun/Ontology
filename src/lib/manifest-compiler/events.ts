import type { OntologyManifestEvents } from '@/lib/manifest-validator';
import type { OntologyProject } from '@/types/ontology';
import { mapDomainEvents } from './mappers/domain-events';

export function compileEvents(project: OntologyProject): OntologyManifestEvents {
  const subscriptions = project.eventModel?.subscriptions ?? [];

  return {
    domainEvents: mapDomainEvents(project),
    integrationEvents: [],
    routes: [],
    handlers: subscriptions.map((sub) => ({
      id: sub.id,
      eventId: sub.eventId,
      actionRef: sub.actionRef,
    })),
  };
}
