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

  // ---- VX-13: EPC-C 挂接一致 ----
  // EPC 的 parentId 对应的 C 在 scenarios 中存在
  const scenarioIds = new Set((scenarios ?? []).map((s) => s.id));
  for (const epc of epcProcesses ?? []) {
    if (!scenarioIds.has(epc.parentId)) {
      issues.push(
        issue(
          "VX-13",
          "warning",
          `EPC「${epc.name}」的 parentId「${epc.parentId}」未在 scenarios 中找到对应的 C`,
          scenarioId,
          { epcId: epc.id },
        ),
      );
    }
  }

  // ---- VX-14: C-B 挂接一致 ----
  // C 的 parentId 对应的 B 在 capabilities 中存在
  const capabilityIds = new Set((capabilities ?? []).map((c) => c.id));
  for (const sc of scenarios ?? []) {
    if (sc.parentId && !capabilityIds.has(sc.parentId)) {
      issues.push(
        issue(
          "VX-14",
          "warning",
          `场景「${sc.name}」的 parentId「${sc.parentId}」未在 capabilities 中找到对应的 B`,
          scenarioId,
        ),
      );
    }
  }

  // ---- VX-15: B-A 挂接一致 ----
  // B 的 parentId 对应的 A 在 valueDomains 中存在
  const vdIds = new Set((valueDomains ?? []).map((v) => v.id));
  for (const cap of capabilities ?? []) {
    if (cap.parentId && !vdIds.has(cap.parentId)) {
      issues.push(
        issue(
          "VX-15",
          "warning",
          `能力「${cap.name}」的 parentId「${cap.parentId}」未在 valueDomains 中找到对应的 A`,
          scenarioId,
        ),
      );
    }
  }

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

  // ---- VX-07: Dept-Role 一致 ----
  // EPC 引用的 E5 Department 类型要素，其下 Position 的 roleIds 必须在 governanceModel.roles 中存在
  if (e5RoleIds.size > 0) {
    const governanceRoleIds = new Set(
      (governanceModel?.roles ?? []).map((r) => r.id).filter(Boolean),
    );
    // Build department → children positions map
    const deptChildren = new Map<string, { name: string; roleIds: string[] }[]>();
    for (const el of metaElements ?? []) {
      const pId = (el as any).parentId;
      if (!pId) continue;
      const children = deptChildren.get(pId) ?? [];
      children.push({ name: el.name, roleIds: (el as any).roleIds ?? [] });
      deptChildren.set(pId, children);
    }
    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E5") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      if (!meta || (meta as any).type !== "department") continue;
      const childPositions = deptChildren.get(eid) ?? [];
      const missingRoleIds = new Set<string>();
      for (const pos of childPositions) {
        for (const rid of pos.roleIds) {
          if (!governanceRoleIds.has(rid)) {
            missingRoleIds.add(rid);
          }
        }
      }
      if (missingRoleIds.size > 0) {
        issues.push(
          issue(
            "VX-07",
            "warning",
            `EPC「${epc.name}」步骤「${step.name}」引用的部门「${meta.name}」下属岗位的角色 ID「${Array.from(missingRoleIds).join(", ")}」未在 governanceModel.roles 中找到`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: "E5",
              elementId: eid,
              elementName: meta.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-08: Position-Role 一致 ----
  // 遍历 EPC steps 中 dimension='E5' 且 meta.type==='position' 的引用
  // 获取 meta.roleIds，检查每个 roleId 在 metaElements 中有对应的 element 且有 confirmedVersion
  if (e5RoleIds.size > 0) {
    for (const { epc, step } of epcSteps) {
      if (step.elementRef!.dimension !== "E5") continue;
      const eid = step.elementRef!.elementId;
      const meta = metaById.get(eid);
      if (!meta) continue;
      const metaType = (meta as any).type;
      if (metaType !== "position") continue;
      const roleIds: string[] = (meta as any).roleIds ?? [];
      for (const roleId of roleIds) {
        const roleMeta = metaById.get(roleId);
        if (!roleMeta || !(roleMeta as any).confirmedVersion) {
          issues.push(
            issue(
              "VX-08",
              "warning",
              `EPC「${epc.name}」步骤「${step.name}」引用的岗位「${meta.name}」关联的角色「${roleId}」在要素库中无已确认版本`,
              scenarioId,
              {
                epcId: epc.id,
                stepId: step.id,
                dimension: "E5",
                elementId: eid,
                elementName: meta.name,
              },
            ),
          );
        }
      }
    }
  }

  // ---- VX-16: Element 维度一致 ----
  // elementRef 引用的要素 dimension 与步骤声明的维度一致
  // Use all EPC steps (not just confirmed ones) for a broader check
  for (const epc of epcProcesses ?? []) {
    for (const stepElem of epc.steps ?? []) {
      if (!stepElem.elementRef) continue;
      const eid = stepElem.elementRef.elementId;
      const declaredDim = stepElem.elementRef.dimension;
      const meta = metaById.get(eid);
      if (meta && meta.dimension !== declaredDim) {
        issues.push(
          issue(
            "VX-16",
            "error",
            `EPC「${epc.name}」步骤「${stepElem.name}」声明的维度为「${declaredDim}」，但引用的要素「${meta.name}」实际维度为「${meta.dimension}」`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: stepElem.id,
              dimension: declaredDim,
              elementId: eid,
              elementName: meta.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-17: Step 顺序合理性 ----
  // 遍历已确认 EPC，检查 dimension='E3' 的步骤是否在 index 0 或最后一个位置
  const confirmedEpcMap = new Map<string, EpcProcess>();
  for (const { epc } of epcSteps) {
    if (!confirmedEpcMap.has(epc.id)) {
      confirmedEpcMap.set(epc.id, epc);
    }
  }
  for (const epc of confirmedEpcMap.values()) {
    const steps = epc.steps ?? [];
    const lastIdx = steps.length - 1;
    for (let i = 0; i < steps.length; i++) {
      const stepElem = steps[i];
      if (!stepElem.elementRef) continue;
      if (stepElem.elementRef.dimension !== "E3") continue;
      if (i !== 0 && i !== lastIdx) {
        issues.push(
          issue(
            "VX-17",
            "info",
            `EPC「${epc.name}」步骤「${stepElem.name}」为 E3 事件步骤且位于索引 ${i}（非首位或末位），建议将事件步骤置于序列首尾`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: stepElem.id,
              dimension: "E3",
              elementId: stepElem.elementRef.elementId,
              elementName: metaById.get(stepElem.elementRef.elementId)?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-18: Draft-Confirmed 隔离 ----
  // 对每个已确认 EPC 的步骤，elementRef.elementId 必须有已确认版本（meta.confirmedVersion）
  for (const { epc, step } of epcSteps) {
    if (!step.elementRef) continue;
    const eid = step.elementRef.elementId;
    const meta = metaById.get(eid);
    if (meta && !(meta as any).confirmedVersion) {
      issues.push(
        issue(
          "VX-18",
          "warning",
          `已确认 EPC「${epc.name}」步骤「${step.name}」引用的要素「${meta.name}」仅有 draft 版本，无已确认版本`,
          scenarioId,
          {
            epcId: epc.id,
            stepId: step.id,
            dimension: step.elementRef.dimension,
            elementId: eid,
            elementName: meta.name,
          },
        ),
      );
    }
  }

  // ---- VX-19: Version pin 一致性 ----
  // 对 elementRef 有 versionPin 的步骤，检查 moduleVersionRecords 中有匹配
  // moduleKind=要素维度（E1~E8）, moduleId=elementId, version=versionPin 的记录
  for (const { epc, step } of epcSteps) {
    if (!step.elementRef) continue;
    const vPin = step.elementRef.versionPin;
    if (typeof vPin === "string" && vPin === "latest_confirmed") continue;
    if (typeof vPin === "object" && vPin.version) {
      const eid = step.elementRef.elementId;
      const pinnedVersion = vPin.version;
      const dim = step.elementRef.dimension;
      const matchVersion = records.find(
        (r) =>
          r.moduleId === eid && r.moduleKind === dim &&
          r.version === pinnedVersion,
      );
      if (!matchVersion) {
        issues.push(
          issue(
            "VX-19",
            "warning",
            `EPC「${epc.name}」步骤「${step.name}」引用的 versionPin「${pinnedVersion}」在要素「${eid}」的版本历史中不存在`,
            scenarioId,
            {
              epcId: epc.id,
              stepId: step.id,
              dimension: step.elementRef.dimension,
              elementId: eid,
              elementName: metaById.get(eid)?.name,
            },
          ),
        );
      }
    }
  }

  // ---- VX-20: usageRefs 完整性 ----
  // 检查 metaElements 中的 usageRefs 指向的 epcId 在 epcProcesses 中存在
  const epcIdSet = new Set((epcProcesses ?? []).map((e) => e.id));
  for (const meta of metaElements ?? []) {
    const refs = meta.usageRefs ?? [];
    for (const ref of refs) {
      if (!epcIdSet.has(ref.epcId)) {
        issues.push(
          issue(
            "VX-20",
            "info",
            `要素「${meta.name}」的 usageRefs 指向的 EPC「${ref.epcId}」在 epcProcesses 中不存在`,
            scenarioId,
            {
              elementId: meta.id,
              elementName: meta.name,
              epcId: ref.epcId,
              stepId: ref.stepId,
            },
          ),
        );
      }
    }
  }

  return issues;
}
