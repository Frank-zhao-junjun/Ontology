import type { ModuleKind } from '@/types/ontology';

export type EpcWarningRuleId =
  | 'W-EPC-01'
  | 'W-EPC-02'
  | 'W-EPC-03'
  | 'W-EPC-04'
  | 'W-EPC-05';

export const EPC_WARNING_RULES: EpcWarningRuleId[] = [
  'W-EPC-01',
  'W-EPC-02',
  'W-EPC-03',
  'W-EPC-04',
  'W-EPC-05',
];

export interface EpcWarning {
  id: string;
  ruleId: EpcWarningRuleId;
  level: 'warning';
  message: string;
  moduleKind: ModuleKind;
  moduleId: string;
  elementId?: string;
  epcId?: string;
  stepId?: string;
}

export interface LintBusinessEpcInput {
  moduleVersionRecords: import('@/types/ontology').ModuleVersionRecord[];
  scenarios?: import('@/types/ontology').Scenario[];
  epcProcesses?: import('@/types/ontology').EpcProcess[];
  metaElements?: import('@/types/ontology').MetaElement[];
}
