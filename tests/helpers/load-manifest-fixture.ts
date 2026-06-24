import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const FIXTURES_DIR = join(__dirname, '../fixtures');

export function loadManifestFixture(filename: string): unknown {
  const raw = readFileSync(join(FIXTURES_DIR, filename), 'utf8');
  return parse(raw);
}
