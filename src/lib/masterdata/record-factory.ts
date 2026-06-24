import type { MasterDataField, MasterDataRecord } from '@/types/ontology';
import { buildRecordValues } from './field-parser';

const generateId = () => Math.random().toString(36).substring(2, 10);

export function createEmptyMasterDataRecord(
  definitionId: string,
  fields: MasterDataField[]
): MasterDataRecord {
  const now = new Date().toISOString();

  return {
    id: generateId(),
    definitionId,
    values: buildRecordValues(fields),
    status: '00',
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeMasterDataRecord(
  record: MasterDataRecord,
  fields: MasterDataField[]
): MasterDataRecord {
  const values = buildRecordValues(fields);

  for (const field of fields) {
    values[field.key] = record.values?.[field.key] ?? '';
  }

  return {
    ...record,
    values,
  };
}
