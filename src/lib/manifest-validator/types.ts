/**
 * OntologyManifest 类型（对齐 ontology-manifest-spec.md）
 */

export const ONTOLOGY_MANIFEST_KIND = 'OntologyManifest' as const;

export const SUPPORTED_API_VERSIONS = ['ontology.platform/v1'] as const;

export type SupportedApiVersion = (typeof SUPPORTED_API_VERSIONS)[number];

export type ObjectTypeKind = 'aggregate_root' | 'entity' | 'value_object';

export type ManifestValidationCode =
  | 'V01'
  | 'V02'
  | 'V03'
  | 'V04'
  | 'V05'
  | 'V06'
  | 'V07'
  | 'V08'
  | 'V09'
  | 'V10'
  | 'V11'
  | 'STRUCTURE';

export type ManifestValidationSeverity = 'error' | 'warning';

export interface ManifestValidationIssue {
  code: ManifestValidationCode;
  severity: ManifestValidationSeverity;
  elementType: string;
  id?: string;
  field?: string;
  message: string;
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: ManifestValidationIssue[];
  warnings: ManifestValidationIssue[];
}

export interface OntologyManifestMetadata {
  id: string;
  version: string;
  name: string;
  displayName?: string;
  description?: string;
  boundedContext: string;
  domainTags?: string[];
  compiledAt?: string;
  compiledBy?: string;
  source?: 'ontology-designer' | 'ontology-platform';
  status?: string;
}

export interface ManifestProperty {
  id: string;
  name?: string;
  nameEn: string;
  dataType: string;
  required?: boolean;
  reference?: Record<string, unknown>;
  valueObjectRef?: string;
  sensitive?: boolean;
}

export interface ManifestObjectType {
  id: string;
  name?: string;
  nameEn?: string;
  kind: ObjectTypeKind;
  aggregateRootId?: string;
  properties?: ManifestProperty[];
  relations?: Array<{ id: string; sourceObjectTypeId?: string; targetObjectTypeId?: string }>;
}

export interface ManifestState {
  name?: string;
  code?: string;
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface ManifestStateMachine {
  id: string;
  name?: string;
  objectTypeId?: string;
  states?: ManifestState[];
}

export interface ManifestAction {
  id: string;
  name?: string;
  nameEn?: string;
  aggregateRootId: string;
  preRuleIds?: string[];
  publishesEventIds?: string[];
}

export interface ManifestRule {
  id: string;
  name?: string;
  type?: string;
  version?: string;
  status?: string;
  grayscale?: { enabled: boolean; percentage: number; targetScenarioIds?: string[] };
  effectiveFrom?: string;
  effectiveUntil?: string;
  expression?: unknown;
  errorMessage?: string;
  enabled?: boolean;
}

export interface ManifestDomainEvent {
  id: string;
  name?: string;
  nameEn: string;
  aggregateRootId?: string;
  triggerActionId?: string;
}

export interface ManifestValueObject {
  id: string;
  name?: string;
  nameEn?: string;
  properties?: ManifestProperty[];
}

export interface ManifestEnumValue {
  id: string;
  name?: string;
  nameEn: string;
  description?: string;
}

export interface ManifestEnumDef {
  id: string;
  name?: string;
  nameEn: string;
  combinationPolicy: string;
  values: ManifestEnumValue[];
  description?: string;
}

export interface OntologyManifestSemantic {
  boundedContext?: Record<string, unknown>;
  businessScenarios?: Array<{ id: string }>;
  objectTypes?: ManifestObjectType[];
  valueObjects?: ManifestValueObject[];
  enumDefs?: ManifestEnumDef[];
  stateMachines?: ManifestStateMachine[];
}

export interface ManifestMetric {
  id: string;
  name?: string;
  nameEn: string;
  formula: string;
  unit: string;
  boundActionId: string;
  measurementType: string;
  targetValue?: number;
  dataSourceRef?: string;
}

export interface ManifestTransactionBoundary {
  id: string;
  name?: string;
  nameEn: string;
  actionIds: string[];
  aggregateRootIds: string[];
  isolation: string;
  compensationActionId?: string;
  description?: string;
}

export interface ManifestSideEffect {
  id: string;
  type: string;
  description?: string;
  async: boolean;
  actionId?: string;
  retryPolicy?: { maxAttempts: number; backoffMs: number };
  config?: Record<string, unknown>;
}

export interface OntologyManifestBehavior {
  actions?: ManifestAction[];
  rules?: ManifestRule[];
  metrics?: ManifestMetric[];
  transactionBoundaries?: ManifestTransactionBoundary[];
  sideEffects?: ManifestSideEffect[];
}

export interface ManifestEventSourcingConfig {
  id: string;
  snapshotInterval: number;
  retentionDays: number;
  storeType: string;
  description?: string;
}

export interface ManifestDeadLetterPolicy {
  id: string;
  name: string;
  nameEn?: string;
  maxRetries: number;
  queue: string;
  onExhausted: string;
  description?: string;
}

export interface ManifestEventHandler {
  id: string;
  eventId?: string;
  actionRef?: string;
  deadLetterPolicyId?: string;
}

export interface OntologyManifestEvents {
  domainEvents?: ManifestDomainEvent[];
  integrationEvents?: Array<{ id: string }>;
  routes?: Array<{ id: string }>;
  handlers?: ManifestEventHandler[];
  eventStore?: Record<string, unknown>;
  eventSourcingConfig?: ManifestEventSourcingConfig;
  deadLetterPolicies?: ManifestDeadLetterPolicy[];
}

export interface ManifestDataMaskingPolicy {
  id: string;
  name: string;
  nameEn?: string;
  strategy: string;
  fieldPaths: string[];
  allowedRoleIds: string[];
  description?: string;
}

export interface ManifestComplianceRule {
  id: string;
  name: string;
  nameEn?: string;
  standard: string;
  ruleRef: string;
  affectedObjectTypeIds: string[];
  enforcement: string;
  description?: string;
}

export interface OntologyManifestGovernance {
  roles?: Array<{ id: string; name?: string; permissions?: unknown[] }>;
  fieldPermissions?: Array<{ objectTypeId: string; propertyNameEn: string; allowedRoleIds?: string[] }>;
  agentPolicies?: Array<{ id: string; roleId?: string }>;
  dataMaskingPolicies?: ManifestDataMaskingPolicy[];
  complianceRules?: ManifestComplianceRule[];
}

export interface OntologyManifestSpec {
  semantic?: OntologyManifestSemantic;
  behavior?: OntologyManifestBehavior;
  events?: OntologyManifestEvents;
  governance?: OntologyManifestGovernance;
  dataSources?: Array<Record<string, unknown>>;
}

export interface OntologyManifest {
  apiVersion: string;
  kind: typeof ONTOLOGY_MANIFEST_KIND;
  metadata: OntologyManifestMetadata;
  spec: OntologyManifestSpec;
}
