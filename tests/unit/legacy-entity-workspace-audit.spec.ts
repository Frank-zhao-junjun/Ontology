import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('legacy entity workspace removal audit', () => {
  const workspacePath = join(process.cwd(), 'src/components/ontology/modeling-workspace.tsx');

  it('should not expose legacy 实体建模 tab or business scenario sidebar', () => {
    const source = readFileSync(workspacePath, 'utf8');
    expect(source).not.toMatch(/实体建模/);
    expect(source).not.toMatch(/BusinessScenarioForm/);
    expect(source).not.toMatch(/selectedScenarioId/);
    expect(source).not.toMatch(/EpcTab/);
    expect(source).toMatch(/businessChain/);
    expect(source).toMatch(/elementLibrary/);
  });
});
