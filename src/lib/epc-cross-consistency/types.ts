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
  | "VX-07" | "VX-08"
  | "VX-09" | "VX-10" | "VX-11" | "VX-12"
  | "VX-13" | "VX-14" | "VX-15" | "VX-16" | "VX-17" | "VX-18" | "VX-19" | "VX-20";

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
  "VX-07": { severity: "warning", label: "Dept-Role 一致" },
  "VX-08": { severity: "warning", label: "Position-Role 一致" },
  "VX-09": { severity: "error", label: "Intent-Action 一致" },
  "VX-10": { severity: "warning", label: "State-Semantics 一致" },
  "VX-11": { severity: "warning", label: "Compensation-Action 一致" },
  "VX-12": { severity: "warning", label: "Policy-Role 一致" },
  "VX-13": { severity: "warning", label: "EPC-C 挂接一致" },
  "VX-14": { severity: "warning", label: "C-B 挂接一致" },
  "VX-15": { severity: "warning", label: "B-A 挂接一致" },
  "VX-16": { severity: "error", label: "Element 维度一致" },
  "VX-17": { severity: "info", label: "Step 顺序合理性" },
  "VX-18": { severity: "warning", label: "Draft-Confirmed 隔离" },
  "VX-19": { severity: "warning", label: "Version pin 一致性" },
  "VX-20": { severity: "info", label: "usageRefs 完整性" },
};
