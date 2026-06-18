import {
  getLatestConfirmed,
  getModuleDraft,
} from '@/lib/module-version';
import { isUnreferencedElement } from '@/lib/element-library';
import type {
  EpcProcess,
  EpcStep,
  MetaElement,
  ModuleVersionRecord,
} from '@/types/ontology';
import type {
  EpcWarning,
  EpcWarningRuleId,
  LintBusinessEpcInput,
} from './types';

export { EPC_WARNING_RULES } from './types';
export type { EpcWarning, EpcWarningRuleId, LintBusinessEpcInput } from './types';

function warningId(
  ruleId: EpcWarningRuleId,
  moduleKind: EpcWarning['moduleKind'],
  moduleId: string,
  extra?: { elementId?: string; stepId?: string },
): string {
  return [ruleId, moduleKind, moduleId, extra?.elementId ?? '', extra?.stepId ?? ''].join(':');
}

function pushWarning(
  warnings: EpcWarning[],
  partial: Omit<EpcWarning, 'id' | 'level'>,
): void {
  warnings.push({
    ...partial,
    id: warningId(partial.ruleId, partial.moduleKind, partial.moduleId, {
      elementId: partial.elementId,
      stepId: partial.stepId,
    }),
    level: 'warning',
  });
}

function getConfirmedEpcSnapshots(
  records: ModuleVersionRecord[],
  epcProcesses: EpcProcess[],
): EpcProcess[] {
  return epcProcesses
    .map((epc) => getLatestConfirmed(records, 'EPC', epc.id))
    .filter((record): record is ModuleVersionRecord => Boolean(record))
    .map((record) => record.snapshot as EpcProcess);
}

function inspectConfirmedEpcStep(
  warnings: EpcWarning[],
  records: ModuleVersionRecord[],
  metaById: Map<string, MetaElement>,
  epc: EpcProcess,
  step: EpcStep,
): void {
  const elementId = step.elementRef?.elementId?.trim();
  if (!elementId || !step.elementRef) return;

  const meta = metaById.get(elementId);
  if (!meta) {
    pushWarning(warnings, {
      ruleId: 'W-EPC-05',
      message: `步骤「${step.name}」引用的要素 ${elementId} 不存在于八维库`,
      moduleKind: 'EPC',
      moduleId: epc.id,
      epcId: epc.id,
      stepId: step.id,
      elementId,
    });
    return;
  }

  const confirmed = getLatestConfirmed(records, meta.dimension, elementId);
  if (confirmed) return;

  const draft = getModuleDraft(records, meta.dimension, elementId);
  if (draft) {
    pushWarning(warnings, {
      ruleId: 'W-EPC-03',
      message: `步骤「${step.name}」引用的要素「${meta.name}」仅有草稿、未确认`,
      moduleKind: 'EPC',
      moduleId: epc.id,
      epcId: epc.id,
      stepId: step.id,
      elementId,
    });
    return;
  }

  pushWarning(warnings, {
    ruleId: 'W-EPC-01',
    message: `步骤「${step.name}」引用的要素「${meta.name}」未确认`,
    moduleKind: 'EPC',
    moduleId: epc.id,
    epcId: epc.id,
    stepId: step.id,
    elementId,
  });
}

export function lintBusinessEpc(input: LintBusinessEpcInput): EpcWarning[] {
  const records = input.moduleVersionRecords ?? [];
  const scenarios = input.scenarios ?? [];
  const epcProcesses = input.epcProcesses ?? [];
  const metaElements = input.metaElements ?? [];
  const metaById = new Map(metaElements.map((el) => [el.id, el]));
  const warnings: EpcWarning[] = [];

  for (const scenario of scenarios) {
    if (!getLatestConfirmed(records, 'C', scenario.id)) continue;
    const hasChildEpc = epcProcesses.some((epc) => epc.parentId === scenario.id);
    if (!hasChildEpc) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-04',
        message: `场景「${scenario.name}」下没有 EPC 流程`,
        moduleKind: 'C',
        moduleId: scenario.id,
      });
    }
  }

  for (const epc of getConfirmedEpcSnapshots(records, epcProcesses)) {
    for (const step of epc.steps ?? []) {
      inspectConfirmedEpcStep(warnings, records, metaById, epc, step);
    }
  }

  for (const el of metaElements) {
    if (!getLatestConfirmed(records, el.dimension, el.id)) continue;
    if (isUnreferencedElement(el)) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-02',
        message: `要素「${el.name}」已确认但未被任何 EPC 引用`,
        moduleKind: el.dimension,
        moduleId: el.id,
        elementId: el.id,
      });
    }
  }

  return warnings;
}
