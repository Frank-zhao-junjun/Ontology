import type {
  MetaDimension,
  MetaElement,
  EpcProcess,
  Scenario,
  ModuleVersionRecord,
  BehaviorModel,
  EventModel,
  RuleModel,
  MetricsModel,
  DataSourcesModel,
  GovernanceModel,
  Capability,
  ValueDomain,
} from "@/types/ontology";

export type VxRuleId =
  | "VX-01" | "VX-02" | "VX-03" | "VX-04" | "VX-05" | "VX-06"
  | "VX-09" | "VX-10" | "VX-11" | "VX-12";

export type VxSeverity = "error" | "warning" | "info";

export interface CrossConsistencyIssue {
  code: VxRuleId;
  severity: VxSeverity;
  message: string;
  scenarioId: string;
  epcId?: string;
  stepId?: string;
  dimension?: MetaDimension;
  elementId?: string;
  elementName?: string;
}

export interface ValidateCrossConsistencyInput {
  scenarioId: string;
  scenarios: Scenario[];
  capabilities: Capability[];
  valueDomains: ValueDomain[];
  epcProcesses: EpcProcess[];
  metaElements: MetaElement[];
  moduleVersionRecords: ModuleVersionRecord[];
  behaviorModel?: BehaviorModel | null;
  eventModel?: EventModel | null;
  ruleModel?: RuleModel | null;
  metricsModel?: MetricsModel | null;
  dataSourcesModel?: DataSourcesModel | null;
  governanceModel?: GovernanceModel | null;
}

/** All VX rule severity definitions */
export const VX_RULES: Record<VxRuleId, { severity: VxSeverity; label: string }> = {
  "VX-01": { severity: "warning", label: "Action-Transition 一致" },
  "VX-02": { severity: "error", label: "Event-Entity 一致" },
  "VX-03": { severity: "warning", label: "Rule-Entity 一致" },
  "VX-04": { severity: "warning", label: "Metric-Action 一致" },
  "VX-05": { severity: "warning", label: "DataSource-Entity 一致" },
  "VX-06": { severity: "info", label: "Role-Permission 一致" },
  "VX-09": { severity: "error", label: "Intent-Action 一致" },
  "VX-10": { severity: "warning", label: "State-Semantics 一致" },
  "VX-11": { severity: "warning", label: "Compensation-Action 一致" },
  "VX-12": { severity: "warning", label: "Policy-Role 一致" },
};
