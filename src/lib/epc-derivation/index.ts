import type { MetaElement, MetaDimension, EpcStep, ModuleVersionRecord } from '@/types/ontology';
import { getLatestConfirmed } from '@/lib/module-version';

/** One derived EPC step suggestion */
export interface DerivedEpcStep {
  /** Human-readable step name derived from the meta element */
  name: string;
  /** Which E-dimension this step references */
  dimension: MetaDimension;
  /** The meta element id to bind */
  elementId: string;
  /** Human-readable reason why this step was derived */
  derivation: string;
}

/** Input for step derivation */
export interface DeriveEpcStepsInput {
  metaElements: MetaElement[];
}

/** Dimension ordering for EPC step layout (excludes E4, E6, E8 which don't generate steps) */
const DIMENSION_ORDER: MetaDimension[] = ['E1', 'E2', 'E7', 'E5'];

/**
 * Derive suggested EPC steps from confirmed meta elements under a scenario.
 *
 * Rules (per EPC v3.1 simplified spec):
 * 1. E3 events → start/end bookends
 * 2. E1 data → info steps
 * 3. E2 actions → function steps
 * 4. E7 constraints → decision/compensation steps
 * 5. E5 roles → org unit steps
 *
 * Output order: E3(start) → E1* → E2* → E7* → E5* → E3(end)
 */
export function deriveEpcSteps(input: DeriveEpcStepsInput): DerivedEpcStep[] {
  const { metaElements } = input;
  if (!metaElements || metaElements.length === 0) return [];

  // Group elements by dimension
  const byDim = new Map<MetaDimension, MetaElement[]>();
  for (const el of metaElements) {
    const list = byDim.get(el.dimension) || [];
    list.push(el);
    byDim.set(el.dimension, list);
  }

  const steps: DerivedEpcStep[] = [];

  // ---- Step 1: E3 start event ----
  const e3Elements = byDim.get('E3') || [];
  if (e3Elements.length > 0) {
    const startEvent = e3Elements[0];
    steps.push({
      name: `${startEvent.name}（起始）`,
      dimension: 'E3',
      elementId: startEvent.id,
      derivation: 'E3 event → EPC start step',
    });
  }

  // ---- Step 2: Middle dimensions in order ----
  for (const dim of DIMENSION_ORDER) {
    const elements = byDim.get(dim) || [];
    for (const el of elements) {
      const derivation = getDerivationReason(el);
      steps.push({
        name: el.name,
        dimension: el.dimension,
        elementId: el.id,
        derivation,
      });
    }
  }

  // ---- Step 6: E3 end event ----
  if (e3Elements.length > 0) {
    const endEvent = e3Elements.length > 1 ? e3Elements[e3Elements.length - 1] : e3Elements[0];
    steps.push({
      name: `${endEvent.name}（结束）`,
      dimension: 'E3',
      elementId: endEvent.id,
      derivation: 'E3 event → EPC end step',
    });
  }

  return steps;
}

/** Keep only meta elements with a confirmed version record */
export function filterConfirmedMetaElements(
  metaElements: MetaElement[],
  moduleVersionRecords: ModuleVersionRecord[],
): MetaElement[] {
  return metaElements.filter((el) =>
    Boolean(getLatestConfirmed(moduleVersionRecords, el.dimension, el.id)),
  );
}

/** Convert derived suggestions into draft EpcStep[] */
export function derivedStepsToEpcSteps(
  derived: DerivedEpcStep[],
  generateId: () => string,
): EpcStep[] {
  return derived.map((d) => ({
    id: generateId(),
    name: d.name,
    elementRef: {
      dimension: d.dimension,
      elementId: d.elementId,
      versionPin: 'latest_confirmed' as const,
      elementName: d.name,
    },
  }));
}

function getDerivationReason(el: MetaElement): string {
  switch (el.dimension) {
    case 'E1':
      return 'E1 data element → EPC info step';
    case 'E2':
      return `E2 action${el.stateMachineId ? ' (bound to SM ' + el.stateMachineId + ')' : ''} → EPC function step`;
    case 'E7':
      return el.constraintType === 'guard'
        ? 'E7 guard constraint → EPC decision step'
        : el.constraintType === 'compensation'
          ? 'E7 compensation → EPC compensation step'
          : 'E7 constraint → EPC constraint step';
    case 'E5':
      return `E5 role${el.hasPolicy ? ' (has AgentPolicy)' : ''} → EPC org unit step`;
    default:
      return `${el.dimension} element → EPC step`;
  }
}
