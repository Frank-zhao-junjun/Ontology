import type { OntologyProject } from '@/types/ontology';

export type ProjectSummary = {
  valueDomainCount: number;
  valueDomains: Array<{ id: string; name: string }>;
  capabilityCount: number;
  scenarioCount: number;
  epcCount: number;
  metaElementCount: number;
};

export function buildProjectSummary(project: OntologyProject): ProjectSummary {
  const valueDomains = project.valueDomains ?? [];
  return {
    valueDomainCount: valueDomains.length,
    valueDomains: valueDomains.map((v) => ({ id: v.id, name: v.name })),
    capabilityCount: project.capabilities?.length ?? 0,
    scenarioCount: project.scenarios?.length ?? 0,
    epcCount: project.epcProcesses?.length ?? 0,
    metaElementCount: project.metaElements?.length ?? 0,
  };
}
