import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import {
  assertNoLegacyApiRoutes,
  findLegacyApiRoutes,
  FORBIDDEN_LEGACY_API_SEGMENTS,
} from '@/lib/legacy-audit';

describe('legacy entrypoints audit (US-S12-U01)', () => {
  const apiRoot = join(process.cwd(), 'src/app/api');

  it('should define forbidden legacy segments', () => {
    expect(FORBIDDEN_LEGACY_API_SEGMENTS).toContain('agent-semantic-layer');
    expect(FORBIDDEN_LEGACY_API_SEGMENTS).toContain('entity-lifecycle');
  });

  it('should not find forbidden legacy API routes', () => {
    expect(findLegacyApiRoutes(apiRoot)).toEqual([]);
    expect(() => assertNoLegacyApiRoutes(apiRoot)).not.toThrow();
  });
});
