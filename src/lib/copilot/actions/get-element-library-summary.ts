import type { MetaDimension, OntologyProject } from '@/types/ontology';

const DIMENSIONS: MetaDimension[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];

export type ElementLibrarySummary = {
  totalCount: number;
  byDimension: Record<MetaDimension, number>;
  recentElements: Array<{ id: string; name: string; dimension: MetaDimension }>;
};

export function buildElementLibrarySummary(project: OntologyProject): ElementLibrarySummary {
  const elements = project.metaElements ?? [];
  const byDimension = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<
    MetaDimension,
    number
  >;

  for (const el of elements) {
    byDimension[el.dimension] += 1;
  }

  const recentElements = elements
    .slice(-5)
    .reverse()
    .map((el) => ({ id: el.id, name: el.name, dimension: el.dimension }));

  return {
    totalCount: elements.length,
    byDimension,
    recentElements,
  };
}

export function runGetElementLibrarySummary(project: OntologyProject): string {
  return JSON.stringify(buildElementLibrarySummary(project));
}
