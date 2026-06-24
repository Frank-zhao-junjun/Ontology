import { getLatestConfirmed } from '@/lib/module-version';
import { META_DIMENSION_ORDER } from '@/lib/element-selector/constants';
import type { EpcProcess, MetaDimension, MetaElement, ModuleVersionRecord } from '@/types/ontology';
import type { ComputeCoverageInput, DimensionCoverage, EpcCoverageReport } from './types';

export type { DimensionCoverage, EpcCoverageReport, ComputeCoverageInput } from './types';

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function emptyCoverageReport(scenarioId: string): EpcCoverageReport {
  return {
    scenarioId,
    totalElements: 0,
    coveredElements: 0,
    coveragePercent: 0,
    byDimension: {},
  };
}

export function computeCoverage(input: ComputeCoverageInput): EpcCoverageReport {
  const { scenarioId, scenarios, epcProcesses, metaElements, moduleVersionRecords } = input;

  // 1. Validate scenario exists and is confirmed
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) return emptyCoverageReport(scenarioId);
  if (!getLatestConfirmed(moduleVersionRecords, 'C', scenarioId)) return emptyCoverageReport(scenarioId);

  // 2. Find child EPCs that are confirmed
  const childEpcs = epcProcesses.filter((epc) => epc.parentId === scenarioId);
  const confirmedEpcIds = new Set(
    childEpcs
      .filter((epc) => Boolean(getLatestConfirmed(moduleVersionRecords, 'EPC', epc.id)))
      .map((epc) => epc.id),
  );

  // 3. Group metaElements by dimension
  const byDimension = new Map<MetaDimension, MetaElement[]>();
  for (const el of metaElements) {
    const list = byDimension.get(el.dimension);
    if (list) {
      list.push(el);
    } else {
      byDimension.set(el.dimension, [el]);
    }
  }

  // 4. Compute coverage per dimension
  const dimResults: DimensionCoverage[] = [];
  let totalElements = 0;
  let coveredElements = 0;

  for (const dim of META_DIMENSION_ORDER) {
    const group = byDimension.get(dim) ?? [];
    totalElements += group.length;

    const covered = group.filter((el) =>
      (el.usageRefs ?? []).some((ref) => confirmedEpcIds.has(ref.epcId)),
    );
    coveredElements += covered.length;

    const uncoveredIds = new Set(covered.map((el) => el.id));
    const uncovered = group
      .filter((el) => !uncoveredIds.has(el.id))
      .map((el) => ({ elementId: el.id, elementName: el.name }));

    dimResults.push({
      dimension: dim,
      totalElements: group.length,
      coveredElements: covered.length,
      coveragePercent: group.length > 0 ? roundPercent((covered.length / group.length) * 100) : 0,
      uncovered,
    });
  }

  // 5. Build report — only dimensions with elements
  const byDimRecord: Partial<Record<MetaDimension, DimensionCoverage>> = {};
  for (const d of dimResults) {
    if (d.totalElements > 0) {
      byDimRecord[d.dimension] = d;
    }
  }

  return {
    scenarioId,
    totalElements,
    coveredElements,
    coveragePercent: totalElements > 0 ? roundPercent((coveredElements / totalElements) * 100) : 0,
    byDimension: byDimRecord,
  };
}

/** Whether a meta element is referenced by any confirmed EPC step */
export function isElementEpcCovered(
  element: MetaElement,
  epcProcesses: EpcProcess[],
  moduleVersionRecords: ModuleVersionRecord[],
): boolean {
  const confirmedEpcIds = new Set(
    epcProcesses
      .filter((epc) => Boolean(getLatestConfirmed(moduleVersionRecords, 'EPC', epc.id)))
      .map((epc) => epc.id),
  );
  return (element.usageRefs ?? []).some((ref) => confirmedEpcIds.has(ref.epcId));
}
