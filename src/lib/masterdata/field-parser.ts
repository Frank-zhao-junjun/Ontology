import type { MasterDataField } from '@/types/ontology';

function createValidationError(message: string): Error {
  return new Error(`字段清单不合法：${message}`);
}

export function parseFieldNames(fieldNames: string): MasterDataField[] {
  if (!fieldNames || !fieldNames.trim()) {
    throw createValidationError('字段清单不能为空');
  }

  const rawParts = fieldNames
    .split(/[，,]/)
    .map((part) => part.trim());

  if (rawParts.some((part) => part.length === 0)) {
    throw createValidationError('存在空字段');
  }

  const seen = new Set<string>();

  return rawParts.map((label, order) => {
    if (seen.has(label)) {
      throw createValidationError(`存在重复字段：${label}`);
    }
    seen.add(label);

    return {
      key: label,
      label,
      order,
    };
  });
}

export function tryParseFieldNames(fieldNames: string): MasterDataField[] {
  try {
    return parseFieldNames(fieldNames);
  } catch {
    return [];
  }
}

export function buildRecordValues(fields: MasterDataField[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = '';
    return acc;
  }, {});
}
