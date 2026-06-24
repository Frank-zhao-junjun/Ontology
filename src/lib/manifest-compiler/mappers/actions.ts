import type { Action, OntologyProject } from '@/types/ontology';
import type { ManifestAction } from '@/lib/manifest-validator';
import { resolveAggregateRootId } from './utils';
import { toStableId } from './utils';

function mapAction(
  action: Action,
  entitiesById: Map<string, import('@/types/ontology').Entity>
): ManifestAction | null {
  const targetId = action.targetEntityId;
  if (!targetId) return null;

  const aggregateRootId = resolveAggregateRootId(targetId, entitiesById);
  if (!aggregateRootId) return null;

  const id =
    action.id ??
    `action-${toStableId(action.nameEn ?? action.name ?? action.actionType ?? 'custom')}`;

  const manifestAction: ManifestAction = {
    id,
    name: action.name,
    nameEn: action.nameEn ?? action.name,
    aggregateRootId,
  };

  if (action.ruleRefs?.length) {
    manifestAction.preRuleIds = [...action.ruleRefs];
  }

  const extra = action as Action & { publishesEventIds?: string[] };
  if (extra.publishesEventIds?.length) {
    manifestAction.publishesEventIds = [...extra.publishesEventIds];
  }

  return manifestAction;
}

export function mapActions(project: OntologyProject): ManifestAction[] {
  const entities = project.dataModel?.entities ?? [];
  const entitiesById = new Map(entities.map((e) => [e.id, e]));
  const behavior = project.behaviorModel;
  if (!behavior) return [];

  const collected: Action[] = [...(behavior.actions ?? [])];

  for (const sm of behavior.stateMachines ?? []) {
    if (sm.actions?.length) {
      collected.push(...sm.actions);
    }
  }

  const seen = new Set<string>();
  const result: ManifestAction[] = [];

  for (const action of collected) {
    const mapped = mapAction(action, entitiesById);
    if (!mapped || seen.has(mapped.id)) continue;
    seen.add(mapped.id);
    result.push(mapped);
  }

  return result;
}
