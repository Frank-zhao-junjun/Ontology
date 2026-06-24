import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const FORBIDDEN_LEGACY_API_SEGMENTS = [
  'agent-semantic-layer',
  'entity-lifecycle',
] as const;

export function findLegacyApiRoutes(apiRoot: string): string[] {
  const hits: string[] = [];

  function walk(dir: string, segments: string[]) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath, [...segments, entry]);
        continue;
      }
      if (entry !== 'route.ts') continue;
      const routePath = segments.join('/');
      for (const forbidden of FORBIDDEN_LEGACY_API_SEGMENTS) {
        if (routePath.includes(forbidden)) {
          hits.push(routePath);
        }
      }
    }
  }

  walk(apiRoot, []);
  return hits;
}

export function assertNoLegacyApiRoutes(apiRoot: string): void {
  const hits = findLegacyApiRoutes(apiRoot);
  if (hits.length > 0) {
    throw new Error(`发现遗留 API 路由: ${hits.join(', ')}`);
  }
}
