import type { BehaviorModel, OntologyProject } from '@/types/ontology';

export function mapSideEffects(project: OntologyProject): Array<{
  id: string;
  type: string;
  description?: string;
  async: boolean;
  actionId?: string;
  retryPolicy?: { maxAttempts: number; backoffMs: number };
  config?: Record<string, unknown>;
}> {
  const collected: Array<{ sideEffect: import('@/types/ontology').SideEffect; actionId: string }> = [];

  const behavior: BehaviorModel | null | undefined = project.behaviorModel;

  // Collect sideEffects from all actions
  if (behavior?.actions?.length) {
    for (const action of behavior.actions) {
      if (action.sideEffects?.length) {
        for (const se of action.sideEffects) {
          collected.push({ sideEffect: se, actionId: action.id ?? '' });
        }
      }
    }
  }

  // Also collect from state machine actions
  if (behavior?.stateMachines?.length) {
    for (const sm of behavior.stateMachines) {
      if (sm.actions?.length) {
        for (const action of sm.actions) {
          if (action.sideEffects?.length) {
            for (const se of action.sideEffects) {
              collected.push({ sideEffect: se, actionId: action.id ?? '' });
            }
          }
        }
      }
    }
  }

  return collected.map(({ sideEffect: se, actionId }) => ({
    id: se.id,
    type: se.type,
    description: se.description,
    async: se.async,
    actionId,
    retryPolicy: se.retryPolicy,
    config: se.config,
  }));
}
