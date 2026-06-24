import type { BehaviorModel, StateMachine, Transition } from '@/types/ontology';
import type { ManifestStateMachine } from '@/lib/manifest-validator';
import { toStateCode } from './utils';

function mapTransition(
  transition: Transition,
  stateIdToCode: Map<string, string>
): Record<string, unknown> {
  const resolveEndpoint = (endpoint: string | string[]): string | string[] => {
    if (Array.isArray(endpoint)) {
      return endpoint.map((id) => stateIdToCode.get(id) ?? id);
    }
    return stateIdToCode.get(endpoint) ?? endpoint;
  };

  return {
    id: transition.id,
    name: transition.name,
    from: resolveEndpoint(transition.from),
    to: resolveEndpoint(transition.to),
    trigger: transition.trigger,
    description: transition.description,
  };
}

export function mapStateMachines(behaviorModel: BehaviorModel | null): ManifestStateMachine[] {
  if (!behaviorModel?.stateMachines?.length) {
    return [];
  }

  return behaviorModel.stateMachines.map((sm: StateMachine) => {
    const stateIdToCode = new Map(sm.states.map((s) => [s.id, toStateCode(s)]));

    return {
      id: sm.id,
      name: sm.name,
      objectTypeId: sm.entity,
      statusField: sm.statusField || 'status',
      states: sm.states.map((state) => ({
        name: state.name,
        code: toStateCode(state),
        isInitial: state.isInitial === true,
        isFinal: state.isFinal === true,
      })),
      transitions: sm.transitions.map((t) => mapTransition(t, stateIdToCode)),
    };
  });
}
