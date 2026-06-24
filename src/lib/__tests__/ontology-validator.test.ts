import { describe, it, expect } from 'vitest';
import { validateLifecycle, validateAgentSemanticLayer, validateAll, validateEpcCrossModel } from '../ontology-validator';
import type { OntologyProject } from '@/types/ontology';

function makeBaseProject(): OntologyProject {
  return {
    id: 'p1',
    name: 'Test',
    domain: { id: 'd1', name: 'Test', nameEn: 'test', description: '' },
    dataModel: {
      id: 'dm1', name: 'DM', version: '1.0', domain: 'd1',
      projects: [], businessScenarios: [],
      entities: [{
        id: 'e1', name: '订单', nameEn: 'Order', projectId: '', businessScenarioId: '',
        entityRole: 'aggregate_root',
        attributes: [
          { id: 'a1', name: '状态', nameEn: 'status', dataType: 'string' },
          { id: 'a2', name: '金额', nameEn: 'amount', dataType: 'decimal' },
        ],
        relations: [],
      }],
      createdAt: '', updatedAt: '',
    },
    behaviorModel: {
      id: 'bm1', name: 'BM', version: '1.0', domain: 'd1',
      stateMachines: [{
        id: 'sm1', name: '订单生命周期', entity: 'e1', statusField: 'status',
        states: [
          { id: 's1', name: '草稿', isInitial: true },
          { id: 's2', name: '已提交' },
          { id: 's3', name: '已完成', isFinal: true },
        ],
        transitions: [
          { id: 't1', name: '提交', from: 's1', to: 's2', trigger: 'manual' },
          { id: 't2', name: '完成', from: 's2', to: 's3', trigger: 'manual' },
        ],
      }],
      actions: [{ id: 'act1', name: '创建订单', actionType: 'create', targetEntityId: 'e1' }],
      createdAt: '', updatedAt: '',
    },
    ruleModel: { id: 'rm1', name: 'RM', version: '1.0', domain: 'd1', rules: [], createdAt: '', updatedAt: '' },
    processModel: null,
    eventModel: { id: 'em1', name: 'EM', version: '1.0', domain: 'd1', events: [], subscriptions: [], createdAt: '', updatedAt: '' },
    governanceModel: { id: 'gm1', roles: [], fieldPermissions: [], agentPolicies: [], createdAt: '', updatedAt: '' },
    createdAt: '', updatedAt: '',
  };
}

describe('validateLifecycle', () => {
  it('returns empty for valid lifecycle', () => {
    const project = makeBaseProject();
    const issues = validateLifecycle(project, 'e1');
    expect(issues).toHaveLength(0);
  });

  it('V-LC-01: warns non-final state without outgoing transition', () => {
    const project = makeBaseProject();
    project.behaviorModel!.stateMachines[0].transitions = []; // remove all transitions
    const issues = validateLifecycle(project, 'e1');
    expect(issues.some((i) => i.code === 'V-LC-01')).toBe(true);
  });

  it('V-LC-02: warns non-initial state without incoming transition', () => {
    const project = makeBaseProject();
    // Remove the transition to s2
    project.behaviorModel!.stateMachines[0].transitions = [
      { id: 't1', name: '提交', from: 's1', to: 's3', trigger: 'manual' },
    ];
    const issues = validateLifecycle(project, 'e1');
    expect(issues.some((i) => i.code === 'V-LC-02')).toBe(true);
  });

  it('V-LC-03: errors on missing availableActions reference', () => {
    const project = makeBaseProject();
    project.behaviorModel!.stateMachines[0].states[0].availableActions = ['nonexistent'];
    const issues = validateLifecycle(project, 'e1');
    expect(issues.some((i) => i.code === 'V-LC-03')).toBe(true);
  });

  it('V-LC-15: warns final state with outgoing transition', () => {
    const project = makeBaseProject();
    project.behaviorModel!.stateMachines[0].transitions.push({
      id: 't3', name: '回退', from: 's3', to: 's1', trigger: 'manual',
    });
    const issues = validateLifecycle(project, 'e1');
    expect(issues.some((i) => i.code === 'V-LC-15')).toBe(true);
  });

  it('V-LC-06: errors on timeout pointing to self', () => {
    const project = makeBaseProject();
    project.behaviorModel!.stateMachines[0].states[0].timeout = {
      duration: 24, unit: 'hours', onTimeout: 'auto_transition', targetStateId: 's1',
    };
    const issues = validateLifecycle(project, 'e1');
    expect(issues.some((i) => i.code === 'V-LC-06')).toBe(true);
  });

  it('V-LC-07: errors on unbalanced guardCondition parentheses', () => {
    const project = makeBaseProject();
    project.behaviorModel!.stateMachines[0].transitions[0].guardCondition = 'amount > 0 && (status == ';
    const issues = validateLifecycle(project, 'e1');
    expect(issues.some((i) => i.code === 'V-LC-07')).toBe(true);
  });
});

describe('validateAgentSemanticLayer', () => {
  it('returns empty when no layer configured', () => {
    const project = makeBaseProject();
    const issues = validateAgentSemanticLayer(project);
    expect(issues).toHaveLength(0);
  });

  it('V-AS-01: errors on missing actionId reference', () => {
    const project = makeBaseProject();
    project.agentSemanticLayer = {
      intents: [{
        id: 'i1', name: '创建订单', category: 'crud', triggerPhrases: ['创建订单'],
        actionId: 'nonexistent', targetEntityId: 'e1',
        slotFilling: { slots: [], requiredSlots: [], fillOrder: [], allowBatchFill: true },
        priority: 10, requiresConfirmation: false, examples: [],
      }],
      dialogContextTemplate: { ttl: 300, referencedEntities: [], turnCount: 0, state: 'idle' },
      semanticRelations: [], businessTerms: [], errorRecoveries: [],
      temporalValidities: [], fieldMappings: [], agentPolicies: [],
      metadata: { version: '1.0', lastUpdated: '', totalIntents: 1, totalTerms: 0, totalRelations: 0, coverage: { entitiesWithIntents: 0, totalEntities: 0, actionsWithRecovery: 0, totalActions: 0 } },
    };
    const issues = validateAgentSemanticLayer(project);
    expect(issues.some((i) => i.code === 'V-AS-01')).toBe(true);
  });

  it('V-AS-13: warns on empty triggerPhrases', () => {
    const project = makeBaseProject();
    project.agentSemanticLayer = {
      intents: [{
        id: 'i1', name: '测试意图', category: 'crud', triggerPhrases: [],
        actionId: 'act1', targetEntityId: 'e1',
        slotFilling: { slots: [], requiredSlots: [], fillOrder: [], allowBatchFill: true },
        priority: 10, requiresConfirmation: false, examples: [],
      }],
      dialogContextTemplate: { ttl: 300, referencedEntities: [], turnCount: 0, state: 'idle' },
      semanticRelations: [], businessTerms: [], errorRecoveries: [],
      temporalValidities: [], fieldMappings: [], agentPolicies: [],
      metadata: { version: '1.0', lastUpdated: '', totalIntents: 1, totalTerms: 0, totalRelations: 0, coverage: { entitiesWithIntents: 0, totalEntities: 0, actionsWithRecovery: 0, totalActions: 0 } },
    };
    const issues = validateAgentSemanticLayer(project);
    expect(issues.some((i) => i.code === 'V-AS-13')).toBe(true);
  });

  it('V-AS-05: errors on semantic relation with missing entity', () => {
    const project = makeBaseProject();
    project.agentSemanticLayer = {
      intents: [], dialogContextTemplate: { ttl: 300, referencedEntities: [], turnCount: 0, state: 'idle' },
      semanticRelations: [{
        id: 'r1', type: 'is_a', sourceEntityId: 'e1', targetEntityId: 'nonexistent',
        name: '继承', weight: 1, transitive: false, symmetric: false,
      }],
      businessTerms: [], errorRecoveries: [], temporalValidities: [],
      fieldMappings: [], agentPolicies: [],
      metadata: { version: '1.0', lastUpdated: '', totalIntents: 0, totalTerms: 0, totalRelations: 1, coverage: { entitiesWithIntents: 0, totalEntities: 1, actionsWithRecovery: 0, totalActions: 0 } },
    };
    const issues = validateAgentSemanticLayer(project);
    expect(issues.some((i) => i.code === 'V-AS-05')).toBe(true);
  });

  it('validateAll returns combined issues', () => {
    const project = makeBaseProject();
    project.behaviorModel!.stateMachines[0].transitions = [];
    const issues = validateAll(project);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.code === 'V-LC-01')).toBe(true);
  });
});

// ========== EPC v3.1 Cross-Model Tests ==========

describe('validateEpcCrossModel', () => {
  it('VM-LC-01: warns when entity has no state machine', () => {
    const project = makeBaseProject();
    project.dataModel!.entities.push({
      id: 'e2', name: '客户', nameEn: 'Customer', projectId: '', businessScenarioId: '',
      entityRole: 'aggregate_root', attributes: [], relations: [],
    });
    const issues = validateEpcCrossModel(project);
    expect(issues.some((i) => i.code === 'VM-LC-01')).toBe(true);
  });

  it('VM-AS-02: info when no business terms defined', () => {
    const project = makeBaseProject();
    project.agentSemanticLayer = {
      intents: [], dialogContextTemplate: { ttl: 300, referencedEntities: [], turnCount: 0, state: 'idle' },
      semanticRelations: [], businessTerms: [], errorRecoveries: [],
      temporalValidities: [], fieldMappings: [], agentPolicies: [],
      metadata: { version: '1.0', lastUpdated: '', totalIntents: 0, totalTerms: 0, totalRelations: 0, coverage: { entitiesWithIntents: 0, totalEntities: 1, actionsWithRecovery: 0, totalActions: 0 } },
    };
    const issues = validateEpcCrossModel(project);
    expect(issues.some((i) => i.code === 'VM-AS-02')).toBe(true);
  });

  it('VM-AS-04: warns when no error recovery defined', () => {
    const project = makeBaseProject();
    project.agentSemanticLayer = {
      intents: [], dialogContextTemplate: { ttl: 300, referencedEntities: [], turnCount: 0, state: 'idle' },
      semanticRelations: [], businessTerms: [], errorRecoveries: [],
      temporalValidities: [], fieldMappings: [], agentPolicies: [],
      metadata: { version: '1.0', lastUpdated: '', totalIntents: 0, totalTerms: 0, totalRelations: 0, coverage: { entitiesWithIntents: 0, totalEntities: 1, actionsWithRecovery: 0, totalActions: 0 } },
    };
    const issues = validateEpcCrossModel(project);
    expect(issues.some((i) => i.code === 'VM-AS-04')).toBe(true);
  });

  it('VM-AS-01: warns entity has no intent mapping', () => {
    const project = makeBaseProject();
    project.agentSemanticLayer = {
      intents: [], dialogContextTemplate: { ttl: 300, referencedEntities: [], turnCount: 0, state: 'idle' },
      semanticRelations: [], businessTerms: [], errorRecoveries: [],
      temporalValidities: [], fieldMappings: [], agentPolicies: [],
      metadata: { version: '1.0', lastUpdated: '', totalIntents: 0, totalTerms: 0, totalRelations: 0, coverage: { entitiesWithIntents: 0, totalEntities: 1, actionsWithRecovery: 0, totalActions: 0 } },
    };
    const issues = validateEpcCrossModel(project);
    expect(issues.some((i) => i.code === 'VM-AS-01')).toBe(true);
  });

  it('VE-16: errors on invalid compensationAction ref', () => {
    const project = makeBaseProject();
    project.behaviorModel!.stateMachines[0].transitions[0].compensationAction = 'nonexistent';
    const issues = validateEpcCrossModel(project);
    expect(issues.some((i) => i.code === 'VE-16')).toBe(true);
  });

  it('validateAll includes EPC cross-model issues', () => {
    const project = makeBaseProject();
    project.dataModel!.entities.push({
      id: 'e3', name: '供应商', nameEn: 'Supplier', projectId: '', businessScenarioId: '',
      entityRole: 'aggregate_root', attributes: [], relations: [],
    });
    const issues = validateAll(project);
    expect(issues.some((i) => i.code === 'VM-LC-01')).toBe(true);
  });
});

