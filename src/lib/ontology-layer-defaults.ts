import type { DataSourcesModel, GovernanceModel } from '@/types/ontology';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function createEmptyGovernanceModel(): GovernanceModel {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    roles: [],
    fieldPermissions: [],
    agentPolicies: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyDataSourcesModel(): DataSourcesModel {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    sources: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function ensureGovernanceModel(model: GovernanceModel | null | undefined): GovernanceModel {
  return model ?? createEmptyGovernanceModel();
}

export function ensureDataSourcesModel(model: DataSourcesModel | null | undefined): DataSourcesModel {
  return model ?? createEmptyDataSourcesModel();
}
