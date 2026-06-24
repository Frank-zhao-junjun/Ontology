import type { BusinessScenario, Capability, OntologyProject, Scenario, ValueDomain } from '@/types/ontology';

export type MigrateBusinessScenariosResult = {
  project: OntologyProject;
  migratedCount: number;
  skippedCount: number;
};

const DEFAULT_A_NAME = 'Legacy 价值域';
const DEFAULT_B_NAME = 'Legacy 能力';

function hasSimplifiedChain(project: OntologyProject): boolean {
  return (project.valueDomains?.length ?? 0) > 0 || (project.scenarios?.length ?? 0) > 0;
}

export function migrateBusinessScenariosToChain(project: OntologyProject): MigrateBusinessScenariosResult {
  const legacyScenarios = project.dataModel?.businessScenarios ?? [];
  if (legacyScenarios.length === 0) {
    return { project, migratedCount: 0, skippedCount: 0 };
  }

  if (hasSimplifiedChain(project)) {
    return { project, migratedCount: 0, skippedCount: legacyScenarios.length };
  }

  const now = new Date().toISOString();
  const valueDomainId = `vd-legacy-${Date.now()}`;
  const capabilityId = `cap-legacy-${Date.now()}`;

  const valueDomain: ValueDomain = {
    id: valueDomainId,
    name: DEFAULT_A_NAME,
    description: '由 legacy BusinessScenario 自动迁移生成',
  };

  const capability: Capability = {
    id: capabilityId,
    name: DEFAULT_B_NAME,
    parentId: valueDomainId,
    description: 'Legacy 能力占位',
  };

  const existingScenarioIds = new Set((project.scenarios ?? []).map((item) => item.id));
  const migratedScenarios: Scenario[] = [];

  for (const legacy of legacyScenarios) {
    if (existingScenarioIds.has(legacy.id)) {
      continue;
    }
    migratedScenarios.push(mapLegacyScenario(legacy, capabilityId));
  }

  return {
    project: {
      ...project,
      valueDomains: [...(project.valueDomains ?? []), valueDomain],
      capabilities: [...(project.capabilities ?? []), capability],
      scenarios: [...(project.scenarios ?? []), ...migratedScenarios],
      updatedAt: now,
    },
    migratedCount: migratedScenarios.length,
    skippedCount: legacyScenarios.length - migratedScenarios.length,
  };
}

function mapLegacyScenario(legacy: BusinessScenario, parentBId: string): Scenario {
  return {
    id: legacy.id,
    name: legacy.name,
    nameEn: legacy.nameEn,
    description: legacy.description,
    parentId: parentBId,
    semantics: {
      terms: [legacy.name],
      triggerPhrases: legacy.nameEn ? [legacy.nameEn] : undefined,
    },
  };
}
