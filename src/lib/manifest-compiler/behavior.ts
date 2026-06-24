import type { OntologyManifestBehavior } from '@/lib/manifest-validator';
import type { OntologyProject } from '@/types/ontology';
import { mapActions } from './mappers/actions';
import { mapRules } from './mappers/rules';
import { mapMetrics } from './mappers/metrics';
import { mapTransactionBoundaries } from './mappers/transaction-boundaries';
import { mapSideEffects } from './mappers/side-effects';

export function compileBehavior(project: OntologyProject): OntologyManifestBehavior {
  return {
    actions: mapActions(project),
    rules: mapRules(project),
    metrics: mapMetrics(project),
    transactionBoundaries: mapTransactionBoundaries(project),
    sideEffects: mapSideEffects(project),
  };
}
