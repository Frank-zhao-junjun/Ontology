import type { OntologyManifest } from './types';
import { isRecord } from './utils';

export interface IdOccurrence {
  id: string;
  elementType: string;
  path: string;
}

function pushId(
  occurrences: IdOccurrence[],
  id: unknown,
  elementType: string,
  path: string
): void {
  if (typeof id === 'string' && id.length > 0) {
    occurrences.push({ id, elementType, path });
  }
}

/** spec §8 V11：文档内 id 全局唯一 */
export function collectManifestIds(manifest: OntologyManifest): IdOccurrence[] {
  const occurrences: IdOccurrence[] = [];
  const semantic = manifest.spec?.semantic;
  const behavior = manifest.spec?.behavior;
  const events = manifest.spec?.events;
  const governance = manifest.spec?.governance;

  pushId(occurrences, manifest.metadata?.id, 'metadata', 'metadata.id');

  if (isRecord(semantic?.boundedContext)) {
    pushId(occurrences, semantic.boundedContext.id, 'boundedContext', 'spec.semantic.boundedContext.id');
  }

  for (const scenario of semantic?.businessScenarios ?? []) {
    pushId(occurrences, scenario.id, 'businessScenario', `spec.semantic.businessScenarios.${scenario.id}`);
  }

  for (const vo of semantic?.valueObjects ?? []) {
    pushId(occurrences, vo.id, 'valueObject', `spec.semantic.valueObjects.${vo.id}`);
    for (const prop of (vo as { properties?: Array<{ id?: string }> }).properties ?? []) {
      pushId(occurrences, prop.id, 'valueObjectProperty', `spec.semantic.valueObjects.${vo.id}.properties`);
    }
  }

  for (const ot of semantic?.objectTypes ?? []) {
    pushId(occurrences, ot.id, 'objectType', `spec.semantic.objectTypes.${ot.id}`);
    for (const prop of ot.properties ?? []) {
      pushId(occurrences, prop.id, 'property', `spec.semantic.objectTypes.${ot.id}.properties.${prop.id}`);
    }
    for (const rel of ot.relations ?? []) {
      pushId(occurrences, rel.id, 'relation', `spec.semantic.objectTypes.${ot.id}.relations.${rel.id}`);
    }
  }

  for (const sm of semantic?.stateMachines ?? []) {
    pushId(occurrences, sm.id, 'stateMachine', `spec.semantic.stateMachines.${sm.id}`);
  }

  for (const action of behavior?.actions ?? []) {
    pushId(occurrences, action.id, 'action', `spec.behavior.actions.${action.id}`);
  }

  for (const rule of behavior?.rules ?? []) {
    pushId(occurrences, rule.id, 'rule', `spec.behavior.rules.${rule.id}`);
  }

  for (const metric of behavior?.metrics ?? []) {
    pushId(occurrences, metric.id, 'metric', `spec.behavior.metrics.${metric.id}`);
  }

  for (const tx of behavior?.transactionBoundaries ?? []) {
    pushId(occurrences, tx.id, 'transactionBoundary', `spec.behavior.transactionBoundaries.${tx.id}`);
  }

  for (const evt of events?.domainEvents ?? []) {
    pushId(occurrences, evt.id, 'domainEvent', `spec.events.domainEvents.${evt.id}`);
  }

  for (const route of events?.routes ?? []) {
    pushId(occurrences, route.id, 'route', `spec.events.routes.${route.id}`);
  }

  for (const handler of events?.handlers ?? []) {
    pushId(occurrences, handler.id, 'handler', `spec.events.handlers.${handler.id}`);
  }

  for (const role of governance?.roles ?? []) {
    pushId(occurrences, role.id, 'role', `spec.governance.roles.${role.id}`);
  }

  for (const policy of governance?.agentPolicies ?? []) {
    pushId(occurrences, policy.id, 'agentPolicy', `spec.governance.agentPolicies.${policy.id}`);
  }

  for (const ds of manifest.spec?.dataSources ?? []) {
    pushId(occurrences, ds.id, 'dataSource', `spec.dataSources.${ds.id}`);
  }

  return occurrences;
}
