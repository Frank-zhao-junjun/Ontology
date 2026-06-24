import type {
  EpcProcess,
  MetaDimension,
  MetaElement,
  ModuleVersionRecord,
  Scenario,
} from '@/types/ontology';

export interface DimensionCoverage {
  dimension: MetaDimension;
  totalElements: number;
  coveredElements: number;
  coveragePercent: number;
  uncovered: { elementId: string; elementName: string }[];
}

export interface EpcCoverageReport {
  scenarioId: string;
  totalElements: number;
  coveredElements: number;
  coveragePercent: number;
  byDimension: Partial<Record<MetaDimension, DimensionCoverage>>;
}

export interface ComputeCoverageInput {
  scenarioId: string;
  scenarios: Scenario[];
  epcProcesses: EpcProcess[];
  metaElements: MetaElement[];
  moduleVersionRecords: ModuleVersionRecord[];
}
