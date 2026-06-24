import type { OntologyProject, Rule } from '@/types/ontology';
import type { ManifestRule } from '@/lib/manifest-validator';
import { mapRuleType } from './enums';

export function mapRules(project: OntologyProject): ManifestRule[] {
  const rules = project.ruleModel?.rules ?? [];

  return rules.map(
    (rule: Rule): ManifestRule & { expression?: unknown; errorMessage?: string; enabled?: boolean; version?: string; status?: string; grayscale?: { enabled: boolean; percentage: number; targetScenarioIds?: string[] }; effectiveFrom?: string; effectiveUntil?: string } => ({
      id: rule.id,
      name: rule.name,
      type: mapRuleType(rule.type),
      version: rule.version || '1.0.0',
      status: rule.status || 'active',
      grayscale: rule.grayscale,
      effectiveFrom: rule.effectiveFrom,
      effectiveUntil: rule.effectiveUntil,
      expression: rule.condition,
      errorMessage: rule.errorMessage,
      enabled: rule.enabled !== false,
    })
  );
}
