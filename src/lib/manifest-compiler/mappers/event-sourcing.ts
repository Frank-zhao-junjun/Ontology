import type { OntologyProject } from '@/types/ontology';
import type { ManifestEventSourcingConfig } from '@/lib/manifest-validator';

export function mapEventSourcingConfig(
  project: OntologyProject,
): ManifestEventSourcingConfig | undefined {
  const config = project.eventModel?.eventSourcingConfig;
  if (!config) return undefined;

  return {
    id: config.id,
    snapshotInterval: config.snapshotInterval,
    retentionDays: config.retentionDays,
    storeType: config.storeType,
    description: config.description,
  };
}
