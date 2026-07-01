/**
 * @ontology/core — Project CRUD pure functions
 *
 * All functions are (project?) => project.
 * No UI state, no zustand dependency.
 */

import type { OntologyProject, Domain } from '@/types/ontology';
import { createEmptyGovernanceModel, createEmptyDataSourcesModel } from '@/lib/ontology-layer-defaults';
import { normalizeOntologyProject } from '@/lib/ontology-normalizer';
import { generateId } from '@/lib/id';

/**
 * Create a new empty project.
 * Maps to store.createProject(name, domain, description)
 */
export function createProject(
  name: string,
  domain: Domain,
  description?: string,
): { project: OntologyProject } {
  const now = new Date().toISOString();
  const project: OntologyProject = {
    id: generateId(),
    name,
    description,
    domain,
    dataModel: null,
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: null,
    epcModel: null,
    governanceModel: createEmptyGovernanceModel(),
    dataSourcesModel: createEmptyDataSourcesModel(),
    moduleVersionRecords: [],
    createdAt: now,
    updatedAt: now,
  };
  return { project };
}

/**
 * Load a project (normalize it).
 * Maps to the merge function in zustand persist middleware.
 */
export function loadProject(raw: unknown): OntologyProject {
  return normalizeOntologyProject(raw as OntologyProject);
}

/**
 * Save/validate a project.
 * Returns the project with updated timestamp.
 */
export function saveProject(project: OntologyProject): OntologyProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validate that a project has a name and domain.
 */
export function validateProject(project: OntologyProject | null): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!project) {
    errors.push('项目不存在');
    return { valid: false, errors };
  }
  if (!project.name?.trim()) {
    errors.push('项目名称不能为空');
  }
  if (!project.domain?.id || !project.domain?.name) {
    errors.push('项目领域不完整');
  }
  return { valid: errors.length === 0, errors };
}
