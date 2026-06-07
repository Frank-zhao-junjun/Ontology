import type { OntologyManifestEvents } from '@/lib/manifest-validator';
import type { OntologyProject } from '@/types/ontology';
import { mapDeadLetterPolicies } from './mappers/dead-letter';
import { mapDomainEvents } from './mappers/domain-events';
import { mapEventSourcingConfig } from './mappers/event-sourcing';

export function compileEvents(project: OntologyProject): OntologyManifestEvents {
  const subscriptions = project.eventModel?.subscriptions ?? [];
  const deadLetterPolicies = project.eventModel?.deadLetterPolicies ?? [];

  return {
    domainEvents: mapDomainEvents(project),
    integrationEvents: [],
    routes: [],
    handlers: subscriptions.map((sub) => ({
      id: sub.id,
      eventId: sub.eventId,
      actionRef: sub.actionRef,
      deadLetterPolicyId: sub.deadLetterPolicyId,
    })),
    eventSourcingConfig: mapEventSourcingConfig(project),
    deadLetterPolicies: mapDeadLetterPolicies(deadLetterPolicies),
  };
}
