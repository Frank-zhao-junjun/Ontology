import type { Metadata } from '@/types/ontology';

const metadataKey = (nameEn: string) => nameEn.trim().toLowerCase();

export function createMetadataTemplateId(nameEn: string) {
  const slug = metadataKey(nameEn).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `meta-${slug || 'metadata'}`;
}

export function mergeMetadataLists(current: Metadata[], incoming: Metadata[]): Metadata[] {
  if (current.length === 0) {
    return incoming;
  }

  const currentByNameEn = new Map(current.map((item) => [metadataKey(item.nameEn), item]));
  const matchedCurrentIds = new Set<string>();

  const mergedIncoming = incoming.map((incomingItem) => {
    const existing = current.find((item) => item.id === incomingItem.id)
      || currentByNameEn.get(metadataKey(incomingItem.nameEn));

    if (!existing) {
      return incomingItem;
    }

    matchedCurrentIds.add(existing.id);

    return {
      ...incomingItem,
      ...existing,
      domain: existing.domain || incomingItem.domain,
      description: existing.description || incomingItem.description,
      valueRange: existing.valueRange || incomingItem.valueRange,
      standard: existing.standard || incomingItem.standard,
      source: existing.source || incomingItem.source,
      createdAt: existing.createdAt || incomingItem.createdAt,
      updatedAt: existing.updatedAt || incomingItem.updatedAt,
    };
  });

  const customMetadata = current.filter((item) => !matchedCurrentIds.has(item.id));
  return [...mergedIncoming, ...customMetadata];
}
