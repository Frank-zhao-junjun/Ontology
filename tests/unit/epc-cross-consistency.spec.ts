import { describe, it, expect } from 'vitest';
import {
  validateCrossConsistency,
  VX_RULES,
  type ValidateCrossConsistencyInput,
} from '@/lib/epc-cross-consistency';
import type {
  BehaviorModel,
  Capability,
  DataSourcesModel,
  EpcProcess,
  EventModel,
  GovernanceModel,
  MetaElement,
  MetricsModel,
  ModuleVersionRecord,
  RuleModel,
  Scenario,
  ValueDomain,
} from '@/types/ontology';

const SCENARIO_ID = 'sc-1';
const EPC_ID = 'epc-1';
const NOW = '2025-01-01T00:00:00.000Z';

function makeRecord(
  moduleKind: ModuleVersionRecord['moduleKind'],
  moduleId: string,
  status: 'draft' | 'confirmed' | 'archived' = 'confirmed',
): ModuleVersionRecord {
  return {
    id: `vr-${moduleKind}-${moduleId}`,
    moduleKind,
    moduleId,
    status,
    version: 'v1',
    createdAt: NOW,
    confirmedAt: status === 'confirmed' ? NOW : undefined,
    snapshot: {},
  };
}

function makeScenario(id: string, name: string, overrides: Partial<Scenario> = {}): Scenario {
  return { id, name, parentId: 'cap-1', ...overrides };
}

function makeCapability(id: string, name: string): Capability {
  return { id, name, parentId: 'vd-1' };
}

function makeValueDomain(id: string, name: string): ValueDomain {
  return { id, name };
}

function makeMeta(
  id: string,
  dimension: MetaElement['dimension'],
  overrides: Partial<MetaElement> = {},
): MetaElement {
  return {
    id,
    name: `Element ${id}`,
    nameEn: id.toUpperCase(),
    dimension,
    ...overrides,
  };
}

function makeEpc(id: string, parentId: string, steps: EpcProcess['steps']): EpcProcess {
  return { id, name: `EPC ${id}`, parentId, steps };
}

function step(
  id: string,
  name: string,
  dimension: MetaElement['dimension'],
  elementId: string,
): EpcProcess['steps'][number] {
  return {
    id,
    name,
    elementRef: { dimension, elementId, versionPin: 'latest_confirmed' },
  };
}

function baseInput(overrides: Partial<ValidateCrossConsistencyInput> = {}): ValidateCrossConsistencyInput {
  const scenario = makeScenario(SCENARIO_ID, '测试场景');
  const epc = makeEpc(EPC_ID, SCENARIO_ID, [step('s1', '步1', 'E1', 'e1')]);
  return {
    scenarioId: SCENARIO_ID,
    scenarios: [scenario],
    capabilities: [makeCapability('cap-1', '能力')],
    valueDomains: [makeValueDomain('vd-1', '域')],
    epcProcesses: [epc],
    metaElements: [makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' })],
    moduleVersionRecords: [makeRecord('C', SCENARIO_ID), makeRecord('EPC', EPC_ID)],
    ...overrides,
  };
}

function emptyBehaviorModel(): BehaviorModel {
  return {
    id: 'bm-1',
    name: '行为',
    version: '1',
    domain: 'd1',
    stateMachines: [],
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe('epc-cross-consistency (US-S17-U02)', () => {
  describe('VX_RULES metadata', () => {
    it('should export all 10 VX rule definitions', () => {
      const ids = Object.keys(VX_RULES);
      expect(ids).toContain('VX-01');
      expect(ids).toContain('VX-06');
      expect(ids).toContain('VX-09');
      expect(ids).toContain('VX-12');
      expect(ids).toHaveLength(10);
    });

    it('VX-02 and VX-09 are error severity', () => {
      expect(VX_RULES['VX-02'].severity).toBe('error');
      expect(VX_RULES['VX-09'].severity).toBe('error');
    });

    it('VX-06 is info severity', () => {
      expect(VX_RULES['VX-06'].severity).toBe('info');
    });
  });

  describe('gate conditions', () => {
    it('returns empty for unknown scenarioId', () => {
      const issues = validateCrossConsistency(baseInput({ scenarioId: 'missing', scenarios: [] }));
      expect(issues).toHaveLength(0);
    });

    it('returns empty when C is not confirmed', () => {
      const issues = validateCrossConsistency(
        baseInput({ moduleVersionRecords: [makeRecord('EPC', EPC_ID)] }),
      );
      expect(issues).toHaveLength(0);
    });

    it('returns empty when EPC is not confirmed', () => {
      const issues = validateCrossConsistency(
        baseInput({ moduleVersionRecords: [makeRecord('C', SCENARIO_ID)] }),
      );
      expect(issues).toHaveLength(0);
    });

    it('returns empty when confirmed EPC has no element steps', () => {
      const issues = validateCrossConsistency(
        baseInput({ epcProcesses: [makeEpc(EPC_ID, SCENARIO_ID, [])] }),
      );
      expect(issues).toHaveLength(0);
    });
  });

  describe('VX-01: Action-Transition 一致', () => {
    it('flags E2 element without valid state machine binding', () => {
      const input = baseInput({
        epcProcesses: [makeEpc(EPC_ID, SCENARIO_ID, [step('s1', '提交', 'E2', 'act-1')])],
        metaElements: [makeMeta('act-1', 'E2', { name: '提交动作' })],
        behaviorModel: emptyBehaviorModel(),
      });
      const issues = validateCrossConsistency(input).filter((i) => i.code === 'VX-01');
      expect(issues).toHaveLength(1);
      expect(issues[0].elementId).toBe('act-1');
    });

    it('passes when E2 element has stateMachineId bound to existing SM', () => {
      const input = baseInput({
        epcProcesses: [makeEpc(EPC_ID, SCENARIO_ID, [step('s1', '提交', 'E2', 'act-1')])],
        metaElements: [makeMeta('act-1', 'E2', { name: '提交动作', stateMachineId: 'sm-1' })],
        behaviorModel: {
          ...emptyBehaviorModel(),
          stateMachines: [{
            id: 'sm-1',
            name: 'SM',
            entity: 'Order',
            statusField: 'status',
            states: [],
            transitions: [],
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-01')).toHaveLength(0);
    });

    it('passes when E2 action id is registered on state machine', () => {
      const input = baseInput({
        epcProcesses: [makeEpc(EPC_ID, SCENARIO_ID, [step('s1', '提交', 'E2', 'act-1')])],
        metaElements: [makeMeta('act-1', 'E2', { name: '提交动作' })],
        behaviorModel: {
          ...emptyBehaviorModel(),
          stateMachines: [{
            id: 'sm-1',
            name: 'SM',
            entity: 'Order',
            statusField: 'status',
            states: [],
            transitions: [],
            actions: [{ id: 'act-1', name: '提交', actionType: 'update' }],
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-01')).toHaveLength(0);
    });
  });

  describe('VX-02: Event-Entity 一致', () => {
    it('flags E3 event entity not in EPC E1 chain', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '订单', 'E1', 'e1'),
            step('s2', '事件', 'E3', 'ev-meta'),
          ]),
        ],
        metaElements: [
          makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' }),
          makeMeta('ev-meta', 'E3', { name: '创建事件', eventId: 'evt-1' }),
        ],
        eventModel: {
          id: 'em-1', name: '事件', version: '1', domain: 'd1',
          events: [{ id: 'evt-1', name: '创建', entity: 'Invoice', trigger: 'create', payload: [] }],
          subscriptions: [], createdAt: NOW, updatedAt: NOW,
        },
      });
      const issues = validateCrossConsistency(input).filter((i) => i.code === 'VX-02');
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('error');
    });

    it('passes when event entity matches E1 nameEn', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '订单', 'E1', 'e1'),
            step('s2', '事件', 'E3', 'ev-meta'),
          ]),
        ],
        metaElements: [
          makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' }),
          makeMeta('ev-meta', 'E3', { name: '创建事件', eventId: 'evt-1' }),
        ],
        eventModel: {
          id: 'em-1', name: '事件', version: '1', domain: 'd1',
          events: [{ id: 'evt-1', name: '创建', entity: 'Order', trigger: 'create', payload: [] }],
          subscriptions: [], createdAt: NOW, updatedAt: NOW,
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-02')).toHaveLength(0);
    });
  });

  describe('VX-03: Rule-Entity 一致', () => {
    it('flags E4 rule entity not in EPC E1 chain', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '订单', 'E1', 'e1'),
            step('s2', '规则', 'E4', 'rule-meta'),
          ]),
        ],
        metaElements: [
          makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' }),
          makeMeta('rule-meta', 'E4', { name: '校验规则' }),
        ],
        ruleModel: {
          id: 'rm-1', name: '规则', version: '1', domain: 'd1', createdAt: NOW, updatedAt: NOW,
          rules: [{
            id: 'rule-meta', name: 'R1', type: 'field_validation', entity: 'Invoice',
            condition: { type: 'expression' }, errorMessage: 'err',
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-03')).toHaveLength(1);
    });

    it('passes when rule entity matches E1 nameEn', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '订单', 'E1', 'e1'),
            step('s2', '规则', 'E4', 'rule-meta'),
          ]),
        ],
        metaElements: [
          makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' }),
          makeMeta('rule-meta', 'E4', { name: '校验规则' }),
        ],
        ruleModel: {
          id: 'rm-1', name: '规则', version: '1', domain: 'd1', createdAt: NOW, updatedAt: NOW,
          rules: [{
            id: 'rule-meta', name: 'R1', type: 'field_validation', entity: 'Order',
            condition: { type: 'expression' }, errorMessage: 'err',
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-03')).toHaveLength(0);
    });
  });

  describe('VX-04: Metric-Action 一致', () => {
    it('flags E6 metric boundActionId missing from same EPC E2 steps', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '指标', 'E6', 'm1'),
            step('s2', '动作', 'E2', 'act-other'),
          ]),
        ],
        metaElements: [
          makeMeta('m1', 'E6', { name: '耗时指标' }),
          makeMeta('act-other', 'E2', { name: '其他动作' }),
        ],
        metricsModel: {
          id: 'mm-1', name: '指标', version: '1', domain: 'd1', createdAt: NOW, updatedAt: NOW,
          metrics: [{
            id: 'm1', name: '耗时', nameEn: 'Duration', formula: '1', unit: 'ms',
            boundActionId: 'act-missing', measurementType: 'automatic',
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-04')).toHaveLength(1);
    });

    it('passes when boundActionId appears in same EPC E2 step', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '指标', 'E6', 'm1'),
            step('s2', '动作', 'E2', 'act-1'),
          ]),
        ],
        metaElements: [
          makeMeta('m1', 'E6', { name: '耗时指标' }),
          makeMeta('act-1', 'E2', { name: '提交' }),
        ],
        metricsModel: {
          id: 'mm-1', name: '指标', version: '1', domain: 'd1', createdAt: NOW, updatedAt: NOW,
          metrics: [{
            id: 'm1', name: '耗时', nameEn: 'Duration', formula: '1', unit: 'ms',
            boundActionId: 'act-1', measurementType: 'automatic',
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-04')).toHaveLength(0);
    });
  });

  describe('VX-05: DataSource-Entity 一致', () => {
    it('flags E8 datasource boundObjectTypeId not in EPC E1 chain', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '订单', 'E1', 'e1'),
            step('s2', '数据源', 'E8', 'ds1'),
          ]),
        ],
        metaElements: [
          makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' }),
          makeMeta('ds1', 'E8', { name: 'ERP源' }),
        ],
        dataSourcesModel: {
          id: 'dsm-1', createdAt: NOW, updatedAt: NOW,
          sources: [{
            id: 'ds1', name: 'ERP', type: 'api', boundObjectTypeId: 'Invoice',
            createdAt: NOW, updatedAt: NOW,
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-05')).toHaveLength(1);
    });

    it('passes when boundObjectTypeId matches E1 nameEn', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '订单', 'E1', 'e1'),
            step('s2', '数据源', 'E8', 'ds1'),
          ]),
        ],
        metaElements: [
          makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' }),
          makeMeta('ds1', 'E8', { name: 'ERP源' }),
        ],
        dataSourcesModel: {
          id: 'dsm-1', createdAt: NOW, updatedAt: NOW,
          sources: [{
            id: 'ds1', name: 'ERP', type: 'api', boundObjectTypeId: 'Order',
            createdAt: NOW, updatedAt: NOW,
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-05')).toHaveLength(0);
    });
  });

  describe('VX-06: Role-Permission 一致', () => {
    it('flags E5 role permissions not covering all E1 entities', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '订单', 'E1', 'e1'),
            step('s2', '角色', 'E5', 'role1'),
          ]),
        ],
        metaElements: [
          makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' }),
          makeMeta('role1', 'E5', { name: '审核员' }),
        ],
        governanceModel: {
          id: 'gm-1', roles: [{
            id: 'role1', name: '审核员',
            permissions: [{ objectTypeId: 'Invoice', ops: ['READ'] }],
          }],
          fieldPermissions: [], agentPolicies: [], createdAt: NOW, updatedAt: NOW,
        },
      });
      const issues = validateCrossConsistency(input).filter((i) => i.code === 'VX-06');
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('info');
    });

    it('passes when role permissions cover E1 entity', () => {
      const input = baseInput({
        epcProcesses: [
          makeEpc(EPC_ID, SCENARIO_ID, [
            step('s1', '订单', 'E1', 'e1'),
            step('s2', '角色', 'E5', 'role1'),
          ]),
        ],
        metaElements: [
          makeMeta('e1', 'E1', { name: '订单', nameEn: 'Order' }),
          makeMeta('role1', 'E5', { name: '审核员' }),
        ],
        governanceModel: {
          id: 'gm-1', roles: [{
            id: 'role1', name: '审核员',
            permissions: [{ objectTypeId: 'Order', ops: ['READ', 'WRITE'] }],
          }],
          fieldPermissions: [], agentPolicies: [], createdAt: NOW, updatedAt: NOW,
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-06')).toHaveLength(0);
    });
  });

  describe('VX-09: Intent-Action 一致', () => {
    it('flags trigger phrase with no matching E2 action', () => {
      const input = baseInput({
        scenarios: [makeScenario(SCENARIO_ID, '场景', {
          semantics: { triggerPhrases: ['未知动作'] },
        })],
        behaviorModel: {
          ...emptyBehaviorModel(),
          stateMachines: [{
            id: 'sm-1', name: 'SM', entity: 'Order', statusField: 'status', states: [], transitions: [],
            actions: [{ id: 'act-1', name: '提交', nameEn: 'Submit', actionType: 'update' }],
          }],
        },
      });
      const issues = validateCrossConsistency(input).filter((i) => i.code === 'VX-09');
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('error');
    });

    it('passes when trigger phrase matches action name', () => {
      const input = baseInput({
        scenarios: [makeScenario(SCENARIO_ID, '场景', {
          semantics: { triggerPhrases: ['提交'] },
        })],
        behaviorModel: {
          ...emptyBehaviorModel(),
          stateMachines: [{
            id: 'sm-1', name: 'SM', entity: 'Order', statusField: 'status', states: [], transitions: [],
            actions: [{ id: 'act-1', name: '提交', nameEn: 'Submit', actionType: 'update' }],
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-09')).toHaveLength(0);
    });
  });

  describe('VX-10: State-Semantics 一致', () => {
    it('flags trigger phrase not matching any E2 state', () => {
      const input = baseInput({
        scenarios: [makeScenario(SCENARIO_ID, '场景', {
          semantics: { triggerPhrases: ['不存在的状态'] },
        })],
        behaviorModel: {
          ...emptyBehaviorModel(),
          stateMachines: [{
            id: 'sm-1', name: 'SM', entity: 'Order', statusField: 'status',
            states: [{ id: 'st-1', name: '草稿' }],
            transitions: [],
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-10')).toHaveLength(1);
    });

    it('passes when trigger phrase matches state name', () => {
      const input = baseInput({
        scenarios: [makeScenario(SCENARIO_ID, '场景', {
          semantics: { triggerPhrases: ['草稿'] },
        })],
        behaviorModel: {
          ...emptyBehaviorModel(),
          stateMachines: [{
            id: 'sm-1', name: 'SM', entity: 'Order', statusField: 'status',
            states: [{ id: 'st-1', name: '草稿' }],
            transitions: [],
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-10')).toHaveLength(0);
    });
  });

  describe('VX-11: Compensation-Action 一致', () => {
    it('flags E7 compensation referencing missing action', () => {
      const input = baseInput({
        epcProcesses: [makeEpc(EPC_ID, SCENARIO_ID, [step('s1', '补偿', 'E7', 'c1')])],
        metaElements: [makeMeta('c1', 'E7', { name: '补偿约束', constraintType: 'compensation' })],
        behaviorModel: {
          ...emptyBehaviorModel(),
          stateMachines: [{
            id: 'sm-1', name: 'SM', entity: 'Order', statusField: 'status', states: [], transitions: [],
          }],
          transactionBoundaries: [{
            id: 'tb-1', name: '边界', nameEn: 'TB', actionIds: [], aggregateRootIds: [],
            isolation: 'read_committed', compensationActionId: 'missing-act',
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-11')).toHaveLength(1);
    });

    it('passes when compensation action exists in behavior model', () => {
      const input = baseInput({
        epcProcesses: [makeEpc(EPC_ID, SCENARIO_ID, [step('s1', '补偿', 'E7', 'c1')])],
        metaElements: [makeMeta('c1', 'E7', { name: '补偿约束', constraintType: 'compensation' })],
        behaviorModel: {
          ...emptyBehaviorModel(),
          stateMachines: [{
            id: 'sm-1', name: 'SM', entity: 'Order', statusField: 'status', states: [], transitions: [],
            actions: [{ id: 'act-undo', name: '撤销', actionType: 'update' }],
          }],
          transactionBoundaries: [{
            id: 'tb-1', name: '边界', nameEn: 'TB', actionIds: [], aggregateRootIds: [],
            isolation: 'read_committed', compensationActionId: 'act-undo',
          }],
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-11')).toHaveLength(0);
    });
  });

  describe('VX-12: Policy-Role 一致', () => {
    it('flags E5 role with hasPolicy but no AgentPolicy', () => {
      const input = baseInput({
        epcProcesses: [makeEpc(EPC_ID, SCENARIO_ID, [step('s1', '角色', 'E5', 'role1')])],
        metaElements: [makeMeta('role1', 'E5', { name: 'Agent角色', hasPolicy: true })],
        governanceModel: {
          id: 'gm-1',
          roles: [{ id: 'role1', name: 'Agent角色', permissions: [] }],
          fieldPermissions: [],
          agentPolicies: [],
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-12')).toHaveLength(1);
    });

    it('passes when AgentPolicy exists for role', () => {
      const input = baseInput({
        epcProcesses: [makeEpc(EPC_ID, SCENARIO_ID, [step('s1', '角色', 'E5', 'role1')])],
        metaElements: [makeMeta('role1', 'E5', { name: 'Agent角色', hasPolicy: true })],
        governanceModel: {
          id: 'gm-1',
          roles: [{ id: 'role1', name: 'Agent角色', permissions: [] }],
          fieldPermissions: [],
          agentPolicies: [{ id: 'ap-1', roleId: 'role1' }],
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
      expect(validateCrossConsistency(input).filter((i) => i.code === 'VX-12')).toHaveLength(0);
    });
  });
});
