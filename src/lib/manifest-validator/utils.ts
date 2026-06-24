import type { ManifestValidationIssue } from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function issue(
  partial: Omit<ManifestValidationIssue, 'severity'> & { severity?: ManifestValidationIssue['severity'] }
): ManifestValidationIssue {
  return {
    severity: partial.severity ?? 'error',
    ...partial,
  };
}

/** spec §8 V02：语义化版本 */
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export function isValidSemver(version: string): boolean {
  return SEMVER_PATTERN.test(version.trim());
}

const FORBIDDEN_CREDENTIAL_KEYS = new Set([
  'password',
  'apikey',
  'api_key',
  'token',
  'clientsecret',
  'client_secret',
  'access_token',
  'refresh_token',
  'secret',
]);

const ALLOWED_SECRET_SUFFIX = 'secretref';

export function isForbiddenCredentialKey(key: string): boolean {
  const normalized = key.replace(/[-_]/g, '').toLowerCase();
  if (normalized.endsWith(ALLOWED_SECRET_SUFFIX)) {
    return false;
  }
  return FORBIDDEN_CREDENTIAL_KEYS.has(normalized);
}

/** spec §8 V08：领域事件 nameEn 建议过去式（警告） */
export function isLikelyPastTenseNameEn(nameEn: string): boolean {
  const trimmed = nameEn.trim();
  if (!trimmed) return false;
  if (/Closed$|Completed$|Failed$|Cancelled$|Canceled$/.test(trimmed)) {
    return true;
  }
  return /(?:ed|ted|ied|ened|sed|ged|cted|osed|ved|ded|red|ked|pped|tted|lt)$/i.test(trimmed);
}

export function walkObject(
  value: unknown,
  visit: (key: string, path: string[], parent: Record<string, unknown>) => void,
  path: string[] = []
): void {
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    visit(key, [...path, key], value);
    if (isRecord(child)) {
      walkObject(child, visit, [...path, key]);
    } else if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) {
        const item = child[i];
        if (isRecord(item)) {
          walkObject(item, visit, [...path, key, String(i)]);
        }
      }
    }
  }
}
