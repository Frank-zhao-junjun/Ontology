import type { OntologyProject } from '@/types/ontology';

export function mapMetrics(project: OntologyProject): Array<{
  id: string;
  name?: string;
  nameEn: string;
  formula: string;
  unit: string;
  boundActionId: string;
  measurementType: string;
  targetValue?: number;
  dataSourceRef?: string;
}> {
  const metrics = project.metricsModel?.metrics ?? [];

  return metrics.map((m) => ({
    id: m.id,
    name: m.name,
    nameEn: m.nameEn,
    formula: m.formula,
    unit: m.unit,
    boundActionId: m.boundActionId,
    measurementType: m.measurementType,
    targetValue: m.targetValue,
    dataSourceRef: m.dataSourceRef,
  }));
}
