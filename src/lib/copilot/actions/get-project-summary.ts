import type { OntologyProject } from '@/types/ontology';
import { buildProjectSummary } from '@/lib/copilot/project-summary';

export function runGetProjectSummary(project: OntologyProject): string {
  return JSON.stringify(buildProjectSummary(project));
}
