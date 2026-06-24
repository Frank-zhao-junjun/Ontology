export function resolveDefaultBusinessScenarioId(
  scenarios: { id: string }[] | undefined,
  legacyScenarios: { id: string }[] | undefined,
): string {
  return scenarios?.[0]?.id ?? legacyScenarios?.[0]?.id ?? 'e1-global';
}

export function resolveDefaultProjectId(
  projects: { id: string }[] | undefined,
  fallbackProjectId: string,
): string {
  return projects?.[0]?.id ?? fallbackProjectId;
}
