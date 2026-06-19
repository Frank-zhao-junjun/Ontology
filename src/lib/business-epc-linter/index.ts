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
  if (confirmed) {
    // W-EPC-06: element name consistency (US-S15-U02)
    if (step.elementRef.elementName && step.elementRef.elementName !== meta.name) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-06',
        message: `步骤「${step.name}」引用的要素名称「${step.elementRef.elementName}」与最新确认名称「${meta.name}」不一致`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
        stepId: step.id,
        elementId,
      });
    }
    // W-EPC-07: element dimension consistency (US-S15-U02)
    if (step.elementRef.dimension && step.elementRef.dimension !== meta.dimension) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-07',
        message: `步骤「${step.name}」引用的要素维度「${step.elementRef.dimension}」与八维库维度「${meta.dimension}」不一致`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
        stepId: step.id,
        elementId,
      });
    }
    // W-EPC-09: E1 data element without bound entity (US-S15-U03)
    if (step.elementRef.dimension === 'E1' && !meta.entityId) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-09',
        message: `步骤「${step.name}」引用的数据要素「${meta.name}」未绑定实体（缺少 entityId）`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
        stepId: step.id,
        elementId,
      });
    }
    // W-EPC-10: non-E1 element without bound entity (US-S15-U03)
    if (step.elementRef.dimension !== 'E1' && !meta.entityId) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-10',
        message: `步骤「${step.name}」引用的要素「${meta.name}」未绑定实体（缺少 entityId）`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
        stepId: step.id,
        elementId,
      });
    }
    // W-EPC-11: E5 role/policy element without AgentPolicy (US-S15-U03)
    if (step.elementRef.dimension === 'E5' && !meta.hasPolicy) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-11',
        message: `步骤「${step.name}」引用的治理要素「${meta.name}」未绑定 Agent 策略（缺少 hasPolicy）`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
        stepId: step.id,
        elementId,
      });
    }
    // W-EPC-13: E2 behavior element without stateMachine binding (US-S15-U04)
    if (step.elementRef.dimension === 'E2' && !meta.stateMachineId) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-13',
        message: `���骤「${step.name}」引用的行为要素「${meta.name}」未绑定状态机（缺少 stateMachineId）`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
        stepId: step.id,
        elementId,
      });
    }
    // W-EPC-15: E7 constraint element without constraintType (US-S15-U05)
    if (step.elementRef.dimension === 'E7' && !meta.constraintType) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-15',
        message: `步骤「${step.name}」引用的约束要素「${meta.name}」未指定约束类型（缺少 constraintType）`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
        stepId: step.id,
        elementId,
      });
    }
    // W-EPC-14: E3 event element without event binding (US-S15-U04)
    if (step.elementRef.dimension === 'E3' && !meta.eventId) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-14',
        message: `步骤「${step.name}」引用的事件要素「${meta.name}」未绑定事件定义（缺少 eventId）`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
        stepId: step.id,
        elementId,
      });
    }
    return;
  }

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
    const steps = epc.steps ?? [];
    // W-EPC-08: behavior density — at least one E2 step required (US-S15-U02)
    if (!steps.some((s) => s.elementRef?.dimension === 'E2')) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-08',
        message: `EPC「${epc.name}」没有关联任何行为要素（E2 维度），流程将无法执行`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
      });
    }
    // W-EPC-16: transition-event pairing — E2 steps need E3 steps (US-S15-U05)
    const hasE2 = steps.some((s) => s.elementRef?.dimension === 'E2');
    const hasE3 = steps.some((s) => s.elementRef?.dimension === 'E3');
    if (hasE2 && !hasE3) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-16',
        message: `EPC「${epc.name}」有关联行为要素（E2 维度）但缺少事件要素（E3 维度）`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
      });
    }
    // W-EPC-17: guard-action binding — E7 guard needs E2 with stateMachineId (US-S15-U05)
    const hasE7Guard = steps.some((s) => {
      if (s.elementRef?.dimension !== 'E7') return false;
      const em = metaById.get(s.elementRef.elementId);
      return em?.constraintType === 'guard';
    });
    const hasE2WithSM = steps.some((s) => {
      if (s.elementRef?.dimension !== 'E2') return false;
      const em = metaById.get(s.elementRef.elementId);
      return Boolean(em?.stateMachineId);
    });
    if (hasE7Guard && !hasE2WithSM) {
      pushWarning(warnings, {
        ruleId: 'W-EPC-17',
        message: `EPC「${epc.name}」有 E7 守卫约束但缺少已绑定状态机的 E2 行为步骤`,
        moduleKind: 'EPC',
        moduleId: epc.id,
        epcId: epc.id,
      });
    }
    // W-EPC-12: event start/end — first or last step must be E3 (US-S15-U04)
    if (steps.length > 0) {
      const firstDim = steps[0].elementRef?.dimension;
      const lastDim = steps[steps.length - 1].elementRef?.dimension;
      if (firstDim !== 'E3' && lastDim !== 'E3') {
        pushWarning(warnings, {
          ruleId: 'W-EPC-12',
          message: `EPC「${epc.name}」首尾步骤均未引用事件要素（E3 维度），缺少事件起点或终点`,
          moduleKind: 'EPC',
          moduleId: epc.id,
          epcId: epc.id,
        });
      }
    }
    for (const step of steps) {
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

