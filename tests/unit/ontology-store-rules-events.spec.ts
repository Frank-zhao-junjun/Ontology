import { describe, expect, it, beforeEach } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Rule, RuleModel, EventDefinition, EventModel, Subscription, Entity } from '@/types/ontology';

const mockDomain = { id: 'domain-1', name: '合同管理', nameEn: 'ContractManagement', description: '合同管理领域' };

function resetStore() {
  useOntologyStore.setState({
    project: null,
    activeModelType: null,
    metadataList: [],
  });
}

/** Minimal entity that passes ensureRuleDefinitionRules checks */
const mockEntity: Entity = {
  id: 'entity-1',
  name: '合同',
  nameEn: 'Contract',
  projectId: 'project-1',
  businessScenarioId: 'scenario-1',
  description: '合同实体',
  entityRole: 'aggregate_root',
  attributes: [
    { id: 'a1', name: '合同金额', nameEn: 'amount', dataType: 'decimal', required: true },
  ],
  relations: [],
};

function createProjectWithDataModel() {
  const store = useOntologyStore.getState();
  store.createProject('测试项目', mockDomain, '测试描述');
  // dataModel is null after createProject, so we must set it explicitly
  store.setDataModel({
    id: 'dm-test',
    name: 'Test Data Model',
    version: '1.0.0',
    domain: 'domain-1',
    projects: [],
    businessScenarios: [],
    entities: [mockEntity],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────
//  Rule Model
// ─────────────────────────────────────────────────────

const emptyRuleModel = (overrides: Partial<RuleModel> = {}): RuleModel => ({
  id: 'rm-1',
  name: '合同规则模型',
  version: '1.0.0',
  domain: 'domain-1',
  rules: [],
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
  ...overrides,
});

const makeRule = (id: string, overrides: Partial<Rule> = {}): Rule => ({
  id,
  name: '金额校验',
  type: 'field_validation',
  entity: 'entity-1',
  field: 'amount',
  priority: 50,
  condition: { type: 'range', min: 0, max: 100 },
  errorMessage: '金额必须在0-100之间',
  severity: 'error',
  enabled: true,
  version: '1.0.0',
  status: 'active',
  ...overrides,
});

describe('ontology-store Rule Model Operations', () => {
  beforeEach(() => {
    resetStore();
    createProjectWithDataModel();
  });

  // ── setRuleModel ──

  describe('setRuleModel', () => {
    it('sets ruleModel on project', () => {
      const model = emptyRuleModel({ rules: [makeRule('r1')] });
      useOntologyStore.getState().setRuleModel(model);
      const rm = useOntologyStore.getState().project!.ruleModel!;
      expect(rm.id).toBe('rm-1');
      expect(rm.rules).toHaveLength(1);
      expect(rm.rules[0].name).toBe('金额校验');
    });

    it('overwrites existing ruleModel', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel({ rules: [makeRule('r1')] }));
      useOntologyStore.getState().setRuleModel(emptyRuleModel({ id: 'rm-2', rules: [makeRule('r2')] }));
      const rm = useOntologyStore.getState().project!.ruleModel!;
      expect(rm.id).toBe('rm-2');
      expect(rm.rules).toHaveLength(1);
      expect(rm.rules[0].id).toBe('r2');
    });

    it('does nothing when project is null', () => {
      resetStore();
      useOntologyStore.getState().setRuleModel(emptyRuleModel());
      expect(useOntologyStore.getState().project).toBeNull();
    });
  });

  // ── addRule ──

  describe('addRule', () => {
    it('adds rule to existing ruleModel', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel());
      useOntologyStore.getState().addRule(makeRule('r1'));
      const rules = useOntologyStore.getState().project!.ruleModel!.rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('r1');
    });

    it('auto-creates ruleModel when missing', () => {
      useOntologyStore.getState().addRule(makeRule('r1'));
      const project = useOntologyStore.getState().project!;
      expect(project.ruleModel).not.toBeNull();
      expect(project.ruleModel!.rules).toHaveLength(1);
      expect(project.ruleModel!.rules[0].id).toBe('r1');
      expect(project.ruleModel!.name).toContain('合同管理');
    });

    it('sorts rules by priority ASC', () => {
      useOntologyStore.getState().addRule(makeRule('r-high', { priority: 90 }));
      useOntologyStore.getState().addRule(makeRule('r-low', { priority: 10 }));
      useOntologyStore.getState().addRule(makeRule('r-mid', { priority: 50 }));
      const rules = useOntologyStore.getState().project!.ruleModel!.rules;
      expect(rules.map((r) => r.priority)).toEqual([10, 50, 90]);
      expect(rules.map((r) => r.id)).toEqual(['r-low', 'r-mid', 'r-high']);
    });

    it('uses default priority 100 when priority is not finite', () => {
      useOntologyStore.getState().addRule(makeRule('r1', { priority: undefined as unknown as number }));
      useOntologyStore.getState().addRule(makeRule('r2', { priority: 50 }));
      const rules = useOntologyStore.getState().project!.ruleModel!.rules;
      // r1 gets priority 100 (normalized), r2 has 50 => r2 first
      expect(rules[0].id).toBe('r2');
      expect(rules[1].id).toBe('r1');
    });

    it('applies default version and status', () => {
      useOntologyStore.getState().addRule(makeRule('r1', { version: undefined, status: undefined }));
      const rule = useOntologyStore.getState().project!.ruleModel!.rules[0];
      expect(rule.version).toBe('1.0.0');
      expect(rule.status).toBe('active');
    });

    it('is a no-op when project is null', () => {
      resetStore();
      useOntologyStore.getState().addRule(makeRule('r1'));
      expect(useOntologyStore.getState().project).toBeNull();
    });

    it('normalizes rule via ensureRuleDefinitionRules', () => {
      useOntologyStore.getState().addRule(makeRule('r1', {
        name: '  金额校验  ',
        errorMessage: '  校验失败  ',
        enabled: undefined as unknown as boolean,
        description: '  描述  ',
      }));
      const rule = useOntologyStore.getState().project!.ruleModel!.rules[0];
      expect(rule.name).toBe('金额校验');       // trimmed
      expect(rule.errorMessage).toBe('校验失败'); // trimmed
      expect(rule.enabled).toBe(true);             // default
      expect(rule.description).toBe('描述');       // trimmed
    });

    it('throws for empty rule name', () => {
      expect(() => {
        useOntologyStore.getState().addRule(makeRule('r1', { name: '  ' }));
      }).toThrow('规则名称不能为空');
    });

    it('throws when rule does not reference a valid entity', () => {
      expect(() => {
        useOntologyStore.getState().addRule(makeRule('r1', { entity: 'nonexistent' }));
      }).toThrow('规则必须绑定到有效实体');
    });

    it('throws for cross_field_validation with fewer than 2 fields', () => {
      expect(() => {
        useOntologyStore.getState().addRule(makeRule('r1', {
          type: 'cross_field_validation',
          condition: { type: 'expression', fields: ['amount'], expression: 'a > b' },
        }));
      }).toThrow('跨字段校验至少需要两个字段');
    });

    it('throws for cross_field_validation without expression', () => {
      expect(() => {
        useOntologyStore.getState().addRule(makeRule('r1', {
          type: 'cross_field_validation',
          condition: { type: 'expression', fields: ['amount', 'quantity'], expression: '  ' },
        }));
      }).toThrow('跨字段校验必须提供表达式');
    });

    it('throws for field_validation without field', () => {
      expect(() => {
        useOntologyStore.getState().addRule(makeRule('r1', { field: '  ' }));
      }).toThrow('字段级校验必须绑定字段');
    });
  });

  // ── updateRule ──

  describe('updateRule', () => {
    it('updates rule properties', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel({ rules: [makeRule('r1')] }));
      useOntologyStore.getState().updateRule('r1', makeRule('r1', { name: '更新后的校验' }));
      const rule = useOntologyStore.getState().project!.ruleModel!.rules[0];
      expect(rule.name).toBe('更新后的校验');
    });

    it('preserves version and status when not provided in update', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel({
        rules: [makeRule('r1', { version: '2.0.0', status: 'draft' })],
      }));
      useOntologyStore.getState().updateRule('r1', makeRule('r1', { name: '更新', version: undefined, status: undefined }));
      const rule = useOntologyStore.getState().project!.ruleModel!.rules[0];
      expect(rule.version).toBe('2.0.0');
      expect(rule.status).toBe('draft');
    });

    it('updates version and status when explicitly provided', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel({ rules: [makeRule('r1')] }));
      useOntologyStore.getState().updateRule('r1', makeRule('r1', { version: '3.0.0', status: 'deprecated' }));
      const rule = useOntologyStore.getState().project!.ruleModel!.rules[0];
      expect(rule.version).toBe('3.0.0');
      expect(rule.status).toBe('deprecated');
    });

    it('re-sorts rules after update', () => {
      useOntologyStore.getState().addRule(makeRule('r1', { priority: 10 }));
      useOntologyStore.getState().addRule(makeRule('r2', { priority: 50 }));
      useOntologyStore.getState().addRule(makeRule('r3', { priority: 90 }));
      // Change r3 priority to 5
      useOntologyStore.getState().updateRule('r3', makeRule('r3', { priority: 5 }));
      const rules = useOntologyStore.getState().project!.ruleModel!.rules;
      expect(rules[0].id).toBe('r3');
      expect(rules[0].priority).toBe(5);
    });

    it('is a no-op when ruleModel is missing', () => {
      useOntologyStore.getState().updateRule('r1', makeRule('r1', { name: '更新' }));
      // no crash, project unchanged
      expect(useOntologyStore.getState().project!.ruleModel).toBeNull();
    });

    it('is a no-op when ruleModel exists but ruleId does not exist', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel({ rules: [makeRule('r1')] }));
      useOntologyStore.getState().updateRule('nonexistent', makeRule('nonexistent', { name: '更新' }));
      const rules = useOntologyStore.getState().project!.ruleModel!.rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('r1');
    });
  });

  // ── deleteRule ──

  describe('deleteRule', () => {
    it('removes rule by id', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel({
        rules: [makeRule('r1'), makeRule('r2')],
      }));
      useOntologyStore.getState().deleteRule('r1');
      const rules = useOntologyStore.getState().project!.ruleModel!.rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('r2');
    });

    it('is a no-op when ruleModel is null', () => {
      useOntologyStore.getState().deleteRule('r1');
      expect(useOntologyStore.getState().project!.ruleModel).toBeNull();
    });

    it('is a no-op when ruleId does not exist', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel({ rules: [makeRule('r1')] }));
      useOntologyStore.getState().deleteRule('nonexistent');
      expect(useOntologyStore.getState().project!.ruleModel!.rules).toHaveLength(1);
    });

    it('removes last rule leaving empty array', () => {
      useOntologyStore.getState().setRuleModel(emptyRuleModel({ rules: [makeRule('r1')] }));
      useOntologyStore.getState().deleteRule('r1');
      expect(useOntologyStore.getState().project!.ruleModel!.rules).toEqual([]);
    });
  });
});

// ─────────────────────────────────────────────────────
//  Event Model
// ─────────────────────────────────────────────────────

const emptyEventModel = (overrides: Partial<EventModel> = {}): EventModel => ({
  id: 'em-1',
  name: '合同事件模型',
  version: '1.0.0',
  domain: 'domain-1',
  events: [],
  subscriptions: [],
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
  ...overrides,
});

const makeEvent = (id: string, overrides: Partial<EventDefinition> = {}): EventDefinition => ({
  id,
  name: '合同已创建',
  nameEn: 'ContractCreated',
  entity: 'entity-1',
  trigger: 'create',
  payload: [{ field: 'amount' }],
  description: '合同创建事件',
  ...overrides,
});

const makeSubscription = (id: string, overrides: Partial<Subscription> = {}): Subscription => ({
  id,
  name: '同步到ERP',
  eventId: 'ev-1',
  handler: 'sync',
  action: 'webhook',
  actionRef: 'https://erp.example.com/webhook',
  description: '同步合同到ERP',
  ...overrides,
});

describe('ontology-store Event Model Operations', () => {
  beforeEach(() => {
    resetStore();
    createProjectWithDataModel();
  });

  // ── setEventModel ──

  describe('setEventModel', () => {
    it('sets eventModel on project', () => {
      const model = emptyEventModel({ events: [makeEvent('ev-1')] });
      useOntologyStore.getState().setEventModel(model);
      const em = useOntologyStore.getState().project!.eventModel!;
      expect(em.id).toBe('em-1');
      expect(em.events).toHaveLength(1);
      expect(em.events[0].name).toBe('合同已创建');
    });

    it('overwrites existing eventModel', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      useOntologyStore.getState().setEventModel(emptyEventModel({ id: 'em-2', events: [makeEvent('ev-2')] }));
      expect(useOntologyStore.getState().project!.eventModel!.id).toBe('em-2');
    });

    it('does nothing when project is null', () => {
      resetStore();
      useOntologyStore.getState().setEventModel(emptyEventModel());
      expect(useOntologyStore.getState().project).toBeNull();
    });
  });

  // ── addEventDefinition ──

  describe('addEventDefinition', () => {
    it('adds event to existing eventModel', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel());
      useOntologyStore.getState().addEventDefinition(makeEvent('ev-1'));
      const events = useOntologyStore.getState().project!.eventModel!.events;
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('ev-1');
    });

    it('auto-creates eventModel when missing', () => {
      useOntologyStore.getState().addEventDefinition(makeEvent('ev-1'));
      const project = useOntologyStore.getState().project!;
      expect(project.eventModel).not.toBeNull();
      expect(project.eventModel!.events).toHaveLength(1);
      expect(project.eventModel!.events[0].id).toBe('ev-1');
      expect(project.eventModel!.name).toContain('合同管理');
    });

    it('normalizes event via ensureEventDefinitionRules', () => {
      useOntologyStore.getState().addEventDefinition(makeEvent('ev-1', {
        condition: '  条件  ',
        transactionPhase: undefined as unknown as 'AFTER_COMMIT' | 'BEFORE_COMMIT',
        payload: [
          { field: '  amount  ', path: '  /data/amount  ' },
          { field: '' },
        ],
      }));
      const ev = useOntologyStore.getState().project!.eventModel!.events[0];
      expect(ev.condition).toBe('条件');           // trimmed
      expect(ev.transactionPhase).toBe('AFTER_COMMIT'); // default
      expect(ev.payload[0].field).toBe('amount');  // trimmed
      expect(ev.payload[0].path).toBe('/data/amount'); // trimmed
      // Empty-field payload item filtered out
      expect(ev.payload).toHaveLength(1);
      expect(ev.entityRole).toBe('aggregate_root');
      expect(ev.entityIsAggregateRoot).toBe(true);
    });

    it('inserts default payload [{ field: "id" }] when payload is empty after normalization', () => {
      useOntologyStore.getState().addEventDefinition(makeEvent('ev-1', {
        payload: [{ field: '  ' }],
      }));
      const ev = useOntologyStore.getState().project!.eventModel!.events[0];
      expect(ev.payload).toEqual([{ field: 'id' }]);
    });

    it('throws for event name without past tense 已', () => {
      expect(() => {
        useOntologyStore.getState().addEventDefinition(makeEvent('ev-1', { name: '合同创建' }));
      }).toThrow('领域事件名称应使用过去式');
    });

    it('throws when entity is not aggregate_root', () => {
      // Change entity to a non-aggregate-root entity
      const store = useOntologyStore.getState();
      store.setDataModel({
        id: 'dm-test', name: 'Test', version: '1.0.0', domain: 'domain-1',
        projects: [], businessScenarios: [],
        entities: [{
          ...mockEntity,
          id: 'entity-child',
          entityRole: 'child_entity' as const,
          parentAggregateId: 'entity-1',
        }],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      expect(() => {
        useOntologyStore.getState().addEventDefinition(makeEvent('ev-1', { entity: 'entity-child' }));
      }).toThrow('只有聚合根可以定义领域事件');
    });

    it('throws for state_change trigger without condition', () => {
      expect(() => {
        useOntologyStore.getState().addEventDefinition(makeEvent('ev-1', {
          trigger: 'state_change',
          condition: '  ',
        }));
      }).toThrow('状态变更事件必须定义触发条件');
    });

    it('is a no-op when project is null', () => {
      resetStore();
      useOntologyStore.getState().addEventDefinition(makeEvent('ev-1'));
      expect(useOntologyStore.getState().project).toBeNull();
    });
  });

  // ── updateEventDefinition ──

  describe('updateEventDefinition', () => {
    it('updates event definition properties', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      useOntologyStore.getState().updateEventDefinition('ev-1', makeEvent('ev-1', { name: '合同已修改' }));
      const ev = useOntologyStore.getState().project!.eventModel!.events[0];
      expect(ev.name).toBe('合同已修改');
    });

    it('normalizes event during update (payload trimmed, name preserved)', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      useOntologyStore.getState().updateEventDefinition('ev-1', makeEvent('ev-1', {
        name: '  合同已更新  ',
        payload: [{ field: '  field1  ' }],
      }));
      const ev = useOntologyStore.getState().project!.eventModel!.events[0];
      // ensureEventDefinitionRules spreads the original event without trimming name
      expect(ev.name).toBe('  合同已更新  ');
      expect(ev.payload[0].field).toBe('field1');
    });

    it('is a no-op when eventModel is missing', () => {
      useOntologyStore.getState().updateEventDefinition('ev-1', makeEvent('ev-1', { name: '合同已修改' }));
      expect(useOntologyStore.getState().project!.eventModel).toBeNull();
    });

    it('is a no-op when eventId does not exist', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      useOntologyStore.getState().updateEventDefinition('nonexistent', makeEvent('nonexistent', { name: '合同已修改' }));
      expect(useOntologyStore.getState().project!.eventModel!.events).toHaveLength(1);
      expect(useOntologyStore.getState().project!.eventModel!.events[0].id).toBe('ev-1');
    });
  });

  // ── deleteEventDefinition ──

  describe('deleteEventDefinition', () => {
    it('removes event by id', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({
        events: [makeEvent('ev-1'), makeEvent('ev-2')],
      }));
      useOntologyStore.getState().deleteEventDefinition('ev-1');
      const events = useOntologyStore.getState().project!.eventModel!.events;
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('ev-2');
    });

    it('is a no-op when eventModel is null', () => {
      useOntologyStore.getState().deleteEventDefinition('ev-1');
      expect(useOntologyStore.getState().project!.eventModel).toBeNull();
    });

    it('is a no-op when eventId does not exist', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      useOntologyStore.getState().deleteEventDefinition('nonexistent');
      expect(useOntologyStore.getState().project!.eventModel!.events).toHaveLength(1);
    });

    it('removes last event leaving empty array', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      useOntologyStore.getState().deleteEventDefinition('ev-1');
      expect(useOntologyStore.getState().project!.eventModel!.events).toEqual([]);
    });
  });

  // ── addSubscription ──

  describe('addSubscription', () => {
    it('adds subscription to existing eventModel with events', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      useOntologyStore.getState().addSubscription(makeSubscription('sub-1'));
      const subs = useOntologyStore.getState().project!.eventModel!.subscriptions;
      expect(subs).toHaveLength(1);
      expect(subs[0].id).toBe('sub-1');
      expect(subs[0].name).toBe('同步到ERP');
    });

    it('fails validation when eventModel is null (no events to reference)', () => {
      // ensureSubscriptionRules checks stateProject.eventModel.events which is [] when null
      useOntologyStore.setState({
        project: useOntologyStore.getState().project
          ? { ...useOntologyStore.getState().project!, eventModel: null }
          : null,
      });
      expect(() => {
        useOntologyStore.getState().addSubscription(makeSubscription('sub-1'));
      }).toThrow('订阅必须引用已定义的事件');
    });

    it('validates async subscriptions require retryPolicy', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      expect(() => {
        useOntologyStore.getState().addSubscription(makeSubscription('sub-1', {
          handler: 'async',
          retryPolicy: undefined as unknown as Subscription['retryPolicy'],
        }));
      }).toThrow('异步订阅必须配置重试策略');
    });

    it('normalizes subscription via ensureSubscriptionRules', () => {
      useOntologyStore.getState().setEventModel(emptyEventModel({ events: [makeEvent('ev-1')] }));
      useOntologyStore.getState().addSubscription(makeSubscription('sub-1', {
        name: '  同步到ERP  ',
        actionRef: '  https://erp.example.com/webhook  ',
        description: '  描述  ',
      }));
      const sub = useOntologyStore.getState().project!.eventModel!.subscriptions[0];
      expect(sub.name).toBe('同步到ERP');
      expect(sub.actionRef).toBe('https://erp.example.com/webhook');
      expect(sub.description).toBe('描述');
    });

    it('is a no-op when project is null', () => {
      resetStore();
      useOntologyStore.getState().addSubscription(makeSubscription('sub-1'));
      expect(useOntologyStore.getState().project).toBeNull();
    });
  });
});
