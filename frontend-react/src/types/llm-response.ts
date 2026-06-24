// ============================================================================
// LLM Structured Response Types
// Mirrors backend SYSTEM_PROMPT JSON schema (§维1-5 + EPC).
// All fields optional: AI-generated output is inherently loose.
// Index signatures allow extra LLM fields without breaking type safety.
// ============================================================================

// ---- Structural (维1) ----
export interface LLMAttribute {
  id?: string;
  name?: string;
  type?: string;
  required?: boolean;
  unique?: boolean;
  autoFill?: string;
  [k: string]: unknown;
}

export interface LLMRelation {
  source?: string;
  target?: string;
  type?: string;
  inverseOf?: string;
  domain?: string;
  range?: string;
  [k: string]: unknown;
}

export interface LLMValueObject {
  name?: string;
  fields?: string;
  [k: string]: unknown;
}

export interface LLMEntity {
  id?: string;
  name?: string;
  attributes?: LLMAttribute[];
  [k: string]: unknown;
}

export interface StructuralLLMData {
  entities?: LLMEntity[];
  relations?: LLMRelation[];
  valueObjects?: LLMValueObject[];
  [k: string]: unknown;
}

// ---- Behavioral (维2) ----
export interface LLMAction {
  id?: string;
  name?: string;
  input?: string;
  output?: string;
  domain?: string;
  [k: string]: unknown;
}

export interface LLMTransition {
  from?: string;
  to?: string;
  trigger?: string;
  [k: string]: unknown;
}

export interface LLMStateMachine {
  id?: string;
  name?: string;
  entity?: string;
  states?: string[];
  transitions?: LLMTransition[];
  [k: string]: unknown;
}

export interface LLMIndicator {
  id?: string;
  name?: string;
  formula?: string;
  target?: string;
  warningThreshold?: string;
  domain?: string;
  [k: string]: unknown;
}

export interface BehavioralLLMData {
  actions?: LLMAction[];
  stateMachines?: LLMStateMachine[];
  indicators?: LLMIndicator[];
  [k: string]: unknown;
}

// ---- Rules (维3) ----
export interface LLMValidation {
  id?: string;
  type?: string;
  entity?: string;
  field?: string;
  expression?: string;
  [k: string]: unknown;
}

export interface LLMGuardrail {
  id?: string;
  name?: string;
  condition?: string;
  action?: string;
  [k: string]: unknown;
}

export interface LLMPolicy {
  id?: string;
  name?: string;
  rules?: string;
  [k: string]: unknown;
}

export interface LLMPermission {
  role?: string;
  resource?: string;
  operations?: string;
  [k: string]: unknown;
}

export interface LLMExemption {
  id?: string;
  constraint?: string;
  reason?: string;
  [k: string]: unknown;
}

export interface LLMProbe {
  id?: string;
  name?: string;
  target?: string;
  frequency?: string;
  alertCondition?: string;
  domain?: string;
  [k: string]: unknown;
}

export interface RulesLLMData {
  validations?: LLMValidation[];
  guardrails?: LLMGuardrail[];
  policies?: LLMPolicy[];
  permissions?: LLMPermission[];
  exemptions?: LLMExemption[];
  probes?: LLMProbe[];
  [k: string]: unknown;
}

// ---- Events (维4) ----
export interface LLMEventType {
  id?: string;
  name?: string;
  severity?: string;
  source?: string;
  targetEntity?: string;
  payloadSchema?: string;
  [k: string]: unknown;
}

export interface LLMCausality {
  cause?: string;
  effect?: string;
  [k: string]: unknown;
}

export interface EventsLLMData {
  eventTypes?: LLMEventType[];
  sources?: string[];
  causalities?: LLMCausality[];
  [k: string]: unknown;
}

// ---- Interfaces (维5) ----
export interface LLMAPI {
  id?: string;
  name?: string;
  url?: string;
  method?: string;
  params?: string;
  response?: string;
  [k: string]: unknown;
}

export interface LLMQuery {
  id?: string;
  name?: string;
  type?: string;
  template?: string;
  [k: string]: unknown;
}

export interface LLMCompute {
  id?: string;
  name?: string;
  input?: string;
  output?: string;
  formula?: string;
  [k: string]: unknown;
}

export interface LLMNotification {
  id?: string;
  name?: string;
  channel?: string;
  template?: string;
  [k: string]: unknown;
}

export interface LLMReport {
  id?: string;
  name?: string;
  fields?: string;
  format?: string;
  [k: string]: unknown;
}

export interface InterfacesLLMData {
  apis?: LLMAPI[];
  queries?: LLMQuery[];
  compute?: LLMCompute[];
  notifications?: LLMNotification[];
  reports?: LLMReport[];
  [k: string]: unknown;
}

// ---- EPC (编排层) ----
export interface LLMEpcStep {
  [k: string]: unknown;
}

export interface EpcLLMData {
  steps?: LLMEpcStep[];
  [k: string]: unknown;
}

// ---- Full structured response from LLM ----
export interface LLMStructuredResponse {
  message?: string;
  structural?: StructuralLLMData;
  behavioral?: BehavioralLLMData;
  rules?: RulesLLMData;
  events?: EventsLLMData;
  interfaces?: InterfacesLLMData;
  epc?: EpcLLMData;
  [k: string]: unknown;
}
