import type { Entity } from '@/types/ontology';
import { isEntityAggregateRoot } from '@/lib/entity-role';

/** 稳定 slug：用于 metadata.id / boundedContext.id */
export function toStableId(value: string): string {
  const trimmed = value.trim();
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return trimmed
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'ontology';
}

/** 状态码：优先英文名/标识符，否则用 state.id */
export function toStateCode(state: { id: string; name: string }): string {
  const ascii = state.name.replace(/\s+/g, '_');
  if (/^[A-Za-z][A-Za-z0-9_]*$/.test(ascii)) {
    return ascii.toUpperCase();
  }
  return state.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || state.id;
}

export function resolveAggregateRootId(
  entityId: string,
  entitiesById: Map<string, Entity>
): string | undefined {
  const entity = entitiesById.get(entityId);
  if (!entity) return undefined;
  if (isEntityAggregateRoot(entity)) {
    return entity.id;
  }
  return entity.parentAggregateId;
}

export function ensurePastTenseNameEn(nameEn: string, fallbackName: string): string {
  const trimmed = nameEn.trim();
  if (trimmed) return trimmed;
  const base = fallbackName.replace(/\s+/g, '');
  return base ? `${base}Occurred` : 'DomainEventOccurred';
}
