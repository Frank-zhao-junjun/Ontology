import {
  ONTOLOGY_MANIFEST_KIND,
  type OntologyManifest,
} from '@/lib/manifest-validator';
import type { OntologyProject } from '@/types/ontology';
import { compileBehavior } from './behavior';
import { compileDataSources } from './dataSources';
import { compileEvents } from './events';
import { compileGovernance } from './governance';
import { compileMetadata } from './metadata';
import { compileProcess } from './process';
import { compileSemantic } from './semantic';
import type { CompileManifestOptions } from './types';

export type { CompileManifestOptions } from './types';

const API_VERSION = 'ontology.platform/v1';

/**
 * 将设计台 OntologyProject 编译为平台交接契约 OntologyManifest。
 */
export function compileManifest(
  project: OntologyProject,
  options?: CompileManifestOptions
): OntologyManifest {
  const metadata = compileMetadata(project, options);

  return {
    apiVersion: API_VERSION,
    kind: ONTOLOGY_MANIFEST_KIND,
    metadata,
    spec: {
      semantic: compileSemantic(project, metadata),
      behavior: compileBehavior(project),
      events: compileEvents(project),
      governance: compileGovernance(project),
      process: compileProcess(project),
      dataSources: compileDataSources(project),
    },
  };
}
