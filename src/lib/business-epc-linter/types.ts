import type { ModuleKind } from '@/types/ontology';

export type EpcWarningRuleId =
  | 'W-EPC-01'
  | 'W-EPC-02'
  | 'W-EPC-03'
  | 'W-EPC-04'
  | 'W-EPC-05'
  | 'W-EPC-06'
  | 'W-EPC-07'
  | 'W-EPC-08'
  | 'W-EPC-09'
  | 'W-EPC-10'
  | 'W-EPC-11'
  | 'W-EPC-12'
  | 'W-EPC-13'
  | 'W-EPC-14'
  | 'W-EPC-15'
  | 'W-EPC-16'
  | 'W-EPC-17';

export const EPC_WARNING_RULES: EpcWarningRuleId[] = [
  'W-EPC-01',
  'W-EPC-02',
  'W-EPC-03',
  'W-EPC-04',
  'W-EPC-05',
  'W-EPC-06',
  'W-EPC-07',
  'W-EPC-08',
  'W-EPC-09',
  'W-EPC-10',
  'W-EPC-11',
  'W-EPC-12',
  'W-EPC-13',
  'W-EPC-14',
  'W-EPC-15',
  'W-EPC-16',
  'W-EPC-17',
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
