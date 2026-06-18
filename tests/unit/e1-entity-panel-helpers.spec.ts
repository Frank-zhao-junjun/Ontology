import { describe, expect, it } from 'vitest';
import { resolveDefaultBusinessScenarioId } from '@/lib/e1-entity';

describe('E1 entity panel helpers', () => {
  it('should prefer simplified chain scenario over legacy', () => {
    expect(
      resolveDefaultBusinessScenarioId(
        [{ id: 'c-new' }],
        [{ id: 'legacy-1' }],
      ),
    ).toBe('c-new');
  });

  it('should fall back to legacy or global id', () => {
    expect(resolveDefaultBusinessScenarioId(undefined, [{ id: 'legacy-1' }])).toBe('legacy-1');
    expect(resolveDefaultBusinessScenarioId([], [])).toBe('e1-global');
  });
});
