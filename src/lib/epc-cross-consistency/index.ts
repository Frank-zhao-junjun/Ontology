import { getLatestConfirmed } from "@/lib/module-version";
import type {
  EpcProcess,
  EpcStep,
  MetaElement,
  ModuleVersionRecord,
  Scenario,
  BehaviorModel,
  EventModel,
  RuleModel,
  MetricsModel,
  DataSourcesModel,
  GovernanceModel,
  Capability,
  ValueDomain,
  SemanticsBlock,
} from "@/types/ontology";
import type {
  CrossConsistencyIssue,
  ValidateCrossConsistencyInput,
  VxRuleId,
} from "./types";

export { VX_RULES } from "./types";
export type { CrossConsistencyIssue, ValidateCrossConsistencyInput, VxRuleId } from "./types";

function issue(
  code: VxRuleId,
  severity: "error" | "warning" | "info",
  message: string,
  scenarioId: string,
  extra?: {
    epcId?: string;
    stepId?: string;
    dimension?: string;
    elementId?: string;
    elementName?: string;
  },
): CrossConsistencyIssue {
  return {
    code,
    severity,
    message,
    scenarioId,
    epcId: extra?.epcId,
    stepId: extra?.stepId,
    dimension: extra?.dimension as CrossConsistencyIssue["dimension"],
    elementId: extra?.elementId,
    elementName: extra?.elementName,
  };
}

/**
 * Resolve all EPC steps under a given scenario (confirmed EPCs only).
 */
function getConfirmedEpcSteps(
  records: ModuleVersionRecord[],
  epcProcesses: EpcProcess[],
  scenarioId: string,
): { epc: EpcProcess; step: EpcStep }[] {
  const result: { epc: EpcProcess; step: EpcStep }[] = [];
  for (const epc of epcProcesses) {
    if (epc.parentId !== scenarioId) continue;
    if (!getLatestConfirmed(records, "EPC", epc.id)) continue;
    for (const step of epc.steps ?? []) {
      if (step.elementRef?.elementId) {
        result.push({ epc, step });
      }
    }
  }
  return result;
}

function collectSemantics(
  scenarioId: string,
  scenarios: Scenario[],
  capabilities: Capability[],
  valueDomains: ValueDomain[],
): SemanticsBlock {
  const terms: string[] = [];
  const triggerPhrases: string[] = [];
  const synonyms: string[] = [];

  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (scenario?.semantics) {
    terms.push(...(scenario.semantics.terms ?? []));
    triggerPhrases.push(...(scenario.semantics.triggerPhrases ?? []));
    synonyms.push(...(scenario.semantics.synonyms ?? []));
  }

  // Walk up: C → B → A
  if (scenario) {
    const capability = capabilities.find((c) => c.id === (scenario as Scenario).parentId);
    if (capability?.semantics) {
      terms.push(...(capability.semantics.terms ?? []));
      triggerPhrases.push(...(capability.semantics.triggerPhrases ?? []));
      synonyms.push(...(capability.semantics.synonyms ?? []));
    }
    if (capability) {
      const vd = valueDomains.find((v) => v.id === capability.parentId);
      if (vd?.semantics) {
        terms.push(...(vd.semantics.terms ?? []));
        triggerPhrases.push(...(vd.semantics.triggerPhrases ?? []));
        synonyms.push(...(vd.semantics.synonyms ?? []));
      }
    }
  }

  return { terms, triggerPhrases, synonyms };
}

export function validateCrossConsistency(
  input: ValidateCrossConsistencyInput,
): CrossConsistencyIssue[] {
  const issues: CrossConsistencyIssue[] = [];
  const {
    scenarioId,
    scenarios,
    capabilities,
    valueDomains,
    epcProcesses,
    metaElements,
    moduleVersionRecords,
    behaviorModel,
    eventModel,
    ruleModel,
    metricsModel,
    dataSourcesModel,
    governanceModel,
  } = input;

  const records = moduleVersionRecords ?? [];
  const metaById = new Map((metaElements ?? []).map((el) => [el.id, el]));
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) return issues;
  if (!getLatestConfirmed(records, "C", scenarioId)) return issues;

  const epcSteps = getConfirmedEpcSteps(records, epcProcesses ?? [], scenarioId);
  if (epcSteps.length === 0) return issues;

  // Collect all element IDs referenced in the EPC chain (per dimension)
  const e1EntityIds = new Set<string>();
  const e2ActionIds = new Set<string>();
  const e3EventIds = new Set<string>();
  const e4RuleIds = new Set<string>();
  const e5RoleIds = new Set<string>();
  const e6MetricIds = new Set<string>();
  const e8DsIds = new Set<string>();

  for (const { step } of epcSteps) {
    const dim = step.elementRef!.dimension;
    const eid = step.elementRef!.elementId;
    const meta = metaById.get(eid);
    if (dim === "E1") e1EntityIds.add(eid);
    if (dim === "E2") e2ActionIds.add(eid);
    if (dim === "E3") e3EventIds.add(eid);
    if (dim === "E4") e4RuleIds.add(eid);
    if (dim === "E5") e5RoleIds.add(eid);
    if (dim === "E6") e6MetricIds.add(eid);
    if (dim === "E8") e8DsIds.add(eid);
  }

  // ---- VX-01: Action-Transition 一致 ----
  // EPC 引用的 E2 Action 属于对应 StateMachine
  if (behaviorModel && e2ActionIds.size > 0) {
    const smMap = new Map(behaviorModel.stateMachines?.map((sm) => [sm.id, sm]) ?? []);
    const actionMap = new Map<string, string>(); // actionId → stateMachineId
    for (const sm of behaviorModel.stateMachines ?? []) {
      for (const action of sm.actions ?? []) {
        if (action.id) actionMap.set(action.id, sm.id);
      }
      // Also actions reachable from states
      for (const state of sm.states ?? []) {
        for (const aId of state.availableActions ?? []) {
          if (!actionMap.has(aId)) actionMap.set(aId, sm.id);
        }
      }
    }

    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E2") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      const smId = meta?.stateMachineId ?? actionMap.get(eid);
      if (!smId || !smMap.has(smId)) {
        issues.push(
          issue(
            "VX-01",
            "warning",
            `EPC「${epc.name}」步骤「${step.name}」引用的行为要素「${meta?.name ?? eid}」未绑定有效状态机`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E2",
              elementId: eid,
              elementName: meta?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-02: Event-Entity 一致 ----
  // EPC 引用的 E3 EventDefinition 属于对应 E1 Entity
  if (eventModel && e3EventIds.size > 0) {
    const eventMap = new Map(
      (eventModel.events ?? []).map((ev) => [ev.id, ev]),
    );
    // E1 entity nameEn from metaElements
    const e1NameEns = new Set<string>();
    for (const eid of e1EntityIds) {
      const m = metaById.get(eid);
      if (m?.nameEn) e1NameEns.add(m.nameEn);
    }

    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E3") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      const event = meta?.eventId ? eventMap.get(meta.eventId) : eventMap.get(eid);
      if (!event) continue;
      // Check if event.entity matches one of the E1 entities
      if (event.entity && e1NameEns.size > 0 && !e1NameEns.has(event.entity)) {
        issues.push(
          issue(
            "VX-02",
            "error",
            `EPC「${epc.name}」步骤「${step.name}」引用的 E3 事件「${event.name}」所属实体「${event.entity}」不在 EPC 链路的 E1 实体中`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E3",
              elementId: eid,
              elementName: meta?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-03: Rule-Entity 一致 ----
  // EPC 引用的 E4 Rule 属于对应 E1 Entity
  if (ruleModel && e4RuleIds.size > 0) {
    const ruleMap = new Map((ruleModel.rules ?? []).map((r) => [r.id, r]));
    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E4") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      const rule = ruleMap.get(eid);
      if (!rule) continue;
      // Check rule.entity matches an E1 entity nameEn
      const e1Names = new Set(
        Array.from(e1EntityIds)
          .map((id) => metaById.get(id)?.nameEn)
          .filter(Boolean) as string[],
      );
      if (rule.entity && e1Names.size > 0 && !e1Names.has(rule.entity)) {
        issues.push(
          issue(
            "VX-03",
            "warning",
            `EPC「${epc.name}」步骤「${step.name}」引用的 E4 规则「${rule.name}」所属实体「${rule.entity}」不在 EPC 链路的 E1 实体中`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E4",
              elementId: eid,
              elementName: meta?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-04: Metric-Action 一致 ----
  // EPC 引用的 E6 Metric 的 boundActionId 与 E2 Action 匹配
  if (metricsModel && e6MetricIds.size > 0) {
    const metricMap = new Map(
      (metricsModel.metrics ?? []).map((m) => [m.id, m]),
    );
    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E6") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      const metric = metricMap.get(eid);
      if (!metric?.boundActionId) continue;
      // boundActionId should appear among E2 elementIds in same EPC
      const sameEpcE2Ids = new Set(
        epcSteps
          .filter((es) => es.epc.id === epc.id && es.step.elementRef!.dimension === "E2")
          .map((es) => es.step.elementRef!.elementId),
      );
      if (sameEpcE2Ids.size > 0 && !sameEpcE2Ids.has(metric.boundActionId)) {
        issues.push(
          issue(
            "VX-04",
            "warning",
            `EPC「${epc.name}」步骤「${step.name}」引用的 E6 指标「${metric.name}」绑定的 Action「${metric.boundActionId}」未在同一 EPC 的 E2 步骤中出现`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E6",
              elementId: eid,
              elementName: meta?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-05: DataSource-Entity 一致 ----
  // EPC 引用的 E8 DataSource 的 boundObjectTypeId 与 E1 Entity 匹配
  if (dataSourcesModel && e8DsIds.size > 0) {
    const dsMap = new Map(
      (dataSourcesModel.sources ?? []).map((ds) => [ds.id, ds]),
    );
    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E8") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      const ds = dsMap.get(eid);
      if (!ds?.boundObjectTypeId) continue;
      const e1NameEns = new Set(
        Array.from(e1EntityIds)
          .map((id) => metaById.get(id)?.nameEn)
          .filter(Boolean) as string[],
      );
      if (e1NameEns.size > 0 && !e1NameEns.has(ds.boundObjectTypeId)) {
        issues.push(
          issue(
            "VX-05",
            "warning",
            `EPC「${epc.name}」步骤「${step.name}」引用的 E8 数据源「${ds.name}」绑定的实体类型「${ds.boundObjectTypeId}」不在 EPC 链路的 E1 实体中`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E8",
              elementId: eid,
              elementName: meta?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-06: Role-Permission 一致 ----
  // EPC 引用的 E5 Role 的权限覆盖链路涉及的 E1 Entity
  if (governanceModel && e5RoleIds.size > 0) {
    const roleMap = new Map(
      (governanceModel.roles ?? []).map((r) => [r.id, r]),
    );
    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E5") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      const role = roleMap.get(eid);
      if (!role) continue;
      const permittedObjects = new Set(
        role.permissions?.map((p) => p.objectTypeId) ?? [],
      );
      const e1NameEns = Array.from(e1EntityIds)
        .map((id) => metaById.get(id)?.nameEn)
        .filter(Boolean) as string[];
      const allCovered = e1NameEns.every((en) => permittedObjects.has(en));
      if (e1NameEns.length > 0 && !allCovered) {
        const missing = e1NameEns.filter((en) => !permittedObjects.has(en));
        issues.push(
          issue(
            "VX-06",
            "info",
            `EPC「${epc.name}」步骤「${step.name}」引用的 E5 角色「${role.name}」权限未覆盖 E1 实体: ${missing.join(", ")}`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E5",
              elementId: eid,
              elementName: meta?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-09: Intent-Action 一致 ----
  // A/B/C.semantics.triggerPhrases 中引用的 Action 在 E2 中存在
  const sem = collectSemantics(scenarioId, scenarios, capabilities, valueDomains);
  if (behaviorModel && sem.triggerPhrases && sem.triggerPhrases.length > 0) {
    const actionNames = new Set<string>();
    const actionIds = new Set<string>();
    for (const sm of behaviorModel.stateMachines ?? []) {
      for (const action of sm.actions ?? []) {
        if (action.id) actionIds.add(action.id);
        if (action.name) actionNames.add(action.name.toLowerCase());
        if (action.nameEn) actionNames.add(action.nameEn.toLowerCase());
      }
    }
    for (const action of behaviorModel.actions ?? []) {
      if (action.id) actionIds.add(action.id);
      if (action.name) actionNames.add(action.name.toLowerCase());
      if (action.nameEn) actionNames.add(action.nameEn.toLowerCase());
    }

    for (const phrase of sem.triggerPhrases) {
      const lower = phrase.toLowerCase();
      const foundByName = actionNames.has(lower);
      const foundById = actionIds.has(phrase);
      if (!foundByName && !foundById) {
        issues.push(
          issue(
            "VX-09",
            "error",
            `场景「${scenario.name}」语义层的触发短语「${phrase}」未匹配到任何 E2 Action`,
            scenarioId,
          ),
        );
      }
    }
  }

  // ---- VX-10: State-Semantics 一致 ----
  // A/B/C.semantics 中 triggerPhrases 描述的 State 在 E2 StateMachine 中存在
  if (behaviorModel && sem.triggerPhrases && sem.triggerPhrases.length > 0) {
    const stateNames = new Set<string>();
    for (const sm of behaviorModel.stateMachines ?? []) {
      for (const state of sm.states ?? []) {
        stateNames.add(state.name.toLowerCase());
        if (state.semanticTag && state.semanticTag !== "custom") {
          stateNames.add(state.semanticTag.toLowerCase());
        }
      }
    }

    for (const phrase of sem.triggerPhrases) {
      const lower = phrase.toLowerCase();
      if (stateNames.has(lower)) {
        // Found — no issue
      }
      // We only flag if there are states defined but none matched
    }
    // Report if there are triggerPhrases but no matching state found for any
    if (stateNames.size > 0) {
      const matched = sem.triggerPhrases.some((p) =>
        stateNames.has(p.toLowerCase()),
      );
      if (!matched) {
        issues.push(
          issue(
            "VX-10",
            "warning",
            `场景「${scenario.name}」语义层的触发短语未匹配到任何 E2 State`,
            scenarioId,
          ),
        );
      }
    }
  }

  // ---- VX-11: Compensation-Action 一致 ----
  // E7 compensation 引用的 E2 Action 存在且可达
  if (behaviorModel) {
    const actionIds = new Set<string>();
    for (const sm of behaviorModel.stateMachines ?? []) {
      for (const action of sm.actions ?? []) {
        if (action.id) actionIds.add(action.id);
      }
      for (const state of sm.states) {
        for (const aId of state.availableActions ?? []) {
          actionIds.add(aId);
        }
      }
    }
    for (const action of behaviorModel.actions ?? []) {
      if (action.id) actionIds.add(action.id);
    }

    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E7") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      if (meta?.constraintType !== "compensation") continue;
      // Check if the E7 element references a valid action
      // compensation references come from Transition.compensationAction or TransactionBoundary.compensationActionId
      let compActionId: string | undefined;
      for (const sm of behaviorModel.stateMachines ?? []) {
        for (const t of sm.transitions ?? []) {
          if (t.compensationAction) compActionId = t.compensationAction;
        }
      }
      // Also check TransactionBoundary
      for (const tb of behaviorModel.transactionBoundaries ?? []) {
        if (tb.compensationActionId) compActionId = tb.compensationActionId;
      }
      // If we know which action is referenced, check it exists
      if (compActionId && !actionIds.has(compActionId)) {
        issues.push(
          issue(
            "VX-11",
            "warning",
            `EPC「${epc.name}」步骤「${step.name}」引用的 E7 补偿约束引用的 Action「${compActionId}」在行为模型中不存在`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E7",
              elementId: eid,
              elementName: meta?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-12: Policy-Role 一致 ----
  // E5 Role 的 policy 约束与 E7 guard 逻辑一致
  if (governanceModel && e5RoleIds.size > 0) {
    const agentPolicies = governanceModel.agentPolicies ?? [];
    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E5") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      const role = (governanceModel.roles ?? []).find((r) => r.id === eid);
      if (!role) continue;
      const policy = agentPolicies.find((p) => p.roleId === eid);
      // If the role has hasPolicy but no agentPolicy exists, flag it
      if (meta?.hasPolicy && !policy) {
        issues.push(
          issue(
            "VX-12",
            "warning",
            `EPC「${epc.name}」步骤「${step.name}」引用的 E5 角色「${role.name}」标记有策略但未找到 AgentPolicy 定义`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E5",
              elementId: eid,
              elementName: meta?.name,
            },
          ),
        );
      }
    }
  }

  return issues;
}
