// @ontology/core — barrel export
// Pure functions extracted from ontology-store.ts for headless use.
// Canonical source:
//   src/lib/business-chain/business-chain.ts — A/B/C/EPC CRUD
//   src/lib/project.ts                    — project operations
//   src/lib/queries.ts                    — query wrappers

export {
  addValueDomain,
  updateValueDomain,
  deleteValueDomain,
  addCapability,
  updateCapability,
  deleteCapability,
  addScenario,
  updateScenario,
  deleteScenario,
  addEpcProcess,
  updateEpcProcess,
  deleteEpcProcess,
} from '@/lib/business-chain/business-chain';

export {
  createProject,
  loadProject,
  saveProject,
  validateProject,
} from '@/lib/project';

export {
  getBusinessEpcWarnings,
  getEpcCoverage,
  getCrossConsistency,
  getUnreferencedElements,
  getSemanticCoverage,
  deriveEpcStepsFromScenario,
} from '@/lib/queries';
