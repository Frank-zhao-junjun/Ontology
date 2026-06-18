import type { OntologyProject } from '@/types/ontology';
import type { OntologyManifestMetadata } from '@/lib/manifest-validator';
import type { CompileManifestOptions } from './types';
import { compileSimplifiedChain } from './simplified-chain';
import { toStableId } from './mappers/utils';

export function compileMetadata(
  project: OntologyProject,
  options?: CompileManifestOptions
): OntologyManifestMetadata {
  const version =
    options?.version ??
    project.dataModel?.version ??
    project.behaviorModel?.version ??
    '1.0.0';

  const { simplifiedChain, epcWarnings } = compileSimplifiedChain(project);

  return {
    id: options?.metadataId ?? toStableId(project.id),
    version,
    name: project.name,
    displayName: project.name,
    description: project.description,
    boundedContext: project.domain.name,
    domainTags: project.domain.name ? [project.domain.name] : undefined,
    compiledAt: options?.compiledAt ?? new Date().toISOString(),
    compiledBy: options?.compiledBy,
    source: 'ontology-designer',
    status: 'draft',
    extensions: {
      simplifiedChain,
      epcWarnings,
    },
  };
}
