import { describe, expect, it } from 'vitest';
import { ensureStateMachineRules } from '@/lib/validation/behavior-validation';
import type { StateMachine, OntologyProject, State, Transition } from '@/types/ontology';

function createMockProject(): OntologyProject {
  return {
    id: 'project-1',
    name: '测试项目',
    description: '测试',
    domain: { id: 'domain-1', name: '测试领域', nameEn: 'TestDomain', description: '测试' },
    dataModel: {
      id: 'dm-1',
      name: '数据模型',
      version: '1.0.0',
      domain: 'domain-1',
      projects: [],
      businessScenarios: [],
      entities: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    behaviorModel: null,
    ruleModel: null,
    processModel: null,
    eventModel: {
      id: 'em-1',
      name: '事件模型',
      version: '1.0.0',
      domain: 'domain-1',
      events: [
        {
          id: 'event-1',
          name: '已创建',
          entity: 'entity-1',
          entityRole: 'aggregate_root',
          trigger: 'create',
          payload: [{ field: 'id' }],
          transactionPhase: 'AFTER_COMMIT',
        },
      ],
      subscriptions: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    epcModel: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createState(overrides: Partial<State> = {}): State {
  return {
    id: 'state-1',
    name: '状态1',
    isInitial: false,
    isFinal: false,
    description: '',
    ...overrides,
  };
}

function createTransition(overrides: Partial<Transition> = {}): Transition {
  return {
    id: 'transition-1',
    name: '转换1',
    from: 'state-1',
    to: 'state-2',
    trigger: 'manual',
    preConditions: [],
    postActions: [],
    ...overrides,
  };
}

function createStateMachine(overrides: Partial<StateMachine> = {}): StateMachine {
  return {
    id: 'sm-1',
    name: '状态机1',
    entity: 'entity-1',
    statusField: 'status',
    states: [
      createState({ id: 'state-1', isInitial: true }),
      createState({ id: 'state-2' }),
    ],
    transitions: [],
    ...overrides,
  };
}

describe('behavior-validation', () => {
  describe('ensureStateMachineRules', () => {
    it('状态数量超过10个时应抛出错误', () => {
      const states = Array.from({ length: 11 }, (_, i) => createState({ id: `state-${i}` }));
      const sm = createStateMachine({ states });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('每个状态机最多只能定义 10 个状态');
    });

    it('状态编码重复时应抛出错误', () => {
      const states = [
        createState({ id: 'duplicate' }),
        createState({ id: 'duplicate' }),
      ];
      const sm = createStateMachine({ states });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('状态编码不能重复');
    });

    it('多个初始状态时应抛出错误', () => {
      const states = [
        createState({ id: 'state-1', isInitial: true }),
        createState({ id: 'state-2', isInitial: true }),
      ];
      const sm = createStateMachine({ states });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('状态机只能有一个初始状态');
    });

    it('删除被转换引用的状态时应抛出错误', () => {
      const previousSm = createStateMachine({
        transitions: [createTransition({ from: 'state-1', to: 'state-2' })],
      });
      const nextSm = createStateMachine({
        states: [createState({ id: 'state-1', isInitial: true })],
        transitions: [],
      });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(nextSm, project, previousSm)).toThrow(
        '状态已被转换规则引用，不能删除',
      );
    });

    it('转换引用无效状态时应抛出错误', () => {
      const sm = createStateMachine({
        transitions: [createTransition({ from: 'invalid-state', to: 'state-2' })],
      });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('转换必须引用有效的起始状态和目标状态');
    });

    it('自动转换没有条件时应抛出错误', () => {
      const sm = createStateMachine({
        transitions: [
          createTransition({
            from: 'state-1',
            to: 'state-2',
            trigger: 'automatic',
            preConditions: [],
          }),
        ],
      });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('自动或定时转换必须定义触发条件');
    });

    it('定时转换没有条件时应抛出错误', () => {
      const sm = createStateMachine({
        transitions: [
          createTransition({
            from: 'state-1',
            to: 'state-2',
            trigger: 'scheduled',
            preConditions: [],
          }),
        ],
      });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('自动或定时转换必须定义触发条件');
    });

    it('事件触发转换没有配置事件时应抛出错误', () => {
      const sm = createStateMachine({
        transitions: [
          createTransition({
            from: 'state-1',
            to: 'state-2',
            trigger: 'automatic',
            preConditions: ['条件1'],
            triggerConfig: {},
          }),
        ],
      });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('事件触发转换必须配置触发事件');
    });

    it('事件触发转换引用未定义事件时应抛出错误', () => {
      const sm = createStateMachine({
        transitions: [
          createTransition({
            from: 'state-1',
            to: 'state-2',
            trigger: 'automatic',
            preConditions: ['条件1'],
            triggerConfig: { eventId: 'non-existent-event' },
          }),
        ],
      });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('事件触发转换必须引用已定义的领域事件');
    });

    it('定时转换没有cron表达式时应抛出错误', () => {
      const sm = createStateMachine({
        transitions: [
          createTransition({
            from: 'state-1',
            to: 'state-2',
            trigger: 'scheduled',
            preConditions: ['条件1'],
            triggerConfig: {},
          }),
        ],
      });
      const project = createMockProject();
      expect(() => ensureStateMachineRules(sm, project)).toThrow('定时触发转换必须配置 Cron 表达式');
    });

    it('有效的状态机应正常通过校验', () => {
      const sm = createStateMachine({
        transitions: [
          createTransition({
            from: 'state-1',
            to: 'state-2',
            trigger: 'manual',
            preConditions: [],
          }),
        ],
      });
      const project = createMockProject();
      const result = ensureStateMachineRules(sm, project);
      expect(result).toBeDefined();
      expect(result.states.length).toBe(2);
      expect(result.transitions.length).toBe(1);
    });
  });
});
