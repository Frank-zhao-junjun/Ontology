/**
 * @ontology/core — Store Query thin wrappers
 *
 * All functions are (project, ...args) => result.
 * No UI state, no zustand dependency.
 */

import type { OntologyProject } from '@/types/ontology';
import type { EpcWarning } from '@/lib/business-epc-linter';
import { lintBusinessEpc } from '@/lib/business-epc-linter';
import { computeCoverage, emptyCoverageReport, type EpcCoverageReport } from '@/lib/epc-coverage';
import {
  validateCrossConsistency,
  type CrossConsistencyIssue,
} from '@/lib/epc-cross-consistency';
import { filterUnreferencedElements } from '@/lib/element-library';
import type { MetaElement } from '@/types/ontology';
import type { AgentSemanticLayer } from '@/types/ontology';
import { deriveEpcSteps, filterConfirmedMetaElements } from '@/lib/epc-derivation';
import { getLatestConfirmed } from '@/lib/module-version';

/**
 * Lint all EPC processes and return warnings.
 * Maps to store.getBusinessEpcWarnings()
 */
export function getBusinessEpcWarnings(project: OntologyProject): EpcWarning[] {
  return lintBusinessEpc({
    moduleVersionRecords: project.moduleVersionRecords ?? [],
    scenarios: project.scenarios,
    epcProcesses: project.epcProcesses,
    metaElements: project.metaElements,
  });
}

/**
 * Compute EPC coverage for a given scenario.
 * Maps to store.getEpcCoverage(scenarioId)
 */
export function getEpcCoverage(
  project: OntologyProject,
  scenarioId: string,
): EpcCoverageReport {
  if (!project) return emptyCoverageReport(scenarioId);
  return computeCoverage({
    scenarioId,
    scenarios: project.scenarios ?? [],
    epcProcesses: project.epcProcesses ?? [],
    metaElements: project.metaElements ?? [],
    moduleVersionRecords: project.moduleVersionRecords ?? [],
  });
}

/**
 * Validate cross-consistency for a given scenario.
 * Maps to store.getCrossConsistency(scenarioId)
 */
export function getCrossConsistency(
  project: OntologyProject,
  scenarioId: string,
): CrossConsistencyIssue[] {
  if (!project) return [];
  return validateCrossConsistency({
    scenarioId,
    scenarios: project.scenarios ?? [],
    capabilities: project.capabilities ?? [],
    valueDomains: project.valueDomains ?? [],
    epcProcesses: project.epcProcesses ?? [],
    metaElements: project.metaElements ?? [],
    moduleVersionRecords: project.moduleVersionRecords ?? [],
    behaviorModel: project.behaviorModel ?? null,
    eventModel: project.eventModel ?? null,
    ruleModel: project.ruleModel ?? null,
    metricsModel: project.metricsModel ?? null,
    dataSourcesModel: project.dataSourcesModel ?? null,
    governanceModel: project.governanceModel ?? null,
  });
}

/**
 * Get meta elements that are not referenced by any EPC step.
 * Maps to store.getUnreferencedElements()
 */
export function getUnreferencedElements(project: OntologyProject): MetaElement[] {
  const elements = project.metaElements ?? [];
  return filterUnreferencedElements(elements, true);
}

/**
 * Compute real-time semantic coverage from project state.
 * Maps to store.getSemanticCoverage()
 */
export function getSemanticCoverage(
  project: OntologyProject,
): AgentSemanticLayer['metadata']['coverage'] | null {
  if (!project?.agentSemanticLayer) return null;
  const layer = project.agentSemanticLayer;
  const totalEntities = project.dataModel?.entities.length || 0;
  const totalActions = project.behaviorModel?.actions?.length || 0;
  const entitiesWithIntents = new Set(layer.intents.map((i) => i.targetEntityId)).size;
  const actionsWithRecovery = new Set(layer.errorRecoveries.map((er) => er.actionId)).size;
  return {
    entitiesWithIntents,
    totalEntities,
    actionsWithRecovery,
    totalActions,
  };
}

/**
 * Derive EPC steps from a confirmed scenario's meta elements.
 * Maps to store.deriveEpcStepsFromScenario(scenarioId)
 */
export function deriveEpcStepsFromScenario(
  project: OntologyProject,
  scenarioId: string,
): ReturnType<typeof deriveEpcSteps> {
  if (!project) return [];
  if (!getLatestConfirmed(project.moduleVersionRecords ?? [], 'C', scenarioId)) return [];
  const confirmed = filterConfirmedMetaElements(
    project.metaElements ?? [],
    project.moduleVersionRecords ?? [],
  );
  return deriveEpcSteps({ metaElements: confirmed });
}
